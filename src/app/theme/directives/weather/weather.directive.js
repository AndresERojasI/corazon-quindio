/**
 * @author v.lugovksy
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.theme.directives')
      .directive('weather', weather);

  /** @ngInject */
  function weather() {
    return {
      restrict: 'EA',
      controller: 'WeatherCtrl',
      templateUrl: 'app/theme/directives/weather/weather.html'
    };
  }
})();