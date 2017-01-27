<%@ taglib prefix="tdg" tagdir="/WEB-INF/tags/thediskgame"%>
<!DOCTYPE html>
<html data-ng-app="thediskgame">
<head>
<title>Disk Editor - The Disk Game - antonytrupe.com</title>
<link rel="canonical" href="http://www.antonytrupe.com/thediskgame/">

<!-- javascript includes -->
<tdg:javascriptIncludes jsFiles="${jsFiles}" />

<!-- angular javascript stuff -->
<script>
head.ready( 
  function(){
    var app=angular.module('thediskgame',[]);
	app.controller('diskEditor',['$scope',function($scope){
      this.init=function(diskJson){
        this.disk = $scope.disk = window['disk'] = new Disk();
        this.disk.update(diskJson);
        
        this.originalDisk = $scope.originalDisk=window['originalDisk']=new Disk();
        $scope.originalDisk.update( diskJson );
        
        this.ui = $scope.ui = window['ui'] = new DiskUI('#table');
      };
      
      this.init(${diskJson});
      
      $scope.change=function(){
        $scope.ui.update($scope.disk);
      };
      ui.update(this.disk);
    }]);
    app.controller('diskList',['$scope',function($scope){
      this.init=function(disksJson){
    	//console.log(disksJson);
        this.disks = window.disks=$scope.disks = disksJson;
      };
      this.init(${allDisks});
    }]);
});
</script>

<!-- css includes/stuff -->
<style>
.one {
	text-align: right;
	display: table-cell;
}

.two {
	text-align: left;
	display: table-cell;
}

#disk div {
	white-space: nowrap;
	display: table-row;
}
</style>

<link href='http://fonts.googleapis.com/css?family=Open+Sans'
	rel='stylesheet' type='text/css'>

<link href='/thediskgame.css' rel='stylesheet' type='text/css'>


</head>

