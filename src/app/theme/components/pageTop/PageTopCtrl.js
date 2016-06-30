/**
 * @author v.lugovksy
 * created on 16.12.2015
 */
(function() {
    'use strict';

    angular.module('ROA.theme.components')
        .controller('PageTopCtrl', PageTopCtrl);

    /** @ngInject */
    function PageTopCtrl($scope, sidebarService, $location, $rootScope) {
        // Date range selector for global query date administration
        $scope.$watch('queryRange', function(newValue, oldValue) {
            $rootScope.$broadcast('queryRangeChanged', {
                queryRange: newValue
            });
        });

        $scope.datepickerRanges = {
           'This Month': [moment().startOf('month'), moment().endOf('month')],
           'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        };

        $rootScope.$on('settingsChanged', function(event, data) {
            if (data.settings !== undefined && data.settings.userSettings !== undefined) {
                angular.element('#date_selector').data('daterangepicker').setStartDate(moment(data.settings.userSettings.queryStartdate).add(1, 'days'));
                $scope.queryRange.startDate = moment(data.settings.userSettings.queryStartdate);
                angular.element('#date_selector').data('daterangepicker').setEndDate(moment(data.settings.userSettings.queryEnddate).add(1, 'days'));
                $scope.queryRange.endDate = moment(data.settings.userSettings.queryEnddate);
            }
        });

        drawMenu();
        $scope.$on('$locationChangeSuccess', function() {
            drawMenu();
        });

        function drawMenu() {
            var menuItems = sidebarService.getMenuItems();

            for (var i = 0, len = menuItems.length; i < len; i++) {
                var rootName = menuItems[i].root.replace('#', '');

                if ($location.$$url == rootName) {
                    menuItems[i].active = true;
                    break;
                }
            }

            $scope.menu = menuItems;
        }
    }
})();