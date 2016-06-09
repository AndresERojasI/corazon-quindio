(function() {
	'use strict';

	angular.module('ROA.theme.services')
		.service('SubdomainService', ['$location', '$sanitize', function($location, $sanitize) {

			var service = {};
		    var host = $location.host();

		    if (host.indexOf('.') >= 0) {
		      service.company = $sanitize(host.split('.')[0]);
		    }

		    return service;

		}])
})();