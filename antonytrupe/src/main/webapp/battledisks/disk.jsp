<%@ page
	import="com.google.appengine.api.blobstore.BlobstoreServiceFactory"%>
<%@ page import="com.google.appengine.api.blobstore.BlobstoreService"%>

<%
	BlobstoreService blobstoreService = BlobstoreServiceFactory
			.getBlobstoreService();
%>
<!DOCTYPE html>
<html>
<head>
<title>disk admin - battledisks - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/battledisks/">

<script src="/head.load.min.js"></script>

<script type="text/javascript">
	head.js("https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js", "/ca/jimr/gae/profiler/resources/jquery.tmpl.min.js",
			"/ca/jimr/gae/profiler/resources/mini_profiler.js",
			//"/battledisks/battledisks.min.js",
			"/com/antonytrupe/battledisks/Main.js", "/com/antonytrupe/battledisks/UI.js", "/com/antonytrupe/battledisks/Disk.js",
			"/com/antonytrupe/battledisks/DiskUI.js", "/com/antonytrupe/battledisks/Point.js", "/com/antonytrupe/battledisks/API.js", function() {
				//wait for the template iframe to load
				$("mini-profiler-templates").ready(function() {
					MiniProfiler.init({
						requestId : '32',
						baseURL : '/gae_mini_profile/'
					});
				});
				new Main().disk();
			});
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

<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>
<link href="style.css" type="text/css" rel="stylesheet" media="all">
<link href="/ca/jimr/gae/profiler/resources/mini_profiler.css"
	rel="stylesheet" type="text/css" media="all">

