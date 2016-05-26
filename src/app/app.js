'use strict';

angular.module('ROA', [
  'mm.acl',
  'ngAnimate',
  'ngAria',
  'ngCookies',
  'ngMessages',
  'ngResource',
  'ngRoute',
  'ui.bootstrap',
  'ui.sortable',
  'ui.router',
  'ngTouch',
  'toastr',
  'smart-table',
  "xeditable",
  'ui.slimscroll',
  'ngJsTree',
  'angular-progress-button-styles',

  'ROA.theme',
  'ROA.pages'
]).config(['AclServiceProvider',function(AclServiceProvider) {
  // Configurate the ACL Provider
  var myConfig = {
    storage: 'localStorage',
    storageKey: 'roa-app-front-end'
  };
  AclServiceProvider.config(myConfig);
}]);