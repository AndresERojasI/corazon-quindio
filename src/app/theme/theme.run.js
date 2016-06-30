/**
 * @author v.lugovksy
 * created on 15.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.theme')
    .run(themeRun);

  /** @ngInject */
  function themeRun($rootScope, layoutSizes, $q, $state, SubdomainService, RestApi, envService, $cookies) {

    // Let's inject the state to catch it on the index
    $rootScope.$state = $state;

    // Start the loading screen
    $rootScope.$pageFinishedLoading = false;

    //First we validate the company to check if it exists as one of our clients
    var subdomain = SubdomainService.company || false;

    // Force login on any required page
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
      var requireLogin = toState.data.requireLogin;
      if (requireLogin && typeof $rootScope.currentUser === 'undefined') {
        event.preventDefault();
        var token = $cookies.getObject('roatoken');
        if(token === undefined){
          // get me a login modal!
          return $state.go('login');
        }

        RestApi.validateToken(token[0].token)
          .then(function(result){
            $rootScope.currentUser = result.user;
            $rootScope.currentClient = result.client;
            console.log($rootScope.currentClient);
            return $state.go(toState.name, toParams);
          })
          .catch(function(error){
            return $state.go('login');
          });
      }
    });

    // Validate the domain, if App then continue if not try to find the client
    if(subdomain && subdomain === 'app'){
      $rootScope.$pageFinishedLoading = true;
    }else{

      var whatToWait = [
        RestApi.validateSubdomain(subdomain)
      ];

      $q.all(whatToWait).then(function(result){

        if(result[0].error || Object.keys(result[0]).length === 0){
          return window.location = envService.read('baseAppNoClient');
        }

        $rootScope.$pageFinishedLoading = true;

      })
      .catch(function(error){
        $rootScope.$pageFinishedLoading = true;
        return window.location = envService.read('baseAppLogin');
      });
    }

    $rootScope.$isMobile =  (/android|webos|iphone|ipad|ipod|blackberry|windows phone/).test(navigator.userAgent.toLowerCase());
    $rootScope.$isMenuCollapsed = window.innerWidth <= layoutSizes.resWidthCollapseSidebar;
  }


})();