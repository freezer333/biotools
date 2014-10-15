
var app = angular.module('app', []);
var needleService = app.factory('needleService', function($http) {
  return {
    align : function(seqa, seqb) {
      return $http.post('/alignment', {seqa:seqa, seqb:seqb})
                      .then(function(result) {
                          return result.data;
                      });
    }
  }
});

app.controller('NeedleCtrl', function($scope, needleService) {
  $scope.show_alignment = false;

  $scope.align = function() {
    $scope.show_alignment = false;
    needleService.align($scope.seqa, $scope.seqb).then(function(result) {
        $scope.aligned_a = result.a;
        $scope.aligned_b = result.b;
        $scope.show_alignment = true;


        /* Build out a javascript method of grouping these into
           divisions similar to QGRS-H sequence output.  Tiles that
           are scrolled, but also perhaps stackable.

           Create standard angular js code to iterate through each "object"
           and create the HTML necessary to display them.

           Make re-usable, so it can be the default sequence viewing method
           throughtout the app - whether there is an aligned sequence or not,
           and whether a motif is highlighted or no*/
    });
  }
});
