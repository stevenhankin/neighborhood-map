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

    defaultMap : {
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
        draggable: false
    },

    init: function() {
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

    createMarkers: function () {
        /**
         * Populate the Google Map Markers
         * using the Places list in the Model
         */
        var self = this;
        model.places.forEach(function (place) {
            var marker = new google.maps.Marker({
                position: place.coord,
                map: self.map,
                animation: google.maps.Animation.DROP,

            });
            marker.addListener('click', function () {
                /**
                 * Check if this marker was the last one we hovered over
                 * If so, don't reanimate it, because that's distracting
                 */
                if (model.lastClicked !== place.id) {
                    model.lastClicked = place.id;
                    self.infowindow.setContent(place.name);
                    self.infowindow.open(self.map, marker);
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
        this.map = new google.maps.Map(document.getElementById('map'), model.defaultMap);
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
         * Map is ready so let's create all the markers..
         */
        this.createMarkers();
    }
};


var placeListViewModel = {

    placesSearch: ko.observable(),
    placesList: ko.observableArray([]),

    filterPlaces: function () {

        window.alert(this.placesSearch())
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

