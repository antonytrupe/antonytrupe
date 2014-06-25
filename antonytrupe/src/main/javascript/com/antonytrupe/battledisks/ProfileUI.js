/**
 * @constructor
 * @extends UI
 * @param {API}
 *            api
 * @param {Player}
 *            player
 * @param {string}
 *            selectedArmyName
 */
function ProfileUI(api, player, selectedArmyName) {
	"use strict";
	$.extend(this, new UI('#table'));
	var $this = this;

	var PIXELS_PER_INCH = 128;

	/**
	 * @type {Player}
	 */
	$this.player = player;

	this.selectedArmyName = selectedArmyName;
	this.api = api;

	/**
	 * @type {?number}
	 */
	this.selectedDisk = null;

	this.scale = 2;

	this.disksCtx = document.getElementById("disks").getContext('2d');
	this.moveCtx = document.getElementById("move").getContext('2d');
	this.highlightsCtx = document.getElementById("highlights").getContext('2d');

	$($this.container).bind("contextmenu", function(v) {
		return false;
	});

	$(window).bind("hashchange", function(v) {
		// console.log('hashchange');
		var armyName = window.location.hash.replace("#", "").replace("!", "");
		// console.log($this.army.name);
		// console.log(armyName);
		if (armyName !== $this.selectedArmyName) {
			$this.selectedArmyName = armyName;
			$this.showArmyInfo();
			$this.draw();
		}
	});

	$('#save').click(function(v) {
		$this.saveArmy();
	});

	// attach the mousedown handler
	$($this.container).mousedown(function(v) {
		$this.mouseDownHandler($this.getTableLocation(v.pageX, v.pageY), v.which, v);
	});

	$($this.container).mouseup(function(v) {
		$this.mouseUpHandler($this.getTableLocation(v.pageX, v.pageY), v.which);
	});

	$($this.container).mousemove(function(v) {
		$this._mouseMoveHandler(v);
	});

	$($this.container).bind('mousewheel', function(event) {
		$this.mouseScrollHandler(event);
		return false;
	});

	var resizeTimer = null;
	$(window).resize(function() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout($this.draw, 100);
	});

	this.debug = function() {
		//
	};

	this.displayDirections = function() {
		//
		$("#directions").empty();

		// console.log($this.player.name);

		if (typeof $this.player.name === "undefined" || $this.player.name === "") {
			var list = $("#log_in").clone();
			list.text("Log in");
			$("#directions").append(list);
		} else {
			$("#directions").append($("<div>").append("Click and drag to move your disks around. "));

			$("#directions").append($("<div>").append("Left click adds the disk to the current army. "));

			$("#directions").append($("<div>").append("Right click removes the disk from the current army. "));

			$("#directions").append($("<div>").append("Once you have saved an army, ")
			//
			.append($(".table_list").clone().text("join a game"))
			//
			.append(" or ")
			//
			.append($(".new_table").clone().text("create a new game.")));
		}
	};

	this.init = function() {
		$this.disksCtx.canvas.height = $("#table").height();
		$this.disksCtx.canvas.width = $("#table").width();

		$this.moveCtx.canvas.height = $("#table").height();
		$this.moveCtx.canvas.width = $("#table").width();

		$this.highlightsCtx.canvas.height = $("#table").height();
		$this.highlightsCtx.canvas.width = $("#table").width();

		// 2.0 for no padding
		// 1.0 for half the disk diameter padding
		var padding = 1.0;

		$this.offset = $this.getDefaultOffset(padding);

		$this.scale = $this.getDefaultScale(padding);
	};

	this.getDefaultOffset = function(padding) {

		var left = 0, right = 0, top = 0, bottom = 0;

		$this.player.getDiskNumbers().forEach(function(diskNumber) {
			var l = $this.player.getDiskInfo(diskNumber).location;
			var d = $this.player.getDiskInfo(diskNumber).disk;
			if (parseFloat(l.x) - parseFloat(d.diameter) / padding < left) {
				left = parseFloat(l.x) - parseFloat(d.diameter) / padding;
			}
			if (parseFloat(l.x) + parseFloat(d.diameter) / padding > right) {
				right = parseFloat(l.x) + parseFloat(d.diameter) / padding;
			}

			if (parseFloat(l.y) - parseFloat(d.diameter) / padding < top) {
				top = parseFloat(l.y) - parseFloat(d.diameter) / padding;
			}
			if (parseFloat(l.y) + parseFloat(d.diameter) / padding > bottom) {
				bottom = parseFloat(l.y) + parseFloat(d.diameter) / padding;
			}

		});

		var tableWidth = right - left;

		var tableHeight = bottom - top;

		$this.offset.x = -left / tableWidth * $($this.container).width();
		$this.offset.y = -top / tableHeight * $($this.container).height();

		return {
			'x' : -left / tableWidth * $($this.container).width(),
			'y' : -top / tableHeight * $($this.container).height()
		};
	};

	this.getDefaultScale = function(padding) {

		var left = 0, right = 0, top = 0, bottom = 0;

		$this.player.getDiskNumbers().forEach(function(diskNumber) {
			var l = $this.player.getDiskInfo(diskNumber).location;
			var d = $this.player.getDiskInfo(diskNumber).disk;
			if (parseFloat(l.x) - parseFloat(d.diameter) / padding < left) {
				left = parseFloat(l.x) - parseFloat(d.diameter) / padding;
			}
			if (parseFloat(l.x) + parseFloat(d.diameter) / padding > right) {
				right = parseFloat(l.x) + parseFloat(d.diameter) / padding;
			}
			// console.log(l.y);
			if (parseFloat(l.y) - parseFloat(d.diameter) / padding < top) {
				top = parseFloat(l.y) - parseFloat(d.diameter) / padding;
			}
			if (parseFloat(l.y) + parseFloat(d.diameter) / padding > bottom) {
				bottom = parseFloat(l.y) + parseFloat(d.diameter) / padding;
			}

		});

		var tableWidth = right - left;

		var tableHeight = bottom - top;

		var xRatio = (tableWidth * PIXELS_PER_INCH) / $($this.container).width();
		var yRatio = (tableHeight * PIXELS_PER_INCH) / $($this.container).height();

		return Math.max(xRatio, yRatio);

	};

	this.draw = function() {
		// console.log('ProfileUI.draw');

		$this.disksCtx.canvas.height = $("#table").height();
		$this.disksCtx.canvas.width = $("#table").width();

		$this.moveCtx.canvas.height = $("#table").height();
		$this.moveCtx.canvas.width = $("#table").width();

		$this.highlightsCtx.canvas.height = $("#table").height();
		$this.highlightsCtx.canvas.width = $("#table").width();

		$this.listTables($this.player.activeTables);

		$this.player.getDiskNumbers().reverse().forEach(function(diskNumber) {
			// console.log(diskNumber);

			var info = $this.player.getDiskInfo(diskNumber, $this.selectedArmyName);
			// console.log(info);

			$this._drawDisk(info.disk, info.location, 'rgba(32,32,32,.8)');
		});

		// place the disks that are in the selected army

	};

	this.listTables = function(tables) {
		$("#myActiveTables ul").empty();

		$.each(tables, function(k, table) {
			var title = "";

			var a = $("<a>").append(
					table.id + ": " + Object.keys(table.memento.players).length + "/" + table.maxPlayers + " players, " + table.maxPoints + " point armies");
			a.append(", " + table.alignmentRestriction);
			// a.append(JSON.stringify(v.players));
			a.attr('href', './table.html#!' + table.id);
			var li = $("<li>").append(a);

			// make it bold if its your turn
			if (table.currentPlayer === $this.player.name) {
				li.css("font-weight", "bold");
				title += "your turn(bold), ";
			}

			// make it italicized if you are in this table
			if (table.playerOrder.indexOf($this.player.name) > -1) {
				li.css("font-style", "italic");
				title += "your game(italicized), ";
			}

			title = title.substr(0, title.length - 2);
			li.attr("title", title);

			$("#myActiveTables ul").append(li);

		});

		$("#myActiveTables ul").append($("<li>").append($(".table_list").first().clone().text("Join a game")));
		//

		//
		$("#myActiveTables ul").append($("<li>").append($(".new_table").first().clone().text("Create a game")));

	};

	this._drawDisk = function(disk, location, highlightColor) {
		// console.log('ProfileUI._drawDisk');

		// console.log(disk);
		// console.log(location);

		$this.drawDisk($this.disksCtx, {
			"disk" : disk,
			'mementoInfo' : {
				"location" : location
			}
		}, $this.highlightsCtx, highlightColor);

	};

	this.getHashId = function() {
		return window.location.hash.replace("#", "");
	};

	this.listArmies = function(armies) {
		// console.log('listArmies');
		$("#armies").empty();
		$.each(armies, function(i, armyName) {
			// for ( var i = 0; i < armies.length; i++) {
			// var armyName = armies[i];
			var li = $("<li>");
			var a = $("<a>");
			a.text(armyName);
			a.attr("href", "#" + armyName);
			// a.attr("id", armyName);
			li.append(a);
			var d = $("<a>");
			d.text("[-]");
			d.attr("href", "");

			d.click(function(e) {

				e.preventDefault();
				// console.log("delete army " + armyName);
				$this.deleteArmy(armyName);

				return false;
			});
			li.append(d);
			$("#armies").append(li);
		});
	};

	this.showArmyInfo = function() {
		// console.log("showArmyInfo");
		$("#armyDisks").empty();
		$("#factions").empty();
		$("#alignments").empty();

		$(".points").text("0");

		// console.log($this.selectedArmyName);
		// console.log($this.player.armies);
		// console.log($this.player.armies[$this.selectedArmyName]);

		if ($this.selectedArmyName === null || $this.selectedArmyName === "" || $this.player.armies[$this.selectedArmyName] === undefined
				|| $this.player.armies[$this.selectedArmyName] === null) {
			return;
		}

		$("#armyName").val($this.selectedArmyName);

		$.each($this.player.armies[$this.selectedArmyName], function(i) {
			// armyDisks
			// console.log(i);
			var armyDiskInfo = $this.player.armies[$this.selectedArmyName][i];
			// console.log(armyDiskInfo);

			var diskInfo = $this.player.getDiskInfo(armyDiskInfo.diskNumber);

			var li = $("<li>");
			var name = $("<span>").text(diskInfo.disk.name);

			name.hover(function() {
			});

			li.append(name);

			// move up
			var up = $("<a>");
			up.html("[&uarr;]");
			if (i !== 0) {
				up.attr('title', 'move up');
				up.attr("href", "");
				up.click(function(e) {
					e.preventDefault();
					var temp = $this.player.armies[$this.selectedArmyName][i];
					$this.player.armies[$this.selectedArmyName][i] = $this.player.armies[$this.selectedArmyName][i - 1];
					$this.player.armies[$this.selectedArmyName][i - 1] = temp;

					$this.showArmyInfo();
					$this.draw();
					return false;
				});
			}
			li.prepend(up);

			// move down
			var down = $("<a>");
			down.html("[&darr;]");
			if (i !== Object.keys($this.player.armies[$this.selectedArmyName]).length - 1) {
				down.attr('title', 'move down');
				down.attr("href", "");
				down.click(function(e) {
					e.preventDefault();
					var temp = $this.player.armies[$this.selectedArmyName][i];
					$this.player.armies[$this.selectedArmyName][i] = $this.player.armies[$this.selectedArmyName][i + 1];
					$this.player.armies[$this.selectedArmyName][i + 1] = temp;

					$this.showArmyInfo();
					$this.draw();
					return false;
				});
			}
			li.prepend(down);

			//
			var remove = $("<a>");
			remove.html("[-]");
			remove.attr('title', 'remove');
			remove.attr("href", "");
			remove.click(function(e) {
				e.preventDefault();
				$this.player.removeDiskFromArmy($this.selectedArmyName, armyDiskInfo.diskNumber);
				$this.showArmyInfo();
				return false;
			});
			li.prepend(remove);

			$("#armyDisks").append(li);
		});

		var info = $this.player.getArmyInfo($this.selectedArmyName);

		// update points
		$(".points").text(String(info.points));

		Object.keys(info.factions).forEach(function(faction) {
			var p = info.factions[faction];
			var tr = $("<tr>");
			tr.append($("<td>").text(faction));
			tr.append($("<td>").text(p));
			tr.append($("<td>").text((p / info.points * 100).toFixed(0) + "%"));
			// + " %" + (p / info.points * 100).toFixed(0));
			$("#factions").append(tr);
		});

		Object.keys(info.alignments).forEach(function(alignment) {
			var points = info.alignments[alignment];
			var tr = $("<tr>");
			tr.append($("<td>").text(alignment)).append($("<td>").text(points));
			$("#alignments").append(tr);
		});
	};

	this.mouseDownHandler = function(tablePoint, which, event) {
		// console.log('mouseDownHandler');

		$this.lastMouseEvent = event;
		$this.mousedown = true;

		$this.selectedDisk = $this.selectDisk(tablePoint);
		// if this is a left mouse click and a disk is selected and the selected
		// disk is not in the army
		if ($this.selectedDisk !== null && which === 1 && $this.selectedArmyName !== null) {
			// console.log(JSON.stringify($this.selectedDisk));
			$this.player.addDiskToArmy($this.selectedArmyName, $this.selectedDisk);
			// console.log(JSON.stringify($this.selectedDisk));
		}
		// if this is a right mouse click and a disk is selected and the
		// selected disk is in the army
		if ($this.selectedDisk !== null && which === 3) {
			// console.log(JSON.stringify($this.selectedDisk));
			$this.player.removeDiskFromArmy($this.selectedArmyName, $this.selectedDisk);
			// console.log(JSON.stringify($this.selectedDisk));
		}
		// update the list of disks correctly
		$this.showArmyInfo();
		$this.draw();
	};

	this.mouseUpHandler = function(tablePoint, mouseButton) {
		$this.lastMouseEvent = null;
		$this.mousedown = false;
		$this.selectedDisk = null;
	};

	this._mouseMoveHandler = function(event) {
		// console.log('ProfileUI._mouseMoveHandler');

		if ($this.mousedown && $this.selectedDisk !== null) {

			$this.player.move($this.selectedDisk, $this.getTableLocation(event.pageX, event.pageY), $this.selectedArmyName);

			// $this.army[$this.selectedDisk.list][$this.selectedDisk.index].location
			// = $this.getTableLocation(event.pageX, event.pageY);
			$this.draw();
		}

		else if ($this.lastMouseEvent !== null && event.which !== 0) {
			$this.mouseMoveHandler(event);
		}
	};

	this.onError = function() {
		//
	};

	this.deleteArmy = function(armyName) {
		$this.api.deleteArmy(armyName, function(result) {
			$this.player.update(result.player);
			$this.listArmies($this.player.getArmies());
		}, null);

	};

	this.saveArmy = function() {
		// console.log('ProfileUI.saveArmy');
		var armyName = String($("#armyName").val());

		// console.log(JSON.stringify($this.army));
		$this.api.saveArmy(armyName, $this.player.armies[$this.selectedArmyName], function(result) {
			$this.player.update(result.player);
			$this.listArmies($this.player.getArmies());
			window.location.hash = "#!" + armyName;
		}, null);
	};

	/**
	 * @param {Player}
	 *            p
	 */
	this.setPlayer = function(p) {
		$this.player = p;
	};

	/*
	 * $this.mouseScrollHandler = function(event) {
	 * $this.mouseScrollHandler(event); $this.draw(); };
	 */

	/**
	 * @param {Point}
	 *            tablePoint this is a table point, not a screen point
	 * @param {Event=}
	 *            event
	 * @return {?number}
	 */
	this.selectDisk = function(tablePoint, event) {
		/**
		 * @type {?number}
		 */
		var clickedDisk = null;

		$.each($this.player.getDiskNumbers(),
		/**
		 * @param {number}
		 *            diskNumber
		 */
		function(diskNumber) {
			var dp = $this.player.getDiskInfo(diskNumber, $this.selectedArmyName);
			// check to see if the clicked point is inside the disk
			// console.log(JSON.stringify(dp.location));
			// console.log(JSON.stringify(mp));
			var distance = Math.sqrt(Math.pow(dp.location.x - tablePoint.x, 2) + Math.pow(dp.location.y - tablePoint.y, 2));
			// console.log(distance);
			if (distance <= dp.disk.diameter / 2) {
				// add the disk to the clickedDisks object
				clickedDisk = diskNumber;
				return false;
			}
		});

		return clickedDisk;
	};

	this.updateLinks = function() {

		var toRemove = "/login.html?return_to=battledisks%2F";
		if ($this.player.name) {
			// log_in
			$("#log_in").attr("href", "profile.html");
			$("#log_in").text($this.player.name);

			// new_table
			$(".new_table").attr("href", $(".new_table").attr("href").replace(toRemove, ""));

			// shop
			$("#shop").attr("href", $("#shop").attr("href").replace(toRemove, ""));
		}
	};
}