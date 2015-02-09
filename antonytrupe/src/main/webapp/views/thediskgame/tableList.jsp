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
head.ready(function() {
	var app = angular.module('thediskgame', [ 'ui.bootstrap' ]);
	app.controller('tableList', [ '$scope', function($scope) {
		this.myTables = $scope.myTables = window['myTables'] = ${myTables};
		this.openTables = $scope.openTables = window['openTables'] = ${openTables};
		this.activeTables = $scope.activeTables = window['activeTables'] = ${activeTables};

		$scope.excludeTables = function(table, a, excludeList) {
			console.log(arguments);
			console.log(table.id);
			//console.log(table);
			//console.log(excludeList);
			
			
			for (excludedTable in myTables) {
				//console.log(excludeList[excludedTable]);
				//console.log(item);
				if( myTables[excludedTable].id == table.id)
				{
					console.log('false');
					return false;
				}
			}
			console.log('true');
			//return [];
			return true;
		};
	} ]);
});
</script>

<!-- css includes/stuff -->
<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/thediskgame.css" type="text/css" media="all">
<!-- 
<link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet">
 -->
 
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
			<li><a href="/thediskgame/game/{{table.id+'/'+table.description.replace(' ','+')}}">{{table.description+':'+table.id}}</a></li>
		</ul>
		
		<h3>Open Tables</h3>
		<ul ng-repeat="table in openTables|filter:excludeTables:myTables" id="open_tables" style="text-align: left;">
			<li><a href="/thediskgame/game/{{table.id+'/'+table.description.replace(' ','+')}}">{{table.description+':'+table.id}}</a></li>
		</ul>
		<h3>Active Tables</h3>
		<ul ng-repeat="table in activeTables" id="active_tables" style="text-align: left;">
			<li><a href="/thediskgame/game/{{table.id+'/'+table.description.replace(' ','+')}}">{{table.description+':'+table.id}}</a></li>
		</ul>
	</div>

</body>
</html>