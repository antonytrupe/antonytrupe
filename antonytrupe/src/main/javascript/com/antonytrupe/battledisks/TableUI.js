/**
 * @class
 * @param api
 * @param table
 * @param container
 */
function TableUI(api, table, container) {
	"use strict";
	// * @extends UI
	$.extend(this, new UI(container));
	var $this = this;

	var PIXELS_PER_INCH = 128;
	var TO_RADIANS = Math.PI / 180;
	var REFRESH_DELAY = 5000;

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
	this.player = new Player();

	this.playbackTimeoutID = null;

	this.MODE = {
		PLAY : "PLAY",
		PAUSE : "PAUSE",
		STOP : "STOP"
	};

	this.mode = this.MODE.PLAY;

	/**
	 * @type {?number}
	 */
	this.selectedDisk = null;

	/**
	 * @type {?string}
	 */
	this.action = null;

	/**
	 * @type {Array}
	 */
	this.disksToDraw = [];

	this.mouseScreenLocation = null;

	this.mementoId = null;

	/**
	 * @type {boolean}
	 */
	this.initialized = false;

	this.highlightsCtx = $(".highlights", $this.container).get(0).getContext(
			'2d');
	this.disksCtx = $(".disks", $this.container).get(0).getContext('2d');
	this.moveCtx = $(".move", $this.container).get(0).getContext('2d');
	this.tooltipsCtx = $(".tooltips", $this.container).get(0).getContext('2d');

	this.activationCounterImage = new Image();
	this.activationCounterImage.src = $this.api.getBaseUrl()
			+ 'i/Activation.png';

	this.woundCounterImage = new Image();
	this.woundCounterImage.src = $this.api.getBaseUrl() + 'i/Wound.png';

	/*
	 * $(window).mouseout(function() { console.log('window.out'); });
	 * 
	 * $(document).mouseout(function() { console.log('document.out'); });
	 * 
	 * window.addEventListener("mouseout", function() {
	 * console.log('window.out2'); }, false);
	 * 
	 * document.addEventListener("mouseout", function() {
	 * console.log('document.out2'); }, false);
	 */

	$("#slider").slider(
			{
				"min" : 0,
				"change" : function(event, ui) {
					$(ui.handle).text(ui.value);
				},
				"slide" : function(event, ui) {
					console.log(ui.value);
					if (ui.value === $this.table.mementoId) {
						$this.mementoId = null;

					} else {
						$this.mementoId = ui.value;
					}

					$(ui.handle).text(ui.value);
					var memento = $this.api.getMemento($this.table.getId(),
							$this.mementoId != null ? $this.mementoId
									: $this.table.mementoId);
					if (memento) {
						$this.table.restoreMemento(memento);
						$this.draw();
						// update table info
						$this.displayBoardInfo();
					}
				}
			});

	// start the playback pump
	this.playbackTimeoutID = setTimeout(function() {
		$this.displayNextMemento();
	}, $this.REFRESH_DELAY);

	$("#contextMenu").mouseleave(function() {
		// console.log("contextMenu mouseleave");
		if ($this.action === null) {
			$this.selectedDisk = null;
		}
		$("#diskInfo").hide();
		$("#spells").hide();
		$(this).hide();
	});

	$("#loading, #refresh").click(
			function(e) {
				// manual update link
				// this should also restart the polling
				// console.log('reload');
				$this.api.getTable($this.table.getId(), $this.onSuccess,
						$this.onError, REFRESH_DELAY);
				e.preventDefault();
				return false;
			});

	// context menu handlers

	$(".menuItem.DISK_INFO").click(function(e) {
		// $this.action = "MOVE";
		// $("#contextMenu").hide();

		$this.displayDiskInfo($this.table.getDiskInfo($this.selectedDisk));

		e.preventDefault();
		return false;
	});

	$(".menuItem.MOVE").click(function(e) {
		$this.action = "MOVE";
		$("#contextMenu").hide();
		e.preventDefault();
		return false;
	});

	$(".menuItem.REINFORCE").click(function(e) {
		$this.action = "REINFORCE";
		$("#contextMenu").hide();
		e.preventDefault();
		return false;
	});

	$(".menuItem.END_REINFORCEMENTS").click(function(e) {
		$("#contextMenu").hide();
		$this.endReinforcements();
		e.preventDefault();
		return false;
	});

	$(".menuItem.END_ACTIVATIONS").click(function(e) {
		$("#contextMenu").hide();
		$this.endActivations();
		e.preventDefault();
		return false;
	});

	$(".menuItem.END_MISSILES").click(function(e) {
		$("#contextMenu").hide();
		$this.endMissiles();
		e.preventDefault();
		return false;
	});

	$(".menuItem.ACTIVATE").click(function(e) {
		$("#contextMenu").hide();
		$this.activateDisk();
		e.preventDefault();
		return false;
	});

	$(".menuItem.SELECT_ATTACKEE").click(function(e) {
		$("#contextMenu").hide();
		$this.action = "SELECT_ATTACKEE";
		e.preventDefault();
		return false;
	});

	$(".menuItem.SELECT_DEFENDEE").click(function(e) {
		$("#contextMenu").hide();
		$this.action = "SELECT_DEFENDEE";
		e.preventDefault();
		return false;
	});

	$(".menuItem.ARROW").click(function(e) {
		$("#contextMenu").hide();
		$this.action = "ARROW";
		e.preventDefault();
		return false;
	});

	$(".menuItem.BOLT").click(function(e) {
		$("#contextMenu").hide();
		$this.action = "BOLT";
		e.preventDefault();
		return false;
	});

	$(".menuItem.FIREBALL").click(function(e) {
		$("#contextMenu").hide();
		$this.action = "FIREBALL";
		e.preventDefault();
		return false;
	});

	$(".menuItem.BOULDER").click(function(e) {
		$("#contextMenu").hide();
		$this.action = "BOULDER";
		e.preventDefault();
		return false;
	});

	// create a handler for hash changes
	window.onpopstate = function(event) {
		// console.log('window.onpopstate');
		var new_id = window.location.hash.replace("#", "").replace("!", "");
		// console.log(JSON.stringify(new_id));

		if (new_id !== "" && new_id !== $this.table.getId()) {
			// cancel current request
			$this.api.getTable(new_id, $this.onSuccess, $this.onError, 0);
		}
	};

	// attach the click handler
	$(container).click(
			function(v) {
				$this.mouseClickHandler($this
						.getTableLocation(v.pageX, v.pageY), v.which);
			});

	// attach the mousedown handler
	$(container).mousedown(
			function(v) {
				$this.mouseDownHandler(
						$this.getTableLocation(v.pageX, v.pageY), v.which, v);
			});

	// attach the mouseup handler
	$(container).mouseup(
			function(v) {
				$this.mouseUpHandler($this.getTableLocation(v.pageX, v.pageY),
						v.which);
			});

	// capture and ignore right clicks
	$(container).bind("contextmenu", function(v) {
		return false;
	});

	$(container).mousemove(function(v) {
		$this._mouseMoveHandler(new Point(v.pageX, v.pageY), v);
	});

	$(container).bind('mousewheel', function(event) {
		$this._mouseScrollHandler(event);
		return false;
	});

	$(document).keyup(function(v) {
		$this.keyPressHandler(v);
	});

	var windowResizeTimer = 0;
	$(window).resize(function() {
		// console.log("window.resize");
		clearTimeout(windowResizeTimer);
		windowResizeTimer = setTimeout($this.draw, 100);
	});

	this.activateDisk = function() {

		$this.table.activateDisk($this.selectedDisk, $this.currentPlayer);

		$this.mementoId = null;

		// optimistic update
		$this.update({
			"user" : $this.currentPlayer,
			"table" : $this.table
		});

		// console.log("TableUI.activateDisk");
		$this.api.activateDisk($this.table.getId(), $this.selectedDisk,
				$this.onSuccess, $this.onError);
	};

	/**
	 * @param {string}
	 *            name
	 * @param {(Element|string|jQuery)=}
	 *            hint
	 * @param {(Element|jQuery)=}
	 *            parent
	 * @param {boolean=}
	 *            dismissible
	 */
	this.addHint = function(name, hint, parent, dismissible) {
		dismissible = (dismissible == undefined ? true : false);
		var hintToggles = typeof localStorage["hintToggles"] !== "undefined" ? JSON
				.parse(localStorage["hintToggles"])
				: {};
		if (hintToggles[name]) {
			return;
		}

		var check = $(".hint." + name, parent);
		// see if this hint is already on the screen
		if (check.length !== 0) {
			return;
		}

		hint.addClass("hint");
		hint.addClass(name);

		var close = $("<button>");

		if (dismissible) {
			// make each hint dismissable
			close.text("Got it.");
			close.on("click", function() {
				hint.remove();
				hintToggles[name] = true;
				localStorage["hintToggles"] = JSON.stringify(hintToggles);
			});
		}
		if (dismissible) {
			hint.append(close);
		}
		if (parent == undefined) {
			parent = $("#hints");
		}

		parent.append(hint);
	};

	this.setAttackee = function(attacker, attackee) {

		$this.table.setAttackee($this.currentPlayer, attacker, attackee);
		$this.mementoId = null;

		// optimistic update
		$this.update({
			"user" : $this.currentPlayer,
			"table" : $this.table
		});

		$this.api.setAttackee($this.table.getId(), attacker, attackee,
				$this.onSuccess, $this.onError);

		$this.action = null;
		$this.selectedDisk = null;
	};

	this.contextMenu = function(screenLocation) {
		// console.log('TableUI.contextMenu');

		// hide all options
		$("#contextMenu .menuItem").css("display", "none");

		if (!($this.mementoId === $this.table.mementoId || $this.mementoId === null)) {
			console
					.log('not displaying context menu because ui is not at most current memento.');
			console.log($this.mementoId);
			console.log($this.table.mementoId);
			return;
		}

		var show = false;

		// show appropriate actions

		// DISKINFO
		if ($this.selectedDisk !== null) {
			// console.log('show disk info');
			$("#contextMenu .DISK_INFO").css("display", "block");
			$("#contextMenu .DISK_INFO .text").text(
					$this.table.getDiskInfo($this.selectedDisk).disk.name);
			show = true;
		}

		// END_REINFORCEMENTS
		if (($this.table.getSegment() === "JOIN" || $this.table.getSegment() === "REINFORCEMENTS")
				&& $this.currentPlayer !== null
				&& $this.currentPlayer !== ""
				&& $this.table.getPlayerInfo($this.currentPlayer).segment === "REINFORCEMENTS") {
			$("#contextMenu .END_REINFORCEMENTS").css("display", "block");
			show = true;
		}

		// REINFORCE
		if ($this.table.canReinforce($this.currentPlayer, $this.selectedDisk)) {
			$("#contextMenu .REINFORCE").css("display", "block");
			show = true;
		}

		// MOVE
		if ($this.table.canMove($this.currentPlayer, $this.selectedDisk)) {
			$("#contextMenu .MOVE").css("display", "block");
			show = true;
		}

		// ACTIVATE
		if ($this.table.canActivate($this.currentPlayer, $this.selectedDisk)) {
			$("#contextMenu .ACTIVATE").css("display", "block");
			show = true;
		}

		// MISSILEs
		if ($this.table.getSegment() === 'MISSILE'
				&& $this.selectedDisk !== null) {

			// console.log(1);

			// ARROW
			console.log($this.selectedDisk);
			if ($this.table.canMissile($this.currentPlayer, $this.selectedDisk,
					'arrow')) {
				$("#contextMenu .ARROW").css("display", "block");
				$("#contextMenu .ARROW .count")
						.text(
								$this.table.getDiskInfo($this.selectedDisk).disk.arrows);
				show = true;
			}

			// BOLTS
			if ($this.table.canMissile($this.currentPlayer, $this.selectedDisk,
					'BOLT')) {
				$("#contextMenu .BOLT").css("display", "block");
				$("#contextMenu .BOLT .count").text(
						$this.table.getDiskInfo($this.selectedDisk).disk.bolts);
				show = true;
			}

			// FIREBALLS
			if ($this.table.canMissile($this.currentPlayer, $this.selectedDisk,
					'FIREBALL')) {
				$("#contextMenu .FIREBALL").css("display", "block");
				$("#contextMenu .FIREBALL .count")
						.text(
								$this.table.getDiskInfo($this.selectedDisk).disk.fireballs);
				show = true;
			}

			// BOULDERS
			if ($this.table.canMissile($this.currentPlayer, $this.selectedDisk,
					'BOULDER')) {
				$("#contextMenu .BOULDER").css("display", "block");
				$("#contextMenu .BOULDER .count")
						.text(
								$this.table.getDiskInfo($this.selectedDisk).disk.boulders);
				show = true;
			}
		}

		// SPELL
		if ($this.table.canCastSpell($this.currentPlayer, $this.selectedDisk)) {
			$("#spells").empty();
			// TODO get all the spells
			console.log($this.table.getPlayerInfo($this.currentPlayer));
			var spells = $this.table.getPlayerInfo($this.currentPlayer).spells;
			$(spells).each(function(i, spell) {
				console.log(spell);
				console.log($this.table.disks[spell]);
				$("#spells").append($("<li>").text(spell));
			});
			$("#contextMenu .SPELL").css("display", "block");
			show = true;
		}

		// END_ACTIVATIONS
		if ($this.currentPlayer !== null
				&& $this.table.getSegment() === "ACTIVATION"
				&& $this.table.getPlayerInfo($this.currentPlayer).segment === "ACTIVATION") {
			$("#contextMenu .END_ACTIVATIONS").css("display", "block");
			show = true;
		}

		// END_MISSILES
		if ($this.currentPlayer !== null
				&& $this.table.getSegment() === "MISSILE"
				&& $this.table.getPlayerInfo($this.currentPlayer).segment === "MISSILE") {
			$("#contextMenu .END_MISSILES").css("display", "block");
			show = true;
		}

		// SELECT_DEFENDEE
		if ($this.currentPlayer !== null
				&& $this.table.getSegment() === "COMBAT"
				&& $this.table.isPinnedByEnemy($this.selectedDisk)
				&& $this.table.getDefendees($this.selectedDisk) === null
				&& $this.currentPlayer === $this.table
						.getDiskInfo($this.selectedDisk).mementoInfo.player) {
			$("#contextMenu .SELECT_DEFENDEE").css("display", "block");
			show = true;
		}

		// SELECT_ATTACKEE
		if ($this.currentPlayer !== null
				&& $this.table.getSegment() === "COMBAT"
				&& $this.table.isPinningEnemy($this.selectedDisk)
				&& $this.table.getAttackees($this.selectedDisk) === null) {
			$("#contextMenu .SELECT_ATTACKEE").css("display", "block");
			show = true;
		}

		if ($(container).width() < screenLocation.x + $("#contextMenu").width()) {
			screenLocation.x = $(container).width() - $("#contextMenu").width();
		}

		if ($(container).height() < screenLocation.y
				+ $("#contextMenu").height()) {
			screenLocation.y = $(container).height()
					- $("#contextMenu").height();
		}

		$("#contextMenu").css("top", screenLocation.y - 0);
		$("#contextMenu").css("left", screenLocation.x - 2);

		// make sure we don't overflow the right or bottom
		// only show context menu if there is some available action

		// console.log(show);

		if (show) {
			// console.log('showing');
			$("#contextMenu").show();
		}
	};

	this.setDefendee = function(defender, defendee) {

		$this.table.setDefendee($this.currentPlayer, defender, defendee);
		$this.mementoId = null;

		// optimistic update
		$this.update({
			"user" : $this.currentPlayer,
			"table" : $this.table
		});

		$this.api.setDefendee($this.table.getId(), defender, defendee,
				$this.onSuccess, $this.onError);

		$this.action = null;
		$this.selectedDisk = null;
	};

	this.displayBoardInfo = function() {
		// board details

		$("#tableId").text($this.table.getId());

		$("#boardSegment .currentSegment").removeClass("currentSegment");
		$("#boardSegment ." + $this.table.getSegment()).addClass(
				"currentSegment");

		$("#boardSegment .currentPlayerSegment").removeClass(
				"currentPlayerSegment");

		if ($this.currentPlayer
				&& Object.keys($this.table.memento.players).indexOf(
						$this.currentPlayer) > -1) {
			$(
					"#boardSegment ."
							+ $this.table.getPlayerInfo($this.currentPlayer).segment)
					.addClass("currentPlayerSegment");
		}

		$("#round").text($this.table.getRound());
		$("#reinforcements").text($this.table.reinforcements);
		$("#startingDisks").text($this.table.startingDisks);

		// player order/status
		$(".playerOrder").empty();

		var playerName = $this.table.getFirstPlayer();

		for (var i = 0; i < $this.table.playerOrder.length; i++, playerName = $this.table
				.getNextPlayer(playerName)) {

			// console.log(playerName);

			var li = $("<li>");
			li.text(playerName);
			var title = "";
			// underline the first player
			if ($this.table.getFirstPlayer() === playerName) {
				li.css("text-decoration", "underline");
				title += "first player(underlined), ";
			}
			// italicize the current user
			// if ($this.currentPlayer === playerName) {
			// li.css("font-style", "italic");
			// title += "you(italicized), ";
			// }
			// bold the player whose turn it is
			if ($this.table.getCurrentPlayer() === playerName) {
				li.css("font-weight", "bold");
				title += "current player(bold), ";
			}
			title = title.substr(0, title.length - 2);
			li.attr("title", title);
			// console.log('.' + $this.table.getSegment() + " .playerOrder");
			// handle a player not having joined at this point yet
			if ($this.table.getPlayerInfo(playerName)) {
				$(
						'.' + $this.table.getPlayerInfo(playerName).segment
								+ " .playerOrder").append(li);
			} else {
				$('.JOIN' + " .playerOrder").append(li);
			}
		}
	};

	this.displayDiskInfo = function(diskInfo) {
		// display disk info
		$("#player").text(diskInfo.mementoInfo.player);
		$("#alignment").text(diskInfo.disk.alignment);
		$("#faction").text(diskInfo.disk.faction);
		$("#attack").text(diskInfo.disk.attack);
		$("#defense").text(diskInfo.disk.defense);
		$("#toughness").text(diskInfo.disk.toughness);
		$("#wounds").text(diskInfo.disk.wounds);
		$("#movement").text(diskInfo.disk.movement);
		$("#diameter").text(diskInfo.disk.diameter);
		$("#speed").text(
				String(diskInfo.disk.diameter * diskInfo.disk.movement));
		$("#cost").text(diskInfo.disk.cost);

		// position diskInfo div
		var p = $("#contextMenu").position();

		// check to see if the div would be off the side of the screen, and
		// adjust
		if ($(container).width() < p.left + $("#contextMenu").width()
				+ $("#diskInfo").width()) {
			p.left -= ($("#diskInfo").width() - 7);
		} else {
			p.left += ($("#contextMenu").width() + 1);
		}

		// check to see if the div would be off the bottom of the screen, and
		// adjust
		if ($(container).height() < p.top + $("#diskInfo").height()) {
			p.top = $(container).height() - $("#diskInfo").height() - 2;
		}

		$("#diskInfo").css("top", p.top);
		$("#diskInfo").css("left", p.left);

		$("#diskInfo").toggle();

	};

	this.displayHints = function() {
		// console.log("TableUI.displayHints");
		var hints = $("#hints");

		// hints.empty();

		// not logged in
		if ($this.currentPlayer === "") {

			var login = $("#log_in").clone();
			login.text("Log in");
			hints.append(login);

		}
		// logged in but not in this table
		if ($this.currentPlayer !== ""
				&& $this.table.playerOrder.indexOf($this.currentPlayer) === -1
				&& $this.table.getId() !== "") {

			var hint = $("<span>");
			hint.css('margin-left', '1em');

			// hint.append("Choose an army:");

			// join on table
			var armies = $this.player.getArmies();

			var g = $("<span>");

			var armySelect = $("<select>");
			armySelect.attr("id", "army");
			g.append(armySelect);
			$.each(armies, function(i, armyName) {
				var option = $("<option>").text(armyName);

				option.val(armyName);

				armySelect.append(option);
			});

			// g.append("<br>");

			var joinButton = $("<button>").append("Join this table");
			joinButton.click(function() {
				var tableId = $this.table.getId();
				var army = $('#army').val();

				api.joinTable(tableId, army, function(result) {
					// if we got an id back
					if (result.id) {
						// go to the table
						window.location = "table.html#!" + result.id;
					}
					// if we didn't get an id, but did get a message
					else if (result.message) {
						// display the message
						alert(result.message);
					}
					// if we didn't get an id or a message, wtf
					else {
						console.log(result);
						alert(result);
					}
				}, function(result) {
					console.log(result);
				});
			});

			g.append(joinButton);
			hint.append(g);
			// hint.append(" this table.");

			$this.addHint("find_create_join", hint, $('li.JOIN'), false);

		}

		// logged in but no table selected
		if ($this.currentPlayer !== ""
				&& $this.table.playerOrder.indexOf($this.currentPlayer) === -1
				&& $this.table.getId() === "") {

			var list = $(".table_list").clone();

			// table list
			list.text("Find a table to join");
			hints.append(list);

			hints.append(", ");

			// new table
			var newTable = $(".new_table").clone();
			newTable.text("start a new table");
			hints.append(newTable);

			hints.append(".");

		}

		// logged in, joined, and join or reinforcements
		if ($this.currentPlayer !== ""
				&& $this.table.playerOrder.indexOf($this.currentPlayer) > -1
				&& ($this.table.getSegment() === "REINFORCEMENTS" || $this.table
						.getSegment() === "JOIN")
				&& $this.table.getPlayerInfo($this.currentPlayer).segment === "REINFORCEMENTS") {
			$this
					.addHint(
							"place_reinforcements",
							$("<span>")
									.append(
											"During the Reinforcements segment, you should place "
													+ $this.table
															.getReinforcementCount($this.currentPlayer)
													+ ' disks from your reinforcement stack around your staging disk.'));
		}

		// already placed reinforcements
		if ($this.currentPlayer !== ""
				&& $this.table.playerOrder.indexOf($this.currentPlayer) > -1
				&& ($this.table.getSegment() === "REINFORCEMENTS" || $this.table
						.getSegment() === "JOIN")
				&& $this.table.getPlayerInfo($this.currentPlayer).segment !== "REINFORCEMENTS") {
			$this
					.addHint(
							"all_players_reinforcement",
							$("<span>")
									.append(
											'You have saved your reinforcements, but all players must also do so before starting the Activation segment.'));
		}

		// done activating disks and waiting for other players to activate disks
		if ($this.currentPlayer !== ""
				&& $this.table.playerOrder.indexOf($this.currentPlayer) > -1
				&& $this.table.getSegment() === "ACTIVATION"
				&& $this.table.getPlayerInfo($this.currentPlayer).segment !== "ACTIVATION") {
			$this
					.addHint(
							'wait_1',
							$("<span>")
									.append(
											'When you have Activated all of your avaible disks, you must wait for the rest of the players to finish Activating the rest of their disks.'));
			// hints.text('Wait for the rest of the players to finish their
			// activations.');
		}

		// have more disks to activate and waiting for turn
		if ($this.currentPlayer !== ""
				&& $this.table.playerOrder.indexOf($this.currentPlayer) > -1
				&& $this.table.getSegment() === "ACTIVATION"
				&& $this.table.getPlayerInfo($this.currentPlayer).segment === "ACTIVATION") {
			$this
					.addHint(
							"activation_turns",
							$("<span>")
									.append(
											"During the Activation segment, each player takes turns activating disks until all players have finished activation their disks."));
		}

		// activate disks
		if ($this.currentPlayer !== ""
				&& $this.table.playerOrder.indexOf($this.currentPlayer) > -1
				&& $this.table.getSegment() === "ACTIVATION"
				&& $this.table.getPlayerInfo($this.currentPlayer).segment === "ACTIVATION"
				&& $this.currentPlayer === $this.table.getCurrentPlayer()) {

			$this.addHint("activate", $("<span>").append(
					"It is now your turn to Activate disks."));
		}

		if ($this.table.getSegment() === "COMBAT") {

			var disksThatNeedAttackee = $this.table
					.getDisksThatNeedAttackee($this.currentPlayer);
			var disksThatNeedDefendee = $this.table
					.getDisksThatNeedDefendee($this.currentPlayer);

			// need to select which disk to defend
			if ($this.currentPlayer !== ""
					&& $this.table.playerOrder.indexOf($this.currentPlayer) > -1
					&& (disksThatNeedDefendee.length > 0 || disksThatNeedAttackee.length > 0)) {
				// combat hints
				$this
						.addHint(
								"defend_choice",
								$("<span>")
										.append(
												"When one of your disks is defending against more then one enemy disk, you must specify which disk to defend against before combat can be resolved."));
			}

			var nextAttacker = $this.table.getNextAttacker();

			if ($this.selectedDisk !== null
					&& $this.selectedDisk === nextAttacker.attacker) {
				$this
						.addHint(
								"attack_choice",
								$("<span>")
										.append(
												"When one of your disks is attacking more then one enemy disk, you must specify which disk to attack before combat can be resolved."));
			}

			if ($this.table.getDiskInfo(nextAttacker.attacker).mementoInfo.player === $this.currentPlayer
					&& $this.table.isPinningEnemy(nextAttacker.attacker)
					&& $this.table.getAttackees(nextAttacker.attacker) === null) {
				hints
						.append("Disk "
								+ $this.table
										.getDiskInfo(nextAttacker.attacker).disk.name
								+ "(" + nextAttacker.attacker
								+ ") needs to select an attackee. ");
			}

			// waiting on someone else to select which disk to attack/defend
			if ($this.currentPlayer !== ""
					&& $this.table.playerOrder.indexOf($this.currentPlayer) > -1
					&& $this.table.getSegment() === "COMBAT"
					&& !(disksThatNeedDefendee.length > 0 || disksThatNeedAttackee.length > 0)) {
				// combat hint
				$this
						.addHint(
								"opponent_combat_choice",
								$("<span>")
										.append(
												"When one of your opponents' disks is attacking or defending against more then one enemy disk, "
														+ "they must specify which disk to attack or defend against before combat can be resolved."));
			}
		}

		// someone else won
		if ($this.table.getSegment() === "FINISHED"
				&& $this.table.getWinners().indexOf($this.currentPlayer) === -1) {
			hints.text($this.table.getWinners() + " won.");
		}

		// current player won
		if ($this.table.getSegment() === "FINISHED"
				&& $this.table.getWinners().indexOf($this.currentPlayer) !== -1) {
			hints.text("You won!");
		}
	};

	this.drawStagingDisks = function() {
		// console.log('TableUI.drawStagingDisks');
		$.each($this.table.stagingDisks,
				function(i, stagingDiskInfo) {

					// console.log($this.table.playerOrder[i]);

					// //////////////////
					var screenLocation = $this.getScreenLocation(
							stagingDiskInfo.location.x,
							stagingDiskInfo.location.y);

					// ctx, location, radius, options
					$this.drawCircle($this.disksCtx, screenLocation,
							PIXELS_PER_INCH * stagingDiskInfo.disk.diameter
									/ $this.scale / 2);

					// label the staging disk
					if (table.playerOrder.length > i) {
						screenLocation = $this.getScreenLocation(
								stagingDiskInfo.location.x,
								stagingDiskInfo.location.y);

						$this.printCenterMiddle($this.disksCtx,
								table.playerOrder[i], screenLocation.x,
								screenLocation.y, 0, {
									"font" : (1 / $this.scale) * 4
											+ "em OpenSans"
								});
					}
				});
	};

	this.draw = function() {
		console.log("TableUI.draw");
		console.log($this.mementoId);

		$this.disksCtx.canvas.height = $($this.container).height();
		$this.disksCtx.canvas.width = $($this.container).width();

		$this.moveCtx.canvas.height = $($this.container).height();
		$this.moveCtx.canvas.width = $($this.container).width();

		$this.highlightsCtx.canvas.height = $($this.container).height();
		$this.highlightsCtx.canvas.width = $($this.container).width();

		$this.tooltipsCtx.canvas.height = $($this.container).height();
		$this.tooltipsCtx.canvas.width = $($this.container).width();

		// draw the edge scroll glow

		// draw all the terrain and staging disks
		$this.drawStagingDisks();

		$this.disksToDraw.length = 0;

		// console.log($this.table.memento);

		$this.disksToDraw = $this.table.getDiskNumbers();

		// console.log($this.disksToDraw);

		while ($this.disksToDraw.length > 0) {
			var k = $this.disksToDraw[0];
			$this.drawBottomDiskFirst(k);
		}

	};

	this.drawBottomDiskFirst = function(diskNumber) {
		// console.log("TableUI.drawBottomDiskFirst");

		var info = table.getDiskInfo(diskNumber);

		this.disksToDraw.remove(diskNumber.toString());

		// console.log(diskNumber);
		// console.log($this.table);

		// draw any disks that this disk is pinning first
		$.each(info.mementoInfo.pinning, function(i, v) {

			// disksToDraw is an array of strings
			// if we still need to draw a disk that is pinned by this disk
			if ($this.disksToDraw.indexOf(v.toString()) > -1) {
				$this.drawBottomDiskFirst(v);
			}

		});

		// we've drawn all the disks below this disk

		// if this is the selected disk
		if ($this.selectedDisk === diskNumber &&
		// and we are moving it during reinforcements
		$this.action === "REINFORCE" &&
		// and if there are more disks to draw
		$this.disksToDraw.length > 0) {
			// console.log(1);
			// move it to the end of the list
			$this.disksToDraw.push(diskNumber);
			// and don't draw it yet
			return;
		}

		var overlappingDisks = [];

		if ($this.action === "MOVE" && $this.selectedDisk !== null) {

			overlappingDisks = table
					.getOverlappingDisks1(
							new Point(
									table.getDiskInfo($this.selectedDisk).mementoInfo.location.x,
									table.getDiskInfo($this.selectedDisk).mementoInfo.location.y)
									.getEdge(
											$this
													.getTableLocation(
															$this.mouseScreenLocation.x,
															$this.mouseScreenLocation.y),
											table
													.getDiskInfo($this.selectedDisk).disk.diameter),
							table.getDiskInfo($this.selectedDisk).disk.diameter);

			// remove selected disk
			if (overlappingDisks.indexOf($this.selectedDisk) > 0) {
				overlappingDisks.splice(overlappingDisks
						.indexOf($this.selectedDisk), 1);
			}
			overlappingDisks = table.getTopDisks(overlappingDisks);
		}

		var hoveredDisk = null;

		if (($this.action === "SELECT_ATTACKEE" || $this.action === "SELECT_DEFENDEE")
				&& this.selectedDisk !== null) {
			hoveredDisk = $this.selectDisk($this.getTableLocation(
					$this.mouseScreenLocation.x, $this.mouseScreenLocation.y));
		}

		// dark gray
		var highlightColor = "rgba(55,55,55,1)";

		// pinned by moving disk
		if (table.getSegment() === "ACTIVATION" && $this.action === "MOVE"
				&& $this.selectedDisk !== null
				&& overlappingDisks.indexOf(diskNumber) > -1
				&& $this.selectedDisk !== diskNumber) {

			// friendly disk
			if (info.mementoInfo.player === $this.currentPlayer) {
				// green
				highlightColor = 'rgba(0,255,0,1)';
			}
			// enemy disk
			else {
				// red
				highlightColor = 'rgba(255,0,0,1)';
			}
		}

		// selected during combat resolution
		else if (info.mementoInfo.player === $this.currentPlayer
				&& table.getSegment() === "COMBAT"
				&& $this.selectedDisk === diskNumber
				&& ($this.action === "SELECT_DEFENDEE" || $this.action === "SELECT_ATTACKEE")) {
			// red
			highlightColor = 'rgba(0,0,255,1)';
		}

		// combat resolution intervention needed
		else if (info.mementoInfo.player === $this.currentPlayer
				&& ((table.isPinningEnemy(diskNumber) && table
						.getAttackees(diskNumber) === null) || (table
						.isPinnedByEnemy(diskNumber) && table
						.getDefendees(diskNumber) === null))) {
			// green
			highlightColor = 'rgba(0,255,0,1)';
		}

		// possible target during combat resolution and currently hovered
		else if ($this.action === "SELECT_DEFENDEE"
				&& $this.selectedDisk !== null
				&& diskNumber === hoveredDisk
				&& table.getDiskInfo($this.selectedDisk).mementoInfo.pinnedBy
						.indexOf(parseInt(diskNumber, 10)) !== -1
				&&
				// make sure its an enemy disk
				table.getDiskInfo($this.selectedDisk).mementoInfo.player != table
						.getDiskInfo(hoveredDisk).mementoInfo.player) {
			// red
			highlightColor = 'rgba(255,0,0,1)';
		}

		// possible target during combat resolution
		else if ($this.action === "SELECT_DEFENDEE"
				&& $this.selectedDisk !== null
				&&
				//
				$this.table.memento.diskInfo[$this.selectedDisk] !== null
				&&
				//
				table.getDiskInfo($this.selectedDisk).mementoInfo.pinnedBy
						.indexOf(parseInt(diskNumber, 10)) !== -1
				&&
				// make sure its an enemy disk
				table.getDiskInfo($this.selectedDisk).mementoInfo.player != table
						.getDiskInfo(diskNumber).mementoInfo.player) {
			// blue
			highlightColor = 'rgba(0,255,0,1)';
		}

		// nothing special, current player's disk
		else if (info.mementoInfo.player === $this.currentPlayer) {
			// white
			highlightColor = "rgba(32,32,32,.8)";
		}

		// this needs to be before adding the activation and wound counters
		$this.drawDisk($this.disksCtx, info, $this.highlightsCtx,
				highlightColor);

		// activation counter
		if (info.mementoInfo.activated) {

			// convert to radians
			var radius = 0;

			var f = $this.getScreenLocation(info.mementoInfo.location.x
					+ radius * Math.cos(info.mementoInfo.rotation),
					info.mementoInfo.location.y + radius
							* Math.sin(info.mementoInfo.rotation));

			$this.drawRotatedImage($this.disksCtx,
					$this.activationCounterImage, f.x, f.y, PIXELS_PER_INCH
							* 0.5 / $this.scale, PIXELS_PER_INCH * 0.5
							/ $this.scale, info.mementoInfo.rotation, 1);
		}

		// wound counters
		for (var i = 0; i < info.mementoInfo.wounds; i++) {
			var radius = 0.2 * info.disk.diameter;

			var rotation = info.mementoInfo.rotation - 90;

			switch (i) {

			case 1:
				rotation -= 60;
				break;
			case 2:
				rotation += 60;
				break;
			case 3:
				rotation -= 120;
				break;
			case 4:
				rotation += 120;
				break;
			}

			// console.log(rotation);

			var f = $this.getScreenLocation(info.mementoInfo.location.x
					+ radius * Math.cos(rotation * TO_RADIANS),
					info.mementoInfo.location.y + radius
							* Math.sin(rotation * TO_RADIANS));

			$this.drawRotatedImage($this.disksCtx, $this.woundCounterImage,
					f.x, f.y, PIXELS_PER_INCH * 0.5 / $this.scale,
					PIXELS_PER_INCH * 0.5 / $this.scale,
					info.mementoInfo.rotation, 1);
		}

		// show disk number
		var radius = 0.45 * info.disk.diameter;
		var rotation = info.mementoInfo.rotation + 90;
		var numberLocation = $this.getScreenLocation(
				info.mementoInfo.location.x + radius
						* Math.cos(rotation * TO_RADIANS),
				info.mementoInfo.location.y + radius
						* Math.sin(rotation * TO_RADIANS));
		$this.print($this.disksCtx, diskNumber, numberLocation.x,
				numberLocation.y, info.mementoInfo.rotation, {
					"font" : (1 / $this.scale) * 0.5 + "em OpenSans"
				});

	};

	this.drawMissileTarget = function(location, missile) {

		var missileScreenLocation = $this.getScreenLocation(location.x,
				location.y);

		// these increments need to be in sync with the increments in
		// Table.fireMissiles
		var innerRadius = 2;
		var middleRadius = 4;
		var outerRadius = 6;

		// outer bullseye circle, radius:4
		$this.drawCircle($this.moveCtx, missileScreenLocation, PIXELS_PER_INCH
				* outerRadius / $this.scale, {
			'fillStyle' : 'rgba(255,0,0,.2)',// '#FFBBBB',
			'strokeStyle' : 'black',
			'lineWidth' : 4 / $this.scale
		});

		// 99%
		$this.printCenterMiddle($this.moveCtx, "99%", missileScreenLocation.x,
				missileScreenLocation.y - PIXELS_PER_INCH
						* (outerRadius - 1 / 2) / $this.scale, 0, {
					"font" : (1 / this.scale) * 1.5 + "em OpenSans",
					"lineHeight" : (1 / this.scale) * 20
				});

		// middle bullseye circle, radius:2
		$this.drawCircle($this.moveCtx, missileScreenLocation, PIXELS_PER_INCH
				* middleRadius / $this.scale, {
			'fillStyle' : 'rgba(255,0,0,.4)',// '#FF6666',
			'strokeStyle' : 'black',
			'lineWidth' : 4 / $this.scale
		});

		// 95%
		$this.printCenterMiddle($this.moveCtx, "95%", missileScreenLocation.x,
				missileScreenLocation.y - PIXELS_PER_INCH
						* (middleRadius - 1 / 2) / $this.scale, 0, {
					"font" : (1 / this.scale) * 1.5 + "em OpenSans",
					"lineHeight" : (1 / this.scale) * 20
				});

		// inner bullseye circle, radius:1
		$this.drawCircle($this.moveCtx, missileScreenLocation, PIXELS_PER_INCH
				* innerRadius / $this.scale, {
			'fillStyle' : 'rgba(255,0,0,.6)',// '#FF0000',
			'strokeStyle' : 'black',
			'lineWidth' : 4 / $this.scale
		});

		// 68%
		$this.printCenterMiddle($this.moveCtx, "68%", missileScreenLocation.x,
				missileScreenLocation.y - PIXELS_PER_INCH
						* (innerRadius - 1 / 2) / $this.scale, 0, {
					"font" : (1 / this.scale) * 1.5 + "em OpenSans",
					"lineHeight" : (1 / this.scale) * 20
				});

		// console.log(missile);
		$this.drawDisk($this.moveCtx, {
			'disk' : missile,
			'mementoInfo' : {
				"location" : location
			}
		});

	};

	this.drawMovement = function() {
		// console.log("TableUI.drawMovement");

		// console.log($this.currentPlayer);

		if ($this.action === null) {
			return;
		}

		if ($this.selectedDisk === null) {
			return;
		}

		if ($this.currentPlayer === "") {
			return;
		}

		if ($this.currentPlayer !== $this.table.getCurrentPlayer()) {
			return;
		}

		if (Object.keys($this.table.memento.players).indexOf(
				$this.currentPlayer) === -1) {
			return;
		}

		// draw missiles
		if (($this.action === "ARROW" || $this.action === "BOLT"
				|| $this.action === "FIREBALL" || $this.action === "BOULDER")
				&& ($this.table.getPlayerInfo($this.currentPlayer).segment === "MISSILE" && $this.table
						.getSegment() === "MISSILE")) {

			// console.log('draw missile 1');

			$this.moveCtx.canvas.height = $($this.container).height();
			$this.moveCtx.canvas.width = $($this.container).width();

			var newTableLocation = $this.table
					.getPointInsideCircle(
							new Point(
									$this.table.getDiskInfo($this.selectedDisk).mementoInfo.location.x,
									$this.table.getDiskInfo($this.selectedDisk).mementoInfo.location.y),
							12, $this.getTableLocation(
									$this.mouseScreenLocation.x,
									$this.mouseScreenLocation.y));

			// console.log(newLocation);
			// abstract to drawMissile function
			$this.drawMissileTarget(newTableLocation, {
				'attack' : 2,
				'name' : 'Arrow',
				'type' : 'missile',
				'diameter' : 0.625
			});

		}

		// draw movement
		if ($this.action === "MOVE"
				&& ($this.table.getPlayerInfo($this.currentPlayer).segment === "ACTIVATION" && $this.table
						.getSegment() === "ACTIVATION")) {

			$this.moveCtx.canvas.height = $($this.container).height();
			$this.moveCtx.canvas.width = $($this.container).width();

			var newLocation = new Point(
					$this.table.getDiskInfo($this.selectedDisk).mementoInfo.location.x,
					$this.table.getDiskInfo($this.selectedDisk).mementoInfo.location.y)
					.getEdge($this.getTableLocation(
							$this.mouseScreenLocation.x,
							$this.mouseScreenLocation.y), $this.table
							.getDiskInfo($this.selectedDisk).disk.diameter);

			// console.log(newLocation);

			var a = (newLocation.y - $this.table
					.getDiskInfo($this.selectedDisk).mementoInfo.location.y)
					/ (newLocation.x - $this.table
							.getDiskInfo($this.selectedDisk).mementoInfo.location.x);

			var rotation = Math.atan(a) * 180 / Math.PI;

			var diskInfo = $this.table.getDiskInfo($this.selectedDisk);

			var moveInfo = {};

			// create a new object and copy everything from diskInfo, then
			// overright some of that with the tentative location
			$
					.extend(
							moveInfo,
							diskInfo,
							{
								'mementoInfo' : {
									"location" : newLocation,
									"rotation" : $this.table
											.getDiskInfo($this.selectedDisk).mementoInfo.rotation
											+ rotation * 2
								}
							});

			// console.log(moveInfo);
			$this.drawDisk($this.moveCtx, moveInfo);

			var centerPoint = $this
					.getScreenLocation(
							$this.table.getDiskInfo($this.selectedDisk).mementoInfo.location.x,
							$this.table.getDiskInfo($this.selectedDisk).mementoInfo.location.y);

			$this.moveCtx.beginPath();

			$this.moveCtx.lineWidth = 6 / $this.scale;

			var start = centerPoint
					.getEdge(
							$this.mouseScreenLocation,
							PIXELS_PER_INCH
									/ $this.scale
									* $this.table
											.getDiskInfo($this.selectedDisk).disk.diameter
									/ 4);

			$this.moveCtx.moveTo(start.x, start.y);

			// make this be the edge of the disk
			var end = centerPoint
					.getEdge(
							$this.mouseScreenLocation,
							PIXELS_PER_INCH
									/ $this.scale
									* $this.table
											.getDiskInfo($this.selectedDisk).disk.diameter
									/ 4 * 3);

			$this.moveCtx.lineTo(end.x, end.y);

			$this.moveCtx.closePath();
			$this.moveCtx.stroke();
		}
	};

	this.endActivations = function() {
		$this.table.endActivations($this.currentPlayer);
		$this.mementoId = null;

		// optimistic update
		$this.update({
			"user" : $this.currentPlayer,
			"table" : $this.table
		});

		$this.api.endActivations($this.table.getId(), $this.onSuccess,
				$this.onError);
	};

	this.endMissiles = function() {
		$this.table.endMissiles($this.currentPlayer);
		$this.mementoId = null;

		// optimistic update
		$this.update({
			"user" : $this.currentPlayer,
			"table" : $this.table
		});

		$this.selectedDisk = null;
		$this.api.endMissiles($this.table.getId(), $this.onSuccess,
				$this.onError);
	};

	this.endReinforcements = function() {
		$this.table.endReinforcements($this.currentPlayer);
		$this.mementoId = null;

		// optimistic update
		$this.update({
			"user" : $this.currentPlayer,
			"table" : $this.table
		});

		$this.selectedDisk = null;
		$this.api.endReinforcements($this.table.getId(), $this.onSuccess,
				$this.onError);
	};

	this.getHashId = function() {
		return window.location.hash.replace("#", "").replace("!", "");
	};

	/**
	 * this assumes the table has been loaded
	 */
	this.init = function() {

		$this.initialized = true;
		// console.log("TableUI.init");

		// console.log($this.disksCtx.canvas);

		$this.disksCtx.canvas.height = $($this.container).height();
		$this.disksCtx.canvas.width = $($this.container).width();

		$this.moveCtx.canvas.height = $($this.container).height();
		$this.moveCtx.canvas.width = $($this.container).width();

		$this.highlightsCtx.canvas.height = $($this.container).height();
		$this.highlightsCtx.canvas.width = $($this.container).width();

		$this.tooltipsCtx.canvas.height = $($this.container).height();
		$this.tooltipsCtx.canvas.width = $($this.container).width();

		// $this.offset = {
		// "x" : $($this.container).width() / 2,
		// "y" : $($this.container).height() / 2
		// };

		// 2.0 for no padding
		// 1.0 for half the disk diameter padding
		var padding = 1.0;

		$this.offset = $this.getDefaultOffset(padding);

		$this.scale = $this.getDefaultScale(padding);

	};

	this.getDefaultOffset = function(padding) {

		var left = 0, right = 0, top = 0, bottom = 0;

		$this.table.getDiskNumbers().forEach(function(diskNumber) {
			var l = $this.table.getDiskInfo(diskNumber).mementoInfo.location;
			var d = $this.table.getDiskInfo(diskNumber).disk;
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

		$this.table.stagingDisks.forEach(function(info) {
			var l = info.location;
			var d = info.disk;

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

		$this.table.getDiskNumbers().forEach(function(diskNumber) {
			var l = $this.table.getDiskInfo(diskNumber).mementoInfo.location;
			var d = $this.table.getDiskInfo(diskNumber).disk;
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

		$this.table.stagingDisks.forEach(function(info) {
			var l = info.location;
			var d = info.disk;

			// console.log(l);
			// console.log(d);

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

		var xRatio = (tableWidth * PIXELS_PER_INCH)
				/ $($this.container).width();
		var yRatio = (tableHeight * PIXELS_PER_INCH)
				/ $($this.container).height();

		return Math.max(xRatio, yRatio);

	};

	this.keyPressHandler = function(e) {
		// console.log(e);
		if ("A" === String.fromCharCode(e.which)) {

			if ($this.selectedDisk !== null) {
				$this.activateDisk();
			}
			$this.selectedDisk = null;
			$this.draw();
		}
		if (e.which === 27) {
			$this.selectedDisk = null;
			$this.action = null;
			$("#contextMenu").hide();
			$this.draw();
		}
	};

	/**
	 * 
	 * @param {Point}
	 *            tableClickPoint table point
	 * @param {number}
	 *            mouseButton
	 */
	this.mouseClickHandler = function(tableClickPoint, mouseButton) {
		// console.log("TableUI.mouseClickHandler");

		// only react to left clicks when not moving the mouse
		if (mouseButton !== 1 || $this.mousemove) {
			$this.mousemove = false;
			return;
		}

		var clickedDisk = $this.selectDisk(tableClickPoint);

		// click during JOIN or REINFORCEMENTS
		if (($this.table.getSegment() === "JOIN" || $this.table.getSegment() === "REINFORCEMENTS")
				&& $this.selectedDisk !== null && $this.action === "REINFORCE") {
			// save the position
			$this.saveReinforcement($this.selectedDisk);
		}

		// click during ACTIVATION and if there is a selected disk
		else if ($this.table.getSegment() === "ACTIVATION"
				&& $this.table.getCurrentPlayer() === $this.currentPlayer
				&& $this.selectedDisk !== null && $this.action === "MOVE") {
			// move
			$this.move($this.selectedDisk, tableClickPoint);
		}

		// click during MISSILE
		else if ($this.table.getSegment() === "MISSILE"
				&& $this.table.getCurrentPlayer() === $this.currentPlayer
				&& $this.selectedDisk !== null) {
			// console.log('shooting something');
			if ($this.action === "ARROW") {
				// console.log('ARROW');
				// get arrow disk
				$this.fireMissiles($this.selectedDisk, tableClickPoint, {
					"name" : "Arrow",
					'type' : 'missile',
					"attack" : 2,
					"diameter" : 0.625
				});
			}
			if ($this.action === "BOLT") {
				// console.log('BOLT');
				$this.fireMissiles($this.selectedDisk, tableClickPoint, 'Bolt');
			}
			if ($this.action === "FIREBALL") {
				// console.log('FIREBALL');
				$this.fireMissiles($this.selectedDisk, tableClickPoint,
						'Fireball');
			}
			if ($this.action === "BOULDER") {
				// console.log('BOULDER');
				$this.fireMissiles($this.selectedDisk, tableClickPoint,
						'Boulder');
			}
		}

		// click during COMBAT
		else if ($this.table.getSegment() === "COMBAT"
				// and a disk has just been clicked on
				&& clickedDisk !== null
				// and one of the current player's disks is already selected
				&& $this.selectedDisk !== null
				// and the previously selecte disk is the current player's disk
				&& $this.table.getDiskInfo($this.selectedDisk).mementoInfo.player === $this.currentPlayer
				// and the disk just clicked on is an enemy disk
				&& $this.table.getDiskInfo(clickedDisk).mementoInfo.player !== $this.currentPlayer
				// and the action is attack
				&& (($this.action === "SELECT_ATTACKEE" && $this.table
						.getDiskInfo($this.selectedDisk).mementoInfo.pinning
						.indexOf(clickedDisk) > -1) ||
				// or the action is defend
				($this.action === "SELECT_DEFENDEE" && $this.table
						.getDiskInfo($this.selectedDisk).mementoInfo.pinnedBy
						.indexOf(parseInt(clickedDisk, 10)) > -1))) {

			// if the first disk is attacking the second disk
			if ($this.action === "SELECT_ATTACKEE"
					&& $this.table.getDiskInfo($this.selectedDisk).mementoInfo.pinning
							.indexOf(clickedDisk) > -1) {
				// then tell the server which disk is being attacked
				$this.setAttackee($this.selectedDisk, clickedDisk);
			}
			// if the second disk is attacking the first disk,
			// ie, the first disk is defending against the second disk
			else if ($this.action === "SELECT_DEFENDEE"
					&& $this.table.getDiskInfo($this.selectedDisk).mementoInfo.pinnedBy
							.indexOf(parseInt(clickedDisk, 10)) > -1) {
				// then tell the server which disk is being defended against
				$this.setDefendee($this.selectedDisk, clickedDisk);
			}
		}

		// otherwise(no previously selected disks)
		else {
			// then select it
			$this.action = null;
			$this.selectedDisk = clickedDisk;
			$this.contextMenu($this.getScreenLocation(tableClickPoint.x,
					tableClickPoint.y));
		}

		$this.draw();
		$this.drawMovement();
	};

	/**
	 * @param {Point}
	 *            tablePoint table point
	 * @param {number}
	 *            mouseButton
	 * @param {MouseEvent}
	 *            event optional
	 */
	this.mouseDownHandler = function(tablePoint, mouseButton, event) {
		// console.log("TableUI.mouseDownHandler");

		// $this.pressedMouseButton = mouseButton;
		$this.lastMouseEvent = event;
		$this.mousedown = true;
		$(container).css('cursor', 'all-scroll');

		// right click
		if (event.which === 3) {

			$this.selectedDisk = null;
			$this.action = null;
		}

		$this.draw();
		$this.drawMovement();
	};

	/**
	 * @param {Point}
	 *            screenLocation screen location of mouse
	 * @param {Event}
	 *            event
	 */
	this._mouseMoveHandler = function(screenLocation, event) {
		// console.log("TableUI._mouseMoveHandler");

		$this.mouseScreenLocation = screenLocation;

		// move the offset
		$this.mouseMoveHandler.call(this, event);
		// this.draw();

		var hoveredDisk = $this.selectDisk($this.getTableLocation(
				screenLocation.x, screenLocation.y));

		if (hoveredDisk === null) {
			$this.tooltipsCtx.canvas.height = $($this.container).height();
			$this.tooltipsCtx.canvas.width = $($this.container).width();
		}

		// if there is no selected disk, and we are not sliding the table, and
		// we are over a disk, switch to the click pointer
		if ($this.selectedDisk === null && event.which === 0
				&& hoveredDisk !== null) {
			$(container).css("cursor", "pointer");

			// draw the disk on top of everything
			$this.tooltipsCtx.canvas.height = $($this.container).height();
			$this.tooltipsCtx.canvas.width = $($this.container).width();

		} else if ($(container).css("cursor") === "pointer") {
			$(container).css("cursor", "auto");
		}

		// if this player is allowed to move reinforcement disks
		if ($this.table.canReinforce($this.currentPlayer, $this.selectedDisk)
				&& $this.action === "REINFORCE") {

			var location = $this.getReinforcementLocation($this.selectedDisk,
					$this.getTableLocation(screenLocation.x, screenLocation.y));

			$this.table.getDiskInfo($this.selectedDisk).mementoInfo.location = location;

			$this.draw();

		} else if ($this.table.getSegment() === "ACTIVATION"
				&& $this.selectedDisk !== null) {

			$this.draw();
			$this.drawMovement();
		}

		else if ($this.action === "SELECT_ATTACKEE"
				|| $this.action === "SELECT_DEFENDEE") {
			$this.draw();
		}

		else if ($this.table.getSegment() === "MISSILE"
				&& ($this.action === "ARROW" || $this.action === "BOLT"
						|| $this.action === "FIREBALL" || $this.action === "BOULDER")) {
			// console.log('mousemove missile draw');
			$this.drawMovement();
		}
	};

	this._mouseScrollHandler = function(event) {
		$this.mouseScrollHandler(event);
		$this.drawMovement();
	};

	/**
	 * @param {Point}
	 *            tablePoint table point
	 * @param {number}
	 *            mouseButton
	 */
	this.mouseUpHandler = function(tablePoint, mouseButton) {
		// console.log("TableUI.mouseUpHandler");

		$this.lastMouseEvent = null;
		$this.mousedown = false;
		$(container).css('cursor', 'auto');
	};

	this.fireMissiles = function(diskIndex, tablePoint, missile) {

		$this.table.fireMissiles($this.currentPlayer, diskIndex, tablePoint,
				missile);

		// if the disk is now activated, deselect it
		if ($this.table.getDiskInfo(diskIndex).mementoInfo.activated) {
			$this.selectedDisk = null;
			$this.action = null;
		}

		$this.mementoId = null;

		// optimistic update
		$this.update({
			"user" : $this.currentPlayer,
			"table" : $this.table
		});

		$this.api.fireMissiles($this.table.getId(), diskIndex, missile.name,
				tablePoint, $this.onSuccess, $this.onError);
	};

	this.move = function(diskIndex, tableClickPoint) {
		// console.log('TableUI.move');

		// do the move on the client while we wait for the ajax to finish
		// var moveResult =
		$this.table.move($this.currentPlayer, diskIndex, tableClickPoint);

		// if the disk is now activated, deselect it
		if ($this.table.getDiskInfo(diskIndex).mementoInfo.activated) {
			$this.selectedDisk = null;
			$this.action = null;
		}

		$this.mementoId = null;

		// optimistic update
		$this.update({
			"user" : $this.currentPlayer,
			"table" : $this.table
		});

		$this.api.move($this.table.getId(), diskIndex, tableClickPoint,
				$this.onSuccess, $this.onError);

	};

	this.onError = function(result) {
		console.log('TableUI.onError');
		// handle a server error: throw away optimistic updates on the client

		var lastMementoId = $this.api.getLastMementoId($this.table.getId());
		var lastMemento = $this.api.getMemento($this.table.getId(),
				lastMementoId);

		// console.log($this.table.mementoId);
		// console.log(lastMementoId);

		$this.table.mementoId = lastMementoId;
		$this.table.memento = lastMemento;
		delete $this.table.mementos[lastMementoId];

		if ($this.initialized) {
			$this.update({
				'user' : $this.currentPlayer,
				"table" : $this.table
			});
		}
		// console.log(result);
		// throw result;
		// restart the polling
		setTimeout(function() {
			$this.api.getTable($this.table.getId(), $this.onSuccess,
					$this.onError, REFRESH_DELAY);
		}, REFRESH_DELAY);
	};

	/*
	 * saves who the logged in user is, saves mementos to local storage,
	 * continues remote polling
	 */
	this.onSuccess = function(result) {
		// console.log('TableUI.onSuccess');
		// console.log(result);

		$this.player.update(result.player);

		if (typeof result.table == "undefined"
				|| typeof result.table.id == "undefined") {
			console.log('figure out how we lost track of the table id');
		}

		// save the mementos
		$this.api.saveMementos(result.table.id, result.table.mementos);

		// save the most recent memento
		var a = {};
		a[result.table.mementoId] = result.table.memento;
		$this.api.saveMementos(result.table.id, a);

		// console.log($this.mementoId);
		// console.log($this.table.mementoId);
		// console.log(result.table.mementoId);

		// continue the polling
		clearTimeout($this.api.timeoutID);
		$this.api.timeoutID = null;

		// console.log(api.getMemento($this.table.getId(),
		// $this.table.mementoId).segment);
		// console.log($this.table);
		// console.log($this.table.SEGMENT.FINISHED);

		// only if the game isn't over
		if (api.getMemento($this.table.getId(), $this.table.mementoId).segment != $this.table.SEGMENT.FINISHED) {
			$this.api.timeoutID = setTimeout(function() {
				$this.api.getTable($this.table.getId(), $this.onSuccess,
						$this.onError);
			}, REFRESH_DELAY);
		}
	};

	this.pausePlayback = function() {
		$this.mode = MODE.PAUSE;
	};

	this.startPlayback = function() {
		// cancel any current playback pump
		$this.stopPlayback();
		$this.mode = MODE.PLAY;

		$this.playbackTimeoutID = setTimeout(function() {
			$this.displayNextMemento();
		}, 2000);
	};

	// TODO
	this.displayNextMemento = function() {
		if ($this.initialized) {
			return;
		}
		// if we're not already at the last memento
		if ($this.table.mementoId !== $this.mementoId) {
			// restore the next memento
			$this.table.restore($this.api.getMemento($this.table.getId(),
					$this.mementoId + 1));
			// display it
			$this.update({});
			// pause
			$this.playbackTimeoutID = setTimeout(function() {
				$this.displayNextMemento();
			}, $this.REFRESH_DELAY);
		}
	};

	this.stopPlayback = function() {
		$this.mode = MODE.STOP;
		clearTimeout($this.playbackTimeoutID);
	};

	/**
	 * @param {Point}
	 *            tablePoint
	 * @param {{disk:Disk,mementoInfo:{location:Point}}}
	 *            diskInfo
	 * @return
	 */
	this.pointOnDisk = function(tablePoint, diskInfo) {
		var distance = Math.sqrt(Math.pow(diskInfo.mementoInfo.location.x
				- tablePoint.x, 2)
				+ Math.pow(diskInfo.mementoInfo.location.y - tablePoint.y, 2));
		if (distance <= diskInfo.disk.diameter / 2) {
			return true;
		}
		return false;
	};

	/**
	 * persists the placement of reinforcements
	 * 
	 * @param diskNumber
	 */
	this.saveReinforcement = function(diskNumber) {
		// console.log("TableUI.saveReinforcment");

		$this.table.saveReinforcement($this.currentPlayer, diskNumber,
				$this.table.getDiskInfo(diskNumber).mementoInfo.location);
		$this.mementoId = null;

		// optimistic update
		$this.update({
			"user" : $this.currentPlayer,
			"table" : $this.table
		});

		$this.api.saveReinforcement($this.table.getId(), diskNumber,
				$this.table.getDiskInfo(diskNumber).mementoInfo.location,
				$this.onSuccess, $this.onError);

		$this.selectedDisk = null;
		$this.action = null;

	};

	/**
	 * select the disk at the given point.
	 * 
	 * @param {Point}
	 *            tablePoint table point
	 * @return {?number}
	 */
	this.selectDisk = function(tablePoint) {
		// console.log("this.selectDisk");
		var clickedDisks = [];

		$this.table.getDiskNumbers().forEach(
				function(diskNumber) {

					// if the disk is at this point
					if ($this.pointOnDisk(tablePoint, $this.table
							.getDiskInfo(diskNumber))) {
						clickedDisks.push(diskNumber);
					}
				});

		if (clickedDisks.length === 0) {
			return null;
		} else if (clickedDisks.length === 1) {
			return clickedDisks[0];
		} else {
			return $this.table.getTopDisks(clickedDisks)[0];
		}

	};

	/**
	 * select the disk at the given point. do not select a disk that is not
	 * movable, ie. already activated or pinned
	 * 
	 * @param {Point}
	 *            tablePoint table point
	 * @return {?number}
	 */
	this.selectMovableDisk = function(tablePoint) {
		// console.log("this.selectDisk");
		var clickedDisks = [];
		$this.table.getDiskNumbers().forEach(
				function(diskNumber) {
					var diskInfo = $this.table.getDiskInfo(diskNumber);
					// if its the current player's disk, and the disk is not
					// activated,
					// and the disk is not pinned, and the disk is at this point
					if (diskInfo.mementoInfo.player === $this.currentPlayer
							&& !diskInfo.mementoInfo.activated
							&& diskInfo.mementoInfo.pinnedBy.length === 0
							&& $this.pointOnDisk(tablePoint, diskInfo)) {
						clickedDisks.push(diskNumber);
					}
				});

		if (clickedDisks.length === 0) {
			return null;
		} else if (clickedDisks.length === 1) {
			return clickedDisks[0];
		} else {
			return $this.table.getTopDisks(clickedDisks)[0];
		}

	};

	/**
	 * updates the slider's max, updates the loading icon, updates board info,
	 * updates navigation links, updates current player
	 * 
	 * @param {{user}}
	 *            result
	 */
	this.update = function(result) {
		console.log('TableUI.update');
		console.log(result);

		// TODO take into account the playback mode

		console.log('ui mementoId:' + $this.mementoId);
		console.log('table mementoId:' + $this.table.mementoId);

		// get the ui's mementoId
		var mementoId = $this.mementoId;
		// if the ui doesn't know what mementoId to use
		if (mementoId === null) {
			// use the table's most recent mementoId
			mementoId = $this.table.mementoId;
		}

		// if the table is at a different memementoId

		if (mementoId !== $this.table.mementoId) {
			// restore the ui's mementoId
			console.log('restored mementoId:' + mementoId);
			$this.table.restoreMemento($this.api.getMemento(
					$this.table.getId(), mementoId));
		}

		// update slider
		console.log($this.table.mementoId);
		$("#slider").slider({
			// "min" : 0,
			"max" : $this.table.mementoId,
			"value" : mementoId
		});

		// show how long ago the board was updated,
		// maybe as a tooltip on the reload icon
		$("#loading, #refresh").attr("title",
				"Last Updated\n" + new Date().toLocaleString());

		$this.currentPlayer = result.user;

		if (!$this.initialized) {
			$this.init();
		}

		// $this.displayHints();

		$this.displayBoardInfo();

		if (result.user) {
			// console.log(result.user);
			// console.log($this.currentPlayer);
			$this.updateLinks();
		}

		// if the player is in the middle of placing a reinforcement disk
		if ($this.action === "REINFORCE") {
			// reposition the in-motion reinforcement disk
			$this.table.getDiskInfo($this.selectedDisk).mementoInfo.location = $this
					.getReinforcementLocation($this.selectedDisk, $this
							.getTableLocation($this.mouseScreenLocation.x,
									$this.mouseScreenLocation.y));
		}

		$this.draw();
		$this.drawMovement();

	};

	this.getReinforcementLocation = function(diskNumber, tableLocation) {

		var stagingDisk = $this.table.getStagingDisk($this.currentPlayer);

		var a = parseFloat(stagingDisk.disk.diameter) / 2
				+ parseFloat($this.table.getDiskInfo(diskNumber).disk.diameter)
				/ 2;
		// var b = tableLocation.distance(stagingDisk.location);
		// console.log(a);
		// console.log(b);
		// var distance = Math.min(a, b);

		// console.log(distance);

		// var location = new Point(stagingDisk.location.x,
		// stagingDisk.location.y).getEdge(tableLocation, distance);
		// console.log(JSON.stringify(location));

		return $this.table.getPointInsideCircle(new Point(
				stagingDisk.location.x, stagingDisk.location.y), a,
				tableLocation);
		// return location;
	};
}