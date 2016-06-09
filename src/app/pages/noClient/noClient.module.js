/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.pages.noClient', [])
      .config(function($stateProvider){
        $stateProvider
          .state('noClient', {
            url: '/noClient',
            templateUrl: 'app/pages/noClient/noClient.html',
            title: 'Login',
            sidebarMeta: {
              icon: 'ion-android-home',
              order: 0,
            },
            controller: 'NoClientCtrl',
            data: {
              requireLogin: false
            }
          });
      })
      .controller('NoClientCtrl', 
        ['$scope', 'cfpLoadingBar', 'RestApi', '$uibModal', 'envService', 
        function ($scope, cfpLoadingBar, RestApi, $uibModal, envService) {
          // function to submit the form after all validation has occurred            
          $scope.submitForm = function(validateSubdomainForm) {
            cfpLoadingBar.start();
            $scope.loginFormError = validateSubdomainForm.$invalid;

            if (validateSubdomainForm.$valid) {
              RestApi.validateSubdomain($scope.domain)
                .then(function(result){
                  cfpLoadingBar.complete();
                  var newUrl = envService.read('baseAppUrl').replace('app.', result.client.uniqueDomain + '.');
                  window.location = newUrl;
                })
                .catch(function(error){
                  $scope.errorMessage = 'The client subdomain does not seem valid, please check again or contact the admin.';
                  // Could not log in
                  $uibModal.open({
                    animation: true,
                    templateUrl: 'app/pages/noClient/errorNoClient.html',
                    size: 'sm',
                    scope: $scope
                  });
                  cfpLoadingBar.complete();
                });
              
            }else{
              cfpLoadingBar.complete();
            }
          };
      }]);

})();
