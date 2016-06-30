/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.pages', [
    'ui.router',

    'ROA.pages.dashboard',
    'ROA.pages.performance',
    'ROA.pages.trends',
    'ROA.pages.roi',
    'ROA.pages.login',
    'ROA.pages.noClient',
    'ROA.pages.profile',
  ])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($urlRouterProvider) {
    // Define the default route to /dashboard
    $urlRouterProvider.otherwise('/dashboard');
  }

})();
