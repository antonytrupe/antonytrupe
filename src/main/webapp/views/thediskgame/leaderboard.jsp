<!DOCTYPE html>
<html style="height: 100%;">
<head>
<title>leaderboard - battledisks - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/battledisks/">
<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="style.css" type="text/css"
	media="all">

<script src="/head.load.min.js"></script>
<script type="text/javascript">
	head.js("https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js",
			//"/battledisks/battledisks.min.js",
			"/com/antonytrupe/battledisks/Main.js",
			"/com/antonytrupe/battledisks/Player.js",
			"/com/antonytrupe/battledisks/API.js",
			function() {
				new Main().leaderboard();
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
	<div class="sidebar" id="navigation" style="position: static; float: left;">
		<a href="./">battledisks</a><br />
		<a id="log_in" href="/login.html?return_to=battledisks%2Fapi%3Faction%3DLOG_IN">log in</a><br />
		<a id="shop" href="shop.html">shop</a><br />
		<a class="table_list" href="table_list.html">table list</a><br />
		<a class="new_table" href="/login.html?return_to=battledisks%2Fnew_table.html">new table</a><br />
		<a class="leaderboard" href=leaderboard.html>leaderboard</a><br />
	</div>
	<div id="container" style="float: left;padding-left: 2em;">
		<h3 style="text-align:center;margin:0;">Leaderboard</h3>
		<ol id="leaderboard"></ol>
	</div>
</body>
</html>