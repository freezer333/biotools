
var app = angular.module('app', []);
var mRNAService = app.factory('mRNAService', function($http) {
  return {
    find : function(accession, organism, ontology, annotations, skip, limit) {
      return $http({method:"GET", url: '/mrna/' + skip + "/" + limit, params: {
          accession : accession,
          organism : organism,
          ontology : ontology,
          annotations : annotations
      }}).then(function(result) {
          return result.data;
      });
    },
    getRecord : function(accession) {
      return $http.get('/mrna/' + accession, {}).then(function(result) {
        return result.data;
      })
    },
    getSpecies : function(accession, organism, ontology, skip, limit) {
      return $http.get('/mrna/info/species', {})
                      .then(function(result) {
                          return result.data;
                      });
    }
  }
});

app.controller('mRNACtrl', function($scope, mRNAService) {
  $scope.listings = [];
  $scope.skip = 0;
  $scope.limit = 25;
  $scope.annotations_only = true;
  mRNAService.getSpecies().then(function(result) {
    $scope.species = result.species;
  })

  $scope.search = function() {
    $scope.listings = [];
    mRNAService.find($scope.accession, $scope.organism, $scope.ontology, $scope.annotations_only, $scope.skip, $scope.limit).then(function(result) {
        $scope.listings = result;


    });
  }

  $scope.search();
});

app.controller('mRNARecordCtrl', function($scope, mRNAService) {
  $scope.fetchRecord = function(accession) {
    mRNAService.getRecord(accession).then(function(result) {
        $scope.mrna = result;
        $scope.loaded = result != null;
      });
  }
});
