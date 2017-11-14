angular.module('pet-detective')
  .factory('fetchCoordsFactory', function ($http, $q) {
    return {
      fetchCoords() {
        const prom = $q.defer();
        $http.get('/bulletin')
          .then(function (data) {
            prom.resolve({
              data: data.data,
              coords: data.data.map(function (el) {
                return el.latlong.split(',');
              }),
            });
          });
        return prom.promise;
      },
    };
  })
  .controller('fetchCoordsController', function () {

  })
  .directive('fetchCoords', function fetchCoordsDirective() {
    return {
      scope: {
      },
      restrict: 'E',
      controller: 'petFormController',
      controllerAs: 'ctrl',
      bindToController: true,
      template: '<div></div>',
    };
  });
