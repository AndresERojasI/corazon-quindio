/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.pages.profile')
    .controller('ProfilePageCtrl', ProfilePageCtrl);

  /** @ngInject */
  function ProfilePageCtrl($scope, $filter, $rootScope, $uibModal, RestApi, AnalyticsService) {

      $scope.user = {
          picture : $filter('profilePicture')($rootScope.currentUser.profile_picture),
          name : $rootScope.currentUser.name,
          email : $rootScope.currentUser.email,
          occupation : $rootScope.currentUser.occupation,
          password : $rootScope.currentUser.password,
          passwordConfirm: ''
      };

      $scope.updateProfile = function(){
          if($scope.user.length == 0){
              $uibModal.open({
                  animation: true,
                  template: 'app/theme/generalViews/noPassword.html',
                  size: 'sm',
                  scope: $rootScope,
                  keyboard: false,
                  backdrop: 'static'
              });

              return;
          }

          if($scope.user.length < 6){
              $uibModal.open({
                  animation: true,
                  template: 'app/theme/generalViews/notLongPassword.html',
                  size: 'sm',
                  scope: $rootScope,
                  keyboard: false,
                  backdrop: 'static'
              });

              return;
          }

          /**if($scope.user.password != $scope.user.passwordConfirm){
              $uibModal.open({
                  animation: true,
                  template: 'app/theme/generalViews/passwordMissmatch.html',
                  size: 'sm',
                  scope: $rootScope,
                  keyboard: false,
                  backdrop: 'static'
              });

              return;
          }**/

          var infoModal = $uibModal.open({
              animation: true,
              templateUrl: 'app/theme/generalViews/savingProfile.html',
              size: 'sm',
              scope: $rootScope,
              keyboard: false,
              backdrop: 'static'
          });

          RestApi.setUserProfile($rootScope.currentUser.userId, $scope.user)
              .then(function(response){
                  alert('Changes saved');
                  infoModal.close();
                  window.reload();
              })
              .catch(function(error){
                  alert('Error saving changes');
                  infoModal.close();
              });
      };


      if($rootScope.userSettings){
          var settingscopy = JSON.parse(JSON.stringify($rootScope.userSettings));
          $scope.settings = {
              goalField: $rootScope.userSettings.goalField,
              goalLimit: $rootScope.userSettings.goalLimit,
              goalRevenue: $rootScope.userSettings.goalRevenue,
              currency: $rootScope.userSettings.currency,
              queryStartdate: $rootScope.userSettings.queryStartdate,
              queryEnddate: $rootScope.userSettings.queryEnddate
          };
      }else{
          //Intercept the Loaded information action
          $rootScope.$on('informationLoaded', function(){
              $scope.settings = {
                  goalField: $rootScope.userSettings.goalField,
                  goalLimit: $rootScope.userSettings.goalLimit,
                  goalRevenue: $rootScope.userSettings.goalRevenue,
                  currency: $rootScope.userSettings.currency,
                  queryStartdate: $rootScope.userSettings.queryStartdate,
                  queryEnddate: $rootScope.userSettings.queryEnddate
              };
          });
      }


      $scope.updateSettings = function(){
          var infoModal = $uibModal.open({
              animation: true,
              templateUrl: 'app/theme/generalViews/savingSettings.html',
              size: 'sm',
              scope: $rootScope,
              keyboard: false,
              backdrop: 'static'
          });


          RestApi.setUserSettings($rootScope.currentUser.userId, $scope.settings)
              .then(function(response){
                  window.reload();
              })
              .catch(function(error){
                  window.reload();
              });
      };



  }

})();
