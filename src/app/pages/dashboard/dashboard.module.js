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

                $scope.citiesList = [];
                $scope.insights = [];
                //Starting values at 0
                $scope.revenue = 0;
                $scope.costPerConversion = 0;
                $scope.roi = 0;
                $scope.dailyDataStore = [];

                $scope.budgetEfficiency = 0;
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


                // Daily revenue Chart
                var barChart = AmCharts.makeChart('barChart', {
                    type: 'serial',
                    theme: 'blur',
                    color: layoutColors.defaultText,
                    export: {
                        enabled: true,
                        menu: [{
                            format: "JPG",
                            label: "Save as JPG",
                            title: "Export chart to JPG",
                        }, "PNG"]
                    },
                    dataProvider: $scope.dailyDataStore,
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
                    pathToImages: layoutPaths.images.amChart
                });

                // listen for the event in the relevant $rootScope
                $scope.$on('loadChart', function(event, data) {
                    barChart.dataProvider = data.dataset;
                    barChart.validateData();
                });


                // listen for the event in the relevant $rootScope
                $rootScope.$on('informationLoaded', function(event, data) {
                    AnalyticsService.calculateDashboard($scope)
                        .then(function(result) {

                        })
                        .catch(function(error) {
                            console.log('Error');
                            console.log(error);
                        });
                });
            }
        ]);

})();