$(
    function () {

        var model = {
            map: {},
            locationNames: [],
            markers: []
        };


        var viewModel = {
            personName: 'Bob',
            personAge: 123,

            assignMapCallback: function() {

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
                    // Now we have a map, we can bind the Autocomplete search
                    var input = document.getElementById('search');
                    var options = {strictBounds: true};
                    var searchAutocomplete = new google.maps.places.Autocomplete(input,options);
                    // Only interested in what is within current map
                    searchAutocomplete.bindTo('bounds', model.map);
                };

            },

            init: function() {
                this.assignMapCallback();
            }
        };

        ko.applyBindings(viewModel);
        viewModel.init();

    }()
);


//
// https://maps.googleapis.com/maps/api/place/autocomplete/json?input=we&location=51.1414,0.5894&radius=10&strictbounds&key=AIzaSyCCXajBUCO96ptgmu4OnftICZmQrTFcpaY
