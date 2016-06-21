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
                $scope.setFirstFilter = function(newFilter) {

                    $scope.first_filter = newFilter;
                    AnalyticsService.calculateTrends($scope);

                };

                // Second filter
                $scope.second_filter = {
                    title: 'Select Option',
                    filter: false
                };
                $scope.setSecondFilter = function(newFilter) {

                    $scope.second_filter = {
                        title: 'Combine With',
                        filter: false
                    };
                    if ($scope.first_filter !== $scope.second_filter.filter) {
                        $scope.second_filter = newFilter;
                    }

                    AnalyticsService.calculateTrends($scope);
                };

                // Third filter
                $scope.third_filter = 'users';
                $scope.setThirdFilter = function(newFilter) {
                    $scope.third_filter = newFilter;

                    AnalyticsService.calculateTrends($scope);
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

                $scope.createUsersChart = function(data) {
                    var chart = AmCharts.makeChart("chartdiv", {
                        "type": "serial",
                        "theme": "none",
                        "marginRight": 80,
                        "autoMarginOffset": 20,
                        "marginTop": 7,
                        "dataProvider": data,
                        "mouseWheelZoomEnabled": true,
                        "valueAxes": [{
                            "axisAlpha": 0.2,
                            "dashLength": 1,
                            "position": "left"
                        }],
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
                            "autoGridCount": true,
                            "graph": "g1",
                            "scrollbarHeight": 40
                        },
                        "chartCursor": {
                            "categoryBalloonEnabled": true
                        },
                        "categoryField": "month",
                        "categoryAxis": {
                            "parseDates": false,
                            "axisColor": "#DADADA",
                            "dashLength": 1,
                            "minorGridEnabled": true,
                            "labelsEnabled": true,
                            "tickLength": 0
                        },
                        "export": {
                            "enabled": true
                        }
                    });

                    return chart;
                };

                $scope.createCostsChart = function(data) {
                    var chart1 = AmCharts.makeChart("chartdiv2", {
                        "type": "serial",
                        "theme": "none",
                        "marginRight": 80,
                        "autoMarginOffset": 20,
                        "marginTop": 3,
                        "dataProvider": data,
                        "valueAxes": [{
                            "axisAlpha": 0.2,
                            "dashLength": 1,
                            "position": "left"
                        }],
                        "mouseWheelZoomEnabled": true,
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
                        "chartCursor": {
                            "categoryBalloonEnabled": true
                        },
                        "categoryField": "month",
                        "categoryAxis": {
                            "parseDates": false,
                            "axisColor": "#DADADA",
                            "dashLength": 1,
                            "minorGridEnabled": true,
                            "labelsEnabled": false,
                            "tickLength": 0
                        },
                        "export": {
                            "enabled": true
                        }
                    });

                    return chart1;
                };

                $scope.createTotalsChart = function(data) {
                    var chart2 = AmCharts.makeChart("chartdiv3", {
                        "type": "serial",
                        "theme": "none",
                        "marginRight": 80,
                        "autoMarginOffset": 20,
                        "marginTop": 3,
                        "dataProvider": data,
                        "valueAxes": [{
                            "axisAlpha": 0.2,
                            "dashLength": 1,
                            "position": "left"
                        }],
                        "mouseWheelZoomEnabled": true,
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
                            }
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
                            }
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
                            }
                        }],
                        "chartCursor": {
                            "categoryBalloonEnabled": true
                        },
                        "categoryField": "month",
                        "categoryAxis": {
                            "parseDates": false,
                            "axisColor": "#DADADA",
                            "dashLength": 1,
                            "minorGridEnabled": true,
                            "labelsEnabled": false,
                            "tickLength": 0
                        },
                        "export": {
                            "enabled": true
                        }
                    });
                    console.log(chart2);
                    return chart2;
                };

                $scope.syncCharts = function(charts) {
                    for (var x in charts) {
                        charts[x].addListener("zoomed", function syncZoom(event) {
                            for (x in charts) {
                                if (charts[x].ignoreZoom) {
                                    charts[x].ignoreZoom = false;
                                }
                                if (event.chart != charts[x]) {
                                    charts[x].ignoreZoom = true;
                                    charts[x].zoomToDates(event.startDate, event.endDate);
                                }
                            }
                        });

                        charts[x].addListener("init", function(event) {
                            event.chart.chartCursor.addListener("changed", function(event) {
                                for (var x in charts) {
                                    if (event.chart != charts[x]) {
                                        if (event.position) {
                                            console.log(event.position);
                                            charts[x].chartCursor.isZooming(event.target.zooming);
                                            charts[x].chartCursor.selectionPosX = event.target.selectionPosX;
                                            charts[x].chartCursor.forceShow = true;
                                            charts[x].chartCursor.setPosition(event.position, false, event.target.index);
                                        }
                                    }
                                }
                            });

                            event.chart.chartCursor.addListener("onHideCursor", function() {
                                for (var x in charts) {
                                    if (charts[x].chartCursor.hideCursor) {
                                        charts[x].chartCursor.forceShow = false;
                                        charts[x].chartCursor.hideCursor(false);
                                    }
                                }
                            });
                        });
                    }
                }

            }
        ]);

})();