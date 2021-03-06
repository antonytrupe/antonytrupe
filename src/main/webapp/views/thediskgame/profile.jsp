<!DOCTYPE html>
<html>
<head>
<title>profile - battledisks - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/battledisks/">

<script src="//cdnjs.cloudflare.com/ajax/libs/headjs/1.0.3/head.load.min.js"></script>

<script type="text/javascript">
	head.load("https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js",
			//"/ca/jimr/gae/profiler/resources/jquery.tmpl.min.js",
			//"/ca/jimr/gae/profiler/resources/mini_profiler.js",
			//"/battledisks/battledisks.min.js",
			"/com/antonytrupe/thediskgame/Main.js",
			"/com/antonytrupe/thediskgame/Point.js",
			"/com/antonytrupe/thediskgame/Player.js",
			"/com/antonytrupe/thediskgame/UI.js",
			"/com/antonytrupe/thediskgame/ProfileUI.js",
			"/com/antonytrupe/thediskgame/API.js",
			//wait for everything to load
			function() {
				//wait for the template iframe to load
				//$("mini-profiler-templates").ready(function (){
					//MiniProfiler.init({
					  //  requestId: '-1',
					   // baseURL: '/gae_mini_profile/'
					//});
				//});
				new Main().profile();
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

<link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>
<!-- <link href="/ca/jimr/gae/profiler/resources/mini_profiler.css" rel="stylesheet" type="text/css"	media="all"> -->
<link href="/thediskgame.css" type="text/css" rel="stylesheet" media="all">

</head>
<body>
	<!-- <iframe id="mini-profiler-templates" src="/ca/jimr/gae/profiler/resources/mini_profiler.html" style="display:none"></iframe>
	<div id="mp" style="display: none;"></div>
	<div id="mp-req" style="display: none;"></div>
	 -->
	<div class="sidebar" id="navigation">
		<a href="./">battledisks</a><br />
		<a id="log_in" href="/login.html?return_to=battledisks%2Fapi%3Faction%3DLOG_IN">log in</a><br />
		<a id="log_out" href="/openid/?logout=logout&return_to=%2Fbattledisks%2F">log out</a><br />
		<a id="shop" href="shop.html">shop</a><br />
		<a class="table_list" href="table_list.html">table list</a><br />
		<a class="new_table" href="/login.html?return_to=battledisks%2Fnew_table.html">new table</a><br />
		<a class="leaderboard" href=leaderboard.html>leaderboard</a><br />
	</div>

	<div id="directions" class="rightHighlight sidebar">
	</div>
		
	<div id="myActiveTables" class="rightHighlight sidebar" >
		<div style="font-size:2em;">Games</div>
		<ul style="white-space: nowrap;"></ul>
	</div>
	
	<!-- 	
	<div id="armyControl" class="rightHighlight sidebar">
		<div style="font-size:1.5em;">Armies</div>
		<ul id="armies"></ul>
	</div>
 	-->
 
	<div id="armyInfo" class="rightHighlight sidebar">
		<input id="armyName" list="armies" style="font-size:1.5em;text-align: center;" value="New Army" hidden="hidden" />
		<datalist id="armies"></datalist>
		<div class="content">

			<table style="border-collapse: collapse;margin:auto;">
				<caption>Factions</caption>
				<thead>
					<tr>
						<th>Faction</th>
						<th>Points</th>
						<th>Percentage</th>
					</tr>
				</thead>
				<tfoot>
					<tr>
						<th>ALL</th>
						<td class="points"></td>
						<td>100%</td>
					</tr>
				</tfoot>
				<tbody id="factions">
				</tbody>
			</table>

			<!--  -->
			<table style="border-collapse: collapse;margin:auto;">
				<caption>Alignments</caption>
				<thead>
					<tr>
						<th>Alignment</th>
						<th>Points</th>
					</tr>
				</thead>
				<tfoot>
					<tr>
						<th>ALL</th>
						<td class="points"></td>
					</tr>
				</tfoot>
				<tbody id="alignments">
				</tbody>
			</table>

			<div style="">
				<span style="text-decoration:underline;">Disks</span>
				<ol id="armyDisks"></ol>
			</div>
			<button id="save">Save Army</button>
		</div>
	</div>

	<div id="table">
		<canvas id="highlights"></canvas>
 		<canvas id="disks"></canvas>
		<canvas id="move"></canvas>
	</div>

</body>
</html>