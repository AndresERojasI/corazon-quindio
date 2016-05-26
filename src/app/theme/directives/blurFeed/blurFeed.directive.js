/**
 * @author v.lugovksy
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.theme.directives')
      .directive('blurFeed', blurFeed);

  /** @ngInject */
  function blurFeed() {
    return {
      restrict: 'E',
      controller: 'BlurFeedCtrl',
      templateUrl: 'app/theme/directives/blurFeed/blurFeed.html'
    };
  }
})();