/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function() {
    'use strict';

    angular.module('ROA.pages.dashboard', [])
        .config(function($stateProvider) {
            $stateProvider
                .state('dashboard', {
                    url: '/dashboard',
                    templateUrl: 'app/pages/dashboard/dashboard.html',
                    title: 'Dashboard',
                    sidebarMeta: {
                        icon: 'ion-android-home',
                        order: 0
                    },
                    controller: 'DashboardCtrl',
                    data: {
                        requireLogin: true
                    }
                });
        })
        .controller('DashboardCtrl', ['$rootScope', '$scope', 'AnalyticsService', 'layoutColors', 'layoutPaths', '$filter', 'Map',
            function($rootScope, $scope, AnalyticsService, layoutColors, layoutPaths, $filter, Map) {

                $scope.scrollbarConfig = {
                    autoHideScrollbar: false,
                    theme: 'dark',
                    scrollInertia: 400,
                    axis: 'y'
                };

                if ($rootScope.dashboardCalculated || AnalyticsService.informationLoaded) {
                    AnalyticsService.calculateDashboard($scope);
                } else {
                    //Intercept the Loaded information action
                    $rootScope.$on('informationLoaded', function() {
                        AnalyticsService.calculateDashboard($scope);
                        $rootScope.dashboardCalculated = true;
                    });
                }

                // Variables
                $scope.citiesList = [];
                $scope.insights = [];

                $scope.geocodeCities = function() {
                    Map.GeocodeSet($scope.citiesList);
                };

                // Budget efficiency
                $scope.revenue = 0;
                $scope.costPerConversion = 0;
                $scope.roi = 0;
                $scope.dailyDataStore = [];

                $scope.upperLimit = 100;
                $scope.lowerLimit = 0;
                $scope.unit = "%";
                $scope.precision = 0;
                $scope.ranges = [{
                    min: 0,
                    max: 30,
                    color: '#C50200'
                }, {
                    min: 30,
                    max: 70,
                    color: '#FDC702'
                }, {
                    min: 70,
                    max: 100,
                    color: '#8DCA2F'
                }];

                // Load the daily revenue bar chart component
                $scope.loadChart = function(data) {
                    // Daily revenue Chart
                    var barChart = AmCharts.makeChart('barChart', {
                        type: 'serial',
                        theme: 'blur',
                        color: layoutColors.defaultText,
                        chartScrollbar: {
                            scrollbarHeight: 10
                        },
                        mouseWheelZoomEnabled: true,
                        "export": {
                            "enabled": true
                        },
                        dataProvider: data,
                        valueAxes: [{
                            axisAlpha: 0,
                            position: 'right',
                            title: 'Revenue ('+$rootScope.userSettings.currency+')',
                            gridAlpha: 0.5,
                            gridColor: '#00AFBF'
                        }],
                        startDuration: 1,
                        graphs: [{
                            balloonFunction: function(graphDataItem, graph) {
                                var newDate = graphDataItem.dataContext.visitDate.format('dddd, MMMM DD, YYYY');
                                var newRevenue = $filter('currency')(graphDataItem.dataContext.revenue, $rootScope.userSettings.currency, 2);
                                return [newDate,
                                    '<br>',
                                    'Revenue:',
                                    newRevenue
                                ].join('\n');
                            },
                            fillColorsField: 'color',
                            fillAlphas: 1,
                            lineAlpha: 0.2,
                            type: 'column',
                            valueField: 'revenue'
                        }],
                        chartCursor: {
                            categoryBalloonEnabled: true,
                            cursorAlpha: 1,
                            zoomable: true,
                            cursorColor: '#ff0000',
                            selectionAlpha: 0.5
                        },
                        chartCursorSettings: {

                        },
                        categoryField: 'date',
                        categoryAxis: {
                            gridPosition: 'start',
                            labelRotation: 45,
                            gridAlpha: 1,
                            gridColor: layoutColors.border
                        },
                        pathToImages: 'assets/img/'
                    });
                };
            }
        ]);

})();