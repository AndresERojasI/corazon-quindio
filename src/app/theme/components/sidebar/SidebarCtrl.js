/**
 * @author v.lugovksy
 * created on 16.12.2015
 */
(function() {
    'use strict';

    angular.module('ROA.theme.components')
        .controller('SidebarCtrl', SidebarCtrl);

    /** @ngInject */
    function SidebarCtrl($scope, $rootScope, $timeout, $location, layoutSizes, sidebarService, $element) {

        // Date range selector for global query date administration
        // $scope.$watch('queryRange', function(newValue, oldValue) {
        //     $rootScope.$broadcast('queryRangeChanged', {
        //         queryRange: newValue
        //     });
        // });

        $rootScope.$on('settingsChanged', function(event, data) {
            if (data.settings !== undefined && data.settings.userSettings !== undefined) {
                angular.element('#range-selector').data('daterangepicker').setStartDate(moment(data.settings.userSettings.queryStartdate).add(1, 'days'));
                $scope.queryRange.startDate = moment(data.settings.userSettings.queryStartdate);
                angular.element('#range-selector').data('daterangepicker').setEndDate(moment(data.settings.userSettings.queryEnddate).add(1, 'days'));
                $scope.queryRange.endDate = moment(data.settings.userSettings.queryEnddate);
            }
        });

        $scope.menuItems = sidebarService.getMenuItems();
        $scope.menuHeight = $element[0].childNodes[0].clientHeight - 84;

        function selectMenuItem() {
            $.each($scope.menuItems, function(index, menu) {
                menu.selected = ('#' + $location.$$url).indexOf(menu.root) == 0;
                menu.expanded = menu.expanded || menu.selected;
                if (menu.subMenu) {
                    $.each(menu.subMenu, function(subIndex, subMenu) {
                        subMenu.selected = (('#' + $location.$$url).indexOf(subMenu.root) == 0) && !subMenu.disabled;
                    });
                }
            });
        }

        selectMenuItem();

        $scope.$on('$locationChangeSuccess', function() {
            selectMenuItem();
        });

        $scope.menuExpand = function() {
            $scope.$isMenuCollapsed = false;
        };

        $scope.menuCollapse = function() {
            $scope.$isMenuCollapsed = true;
        };


        // watch window resize to change menu collapsed state if needed
        $(window).resize(function() {
            var isMenuShouldCollapsed = $(window).width() <= layoutSizes.resWidthCollapseSidebar;
            var scopeApplied = false;
            if ($scope.isMenuShouldCollapsed !== isMenuShouldCollapsed) {
                $scope.$apply(function() {
                    $scope.menuHeight = $element[0].childNodes[0].clientHeight - 84;
                    $scope.$isMenuCollapsed = isMenuShouldCollapsed;
                    scopeApplied = true;
                });
            }
            if (!scopeApplied) {
                $scope.$apply(function() {
                    $scope.menuHeight = $element[0].childNodes[0].clientHeight - 84;
                });
            }
            $scope.isMenuShouldCollapsed = isMenuShouldCollapsed;

        });

        $scope.toggleSubMenu = function($event, item) {
            var submenu = $($event.currentTarget).next();
            if ($scope.$isMenuCollapsed) {
                $scope.menuExpand();
                if (!item.expanded) {
                    $timeout(function() {
                        item.expanded = !item.expanded;
                        submenu.slideToggle();
                    });
                }
            } else {
                item.expanded = !item.expanded;
                submenu.slideToggle();
            }

        };

        window.onclick = function() {
            $timeout(function() {

                if ($scope.anySlideRight) {
                    $scope.menuItems.map(function(val) {
                        return val.slideRight = false;
                    });
                    $scope.anySlideRight = false;
                }

            }, 10);
        };

        $scope.hoverItem = function($event) {
            $scope.showHoverElem = true;
            $scope.hoverElemHeight = $event.currentTarget.clientHeight;
            var menuTopValue = 66;
            $scope.hoverElemTop = $event.currentTarget.getBoundingClientRect().top - menuTopValue;
        };
    }
})();