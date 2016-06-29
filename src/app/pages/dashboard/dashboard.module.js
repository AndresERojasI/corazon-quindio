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
                        order: 0,
                    },
                    controller: 'DashboardCtrl',
                    data: {
                        requireLogin: true
                    }
                });
        })
        .controller('DashboardCtrl', ['$rootScope', '$scope', 'AnalyticsService', 'layoutColors', 'layoutPaths', 'leafletData',
            function($rootScope, $scope, AnalyticsService, layoutColors, layoutPaths, leafletData) {

                $scope.scrollbarConfig = {
                    autoHideScrollbar: false,
                    theme: 'dark',
                    scrollInertia: 400,
                    axis: 'y'
                }

                if ($rootScope.dashboardCalculated || AnalyticsService.informationLoaded) {
                    AnalyticsService.calculateDashboard($scope);
                } else {
                    //Intercept the Loaded information action
                    $rootScope.$on('informationLoaded', function() {
                        AnalyticsService.calculateDashboard($scope);
                        $rootScope.dashboardCalculated = true;
                    });
                }


                // Leaflet Map configuration
                L.Icon.Default.imagePath = 'images'
                L.DomUtil.TRANSITION = true;
                angular.extend($scope, {
                    center: {
                        lat: 51.505,
                        lng: -0.09,
                        zoom: 8
                    },
                    defaults: {
                        tileLayer: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                        minZoom: 0,
                        maxZoom: 15,
                        continuousWorld: true,
                        tileLayerOptions: {
                            opacity: 0.9,
                            detectRetina: true,
                            reuseTiles: true,
                        },
                        scrollWheelZoom: true,
                        invalidateSize: false,
                        markerZoomAnimation: true
                    }
                });

                leafletData.getMap().then(function(map) {
                    $scope.mapInstance = map;
                });

                // Variables
                $scope.citiesList = [];
                $scope.insights = [];

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
                }, ];

                // Load the daily revenue bar chart component
                $scope.loadChart = function(data) {
                    // Daily revenue Chart
                    var barChart = AmCharts.makeChart('barChart', {
                        type: 'serial',
                        theme: 'blur',
                        color: layoutColors.defaultText,
                        "chartScrollbar": {
                            scrollbarHeight: 10
                        },
                        mouseWheelZoomEnabled: true,
                        export: {
                            enabled: true,
                            menu: [{
                                format: "JPG",
                                label: "Save as JPG",
                                title: "Export chart to JPG",
                            }, "PNG"]
                        },
                        dataProvider: data,
                        valueAxes: [{
                            axisAlpha: 0,
                            position: 'right',
                            title: 'Revenue (€)',
                            gridAlpha: 0.5,
                            gridColor: layoutColors.border,
                        }],
                        startDuration: 1,
                        graphs: [{
                            balloonText: '<b>[[category]]: &euro;[[value]]</b>',
                            fillColorsField: 'color',
                            fillAlphas: 1,
                            lineAlpha: 0.2,
                            type: 'column',
                            valueField: 'revenue'
                        }],
                        chartCursor: {
                            categoryBalloonEnabled: false,
                            cursorAlpha: 0,
                            zoomable: true
                        },
                        categoryField: 'date',
                        categoryAxis: {
                            gridPosition: 'start',
                            labelRotation: 45,
                            gridAlpha: 0.5,
                            gridColor: layoutColors.border,
                        },
                        pathToImages: 'assets/img/'
                    });
                };
            }
        ]);

})();