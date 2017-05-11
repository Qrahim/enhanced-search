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

            this._buildVarCache();
            this._printDatePicker();
            this._getPriceRangeSlider();
            this._bindEvents();

            if($('#polygonList').hasClass('horizontalNav__polygonFilter--background')){
                $('#polygonList').removeClass('horizontalNav__polygonFilter--background')
            }

            // console.log(self.$selectedDate);

        },

        _buildVarCache: function () {
            /*
                Create variable(s) that can be accessed by other plugin
                functions. For example, "this.$element = $(this.element);"
                will cache a jQuery reference to the elementthat initialized
                the plugin. Cached variables can then be used in other methods. 
            */
            this.$element = $(this.element);
            this.$filterOpenClose = $(".horizontalNav--filterOpen, .horizontalNav--filterClose");
            this.$polygonSelection = $(".horizontalNav__polygonFilterContent ul a");

            this.$priceRangeMin;
            this.$priceRangeMax;


        },

        _bindEvents: function() {

            var self = this;

            console.log(self._name);

            self.$filterOpenClose.on('click'+'.'+self._name, function(e) {
                e.preventDefault();
                var targetPanel = $(this).parent().find(".horizontalNav--popUp");
                self._closePopupPanel(targetPanel);
            });

            self.$polygonSelection.on('click'+'.'+self._name, function(e) {
                e.preventDefault();
                var dropdownSelector = $(this).closest('.horizontalNav--popUp').data('selector')
                var selector = $(this).attr("data-key");
                self._updateResults(selector, dropdownSelector)
            });


            $('.horizontalNav__dateFilter--rangeSelector').change( function() {
                console.log('happened');
                var range = parseInt($(this).val());
                var dateText = $('#date-picker').data('selectStartDate')
                var endate = moment(dateText).add(range, 'days');
                $('#date-picker').data('selectEndDate', endate);
                $('#date-picker').datepicker( "refresh" );
            });

        },

        unbindEvents: function() {
            /*
                can remove all this once server responses are in - binding won't be needed then
            */
            this.$filterOpenClose.off('.'+this._name);
            this.$polygonSelection.off('.'+this._name);
        },

        _printDatePicker: function() {

            var self = this;
            
            $('#date-picker').datepicker({
                numberOfMonths: 2,
                firstDay: 1,
                minDate: 1,
                beforeShowDay: function (date) {
                    console.log('beforeShowDay fired')

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
                    console.log('onselect fired')
                    var datetest = moment(dateText, "MM-DD-YYYY");
                    $(this).data('selectStartDate', datetest);

                    var range = parseInt($('.horizontalNav__dateFilter--rangeSelector').val());
                    var endate = moment(dateText, "MM-DD-YYYY").add(range, 'days');
                    $(this).data('selectEndDate', endate);
                    
                    if($('#dont').prop('checked') === true) {
                        $('#flexithree').prop('checked', true);
                    }

                    var dropdownSelector = $(this).closest('.horizontalNav--popUp').data('selector')
                    self._updateResults('england', dropdownSelector)//needs changing to a date selector once server responses are in

                }
            });

            $('#dont').change( function(){
                console.log('fired');
                if (this.checked) {
                    $('#date-picker').removeData("selectStartDate");
                    $('#date-picker').datepicker("setDate", null);
                }
            });

        },

        _getPriceRangeSlider: function() {

            var self = this;



            $( "#priceSlider" ).slider({
                range: true,
                min: 0,
                max: 500,
                values: [ 75, 300 ],
                slide: function( event, ui ) {
                    $( "#priceSliderAmount" ).html( "£" + ui.values[ 0 ] + " - £" + ui.values[ 1 ] );
                },
                // Set slider default values
                create: function(event, ui){

                    if($(this).data('test') != undefined){

                    console.log('yes');

                    }
                    $(this).slider('value',$(this).parent().find(".inputNumber").val());


                }
            });

            // sets text below slider
            $('#priceSliderMin').text($('#priceSlider').slider('option', 'min'));
            $('#priceSliderMax').text($('#priceSlider').slider('option', 'max'));
            
            // console.log(self.ajaxResponse);

        },


        _updateResults: function(selector, dropdownSelector){

            console.log(dropdownSelector)

            var _url = '/Json-pulled/Horizontal-Nav/polygon-' + selector + '.json';
            var self = this;

            $.ajax({
                async: true,
                dataType: 'json',
                url: _url,
                success: function (result) {
                    console.log(result)

                    console.log(Object.keys(result.filters))
                    self.ajaxResponse = result;

                    self.$selectedDate = moment(result.summary.date, 'DD-MM-YYYY');
                    self.$selectedEndDate = moment(result.summary.date, 'DD-MM-YYYY').add(parseInt(result.summary.nights), 'days');
                    // self.$priceRangeMin = filters.


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


                    // Handlebars.registerHelper('equalsTo', function(v1, v2, options) { 
                    //     // if(v1 == v2) { return options.fn(this); } 
                    //     // else { return options.inverse(this); } 
                    //     console.log(v1, v2)
                    // });
                    
                    var template = Handlebars.compile($('#polygon-selector').html());
                    $('#polygonList').html(template(result));
                   
                    $("*[data-selector='" + dropdownSelector + "']").show();

                    ///MAYBE MOVE OUT??? - setting date of datepicker once ajax response returns
                    $('#date-picker').data('selectStartDate', self.$selectedDate);
                    $('#date-picker').data('selectEndDate', self.$selectedEndDate);

                    self.unbindEvents();
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