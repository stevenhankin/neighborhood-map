var model = {

    Place: function (name, type, coord) {
        /**
         * Represents a place of interest
         *
         * name - Displayable name of place (appears in Places List)
         * type - TODO
         * coord - Latitude and Longitude position of place
         */
        this.name = name;
        this.type = type;
        this.coord = coord;
    },

    mapConfig: {
        zoom: 11,
        center: {/* This is my neighborhood */ lat: 51.1414, lng: 0.5894},
        /**
         * I disable all the usual controls
         * to make the UI experience cleaner
         */
        disableDefaultUI: true,
        navigationControl: false,
        mapTypeControl: false,
        scaleControl: false,
        draggable: false,
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
        this.places = [new this.Place("My home", 'Home', {lat: 51.138725, lng: 0.591060}),
            new this.Place("Sissinghurst Castle", 'Castle', {lat: 51.115282, lng: 0.582349}),
            new this.Place("Scotney Castle", 'Castle', {lat: 51.092852, lng: 0.408211}),
            new this.Place("Leeds Castle", 'Castle', {lat: 51.248918, lng: 0.630465}),
            new this.Place("Chapel Down Winery", 'Winery', {lat: 51.040965, lng: 0.699023}),
            new this.Place("The West House", 'Eatery', {lat: 51.115184, lng: 0.642370})]
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
     * Google Maps are setup via a callback
     * Keep everything google-related in a separate
     * view model to prevent it from breaking other VMs
     */
    bounceMarkerOnce: function (marker) {
        /*
         * Do one bounce then make the marker stationary again
         * This is to get the user's attention, but not annoy or distract
         */
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            marker.setAnimation(null);
        }, 700)
    },

    createMarkers: function (places) {
        /**
         * Create Google Map Markers for supplied places
         */
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
         * For each of the supplied places
         * (either default or filtered)
         * loop and create a marker with
         * a click listener
         */
        places.forEach(function (place) {
            var marker = new google.maps.Marker({
                position: place.coord,
                map: self.map,
                animation: google.maps.Animation.DROP,
                title: place.name
            });
            marker.addListener('click', function () {
                /**
                 * Check if this marker was the last one we hovered over
                 * If so, don't reanimate it, because that's distracting
                 */
                if (model.lastClicked !== place.id) {

                    // self.infowindow.close();

                    self.infowindow.open(self.map, marker);
                    self.infowindow.setContent('Retrieving data..');

                    model.lastClicked = place.id;

                    console.dir(place);
                    var flickrUrl = "https://api.flickr.com/services/rest/";
                    var jqxhr = $.ajax(
                        flickrUrl,
                        {
                            data: {
                                method: 'flickr.photos.search',
                                api_key: '0c4a27aacfa7626d6870ebd4901b25f5',
                                format: 'rest',
                                name: place.name,
                                lat: place.coord.lat,
                                lon: place.coord.lng,
                                radius: 1,
                                has_geo: 1
                            }
                        })
                        .done(function (xml) {
                            var photo = $(xml).find("photo");
                            var i=0;
                            var carousel="<div id=\"carousel-example-generic\" class=\"carousel slide\" data-ride=\"carousel\">";
                            carousel+="<div class=\"carousel-inner\" role=\"listbox\">"

                            while (i<5) {


                                var farm = photo.attr('farm');
                                var server = photo.attr('server');
                                var id = photo.attr('id');
                                var secret = photo.attr('secret');
                                var url="https://farm"
                                    +farm+".staticflickr.com/"
                                    +server+"/"
                                    +id+"_"+secret+".jpg";

                                carousel+="<div class=\"item "+(i===0?"active":"")+" \"><img  class=\"info-picture\" height=\"200px\" src="+url+" ></div>";

                                photo = photo.next();
                                console.log(photo.attr('id'));
                                i++;
                            }
                            carousel += "</div><a class=\"left carousel-control\" href=\"#carousel-example-generic\" role=\"button\" data-slide=\"prev\">\n" +
                                "    <span class=\"glyphicon glyphicon-chevron-left\" aria-hidden=\"true\"></span>\n" +
                                "    <span class=\"sr-only\">Previous</span>\n" +
                                "  </a>\n" +
                                "  <a class=\"right carousel-control\" href=\"#carousel-example-generic\" role=\"button\" data-slide=\"next\">\n" +
                                "    <span class=\"glyphicon glyphicon-chevron-right\" aria-hidden=\"true\"></span>\n" +
                                "    <span class=\"sr-only\">Next</span>\n" +
                                "  </a></div>";
                            console.log(carousel);
                            // var content = '<div class="info-place-name">'+place.name +'</div><img class="info-picture" src="'+url+'" width="200px">';
                            var content = '<div id="info-window"><div class="info-place-name">'+place.name +'</div>'+carousel+"</div>";
                            self.infowindow.setContent(content);
                            self.infowindow.open(self.map, marker);
                        })
                        .fail(function () {
                            self.infowindow.setContent('<div class="info-place-name">'+place.name +'</div>(Sorry, we are unable to retrieve pictures at the moment)');
                            self.infowindow.open(self.map, marker);
                        })
                        .always(function () {
                            // alert("complete");
                        });

                    self.bounceMarkerOnce(marker);
                }
            });
            self.markerList.push(marker);
        });
    },

    selectMarker: function (id) {
        /**
         * Called from the Places View Model, when a place is clicked
         * so that the respective marker is activated
         */
        google.maps.event.trigger(this.markerList[id], 'click');
    },

    initMap: function () {
        /**
         * Called from index.html once both jQuery and the Google API
         * map library is ready and is setup in the global scope
         */
        this.map = new google.maps.Map(document.getElementById('map'), model.mapConfig);
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

    populatePlacesList: function () {
        /**
         * Populate the Observable Array of Places
         * using the default list in the Model
         */
        var self = this;
        model.places.forEach(function (place, index) {
            place.id = index;
            self.placesList.push(place);
        });
    },

    listItemClick: function (elem) {
        /**
         * Selecting an item on the Place List View Model
         * requires a callout to the Map View Model
         * to select and animate the respective marker
         */
        gmapViewModel.selectMarker(elem.id);
    },

    init: function () {
        model.init();
        this.populatePlacesList();
    }
};


