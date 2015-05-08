<%@ taglib prefix="tdg" tagdir="/WEB-INF/tags/thediskgame"%>
<!DOCTYPE html>
<html ng-app="thediskgame" style="height: 100%;">
<head>
<title>battledisks - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/battledisks/">
<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/thediskgame.css" type="text/css"
	media="all">

<!-- javascript includes -->
<tdg:javascriptIncludes jsFiles="${jsFiles}" />

<!-- angular javascript stuff -->
<script>
console.log(5);
head.ready(function() {
	console.log(5);
	var app = angular.module('thediskgame', []);
	app.controller('newTable', [ '$scope', function($scope) {
		//
		//console.log('newTable');
		
		//console.log(${playerJSON});
		this.player = $scope.player = window['player'] = new Player();
		this.player.update(${playerJson});
		 
		 $scope.selectedArmyName=Object.keys(this.player.armies)[0];
		 
		 $scope.armyNames=this.player.getArmies();
		 
		 //$scope.selectedArmyInfo=player.getArmyInfo($scope.selectedArmyName);
		 
	} ]);
});
</script>

<style>
.one {
	text-align: right;
	display: inline-block;
	width: 40%;
	vertical-align: top;
}

.two {
	text-align: left;
	display: inline-block;
	width: 40%;
}
</style>
</head>
<body>
	<tdg:header gravatar="${gravatar}" />
	<a href="/thediskgame/games">view games</a>

	<div id="container" style="text-align: center;">
		<h3>New Game</h3>
		<form ng-controller="newTable as newTable" id="form"
			action="/thediskgame/api" method="GET" style="text-align: center;">
			<input type="hidden" name="action" value="CREATE_TABLE" />

			<div>
				<label class="one" for="army">Army:</label>
				<span class="two">
					<select id="armyName" name="armyName" ng-model="selectedArmyName" style="vertical-align: top;">
						<option ng-repeat="armyName in armyNames">{{armyName}}</option>
					</select>
					<div style="display: inline-block; position: absolute;">
						<div><span>{{player.getArmyInfo(selectedArmyName).points}} point {{player.getArmyInfo(selectedArmyName).faction}}</span></div>
						<div ng-repeat="(faction,points) in player.getArmyInfo(selectedArmyName).factions">{{faction}}:{{points}}</div>
					</div>
				</span>
			</div>

			<div>
				<label class="one" for="maxPoints">Army Points:</label> <span
					class="two"> <input name="maxPoints" id="maxPoints"
					type="number" min="10" max="500" value="50" />
				</span>
			</div>

			<div>
				<label class="one" for="maxPlayers">Players:</label> <span
					class="two"> <input name="maxPlayers" id="maxPlayers"
					type="number" min="1" max="6" value="2" />
				</span>
			</div>

			<div>
				<label class="one" for="startingDisks">Starting Disks:</label> <span
					class="two"> <input value="6" type="number"
					name="startingDisks" id="startingDisks" min="1" max="10" />
				</span>
			</div>
			<div>
				<label class="one" for="reinforcements">Reinforcement per
					Round:</label> <span class="two"> <input value="6" type="number"
					name="reinforcements" id="reinforcements" min="1" max="10" />
				</span>
			</div>
			<div>
				<label class="one" for="activations">Activations per round:</label>
				<span class="two"> <input value="3" type="number"
					name="activations" id="activations" min="1" max="5" />
				</span>
			</div>
			<div>
				<label class="one" for="scenario">Scenario:</label> <span
					class="two"> <select name="scenario" id="scenario">
						<option>Annihilation</option>
				</select>
				</span>
			</div>
			<div>
				<label class="one" for="alignmentRestriction">Alignment
					Restriction:</label> <span class="two"> <select
					name="alignmentRestriction" id="alignmentRestriction">
						<option value="Neutral">Neutral Allowed</option>
						<option value="Single">Single Alignment</option>
						<option value="None">None</option>
				</select>
				</span>
			</div>

			<div>
				<label class="one" for="description">Description:</label> <span
					class="two"> <input id="description" name="description"
					value="My Game" />
				</span>
			</div>

			<button>Submit</button>
		</form>
	</div>
</body>
</html>