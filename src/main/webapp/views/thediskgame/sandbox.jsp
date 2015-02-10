<!DOCTYPE html>
<html>
<head>
<title>battledisks - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/battledisks/">
<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="style.css" type="text/css" media="all">

<script src="/head.load.min.js"></script>
<script type="text/javascript">
	head.js("https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js",
	//prod
	//"/battledisks/battledisks.min.js",
	//dev
	
	"/com/antonytrupe/battledisks/Main.js",
			"/com/antonytrupe/battledisks/Disk.js",
			"/com/antonytrupe/battledisks/Point.js",
			"/com/antonytrupe/battledisks/Player.js",
			"/com/antonytrupe/battledisks/Table.js",
			"/com/antonytrupe/battledisks/TableUI.js",
			"/com/antonytrupe/battledisks/UI.js",
			"/com/antonytrupe/battledisks/API.js", 
			function() {
				//console.log(0);
				new Main().sandbox();
				//console.log(100);
			});
</script>

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

</head>
<body>
	<div class="sidebar" id="sideLeft" style="position: static;float: left;">
		<div id="navigation">
			<a href="./" class="tab">battledisks</a><br />
			<a id="log_in" href="/login.html?return_to=battledisks%2Fapi%3Faction%3DLOG_IN">log in</a><br /> 
			<a id="shop" href="shop.html">shop</a><br /> 
			<a class="table_list" href="table_list.html">table list</a><br /> 
			<a class="new_table" href="/login.html?return_to=battledisks%2Fnew_table.html">new table</a><br />
			<a class="leaderboard" href=leaderboard.html>leaderboard</a><br />
		</div>
	</div>

	<div class="sidebar" id="sideRight">
		<div id="footer"></div>
	</div>
	
	<div id="container" style="width: 80%;margin: auto;">
		<div>Lay waste to your enemies' disks. Shoot them with arrows from cover. Blast them with magic from a distance.</div>
		<div id="beforeContainer" style="width:600px;height:600px;display:inline-block;border:thin black solid;">
			<canvas class="highlights" style="position:absolute;"></canvas>
			<canvas class="disks" style="position:absolute;"></canvas>
			<canvas class="move" style="position:absolute;"></canvas>
			<canvas class="tooltips" style="position:absolute;"></canvas>
		</div>

		<div id="afterContainer" style="width:600px;height:600px;display:inline-block;border:thin black solid;">
			<canvas class="highlights" style="position:absolute;"></canvas>
			<canvas class="disks" style="position:absolute;"></canvas>
			<canvas class="move" style="position:absolute;"></canvas>
			<canvas class="tooltips" style="position:absolute;"></canvas>
		</div>
	</div>
</body>
</html>