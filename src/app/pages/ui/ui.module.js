/**
 * @author k.danovsky
 * created on 12.01.2016
 */
(function () {
  'use strict';

  angular.module('ROA.pages.ui', [
    'ROA.pages.ui.typography',
    'ROA.pages.ui.buttons',
    'ROA.pages.ui.icons',
    'ROA.pages.ui.modals',
    'ROA.pages.ui.grid',
    'ROA.pages.ui.alerts',
    'ROA.pages.ui.progressBars',
    'ROA.pages.ui.notifications',
    'ROA.pages.ui.tabs',
    'ROA.pages.ui.slider',
    'ROA.pages.ui.panels',
  ])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('ui', {
          url: '/ui',
          template : '<ui-view></ui-view>',
          abstract: true,
          title: 'UI Features',
          sidebarMeta: {
            icon: 'ion-android-laptop',
            order: 200,
          },
        });
  }

})();
