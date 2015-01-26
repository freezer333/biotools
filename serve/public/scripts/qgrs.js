

var app = angular.module('app', ['ngSanitize']);

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

    getUtr3Records : function(filter) {
      return $http({method:"GET", url: '/g4/datasets/g4utr3/listings', params: filter}).then(function(result) {
        return result.data;
      })
    },
    getUtr3Functions : function() {
      return $http.get('/g4/datasets/g4utr3/functions', {}).then(function(result) {
        return result.data;
      })
    },
    getUtr3Components : function() {
      return $http.get('/g4/datasets/g4utr3/components', {}).then(function(result) {
        return result.data;
      })
    },
    getUtr3Processes : function() {
      return $http.get('/g4/datasets/g4utr3/processes', {}).then(function(result) {
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
        $scope.regionString = makeRegionString(result.is5Prime, result.isCDS, result.is3Prime, result.isDownstream);
        $scope.loaded = result != null;
      });

    var accession = id.split('.')[0] + '.'+ id.split('.')[1];
    qgrsService.getMRNARecord(accession).then(function(result) {
        $scope.mrna = result;
      });
  }

  $scope.renderg4 = function(g4) {
    if ( g4)
      return renderg4(g4);
    return ""
  }

  $scope.render_overlapped_g4 = function(parent, overlapped) {
    return render_overlapped_g4(parent, overlapped);

  }

  var makeRegionString = function(utr5, cds, utr3, downstream) {
    var words = [];
    if ( utr5) words.push("5'UTR")
    if ( cds) words.push("CDS")
    if ( utr3) words.push("3'UTR")
    if ( downstream) words.push("Downstream from poly(A) site")
    if ( words.length > 1 ) {
      return words.join (' and ');
    }
    else
      return words[0];
  }

});






app.controller('UTR3DatasetCtrl', function($scope, $sce, qgrsService) {
  $scope.fetchSet = function() {
    $scope.search_done = false;
    qgrsService.getUtr3Records($scope.filter).then(function(result) {
        $scope.listings = result;
        $scope.search_done = true;
      });
  }
  $scope.search_done = false;
  $scope.filter = {}
  $scope.filter.minTetrad = 3
  $scope.filter.minConservation = 0.95;
  $scope.filter.functions = [];
  $scope.filter.components = [];
  $scope.filter.processes = [];
  qgrsService.getUtr3Functions().then(function(result) {
      $scope.functions = result;
      $scope.filtered_functions = result;
    });
  qgrsService.getUtr3Components().then(function(result) {
      $scope.listed_components = result;
      $scope.filtered_components = result;
    });
  qgrsService.getUtr3Processes().then(function(result) {
      $scope.processes = result;
      $scope.filtered_processes = result;
    });

  $scope.renderg4 = function(g4) {
     if ( g4)
       return renderg4(g4);
      return ""
  }

  function remove_from(a, value) {
    for (var i=a.length-1; i>=0; i--) {
      if (a[i] === value) {
          a.splice(i, 1);
      }
    }
  }

  $scope.add_function = function(value) {
    $scope.filter.functions.push(value)
    $scope.apply_function_filter()
    $scope.fetchSet();
  }
  $scope.remove_function = function(value) {
    remove_from($scope.filter.functions, value);
    $scope.apply_function_filter()
    $scope.fetchSet();
  }
  $scope.apply_function_filter = function() {
    $scope.filtered_functions = $scope.functions.filter(function (item) {
      var search = RegExp( $scope.function_search, "i");
      return item.match(search) && $scope.filter.functions.indexOf(item) == -1;
    });

  }
  $scope.add_component = function(value) {
    $scope.filter.components.push(value)
    $scope.apply_component_filter()
    $scope.fetchSet();
  }
  $scope.remove_component = function(value) {
    remove_from($scope.filter.components, value);
    $scope.apply_component_filter()
    $scope.fetchSet();
  }
  $scope.apply_component_filter = function() {
    $scope.filtered_components = $scope.listed_components.filter(function (item) {
      var search = RegExp( $scope.component_search, "i");
      return item.match(search) && $scope.filter.components.indexOf(item) == -1;
    });
  }


  $scope.add_process = function(value) {
    $scope.filter.processes.push(value)
    $scope.apply_process_filter()
    $scope.fetchSet();
  }
  $scope.remove_process = function(value) {
    remove_from($scope.filter.processes, value);
    $scope.apply_process_filter()
    $scope.fetchSet();
  }
  $scope.apply_process_filter = function() {
    $scope.filtered_processes = $scope.processes.filter(function (item) {
      var search = RegExp( $scope.process_search, "i");
      return item.match(search) && $scope.filter.processes.indexOf(item) == -1;
    });
  }
  $scope.fetchSet();
});
