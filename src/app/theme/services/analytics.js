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

                service.informationLoaded = false;

                service.initService = function() {
                    // Get the settings
                    RestApi.getUserSettings(user.userId)
                        .then(function(settings) {
                            // Info loading
                            var infoModal = $uibModal.open({
                                animation: true,
                                templateUrl: 'app/theme/generalViews/downloadingAnalytics.html',
                                size: 'sm',
                                scope: $rootScope,
                                keyboard: false,
                                backdrop: 'static'
                            });

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
                                .then(function(result) {
                                    $rootScope.analytics = [];
                                    //copy the result to the $rootscope
                                    for (var i = 0, len = result.length; i < len; i++) {

                                        var data = result[i].data.analytics;

                                        for (var j = 0; j < data.length; j++) {
                                            $rootScope.analytics.push(data[j]);
                                        }
                                    }

                                    infoModal.close();
                                    $rootScope.displayContent = true;
                                    service.informationLoaded = true;
                                    $rootScope.$broadcast('informationLoaded');
                                    //$rootScope.$apply();

                                })
                                .catch(function(error) {
                                    infoModal.close();
                                    // Download analytics failed
                                    $uibModal.open({
                                        animation: true,
                                        templateUrl: 'app/theme/generalViews/noAnalytics.html',
                                        size: 'sm',
                                        scope: $rootScope
                                    });
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
                };
                service.initService();


                // Calculation of the dashboard Metrics
                service.dashboard = {};
                service.calculateDashboard = function($scope) {
                    var self = this;
                    console.log($rootScope.analytics);
                    if (!$rootScope.analytics || Object.keys($rootScope.analytics).length === 0) {
                        console.log('init service');
                        service.initService();
                    }

                    return new Promise(function(fulfill, reject) {
                        var analytics = $rootScope.analytics;

                        RestApi.getInsights($rootScope.currentClient.clientId)
                            .then(function(result) {
                                $scope.insights = result.insights;
                            })
                            .catch(function(error) {
                                console.log(error);
                            });
                        // Metrics
                        alasql
                            .promise(
                                'SELECT ' +
                                'SUM(' + $rootScope.userSettings.goalField + ') AS goal_completions, ' +
                                'SUM(budget) AS total_budget ' +
                                'FROM ? GROUP BY client_id', [analytics])
                            .then(function(result) {
                                $scope.revenue = result[0].goal_completions * $rootScope.userSettings.goalRevenue;

                                $scope.costPerConversion = (result[0].total_budget > 0) ? result[0].total_budget / $rootScope.userSettings.goalRevenue : 0;
                                $scope.roi = (result[0].total_budget > 0) ? $scope.revenue / result[0].total_budget : 0;

                                // Budget efficiency
                                alasql
                                    .promise(
                                        'SELECT SUM(goal_completions) as total_completions FROM (' +
                                        'SELECT ' +
                                        'year, month, day,' +
                                        'SUM(' + $rootScope.userSettings.goalField + ') as goal_completions,' +
                                        'SUM(budget) as total_budget' +
                                        ' FROM (' +
                                        'SELECT ' +
                                        'visitDate->getFullYear() as year, ' +
                                        'visitDate->getMonth() + 1 as month, ' +
                                        'visitDate->getDate() as day, ' +
                                        $rootScope.userSettings.goalField + ', budget ' +
                                        ' FROM (' +
                                        'SELECT NEW Date(visit_time) as visitDate, ' + $rootScope.userSettings.goalField + ', budget FROM ?' +
                                        ')' +
                                        ') GROUP BY year, month, day ORDER BY year, month, day ASC' +
                                        ') WHERE (total_budget/goal_completions) < ' + $rootScope.userSettings.goalLimit, [analytics])
                                    .then(function(result2) {
                                        $scope.budgetEfficiency = result2[0].total_completions / result[0].total_budget * 100;
                                        service.dashboard.budgetEfficiency = $scope.budgetEfficiency;
                                        $scope.$apply(); //this triggers a $digest
                                    })
                                    .catch(function(error) {
                                        console.log(error);
                                    });

                            })
                            .catch(function(error) {
                                console.log(error);
                            });

                        // Daily revenue
                        alasql
                            .promise(
                                'SELECT ' +
                                'year, month, day,' +
                                'SUM(' + $rootScope.userSettings.goalField + ') * ' + $rootScope.userSettings.goalRevenue + ' as revenue' +
                                ' FROM (' +
                                'SELECT ' +
                                'visitDate->getFullYear() as year, ' +
                                'visitDate->getMonth() + 1 as month, ' +
                                'visitDate->getDate() as day, ' +
                                $rootScope.userSettings.goalField +
                                ' FROM (' +
                                'SELECT NEW Date(visit_time) as visitDate, ' + $rootScope.userSettings.goalField + ' FROM ?' +
                                ')' +
                                ') GROUP BY year, month, day ORDER BY year, month, day ASC', [analytics])
                            .then(function(result) {
                                var dailyRevenue = [];
                                for (var i = 0, len = result.length; i < len; i++) {
                                    var date = moment(result[i].year + '/' + result[i].month + '/' + result[i].day, 'YYYY/MM/DD').format('MMM DD').toString();

                                    dailyRevenue.push({
                                        date: date,
                                        revenue: result[i].revenue.toFixed(2),
                                        color: layoutColors.success
                                    });
                                }

                                $scope.loadChart(dailyRevenue);
                            })
                            .catch(function(error) {
                                console.log(error);
                            });

                        // cities
                        alasql
                            .promise(
                                'SELECT * FROM (' +
                                'SELECT SUM(' + $rootScope.userSettings.goalField + ') AS visit_count, country, region, city FROM ? GROUP BY country, region, city ORDER BY visit_count DESC' +
                                ') WHERE visit_count >= 1', [analytics])
                            .then(function(result) {
                                $scope.citiesList = result;
                            })
                            .catch(function(error) {
                                console.log(error);
                            });


                    });
                };


                service.performance = {};
                service.calculatePerformance = function($scope) {

                    if (!$rootScope.analytics || Object.keys($rootScope.analytics).length === 0) {
                        service.initService();
                    }

                    var analytics = $rootScope.analytics;

                    var third_filter = $scope.third_filter;

                    if (third_filter === 'conversions') {
                        third_filter = $rootScope.userSettings.goalField;
                    }

                    // Total calculations
                    alasql
                        .promise(
                            ['SELECT',
                                'SUM(users) as users,',
                                'SUM(new_users) as new_users,',
                                'SUM(' + third_filter + ') as conversions,',
                                '',
                                'SUM(budget)/SUM(users) as cpu,',
                                'SUM(budget)/SUM(new_users) as cpnu,',
                                'SUM(budget)/SUM(' + third_filter + ') as cpc,',
                                '',
                                'SUM(ads) as ads,',
                                'SUM(budget) as budget,',
                                '',
                                'SUM(' + third_filter + ' * ' + $rootScope.userSettings.goalRevenue + ') / SUM(budget) as roi,',
                                'SUM(' + third_filter + ') * ' + $rootScope.userSettings.goalRevenue + ' as revenue',
                                '',
                                'FROM',
                                '?'
                            ].join(' '), [analytics])
                        .then(function(result) {
                            $scope.setPerformanceTotals(result[0]);
                        })
                        .catch(function(error) {
                            console.log(error);
                        });



                    // Detailed calculations
                    var query = [
                        'SUM(users) as users,',
                        'SUM(new_users) as new_users,',
                        'SUM(' + third_filter + ') as conversions,',
                        '',
                        'SUM(budget)/SUM(users) as cpu,',
                        'SUM(budget)/SUM(new_users) as cpnu,',
                        'SUM(budget)/SUM(' + third_filter + ') as cpc,',
                        '',
                        'SUM(ads) as ads,',
                        'SUM(budget) as budget,',
                        '',
                        'SUM(' + third_filter + ' * ' + $rootScope.userSettings.goalRevenue + ') / SUM(budget) as roi,',
                        'SUM(' + third_filter + ') * ' + $rootScope.userSettings.goalRevenue + ' as revenue',
                        '',
                        'FROM',
                        '?' +
                        'GROUP BY ' + $scope.first_filter
                    ].join(' ');

                    if ($scope.second_filter.filter !== false) {
                        query = 'SELECT ' + $scope.first_filter + '+ ", " +' + $scope.second_filter.filter + ' AS name,' + query;
                        query += ', ' + $scope.second_filter.filter
                    } else {
                        query = 'SELECT ' + $scope.first_filter + ' AS name,' + query;
                    }

                    alasql
                        .promise(
                            query, [analytics])
                        .then(function(result) {
                            var tempArray = [];
                            var chartArray = [];
                            for (var i = 0, len = result.length; i < len; i++) {
                                tempArray.push(result[i]);

                                var y = 0,
                                    x = 0;
                                switch (third_filter) {
                                    case 'users':
                                        y = result[i].cpu;
                                        break;
                                    case 'new_users':
                                        y = result[i].cpnu;
                                        break;
                                    default:
                                        y = result[i].cpc;
                                        break;
                                };

                                if (y) {
                                    y = $filter('currency')(y, '', 2);
                                }


                                if (result[i].conversions) {
                                    x = $filter('currency')(result[i].conversions, '', 2);
                                }

                                chartArray.push({
                                    "y": y || 0,
                                    "x": x || 0,
                                    "value": x || 0,
                                    "title": result[i].name || 'no name'
                                });
                            }

                            $scope.enableChart(chartArray);

                            $scope.resultCollection = tempArray;

                            $scope.smartTablePageSize = 10;
                            $scope.tableLoaded = true;

                            $rootScope.performanceCalculated = true;

                        })
                        .catch(function(error) {
                            console.log(error);
                        });

                };

                // Trends calculaitons
                service.calculateTrends = function($scope) {
                    if (!$rootScope.analytics || Object.keys($rootScope.analytics).length === 0) {
                        service.initService();
                    }

                    var analytics = $rootScope.analytics;

                    // Define the order of the filter
                    var filters = ['visit_time', 'hour', 'day', 'week' ,'month'];
                    filters.splice(filters.indexOf($scope.first_filter), 1);
                    var newFilters = [];
                    newFilters.push($scope.first_filter);
                    for (var i = 0, len = filters.length; i < len; i++) {
                        newFilters.push(filters[i]);
                    }

                    // Total calculations
                    alasql
                        .promise(
                            ['SELECT',
                                'visit_time,',
                                'weekday,',
                                'daypart,',
                                'SUM(users) as users,',
                                'SUM(new_users) as new_users,',
                                'SUM(' + $rootScope.userSettings.goalField + ') as conversions,',
                                'SUM(ads) as ads,',
                                'SUM(budget) as budget,',
                                'SUM(' + $rootScope.userSettings.goalField + ' * ' + $rootScope.userSettings.goalRevenue + ') as revenue,',
                                'SUM(budget)/SUM(users) as cpu,',
                                'SUM(budget)/SUM(new_users) as cpnu,',
                                'SUM(budget)/SUM(' + $rootScope.userSettings.goalField + ') as cpc,',
                                'hour',
                                'month,',
                                'week',
                                'FROM (',
                                    'SELECT visitDate->getHours() as hour, visit_time,weekday,daypart, users, new_users, ads, budget, month, week, ' + $rootScope.userSettings.goalField + ' FROM (',
                                        'SELECT NEW Date(visit_time) as visitDate, visit_time,weekday,daypart,',
                                        'users, new_users, ads, budget, month, week,'+ $rootScope.userSettings.goalField,
                                        'FROM ?',
                                    '))',
                                'GROUP BY ' + newFilters.join(','),
                                'ORDER BY '+$scope.first_filter+' ASC'
                            ].join(' '), [analytics])
                        .then(function(result) {
                            console.log('here');
                            console.log(result);
                            var tempArr = [];
                            for (var i = 0, len = result.length; i < len; i++) {
                                tempArr.push({
                                    ads : $filter('currency')(result[i].ads, '', 2),
                                    budget : $filter('currency')(result[i].budget, '', 2),
                                    conversions : $filter('currency')(result[i].conversions, '', 2),
                                    cpc : $filter('currency')(result[i].cpc, '', 2),
                                    cpnu : $filter('currency')(result[i].cpnu, '', 2),
                                    cpu : $filter('currency')(result[i].cpu, '', 2),
                                    daypart : result[i].daypart,
                                    month : parseInt(result[i].month),
                                    new_users : $filter('currency')(result[i].new_users, '', 2),
                                    revenue : $filter('currency')(result[i].revenue, '', 2),
                                    users : $filter('currency')(result[i].users, '', 2),
                                    visit_time : result[i].visit_time,
                                    week : result[i].week,
                                    weekday : result[i].weekday
                                });
                            }

                            var $chartsInstanceArray = [];
                            $chartsInstanceArray.push($scope.createUsersChart(tempArr));
                            $chartsInstanceArray.push($scope.createCostsChart(tempArr));
                            $chartsInstanceArray.push($scope.createTotalsChart(tempArr));

                            $scope.syncCharts($chartsInstanceArray);

                            $rootScope.trendsCalculated = true;
                        })
                        .catch(function(error) {
                            console.log(error);

                        });
                };

                return service;

            }
        ])
})();