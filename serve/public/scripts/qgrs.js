
var app = angular.module('app', []);
var qgrsService = app.factory('qgrsService', function($http) {
  return {
    getRecord : function(id) {
      return $http.get('/qgrs/' + id + '/overlaps', {}).then(function(result) {
        return result.data;
      })
    },
    getMRNARecord : function(accession) {
      return $http.get('/mrna/' + accession, {}).then(function(result) {
        return result.data;
      })
    }
  }
});



app.controller('QGRSRecordCtrl', function($scope, qgrsService) {

  $scope.fetchRecord = function(id) {
    qgrsService.getRecord(id).then(function(result) {
        $scope.qgrs = result;
        console.log(result);
        $scope.regionString = makeRegionString(result.is5Prime, result.isCDS, result.is3Prime, result.isDownstream);
        $scope.loaded = result != null;
      });

    var accession = id.split('.')[0] + '.'+ id.split('.')[1];
    qgrsService.getMRNARecord(accession).then(function(result) {
        $scope.mrna = result;
      });
  }

  var makeRegionString = function(utr5, cds, utr3, downstream) {
    console.log("regionstring");
    var words = [];
    if ( utr5) words.push("5'UTR")
    if ( cds) words.push("CDS")
    if ( utr3) words.push("3'UTR")
    if ( downstream) words.push("Downstream from poly(A) site")
    console.log(words);
    if ( words.length > 1 ) {
      return words.join (' and ');
    }
    else
      return words[0];
  }

});
