<%@ taglib prefix="tdg" tagdir="/WEB-INF/tags/thediskgame"%>
<!DOCTYPE html>
<html ng-app="thediskgame">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=9">
<title>battledisks - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/battledisks/">

<!-- javascript includes -->
<tdg:javascriptIncludes jsFiles="${jsFiles}" />


<!-- angular javascript stuff -->
<script>

	head.ready(function() {
		var app = angular.module('thediskgame', []);
		app.controller('table', [ '$scope', function($scope) {
			//
			this.table = $scope.table = window['table'] = new Table();
			//console.log(this.table);
			this.table.restore(${tableJson});
			
			
			//console.log(this.table);
			
			
			var api = window['api'] =new API();
			var ui = window['ui'] =new TableUI(api, this.table, '#table');
			
			//ui.player.update(${playerJson});
			var player = window['player'] = ${playerJson};
			ui.update({'user':player.name});
			//console.log(ui.currentPlayer);
			// $(ui.init);
			//var id = ui.getHashId();
			//table.setId(id);

			//$(api.getTable(id, ui.onSuccess, ui.onError));
			
				
		}]);
		app.filter('isPlayerInSegment', function() {
			  return function( items, segment) {
				//console.log('isPlayerInSegment');
				//console.log(segment);
			    var filtered = [];
			    angular.forEach(items, function(item) {
					//console.log(item);
					//console.log(table.getPlayerInfo(item).segment);
					if(table.getPlayerInfo(item).segment==segment) {
			        	filtered.push(item);
			      	}
			    });
			    return filtered;
			  };
			});
	});
</script>

<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>
<link
	href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/themes/smoothness/jquery-ui.min.css"
	type="text/css" rel="stylesheet" media="all">
<link href="/thediskgame.css" type="text/css" rel="stylesheet"
	media="all">

</head>
<body>
	<tdg:header gravatar="${gravatar}" />

	<div style="position: fixed; top: 4em; bottom: 0px; left: 0; right: 0;">
		<!-- start table -->
		<div ng-controller="table as table" style="height: 100%;">


			<div id="tableInfo" class="collapsible rightHighlight sidebar"
				style="float: right; clear: both; box-shadow: -4px 5px 15px rgba(0, 0, 0, 0.35);">
				<div>{{table.description}}</div>
				<div id="slider" style="margin: 4px 12px;"></div>

				<!--  -->
				<ol style="display: inline-block;">
					<li ng-show="table.getSegment()=='JOIN'"><span>JOIN</span>
						<ol
							ng-repeat="player in table.playerOrder|isPlayerInSegment:'JOIN'">
							<li>{{table.getPlayerInfo(player).name}}</li>
						</ol></li>
					</li>
					<li><span>REINFORCEMENTS</span>
						<ol
							ng-repeat="player in table.playerOrder|isPlayerInSegment:'REINFORCEMENTS'">
							<li>{{table.getPlayerInfo(player).name}}</li>
						</ol></li>
					<li><span>ACTIVATION</span>
						<ol
							ng-repeat="player in table.playerOrder|isPlayerInSegment:'ACTIVATION'">
							<li>{{table.getPlayerInfo(player).name}}</li>
						</ol></li>
					<li><span>MISSILE</span>
						<ol
							ng-repeat="player in table.playerOrder|isPlayerInSegment:'MISSILE'">
							<li>{{table.getPlayerInfo(player).name}}</li>
						</ol></li>
					<li><span>COMBAT</span>
						<ol
							ng-repeat="player in table.playerOrder|isPlayerInSegment:'COMBAT'">
							<li>{{table.getPlayerInfo(player).name}}</li>
						</ol></li>
					<li><span>REMOVE_COUNTERS</span>
						<ol
							ng-repeat="player in table.playerOrder|isPlayerInSegment:'REMOVE_COUNTERS'">
							<li>{{table.getPlayerInfo(player).name}}</li>
						</ol></li>
					<li ng-show="table.getSegment()=='FINISHED'"><span>FINISHED</span></li>
				</ol>

			</div>

			<div id="table">
				<canvas class="highlights"></canvas>
				<canvas class="disks"></canvas>
				<canvas class="move"></canvas>
				<canvas class="tooltips"></canvas>
			</div>


			<!-- context menu -->
			<div id="contextMenu" style="position: absolute;">
				<div class="menuItem DISK_INFO">
					<span class="icon">I</span><span class="text">name</span> <span
						style="right: 0;">&#x25B6;</span>
				</div>
				<div class="menuItem MOVE">
					<img src="/battledisks/i/move_icon.png" class="icon"><span
						class="text">Move</span>
				</div>
				<div class="menuItem REINFORCE">
					<img src="/battledisks/i/move_icon.png" class="icon"><span
						class="text">Move</span>
				</div>
				<div class="menuItem SPELL">
					<span class="icon">S</span> <span class="text">Cast Spell</span>

				</div>
				<div class="menuItem ARROW">
					<span class="icon">A</span><span class="text">Fire <span
						class="count"></span> Arrows
					</span>
				</div>
				<div class="menuItem BOLT">
					<span class="icon">B</span><span class="text">Fire Bolts</span>
				</div>
				<div class="menuItem FIREBALL">
					<span class="icon">F</span><span class="text">Fire Fireballs</span>
				</div>
				<div class="menuItem BOULDER">
					<span class="icon">O</span><span class="text">Fire Boulders</span>
				</div>
				<div class="menuItem ACTIVATE">
					<img alt="A" src="/battledisks/i/Activation.png" class="icon"><span
						class="text">Activate</span>
				</div>
				<div class="menuItem END_ACTIVATIONS">
					<img alt="E" src="/battledisks/i/end_activations_icon.png"
						class="icon"><span class="text">End Activations</span>
				</div>
				<div class="menuItem END_REINFORCEMENTS">
					<span class="icon">C</span><span class="text">End
						Reinforcements</span>
				</div>
				<div class="menuItem END_MISSILES">
					<span class="icon">S</span><span class="text">End Missiles</span>
				</div>
				<div class="menuItem SELECT_ATTACKEE">
					<span class="icon">T</span><span class="text">Select
						Attackee</span>
				</div>
				<div class="menuItem SELECT_DEFENDEE">
					<span class="icon">D</span><span class="text">Select
						Defendee</span>
				</div>
				<div id="diskInfo"
					style="display: none; position: fixed; left: 0; top: 0; padding: 0px 3px;">
					<div id="player"></div>
					<div>
						<span id="faction">Elf</span>, <span id="alignment">Good</span>, <span
							id="cost">4</span> Points
					</div>
					<div>
						<span id="attack">4</span> Attack, <span id="defense">4</span>
						Defense
					</div>
					<div>
						<span id="toughness">4</span> Toughness, <span id="wounds">1</span>
						Wounds
					</div>
					<div>
						<span id="movement">4</span> Flips,<span id="diameter">4</span>
						Diameter,<span id="flying"></span>
					</div>
					<div></div>
				</div>
				<ol id="spells"
					style="display: block; position: fixed; left: 0; top: 0; padding: 0px 3px;">
					<li>ZIP</li>
					<li>ZIP</li>
					<li>ZIP</li>
				</ol>
			</div>
			<!-- end context menu -->

		</div>
		<!-- end table -->
	</div>

</body>
</html>