
var app = angular.module('app', ['ngSanitize']);
var mRNAService = app.factory('mRNAService', function($http) {
  return {
    find : function(filter, skip, limit) {
      return $http({method:"GET", url: '/mrna/' + skip + "/" + limit, params: {
          accession : filter.accession,
          organism : filter.organism,
          ontology : filter.ontology,
          gene_name : filter.gene_name,
          gene_id : filter.gene_id,
          annotations : filter.annotations_only
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
  $scope.filter = {};
  $scope.filter.annotations_only = true;
  mRNAService.getSpecies().then(function(result) {
    $scope.species = result.species;
  })

  $scope.search = function() {
    $scope.listings = [];
    mRNAService.find($scope.filter, $scope.skip, $scope.limit).then(function(result) {
        $scope.listings = result;
    });
  }

  $scope.search();

  $scope.renderg4 = function(g4) {
    return renderg4(g4);
  }
});

app.controller('mRNARecordCtrl', function($scope, mRNAService) {
  $scope.fetchRecord = function(accession) {
    mRNAService.getRecord(accession).then(function(result) {
        $scope.mrna = result;
        $scope.loaded = result != null;
      });
  }
  $scope.renderg4 = function(g4) {
    return renderg4(g4);
  }
});
