/**
 * @author v.lugovksy
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.theme.directives')
      .directive('trafficChart', trafficChart);

  /** @ngInject */
  function trafficChart() {
    return {
      restrict: 'E',
      controller: 'TrafficChartCtrl',
      templateUrl: 'app/theme/directives/trafficChart/trafficChart.html'
    };
  }
})();