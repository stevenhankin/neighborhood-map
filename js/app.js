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
     * This is my neighborhood location
     */
    neighborhoodGeo: {lat: 51.1414, lng: 0.5894},

    /**
     * Photo limit is to reduce load on Flickr API
     * and keep the number of photos on Carousel
     * to a reasonable number
     */
    carousel_photo_limit: 10,

    /**
     * Default map configuration
     * to center over neighborhood
     * and stylize appropriately
     */
    mapConfig: {
        disableDefaultUI: true,
        navigationControl: false,
        mapTypeControl: false,
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

    init: function () {
        /**
         * Array of Places used for both the Search and the Map Markers
         */
        this.places = [
            new this.place("Well House", 'home', {lat: 51.138725, lng: 0.591060}),
            new this.place("Sissinghurst Castle", 'castle', {lat: 51.115282, lng: 0.582349}),
            new this.place("Scotney Castle", 'castle', {lat: 51.092852, lng: 0.408211}),
            new this.place("Leeds Castle", 'castle', {lat: 51.248918, lng: 0.630465}),
            new this.place("Chapel Down Winery", 'eatery', {lat: 51.040965, lng: 0.699023}),
            new this.place("The West House", 'eatery', {lat: 51.115184, lng: 0.642370}),
            new this.place("Frasers", 'eatery', {lat: 51.186404, lng: 0.695287}),
            new this.place("The Windmill", 'eatery', {lat: 51.261533, lng: 0.626266}),
            new this.place("Apicius", 'eatery', {lat: 51.095989, lng: 0.536717}),
            new this.place("The Poet", 'eatery', {lat: 51.154057, lng: 0.373423}),
            new this.place("Smarden Bell", 'eatery', {lat: 51.155260, lng: 0.672364}),
            new this.place("Knoxbridge Inn", 'eatery', {lat: 51.136965, lng: 0.555603}),
            new this.place("Bodiam Castle", 'castle', {lat: 51.002210, lng: 0.543565}),
            new this.place("Star & Eagle Hotel", 'eatery', {lat: 51.113434, lng: 0.460524}),
            new this.place("The Bull", 'eatery', {lat: 51.066421, lng: 0.581696}),
            new this.place("White Lion", 'eatery', {lat: 51.067804, lng: 0.686681}),
            new this.place("Tickled Trout", 'eatery', {lat: 51.246928, lng: 0.453419})
        ];
    }
};


var gmapViewModel = {

    /**
     * As per project rubric, we're not going to track markers as Observables
     * Instead, we have a vanilla array so that we can locate a marker as
     * required (the index will be the same as the Places index, for simplicity)
     */
    markerList: [],


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
        while (i < model.carousel_photo_limit && i < photo.length) {
            var farm = photo.attr('farm');
            var server = photo.attr('server');
            var id = photo.attr('id');
            var secret = photo.attr('secret');
            var url = "https://farm"                +
                farm + ".staticflickr.com/" +
                server + "/"+
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
        Re-center map to marker, because the infowindow might have
        large photos that we don't want overspilling top of window
         */
        self.map.setCenter(marker.getPosition());
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
                    per_page: model.carousel_photo_limit
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
        self.markerList.push(marker);
        return marker;
    },


    /**
     * Create Google Map Markers for supplied places
     * @param places - List of places (possibly filtered)
     */
    createMarkers: function (places) {
        var self = this;
        /**
         *  Remove the existing markers and
         *  reset the last marker click tracker
         */
        self.markerList.forEach(function (marker) {
            marker.setMap(null);
        });
        self.markerList = [];
        model.lastClicked = undefined;
        /**
         * Set map bounds based on the markers
         * that are in the list
         */
        if (places.length > 0) {
            var bounds = new google.maps.LatLngBounds();
            places.forEach(function (place) {
                bounds.extend(place.coord);
            });
            self.map.fitBounds(bounds);
        }
        /**
         * For each of the supplied places
         * (either default or filtered)
         * loop and create a marker with
         * a click listener
         */
        places.forEach(function (place, i) {
            setTimeout(function () {
                self.addMarker(place);
            }, i * 75);
        });
    },


    /**
     * Called from the Places View Model, when a place is clicked
     * so that the respective marker is activated
     * @param id - Array index for marker
     */
    selectMarker: function (id) {
        google.maps.event.trigger(this.markerList[id], 'click');
    },


    /**
     * Error handler in case Google Map API fails to load
     */
    failedToLoadApi: function() {
        mapElem = $('.container');
        mapElem.html('<h3>Oops, the Google Map API could not be loaded.  Please try again later.</h3>')
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
        placeListViewModel.init();

        this.map = new google.maps.Map(document.getElementById('map'), model.mapConfig);
        this.map.setCenter(model.neighborhoodGeo);
        /**
         * Comment take from Google API Documentation:
         * Best practices: For the best user experience, only one info window should be open on the map at any
         * one time. Multiple info windows make the map appear cluttered. If you only need one info window at a time,
         * you can create just one InfoWindow object and open it at different locations or markers upon map events,
         * such as user clicks. If you do need more than one info window, you can display multiple InfoWindow objects
         * at the same time
         */
        this.infowindow = new google.maps.InfoWindow({});
        /**
         * Once closed, the map should re-center to the original location
         */
        var self = this;
        this.infowindow.addListener('closeclick', function () {
            // self.map.setCenter({/* This is my neighborhood */ lat: 51.1414, lng: 0.5894});
            self.map.setCenter(model.neighborhoodGeo);

        });
        /**
         * Once an infowindow is closed, we need to reset lastClick,
         * otherwise if we try to click the same marker again the
         * infowindow won't open
         */
        google.maps.event.addListener(this.infowindow, 'closeclick', function () {
            model.lastClicked = undefined;
        });
        /**
         * Map is ready so let's create ALL the markers by default..
         */
        this.createMarkers(model.places);

    }
};


var placeListViewModel = {


    placesSearch: ko.observable(),

    placesList: ko.observableArray([]),

    showSidebar: ko.observable(true),


    /**
     * Flip the truthy value of sidebar toggle
     * 2-way databinding will ensure sidebar is hidden/shown
     * and map resized as required
     */
    toggleSidebar: function () {
        this.showSidebar (this.showSidebar()?false:true)
    },


    filterPlaces: function () {
        /**
         * User has clicked filter button
         * Filter the available places and
         * create a new list and set of markers
         */
        var searchText = this.placesSearch();
        var searchRE = new RegExp(searchText, 'i');
        var filteredPlaceList = model.places.filter(function (place) {
            return place.name.search(searchRE) >= 0;
        });
        var newPlacesList = [];
        filteredPlaceList.forEach(function (place, index) {
                place.id = index;
                newPlacesList.push(place);
            }
        );
        this.placesList(newPlacesList);
        gmapViewModel.createMarkers(newPlacesList);
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
            self.placesList.push(place);
        });
    },


    /**
     * Selecting an item on the place List View Model
     * requires a callout to the Map View Model
     * to select and animate the respective marker
     * @param elem - Place DOM element that was clicked
     */
    listItemClick: function (elem) {
        gmapViewModel.selectMarker(elem.id);
    },


    /**
     * Called when the Map Model View is ready to initialise
     */
    init: function () {
        model.init();
        this.populatePlacesList();
        var self = this;
        /**
         * Subscribe to search box changes
         * to automatically update the
         * markers and map bounds
         */
        this.placesSearch.subscribe(function () {
            self.filterPlaces();
        });
    }
};
