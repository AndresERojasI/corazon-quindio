(function() {
	'use strict';

	angular.module('ROA.theme.services')
		.service('RestApi', ['envService', 'SubdomainService', '$http', function(envService, SubdomainService, $http) {
			// Base api endpoint
			var endpoint = envService.read('restApiEndpoint');

			// Service object
			var restApi = {};

			// Validation of the Unique Client identifier
			restApi.validateSubdomain = function(subdomain){
				return new Promise(function(success, fail){
					$http({
					  method: 'GET',
					  url: endpoint + '/clients/subdomain/' + subdomain
					}).then(function (response) {
					    success(response.data);
					  }, function (response) {
					  	fail(response.data);
					  });
				});
			};

			// Autenticate user against the API
			restApi.authenticateUser = function(user, password, subdomain){
				return new Promise(function(success, fail){
					$http({
					  method: 'POST',
					  url: endpoint + '/login/' + subdomain,
					  data: {
					  	user: user,
					  	password: password
					  }
					}).then(function (response) {
					    success(response.data);
					  }, function (response) {
					  	fail(response.data);
					  });
				});
			};

			restApi.validateToken = function(token){
				return new Promise(function(success, fail){
					$http({
					  method: 'POST',
					  url: endpoint + '/validate_token',
					  data: {
					  	token: token
					  }
					}).then(function (response) {
					    success(response.data);
					  }, function (response) {
					  	fail(response.data);
					  });
				});
			};

			restApi.getUserSettings = function(id){
				return new Promise(function(success, fail){
					$http({
					  method: 'GET',
					  url: endpoint + '/user/'+id+'/settings'
					}).then(function (response) {
					    success(response.data);
					  }, function (response) {
					  	fail(response.data);
					  });
				});
			};

			restApi.getAnalytics = function(id, startDate, endDate){
				return new Promise(function(success, fail){
					$http({
					  method: 'POST',
					  url: endpoint + '/client/'+id+'/analytics',
					  data: {
					  	startDate: startDate,
					  	endDate: endDate
					  }
					}).then(function (response) {
					    success(response.data);
					  }, function (response) {
					  	fail(response.data);
					  });
				});
			};

			restApi.getInsights = function(id){
				return new Promise(function(success, fail){
					$http({
					  method: 'GET',
					  url: endpoint + '/client/'+id+'/insights'
					}).then(function (response) {
					    success(response.data);
					  }, function (response) {
					  	fail(response.data);
					  });
				});
			};

			return restApi;

		}])
})();