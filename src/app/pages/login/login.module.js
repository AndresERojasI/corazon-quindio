/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.pages.login', [])
      .config(function($stateProvider){
        $stateProvider
          .state('login', {
            url: '/login',
            templateUrl: 'app/pages/login/login.html',
            title: 'Login',
            sidebarMeta: {
              icon: 'ion-android-home',
              order: 0,
            },
            controller: 'LoginCtrl',
            data: {
              requireLogin: false
            }
          });
      })
      .controller(
        'LoginCtrl', 
        ['$scope', 'cfpLoadingBar', 'RestApi', '$uibModal', 'SubdomainService', 'envService', '$rootScope', '$state', '$cookies', 'moment',
        function ($scope, cfpLoadingBar, RestApi, $uibModal, SubdomainService, envService, $rootScope, $state, $cookies, moment) {
        $cookies.remove('roatoken');
        $rootScope.currentUser = undefined;
        $rootScope.currentClient = undefined;
        var subdomain = SubdomainService.company;

        // function to submit the form after all validation has occurred            
        $scope.submitForm = function(loginForm) {
          cfpLoadingBar.start();
          $scope.loginFormError = loginForm.$invalid;

          
          if (loginForm.$valid) {
            RestApi.authenticateUser($scope.user, $scope.password, subdomain)
              .then(function(result){
                if(result.client.uniqueDomain !== subdomain){

                  var newUrl = envService.read('baseAppUrl').replace('app.', result.client.uniqueDomain + '.');
                  $scope.errorMessage = 'The User you are trying to use does not have permissions for this Client, please go to <a href="'+newUrl+'">'+newUrl+'</a>';

                  // Wrong domain
                  $uibModal.open({
                    animation: true,
                    templateUrl: 'app/pages/login/errorLogin.html',
                    size: 'sm',
                    scope: $scope
                  });

                }else{

                  $rootScope.currentUser = result.user;
                  $rootScope.currentClient = result.client;

                  if(result.token !== false){
                    $cookies.putObject(
                      'roatoken', 
                      result.token, 
                      {
                        expires: moment(result.token[0].expiration_date)
                                  .add(1, 'days')
                                  .toDate()
                      }
                    );
                  }
                  

                  return $state.go('dashboard');
                }
              })
              .catch(function(error){

                if(error.errorCode === 2 && subdomain !== 'app'){
                  return window.location = envService.read('baseAppNoClient');
                }

                if(error.errorCode === 3){
                  $scope.errorMessage = "There was a problem when trying to log in, please contact the administrator and try again in a couple of minutes";
                }

                if(error.errorCode === 5){
                  $scope.errorMessage = "The credentials you used to log in do not seem correct, please check and try again.";
                }

                // Could not log in
                $uibModal.open({
                  animation: true,
                  templateUrl: 'app/pages/login/errorLogin.html',
                  size: 'sm',
                  scope: $scope
                });
              });
          }else{
            cfpLoadingBar.complete();
            return false;
          }
        };
      }]);

})();
