/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.pages', [
    'ui.router',

    'ROA.pages.dashboard',
    'ROA.pages.ui',
    'ROA.pages.components',
    'ROA.pages.form',
    'ROA.pages.tables',
    'ROA.pages.charts',
    'ROA.pages.maps',
    'ROA.pages.profile',
  ])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($urlRouterProvider) {
    $urlRouterProvider.otherwise('/dashboard');
  }

})();