/**
 * When document is ready, apply bindings to the Places View Model and initialise the model
 * No Knockout bindings to apply to Map View Model, since Google Map has built-in handling
 */
$(
    function () {
        ko.applyBindings(placeListViewModel);
        placeListViewModel.init();
    }()
);

/*
// flickr
// 0c4a27aacfa7626d6870ebd4901b25f5
// https://api.flickr.com/services/rest/?method=flickr.test.echo&name=value

https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&api_key=0c4a27aacfa7626d6870ebd4901b25f5&format=rest&name=Leeds+Castle

// &auth_token=72157687008179002-cf819885a41dd5d3&api_sig=2ce67b7e864ede2a266ea886f7f523a3
// https://api.flickr.com/services/rest/?method=flickr.test.echo&name=value


    <photo id="24343289548" owner="42088754@N03" secret="a29473209a" server="4455" farm="5" title="IMG_8485.jpg" ispublic="1" isfriend="0" isfamily="0"/>

    https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg
https://farm5.staticflickr.com/4455/24343289548_a29473209a.jpg


    https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&api_key=0c4a27aacfa7626d6870ebd4901b25f5&format=rest&name=Leeds+Castle&lat=51.248918&lon=0.630465&has_geo=1

    https://api.twitter.com/1.1/search/tweets.json?q=Leeds+Castle+Kent&result_type=recent&count=4

{lat: 51.248918, lng: 0.630465}),


foursquare
ENDPOINT: venues/X/tips
PARAMETERS: venueId = 4ef0e7cf7beb5932d5bdeb4e; sort = recent

*/

//
// https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=0c4a27aacfa7626d6870ebd4901b25f5&format=rest&name=Leeds+Castle&lat=51.248918&lon=0.630465&radius=1&has_geo=1
//
//
//     <photo id="36578225314" owner="29235510@N03" secret="258f6af66b" server="4405" farm="5" title="DSC_8593" ispublic="1" isfriend="0" isfamily="0"/>
//
//     https://farm5.staticflickr.com/4405/36578225314_258f6af66b.jpg

// $(document).ready(function(){
//
//     $.ajax({
//         type: "GET",
//         url: "http://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=Jimi_Hendrix&callback=?",
//         contentType: "application/json; charset=utf-8",
//         async: false,
//         dataType: "json",
//         success: function (data, textStatus, jqXHR) {
//
//             var markup = data.parse.text["*"];
//             var blurb = $('<div></div>').html(markup);
//
//             // remove links as they will not work
//             blurb.find('a').each(function() { $(this).replaceWith($(this).html()); });
//
//             // remove any references
//             blurb.find('sup').remove();
//
//             // remove cite error
//             blurb.find('.mw-ext-cite-error').remove();
//             $('#article').html($(blurb).find('p'));
//
//         },
//         error: function (errorMessage) {
//         }
//     });
// });
