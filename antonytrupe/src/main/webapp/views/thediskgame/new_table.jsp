<!DOCTYPE html>
<html style="height: 100%;">
<head>
<title>battledisks - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/battledisks/">
<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>
<link rel="stylesheet" href="style.css" type="text/css" media="all">

<script src="//cdnjs.cloudflare.com/ajax/libs/headjs/1.0.3/head.load.min.js"></script>
<script type="text/javascript">
	head.js("https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js",
	//	"/battledisks/battledisks.min.js",
	"/com/antonytrupe/battledisks/Main.js",
			"/com/antonytrupe/battledisks/Player.js",
			"/com/antonytrupe/battledisks/Table.js",
			"/com/antonytrupe/battledisks/Disk.js",
			"/com/antonytrupe/battledisks/Point.js",
			"/com/antonytrupe/battledisks/API.js", function() {
				new Main().newTable();
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
<style>
.one {
	text-align: right;
	display: inline-block;
	width: 40%;
}

.two {
	text-align: left;
	display: inline-block;
	width: 40%;
}
</style>
</head>
<body>
	<div class="sidebar" id="sideLeft">
		<div id="navigation">
			<a href="./">battledisks</a><br /> <a id="log_in"
				href="/login.html?return_to=battledisks%2Fapi%3Faction%3DLOG_IN">log
				in</a><br /> <a id="shop" href="shop.html">shop</a><br /> <a
				class="table_list" href="table_list.html">table list</a><br /> <a
				class="new_table"
				href="/login.html?return_to=battledisks%2Fnew_table.html">new
				table</a><br /> <a class="leaderboard" href=leaderboard.html>leaderboard</a><br />
		</div>
	</div>
	<div id="container" style="text-align: center;">
		<h3>New Table</h3>
		<form id="form" action="/battledisks/api" method="GET"
			style="text-align: center;">
			<input type="hidden" name="action" value="CREATE_TABLE" />

			<div>
				<label class="one" for="army">Army:</label> <span class="two">
					<select id="armyName" name="armyName"></select>
				</span>
			</div>

			<div>
				<label class="one">Your Army's Points:</label> <span class="two"
					id="selectedArmyPoints"> </span>
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