<!-- layout -->
<body>
	<tdg:header gravatar="${gravatar}" />
	<h1 style="text-align: center; margin: 0;">Disk Editor</h1>
	<hr />
	<div style="text-align: center; margin: 0; padding: 0;">
		<a href="/thediskgame/api?action=DOWNLOAD_DISKS">download all
			disks</a>
	</div>
	<form action="${uploadurl}" method="POST" enctype="multipart/form-data"
		style="text-align: center;">
		<fieldset>
			<input type="file" name="csv" />
			<button>Upload Disks</button>
		</fieldset>
	</form>
	<hr />
	<!-- the list of disks -->
	<div data-ng-controller="diskList as diskList" style="display:inline-block;vertical-align:top;">
      <ul>
        <li data-ng-repeat="(diskName,diskInfo) in disks">
          <a href="/thediskgame/diskeditor/{{diskName}}" >{{diskName}}</a>
        </li>
      </ul>
	</div>
	
	<!-- the canvas to draw the disk -->
	<div style="display: inline-block; vertical-align: top;">
		<canvas id="canvas" style="margin: 0 auto;" width="560px"
			height="550px"></canvas>
	</div>

	<!-- the form to edit/create the disk -->
	<div style="display: inline-block;">
		<div data-ng-controller="diskEditor as diskEditor"
			style="text-align: center;">
			<!-- <h2 id="diskName">{{diskEditor.disk.name||"New Disk"}}</h2>  -->
			<form id="disk" style="text-align: center; display: table;"
				action="/thediskgame/api?action=CREATE_DISK" method="POST">
				<div>
					<label class="one" for="name">Name:</label> <span class="two">
						<input type="search" name="name" id="name"
						data-ng-model="diskEditor.disk.name" data-ng-change="change()" />
						<button id="find"
							onclick="window.location='/thediskgame/diskEditor/'+$('#name').val();return false;">find</button>
						<del data-ng-show="diskEditor.originalDisk.name!=diskEditor.disk.name">{{diskEditor.originalDisk.name}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="type">Disk Type:</label> <span class="two">
						<select name="type" id="type" data-ng-model="diskEditor.disk.type"
						data-ng-change="change()">
							<option value="creature">Creature</option>
							<option value="spell">Spell</option>
							<option value="missile">Missile</option>
							<option value="land">Land</option>
					</select> <del data-ng-show="diskEditor.originalDisk.type!=diskEditor.disk.type">{{diskEditor.originalDisk.type}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="attack">Attack:</label> <span class="two">
						<input name="attack" id="attack" type="number" min="0" max="30"
						data-ng-model="diskEditor.disk.attack" data-ng-change="change()" /> <del
							data-ng-show="diskEditor.originalDisk.attack!=diskEditor.disk.attack">{{diskEditor.originalDisk.attack}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="defense">Defense:</label> <span class="two">
						<input name="defense" id="defense" type="number" min="0" max="30"
						data-ng-model="diskEditor.disk.defense" data-ng-change="change()" /> <del
							data-ng-show="diskEditor.originalDisk.defense!=diskEditor.disk.defense">{{diskEditor.originalDisk.defense}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="toughness">Toughness:</label> <span
						class="two"> <input name="toughness" id="toughness"
						type="number" min="0" max="30"
						data-ng-model="diskEditor.disk.toughness" data-ng-change="change()" /> <del
							data-ng-show="diskEditor.originalDisk.toughness!=diskEditor.disk.toughness">{{diskEditor.originalDisk.toughness}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="movement">Movement:</label> <span
						class="two"> <input name="movement" id="movement"
						type="number" min="0" max="30" data-ng-model="diskEditor.disk.movement"
						data-ng-change="change()" /> <del
							data-ng-show="diskEditor.originalDisk.movement!=diskEditor.disk.movement">{{diskEditor.originalDisk.movement}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="wounds">Wounds:</label> <span class="two">
						<input name="wounds" id="wounds" type="number" min="1" max="4"
						data-ng-model="diskEditor.disk.wounds" data-ng-change="change()" /> <del
							data-ng-show="diskEditor.originalDisk.wounds!=diskEditor.disk.wounds">{{diskEditor.originalDisk.wounds}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="flying">Flying:</label> <span class="two">
						<input name="flying" id="flying" type="checkbox"
						data-ng-model="diskEditor.disk.flying" data-ng-change="change()" /> <del
							data-ng-show="diskEditor.originalDisk.flying!=diskEditor.disk.flying">{{diskEditor.originalDisk.flying}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="swashbuckler">Swashbuckler:</label> <span
						class="two"> <input name="swashbuckler" id="swashbuckler"
						type="checkbox" data-ng-model="diskEditor.disk.swashbuckler"
						data-ng-change="change()" /> <del
							data-ng-show="diskEditor.originalDisk.swashbuckler!=diskEditor.disk.swashbuckler">{{diskEditor.originalDisk.swashbuckler}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="missileImmunity">Immune to
						Missiles:</label> <span class="two"> <input name="missileImmunity"
						id="missileImmunity" type="checkbox"
						data-ng-model="diskEditor.disk.missileImmunity" data-ng-change="change()" />
						<del
							data-ng-show="diskEditor.originalDisk.missileImmunity!=diskEditor.disk.missileImmunity">{{diskEditor.originalDisk.missileImmunity}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="firstblow">First Blow:</label> <span
						class="two"> <input name="firstblow" id="firstblow"
						type="checkbox" data-ng-model="diskEditor.disk.firstblow"
						data-ng-change="change()" /> <del
							data-ng-show="diskEditor.originalDisk.firstblow!=diskEditor.disk.firstblow">{{diskEditor.originalDisk.firstblow}}</del>
					</span>
				</div>
				<div>
					<label class="one" for="archer">Archer:</label> <span class="two">
						<input name="archer" id="archer" type="checkbox"
						data-ng-model="diskEditor.disk.archer" data-ng-change="change()" /> <del
							data-ng-show="diskEditor.originalDisk.archer!=diskEditor.disk.archer">{{diskEditor.originalDisk.archer}}</del>
					</span>
				</div>
				<fieldset id="archerInfo" data-ng-show="diskEditor.disk.archer">
					<div>
						<label class="one" for="arrows">Arrows:</label> <span class="two">
							<input name="arrows" id="arrows" type="number" min="0" max="9"
							data-ng-model="diskEditor.disk.arrows" data-ng-change="change()" /> <del
								data-ng-show="diskEditor.originalDisk.arrows!=diskEditor.disk.arrows">{{diskEditor.originalDisk.arrows}}</del>
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
				</fieldset>
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
					<label class="one" for="faction">Faction:</label> <span class="two">
						<select name="faction" id="faction"
						data-ng-model="diskEditor.disk.faction" data-ng-change="change()">
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
					</select>
					</span>
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

		</div>
	</div>

</body>
</html>