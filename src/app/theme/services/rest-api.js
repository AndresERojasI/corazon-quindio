(function() {
    'use strict';

    angular.module('ROA.theme.services')
        .service('RestApi', ['envService', 'SubdomainService', '$http',
            function(envService, SubdomainService, $http) {
                // Base api endpoint
                var endpoint = envService.read('restApiEndpoint');

                // Service object
                var restApi = {};

                restApi.getDashboard= function(){
                    return new Promise(function (success, fail) {
                        $http({
                            method: 'GET',
                            url: endpoint + '/paciente/dashboard'
                        }).then(function(response) {
                            success(response.data);
                        }, function(response) {
                            fail(response.data);
                        });
                    });
                };

                restApi.getAllPacientes = function () {
                    return new Promise(function(success, fail) {
                        $http({
                            method: 'GET',
                            url: endpoint + '/paciente/all'
                        }).then(function(response) {
                            success(response.data);
                        }, function(response) {
                            fail(response.data);
                        });
                    });
                };


                restApi.getVisitaPaciente = function (id) {
                    return new Promise(function(success, fail) {
                        $http({
                            method: 'GET',
                            url: endpoint + '/paciente/visita/buscar/'+id
                        }).then(function(response) {
                            success(response.data);
                        }, function(response) {
                            fail(response.data);
                        });
                    });
                };

                restApi.updatePacienteRiesgo = function(doc, porcentaje_riesgo) {
                    return new Promise(function(success, fail) {
                        $http({
                            method: 'POST',
                            url: endpoint + '/paciente/riesgo',
                            data: {
                                id: doc,
                                porcentaje_riesgo: porcentaje_riesgo
                            }
                        }).then(function(response) {
                            success(response.data);
                        }, function(response) {
                            fail(response.data);
                        });
                    });
                };

                restApi.geocodeCities = function(cities) {
                    return new Promise(function(success, fail) {
                        $http({
                            method: 'POST',
                            url: endpoint + '/geocode',
                            data: {
                            	cities: cities
                            }
                        }).then(function(response) {
                            success(response.data);
                        }, function(response) {
                            fail(response.data);
                        });
                    });
                };

                return restApi;

            }
        ])
})();