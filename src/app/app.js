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
  'xeditable',
  'ui.slimscroll',
  'ngJsTree',
  'angular-progress-button-styles',
  'angular-loading-bar',
  'angularMoment',
  'ngBootstrap',
  'angular-cache',
  'ngRadialGauge',
  'nemLogging',
  'ui-leaflet',
  'ngScrollbars',
  'rt.resize',
  'LocalStorageModule',
  'ROA.theme',
  'ROA.pages',

  'environment'
]).config([
  'AclServiceProvider', 'envServiceProvider', 'localStorageServiceProvider',
  function(AclServiceProvider,  envServiceProvider, localStorageServiceProvider) {

  localStorageServiceProvider
      .setPrefix('ROA2')
      .setStorageType('localStorage');;

  // Configurate the ACL Provider
  var myConfig = {
    storage: 'localStorage',
    storageKey: 'roa-app-front-end'
  };
  AclServiceProvider.config(myConfig);

  // Set the configuration for the enviroment variables
  envServiceProvider.config({
    vars: {
      development: {
        restApiEndpoint: 'http://restapi.resultsonair.com:1337',

        baseAppUrl: 'http://54.187.238.34',
        baseAppLogin: 'http://54.187.238.34/#/login'
      },
      production: {},
    }
  });

  envServiceProvider.check();
}]);