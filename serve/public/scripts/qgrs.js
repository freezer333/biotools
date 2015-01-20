
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
    },
    getUtr3Records : function() {
      return $http.get('/g4/datasets/g4utr3/listings', {}).then(function(result) {
        return result.data;
      })
    },
    run : function(filter) {
      return $http({method:"GET", url: '/qgrs/mrna/density/analysis', params: filter
      }).then(function(result) {
          return result.data._id;
      });
    },
    update : function(id) {
      return $http.get('/jobs/' + id, {}).then (function (status) {
        return status.data
      },
      function(data) {
        return null;
      });
    },
    getSpecies : function(accession, organism, ontology, skip, limit) {
      return $http.get('/mrna/info/species', {})
                      .then(function(result) {
                          return result.data;
                      });
    }
  }

});



app.controller('QGRSEnrichmentCtrl', function($scope, $interval, qgrsService) {
  $scope.annotations_only = true;
  $scope.organism = "Homo sapiens";

  qgrsService.getSpecies().then(function(result) {
    $scope.species = result.species;
  });

  $scope.run = function() {
    $scope.in_progress = true;
    $scope.complete = false;
    $scope.progress = 0;
    $scope.status = "Starting:   ";
    qgrsService.run($scope.filter).then(function(result) {
        task = $interval( function () {
          var id = result;
          qgrsService.update(id).then(function (status) {
            if (status == null ) {
              $scope.progress = "Analysis Failed";
              $interval.cancel(task);
            }
            else {
              $scope.progress = Math.floor(parseFloat(status.progress) * 100) ;
              $scope.status = status.status;
              if ( status.complete) {
                $interval.cancel(task);
                $scope.progress = 100;
                $scope.in_progress = false;
                $scope.complete = true;

                $scope.results = status.result;
                $('#container').highcharts({
                  chart: {
                    type: 'column'
                  },
                  title: {
                    text: 'Analysis Results'
                  },
                  subtitle: {
                    text: 'QGRS Enrichment - ' + status.result.mrna_count + ' mRNA'
                  },
                  xAxis: {
                    categories: [
                      'Entire mRNA',
                      "5'UTR",
                      'CDS',
                      "3'UTR",
                      'Downstream'
                      ]
                  },
                  yAxis: {
                    min: 0,
                    title: {
                      text: 'QGRS density'
                    }
                  },
                  plotOptions: {
                    column: {
                      pointPadding: 0.2,
                      borderWidth: 0
                    }
                  },
                  series: [{
                    name: 'Average QGRS Denstiy in Region',
                    data: [
                      parseFloat(status.result.avg_density.all) ,
                      parseFloat(status.result.avg_density.utr5) ,
                      parseFloat(status.result.avg_density.cds) ,
                      parseFloat(status.result.avg_density.utr3) ,
                      parseFloat(status.result.avg_density.downstream) ]
                  }],
                });
              }
            }

            });
        }, 2000);

      });
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






app.controller('UTR3DatasetCtrl', function($scope, qgrsService) {
  $scope.fetchSet = function() {
    qgrsService.getUtr3Records().then(function(result) {
        $scope.listings = result;
      });
  }
  $scope.filter = {}
  $scope.filter.minTetrad = 3
  $scope.filter.minConservation = 0.95;
  $scope.fetchSet();
});
