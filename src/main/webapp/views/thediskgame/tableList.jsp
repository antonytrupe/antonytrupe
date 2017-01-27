<%@ taglib prefix="tdg" tagdir="/WEB-INF/tags/thediskgame"%>
<!DOCTYPE html>
<html data-ng-app="thediskgame.tableList" data-ng-cloak>
<head>
<title>The Disk Game - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/thediskgame/">

<!-- javascript includes -->
<tdg:javascriptIncludes jsFiles="${jsFiles}" />

<!-- angular javascript stuff -->
<script>
head.ready(function() {
	console.log(1);
	var app = angular.module('thediskgame.tableList',[]).run(function($rootScope){
		//
		$rootScope.Object={"keys":Object.keys};
	});
	 console.log(2);
    app.service('PlayerService', function () {
    	var player = window['player'] = new Player();
		player.update(${playerJson});
		//console.log(player);

        return {
            getPlayer: function () {
                return player;
            },
            setPlayer: function(value) {
            	player = value;
            }
        };
    });
    
    app.controller('tableInfo',['$scope',function($scope){
    	//
    	//console.log($scope.table);
    	$scope.table=new Table();
    	$scope.table.restore($scope.tableData);
    	//console.log($scope.table1);
    }]);
    
     console.log(3);
	app.controller('tableList', [ '$scope', 'PlayerService', function($scope,playerService) {
		//console.log('tableList');
		this.myTables = $scope.myTables = window['myTables'] = ${myTables};
		this.openTables = $scope.openTables = window['openTables'] = ${openTables};
		this.activeTables = $scope.activeTables = window['activeTables'] = ${activeTables};
		
		this.player = $scope.player = window['player'] = playerService.getPlayer();
		
		console.log(this.player);
		console.log(this.player.armies);
		$scope.selectedArmyName=Object.keys(this.player.armies)[0];
		 
		$scope.armyNames=this.player.getArmies();
		console.log(5);

		$scope.excludeTables = function(table, a, excludeList) {
			console.log('excludeTables');
			//console.log(arguments);
			//console.log(table.id);
			//console.log(table);
			//console.log(excludeList);
			
			
			for (excludedTable in myTables) {
				//console.log(excludeList[excludedTable]);
				//console.log(item);
				if( myTables[excludedTable].id == table.id)
				{
					//console.log('false');
					return false;
				}
			}
			//console.log('true');
			//return [];
			return true;
		};
	} ]);
	 console.log(4);
});
</script>

<!-- css includes/stuff -->
<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/thediskgame.css" type="text/css"
	media="all">

<style>
ol.table, ul.table {
	display: table;
}

.table>li {
	padding-bottom: 1em;
	display: table-row;
}

.table>li>* {
	display: table-cell;
	border-bottom: thin black solid;
	margin: 1em;
}

.table>.even {
	background-color: lightgrey;
}

.table>.odd {
	background-color: white;
}
</style>

</head>
<body>
	<tdg:header gravatar="${gravatar}" />
	<a href="/thediskgame/game/new">New Game</a>
	<div data-ng-controller="tableList as tableList" id="container"
		data-ng-cloak>
		<h3>My Games</h3>
		<ul data-ng-cloak id="my_tables" style="text-align: left;">
			<li data-ng-repeat="table in myTables"><a
				href="/thediskgame/game/{{table.id+'/'+table.description.replace(' ','+')}}">{{table.description+':'+table.id}}</a>
				<span data-ng-model="table"
				data-ng-controller="tableInfo as tableInfo">{{table1.getPlayers()}}</span>
			</li>
		</ul>

		<!--  -->
		<h3>Joinable Games</h3>
		<!-- table join view -->


		<ul data-ng-cloak class="table" id="open_tables">

			<li><span>Name</span> <span>Points</span> <span>Players</span> <span>Current
					Players</span> <span>Current Phase</span>
				<div>

					<form action="/thediskgame/api?action=JOIN_TABLE" method="post"
						style="display: inline-block;">
						<input data-ng-cloak type="hidden" value="{{table.id}}" name="id" />
						<select id="army" name="army" data-ng-model="selectedArmyName">
							<option data-ng-repeat="armyName in armyNames" data-ng-cloak>{{armyName}}</option>
						</select>
					</form>
					<!-- total points -->
					<span>{{player.getArmyInfo(selectedArmyName).points}} point
					</span>
					<!-- alignments -->
					<span>{{Object.keys(player.getArmyInfo(selectedArmyName).alignments).join('/')}}</span>

					<!-- all factions -->
					<span
						data-ng-repeat="(faction,points) in player.getArmyInfo(selectedArmyName).factions">{{faction}}({{points}})</span>

				</div></li>

			<li data-ng-controller="tableInfo as table" data-ng-model="tableData"
				data-ng-class-odd="'odd'" data-ng-class-even="'even'"
				data-ng-repeat="tableData in openTables|filter:excludeTables:myTables">
				<!-- description --> <a style="vertical-align: top;"
				href="/thediskgame/game/{{table.id+'/'+table.description.replace(' ','+')}}">{{table.description}}</a>

				<!-- table info --> <span>{{table.maxPoints}}</span> <span>{{table.maxPlayers}}</span>
				<span>{{table.getPlayers()}}</span> <span>{{table.getSegment()}}</span>
				<input type="submit" value="Join" />

			</li>
		</ul>

		<h3>In-progress Games</h3>
		<ul data-ng-cloak
			data-ng-repeat="table in activeTables|filter:excludeTables:myTables"
			id="active_tables" style="text-align: left;">
			<li><a
				href="/thediskgame/game/{{table.id+'/'+table.description.replace(' ','+')}}">{{table.description+':'+table.id}}</a></li>
		</ul>

	</div>
</body>
</html>