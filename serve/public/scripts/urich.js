
var app = angular.module('app', []);
var UGCorrelateService = app.factory('UGCorrelateService', function($http) {
  return {
    run : function(filter) {
      return $http({method:"GET", url: '/ugcorrelate/analysis', params: filter
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

app.controller('UGCorrelateCtrl', function($scope, $interval, UGCorrelateService) {
  $scope.annotations_only = true;
  $scope.organism = "Homo sapiens";

  UGCorrelateService.getSpecies().then(function(result) {
    $scope.species = result.species;
  })

  $scope.run = function() {
    $scope.in_progress = true;
    $scope.complete = false;
    $scope.progress = 0;
    $scope.status = "Starting:   ";
    UGCorrelateService.run($scope.filter).then(function(result) {
        task = $interval( function () {
          var id = result;
          UGCorrelateService.update(id).then(function (status) {
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
                    text: 'U-Rich / QGRS Correlation - ' + status.result.mrna_count + ' mRNA'
                  },
                  xAxis: {
                    categories: [
                      'Both',
                      'U Only',
                      'G Only',
                      'Neither'
                      ]
                  },
                  yAxis: {
                    min: 0,
                    title: {
                      text: '%mRNA'
                    }
                  },
                  plotOptions: {
                    column: {
                      pointPadding: 0.2,
                      borderWidth: 0
                    }
                  },
                  series: [{
                    name: 'Motif Correlation',
                    data: [
                      parseFloat(status.result.with_both) / parseFloat(status.result.mrna_count) * 100,
                      parseFloat(status.result.with_u_count_only) / parseFloat(status.result.mrna_count) * 100,
                      parseFloat(status.result.with_g_count_only) / parseFloat(status.result.mrna_count) * 100,
                      parseFloat(status.result.with_neither) / parseFloat(status.result.mrna_count) * 100]
                  }],
                });
              }
            }

            });
        }, 2000);

      });
  }


});
