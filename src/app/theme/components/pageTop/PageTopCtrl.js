/**
 * @author v.lugovksy
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('ROA.theme.components')
      .controller('PageTopCtrl', PageTopCtrl);

  /** @ngInject */
  function PageTopCtrl($scope, sidebarService, $location) {
  	drawMenu();
  	$scope.$on('$locationChangeSuccess', function() {
        drawMenu();
    });

    function drawMenu(){
    	var menuItems = sidebarService.getMenuItems();

	  	for (var i = 0, len = menuItems.length; i < len; i++) {
	  		var rootName = menuItems[i].root.replace('#', '');
	  		
	  		if($location.$$url == rootName){
	  			menuItems[i].active = true;
	  			break;
	  		}
	  	}

	  	$scope.menu = menuItems;
    }
  }
})();