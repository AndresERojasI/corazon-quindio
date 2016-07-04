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
        restApiEndpoint: 'http://10.0.0.9:1337',

        baseAppUrl: 'http://app2.resultsonair.com',
        baseAppLogin: 'http://app2.resultsonair.com/#/login',
        baseAppNoClient: 'http://app2.resultsonair.com/#/noClient'
      },
      production: {},
    }
  });

  envServiceProvider.check();
}]);