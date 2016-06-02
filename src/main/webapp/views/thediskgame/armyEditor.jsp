<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
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
//var playerArmiesJson=${playerArmiesJson};
//var playerDisksJson=${playerDisksJson};
head.ready( 
  function(){
    var app=angular.module('thediskgame',[]);
	app.controller('armyEditor',['$scope',function($scope){
		$scope.addDisk=function(disk){
			console.log($scope.army);
			console.log('addDisk');
			this.army.push(disk);
			
		};
		this.init=function(armyJson){
	        this.army = $scope.army = window['army'] = armyJson;
 	      };
      
	      this.init(${armyJson});
   
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
<body data-ng-controller="armyEditor as armyEditor" >
	<tdg:header gravatar="${gravatar}" />

	<!-- the list of missions -->
	<div style="display: inline-block; vertical-align: top;">
		<h3>My Armies</h3>
		<ul>
			<c:forEach items="${playerArmies}" var="army">
				<li><a href="/thediskgame/armyEditor/${playerName}/${army.key}">${army.key}</a></li>
			</c:forEach>
		</ul>
		<h3>Global Armies</h3>
		<ul>
			<c:forEach items="${globalArmies}" var="army">
				<li><a href="/thediskgame/armyEditor/${army.key}">${army.key}</a></li>
			</c:forEach>
		</ul>
	</div>

	<!-- the army -->
	<form id="form" action="/thediskgame/api" method="POST"
		style="text-align: center; display: inline-block; vertical-align: top;">
		<input type="hidden" name="action" value="SAVE_GLOBAL_ARMY" />
		<div>
			<label class="one" for="armyName">Army Name:</label> <span
				class="two"> <input id="armyName" name="armyName"
				value="${armyName!=null?armyName:'My Army'}" />
			</span>
		</div>

		<div>
			<label class="one" for="disks">Disks:</label>
			<ul id="" class="two">
				<c:forEach items="${armyDisks}" var="disk" varStatus="loop">
					<li data-ng-repeat="army"><c:if test="${!loop.first}">
							<span>up</span>
						</c:if> <c:if test="${!loop.last}">
							<span>down</span>
						</c:if>${disk.key}<span>X</span></li>
				</c:forEach>

			</ul>

		</div>



		<button>Submit</button>
	</form>

	<div style="display: inline-block; vertical-align: top;">
		<label class="one" for="disks">All Disks</label> <input id="disks"
			name="disks" />
		<ul id="campaign" class="two" style="white-space: nowrap;">
			<c:forEach items="${allDisks}" var="disk" varStatus="loop">
				<li><a style="text-decoration: none;" data-ng-click="addDisk()">&lt;-</a>${disk.key}</li>
			</c:forEach>

		</ul>

	</div>


</body>
</html>