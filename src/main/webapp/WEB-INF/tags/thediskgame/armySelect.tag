<script>
console.log(5);
head.ready(function() {
	var app = angular.module('thediskgame');
	app.controller('armySelecter',['$scope','PlayerService',
		function($scope, playerService) {
			this.player = $scope.player = playerService.getPlayer();

			$scope.selectedArmyName = Object.keys(this.player.armies)[0];

			$scope.armyNames = this.player.getArmies();

			//$scope.selectedArmyInfo=player.getArmyInfo($scope.selectedArmyName);

		} ]);
	});
</script>
<div data-ng-controller="armySelector as armySelector">
	<select id="armyName" name="armyName" data-ng-model="selectedArmyName"
		style="vertical-align: top;">
		<option data-ng-repeat="armyName in armyNames">{{armyName}}</option>
	</select>
	<div style="display: inline-block; position: absolute;">
		<div>
			<span>{{player.getArmyInfo(selectedArmyName).points}} point
				{{player.getArmyInfo(selectedArmyName).faction}}</span>
		</div>
		<div data-ng-repeat="(faction,points) in player.getArmyInfo(selectedArmyName).factions">{{faction}}:{{points}}</div>
	</div>
</div>