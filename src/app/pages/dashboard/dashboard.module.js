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
            controller: 'DashboardCtrl',
            data: {
              requireLogin: true
            }
          });
      })
      .controller('DashboardCtrl', ['$rootScope', '$scope', 'AnalyticsService', function ($rootScope, $scope, AnalyticsService) {
        $scope.displayContent = AnalyticsService.dashbaordCalculated;
        // listen for the event in the relevant $rootScope
        $rootScope.$on('informationLoaded', function(event, data) {

            AnalyticsService.calculateDashboard($scope)
              .then(function(result){
                $scope.displayContent = true;
                AnalyticsService.dashbaordCalculated = true;
                
              })
              .catch(function(error){
                console.log('Error');
                console.log(error);
              });
        });
      }]);

})();
