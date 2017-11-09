var model = {

    /**
     * Class for a place of interest
     * @param name Displayable name of place (appears in Places List)
     * @param type Determines the marker icon for map
     * @param coord Latitude and Longitude position of place
     * @constructor
     */
    place: function (name, type, coord) {
        this.name = name;
        this.type = type;
        this.coord = coord;
    },

    /**
     * Array of Places used for both the Search and the Map Markers
     * Will be populated from json data
     */
    places: [],

    /**
     * This is my neighborhood location
     */
    neighborhoodGeo: {lat: 51.1414, lng: 0.5894},

    /**
     * Photo limit is to reduce load on Flickr API
     * and keep the number of photos on Carousel
     * to a reasonable number
     */
    carouselPhotoLimit: 10,

    /**
     * Default map configuration
     * to center over neighborhood
     * and stylize appropriately
     */
    mapConfig: {
        disableDefaultUI: true,
        navigationControl: false,
        mapTypeControl: false,
        zoom: 11,
        styles: [
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{color: '#8888ff'}]
            },
            {
                featureType: 'landscape',
                stylers: [{visibility: 'off'}]
            },
            {
                featureType: 'poi',
                stylers: [{visibility: 'off'}]
            }]
    },


    /**
     * Utility to add a place element into the places list
     * @param aPlace - One place element from JSON data file
     */
    addPlace: function (aPlace) {
        this.places.push(new this.place(aPlace.name, aPlace.type, aPlace.coord));
    },


    /**
     * Load place data from JSON file asynchronously as a returned Promise
     * @returns {Promise} - Promise for reading JSON file of places into Model
     */
    loadPlaces: function () {
        return new Promise(function (resolve, reject) {
            $.getJSON('places.json').done(function (response) {
                response.forEach(function (place) {
                    model.addPlace(place);
                });
                resolve();
            }).fail(function () {
                var mapElem = $('.container');
                mapElem.html('<h4>Oops, failed to load the Places data.  Please try again later.</h4>');
                reject();
            });
        });
    }
};


