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
                    var uluru = {lat: 51.1414, lng: 0.5894};
                    var mapElem = document.getElementById('map');
                    console.dir(mapElem);
                    model.map = new google.maps.Map(mapElem, {
                        zoom: 16,
                        center: uluru
                    });
                    var marker = new google.maps.Marker({
                        position: uluru,
                        map: model.map
                    });
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

