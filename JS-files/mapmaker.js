;
(function($, window, document, moment) {

    "use strict";

    // default values whcih can be overridden when plugin is initialised
    var pluginName = "AccommodationMap",
        defaults = {
            clusterStyles: {
                gridSize: 20,
                imgUrl: '../assets/marker_50.png',
                height: 50,
                width: 50,
                textColor: '#ffffff',
                textSize: 10
            },
            polygonStyles: {
                strokeColor: '#8a8a8a',
                strokeOpacity: 0.8,
                strokeWeight: 0,
                fillColor: '#8a8a8a',
                fillOpacity: 0.5
            },
            iconImages: {
                insidePolygon: '../assets/property-pin.png',
                outsidePolygon: '../assets/property-pin-outside.png',
                expandableInsidePolygon: '../assets/property-pin-expand.png',
                expandableOutsidePolygon: '../assets/property-pin-outside-expand.png'
            },
            mapSettings: {
                maxZoom: 16,
                minZoom: 5,
                mapStyle: [{"featureType":"administrative.country","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"administrative.country","elementType":"geometry","stylers":[{"visibility":"on"},{"color":"#eace9e"}]},{"featureType":"administrative.country","elementType":"geometry.fill","stylers":[{"hue":"#ff0000"}]},{"featureType":"administrative.country","elementType":"labels","stylers":[{"color":"#ad8f5a"}]},{"featureType":"administrative.province","elementType":"all","stylers":[{"visibility":"simplified"},{"color":"#b77510"}]},{"featureType":"administrative.locality","elementType":"all","stylers":[{"visibility":"simplified"},{"color":"#876118"}]},{"featureType":"administrative.neighborhood","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"administrative.land_parcel","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"all","stylers":[{"visibility":"on"},{"weight":"4"},{"hue":"#ffa900"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"visibility":"on"}]},{"featureType":"landscape.natural","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape.natural.landcover","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"landscape.natural.landcover","elementType":"geometry","stylers":[{"hue":"#ff9a00"},{"visibility":"on"}]},{"featureType":"landscape.natural.terrain","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.attraction","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.government","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.medical","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.place_of_worship","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.school","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.sports_complex","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road.highway.controlled_access","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road.arterial","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road.local","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"visibility":"on"},{"color":"#86bcc4"}]}]
            },
            ListPanelStyles: {
                listTileClass: '.mapListView__propTile',
                listTileWrapper: '.mapListView__wrapper',
                previewPaneClass: '.mapListView--hiddenCopy',
                collapseListViewClass: 'slide-right',
                listViewCollapseClass: '.puller',
            },
            ids:{
                mapId: '#map1',
                mapListId: '#mapListView',
                listId: '#Searchresults-ListPrint'
            },
            htmlTemplateIds:{
                infowindowInsidePolygon: '#infowindow-inside',
                infowindowOutsidePolygon: '#infowindow-outside',
                mapListView:'#property-list',
                listView: '#property-listView'
            }
        };
    
    // plugin constructor
    function mapMaker(element, options) {

        this.element = element;

        // My plugin specific variables
        this.map = null;
        this.accommodations = [];
        this.bounds = {};
        this.polygonCoordinates = [];
        this.acommodationsInfoWindows = [];

        if($('.getResults').length > 0){
            this.listActive = true;
            this.searchResults = true;
        }

        if($('#mapListView').length > 0){
            this.listActive = true;
        }

        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        
        this.init();

    }

   $.extend(mapMaker.prototype, {

        init: function() {

            if(this.searchResults != true){

                this.map = new google.maps.Map(document.querySelector(this.options.ids.mapId),  {
                    zoom: 5,
                    streetViewControl: false,
                    mapTypeControl: false,
                    maxZoom: this.options.mapSettings.maxZoom,
                    minZoom: this.options.mapSettings.minZoom,
                    styles: this.options.mapStyle
                });
                $(this.options.mapSettings.mapId).fadeIn('fast');

                this.bounds = this._getNewBounds();
                this.infowindow = new google.maps.InfoWindow();
                this._getPolygonBounds();
                this._addAccommodationMarkers(PolygonJsonResponse.results, true);
                this._reloadFitToPolygon();
            
                this._drawPolygon();
                this._getExternalAccommodationMarkers();

                this._accommodationCluster = new MarkerClusterer(this.map, this.accommodations, {
                    gridSize: this.options.clusterStyles.gridSize,
                    maxZoom: 12,
                    styles: [{
                        url: this.options.clusterStyles.imgUrl,
                        height: this.options.clusterStyles.height,
                        width: this.options.clusterStyles.width,
                        anchorText: [-7, 0],
                        textColor: this.options.clusterStyles.textColor,
                        textSize: this.options.clusterStyles.textSize,
                        anchorIcon: [50,25]
                    }],
                    ignoreHidden: true
                });

                if(this.listActive === true){

                    this._printListView(PolygonJsonResponse.results);
                    var self = this;
                    $(this.options.ListPanelStyles.listViewCollapseClass).click(function() {
                        if($(self.options.ids.mapListId).hasClass(self.options.ListPanelStyles.collapseListViewClass)){
                            $(self.options.ids.mapListId).removeClass(self.options.ListPanelStyles.collapseListViewClass).delay(300).queue(function(next){
                                $(self.options.ids.mapId).css('width', '75%');
                                google.maps.event.trigger(self.map, 'resize')
                                next();
                            });
                        } else {
                            $(self.options.ids.mapListId).addClass(self.options.ListPanelStyles.collapseListViewClass)
                            $(self.options.ids.mapId).css('width', '100%');
                            google.maps.event.trigger(self.map, 'resize')
                        }
                    });

                }
            } else {
                this._printListView(PolygonJsonResponse.results);
            }


            
        },

        _printListView: function(results){


            var properties = {count: results.length, properties: results};
            console.log(properties);
            var self = this;

            if(this.searchResults != true){
                var template = Handlebars.compile($(this.options.htmlTemplateIds.mapListView).html());
                $(this.options.ids.mapListId).html(template(properties));

                if ($(this.options.ListPanelStyles.listTileClass).not(this.options.ListPanelStyles.previewPaneClass).attr('data-ref')) { 
                    $(this.options.ids.mapListId).on("click", this.options.ListPanelStyles.listTileClass, function(event) {

                        var selected = $(event.target).closest(self.options.ListPanelStyles.listTileClass).attr('data-ref');
                        var latlongtest = self.accommodations[selected];
                        new google.maps.event.trigger( self.accommodations[selected], 'spider_click' );
                        self.map.setCenter(latlongtest.getPosition())
                        self.map.setZoom(15)
                        self.map.panTo(latlongtest.getPosition())

                        
                    });
                }
            } else {
                var template = Handlebars.compile($(this.options.htmlTemplateIds.listView).html());
                $(this.options.ids.listId).html(template(properties));
            }


        },

        _getExternalAccommodationMarkers: function(){

            var self = this;

            $.ajax({
                async: true,
                dataType: 'json',
                url: '/Json-pulled/YDNP-outside.json',
                success: function (result) {
                    self._addAccommodationMarkers(result.results, false);
                },
                error: function (result) {
                    
                }
            });
        },

        _getNewBounds: function(){
            return new google.maps.LatLngBounds();
        },

        _getPolygonBounds: function(){

            var self = this;

            $.each(PolygonJsonResponse.polygon, function(i, item){
                var latLng = new google.maps.LatLng(item.latitude, item.longitude);
                self.bounds.extend(latLng);
            });
        },

       _addAccommodationMarkers: function(results, insidePolygon){

            var oms = new OverlappingMarkerSpiderfier(this.map, { 
                markersWontMove: true,
                markersWontHide: true,
                keepSpiderfied: true,
                nearbyDistance: 10,
                circleSpiralSwitchover: 'infinity'
            });

            var self = this;
            if(insidePolygon === true){
                
                oms.addListener('format', function(marker, status) {      
                    var iconURL = status == OverlappingMarkerSpiderfier.markerStatus.SPIDERFIED? self.options.iconImages.insidePolygon :
                    status == OverlappingMarkerSpiderfier.markerStatus.SPIDERFIABLE? self.options.iconImages.expandableInsidePolygon :
                    status == OverlappingMarkerSpiderfier.markerStatus.UNSPIDERFIABLE? self.options.iconImages.insidePolygon : 
                    null;
                    marker.setIcon({
                        url: iconURL,
                        optimized: false
                    });
                });
                
            }


            $.each(results, function(i, item){
                
                var latLng = new google.maps.LatLng(item.Latitude, item.Longitutde);

                if(insidePolygon === true) {
                    var iconURL = self.options.iconImages.insidePolygon,
                        properties = item,
                        template = Handlebars.compile($(self.options.htmlTemplateIds.infowindowInsidePolygon).html()),
                        clickType = 'spider_click'
                } else {
                    var iconURL = self.options.iconImages.outsidePolygon,
                        properties = item,
                        template = Handlebars.compile($(self.options.htmlTemplateIds.infowindowOutsidePolygon).html()),
                        clickType = 'click';
                }

                console.log(iconURL)

                self.accommodations[item.ref] = new google.maps.Marker({
                    position: latLng,
                    icon: iconURL,
                    propref: item.ref
                });
                

                google.maps.event.addListener(self.accommodations[item.ref], clickType, (function(marker, i) {
                    return function() {
                        self.infowindow.close();
                        self.infowindow.setContent(template(properties));
                        self.infowindow.open(self.map, marker);

                        if(insidePolygon === true) {
                            self._toggleSelectedAccommodation(marker);
                        } else {
                            self._toggleSelectedAccommodation(null, true);
                        }
                    }
                })(self.accommodations[item.ref], i));

                           
                oms.addMarker(self.accommodations[item.ref]);

            });

            console.log(self.accommodations)

            console.log(Object.keys(self.accommodations).length)

            google.maps.event.addListener(this.infowindow,'closeclick',function(){
                self._toggleSelectedAccommodation(null);
                self.infowindow.close();
            });

        },

        _toggleSelectedAccommodation: function(marker, externalPolygon){
            var self = this;
            if(marker === null){
                if(externalPolygon === true){
                    $.each($(self.options.ListPanelStyles.listTileClass), function(){
                        $(self.options.ListPanelStyles.listTileClass).css('opacity', '0.4');
                    });
                } else {
                    $.each($(self.options.ListPanelStyles.listTileClass), function(){
                        $(self.options.ListPanelStyles.listTileClass).show().css('opacity', '');
                    });
                }
                $(self.options.ListPanelStyles.previewPaneClass).hide();

            } else {
                var selectedAcommodation = $(self.options.ListPanelStyles.listTileClass + '[data-ref="' + marker.propref + '"]');
                $(self.options.ListPanelStyles.listTileClass).css('opacity', '0.4');
                $(self.options.ListPanelStyles.previewPaneClass).html(selectedAcommodation.html()).css('opacity', '1').show();
                selectedAcommodation.hide();
                $(self.options.ListPanelStyles.listTileWrapper).animate({
                    scrollTop: $(self.options.ListPanelStyles.listTileWrapper).offset().top -40
                }, 'medium');
            }
        },

        _fitMapToMarkers: function(visibleOnly){
            this.bounds = new google.maps.LatLngBounds();
            var visibleCount = 0;
        },

        _reloadFitToPolygon: function(){
            this.map.fitBounds(this.bounds);

            this._fitMapToMarkers(true);

            this.map.addListener('center_changed', function() {
                // 3 seconds after the center of the map has changed, pan back to the
                // marker.
                window.setTimeout(function() {
                  //  map.panTo(marker.getPosition());
                }, 3000);
            });
        },

        _drawPolygon: function(){

            var self = this;
            $.each(PolygonJsonResponse.polygon, function(i, item){
        
                self.polygonCoordinates[i] = {
                    lat: item.latitude,
                    lng: item.longitude
                };
                
            });

            var polygonCoords = self.polygonCoordinates;

            var exteriorPolygon = [
                new google.maps.LatLng(0, 90),
                new google.maps.LatLng(0, -90),
                new google.maps.LatLng(90, 90),
                new google.maps.LatLng(90, -90),
            ];

            var plotPolygon = new google.maps.Polygon({
                paths: [exteriorPolygon, polygonCoords],
                strokeColor: this.options.polygonStyles.strokeColor,
                strokeOpacity: this.options.polygonStyles.strokeOpacity,
                strokeWeight: this.options.polygonStyles.strokeWeight,
                fillColor: this.options.polygonStyles.fillColor,
                fillOpacity: this.options.polygonStyles.fillOpacity
            });
            plotPolygon.setMap(self.map);
        },
        
        _closeAllInfoWindows: function(){

            $.each(this.acommodationsInfoWindows, function(i, infoWindow){
                infoWindow.close();
            });
    
        },

    });

    // preventing against multiple instantations

    $.fn.AccommodationMap = function(options) {

        var mapInstance;

        //check plugin is only applied to a single element
        if (this.length > 1) {
            throw new Error("The map can only be applied to one element - check the selector used");
        }

        if (!this.length) {
            throw new Error("No matching element - check the selector used");
        }

        if (!this.data('plugin_map')) {
            mapInstance = new mapMaker(this, options);
            this.data('plugin_map', mapInstance);
            return mapInstance;
        }

        return this.data('plugin_map');
    };

})(jQuery, window, document);