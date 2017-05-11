;
(function($, window, document, moment) {

    "use strict";

    // default values whcih can be overridden when plugin is initialised
    var pluginName = "horizontalNav",
        defaults = {
            clusterStyles: {
                gridSize: 20,
                imgUrl: '../assets/marker_50.png',
                height: 50,
                width: 50,
                textColor: '#ffffff',
                textSize: 10,
                moment: null,
            }
        };
    
    // plugin constructor
    function mapMaker(element, options) {

        this.element = element;

        this.ajaxResponse;

        // My plugin specific variables

        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        
        this.init();

    }

    $.extend(mapMaker.prototype, {

        init: function() {

            var self = this;
            // Filter popup opened
            $(".horizontalNav--filterOpen, .horizontalNav--filterClose").unbind( "click" );

            $(".horizontalNav--filterOpen, .horizontalNav--filterClose").bind("click", function (e) {
                console.log('click happened')
                e.preventDefault();
                var targetPanel = $(this).parent().find(".horizontalNav--popUp");
                self._closePopupPanel(targetPanel);
            });

            $(".horizontalNav__polygonFilterContent ul a").click(function (e) {
                console.log('clicked');
                e.preventDefault();
                var selector = $(this).attr("data-key");
                self._updatePolygons(selector)
            });

            $('#dont').change( function(){
                if (this.checked) {
                    $( '#date-picker').removeData("selectStartDate");
                    $('#date-picker').datepicker("setDate", null);
                }
            });

            $('.horizontalNav__dateFilter--rangeSelector').change( function() {
                var range = parseInt($(this).val());
                var dateText = $('#date-picker').data('selectStartDate')
                var endate = moment(dateText).add(range, 'days');
                $('#date-picker').data('selectEndDate', endate);
                $('#date-picker').datepicker( "refresh" );
            });

            this._printDatePicker();
            this._getPriceRangeSlider();

        },

        _printDatePicker: function() {
            
            $('#date-picker').datepicker({
                numberOfMonths: 2,
                firstDay: 1,
                minDate: 1,
                beforeShowDay: function (date) {

                    if ($(this).data('selectStartDate')) {

                        var selectedStart = $(this).data('selectStartDate')
                        var selectedEnd = $(this).data('selectEndDate')

                        if(moment(date).isSame(selectedStart)){
                            return [true, "horizontalNav__dateFilter--selectedStartDate"];
                        } 
                        
                        if (moment(date).isSame(selectedEnd)) {
                            return [true, 'horizontalNav__dateFilter--selectedEndDate'];
                        }

                        if (moment(date).isBetween(selectedStart, selectedEnd)) {
                            return [true, 'horizontalNav__dateFilter--selectedInbetweenDate'];
                        }

                    } 

                    return [true, ''];
                },

                onSelect: function (dateText, inst) {

                    var datetest = moment(dateText, "MM-DD-YYYY");
                    $(this).data('selectStartDate', datetest);

                    var range = parseInt($('.horizontalNav__dateFilter--rangeSelector').val());
                    var endate = moment(dateText, "MM-DD-YYYY").add(range, 'days');
                    $(this).data('selectEndDate', endate);


                    
                    if($('#dont').prop('checked') === true) {
                        $('#flexithree').prop('checked', true);
                    }
                }
            });

        },

        _getPriceRangeSlider: function() {

            $( "#priceSlider" ).slider({
                range: true,
                min: 0,
                max: 500,
                values: [ 75, 300 ],
                slide: function( event, ui ) {
                    $( "#priceSliderAmount" ).html( "£" + ui.values[ 0 ] + " - £" + ui.values[ 1 ] );
                },
                // Set slider default values
                // create: function(event, ui){
                //     $(this).slider('value',$(this).parent().find(".inputNumber").val());
                // }
            });

            $('#priceSliderMin').text($('#priceSlider').slider('option', 'min'));
            $('#priceSliderMax').text($('#priceSlider').slider('option', 'max'));
            
            // console.log(self.ajaxResponse);

        },


        _updatePolygons: function(selector){

            var _url = '/Json-pulled/Horizontal-Nav/polygon-' + selector + '.json';
            var self = this;

            $.ajax({
                async: true,
                dataType: 'json',
                url: _url,
                success: function (result) {
                    console.log(result)
                    
                    self.ajaxResponse = result;
                    
                    // look through intoa availalefeatures level
                    Handlebars.registerHelper('if_eq', function(a, b, opts) {
                        if (a == b) {
                            return opts.fn(this);
                        }
                    });

                    Handlebars.registerHelper('grouped_each', function(every, context, options) {
                        var out = "", subcontext = [], i;
                        if (context && context.length > 0) {
                            for (i = 0; i < context.length; i++) {
                                if (i > 0 && i % every === 0) {
                                    out += options.fn(subcontext);
                                    subcontext = [];
                                }
                                subcontext.push(context[i]);
                            }
                            out += options.fn(subcontext);
                        }
                        return out;
                    });
                    
                    
                    var template = Handlebars.compile($('#polygon-selector').html());
                    $('#polygonList').html(template(result));

                    var template = Handlebars.compile($('#feature-selector').html());
                    $('.horizontalNav__featureFilterPopUp').html(template(result));

                    if($('#polygonList').hasClass('horizontalNav__polygonFilter--background')){
                        $('#polygonList').removeClass('horizontalNav__polygonFilter--background')
                    }

                    self.init();
                
                },
                error: function (result) {
                    console.log(result)
                }
            });

        },

         _closePopupPanel: function(targetPanel){
            
            $(".horizontalNav--popUp").fadeOut();
            if(targetPanel.is(':visible')){
                targetPanel.fadeOut(); 
            } else {
                $(".arrow-box, #panel-destination").hide(); 
                targetPanel.fadeIn(); 
            }

        },


    });

    // preventing against multiple instantations

    $.fn.horizontalNav = function(options) {

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

})(jQuery, window, document, moment);