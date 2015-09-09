<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="tdg" tagdir="/WEB-INF/tags/thediskgame"%>
<!DOCTYPE html>
<html style="height: 100%;" data-ng-app="thediskgame">
<head>
<title>battledisks - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/battledisks/">

<!-- javascript includes -->
<tdg:javascriptIncludes jsFiles="${jsFiles}" />

<!-- angular javascript stuff -->
<script>
head.ready( 
  function(){
    var app=angular.module('thediskgame',[]);
	app.controller('missionEditor',['$scope',function($scope){
		this.init=function(missionJson){
	        this.mission = $scope.mission = window['mission'] = missionJson;
 	      };
      
	      this.init(${missionJson});
   
    }]);
	app.controller('missionList',['$scope',function($scope){
	      this.init=function(missions){
	    	//console.log(disksJson);
	        this.missions = window.missions=$scope.missions = missions;
	      };
	      this.init(${allMissionsJson});
	    }]);
});
</script>

<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="/thediskgame.css" type="text/css"
	media="all">

<script type="text/javascript">
	var _gaq = _gaq || [];
	_gaq.push([ '_setAccount', 'UA-4582706-4' ]);
	_gaq.push([ '_trackPageview' ]);

	(function() {
		var ga = document.createElement('script');
		ga.type = 'text/javascript';
		ga.async = true;
		ga.src = ('https:' == document.location.protocol ? 'https://ssl'
				: 'http://www')
				+ '.google-analytics.com/ga.js';
		var s = document.getElementsByTagName('script')[0];
		s.parentNode.insertBefore(ga, s);
	})();
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

	<!-- the list of missions -->
	<div style="display: inline-block;">
		<h3>Missions</h3>
		<ul>
		<c:forEach items="${allMissions}" var="mission">
			<li><a href="/thediskgame/missionEditor/${mission.key}">${mission.key}</a></li>
		</c:forEach>
		</ul>
	</div>

	<div id="container" style="text-align: center;">
		<h3>New Mission</h3>
		<form id="form" action="/thediskgame/api" method="GET"
			style="text-align: center;">
			<input type="hidden" name="action" value="CREATE_MISSION" />

			<div>
				<label class="one" for="campaign">Campaign:</label> <span
					class="two"> <input id="campaign" name="campaign"
					value="${campaign!=null?campaign:'My Campaign'}" />
				</span>
			</div>

			<div>
				<label class="one" for="mission">Mission:</label> <span class="two">
					<input id="mission" name="mission"
					value="${mission!=null?mission:'My Mission'}" />
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
				<label class="one" for="startingDisks">Starting Disks:</label> <span
					class="two"> <input
					value="${startingDisks!=null?startingDisks:6}" type="number"
					name="startingDisks" id="startingDisks" min="1" max="10" />
				</span>
			</div>
			<div>
				<label class="one" for="reinforcements">Reinforcement per
					Round:</label> <span class="two"> <input
					value="${reinforcements!=null?reinforcements:3}" type="number"
					name="reinforcements" id="reinforcements" min="1" max="10" />
				</span>
			</div>
			<div>
				<label class="one" for="activations">Activations per round:</label>
				<span class="two"> <input
					value="${activations!=null?activations:3}" type="number"
					name="activations" id="activations" min="1" max="5" />
				</span>
			</div>

			<div>
				<label class="one" for="alignmentRestriction">Alignment
					Restriction:</label> <span class="two"> <select
					name="alignmentRestriction" id="alignmentRestriction">
						<option value="Neutral"
							${alignmentRestriction==Neutral?"selected=\"selected\"":""}>Neutral
							Allowed</option>
						<option value="Single"
							${alignmentRestriction=="Single"?" selected=\"selected\"":""}>Single
							Alignment</option>
						<option value="None"
							${alignmentRestriction=="None"?" selected=\"selected\"":""}>None</option>
				</select>
				</span>
			</div>

			<div>
				<label class="one" for="maxPlayers">Players:</label> <span
					class="two"> <input name="maxPlayers" id="maxPlayers"
					type="number" min="2" max="6"
					value="${maxPlayers!=null?maxPlayers:2}" />
				</span>
			</div>

			<div>
				<fieldset style="display: inline;">
					<legend>Player One</legend>

					<!--  -->
					<label class="one" for="playerControl1">Player Control:</label><span
						class="two"> <input name="control1" id="playerControl1"
						type="radio" value="player"
						${control1!="ai"?" checked=\"checked\"":""} />
					</span>
					<!--  -->
					<label class="one" for="aiControl1">AI Control:</label><span
						class="two"> <input name="control1" id="aiControl1"
						type="radio" value="ai"
						${control1=="ai"?" checked=\"checked\"":""} />
					</span>

					<!--  -->
					<label class="one" for="armyName1">Army:</label> <span class="two">
						<select id="armyName1" name="armyName1">
							<option value="">Player Choice</option>
					</select>
					</span>

					<!--  -->
					<label class="one" for="maxPoints1">Army Points:</label> <span
						class="two"> <input name="maxPoints1" id="maxPoints1"
						type="number" min="10" max="500"
						value="${maxPoints1!=null?maxPoints1:50}" />
					</span>
				</fieldset>
			</div>

			<div>
				<fieldset style="display: inline;">
					<legend>Player Two</legend>

					<!--  -->
					<label class="one" for="playerControl2">Player Control:</label><span
						class="two"> <input name="control2" id="playerControl2"
						type="radio" value="player"
						${control2=="player"?" checked=\"checked\"":""} />
					</span>
					<!--  -->
					<label class="one" for="aiControl2">AI Control:</label><span
						class="two"> <input name="control2" id="aiControl2"
						type="radio" value="ai"
						${control2!="player"?" checked=\"checked\"":""} />
					</span>

					<!--  -->
					<label class="one" for="armyName2">Army:</label> <span class="two">
						<select id="armyName2" name="armyName2">
							<option value="">Player Choice</option>
					</select>
					</span>

					<!--  -->
					<label class="one" for="maxPoints2">Army Points:</label> <span
						class="two"> <input name="maxPoints2" id="maxPoints2"
						type="number" min="10" max="500"
						value="${maxPoints2!=null?maxPoints2:50}" />
					</span>
				</fieldset>
			</div>

			<button>Submit</button>
		</form>
	</div>
</body>
</html>