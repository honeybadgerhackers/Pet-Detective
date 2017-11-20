angular.module('pet-detective', ['google.places', 'ngTagsInput', 'angularUtils.directives.dirPagination'])
  .controller('appController', function () {
  })
  .directive('app', function () {
    return {
      scope: {},
      restrict: 'E',
      controller: 'appController',
      controllerAs: 'ctrl',
      bindToController: true,
    };
  });
