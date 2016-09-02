(function() {
    'use strict';

    angular.module('ROA.theme.services')
        .service('Map', ['$rootScope', 'leafletData', 'RestApi', 'localStorageService',
            function($rootScope, leafletData, RestApi, localStorageService) {

                L.Map.include({
                    'clearLayers': function () {
                        this.eachLayer(function (layer) {
                            this.removeLayer(layer);
                        }, this);
                    }
                });

                // Service object
                var mapService = {};

                mapService.initMap = function () {
                    
                    var centerLat = 4.500576;
                    var centerLong = -75.722682;

                    L.Icon.Default.imagePath = 'images';
                    L.DomUtil.TRANSITION = true;

                    $rootScope.markersWatchOptions = {
                        doWatch: false,
                            isDeep: false,
                            individual: {
                            doWatch: false,
                                isDeep: false
                        }
                    };

                    $rootScope.center = {
                        lat: centerLat,
                        lng: centerLong,
                        zoom: 12
                    };

                    $rootScope.defaults = {
                        tileLayer: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                        minZoom: 0,
                        maxZoom: 15,
                        continuousWorld: true,
                        tileLayerOptions: {
                            opacity: 0.9,
                            detectRetina: true,
                            reuseTiles: true
                        },
                        scrollWheelZoom: true,
                        invalidateSize: false,
                        markerZoomAnimation: true
                    };

                    leafletData.getMap().then(function(map) {
                        mapService.mapInstance = map;
                    });

                    mapService.getMarkerCluster();
                };

                mapService.getMarkerCluster = function(){
                    mapService.markersGroup = undefined;
                    mapService.markersGroup = L.markerClusterGroup({
                        showCoverageOnHover: false,
                        zoomToBoundsOnClick: true,
                        removeOutsideVisibleBounds: false,
                        animate: true,
                        animateAddingMarkers: true,
                        spiderfyOnMaxZoom: false,
                        iconCreateFunction: function(cluster) {
                            var total_child = cluster.getChildCount();
                            var new_percentage = ((total_child * 100) / total_count_visits);
                            var range = Math.round(new_percentage / 10) * 10;
                            if (range > 100) {
                                range = 100
                            };
                            return L.divIcon({
                                html: '<div class="marker-cluster-element range-' + range + '">' + total_child + '</div>'
                            });
                        }
                    });
                };

                var total_count_visits = 0,
                    citiesDirectory = {};

                var determinePercentage = function(total, value) {
                    var new_percentage = ((value * 100) / total);
                    var range = Math.round(new_percentage / 10) * 10;

                    if (range > 100) {
                        range = 100
                    }

                    return range;
                };


                mapService.initMap();

                mapService.markers = [];
                mapService.points = [];

                mapService.LocalGeocodeSet = function(CitiesSet){
                    if(localStorageService.length == 0){
                        return CitiesSet;
                    }

                    // Cleanup and Filtering empty sets
                    CitiesSet
                        .filter(function(item) {
                            return item.city != null && item.country != null;
                        })
                        .map(function(item) {
                            total_count_visits += item.visit_count;

                            citiesDirectory[item.city] = item.visit_count;

                            return {
                                city: item.city,
                                country: item.country,
                                count: item.visit_count
                            };
                        });

                    //Fill lat/long and leave the unknown cities
                    var unknown = [];

                    CitiesSet
                        .map(function(item){
                            var key = "Geocode/" + item.city;
                            var temporal_city = localStorageService.get(key);

                            if(temporal_city) {
                                mapService.points.push([temporal_city.latitude, temporal_city.longitude]);

                                //Todo, fix country definition in mapquest
                                var count = citiesDirectory[item.city] || 0;

                                var range = determinePercentage(total_count_visits, count);

                                //icon definition
                                var icon_marker = L.divIcon({
                                    html: '1',
                                    className: 'marker-cluster-element .range-0',
                                    iconAnchor: [40, 40]
                                });

                                for (var j = 0; j < count; j++) {
                                    mapService.markers.push(
                                        L.marker(
                                            [temporal_city.latitude, temporal_city.longitude], {
                                                icon: icon_marker
                                            }
                                        )
                                    );
                                }


                            }else{
                                unknown.push(item);
                            }
                        });
                    try{
                        mapService.markersGroup.addLayers(mapService.markers);
                        mapService.mapInstance.fitBounds(mapService.points);
                        mapService.mapInstance.addLayer(mapService.markersGroup);
                    }catch(e){
                        console.log('Error:');
                        console.log(e);
                    }

                    return unknown;
                };

                mapService.GeocodeSet = function(CitiesSet) {

                    mapService.mapInstance.removeLayer(mapService.markersGroup);
                    mapService.getMarkerCluster();

                    mapService.markers = [];
                    mapService.points = [];
                    //mapService.initMap();

                    // Clean up the cities list
                    var cities_list = mapService.LocalGeocodeSet(CitiesSet);

                    var i, j, temparray, chunk = 100;


                    for (i = 0, j = cities_list.length; i < j; i += chunk) {
                        temparray = cities_list.slice(i, i + chunk);

                        RestApi.geocodeCities(CitiesSet)
                            .then(function(result) {
                                result.map(function(city) {
                                    var key = "Geocode/" + city.city;
                                    localStorageService.set(key, city);

                                    mapService.points.push([city.latitude, city.longitude]);

                                    //Todo, fix country definition in mapquest
                                    var count = citiesDirectory[city.city] || 0;

                                    $rootScope.citiesLoaded = true;

                                    var range = determinePercentage(total_count_visits, count);

                                    //icon definition
                                    var icon_marker = L.divIcon({
                                        html: '1',
                                        className: 'marker-cluster-element .range-0',
                                        iconAnchor: [40, 40]
                                    });

                                    for (var j = 0; j < count; j++) {
                                        mapService.markers.push(
                                            L.marker(
                                                [city.latitude, city.longitude], {
                                                    icon: icon_marker
                                                }
                                            )
                                        );
                                    }
                                });

                                mapService.markersGroup.addLayers(mapService.markers);
                                mapService.mapInstance.fitBounds(mapService.points);
                                mapService.mapInstance.addLayer(mapService.markersGroup);
                            })
                            .catch(function(error) {
                                console.log(error);
                            });
                    }
                };

                return mapService;

            }
        ])
})();