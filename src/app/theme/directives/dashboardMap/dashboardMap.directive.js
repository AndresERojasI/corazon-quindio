/**
 * @author v.lugovksy
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.theme.directives')
      .directive('dashboardMap', dashboardMap);

  /** @ngInject */
  function dashboardMap() {
    return {
      restrict: 'E',
      controller: 'DashboardMapCtrl',
      templateUrl: 'app/theme/directives/dashboardMap/dashboardMap.html'
    };
  }
})();