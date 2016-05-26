/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.pages.dashboard', [])
      .config(function($stateProvider){
        $stateProvider
          .state('dashboard', {
            url: '/dashboard',
            templateUrl: 'app/pages/dashboard/dashboard.html',
            title: 'Dashboard',
            sidebarMeta: {
              icon: 'ion-android-home',
              order: 0,
            },
            controller: 'DashboardCtrl'
          });
      })
      .controller('DashboardCtrl', ['$scope', function ($scope) {
        
      }]);

})();