</head>
<body>
	<iframe id="mini-profiler-templates"
		src="/ca/jimr/gae/profiler/resources/mini_profiler.html"
		style="display: none"></iframe>
	<div id="mp" style="display: none;"></div>
	<div id="mp-req" style="display: none;"></div>
	<h1 style="text-align: center; margin: 0;">Disk Maintenance</h1>
	<h4 style="text-align: center; margin: 0; padding: 1em;">
		<a href="/battledisks/api?action=DOWNLOAD_DISKS">download all
			disks</a>
	</h4>
	<form
		action="<%=blobstoreService
					.createUploadUrl("/battledisks/api?action=UPLOAD_DISKS")%>"
		method="POST" enctype="multipart/form-data">
		<label class="one" for="csv" style="width: 50%;"><button>Upload
				Disks</button></label> <input class="two" type="file" name="csv" />
	</form>
	<div style="text-align: center;">
		<h2 id="diskName">New Disk</h2>
		<form id="disk" style="text-align: center;"
			action="/battledisks/api?action=CREATE_DISK" method="POST">
			<div>
				<label class="one" for="name">Name:</label> <span class="two">
					<input type="search" name="name" id="name" />
					<button id="find"
						onclick="window.location.hash=$('#name').val();return false;">find</button>
				</span>
			</div>
			<div>
				<label class="one" for="type">Disk Type:</label> <span class="two">
					<select name="type" id="type">
						<option value="creature">Creature</option>
						<option value="spell">Spell</option>
						<option value="missile">Missile</option>
						<option value="land">Land</option>
				</select>
				</span>
			</div>
			<div>
				<label class="one" for="attack">Attack:</label>
				<span class="two">
				    <input
					name="attack" id="attack" type="number" min="0" max="30" value="2" />
					<del class="previous"></del>
				</span>
			</div>
			<div>
				<label class="one" for="defense">Defense:</label> <span class="two"><input
					name="defense" id="defense" type="number" min="0" max="30"
					value="2" /><del class="previous"></del></span>
			</div>
			<div>
				<label class="one" for="toughness">Toughness:</label> <span
					class="two"><input name="toughness" id="toughness"
					type="number" min="0" max="30" value="2" /><del class="previous"></del></span>
			</div>
			<div>
				<label class="one" for="movement">Movement:</label> <span
					class="two"><input name="movement" id="movement"
					type="number" min="0" max="30" value="2" /><del class="previous"></del></span>
			</div>
			<div>
				<label class="one" for="wounds">Wounds:</label> <span class="two"><input
					name="wounds" id="wounds" type="number" min="1" max="4" value="1" />
					<del class="previous"></del></span>
			</div>
			<div>
				<label class="one" for="flying">Flying:</label> <span class="two">
					<input name="flying" id="flying" type="checkbox" value="true" />
					<del class="previous"></del>
				</span>
			</div>
			<div>
				<label class="one" for="swashbuckler">Swashbuckler:</label> <span
					class="two"> <input name="swashbuckler" id="swashbuckler"
					type="checkbox" value="true" />
					<del class="previous"></del>
				</span>
			</div>
			<div>
				<label class="one" for="missileImmunity">Immune to Missiles:</label>
				<span class="two"> <input name="missileImmunity"
					id="missileImmunity" type="checkbox" value="true" /><del class="previous"></del>
				</span>
			</div>
			<div>
				<label class="one" for="firstblow">First Blow:</label> <span
					class="two"> <input name="firstblow" id="firstblow"
					type="checkbox" value="true" />
					<del class="previous"></del>
				</span>
			</div>
			<div>
				<label class="one" for="archer">Archer:</label> <span class="two">
					<input name="archer" id="archer" type="checkbox" value="true" />
				</span>
			</div>
			<div id="archerInfo" style="display: none;">
				<div>
					<label class="one" for="arrows">Arrows:</label> <span class="two">
						<input name="arrows" id="arrows" type="number" min="0" max="9"
						value="3" />
					</span>
				</div>
				<div>
					<label class="one" for="bolts">Bolts:</label> <span class="two">
						<input name="bolts" id="bolts" type="number" min="0" max="4"
						value="0" />
					</span>
				</div>
				<div>
					<label class="one" for="fireballs">Fireballs:</label> <span
						class="two"> <input name="fireballs" id="fireballs"
						type="number" min="0" max="6" value="0" />
					</span>
				</div>
				<div>
					<label class="one" for="boulders">Boulders:</label> <span
						class="two"> <input name="boulders" id="boulders"
						type="number" min="0" max="4" value="0" />
					</span>
				</div>
			</div>
			<div>
				<label class="one" for="spellcaster" style="vertical-align: top;">Spellcaster
					Level:</label> <span class="two"> <input name="spellcaster"
					id="spellcaster" type="number" min="0" max="3" value="0" />
				</span>
			</div>
			<div>
				<label class="one" for="cost">Cost:</label> <span class="two">
					<input name="cost" id="cost" type="number" min="0" max="30"
					value="2" onchange="$('#price').val($(this).val()*.09);" />
				</span>
			</div>
			<div>
				<label class="one" for="faction">Faction:</label> <span class="two"><select
					name="faction" id="faction">
						<option value="Acolyte">Acolyte</option>
						<option value="Dragon">Dragon</option>
						<option value="Dwarf">Dwarf</option>
						<option value="Elf">Elf</option>
						<option value="Knight">Knight</option>
						<option value="K'Ryth">K'Ryth</option>
						<option value="Mahkim">Mahkim</option>
						<option value="Orc">Orc</option>
						<option value="Undead">Undead</option>
						<option value="Unaligned">Unaligned</option>
						<option value="Uthuk">Uthuk</option>
				</select></span>
			</div>
			<div>
				<label class="one" for="limit">Limit:</label> <span class="two">
					<input name="limit" id="limit" type="number" min="0" max="3"
					value="0" />
				</span>
			</div>
			<div>
				<label class="one" for="alignment">Alignment:</label> <span
					class="two"><select name="alignment" id="alignment">
						<option value="Neutral">Neutral</option>
						<option value="Evil">Evil</option>
						<option value="Good">Good</option>
						<option value="Champion">Champion</option>
				</select></span>
			</div>
			<div>
				<label class="one" for="description" style="vertical-align: top;">Description:</label>
				<span class="two"> <textarea name="description"
						id="description" rows="4"></textarea>
				</span>
			</div>
			<div>
				<label class="one" for="diameter">Diameter:</label> <span
					class="two"><select name="diameter" id="diameter">
						<option value="0.625">0.625(missile)</option>
						<option value="1">1(Spell)</option>
						<option value="1.75">1.75</option>
						<option value="2" selected="selected">2</option>
						<option value="2.5">2.5</option>
						<option value="3">3</option>
						<option value="3.5">3.5</option>
						<option value="4.25">4.25</option>
				</select></span>
			</div>
			<div>
				<label class="one" for="price">Price:$</label> <span class="two">
					<input name="price" id="price" value="0.18" />
				</span>
			</div>
			<!-- 
	        <div>
	        	<label class="one" for="img">Image:</label>
	        	<input class="two" type="file" name="img" id="imgPath" onchange="handleFiles(this.files)"/>
	       	</div>
	       	 -->
			<button>Save</button>
			<img id="img" />
		</form>
		<canvas id="canvas" style="margin: 0 auto;" width="560px"
			height="550px"></canvas>
	</div>
</body>
</html>