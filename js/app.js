$(
    function () {

        var model = {
            init: function () {
                this.map = {};
                this.locationNames = [];
                this.markers = [];
                // Latitude and longitude of my current home village!
                this.uluru = {lat: 51.1414, lng: 0.5894};
                this.defaultMap = {
                    zoom: 11,
                    center: model.uluru,
                    // disableDefaultUI: true,
                    navigationControl: false,
                    mapTypeControl: false,
                    scaleControl: false,
                    draggable: false
                };
                this.lastClicker = 0;
                this.markers = [
                    {id: 1, name: "My home", uluru: {lat: 51.138725, lng: 0.591060}},
                    {id: 2, name: "Stoneacre", uluru: {lat: 51.252185, lng: 0.577710}},
                    {id: 3, name: "Sissinghurst Castle", type: 'Castle', uluru: {lat: 51.115282, lng: 0.582349}},
                    {id: 4, name: "Scotney Castle", type: 'Castle', uluru: {lat: 51.092852, lng: 0.408211}},
                    {id: 5, name: "Leeds Castle", type: 'Castle', uluru: {lat: 51.248918, lng: 0.630465}},
                    {id: 6, name: "Chapel Down Winery", type: 'Winery', uluru: {lat: 51.040965, lng: 0.699023}},
                    {id: 7, name: "The West House", type: 'Eatery', uluru: {lat: 51.115184, lng: 0.642370}}
                ]
            }
        };

        // Class to represent a place of interest
        function Place(id, name, type,  uluru) {
            this.id = id;
            this.type = type;
            this.name = name;
            this.uluru = uluru;
        }

        var viewModel = {

            placesSearch: ko.observable('meow'),

            placesList: ko.observableArray([new Place(1, "My home", 'Home', {lat: 51.138725, lng: 0.591060}),
                new Place(2, "Sissinghurst Castle", 'Castle', {lat: 51.115282, lng: 0.582349}),
                new Place(3, "Scotney Castle", 'Castle', {lat: 51.092852, lng: 0.408211}),
                new Place(4,  "Leeds Castle",  'Castle', {lat: 51.248918, lng: 0.630465}),
                new Place(5, "Chapel Down Winery",  'Winery',  {lat: 51.040965, lng: 0.699023}),
                new Place(6, "The West House",  'Eatery',  {lat: 51.115184, lng: 0.642370})]),

            setupAutocomplete: function (map) {
                // Once we have a map, we can bind the Autocomplete search
                var input = document.getElementById('search');
                var options = {strictBounds: true};
                var searchAutocomplete = new google.maps.places.Autocomplete(input, options);
                // Only interested in what is within current map
                searchAutocomplete.bindTo('bounds', map);
            },

            assignMapCallback: function () {

                var self = this;

                // Called from index.html once both jQuery
                // and the Google API map library is ready
                // and is setup in the global scope
                var initMap = function () {
                    var mapElem = document.getElementById('map');
                    model.map = new google.maps.Map(mapElem, model.defaultMap);
                    // Only one infowindow is created. This is because we only
                    // want one open at a time to prevent map getting cluttered
                    var infowindow = new google.maps.InfoWindow({});

                    google.maps.event.addListener(infowindow,'closeclick',function(){
                        model.lastClicked = 0;
                    });

                    model.markers.forEach(function (m) {
                        var marker = new google.maps.Marker({
                            position: m.uluru,
                            map: model.map,
                            animation: google.maps.Animation.DROP,

                        });
                        marker.addListener('mouseover', function () {
                            // Check if this marker was the last one we hovered over
                            // If so, don't reanimate it, because that's distracting
                            if (model.lastClicked !== m.id) {
                                model.lastClicked = m.id;
                                // Set the infowindow to match the
                                // name for the clicked marker
                                infowindow.setContent(m.name);
                                infowindow.open(map, marker);
                                // Do one bounce then make the marker stationary again
                                marker.setAnimation(google.maps.Animation.BOUNCE);
                                setTimeout(function () {
                                    marker.setAnimation(null);
                                }, 700)
                            }
                        });

                        // self.setupAutocomplete(model.map);
                    });
                };
            },

            init: function () {
                model.init();
                this.assignMapCallback();
            }
        };

        ko.applyBindings(viewModel);
        viewModel.init();
    }()
);
