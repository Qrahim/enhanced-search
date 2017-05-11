var routemap = (function ($) {

    var exports = {};

    // private local vars
    var _init = false;

    var m = {

        _map: null,
        _accommodations: [],
         _accommodationWindows: [],
        _bounds: {},

        _getNewBounds: function(){
            return new google.maps.LatLngBounds();
        },

        _addAccommodationMarkers: function(){

            var infowindow = new google.maps.InfoWindow();


            $.each(PolygonJsonResponse.results, function(i, item){
                // console.log(i, item)

                var latLng = new google.maps.LatLng(item.Latitude, item.Longitutde);

                m._accommodations[i] = new google.maps.Marker({
                    position: latLng
                });

                m._bounds.extend(latLng);
                
                m._accommodations[i].setMap(m._map);

                google.maps.event.addListener(m._accommodations[i], 'click', (function(marker, i) {
                    return function() {
                    infowindow.setContent(item.ref);
                    infowindow.open(m._map, marker);
                    }
                })(m._accommodations[i], i));

                // console.log(m._bounds)
            });
            

        },

        _fitMapToMarkers: function(visibleOnly){
            m._bounds = new google.maps.LatLngBounds();

            var visibleCount = 0;

            $.each(m._markers, function(i, marker){
                if(!visibleOnly || (visibleOnly && marker.visible===true)){
                    m._bounds.extend(marker.position);
                    visibleCount++;
                }
            });
        },

        _reloadFitToMarkers: function(){
            m._map.fitBounds(m._bounds);

            m._fitMapToMarkers(true);

            m._map.addListener('center_changed', function() {
                // 3 seconds after the center of the map has changed, pan back to the
                // marker.
                window.setTimeout(function() {
                  //  map.panTo(marker.getPosition());
                }, 3000);
            });
        }

        // m._map.fitBounds(m._bounds);
    }

    exports.init = function(){

        if (_init) {
            return;
        }

        // console.log(PolygonJsonResponse)
        _init = true;

        m._map = new google.maps.Map(document.getElementById('map1'),  {zoom: 5,  streetViewControl: false, mapTypeControl: false});

        m._bounds = m._getNewBounds();

        

        m._addAccommodationMarkers();

        m._reloadFitToMarkers();

        $('#map').fadeIn('slow');

        m._accommodationCluster = new MarkerClusterer(m._map, m._accommodations, {
            gridSize: 50,
            maxZoom: 12,
            styles: [{
                url: 'http://creativelements.co.uk/j3/images/maps/marker_50.png',
                height: 50,
                width: 50,
                anchorText: [-7, 0],
                textColor: '#ffffff',
                textSize: 10,
                anchorIcon: [50,25]
            }],
            ignoreHidden: true
        });
        
    }

    return exports;

}(jQuery));