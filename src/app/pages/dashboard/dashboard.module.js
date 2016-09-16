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
        .controller('DashboardCtrl', ['$rootScope', '$scope', 'layoutColors', 'layoutPaths', '$filter', 'Map','RestApi', '$state',
            function($rootScope, $scope, layoutColors, layoutPaths, $filter, Map, RestApi, $state) {
                $scope.pacientes_totales = 0;
                $scope.pacientes_riesgo = 0;
                $scope.pacientes_sin_riesgo = 0;
                RestApi.getDashboard()
                    .then(function (result) {
                        $scope.pacientes_totales = result.total;
                        $scope.pacientes_riesgo = result.enRiesgo;
                        $scope.pacientes_sin_riesgo = result.sinRiesgo;
                        $scope.alertas = result.alertas;
                        $scope.loadChart(result.riskPerAge);
                    })
                    .catch(function(error){

                    });

                $scope.scrollbarConfig = {
                    autoHideScrollbar: false,
                    theme: 'dark',
                    scrollInertia: 400,
                    axis: 'y'
                };

                // Variables
                $scope.citiesList = [];
                $scope.insights = [];

                $scope.geocodeCities = function() {
                    Map.GeocodeSet($scope.citiesList);
                };

                $scope.calcularRiesgoTotal = function(){
                  var continueTo = confirm('Esta acción puede tardar algunos minutos, ¿Está seguro de continuar?');

                    if(continueTo){
                        $state.go('calcularRiesgoTotal');
                    }
                };



                // Load the daily revenue bar chart component
                $scope.loadChart = function(data) {
                    var new_data = [];
                    data.map(function (currentValue,index,arr) {
                        new_data.push({count: parseInt(currentValue.count), edad: parseInt(currentValue.edad)});
                    });

                    console.log(data);
                    console.log(new_data);
                    // Risk per age chart
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
                        dataProvider: new_data,
                        valueAxes: [{
                            axisAlpha: 0,
                            position: 'right',
                            title: 'Cantidad de Pacientes',
                            gridAlpha: 0.5,
                            gridColor: '#00AFBF'
                        }],
                        startDuration: 1,
                        graphs: [{
                            fillColorsField: 'color',
                            fillAlphas: 1,
                            lineAlpha: 0.2,
                            type: 'column',
                            valueField: 'count'
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
                        categoryField: 'edad',
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