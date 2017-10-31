

$(
    function () {

        var model = {
            map: {},
            locationNames: [],
            markers: []
        };


        var viewModel = {

            filterInput: ko.observable(''),
            filterList: ko.observable([]),

            setupAutocomplete: function(map) {
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
                initMap = function () {
                    // Latitude and longitude of my current home village!
                    var uluru = {lat: 51.1414, lng: 0.5894};
                    var mapElem = document.getElementById('map');
                    model.map = new google.maps.Map(mapElem, {
                        zoom: 16,
                        center: uluru
                    });
                    var marker = new google.maps.Marker({
                        position: uluru,
                        map: model.map
                    });
                    self.setupAutocomplete(model.map);
                };

            },

            animateMarker: function () {
                // TODO : Animate marker when clicked directly or via filter list
            },

            init: function () {
                this.assignMapCallback();
            }
        };

        ko.applyBindings(viewModel);
        viewModel.init();

    }()
);
