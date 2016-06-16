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
  
  'ROA.theme',
  'ROA.pages',

  'environment'
]).config([
  'AclServiceProvider', 'envServiceProvider',
  function(AclServiceProvider,  envServiceProvider) {

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
        restApiEndpoint: 'http://dev.resultsonair.com:1337',
        baseAppUrl: 'http://app.resultsonair.com:3000',
        baseAppLogin: 'http://app.resultsonair.com:3000/#/login',
        baseAppNoClient: 'http://app.resultsonair.com:3000/#/noClient'
      },
      production: {},
    }
  });

  envServiceProvider.check();
}]);