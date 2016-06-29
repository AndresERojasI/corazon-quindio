(function() {
    'use strict';

    angular.module('ROA.theme.services')
        .service('AnalyticsService', ['$rootScope', 'RestApi', '$uibModal', 'envService', 'cfpLoadingBar', '$q', '$http', 'layoutColors', 'layoutPaths', '$filter',
            function($rootScope, RestApi, $uibModal, envService, cfpLoadingBar, $q, $http, layoutColors, layoutPaths, $filter) {

                var user = $rootScope.currentUser;
                //$rootScope.settings = undefined;
                var service = {};

                // listen for the event in the relevant $rootScope
                $rootScope.$on('queryRangeChanged', function(event, data) {
                    if (data.queryRange !== undefined) {
                        $rootScope.userSettings.queryStartdate = data.queryRange.startDate.toString();
                        $rootScope.userSettings.queryEnddate = data.queryRange.endDate.toString();

                        service.informationLoaded = false;
                        service.initService(false);
                        
                        RestApi.setUserSettings(user.userId, $rootScope.userSettings)
                            .then(function(result){
                                console.log('Settings updated');
                            })
                            .catch(function(error){
                                console.log('Error updating settings');
                            });
                    }
                });

                service.informationLoaded = false;

                service.initService = function(queryChanged) {
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

                            try{
                                if(!queryChanged){
                                    $rootScope.userSettings = settings.userSettings;
                                    $rootScope.$broadcast('settingsChanged', {
                                        settings: settings
                                    });
                                }

                            }catch(e){
                                console.log(e);
                            }

                            var startDate = moment($rootScope.userSettings.queryStartdate, "YYYY-MM-DD");
                            var endDate = moment($rootScope.userSettings.queryEnddate, "YYYY-MM-DD");
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

                    if (!$rootScope.analytics || Object.keys($rootScope.analytics).length === 0) {
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
                                $scope.$apply();
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
                                $scope.$apply();
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
                                $scope.$apply();
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

                    // Total calculations
                    alasql
                        .promise(
                            ['SELECT',
                                '*,',
                                'SUM(users) AS users_sum,',
                                'SUM(new_users) AS new_users_sum,',
                                'SUM(' + $rootScope.userSettings.goalField + ') AS conversions,',
                                'SUM(ads) AS ads_sum,',
                                'SUM(budget) AS budget_sum,',
                                'SUM(' + $rootScope.userSettings.goalField + ' * ' + $rootScope.userSettings.goalRevenue + ') AS revenue,',
                                'SUM(budget)/SUM(users) AS cpu,',
                                'SUM(budget)/SUM(new_users) AS cpnu,',
                                'SUM(budget)/SUM(' + $rootScope.userSettings.goalField + ') AS cpc',
                                'FROM (',
                                'SELECT visitDate->getHours() AS hour, visitDate->getDay() AS day, visit_time,weekday,daypart, users, new_users, ads, budget, month, week, ' + $rootScope.userSettings.goalField + ' FROM (',
                                'SELECT NEW Date(visit_time) AS visitDate, visit_time,weekday,daypart,',
                                'users, new_users, ads, budget, month, week,' + $rootScope.userSettings.goalField,
                                'FROM ?',
                                '))',
                                'GROUP BY ' + $scope.first_filter,
                                'ORDER BY ' + $scope.first_filter + ' ASC'
                            ].join(' '), [analytics])
                        .then(function(result) {

                            $scope.trendsResult = result;
                            service.calculateTrendsTotals($scope);
                            service.calculateTrendsTable($scope);

                            var tempArr = [];

                            var dayNames = new Array(
                                'Sunday',
                                'Monday',
                                'Tuesday',
                                'Wednesday',
                                'Thursday',
                                'Friday',
                                'Saturday'
                            );
                            for (var i = 0, len = result.length; i < len; i++) {
                                var date = new Date(result[i].visit_time);
                                //date.setDate(1);
                                tempArr.push({
                                    ads: $filter('currency')(result[i].ads_sum, '', 2),
                                    budget: $filter('currency')(result[i].budget_sum, '', 2),
                                    conversions: $filter('currency')(result[i].conversions, '', 2),
                                    cpc: $filter('currency')(result[i].cpc, '', 2),
                                    cpnu: $filter('currency')(result[i].cpnu, '', 2),
                                    cpu: $filter('currency')(result[i].cpu, '', 2),
                                    daypart: result[i].daypart,
                                    month: parseInt(result[i].month),
                                    new_users: $filter('currency')(result[i].new_users_sum, '', 2),
                                    revenue: $filter('currency')(result[i].revenue, '', 2),
                                    users: $filter('currency')(result[i].users_sum, '', 2),
                                    visit_time: date,
                                    week: result[i].week,
                                    weekday: result[i].weekday,
                                    hour: result[i].hour,
                                    day: dayNames[result[i].day]
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

                service.calculateTrendsTotals = function($scope) {
                    if (!$rootScope.analytics || Object.keys($rootScope.analytics).length === 0) {
                        service.initService();
                    }

                    var filter = '';
                    var dayNames = new Array(
                        'Sunday',
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday'
                    );

                    if ($scope.zoomFilterStart && $scope.zoomFilterEnd) {
                        switch ($scope.first_filter) {
                            case 'day':
                                $scope.zoomFilterStart = dayNames.indexOf($scope.zoomFilterStart);
                                $scope.zoomFilterEnd = dayNames.indexOf($scope.zoomFilterEnd);
                                filter = 'WHERE ' + $scope.first_filter + ' BETWEEN ' + $scope.zoomFilterStart + ' AND ' + $scope.zoomFilterEnd;
                                break;
                            case 'month':
                                $scope.zoomFilterStart = moment($scope.zoomFilterStart, 'MMM D').month() + 1;
                                $scope.zoomFilterEnd = moment($scope.zoomFilterEnd, 'MMM D').month() + 1;
                                filter = 'WHERE ' + $scope.first_filter + ' BETWEEN "' + $scope.zoomFilterStart + '" AND "' + $scope.zoomFilterEnd + '"'
                                break;
                            default:
                                filter = 'WHERE ' + $scope.first_filter + ' BETWEEN ' + $scope.zoomFilterStart + ' AND ' + $scope.zoomFilterEnd;
                                break
                        };
                    }


                    // Total calculations
                    alasql
                        .promise(
                            ['SELECT',
                                'visit_time,',
                                'SUM(users_sum) AS users_total,',
                                'SUM(new_users_sum) AS new_users_total,',
                                'SUM(conversions) AS conversions_total,',
                                'SUM(ads_sum) AS ads_total,',
                                'SUM(budget_sum) AS budget_total,',
                                'SUM(revenue) AS revenue_total,',
                                'SUM(budget_sum)/SUM(users_sum) AS cpu_total,',
                                'SUM(budget_sum)/SUM(new_users_sum) AS cpnu_total,',
                                'SUM(budget_sum)/SUM(cpc) AS cpc_total',
                                'FROM ?',
                                filter,
                            ].join(' '), [$scope.trendsResult])
                        .then(function(result) {
                            result = result[0];

                            $scope.returning_visitors = result.users_total;
                            $scope.new_visitors = result.new_users_total;
                            $scope.conversions = result.conversions_total;

                            $scope.cpu = result.cpu_total;
                            $scope.cpnu = result.cpnu_total;
                            $scope.cpc = result.cpc_total;

                            $scope.ads = result.ads_total;
                            $scope.budget = result.budget_total;
                            $scope.revenue = result.revenue_total;

                        })
                        .catch(function(error) {
                            console.log();
                        });
                };

                service.calculateTrendsTable = function($scope) {
                    if (!$rootScope.analytics || Object.keys($rootScope.analytics).length === 0) {
                        service.initService();
                    }

                    var analytics = $rootScope.analytics;

                    // Total calculations
                    alasql
                        .promise(
                            ['SELECT',
                                'daypart, weekday,',
                                'SUM(users) AS users_total,',
                                'SUM(new_users) AS new_users_total,',
                                'SUM(conversions) AS conversions_total,',
                                'SUM(ads) AS ads_total,',
                                'SUM(budget) AS budget_total,',
                                'SUM(revenue) AS revenue_total,',
                                'SUM(budget)/SUM(users) AS cpu_total,',
                                'SUM(budget)/SUM(new_users) AS cpnu_total,',
                                'SUM(budget)/SUM(cpc) AS cpc_total',
                                'FROM ?',
                                'GROUP BY daypart, weekday',
                                'ORDER BY weekday'
                            ].join(' '), [analytics])
                        .then(function(result) {

                            var table_structure = {
                                Breakfast: {
                                    Monday: {},
                                    Tuesday: {},
                                    Wednesday: {},
                                    Thursday: {},
                                    Friday: {},
                                    Saturday: {},
                                    Sunday: {}
                                },
                                Coffee: {
                                    Monday: {},
                                    Tuesday: {},
                                    Wednesday: {},
                                    Thursday: {},
                                    Friday: {},
                                    Saturday: {},
                                    Sunday: {}
                                },
                                Daytime: {
                                    Monday: {},
                                    Tuesday: {},
                                    Wednesday: {},
                                    Thursday: {},
                                    Friday: {},
                                    Saturday: {},
                                    Sunday: {}
                                },
                                PrePeak: {
                                    Monday: {},
                                    Tuesday: {},
                                    Wednesday: {},
                                    Thursday: {},
                                    Friday: {},
                                    Saturday: {},
                                    Sunday: {}
                                },
                                EarlyPeak: {
                                    Monday: {},
                                    Tuesday: {},
                                    Wednesday: {},
                                    Thursday: {},
                                    Friday: {},
                                    Saturday: {},
                                    Sunday: {}
                                },
                                LatePeak: {
                                    Monday: {},
                                    Tuesday: {},
                                    Wednesday: {},
                                    Thursday: {},
                                    Friday: {},
                                    Saturday: {},
                                    Sunday: {}
                                },
                                PostPeak: {
                                    Monday: {},
                                    Tuesday: {},
                                    Wednesday: {},
                                    Thursday: {},
                                    Friday: {},
                                    Saturday: {},
                                    Sunday: {}
                                },
                                NightTime: {
                                    Monday: {},
                                    Tuesday: {},
                                    Wednesday: {},
                                    Thursday: {},
                                    Friday: {},
                                    Saturday: {},
                                    Sunday: {}
                                }
                            };

                            var total_daypart = [],
                                avg_daypart = [],
                                total_weekday = [],
                                avg_weekday = [];

                            for (var i = 0, len = result.length; i < len; i++) {
                                if (!total_daypart[result[i].daypart]) {
                                    total_daypart[result[i].daypart] = {};
                                }

                                //Daypart totals
                                try {
                                    var ads_total = (total_daypart[result[i].daypart].ads_total) ? total_daypart[result[i].daypart].ads_total + result[i].ads_total : result[i].ads_total;
                                    var budget_total = (total_daypart[result[i].daypart].budget_total) ? total_daypart[result[i].daypart].budget_total + result[i].budget_total : result[i].budget_total;
                                    var conversions_total = (total_daypart[result[i].daypart].conversions_total) ? total_daypart[result[i].daypart].conversions_total + result[i].conversions_total : result[i].conversions_total;
                                    var cpc_total = (total_daypart[result[i].daypart].cpc_total) ? total_daypart[result[i].daypart].cpc_total + result[i].cpc_total : result[i].cpc_total;
                                    var cpnu_total = (total_daypart[result[i].daypart].cpnu_total) ? total_daypart[result[i].daypart].cpnu_total + result[i].cpnu_total : result[i].cpnu_total;
                                    var cpu_total = (total_daypart[result[i].daypart].cpu_total) ? total_daypart[result[i].daypart].cpu_total + result[i].cpu_total : result[i].cpu_total;
                                    var users_total = (total_daypart[result[i].daypart].users_total) ? total_daypart[result[i].daypart].users_total + result[i].users_total : result[i].users_total;
                                    var new_users_total = (total_daypart[result[i].daypart].new_users_total) ? total_daypart[result[i].daypart].new_users_total + result[i].new_users_total : result[i].new_users_total;
                                } catch (e) {
                                    console.log(e);
                                }
                                total_daypart[result[i].daypart] = {
                                    ads_total: ads_total,
                                    budget_total: budget_total,
                                    conversions_total: conversions_total,
                                    cpc_total: cpc_total,
                                    cpnu_total: cpnu_total,
                                    cpu_total: cpu_total,
                                    users_total: users_total,
                                    new_users_total: new_users_total
                                };

                                if (!total_weekday[result[i].weekday]) {
                                    total_weekday[result[i].weekday] = {};
                                }

                                try {
                                    var ads_total = (total_weekday[result[i].weekday].ads_total) ? total_weekday[result[i].weekday].ads_total + result[i].ads_total : result[i].ads_total;
                                    var budget_total = (total_weekday[result[i].weekday].budget_total) ? total_weekday[result[i].weekday].budget_total + result[i].budget_total : result[i].budget_total;
                                    var conversions_total = (total_weekday[result[i].weekday].conversions_total) ? total_weekday[result[i].weekday].conversions_total + result[i].conversions_total : result[i].conversions_total;
                                    var cpc_total = (total_weekday[result[i].weekday].cpc_total) ? total_weekday[result[i].weekday].cpc_total + result[i].cpc_total : result[i].cpc_total;
                                    var cpnu_total = (total_weekday[result[i].weekday].cpnu_total) ? total_weekday[result[i].weekday].cpnu_total + result[i].cpnu_total : result[i].cpnu_total;
                                    var cpu_total = (total_weekday[result[i].weekday].cpu_total) ? total_weekday[result[i].weekday].cpu_total + result[i].cpu_total : result[i].cpu_total;
                                    var users_total = (total_weekday[result[i].weekday].users_total) ? total_weekday[result[i].weekday].users_total + result[i].users_total : result[i].users_total;
                                    var new_users_total = (total_weekday[result[i].weekday].new_users_total) ? total_weekday[result[i].weekday].new_users_total + result[i].new_users_total : result[i].new_users_total;
                                } catch (e) {
                                    console.log(e);
                                }

                                total_weekday[result[i].weekday] = {
                                    ads_total: ads_total,
                                    budget_total: budget_total,
                                    conversions_total: conversions_total,
                                    cpc_total: cpc_total,
                                    cpnu_total: cpnu_total,
                                    cpu_total: cpu_total,
                                    users_total: users_total,
                                    new_users_total: new_users_total
                                };


                                table_structure[result[i].daypart][result[i].weekday] = {
                                    ads: $filter('currency')(result[i].ads_total, '', 2) || 0,
                                    budget: $filter('currency')($filter('currency')(result[i].budget_total, '', 2), '€', 2) || 0,
                                    conversions: $filter('currency')(result[i].conversions_total, '', 2) || 0,
                                    cpc: $filter('currency')($filter('currency')(result[i].cpc_total, '', 2), '€', 2) || 0,
                                    cpnu: $filter('currency')($filter('currency')(result[i].cpnu_total, '', 2), '€', 2) || 0,
                                    cpu: $filter('currency')($filter('currency')(result[i].cpu_total, '', 2), '€', 2) || 0,
                                    users: $filter('currency')(result[i].users_total, '', 2) || 0,
                                    new_users: $filter('currency')(result[i].new_users_total, '', 2) || 0
                                };
                            };

                            try {
                                for (var id in total_daypart) {
                                    total_daypart[id].ads_total = $filter('currency')(total_daypart[id].ads_total, '', 2);
                                    total_daypart[id].budget_total = $filter('currency')(total_daypart[id].budget_total, '€', 2);
                                    total_daypart[id].conversions_total = $filter('currency')(total_daypart[id].conversions_total, '', 2);
                                    total_daypart[id].cpc_total = $filter('currency')(total_daypart[id].cpc_total, '€', 2);
                                    total_daypart[id].cpnu_total = $filter('currency')(total_daypart[id].cpnu_total, '€', 2);
                                    total_daypart[id].cpu_total = $filter('currency')(total_daypart[id].cpu_total, '€', 2);
                                    total_daypart[id].users_total = $filter('currency')(total_daypart[id].users_total, '', 2);
                                    total_daypart[id].new_users_total = $filter('currency')(total_daypart[id].new_users_total, '', 2);
                                }

                                for (var id in total_weekday) {
                                    total_weekday[id].ads_total = $filter('currency')(total_weekday[id].ads_total, '', 2);
                                    total_weekday[id].budget_total = $filter('currency')(total_weekday[id].budget_total, '€', 2);
                                    total_weekday[id].conversions_total = $filter('currency')(total_weekday[id].conversions_total, '', 2);
                                    total_weekday[id].cpc_total = $filter('currency')(total_weekday[id].cpc_total, '€', 2);
                                    total_weekday[id].cpnu_total = $filter('currency')(total_weekday[id].cpnu_total, '€', 2);
                                    total_weekday[id].cpu_total = $filter('currency')(total_weekday[id].cpu_total, '€', 2);
                                    total_weekday[id].users_total = $filter('currency')(total_weekday[id].users_total, '', 2);
                                    total_weekday[id].new_users_total = $filter('currency')(total_weekday[id].new_users_total, '', 2);
                                }
                            } catch (e) {
                                console.log(e);
                            }


                            $scope.resultCollection = table_structure;
                            $scope.total_weekday = total_weekday;
                            $scope.total_daypart = total_daypart;

                        })
                        .catch(function(error) {
                            console.log();
                        });
                };

                service.calculateRoi = function($scope) {
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
                        .then(function(total_results) {
                            total_results = total_results[0];
                            $scope.total_results = total_results;

                            //Do something with the totals
                            // Detailed calculations
                            var query = [
                                'SUM(users) as users,',
                                'SUM(new_users) as new_users,',
                                'SUM(' + third_filter + ') as conversions,',
                                'SUM(budget)/SUM(users) as cpu,',
                                'SUM(budget)/SUM(new_users) as cpnu,',
                                'SUM(budget)/SUM(' + third_filter + ') as cpc,',
                                'SUM(budget) as budget',
                                'FROM',
                                '?' +
                                ' GROUP BY ' + $scope.first_filter
                            ].join(' ');

                            if ($scope.second_filter.filter !== false) {
                                query = ['SELECT ',
                                    $scope.first_filter + ' AS first_filter,',
                                    $scope.second_filter.filter + ' AS second_filter,',
                                    query
                                ].join('\n');
                                query += ', ' + $scope.second_filter.filter
                            } else {
                                query = 'SELECT ' + $scope.first_filter + ' AS first_filter,' + query;
                            }

                            alasql
                                .promise(
                                    query, [analytics])
                                .then(function(result) {

                                    var treemapData = {
                                        name: 'Cost',
                                        children: []
                                    };

                                    // Sort and assign children if any
                                    var temporalArray = [];
                                    result.map(function(currentResult, index, array) {
                                        if (!temporalArray[currentResult.first_filter]) {
                                            temporalArray[currentResult.first_filter] = {
                                                conversions: 0,
                                                new_users: 0,
                                                users: 0,
                                                cpc: 0,
                                                cpu: 0,
                                                cpnu: 0,
                                                budget: 0,
                                                children: []
                                            };
                                        }

                                        if (currentResult.second_filter) {
                                            // Accumulate everything
                                            temporalArray[currentResult.first_filter].conversions = (currentResult.conversions || 0) + temporalArray[currentResult.first_filter].conversions;
                                            temporalArray[currentResult.first_filter].new_users = (currentResult.new_users || 0) + temporalArray[currentResult.first_filter].new_users;
                                            temporalArray[currentResult.first_filter].users = (currentResult.users || 0) + temporalArray[currentResult.first_filter].users;
                                            temporalArray[currentResult.first_filter].budget = (currentResult.budget || 0) + temporalArray[currentResult.first_filter].budget;
                                            temporalArray[currentResult.first_filter].cpu = (currentResult.cpu || 0) + temporalArray[currentResult.first_filter].cpu;
                                            temporalArray[currentResult.first_filter].cpc = (currentResult.cpc || 0) + temporalArray[currentResult.first_filter].cpc;
                                            temporalArray[currentResult.first_filter].cpnu = (currentResult.cpnu || 0) + temporalArray[currentResult.first_filter].cpnu;

                                            // Add the children
                                            currentResult.name = currentResult.first_filter + ', ' + currentResult.second_filter;
                                            currentResult.value = currentResult[third_filter];
                                            temporalArray[currentResult.first_filter].children.push(currentResult);
                                        } else {
                                            temporalArray[currentResult.first_filter] = currentResult;
                                        }

                                        temporalArray[currentResult.first_filter].name = currentResult.first_filter;
                                        temporalArray[currentResult.first_filter].value = temporalArray[currentResult.first_filter][third_filter];

                                    });

                                    //pass the data to the right object
                                    for (var child in temporalArray) {

                                        //third_filter
                                        var child = temporalArray[child];
                                        child.value_percent = (child[third_filter] * 100) / total_results[third_filter];
                                        child.budget_percent = (child.budget * 100) / total_results.budget;
                                        var fourth = '';
                                        var text = '';
                                        switch (third_filter) {
                                            case 'users':
                                                fourth = 'cpu';
                                                text = 'of total Returning Visitors';
                                                break;
                                            case 'new_users':
                                                fourth = 'cpnu';
                                                text = 'of total New Visitors';
                                                break;
                                            case 'conversions':
                                                fourth = 'cpc';
                                                text = 'of total Conversions';
                                                break;
                                        }

                                        child.text_value_percent = text;
                                        child.conversion_percent = (child[fourth] * 100) / total_results[fourth];
                                        child.conversion_value = child[fourth];
                                        child.conversion_text = fourth;

                                        if (child.children) {
                                            for (var i = 0, len = child.children.length; i < len; i++) {
                                                child.children[i].value_percent = (child.children[i][third_filter] * 100) / total_results[third_filter];
                                                child.children[i].text_value_percent = text;
                                                child.children[i].budget_percent = (child.children[i].budget * 100) / total_results.budget;
                                                child.children[i].conversion_percent = (child.children[i][fourth] * 100) / total_results[fourth];
                                                child.children[i].conversion_value = child.children[i][fourth];
                                                child.children[i].conversion_text = fourth;
                                            }

                                        }

                                        treemapData.children.push(child);

                                    };

                                    // Initialize the chart
                                    $scope.loadTreeMap(treemapData);
                                    $scope.loadBarChart(treemapData.children);
                                })
                                .catch(function(error) {
                                    console.log(error);
                                });

                        })
                        .catch(function(error) {
                            console.log(error);
                        });


                };

                return service;

            }
        ])
})();