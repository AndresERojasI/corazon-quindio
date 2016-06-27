/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function() {
    'use strict';

    angular.module('ROA.pages.roi', [])
        .config(function($stateProvider) {
            $stateProvider
                .state('roi', {
                    url: '/roi',
                    templateUrl: 'app/pages/roi/roi.html',
                    title: 'Roi',
                    sidebarMeta: {
                        icon: 'ion-android-home',
                        order: 0,
                    },
                    controller: 'RoiCtrl',
                    data: {
                        requireLogin: true
                    }
                });
        })
        .controller('RoiCtrl', ['$rootScope', '$scope', 'AnalyticsService',
            function($rootScope, $scope, AnalyticsService) {

                // First filter
                $scope.first_filter = 'network';
                $scope.setFirstFilter = function(newFilter) {

                    $scope.first_filter = newFilter;
                    if ($scope.first_filter === $scope.second_filter.filter) {
                        $scope.second_filter = {
                            title: 'Combine With',
                            filter: false
                        };
                    }

                    AnalyticsService.calculateRoi($scope);

                };

                // Second filter
                $scope.second_filter = {
                    title: 'Combine With',
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

                    AnalyticsService.calculateRoi($scope);
                };

                // Third filter
                $scope.third_filter = 'users';
                $scope.third_filter_text = 'Returning Visitors';
                $scope.fourth_filter = 'cpu';
                $scope.fourth_filter_text = 'Cost per Visitor';

                $scope.setThirdFilter = function(newFilter) {
                    switch ($scope.third_filter) {
                        case 'users':
                            $scope.third_filter_text = 'Returning Visitors';
                            $scope.fourth_filter = 'cpu';
                            $scope.fourth_filter_text = 'Cost per Visitor';
                            break;
                        case 'new_users':
                            $scope.third_filter_text = 'New Visitors';
                            $scope.fourth_filter = 'cpnu';
                            $scope.fourth_filter_text = 'Cost per New Visitor';
                            break;
                        case 'conversions':
                            $scope.third_filter_text = 'Conversions';
                            $scope.fourth_filter = 'cpc';
                            $scope.fourth_filter_text = 'Cost per Conversion';
                            break;
                    }
                    $scope.third_filter = newFilter;

                    AnalyticsService.calculateRoi($scope);
                };

                $scope.cost_per_user = 0;
                $scope.cost_per_new_user = 0;
                $scope.cost_per_conversion = 0;


                if ($rootScope.performanceCalculated || AnalyticsService.informationLoaded) {
                    AnalyticsService.calculateRoi($scope);
                } else {
                    //Intercept the Loaded information action
                    $rootScope.$on('informationLoaded', function() {
                        AnalyticsService.calculateRoi($scope);
                        $rootScope.performanceCalculated = true;
                    });
                }

                // Load bar chart
                $scope.loadBarChart = function(treemapData) {
                    var barChart = AmCharts.makeChart('barChart', {
                        "type": "serial",
                        "theme": "light",
                        "categoryField": "name",
                        "rotate": true,
                        "startDuration": 1,
                        "categoryAxis": {
                            "gridPosition": "start",
                            "position": "left"
                        },
                        "graphs": [{
                            "balloonText": "[[conversion_text]]:[[value]]",
                            "fillAlphas": 0.8,
                            "id": "AmGraph-1",
                            "lineAlpha": 0.2,
                            "title": "Income",
                            "type": "column",
                            "valueField": "value"
                        }],
                        "guides": [],
                        "valueAxes": [{
                            "id": "ValueAxis-1",
                            "position": "top",
                            "axisAlpha": 0
                        }],
                        "allLabels": [],
                        "balloon": {},
                        "titles": [],
                        "dataProvider": treemapData,
                        "export": {
                            "enabled": true
                        }

                    });
                }
            }
        ]);

})();