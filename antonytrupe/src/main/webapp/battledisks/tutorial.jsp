<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=9">
<title>tutorial - battledisks - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/battledisks/">

<script src="//cdnjs.cloudflare.com/ajax/libs/headjs/1.0.3/head.load.min.js"></script>

<script type="text/javascript">
	head.load("https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js",
			"https://ajax.googleapis.com/ajax/libs/jqueryui/1/jquery-ui.min.js",
			//"/ca/jimr/gae/profiler/resources/jquery.tmpl.min.js",
			//"/ca/jimr/gae/profiler/resources/mini_profiler.js",
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
			"/com/adamhooper/priority-queue.js",
			"/com/antonytrupe/battledisks/AI.js", 
			function() {
				//wait for the template iframe to load
				
				new Main().tutorial();
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
		ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		var s = document.getElementsByTagName('script')[0];
		s.parentNode.insertBefore(ga, s);
	})();
</script>

<link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>
<!-- <link href="/ca/jimr/gae/profiler/resources/mini_profiler.css" rel="stylesheet" type="text/css"	media="all"> -->
<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/themes/smoothness/jquery-ui.min.css" type="text/css" rel="stylesheet" media="all">
<link href="style.css" type="text/css" rel="stylesheet" media="all">

</head>
<body>
<!-- 
	<iframe id="mini-profiler-templates" src="/ca/jimr/gae/profiler/resources/mini_profiler.html" style="display:none"></iframe>
	<div id="mp" style="display: none;"></div>
	<div id="mp-req" style="display: none;"></div>
 -->
	<div class="sidebar" id="navigation">
		<a href="/battledisks/" class="tab">battledisks</a><br />
		
		<a id="log_in" href="/login.html?return_to=%2Fbattledisks%2Fapi%3Faction%3DLOG_IN">log in</a><br />
		 
		<a id="shop" href="shop.html">shop</a><br />
		<a class="table_list" href="table_list.html">table list</a><br />
		<a class="new_table" href="/login.html?return_to=battledisks%2Fnew_table.html">new table</a><br />
		<a class="leaderboard" href=leaderboard.html>leaderboard</a><br />
	</div>
	
	<div id="tableInfo" class="collapsible rightHighlight sidebar"
		style="float: right; clear: both;box-shadow: -4px 5px 15px rgba(0, 0, 0, 0.35);">
		<div class="title">
			<img id="loading" src="/loading13.gif" /> <a id="refresh">↻</a> <span
				class="toggler up"></span> <span>#<span id="tableId"></span></span>
		</div>

		<div class="content">
			<div id="slider" style="margin:4px 12px;"></div>
			<ol id="boardSegment">
				<li class="JOIN">Players Joining
					<ol class="playerOrder"></ol>
				</li>
				<li class="REINFORCEMENTS">Placing Reinforcements
					<ol class="playerOrder"></ol>
				</li>
				<li class="ACTIVATION">Activations
					<ol class="playerOrder"></ol>
				</li>
				<li class="MISSILE">Missiles
					<ol class="playerOrder"></ol>
				</li>
				<li class="COMBAT">Resolve Combat
					<ol class="playerOrder"></ol>
				</li>
				<li class="REMOVE_COUNTERS">Remove Counters
					<ol class="playerOrder"></ol>
				</li>
			</ol>
		</div>
	</div>

	<div id="table">
		<canvas class="highlights"></canvas>
		<canvas class="disks"></canvas>
		<canvas class="move"></canvas>
		<canvas class="tooltips"></canvas>
	</div>

	<div id="contextMenu" style="position: absolute;">
		<div class="menuItem DISK_INFO"><span class="icon">I</span><span class="text">name</span>
			<span style="right: 0;">&#x25B6;</span>
		</div>
		<div class="menuItem MOVE">
			<img src="/battledisks/i/move_icon.png" class="icon"><span class="text">Move</span>
		</div>
		<div class="menuItem REINFORCE"><img src="/battledisks/i/move_icon.png" class="icon"><span class="text">Move</span></div>
		<div class="menuItem SPELL">
		  <span class="icon">S</span>
		  <span class="text">Cast Spell</span>
		  
	    </div>
		<div class="menuItem ARROW"><span class="icon">A</span><span class="text">Fire <span class="count"></span> Arrows</span></div>
		<div class="menuItem BOLT"><span class="icon">B</span><span class="text">Fire Bolts</span></div>
		<div class="menuItem FIREBALL"><span class="icon">F</span><span class="text">Fire Fireballs</span></div>
		<div class="menuItem BOULDER"><span class="icon">O</span><span class="text">Fire Boulders</span></div>
		<div class="menuItem ACTIVATE"><img alt="A" src="/battledisks/i/Activation.png" class="icon"><span class="text">Activate</span></div>
		<div class="menuItem END_ACTIVATIONS"><img alt="E" src="/battledisks/i/end_activations_icon.png" class="icon"><span class="text">End Activations</span></div>
		<div class="menuItem END_REINFORCEMENTS"><span class="icon">C</span><span class="text">End Reinforcements</span></div>
		<div class="menuItem END_MISSILES"><span class="icon">S</span><span class="text">End Missiles</span></div>
		<div class="menuItem SELECT_ATTACKEE"><span class="icon">T</span><span class="text">Select Attackee</span></div>
		<div class="menuItem SELECT_DEFENDEE"><span class="icon">D</span><span class="text">Select Defendee</span></div>
		<div id="diskInfo" style="display: none; position: fixed; left: 0; top: 0; padding: 0px 3px;">
			<div id="player"></div>
			<div><span id="faction">Elf</span>, <span id="alignment">Good</span>, <span id="cost">4</span> Points</div>
			<div><span id="attack">4</span> Attack, <span id="defense">4</span> Defense</div>
			<div><span id="toughness">4</span> Toughness, <span id="wounds">1</span> Wounds</div>
			<div><span id="movement">4</span> Flips,<span id="diameter">4</span> Diameter,<span id="flying"></span></div>
			<div></div>
		</div>
		<ol id="spells" style="display: block; position: fixed; left: 0; top: 0; padding: 0px 3px;">
		  <li>ZIP</li><li>ZIP</li><li>ZIP</li>
		</ol>
	</div>
	
	<!-- -->
	
	 
</body>
</html>