/**
 * @constructor
 * @class
 * @extends UI
 * @param {Table}
 *            table
 * @param {API}
 *            api
 * @param {Player}
 *            player
 * @returns
 */
function ShopUI(api, table, player) {
	"use strict";

	$.extend(this, new UI("#table"));
	var $this = this;

	// TODO 3 add the context menu

	/**
	 * @type {Table}
	 */
	this.table = table;
	/**
	 * @type {API}
	 */
	this.api = api;
	/**
	 * @type {Player}
	 */
	this.player = player;

	// this.container = $("#table");

	this.scale = 3;

	this.selectedDisks = {};

	this.disksCtx = document.getElementById("disks").getContext('2d');
	this.highlightsCtx = document.getElementById("highlights").getContext('2d');

	this.selectedDisk = null;

	this.filter = null;

	// prevent double clicks from leaking
	document.getElementById("disks").onselectstart = function() {
		return false;
	};

	$(this.container).mousedown(
			function(event) {
				$this.mouseDownHandler($this.getTableLocation(event.pageX,
						event.pageY), event.which, event);
			});

	$(this.container).mouseup(
			function(v) {
				$this.mouseUpHandler($this.getTableLocation(v.pageX, v.pageY),
						v.which);
			});

	$(this.container).bind("contextmenu", function(v) {
		return false;
	});

	$(this.container).mousemove(function(v) {
		$this._mouseMoveHandler(new Point(v.pageX, v.pageY), v);
	});

	$('#buybutton1').click(function(v) {
		$this.purchase();
	});

	$(this.container).bind('mousewheel', function(event) {
		$this.mouseScrollHandler(event);
		return false;
	});

	var resizeTimer = null;
	$(window).resize(function() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout($this.draw, 100);
	});

	this.checkFilter = function() {
		// console.log("ShopUI.checkFilter");
		var filter = $this.getFilter();

		if (filter !== $this.filter) {
			$this.filter = filter;
			if (typeof $this.draw !== "undefined") {
				$this.draw();
			}
		}
	};

	// disk search box
	// if ($("#search").length > 0) {
	// console.log("starting checkFilter interval");
	setInterval(function() {
		// console.log(this);
		$this.checkFilter.call($this);
	}, 1000);
	// }

	this.debug = function() {
		//
	};

	this.displayAppInfo = function(info) {
		// console.log(info);
		if (typeof info === "undefined") {
			return;
		}
		$("#applicationVersion").text(info.applicationVersion);
		var u = new Date(info.uploadDate);
		$("#uploadDate").text(
				u.getFullYear() + "." + (u.getMonth() + 1) + "." + u.getDate()
						+ " " + u.getHours() + ":" + u.getMinutes() + ":"
						+ u.getSeconds() + "GMT");
	};

	this.init = function() {
		this.disksCtx.canvas.height = $("#table").height();
		this.disksCtx.canvas.width = $("#table").width();

		this.highlightsCtx.canvas.height = $("#table").height();
		this.highlightsCtx.canvas.width = $("#table").width();

		this.offset = {
			"x" : $("#table").width() / 2,
			"y" : $("#table").height() / 2
		};

	};

	this.draw = function() {
		// console.log("ShopUI.draw");

		this.disksCtx.canvas.height = $("#table").height();
		this.disksCtx.canvas.width = $("#table").width();

		this.highlightsCtx.canvas.height = $("#table").height();
		this.highlightsCtx.canvas.width = $("#table").width();

		// draw all the disks that match last
		var selectedDisksNumbers = [];

		$this.table.getDiskNumbers().reverse().forEach(function(diskNumber) {
			// console.log(diskNumber);
			var info = $this.table.getDiskInfo(diskNumber);
			if ($this.matchesFilter(info.disk)) {
				selectedDisksNumbers.push(diskNumber);
				// console.log(diskNumber);
			}
			// this disk doesn't match the filter, and there is a filter
			else if ($this.getFilter() != "") {
				$this.drawDisk($this.disksCtx, info, $this.highlightsCtx, {
					'lightness' : 0.8
				});
			}
			// this disk doesn't match the filter, and there isn't a filter
			else {
				$this.drawDisk($this.disksCtx, info, $this.highlightsCtx);
			}
		});

		selectedDisksNumbers.reverse().forEach(function(diskNumber, i) {
			// console.log(diskNumber);
			// console.log(i);

			var info = $this.table.getDiskInfo(diskNumber);

			$this.drawDisk($this.disksCtx, info, $this.highlightsCtx);
		});
	};

	this.getDiskHighlight = function(disk) {
		// console.log(info);
		// transparent black
		var highlightColor = 'rgba(55,55,55,1)';

		if ($this.matchesFilter(disk)) {
			highlightColor = 'rgba(0,0,200,1)';
		}

		if (Object.keys(this.selectedDisks).indexOf(disk.name) >= 0) {
			highlightColor = 'rgba(55,55,55,1)';
		}

		if (Object.keys(this.selectedDisks).indexOf(disk.name) >= 0) {
			highlightColor = 'rgba(55,55,55,1)';
		}
		return highlightColor;
	};

	this.listSelectedDisks = function() {

		$("#selectedDisks").empty();

		var totalPrice = 0;
		var rate = 0.09;
		var points = 0;
		// console.log(this.table);

		$.each($this.selectedDisks, function(diskName, diskInfo) {

			var li = $("<li>");
			li.text(diskName + " x" + diskInfo.count);

			var add = $("<a>");
			add.html("[+]");
			add.attr("href", "");
			add.click(function(e) {
				e.preventDefault();
				$this.selectedDisks[diskName].count++;

				$this.listSelectedDisks();

				return false;
			});
			li.append(add);

			var remove = $("<a>");
			remove.html("[-]");
			remove.attr("href", "");
			remove.click(function(e) {
				e.preventDefault();

				$this.selectedDisks[diskName].count--;

				if ($this.selectedDisks[diskName].count <= 0) {
					delete $this.selectedDisks[diskName];
				}

				$this.listSelectedDisks();

				// this.deleteArmy(armyName);
				return false;
			});
			li.append(remove);

			$("#selectedDisks").append(li);
			var price = diskInfo.disk.price;
			if (!price) {
				price = diskInfo.disk.cost * rate;
			}
			totalPrice += price * diskInfo.count;
			points += diskInfo.count * diskInfo.disk.cost;
		});

		$("#total_points").text(points);
		$("#total_cost").text("$" + totalPrice.toFixed(2));
	};

	this.mouseUpHandler = function(tablePoint, mouseButton) {
		$this.lastMouseEvent = null;
		$this.mousedown = false;
		$this.selectedDisk = null;
	};

	this.mouseDownHandler = function(tablePoint, pressedMouse, event) {
		// console.log('ShopUI.mouseDownHandler');
		$this.lastMouseEvent = event;
		$this.mousedown = true;

		$this.selectedDisk = $this.selectDisk(tablePoint);

		// if a disk is selected
		if ($this.selectedDisk !== null) {

			if (Object.keys($this.selectedDisks).indexOf(
					$this.table.getDiskInfo($this.selectedDisk).disk.name) === -1) {
				$this.selectedDisks[this.table.getDiskInfo($this.selectedDisk).disk.name] = {
					"count" : 0,
					"disk" : $this.table.getDiskInfo($this.selectedDisk).disk
				};
			}
			// left click
			if (pressedMouse === 1) {
				// add one of this disk
				$this.selectedDisks[$this.table.getDiskInfo($this.selectedDisk).disk.name].count++;
				$this.draw();
			}
			// right click
			else if (pressedMouse === 3) {
				// subtract one of this disk
				$this.selectedDisks[$this.table.getDiskInfo($this.selectedDisk).disk.name].count--;

				if ($this.selectedDisks[$this.table
						.getDiskInfo($this.selectedDisk).disk.name].count <= 0) {
					delete $this.selectedDisks[$this.table
							.getDiskInfo($this.selectedDisk).disk.name];
					$this.draw();
				}
			}
		}

		// update the list of disks correctly
		$this.listSelectedDisks();
		// this.draw();
	};

	/**
	 * @param {Point}
	 *            screenLocation
	 * @param event
	 */
	this._mouseMoveHandler = function(screenLocation, event) {
		// console.log('ShopUI._mouseMoveHandler');
		// console.log($this.selectedDisk);

		if ($this.selectedDisk != null) {
			// console.log('selectedDisk != null');
			$this.table.getDiskInfo($this.selectedDisk).mementoInfo.location = $this
					.getTableLocation(screenLocation.x, screenLocation.y);
			$this.draw();
		}

		else if ($this.lastMouseEvent !== null && event.which !== 0) {
			// console.log('selectedDisk is null');
			// $this.mouseMoveHandler(event);
			$this.mouseScreenLocation = screenLocation;
			$this.mouseMoveHandler.call(this, event);
		}
	};

	this.onError = function() {
		//
	};

	this.purchase = function() {
		// alert("use the card number 4111 1111 1111 1111 when checking out.");
		// make sure the player is logged in first

		// create object of diskNames:count pairs
		var disks = {};

		$.each(this.selectedDisks, function(diskName, info) {
			disks[diskName] = info.count;
		});

		this.api.getJWT(disks, function(result) {
			console.log(result);

			if (result.jwt === "") {
				// no need to use google payments, for some reason
				console.log("no jwt, must not need to use google payments.");
				$this.purchaseSuccessHandler(null);

			} else if (result.jwt !== "") {
				goog.payments.inapp.buy({
					'jwt' : result.jwt,
					'success' : $this.purchaseSuccessHandler,
					'failure' : $this.purchaseFailureHandler
				});
			}
		}, function(result) {
			console.log("failure");
			console.log(result);
		});
	};

	// Success handler
	this.purchaseSuccessHandler = function(purchaseAction) {
		console.log("Purchase completed successfully.");
		console.log(purchaseAction);
		// redirect to profile page
		window.location.pathname = "/battledisks/profile.html";
	};

	// Failure handler
	this.purchaseFailureHandler = function(purchaseActionError) {
		alert("Purchase did not complete.");
		console.log("Purchase did not complete.");
	};

	/*
	 * this.mouseScrollHandler = function(event) {
	 * this.mouseScrollHandler(event); this.draw(); };
	 */

	/**
	 * @param {Point}
	 *            tablePoint this is a table point, not a screen point
	 * @return {?number}
	 */
	this.selectDisk = function(tablePoint) {
		// console.log('ShopUI.selectDisk');
		var clickedDisk = null;

		$.each($this.table.getDiskNumbers(), function(diskNumber) {
			var diskInfo = $this.table.getDiskInfo(diskNumber);
			// check to see if the clicked point is inside the disk
			// console.log(i);
			// console.log(dp);
			var distance = Math.sqrt(Math.pow(diskInfo.mementoInfo.location.x
					- tablePoint.x, 2)
					+ Math.pow(diskInfo.mementoInfo.location.y - tablePoint.y,
							2));
			// console.log(distance);
			if (distance <= diskInfo.disk.diameter / 2) {
				// add the disk to the clickedDisks object
				clickedDisk = diskNumber;
				return false;
			}
		});

		// console.log(clickedDisk);

		return clickedDisk;
	};

	this.updateLinks = function() {

		var toRemove = "/login.html?return_to=diskwars%2F";
		if ($this.player.name) {
			// log_in
			$("#log_in").attr("href", "profile.html");
			$("#log_in").text(this.player.name);

			// profile
			if ($("#profile").length) {
				$("#profile").attr("href",
						$("#profile").attr("href").replace(toRemove, ""));
			}

			// new_table
			$(".new_table").attr("href",
					$(".new_table").attr("href").replace(toRemove, ""));
		}
	};
}