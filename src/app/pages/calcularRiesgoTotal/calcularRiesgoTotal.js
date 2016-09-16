/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function() {
    'use strict';

    angular.module('ROA.pages.calcularRiesgoTotal', [])
        .config(function($stateProvider) {
            $stateProvider
                .state('calcularRiesgoTotal', {
                    url: '/calcularRiesgoTotal',
                    templateUrl: 'app/pages/calcularRiesgoTotal/calcularRiesgoTotal.html',
                    title: 'Calcular Riesgo Total',
                    sidebarMeta: {
                        icon: 'ion-android-home',
                        order: 0
                    },
                    controller: 'CalcularRiesgoTotalCtrl',
                    data: {
                        requireLogin: true
                    }
                });
        })
        .controller('CalcularRiesgoTotalCtrl', ['$rootScope', '$scope', 'layoutColors', 'layoutPaths', '$filter', 'Map','RestApi','$uibModal','$sce',
            function($rootScope, $scope, layoutColors, layoutPaths, $filter, Map, RestApi, $uibModal, $sce) {

                RestApi.getAllPacientes()
                    .then(function (result) {
                        $scope.pacientes = result;
                        $scope.startCalculation();
                    })
                    .catch(function(error){

                    });

                $scope.writeLogEntry = function(message){
                    try{
                        $scope.importLog = $sce.trustAsHtml($scope.importLog + '<p><strong>' + moment().format('YYYY/MM/DD hh:mm:ss a').toString()  + ' >></strong> ' + message + '</p>');
                    }catch(e){
                        console.log(e);
                    }
                };

                $scope.importLog = $sce.trustAsHtml('<h5>log de procesamiento: </h5>');
                $scope.startCalculation = function(){
                    $scope.writeLogEntry('Se ha iniciado el proceso de cálculo');

                    $scope.queryVisita(0);
                };

                $scope.queryVisita = function(i){
                    var doc = $scope.pacientes[i].paciente_doc;
                    $scope.writeLogEntry('Calculando riesgo para el paciente con CC ' + doc + ' y nombre ' + $scope.pacientes[i].paciente_nombre1);

                    if(i >= $scope.pacientes.length){
                        return;
                    }

                    RestApi.getVisitaPaciente(doc)
                        .then(function (visita) {
                            var puntos = [];

                            var edad = parseInt($scope.pacientes[i].edad);

                            if(edad <= 29 || edad > 75){
                                $scope.writeLogEntry('El paciente ' + doc + ' no esta entre los 30 y 74 años');
                                i++;
                                $scope.queryVisita(i);
                            }

                            // Set point for edad
                            if(edad < 34){
                                puntos.push(1);
                            }else if(edad < 40){
                                puntos.push(0);
                            } else if(edad < 45){
                                puntos.push(1);
                            } else if(edad < 50){
                                puntos.push(2);
                            }else if(edad < 55){
                                puntos.push(3);
                            } else if(edad < 60){
                                puntos.push(4);
                            } else if(edad < 65){
                                puntos.push(5);
                            } else if(edad < 70){
                                puntos.push(6);
                            } else if(edad < 75){
                                puntos.push(7);
                            }


                            var diabetes = visita.dx_diabetes.replace(/[']/g, '');
                            switch (diabetes){
                                case 'No Diabetico':
                                    puntos.push(0);
                                    break;
                                default:
                                    puntos.push(2);
                            }

                            var fumador = visita.habito_tabaquismo.replace(/[']/g, '');
                            switch (fumador){
                                case 'No':
                                    puntos.push(0);
                                    break;
                                default:
                                    puntos.push(2);
                            }

                            var colesterol_total = parseInt(visita.paracli_colestotal.replace(/[']/g, ''));
                            if(colesterol_total < 160){
                                puntos.push(-3);
                            }else if(colesterol_total < 200){
                                puntos.push(0);
                            } else if(colesterol_total < 240){
                                puntos.push(1);
                            } else if(colesterol_total < 280){
                                puntos.push(2);
                            } else if(colesterol_total >= 280){
                                puntos.push(3);
                            }

                            var colesterol_hdl = parseInt(visita.paracli_coleshdl.replace(/[']/g, ''));
                            if(colesterol_hdl < 35){
                                puntos.push(2);
                            }else if(colesterol_hdl < 45){
                                puntos.push(1);
                            } else if(colesterol_hdl < 50){
                                puntos.push(0);
                            } else if(colesterol_hdl < 60){
                                puntos.push(0);
                            } else if(colesterol_hdl >= 60){
                                puntos.push(-2);
                            }

                            var pres_sistolica = parseInt(visita.ef_ta_sist.replace(/[']/g, ''));
                            var pres_diastolica = parseInt(visita.ef_ta_sist.replace(/[']/g, ''));


                            if(pres_sistolica < 130 && pres_diastolica < 85){
                                puntos.push(0);
                            }else if(pres_sistolica < 140 && pres_diastolica < 90){
                                puntos.push(1);
                            } else if(pres_sistolica < 160 && pres_diastolica < 100){
                                puntos.push(2);
                            } else if(pres_sistolica > 160 && pres_diastolica > 100){
                                puntos.push(3);
                            }else{
                                puntos.push(0);
                            }

                            var total_puntos = puntos.reduce(function (total, num) {
                                return total + num;
                            });
                            // corrección
                            total_puntos = total_puntos * 0.75;

                            var porcentaje_riesgo = 0;
                            console.log(total_puntos);
                            if(total_puntos <= -2){
                                porcentaje_riesgo = 2;
                            }else if(total_puntos <= 0){
                                porcentaje_riesgo = 3;
                            } else if(total_puntos <= 1){
                                porcentaje_riesgo = 3;
                            } else if(total_puntos <= 2){
                                porcentaje_riesgo = 4;
                            } else if(total_puntos <= 3){
                                porcentaje_riesgo = 5;
                            } else if(total_puntos <= 4){
                                porcentaje_riesgo = 7;
                            } else if(total_puntos <= 5){
                                porcentaje_riesgo = 8;
                            } else if(total_puntos <= 6){
                                porcentaje_riesgo = 10;
                            } else if(total_puntos <= 7){
                                porcentaje_riesgo = 13;
                            } else if(total_puntos <= 8){
                                porcentaje_riesgo = 16;
                            } else if(total_puntos <= 9){
                                porcentaje_riesgo = 20;
                            } else if(total_puntos <= 10){
                                porcentaje_riesgo = 25;
                            } else if(total_puntos <= 11){
                                porcentaje_riesgo = 31;
                            } else if(total_puntos <= 12){
                                porcentaje_riesgo = 37;
                            } else if(total_puntos <= 13){
                                porcentaje_riesgo = 45;
                            } else if(total_puntos <= 14){
                                porcentaje_riesgo = 53;
                            } else if(total_puntos <= 15){
                                porcentaje_riesgo = 53;
                            } else if(total_puntos <= 16){
                                porcentaje_riesgo = 53;
                            } else if(total_puntos >=17){
                                porcentaje_riesgo = 53;
                            }

                            $scope.writeLogEntry('El paciente ' + doc + ' tiene un porcentaje de riesgo de '+porcentaje_riesgo + '%');

                            RestApi.updatePacienteRiesgo(doc, porcentaje_riesgo)
                                .then(function (result) {

                                })
                                .catch(function(error){

                                });
                            i++;
                            $scope.queryVisita(i);



                        })
                        .catch(function (error) {
                            i++;
                            $scope.queryVisita(i);
                        });
                };
            }
        ]);

})();