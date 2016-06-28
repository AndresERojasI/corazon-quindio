/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function() {
    'use strict';

    angular.module('ROA.pages.performance', [])
        .config(function($stateProvider) {
            $stateProvider
                .state('performance', {
                    url: '/performance',
                    templateUrl: 'app/pages/performance/performance.html',
                    title: 'Performance',
                    sidebarMeta: {
                        icon: 'ion-android-home',
                        order: 0,
                    },
                    controller: 'PerformanceCtrl',
                    data: {
                        requireLogin: true
                    }
                });
        })
        .controller('PerformanceCtrl', ['$rootScope', '$scope', 'AnalyticsService', 'layoutColors', 'layoutPaths', '$filter',
            function($rootScope, $scope, AnalyticsService, layoutColors, layoutPaths, $filter) {

                // First filter
                $scope.first_filter = 'network';
                $scope.setFirstFilter = function(newFilter){

                    $scope.first_filter = newFilter;
                    if($scope.first_filter === $scope.second_filter.filter){
                        $scope.second_filter = {title: 'Combine With', filter: false};
                    }

                    AnalyticsService.calculatePerformance($scope);
                    
                };

                // Second filter
                $scope.second_filter = {title: 'Combine With', filter: false};
                $scope.setSecondFilter = function(newFilter){

                    $scope.second_filter = {title: 'Combine With', filter: false};
                    if($scope.first_filter !== $scope.second_filter.filter){
                        $scope.second_filter = newFilter;
                    }

                    AnalyticsService.calculatePerformance($scope);
                };

                // Third filter
                $scope.third_filter = 'users';
                $scope.setThirdFilter = function(newFilter){
                    $scope.third_filter = newFilter;

                    AnalyticsService.calculatePerformance($scope);
                };

                $scope.cost_per_user = 0;
                $scope.cost_per_new_user = 0;
                $scope.cost_per_conversion = 0;


                if($rootScope.performanceCalculated || AnalyticsService.informationLoaded){
                    AnalyticsService.calculatePerformance($scope);
                }else{
                    //Intercept the Loaded information action
                    $rootScope.$on('informationLoaded', function(){
                        AnalyticsService.calculatePerformance($scope);
                        $rootScope.performanceCalculated = true;
                    });
                }

                // Define the list of available columns and the default ones
                $scope.tableColumns = {
                    name: {
                        title: 'Name',
                        enabled: true,
                        searchable: true,
                        count: 'Total'
                    },
                    ads: {
                        title: 'Ads',
                        enabled: true,
                        searchable: true,
                        count: 0
                    },
                    budget: {
                        title: 'Budget',
                        enabled: true,
                        searchable: true,
                        count: 0
                    },
                    roi: {
                        title: 'ROI',
                        enabled: false,
                        searchable: true,
                        count: 0
                    },
                    revenue: {
                        title: 'Revenue',
                        enabled: true,
                        searchable: true,
                        count: 0
                    },
                    users: {
                        title: 'Returning Visitors',
                        enabled: false,
                        searchable: true,
                        count: 0
                    },
                    new_users: {
                        title: 'New Visitors',
                        enabled: true,
                        searchable: true,
                        count: 0
                    },
                    conversions: {
                        title: 'Conversions',
                        enabled: true,
                        searchable: true,
                        count: 0
                    }
                };

                $scope.displayColumn = function(column_id){
                    $scope.tableColumns[column_id].enabled = !$scope.tableColumns[column_id].enabled;
                }

                $scope.needFormat = [
                    'budget',
                    'roi',
                    'revenue'
                ];

                // Handle the update of the totals
                $scope.setPerformanceTotals = function(totals) {
                    for (var data in totals) {
                        if ($scope.tableColumns[data]) {

                            $scope.tableColumns[data].count = parseFloat(Math.round(totals[data] * 100) / 100).toFixed(2);
                            if ($scope.needFormat.indexOf(data) > -1) {
                                $scope.tableColumns[data].count = $filter('currency')($scope.tableColumns[data].count, '€', 2);
                            }

                        }
                    }

                    $scope.cost_per_user = totals.cpu;
                    $scope.cost_per_new_user = totals.cpnu;
                    $scope.cost_per_conversion = totals.cpc;
                }


                $scope.enableChart = function(data){
                    var chart = AmCharts.makeChart("bubble-chart", {
                        "type": "xy",
                        "balloon": {
                            "fixedPosition": false,
                        },
                        "pathToImages": "assets/img/",
                        "dataProvider": data,
                        "valueAxes": [{
                            "position": "bottom",
                            "axisAlpha": 0
                        }, {
                            //"minMaxMultiplier": 1.2,
                            "axisAlpha": 0,
                            "position": "left",
                            "unit": "€",
                            "title": "Avg Cost per Conversion",
                            "titleColor" : "#666666"
                        }],
                        //"startDuration": 1.5,
                        "graphs": [{
                            "balloonText": "<b>[[title]]</b><br>Conversions:<b>[[x]]</b><br> Cost Per Conversion:<b>[[y]]</b>",
                            "bullet": "circle",
                            "bulletBorderAlpha": 0.2,
                            "bulletAlpha": 0.8,
                            "lineAlpha": 0,
                            "fillAlphas": 0,
                            "valueField": "value",
                            "xField": "x",
                            "yField": "y",
                            "maxBulletSize": 100,
                        }],
                        "marginLeft": 0,
                        "marginBottom": 0,
                        "export": {
                            "enabled": true
                        },
                        maxZoomFactor: 15,
                        "chartScrollbar": {},
                        "chartCursor": {}
                    });

                    chart.pathToImages = "assets/img/";

                    $scope.name_search_box = '';

                    chart.addListener("clickGraphItem", function(event) {
                        var input = document.getElementById("name_search_box");
                        angular.element(input).val(event.item.dataContext.title).trigger('input');
                    });

                    // init object to hold chart zoom
                    chart.zoomValues = {
                        x: { startValue: 0, endValue: 0 },
                        y: { startValue: 0, endValue: 0 }
                    };
                };

                //chart.addLabel(3,320,'','left', 12, '#666666', -90 );

                $scope.smartTablePageSize = 10;

                $scope.resultCollection = [];


            }
        ]);

})();