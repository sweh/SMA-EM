(function($) {
        var PieConfig;
        var rss_messages = [];

        var days = [
            'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag',
            'Freitag', 'Samstag'
        ];
        var months = [
            'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
            'August', 'September', 'Oktober', 'November', 'Dezember'
        ];

        pageSetUp();
        window.ticks = 0;

        var isUndefinedOrNull = function (o) {
            return o  === undefined || o === null;
        };

        function round(value, precision) {
            var multiplier = Math.pow(10, precision || 0);
            var result = Math.round(value * multiplier) / multiplier;
            result = result.toString();
            if (result.indexOf('.') < 0) {
                result = result + '.' + '0'.repeat(precision || 1);
            } else {
                result = result.split('.');
                if (result[1].length < precision) {
                    result[1] += '0'.repeat(precision - result[1].length);
                }
                result = result[0] + '.' + result[1];
            }
            return result;
        }

        /* flot chart colors default */
        var $chrt_border_color = "#efefef";
        var $chrt_grid_color = "#DDD";
        var $chrt_main = "#7e9d3a";         /* greeen    */
        var $chrt_second = "#6595b4";       /* blue      */
        var $chrt_third = "#FF9F01";        /* orange    */
        var $chrt_fourth = "#4c4f53";       /* blueDark  */
        var $chrt_fifth = "#a90329";        /* red       */
        var $chrt_mono = "#000";

        var d = [], e = [], f = [], g = [], h = [];

        var pvchart = function() {
            var options = {
                xaxis : { mode : "time", tickLength : 5, timezone: "browser" },
                series : {
                    lines : {
                        show : true,
                        lineWidth : 1,
                        fill : true,
                        fillColor : {
                            colors : [{
                                opacity : 0.1
                            }, {
                                opacity : 0.15
                            }]
                        }
                    },
                    points: { show: false },
                    shadowSize : 0
                },
                colors : [$chrt_main, $chrt_second, $chrt_third, $chrt_fourth, $chrt_fifth],
            };
            if ($('#pvchart').is(":visible")) {
                plot_1 = $.plot($("#pvchart"), [d,e,f,g,h], options);
            }
        };

        var pvsums = {},
            pvsums_per_month = {},
            pvsums_page = -1,
            pvsums_display = 'Monat';

        var pvhistory = function() {
            var ds = new Array();
            var ac_power_solar = [];
            var power_to_grid = [];
            var consumption = [];
            var power_from_grid = [];
            var power_from_battery = [];
            var ac_power_battery = [];
            var pages = {};
            var page_labels = {};
            var _page = 1;
            var pvsums_keys = Object.keys(pvsums);
            pvsums_keys.sort()

            if (pvsums_display === 'Monat') {
                while (pvsums_keys[0].slice(4,6) !== '01') {
                    var _day = parseInt(pvsums_keys[0].slice(4,6)) - 1;
                    _day = ('0'+_day).slice(-2);
                    pvsums_keys.unshift(pvsums_keys[0].slice(0,4) + _day);
                }
                var today = new Date();
                var lastDayOfMonth = new Date(
                    today.getFullYear(), today.getMonth()+1, 0
                ).getDate().toString();
                while (pvsums_keys[pvsums_keys.length-1].slice(4,6) !== lastDayOfMonth) {
                    var _day = parseInt(pvsums_keys[pvsums_keys.length-1].slice(4,6)) + 1;
                    _day = ('0'+_day).slice(-2);
                    pvsums_keys.push(pvsums_keys[pvsums_keys.length-1].slice(0,4) + _day);
                }
                $.each(pvsums_keys, function (index, item) {
                    if ((index > 0) && (item.slice(4, 6) === "01")) {
                        _page += 1;
                    }
                    page_labels[_page] = item.slice(2,4) + '/' + item.slice(0,2);
                    if (!pages[_page]) {
                        pages[_page] = [];
                    }
                    pages[_page].push(item);
                });
                if (pvsums_page === -1) {
                    pvsums_page = Object.keys(pages)[Object.keys(pages).length-1];
                }

                $.each(pages[pvsums_page], function (index, day) {
                    var data = pvsums[day] || {};
                    day = parseInt(day.slice(4,6));
                    ac_power_solar.push([day, Math.round(data.ac_power_solar || 0)]);
                    power_to_grid.push([day, Math.round(data.power_to_grid || 0)]);
                    consumption.push([day, 0 - Math.round(data.consumption || 0)]);
                    power_from_grid.push([day, 0 - Math.round(data.power_from_grid || 0)]);
                    power_from_battery.push([day, 0 - Math.round(data.power_from_battery || 0)]);
                    ac_power_battery.push([day, Math.round(data.ac_power_battery || 0)]);
                });
                var tooltip_month = months[parseInt(pages[pvsums_page][0].slice(2,4))-1];
                var tooltip_year = '20' + pages[pvsums_page][0].slice(0,2);
                var tooltip_content = "%x.. " + tooltip_month + " " + tooltip_year + "<br /><span>%y Wh</span>";
            } else if (pvsums_display === 'Jahr') {
                var start = pvsums_keys[0].slice(0, 2);
                $.each(pvsums_keys, function (index, item) {
                    if ((index > 0) && (item.slice(0, 2) !== start)) {
                        _page += 1;
                        start = item.slice(0, 2);
                    }
                    page_labels[_page] = '20' + item.slice(0,2)
                    if (!pages[_page]) {
                        pages[_page] = [];
                    }
                    pages[_page].push(item);
                });
                if (pvsums_page === -1) {
                    pvsums_page = Object.keys(pages)[Object.keys(pages).length-1];
                }
                var pvsums_month = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}, 12: {}};
                $.each(pages[pvsums_page], function (index, day) {
                    var data = pvsums[day] || {};
                    month = parseInt(day.slice(2,4));
                    pvsums_month[month].ac_power_solar = (pvsums_month[month].ac_power_solar || 0) + data.ac_power_solar;
                    pvsums_month[month].power_to_grid = (pvsums_month[month].power_to_grid || 0) + data.power_to_grid;
                    pvsums_month[month].consumption = (pvsums_month[month].consumption || 0) + data.consumption;
                    pvsums_month[month].power_from_grid = (pvsums_month[month].power_from_grid || 0) + data.power_from_grid;
                    pvsums_month[month].power_from_battery = (pvsums_month[month].power_from_battery || 0) + data.power_from_battery;
                    pvsums_month[month].ac_power_battery = (pvsums_month[month].ac_power_battery || 0) + data.ac_power_battery;
                });
                $.each(pvsums_month, function (month, data) {
                    ac_power_solar.push([parseInt(month), Math.round(data.ac_power_solar || 0)/1000]);
                    power_to_grid.push([parseInt(month), Math.round(data.power_to_grid || 0)/1000]);
                    consumption.push([parseInt(month), 0 - Math.round(data.consumption || 0)/1000]);
                    power_from_grid.push([parseInt(month), 0 - Math.round(data.power_from_grid || 0)/1000]);
                    power_from_battery.push([parseInt(month), 0 - Math.round(data.power_from_battery || 0)/1000]);
                    ac_power_battery.push([parseInt(month), Math.round(data.ac_power_battery || 0)/1000]);
                });
                var tooltip_year = page_labels[pvsums_page];
                var tooltip_content = "%x/" + tooltip_year + "<br /><span>%y kWh</span>";
            }

            ds.push({
                data : ac_power_solar,
                stack: true,
                bars : {
                    show : true,
                    barWidth : 0.2,
                }
            });
            ds.push({
                data : power_to_grid,
                stack: true,
                bars : {
                    show : true,
                    barWidth : 0.2,
                }
            });
            ds.push({
                data : ac_power_battery,
                bars : {
                    show : true,
                    barWidth : 0.2,
                    order : 2
                }
            });
            ds.push({
                data : power_from_battery,
                bars : {
                    show : true,
                    barWidth : 0.4,
                    order : 3
                }
            });
            ds.push({
                data : consumption,
                bars : {
                    show : true,
                    barWidth : 0.2,
                }
            });
            ds.push({
                data : power_from_grid,
                bars : {
                    show : true,
                    barWidth : 0.2,
                }
            });
            if ($('#pvchart-history').is(":visible")) {
                $('.pvhistory_pagination').remove();
                $('#pvchart-history').after(
                    '<div class="pvhistory_pagination" style="text-align: center; margin-top: -5px;"><div class="btn-group pages"></div></div>'
                );

                for (var i = 1; i<=Object.keys(pages).length; i++) {
                    var type = 'default';
                    if (i == pvsums_page) {
                        type = 'primary';
                    }
                    $('.pvhistory_pagination .btn-group').append(
                        '<button type="button" class="btn btn-' + type + ' btn-xs" data-page="'+ i +'">' + page_labels[i] + '</button>'
                    );
                }
                $('.pvhistory_pagination').append(
                    '<div class="btn-group display" style="margin-left: 10px"><button type="button" class="btn btn-success btn-xs">'+ pvsums_display +'</button></div>'
                );
                $('.pvhistory_pagination .pages button').click(function (ev) {
                    pvsums_page = parseInt($(ev.currentTarget).data('page'));
                    pvhistory();
                });
                $('.pvhistory_pagination .display button').click(function (ev) {
                    if ($(ev.currentTarget).text() == 'Monat') {
                        pvsums_display = 'Jahr';
                    } else {
                        pvsums_display = 'Monat';
                    }
                    pvsums_page = -1;
                    pvhistory();
                });

                $.plot($("#pvchart-history"), ds, {
                    colors : [$chrt_main, $chrt_second, $chrt_third, $chrt_third, $chrt_fourth, $chrt_fifth],
                    grid : {
                        show : true,
                        hoverable: true,
                        clickable : true,
                        tickColor : $chrt_border_color,
                        borderWidth : 0,
                        borderColor : $chrt_border_color,
                    },
                    legend : true,
                    tooltip : true,
                    tooltipOpts : {
                        content : tooltip_content,
                        defaultTheme : false
                    }
                });
            };
        };

        var handle_rss = function (data) {
            if (!rss_messages.length) {
                container = $('#rsswidget li:first()');
            } else {
                container = $('#rsswidget li:first()').clone();
                $('#rsswidget').prepend(container);
            }
            rss_messages.push(data);
            container.find('.title').text(data.title);
            container.find('.title').attr('href', data.link);
            container.find('.description').text(data.description);
            container.removeClass('hidden');
        };

        var handle_helios = function (data) {
            $(
                ['aussenluft', 'abluft', 'abluft_feuchte', 'fortluft', 'zuluft']
            ).each(function (i, key) {
                $('#helios_' + key).text(data[key]);
                $('#helios_' + key + '_tendency').removeClass('fa-caret-down');
                $('#helios_' + key + '_tendency').removeClass('fa-caret-up');
                $('#helios_' + key + '_tendency').removeClass('fa-caret-right');
                $('#helios_' + key + '_tendency').addClass(
                    'fa-caret-' + data[key + '_tendency']
                );
            });
            $('#helios_stufe').empty();
            $('#helios_stufe').append(
                '<input class="knob" data-width="80" data-height="80" data-min="0" data-max="4" data-fgColor="#6595b4" data-angleOffset=-125 data-angleArc=250 value="' + data.stufe + '" data-thickness=.3>'
            );
            $('#helios_stufe').find('input').knob({
                release: function (value) {
                    window.socket.send(
                        JSON.stringify({'helios': {'stufe': value}})
                    );
                },
            });

        };

        var handle_corona = function (data) {
            var incidence = data.inzidenz,
                last_update = data.stand;

            $('#corona_incidence').removeClass('txt-color-yellow');
            $('#corona_incidence').removeClass('txt-color-redLight');
            $('#corona_incidence').removeClass('txt-color-red');
            $('#corona_incidence').removeClass('txt-color-magenta');
            incidence_class = '';
            if (incidence > 35) {
                incidence_class = 'txt-color-yellow';
            }
            if (incidence > 50) {
                incidence_class = 'txt-color-redLight';
            }
            if (incidence > 100) {
                incidence_class = 'txt-color-red';
            }
            if (incidence > 200) {
                incidence_class = 'txt-color-magenta';
            }
            $('#corona_incidence').addClass(incidence_class);
            $('#corona_incidence').text(incidence);
            $('#corona_date').text(last_update);
            $('#corona_cases').text(data.gesamt);
            $('#corona_deaths_delta').text(data.gestorben);
            $('#corona_current').text(data.aktuell);
        };

        var handle_weather = function (data) {
            var current_temp = round(data.out_temp, 1),
                weather_icon = data.current.weather[0].icon,
                weather_alerts = data.alerts;

            $('#current_temp').text(current_temp);
            $("#current_weather_icon").removeClass (function (index, className) {
                return (className.match (/(^|\s)owi-\S+/g) || []).join(' ');
            });
            $('#current_weather_icon').addClass('owi-' + weather_icon);
            if (weather_alerts && weather_alerts.length) {
                $('#weather_alert').text(
                    weather_alerts[0].event + ': ' + weather_alerts[0].description
                );
            }

            $('#weather_hourly').empty();
            $([1, 3, 6, 10]).each(function (_, i) {
                var date = new Date(data.hourly[i].dt * 1000);
                $('#weather_hourly').append(
                    '<article class="col-xs-3 col-sm-3 text-center" style="padding: 0px">' +
                    String(date.getHours()).padStart(2, "0") + ':' + String(date.getMinutes()).padStart(2, "0") + '<br />' +
                    '<b>' + round(data.hourly[i].temp,1)+'</b></br>'+
                    '<i class="owi txt-color-black owi-' + data.hourly[i].weather[0].icon + '"></i>' +
                    '</article>'
                );
            });

            $('#weather_daily').empty();
            var days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
            for (var i=1; i<5; i++) {
                var day = days[new Date(data.daily[i].dt * 1000).getDay()];
                $('#weather_daily').append(
                    '<article class="col-xs-1 col-sm-1 text-right" style="width: 7%; margin-top: 1em; padding: 0px">' +
                    day +
                    '</article>' +
                    '<article class="col-xs-2 col-sm-2 text-center" style="padding: 0px; font-size: 8pt;">' +
                    '<b><i class="fa fa-caret-down"></i>' + round(data.daily[i].temp.min,1)+' <i class="fa fa-caret-up"></i>'+ round(data.daily[i].temp.max,1) +'</b></br>'+
                    '<i class="owi txt-color-black owi-' + data.daily[i].weather[0].icon + '"></i>' +
                    '</article>'
                );
            }
        };

        var handle_wifi = function (data) {
            $('#wifi_password').text(data.password);
        };

        var handle_pvsums = function (data) {
            console.log(data);
            var day = new Date(data.day),
                today = new Date().toISOString().slice(0, 10);
            day = day.getFullYear().toString().slice(-2) + ('0'+(day.getMonth()+1)).slice(-2) + ('0'+(day.getDate())).slice(-2);
            //day = day.getTime();
            pvsums[day] = data;
            if (data.day == today) {
                pvhistory();
            }
        };

        var handle_pv = function (data) {
            tick();
            timestamp = new Date(data.timestamp);

            var consume = {
                'panell1': round(data.sums['AC Power Solar'], 1),
                'panell2': round(data.sums['Power to grid'], 1),
                'panell3': round(data.sums.Consumption, 1),
                'panell4': round(data.sums['Power from grid'], 1)
            };

            $.each(consume, function (key, value) {
                var elem = $('#' + key),
                    unit = 'W';
                if (value > 1000) {
                    value = round(value / 1000, 1);
                    unit = 'kW';
                }
                elem.text(value + ' ' + unit);
            });

            var costs = {},
                unit = '';
            if ((window.ticks % 2) === 0) {
                costs = {
                    'panell5': round(data.costs['Power to grid'], 2),
                    'panell6': round(data.costs['Power saving'], 2),
                    'panell7': round(data.costs['Power from grid'], 2)
                   };
                unit = '€';
            } else {
                costs = {
                    'panell5': round(data.costs_per_hour['Power to grid'], 2),
                    'panell6': round(data.costs_per_hour['Power saving'], 2),
                    'panell7': round(data.costs_per_hour['Power from grid'], 2)
               };
               unit = '€/h';
            }

            $.each(costs, function (key, value) {
                var elem = $('#' + key);
                elem.text(value + ' ' + unit);
            });

            var power_from_grid = data['Power from grid'];
            $('#powerfromgrid').text(power_from_grid);

            var panelpower = data['AC Power Solar'] || 0;
            var batterypower = data['AC Power Battery'] || 0;
            var power_to_grid = data['Power to grid'] || 0;
            var batterycapacity = data.BatteryCharge || 0;

            var consumption = data.Consumption;
            batterypower = 0 - batterypower;

            d.push([timestamp, panelpower]); /* Solar Dach */
            e.push([timestamp, power_to_grid]); /* Einspeisung */
            f.push([timestamp, batterypower]); /* Batterie */
            g.push([timestamp, 0 - consumption]); /* Verbrauch */
            h.push([timestamp, 0 - power_from_grid]); /* Netzbezug */
            pvchart();

            $('#panelacpower').text(panelpower);
            $('#powertogrid').text(power_to_grid);
            $('#batteryacpower').text(batterypower);
            $('#batterycapacity').text(batterycapacity);
            $('#consumption').text(consumption);

            $('#batterycharging').find('i').removeClass('fa-caret-up');
            $('#batterycharging').find('i').removeClass('fa-caret-down');
            $('#batterycharging').removeClass('bg-color-green');
            $('#batterycharging').removeClass('bg-color-orange');
            $('#batterycharging').removeClass('bg-color-red');
            if (data.BatteryState === 'Charging') {
                $('#batterycharging').find('i').addClass('fa-caret-up');
            } else {
                $('#batterycharging').find('i').addClass('fa-caret-down');
            }
            if (batterycapacity > 50) {
                $('#batterycharging').addClass('bg-color-green');
            } else if (batterycapacity > 20) {
                $('#batterycharging').addClass('bg-color-orange');
            } else {
                $('#batterycharging').addClass('bg-color-red');
            }
            $('#batterytemp').text(data.BatteryTemp);
            $('#panelstatus').removeClass('glyphicon-ok-cirle');
            $('#panelstatus').removeClass('glyphicon-remove-cirle');
            if (data['Status Solar'] === 'OK') {
                $('#panelstatus').addClass('glyphicon-ok-circle');
            } else {
                $('#panelstatus').addClass('glyphicon-remove-circle');
            }
        };

        var activate_light = function (key, brightness) {
            var lightbulb = $('#hue_' + key);
            lightbulb.find('i').addClass('txt-color-bulb-active');
            lightbulb.find('.badge').addClass('bg-color-bulb-active');
            $('#hue_' + key + '_knob').knob({
                release: function (value) {
                    window.socket.send(
                        JSON.stringify({hue: {'id': key, 'bri': value}})
                    );
                },
            });
        };

        var deactivate_light = function (key, brightness) {
            var lightbulb = $('#hue_' + key);
            lightbulb.find('i').removeClass('txt-color-bulb-active');
            lightbulb.find('.badge').removeClass('bg-color-bulb-active');
            $('#hue_' + key).find('div').remove();
            if (!isUndefinedOrNull(brightness)) {
                $('#hue_' + key).prepend('<input style="width: 80px; visibility: hidden; height: 80px;" id="hue_'+ key + '_knob" class="knob" data-width="80" data-height="80" data-min="0" data-max="254" data-fgColor="#FF9F01" data-angleOffset=-125 data-angleArc=250 value="' + brightness + '" data-thickness=.3>');
            }
        };

        window.toggle_light = function (key, brightness) {
            var lightbulb = $('#hue_' + key),
                is_on = lightbulb.find('i').hasClass('txt-color-bulb-active');
            if (is_on) {
                deactivate_light(key, brightness);
            } else {
                activate_light(key, brightness);
            }
            window.socket.send(JSON.stringify({'hue': {'id': key, 'on': !is_on}}));
        };

        window.go_to_bed = function () {
            window.socket.send(JSON.stringify({'hue': {'id': 4, 'on': false}}));
            deactivate_light(4);
            window.socket.send(JSON.stringify({'hue': {'id': 8, 'on': false}}));
            deactivate_light(8, window.hue_lights['8'].bri);
            window.socket.send(JSON.stringify({'hue': {'id': 7, 'on': true}}));
            activate_light(7);
            window.socket.send(JSON.stringify({'helios': {'stufe': 1}}));
        };

        window.switch_pv_charts = function () {
            $('.pvhistory_pagination').toggle();
            $('#pvchart-history').toggle();
            $('#pvchart').toggle();
        };

        window.socket = new WebSocket('ws://' + window.location.hostname + '/wsapp/');

        window.socket.onopen = function(e) {
            console.log("[open] Connection established, send -> server");
        };

        var handle_vicare = function (data) {
            console.log(data);
            var color = '#999999';
            if (data.hot_water_charging) {
                color = '#BD362F';
            }
            $(
                ['hot_water_current', ]
            ).each(function (i, key) {
                $('#' + key).text(Math.round(data[key]));
                $('#' + key + '_tendency').removeClass('fa-caret-down');
                $('#' + key + '_tendency').removeClass('fa-caret-up');
                $('#' + key + '_tendency').removeClass('fa-caret-right');
                $('#' + key + '_tendency').addClass(
                    'fa-caret-' + data[key + '_tendency']
                );
            });

            $('#vicare_burner_active').removeClass('txt-color-red');
            if (data.burner_active) {
                $('#vicare_burner_active').addClass('txt-color-red');
            }

            $('#vicare_warm_water').empty();
            $('#vicare_warm_water').append(
                '<input class="knob" data-width="80" data-height="80" data-min="50" data-max="70" data-fgColor="' + color + '" data-angleOffset=-125 data-angleArc=250 value="' + data.hot_water_config + '" data-thickness=.3>'
            );
            $('#vicare_warm_water').find('input').knob({
                release: function (value) {
                    window.socket.send(
                        JSON.stringify({'vicare': {'hot_water': value}})
                    );
                },
            });

            $('#solarpumpactive').parent().removeClass('bg-color-red');
            $('#solarpumpactive').parent().removeClass('bg-color-green');
            if (data.solar_pump_active) {
                $('#solarpumpactive').parent().addClass('bg-color-green');
            } else {
                $('#solarpumpactive').parent().addClass('bg-color-red');
            }
            $('#solarcollecttemp').text(round(data.solar_collector_temp, 1));

        };

        var handle_tado = function (data) {
            window.tado_zones = data;
            $('#tado_container').empty();
            $.each(data, function (key, v) {
                if (key === 'DeviceClass') {
                    return;
                }
                var color = '#999999';
                if (v.heating_power > 50) {
                    color = '#BD362F';
                } else if (v.heating_power > 0) {
                    color = '#FF9F01';
                }

                var zone = '<div class="col-xs-4 col-sm-4 col-md-4 text-center" style="height: 100px">';
                zone += '<span id="tado_' + key + '" style="position: relative; display: inline-grid; width: 80px" class="">';
                zone += '<input style="width: 80px; height: 80px;" id="tado_'+ key + '_knob" class="knob" data-width="80" data-height="80" data-min="16" data-max="25" data-fgColor="' + color + '" data-angleOffset=-125 data-angleArc=250 value="' + v.dest_temp + '" data-thickness=.3>';
                zone += '<span class="tado_current label"><span class="badge-xxs txt-color-red">' + round(v.curr_temp, 1) + '</span><span class="badge-xxs txt-color-blue">' + round(v.curr_humi, 1) + '</span></span>';
                zone += '<br><small class="font-xs"><sup style="top: 0em;"><span class="badge" style="margin-top: -65px; background-color: ' + color + '">' + v.name + '</span></sup></small>';
                zone += '</span>';
                zone += '</div>';

                $('#tado_container').append(zone);
                $('#tado_' + key + '_knob').knob({
                    release: function (value) {
                        window.socket.send(
                            JSON.stringify({tado: {'zone': key, 'dest_temp': value}})
                        );
                    },
                });
            });
        };

        var handle_hue = function (data) {
            window.hue_lights = data;
            $('#hue_container').empty();
            $.each(data, function (key, v) {
                if (key === 'DeviceClass') {
                    return;
                }
                var bulb = '<div class="col-xs-4 col-sm-4 col-md-4  text-center" style="height: 94px">';
                bulb += '<span id="hue_' + key + '" style="position: relative; display: inline-grid; width: 80px" class="">';
                if (!isUndefinedOrNull(v.bri)) {
                    bulb += '<input style="width: 80px; visibility: hidden; height: 80px;" id="hue_'+ key + '_knob" class="knob" data-width="80" data-height="80" data-min="0" data-max="254" data-fgColor="#FF9F01" data-angleOffset=-125 data-angleArc=250 value="' + v.bri + '" data-thickness=.3>';
                    bulb += '<i onclick="javascript: window.toggle_light(' + key + ', ' + v.bri +');"  class="fas fa-lightbulb txt-color-black" style="position: absolute; left: 30px; top: 24px; font-size: 30px;"></i>';
                } else {
                    bulb += '<i onclick="javascript: window.toggle_light(' + key + ', ' + v.bri +');"  class="fas fa-lightbulb txt-color-black" style="height: 90px; display: block; font-size: 30px; height: 80px; width: 80px; padding-top: 24px"></i>';
                }
                bulb += '<br><small class="font-xs"><sup style="top: 0em;"><span class="badge" style="margin-top: -65px;">' + v.name + '</span></sup></small>';
                bulb += '</span>';
                bulb += '</div>';

                $('#hue_container').append(bulb);

                if (v.on) {
                    activate_light(key, v.bri);
                }
            });
        };

        var handle_motd = function (data) {
            $('#motd_quote').text(data.quote);
            $('#motd_author').text(data.author);
        };

        window.socket.onmessage = function(event) {
            var timestamp = Date.now(),
                data = JSON.parse(event.data);

            if (data.DeviceClass === 'Weather') {
                handle_weather(data);
            } else if (data.DeviceClass === 'Corona') {
                handle_corona(data);
            } else if (data.DeviceClass === 'Helios') {
                handle_helios(data);
            } else if (data.DeviceClass === 'RSS') {
                handle_rss(data);
            } else if (data.DeviceClass === 'PV') {
                handle_pv(data);
            } else if (data.DeviceClass === 'PVSums') {
                handle_pvsums(data);
            } else if (data.DeviceClass === 'Hue') {
                handle_hue(data);
            } else if (data.DeviceClass === 'MOTD') {
                handle_motd(data);
            } else if (data.DeviceClass === 'Tado') {
                handle_tado(data);
            } else if (data.DeviceClass === 'ViCare') {
                handle_vicare(data);
            } else if (data.DeviceClass === 'WIFI') {
                handle_wifi(data);
            } else {
                alert('ERROR: Unknown DeviceClass ' + data.DeviceClass);
                console.log(data);
            }
        };

        window.socket.onclose = function(event) {
            if (event.wasClean) {
                alert('[close] Connection closed cleanly');
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                alert('[close] Connection died');
            }
        };

        window.socket.onerror = function(error) {
            alert('[error] ' + error.message);
        };

        /* last updated counter */
        var tick = function() {
            window.ticks += 1;
            // Fullscreen bug
            if ($('#jarviswidget-fullscreen-mode').length == 0) {
                $('#tado_container').css('height', '203px');
                $('#tado_container').css('padding-top', '5px');
            }

            var now = new Date();
            var day = days[ now.getDay() ];
            var month = months[ now.getMonth() ];
            $('#current_date').html(
                day + ', der ' +
                now.getDate() + '. ' + month + ' ' + now.getFullYear() +
                ' ' + String(now.getHours()).padStart(2, "0") + ':' +
                String(now.getMinutes()).padStart(2, "0")
            );
        };
}(jQuery));
