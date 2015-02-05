<%@ taglib prefix="tdg" tagdir="/WEB-INF/tags/thediskgame"%>
<!DOCTYPE html>
<html ng-app="thediskgame">
<head>
<title>The Disk Game - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/thediskgame/">

<!-- javascript includes -->
<tdg:javascriptIncludes jsFiles="${jsFiles}" />

<!-- angular javascript stuff -->
<script>
head.ready( 
 function(){
	var app=angular.module('thediskgame',['ui.bootstrap']);
	 app.controller('tableList',['$scope',function($scope){
		 this.myTables = $scope.myTables = window['myTables'] = ${myTables};
		 this.openTables = $scope.openTables = window['openTables'] = ${openTables};
		 this.activeTables = $scope.activeTables = window['activeTables'] = ${activeTables};
		 
		 $scope.exclude = function( excludeList ) {
			  return function( item ) {
				  

				  for (excludedTable in excludeList)
					{
					  console.log(excludeList[excludedTable]);
					  console.log(item);
					  return excludedTable.id==item.id;
					  }
				  
				  
			  };
			};

	 }]);
});
</script>

<!-- css includes/stuff -->
<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/thediskgame.css" type="text/css" media="all">
<link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet">

<style>
#table_list ol {
	padding-left: 1em;
}

#table_list>li {
	padding-bottom: 1em;
}
</style>

</head>
<body>
	<tdg:header gravatar="${gravatar}" />
	<a href="/thediskgame/game/new">New Game</a>
	<div ng-controller="tableList as tableList" id="container" style="float: left;padding-left: 2em;">
		<h3>My Tables</h3>
		<ul ng-repeat="table in myTables" id="my_tables" style="text-align: left;">
			<li><a href="/thediskgame/game/{{table.id+'/'+table.description.replace(' ','+')}}" tooltip-html="asdasdsd">{{table.description+':'+table.id}}</a></li>
		</ul>
		
		<h3>Open Tables</h3>
		<ul ng-repeat="table in openTables|filter:exclude(myTables)" id="open_tables" style="text-align: left;">
			<li>{{table.description+':'+table.id}}</li>
		</ul>
		<h3>Active Tables</h3>
		<ul ng-repeat="table in activeTables" id="active_tables" style="text-align: left;">
			<li>{{table.description+':'+table.id}}</li>
		</ul>
	</div>

</body>
</html>