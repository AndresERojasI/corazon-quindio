(function() {
    'use strict';

    angular.module('ROA.theme.services')
        .service('AnalyticsService', ['$rootScope', 'RestApi', '$uibModal', 'envService', 'cfpLoadingBar', '$q', '$http', 'layoutColors', 'layoutPaths', '$filter',
            function($rootScope, RestApi, $uibModal, envService, cfpLoadingBar, $q, $http, layoutColors, layoutPaths, $filter) {

                var user = $rootScope.currentUser;
                $rootScope.settings = undefined;
                var service = {};

                // listen for the event in the relevant $rootScope
                $rootScope.$on('queryRangeChanged', function(event, data) {
                    if (data.queryRange !== undefined) {
                        // TODO: update dates in settings
                    }
                });

                // Get the settings
                RestApi.getUserSettings(user.userId)
                    .then(function(settings) {
                        try{
                            // Info loading
                            var infoModal = $uibModal.open({
                                animation: true,
                                templateUrl: 'app/theme/generalViews/downloadingAnalytics.html',
                                size: 'sm',
                                scope: $rootScope,
                                keyboard: false,
                                backdrop : 'static'
                            });
                            console.log(settings.userSettings);
                            $rootScope.userSettings = settings.userSettings;
                            $rootScope.$broadcast('settingsChanged', {
                                settings: settings
                            });

                            var startDate = moment(settings.userSettings.queryStartdate, "YYYY-MM-DD");
                            var endDate = moment(settings.userSettings.queryEnddate, "YYYY-MM-DD");
                            var queryRange = moment.range(startDate, endDate);
                            var clientId = $rootScope.currentClient.clientId;
                            // Base api endpoint
                            var endpoint = envService.read('restApiEndpoint');
                            var deferred = $q.defer();

                            var analyticsPromises = [];

                            queryRange.by('months', function(month) {
                                    // Now get the data from the DB
                                    analyticsPromises.push(
                                        $http({
                                            method: 'POST',
                                            url: endpoint + '/client/' + clientId + '/analytics',
                                            data: {
                                                startDate: month.toString(),
                                                endDate: month.endOf('month').toString()
                                            },
                                            cache: true
                                        })
                                    );
                            });

                            $q.all(analyticsPromises)
                                .then(function(result){
                                    $rootScope.analytics = [];
                                    //copy the result to the $rootscope
                                    for (var i = 0, len = result.length; i < len; i++) {

                                        var data = result[i].data.analytics;

                                        for (var j = 0; j < data.length; j++) {
                                            $rootScope.analytics.push(data[j]);
                                        }
                                    }
                                    $rootScope.displayContent = true;
                                    $rootScope.$broadcast('informationLoaded');
                                    infoModal.close();
                                    
                                })
                                .catch(function(error){
                                    infoModal.close();
                                    // Download analytics failed
                                    $uibModal.open({
                                        animation: true,
                                        templateUrl: 'app/theme/generalViews/noAnalytics.html',
                                        size: 'sm',
                                        scope: $rootScope
                                    });
                                });
                        } catch(e){
                            console.log(e);
                        }                     

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
                        var analytics = $rootScope.analytics;

                        RestApi.getInsights($rootScope.currentClient.clientId)
                                    .then(function(result) {
                                        $scope.insights = result.insights;
                                    })
                                    .catch(function(error){
                                        console.log(error);
                                    });
                        // Metrics
                        alasql
                            .promise(
                                'SELECT '+
                                'SUM(users) AS goal_completions, '+
                                'SUM(budget) AS total_budget '+
                                'FROM ? GROUP BY client_id'
                            , [analytics])
                                .then(function(result){
                                    $scope.revenue = result[0].goal_completions * $rootScope.userSettings.goalRevenue;

                                    $scope.costPerConversion = (result[0].total_budget > 0)
                                                                    ? result[0].total_budget / $rootScope.userSettings.goalRevenue
                                                                    : 0;
                                    $scope.roi = (result[0].total_budget > 0)
                                                    ? $scope.revenue / result[0].total_budget
                                                    : 0;

                                    // Metrics
                                    alasql
                                        .promise(
                                            'SELECT SUM(goal_completions) as total_completions FROM ('+
                                                'SELECT '+
                                                    'year, month, day,'+
                                                    'SUM(users) as goal_completions,'+
                                                    'SUM(budget) as total_budget'+
                                                    ' FROM ('+
                                                        'SELECT '+
                                                            'visitDate->getFullYear() as year, '+
                                                            'visitDate->getMonth() + 1 as month, '+
                                                            'visitDate->getDate() as day, '+
                                                            'users, budget '+
                                                            ' FROM ('+
                                                                'SELECT NEW Date(visit_time) as visitDate, users, budget FROM ?'+
                                                            ')'+
                                                    ') GROUP BY year, month, day ORDER BY year, month, day ASC'+
                                            ') WHERE (total_budget/goal_completions) < ' +$rootScope.userSettings.goalLimit
                                        , [analytics])
                                            .then(function(result2){
                                                $scope.budgetEfficiency = result2[0].total_completions / result[0].total_budget * 100

                                            })
                                            .catch(function(error){
                                                console.log(error);
                                            });

                                })
                                .catch(function(error){
                                    console.log(error);
                                });

                        // Daily revenue
                        alasql
                            .promise(
                                'SELECT '+
                                    'year, month, day,'+
                                    'SUM(users) * '+ $rootScope.userSettings.goalRevenue + ' as revenue'+
                                    ' FROM ('+
                                        'SELECT '+
                                            'visitDate->getFullYear() as year, '+
                                            'visitDate->getMonth() + 1 as month, '+
                                            'visitDate->getDate() as day, '+
                                            'users '+
                                            ' FROM ('+
                                                'SELECT NEW Date(visit_time) as visitDate, users FROM ?'+
                                            ')'+
                                    ') GROUP BY year, month, day ORDER BY year, month, day ASC'
                            , [analytics])
                                .then(function(result){
                                    var dailyRevenue = [];
                                    for (var i = 0, len = result.length; i < len; i++) {
                                        var date = moment(result[i].year +'/'+ result[i].month + '/' + result[i].day, 'YYYY/MM/DD').format('MMM DD').toString();

                                        dailyRevenue.push({
                                            date: date,
                                            revenue: result[i].revenue.toFixed(2),
                                            color: layoutColors.success
                                        });
                                    }

                                    $scope.loadChart( dailyRevenue );
                                })
                                .catch(function(error){
                                    console.log(error);
                                });

                        // cities
                        alasql
                            .promise(
                                'SELECT * FROM ('+
                                    'SELECT SUM(users) AS visit_count, country, region, city FROM ? GROUP BY country, region, city ORDER BY visit_count DESC'+
                                ') WHERE visit_count >= 1'
                            , [analytics])
                                .then(function(result){
                                    $scope.citiesList = result;
                                })
                                .catch(function(error){
                                    console.log(error);
                                });


                    });
                };

                service.dashboard = {};

                return service;

            }
        ])
})();