var gmapViewModel = {

    /**
     * Animate marker with 2 bounces
     * This is to get the user's attention, but not annoy or distract
     *
     * @param marker - to animate
     */
    bounceMarkerOnce: function (marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            marker.setAnimation(null);
        }, 1400);
    },


    /**
     * Bespoke Marker icons
     */
    icons: {
        home: {
            icon: 'static/home-icon.png'
        },
        castle: {
            icon: 'static/castle-icon.png'
        },
        eatery: {
            icon: 'static/restaurant-icon.png'
        }
    },


    /**
     * Generate HTML representing a selection of photos returned from Flickr API
     *
     * @param photo - First photo element from Flickr query
     * @returns {string} - HTML Text representing the Bootstrap Photo Carousel
     *                     or apology if no photos available
     */
    createPhotoCarousel: function (photo) {

        if (photo.length === 0) {
            return '<p>This place currently has no photos on Flickr.  Maybe you\'d like to upload some?</p>';
        }

        var i = 0;
        var carousel = '<div id="carousel-example-generic" class="carousel slide" data-ride="carousel">' +
            '<div class="carousel-inner" role="listbox">';
        while (i < model.carouselPhotoLimit && i < photo.length) {
            var farm = photo.attr('farm');
            var server = photo.attr('server');
            var id = photo.attr('id');
            var secret = photo.attr('secret');
            var url = "https://farm" +
                farm + ".staticflickr.com/" +
                server + "/" +
                id + "_" + secret + ".jpg";

            carousel += '<div class="item ' + (i === 0 ? 'active' : '') + ' ">' +
                '<img  class="info-picture" height="200px" src=' + url + ' ></div>';
            photo = photo.next();
            i++;
        }
        carousel += '</div><a class="left carousel-control" href="#carousel-example-generic" role="button"' +
            ' data-slide="prev">\n' +
            '    <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>\n' +
            '    <span class="sr-only">Previous</span>\n' +
            '  </a>\n' +
            '  <a class="right carousel-control" href="#carousel-example-generic" role="button" data-slide="next">\n' +
            '    <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>\n' +
            '    <span class="sr-only">Next</span>\n' +
            '  </a></div>';
        return carousel;
    },


    /**
     * Create an InfoWindow for the specified Marker
     * (with supplied place details)
     * @param marker - Marker for infowindow
     * @param place - place referenced by marker
     */
    createInfoWindow: function (marker, place) {

        var self = this;
        self.infowindow.open(self.map, marker);
        /*
        Initial message to user whilst an Ajax attempt
        is made to retrieve a list of images for the place
         */
        self.infowindow.setContent('Retrieving data..');
        /*
        Pan to marker (smoother transition than setCenter), because the infowindow
        might have large photos that we don't want overspilling top of window
         */
        self.map.panTo(marker.getPosition());
        model.lastClicked = place.id;

        var flickrUrl = "https://api.flickr.com/services/rest/";
        $.ajax(
            flickrUrl,
            {
                data: {
                    method: 'flickr.photos.search',
                    api_key: '0c4a27aacfa7626d6870ebd4901b25f5',
                    format: 'rest',
                    text: place.name,
                    lat: place.coord.lat,
                    lon: place.coord.lng,
                    radius: 0.1,
                    has_geo: 1,
                    per_page: model.carouselPhotoLimit
                },
                timeout: 2000 /* 2 seconds to retrieve or give up - don't want to keep user waiting! */
            })
            .done(function (xml) {
                /*
                Locate the first photo.  Will iterate through
                several to generate a carousel of pictures
                if possible
                 */
                var photo = $(xml).find("photo");
                var carousel = self.createPhotoCarousel(photo);
                var content = '<div id="info-window"><div class="info-place-name">' + place.name + '</div>' +
                    carousel + "</div>";
                self.infowindow.setContent(content);
            })
            .fail(function () {
                self.infowindow.setContent('<div class="info-place-name">' + place.name +
                    '</div>(Sorry, we are unable to retrieve pictures at the moment)');
            });
        self.bounceMarkerOnce(marker);
    },


    /**
     * Create a marker for the specified place
     * with the appropriate icon and call the
     * infowindow setup
     * @param place - Used for extending bounds of map
     */
    addMarker: function (place) {
        var self = this;
        var marker = new google.maps.Marker({
            position: place.coord,
            map: self.map,
            animation: google.maps.Animation.DROP,
            title: place.name,
            icon: self.icons[place.type].icon
        });
        marker.addListener('click', function () {
            /**
             * Check if this marker was the last one we hovered over
             * If so, don't reanimate it, because that's distracting
             */
            if (model.lastClicked !== place.id) {
                self.createInfoWindow(marker, place);
            } else {
                /**
                 * User has re-clicked the SAME marker...
                 * Close the info window (since this is probably what they want to do)
                 */
                self.infowindow.close();
                model.lastClicked = undefined;
            }
        });
        return marker;
    },


    /**
     * For each Place, a marker is added and
     * stored within the place object
     * @param places
     */
    createMarkers: function (places) {
        var self = this;
        places.forEach(function (place) {
            place.marker = self.addMarker(place);
        });
        this.setBoundsToMarkers(places);
    },


    /**
     * Called from the Places View Model, when a place is clicked
     * so that the respective marker is activated
     * @param place - Place that was clicked in list (marker contained within)
     */
    selectMarker: function (place) {
        google.maps.event.trigger(place.marker, 'click');
    },


    /**
     * Error handler in case Google Map API fails to load
     */
    failedToLoadApi: function () {
        var mapElem = $('.container');
        mapElem.html('<h4>Oops, the Google Map API could not be loaded.  Please try again later.</h4>');
    },


    /**
     * For the supplied list of places, set the
     * map boundary to fit them correctly
     * @param places
     */
    setBoundsToMarkers: function (places) {
        var self = this;
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function (place) {
            bounds.extend(place.coord);
        });
        this.map.fitBounds(bounds);
        /**
         * Make map display responsively by using a window resize event and call
         * fitBounds method to make sure map markers always fit on screen as
         * user resizes their browser window
         */
        google.maps.event.addDomListener(window, 'resize', function () {
            self.map.fitBounds(bounds);
        });
    },


    /**
     * Called from index.html once both jQuery and the Google API
     * map library is ready and is setup in the global scope
     */
    initMap: function () {

        /**
         * When map is ready, apply bindings to the Places View Model and initialise the model
         * No Knockout bindings to apply to Map View Model, since Google Map has built-in handling
         */
        ko.applyBindings(placeListViewModel);

        var self = this;

        /**
         * The Places are stored in a JSON data file, which will be loaded async,
         * therefore we need to use a Promise to ensure that we execute the
         * remaining code once the Place data is hydrated in the (near) future
         */
        model.loadPlaces().then(
            function () {

                placeListViewModel.init();

                self.map = new google.maps.Map(document.getElementById('map'), model.mapConfig);
                self.map.setCenter(model.neighborhoodGeo);

                /**
                 * Comment take from Google API Documentation:
                 * Best practices: For the best user experience, only one info window should be open on the map at any
                 * one time. Multiple info windows make the map appear cluttered. If you only need one info window at a time,
                 * you can create just one InfoWindow object and open it at different locations or markers upon map events,
                 * such as user clicks. If you do need more than one info window, you can display multiple InfoWindow objects
                 * at the same time
                 */
                self.infowindow = new google.maps.InfoWindow({});
                /**
                 * Once closed, the map should re-center to the original location
                 */
                self.infowindow.addListener('closeclick', function () {
                    self.map.setCenter(model.neighborhoodGeo);
                });
                /**
                 * Once an infowindow is closed, we need to reset lastClick,
                 * otherwise if we try to click the same marker again the
                 * infowindow won't open
                 */
                google.maps.event.addListener(self.infowindow, 'closeclick', function () {
                    model.lastClicked = undefined;
                });
                /**
                 * Map is ready so let's create ALL the markers by default..
                 */
                self.createMarkers(model.places);
            });
    }
};


