(function() {
    'use strict';

    angular.module('ROA.theme.services')
        .service('AnalyticsService', ['$rootScope', 'RestApi', '$uibModal', 'WorkerService', 'envService', 'cfpLoadingBar', 'CacheFactory',
            function($rootScope, RestApi, $uibModal, WorkerService, envService, cfpLoadingBar, CacheFactory) {
                CacheFactory.destroyAll();
                var user = $rootScope.currentUser;
                $rootScope.settings = undefined;
                var service = {};
                if (!CacheFactory.get('analyticsCache')) {
                    // or CacheFactory('bookCache', { ... });
                    CacheFactory.createCache('analyticsCache', {
                        deleteOnExpire: 'aggressive',
                        maxAge: 2629746000
                    });
                }

                var analyticsCache = CacheFactory.get('analyticsCache');

                // listen for the event in the relevant $rootScope
                $rootScope.$on('queryRangeChanged', function(event, data) {
                    if (data.queryRange !== undefined) {
                        // TODO: update dates in settings
                    }
                });

                // Get the settings
                RestApi.getUserSettings(user.userId)
                    .then(function(settings) {
                        // Wrong domain
                        var infoModal = $uibModal.open({
                            animation: true,
                            templateUrl: 'app/theme/generalViews/downloadingAnalytics.html',
                            size: 'sm',
                            scope: $rootScope,
                            keyboard: false,
                            backdrop : 'static'
                        });


                        $rootScope.$broadcast('settingsChanged', {
                            settings: settings
                        });

                        var startDate = moment(settings.userSettings.queryStartdate, "YYYY-MM-DD");
                        var endDate = moment(settings.userSettings.queryEnddate, "YYYY-MM-DD");
                        var queryRange = moment.range(startDate, endDate);
                        var clientId = $rootScope.currentClient.clientId;
                        // Base api endpoint
                        var endpoint = envService.read('restApiEndpoint');
                        var iterations = 0, resultCount = 0, analyticsBackup = analyticsCache.get('analytics') || [];

                        queryRange.by('months', function(month) {
                            var monthKey = month.format('YYYY_MM').toString();
                            if(analyticsCache.get(monthKey) !== true){
                                iterations++;

                                // Input
                                var input = {
                                    endpoint: endpoint,
                                    clientId: clientId,
                                    dates: {
                                        firstDay: month.toString(),
                                        lastDay: month.endOf('month').toString()
                                    },
                                    monthKey: monthKey
                                };

                                // Start the workers to request the information from the server
                                WorkerService.createAngularWorker([
                                    'input', 'output', '$http',
                                    function(input, output, $http) {

                                        input = JSON.parse(input[0]);
                                        
                                        // Now get the data from the DB
                                        $http({
                                            method: 'POST',
                                            url: input.endpoint + '/client/' + input.clientId + '/analytics',
                                            data: {
                                                startDate: input.dates.firstDay,
                                                endDate: input.dates.lastDay
                                            }
                                        }).then(function(response) {
                                            output.resolve(JSON.stringify({data: response.data.analytics, key: input.monthKey}));
                                        }, function(response) {
                                            output.resolve(JSON.stringify({error: true}));
                                        });                                        

                                    }
                                ]).then(function success(angularWorker) {
                                    //The input must be serializable
                                    return angularWorker.run([JSON.stringify(input)]);
                                }, function error(reason) {
                                    // Wrong domain
                                    $uibModal.open({
                                        animation: true,
                                        templateUrl: 'app/theme/generalViews/noWorkers.html',
                                        size: 'md',
                                        scope: $rootScope
                                    });
                                }).then(function success(result) {
                                    resultCount++;
                                    result = JSON.parse(result);

                                    var j = 0;
                                    for (var i = analyticsBackup.length, len = result.data.length; i < len; i++) {
                                        analyticsBackup[i] = result.data[j];
                                        j++;
                                    }
                                    analyticsCache.put(result.key, true);


                                    if(iterations === resultCount){
                                        analyticsCache.put('analytics', analyticsBackup);
                                        infoModal.close();
                                        $rootScope.$broadcast('informationLoaded');
                                    }
                                    
                                }, function error(reason) {
                                    resultCount++;

                                    if(iterations === resultCount){
                                        analyticsCache.put('analytics', analyticsBackup);
                                        infoModal.close();
                                        $rootScope.$broadcast('informationLoaded');
                                    }
                                }, function notify(update) {
                                });
                            }

                            
                        });
                        

                    })
                    .catch(function(error) {
                        $rootScope.$broadcast('settingsChanged', {
                            settings: {
                                queryRange: {
                                    startDate: moment(),
                                    endDate: moment().subtract(30, 'days')
                                }
                            }
                        });
                        // Wrong domain
                        $uibModal.open({
                            animation: true,
                            templateUrl: 'app/theme/generalViews/noSettings.html',
                            size: 'sm',
                            scope: $rootScope
                        });
                    });

                // Calculation of the dashboard Metrics
                service.calculateDashboard = function($scope){
                    var self = this;
                    return new Promise(function(fulfill, reject){
                        fulfill(analyticsCache.get('analytics'));
                    });
                }

                return service;

            }
        ])
})();