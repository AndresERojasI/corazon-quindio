/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function() {
    'use strict';

    angular.module('ROA.pages.trends', [])
        .config(function($stateProvider) {
            $stateProvider
                .state('trends', {
                    url: '/trends',
                    templateUrl: 'app/pages/trends/trends.html',
                    title: 'Trends',
                    sidebarMeta: {
                        icon: 'ion-android-home',
                        order: 0,
                    },
                    controller: 'TrendsCtrl',
                    data: {
                        requireLogin: true
                    }
                });
        })
        .controller('TrendsCtrl', ['$rootScope', '$scope', 'AnalyticsService', 'layoutColors', 'layoutPaths', '$filter',
            function($rootScope, $scope, AnalyticsService, layoutColors, layoutPaths, $filter) {

                // First filter
                $scope.first_filter = 'hour';
                $scope.categoryField = $scope.first_filter;
                $scope.dateFormat = 'H';
                $scope.parseDate = false;
                $scope.setFirstFilter = function(newFilter) {
                    $scope.trendsResult = undefined;

                    $scope.first_filter = newFilter;
                    $scope.categoryField = $scope.first_filter;
                    switch (newFilter) {
                        case 'hour':
                            $scope.dateFormat = 'H';
                            $scope.parseDate = false;
                            break;
                        case 'day':
                            $scope.dateFormat = null;
                            $scope.parseDate = false;
                            break;
                        case 'week':
                            $scope.dateFormat = null;
                            $scope.parseDate = false;
                            break;
                        case 'month':
                            $scope.categoryField = 'visit_time';
                            $scope.dateFormat = 'MMMM';
                            $scope.parseDate = true;
                            break;
                    }

                    $scope.zoomFilterStart = undefined;
                    $scope.zoomFilterEnd = undefined;

                    AnalyticsService.calculateTrends($scope);

                };

                // Second filter
                $scope.second_filter = {
                    title: 'Returning Visitors',
                    filter: 'users',
                    total: 'total'
                };
                $scope.setSecondFilter = function(newFilter) {

                    $scope.second_filter = newFilter;
                    AnalyticsService.calculateTrendsTable($scope);
                };

                if ($rootScope.trendsCalculated || AnalyticsService.informationLoaded) {
                    AnalyticsService.calculateTrends($scope);
                } else {
                    //Intercept the Loaded information action
                    $rootScope.$on('informationLoaded', function() {
                        AnalyticsService.calculateTrends($scope);
                        $rootScope.trendsCalculated = true;
                    });
                }

                // Users, new users, conversions chart
                $scope.createUsersChart = function(data) {
                    $scope.chart = AmCharts.makeChart("chartdiv", {
                        "type": "serial",
                        "theme": "light",
                        "marginLeft": 70,
                        "dataDateFormat": $scope.dateFormat,
                        "graphs": [{
                            "id": "returning_visitors",
                            "balloonText": "Returning visitors: [[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 0,
                            "lineThickness": 2,
                            "title": "Returning visitors",
                            "valueField": "users",
                            "useLineColorForBulletBorder": true,
                            "lineColor": "#68b828",
                            "balloon": {
                                "drop": true
                            }
                        }, {
                            "id": "new_visitors",
                            "balloonText": "New Users: [[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 0,
                            "lineThickness": 2,
                            "title": "New Users",
                            "valueField": "new_users",
                            "useLineColorForBulletBorder": true,
                            "lineColor": "#04b486",
                            "balloon": {
                                "drop": true
                            }
                        }, {
                            "id": "conversions",
                            "balloonText": "Conversions: [[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 0,
                            "lineThickness": 2,
                            "title": "Conversions",
                            "valueField": "conversions",
                            "useLineColorForBulletBorder": true,
                            "lineColor": "#037e5e",
                            "balloon": {
                                "drop": true
                            }
                        }],
                        "chartScrollbar": {
                            scrollbarHeight: 10
                        },
                        "categoryField": $scope.categoryField,
                        "categoryAxis": {
                            "parseDates": $scope.parseDate,
                            "dashLength": 1,
                            "minorGridEnabled": true
                        },
                        "valueAxes": [{
                            "ignoreAxisWidth": true
                        }],
                        "dataProvider": data,
                        "balloon": {
                            "borderThickness": 1,
                            "shadowAlpha": 0
                        },
                        "chartCursor": {
                            "valueLineEnabled": false,
                            "valueLineBalloonEnabled": true,
                            "cursorAlpha": 1,
                            "valueLineAlpha": 0.2
                        },
                        "autoMarginOffset": 10,
                        "valueScrollbar": {
                            "oppositeAxis": false,
                            "offset": 50,
                            "scrollbarHeight": 10
                        }
                    });

                    return $scope.chart;
                };

                // CPC, CPU, CPN chart
                $scope.createCostsChart = function(data) {
                    $scope.chart1 = AmCharts.makeChart("chartdiv2", {
                        "type": "serial",
                        "theme": "light",
                        "marginLeft": 70,
                        "pathToImages": "http://www.amcharts.com/lib/3/images/",
                        "dataDateFormat": $scope.dateFormat,
                        "graphs": [{
                            "id": "cpu",
                            "balloonText": "Cost per User: [[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 0,
                            "lineThickness": 2,
                            "title": "Cost per User",
                            "valueField": "cpu",
                            "useLineColorForBulletBorder": true,
                            "lineColor": "#ff6060",
                            "bulletSize": 5,
                            "balloon": {
                                "drop": true
                            }
                        }, {
                            "id": "cpnu",
                            "balloonText": "Cost Per New User: [[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 0,
                            "lineThickness": 2,
                            "title": "Cost Per New User",
                            "valueField": "cpnu",
                            "useLineColorForBulletBorder": true,
                            "lineColor": "#a52e2e",
                            "balloon": {
                                "drop": true
                            }
                        }, {
                            "id": "cpc",
                            "balloonText": "Cost Per Conversion: [[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 0,
                            "lineThickness": 2,
                            "title": "Cost Per Conversion",
                            "valueField": "cpc",
                            "useLineColorForBulletBorder": true,
                            "lineColor": "#5b0000",
                            "balloon": {
                                "drop": true
                            }
                        }],
                        "categoryField": $scope.categoryField,
                        "categoryAxis": {
                            "parseDates": $scope.parseDate,
                            "dashLength": 1,
                            "minorGridEnabled": true
                        },
                        "valueAxes": [{
                            "ignoreAxisWidth": true
                        }],
                        "dataProvider": data,
                        "balloon": {
                            "borderThickness": 1,
                            "shadowAlpha": 0
                        },
                        "chartCursor": {
                            "valueLineEnabled": false,
                            "valueLineBalloonEnabled": true,
                            "cursorAlpha": 1,
                            "valueLineAlpha": 0.2
                        },
                        "autoMarginOffset": 10,
                        "valueScrollbar": {
                            "oppositeAxis": false,
                            "offset": 50,
                            "scrollbarHeight": 10
                        }

                    });

                    return $scope.chart1;
                };

                // Ads, budget, revenue chart
                $scope.createTotalsChart = function(data) {
                    $scope.chart2 = AmCharts.makeChart("chartdiv3", {
                        "type": "serial",
                        "theme": "light",
                        "marginLeft": 70,
                        "pathToImages": "http://www.amcharts.com/lib/3/images/",
                        "dataDateFormat": $scope.dateFormat,
                        "graphs": [{
                            "id": "ads",
                            "balloonText": "ADS: [[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 0,
                            "lineThickness": 2,
                            "title": "Cost per User",
                            "valueField": "ads",
                            "useLineColorForBulletBorder": true,
                            "balloon": {
                                "drop": true
                            },
                            "lineColor": '#28aef3'
                        }, {
                            "id": "budget",
                            "balloonText": "budget: [[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 0,
                            "lineThickness": 2,
                            "title": "Cost Per New User",
                            "valueField": "budget",
                            "useLineColorForBulletBorder": true,
                            "balloon": {
                                "drop": true
                            },
                            "lineColor": '#2e81ad'
                        }, {
                            "id": "revenue",
                            "balloonText": "Revenue: [[value]]",
                            "bullet": "round",
                            "bulletBorderAlpha": 1,
                            "bulletColor": "#FFFFFF",
                            "hideBulletsCount": 0,
                            "lineThickness": 2,
                            "title": "Cost Per Conversion",
                            "valueField": "revenue",
                            "useLineColorForBulletBorder": true,
                            "balloon": {
                                "drop": true
                            },
                            "lineColor": '#144158'
                        }],
                        "categoryField": $scope.categoryField,
                        "categoryAxis": {
                            "parseDates": $scope.parseDate,
                            "dashLength": 1,
                            "minorGridEnabled": true
                        },
                        "valueAxes": [{
                            "ignoreAxisWidth": true
                        }],
                        "dataProvider": data,
                        "balloon": {
                            "borderThickness": 1,
                            "shadowAlpha": 0
                        },
                        "chartCursor": {
                            "valueLineEnabled": false,
                            "valueLineBalloonEnabled": true,
                            "cursorAlpha": 1,
                            "valueLineAlpha": 0.2
                        },
                        "autoMarginOffset": 10,
                        "valueScrollbar": {
                            "oppositeAxis": false,
                            "offset": 50,
                            "scrollbarHeight": 10
                        }
                    });
                    return $scope.chart2;
                };

                // Sync the 3 charts zoom
                $scope.syncCharts = function(charts) {
                    for (var x in charts) {
                        charts[x].addListener("zoomed", function (event) {
                            for (var x in charts) {
                                if (charts[x].ignoreZoom) {
                                    charts[x].ignoreZoom = false;
                                }
                                if (event.chart != charts[x]) {
                                    charts[x].ignoreZoom = true;
                                    charts[x].zoomToCategoryValues(event.startValue, event.endValue);
                                }
                            }

                            $scope.zoomFilterStart = event.startValue;
                            $scope.zoomFilterEnd = event.endValue;
                            AnalyticsService.calculateTrendsTotals($scope);

                        });
                    }
                }

                /**
                 * Table logic
                 */
                $scope.total_column_title = 'Total';
                $scope.resultCollection = [];

            }
        ]);





})();