var placeListViewModel = {

    placesSearch: ko.observable(),

    visiblePlaceList: ko.observableArray([]),

    showSidebar: ko.observable(true),

    /**
     * Flip the truthy value of sidebar toggle
     * 2-way databinding will ensure sidebar is hidden/shown
     * and map resized as required
     */
    toggleSidebar: function () {
        this.showSidebar(!this.showSidebar());
    },


    /**
     * User has clicked filter button
     * Filter the available places and
     * create a new list and set of markers
     */
    filterPlaces: function () {
        var searchText = this.placesSearch();
        var searchRE = new RegExp(searchText, 'i');
        var filteredPlaceList = model.places.filter(function (place) {
            if (place.name.search(searchRE) >= 0) {
                place.marker.setVisible(true);
                return true;
            }
            place.marker.setVisible(false);
            return false;
        });
        var newPlacesList = [];
        filteredPlaceList.forEach(function (place, index) {
                place.id = index;
                newPlacesList.push(place);
            }
        );
        this.visiblePlaceList(newPlacesList);
    },


    /**
     * Populate the Observable Array of Places
     * using the default list in the Model
     */
    populatePlacesList: function () {
        var self = this;
        model.places.sort(function comp(a, b) {
            if (a.name < b.name) {
                return -1;
            } else if (a.name > b.name) {
                return 1;
            }
            return 0;
        }).forEach(function (place, index) {
            place.id = index;
            self.visiblePlaceList.push(place);
        });
    },


    /**
     * Selecting an item on the place List View Model
     * requires a callout to the Map View Model
     * to select and animate the respective marker
     * @param elem - Place DOM element that was clicked
     */
    listItemClick: function (elem) {
        gmapViewModel.selectMarker(placeListViewModel.visiblePlaceList()[elem.id]);
    },


    /**
     * Called when the Map Model View is ready to initialise
     */
    init: function () {

        var self = this;
        this.populatePlacesList();
        /**
         * Subscribe to search box changes
         * to automatically update the
         * markers and map bounds
         */
        this.placesSearch.subscribe(function () {
            self.filterPlaces();
        });

        /**
         * Subscribe to place list change
         * so that map bounds can be recalculated
         */
        this.visiblePlaceList.subscribe(function () {
            gmapViewModel.setBoundsToMarkers(self.visiblePlaceList());
        });

    }
};
