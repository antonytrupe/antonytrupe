goog.provide('com.antonytrupe.tend.BoardUI');

goog.require('com.antonytrupe.tend.Point');
goog.require('com.antonytrupe.tend.Player');

function BoardUI(p_board, p_api, p_elementSelector) {
	"use strict";
	var $this = this;

	$this.gridCtx = null;
	$this.settlementsCtx = null;
	$this.resourcesCtx = null;
	$this.toolTipCtx = null;
	$this.size = 32;
	$this.board = p_board;
	$this.api = p_api;
	$this.drawnEdges = null;
	$this.currentPlayerName = null;
	$this.activePoint = null;
	$this.activeResource = null;
	$this.activeSettlement = null;

	$this.resource_card = null;

	if ($(p_elementSelector).length === 0) {
		//
		p_elementSelector = 'body';
	}

	var static_path = "/static/tend/";
	// var static = "/hex/static/";

	$.get(static_path + "resource_card.html", function(data) {
		$this.resource_card = $(data);
		console.log($this.resource_card);
	});

	console.log($(p_elementSelector));

	$(p_elementSelector).load(static_path + "board.html", function(req) {
		console.log(req);
		$this.gridCtx = document.getElementById("grid").getContext('2d');
		$this.settlementsCtx = document.getElementById("settlements").getContext('2d');
		$this.resourcesCtx = document.getElementById("resources").getContext('2d');
		$this.toolTipCtx = document.getElementById("toolTip").getContext('2d');

		// attach the click handler to the canvas container
		$('#board').click(function(v) {
			// console.log(v);
			$this.clickHandler(Point.fromXY(v.offsetX, v.offsetY, $this.size));
		});

		// attach click handler to end_turn button
		$('#end_turn').click($this.endTurn);

		// attach a click handler to the list boards url
		$('#list_games').click($this.listGamesClickHandler);

		// attach a click handler to the play button
		$('#play').click($this.joinBoard);

		// attach click handlers to the build buttons
		$("#actions #build button").click(function() {
			// console.log(this);
			$this.queueSettlement($(this).parent().attr("id"));
		});

		// attack click handlers to the collapsible thingies
		$(".collapsible.header").click(function() {
			// only get the most direct child, not all children
			$(".collapsible.content:first", $($this).parent()).toggleClass("collapsed");
			$(".collapsible .icon:first", $($this).parent()).toggleClass("collapse");
			$(".collapsible .icon:first", $($this).parent()).toggleClass("expand");
			// console.log($(".foo", $(this).parent()));
		});

		// attach click handlers to the zoom widgets
		$('#bigger').click(function() {
			$this.resize(1);
		});
		$('#smaller').click(function() {
			$this.resize(-1);
		});

		$('#tip').click(function() {
			$this.tip();
		});

	});

	// more tips
	$this.tips = {
		1 : {
			'message' : function() {
				return 'Click Play to start playing.';
			},
			'success' : function() {
				return "Welcome " + $this.currentPlayerName + "!";
			},
			'condition' : function() {
				// return true of this tip can be skipped
				return $this.currentPlayerName && $this.board.players[$this.currentPlayerName];
				//
			}
		},
		2 : {
			'message' : function() {
				return 'Click on the map to see what options you have.';
			},
			'success' : function() {
				return "Clicky Clicky!";
			},
			'condition' : function() {
				return $this.activePoint;
				//
			}
		}
	};

	$this.endTurn = function() {
		// clear selected resources after a user action
		$this.clearResources();
		$this.api.endTurn($this.board.id, [ $this.board.update, $this.update ], [ $this.debug ]);
	};

	$this.queueSettlement = function(settlementName) {
		// clear selected resources after a user action
		$this.clearResources();
		$this.api.queueSettlement($this.board.id, $this.activeSettlement, settlementName, $this.getSelectedResources(), [ $this.board.update, $this.update ],
				[ $this.debug ]);
	};

	$this.tip = function(tid) {
		// console.log('BoardUI.tip');

		var lastTipId = tid;
		// console.log(lastTipId);
		if (lastTipId === undefined) {
			lastTipId = 0;
		}
		// console.log(lastTipId);
		// get the last tip number we showed this player
		// var lastTipId = parseInt(localStorage.getItem('lastTipId') || 0, 10);
		// lastTipId = 0;

		// get the next tip
		var tip = $this.tips[lastTipId + 1];
		// console.log(tip);
		if (!tip) {
			alert("You have learned all I can teach you.");
		} else if (!tip.condition()) {
			//
			alert(tip.message());
		} else {
			alert(tip.success());
			// localStorage.setItem('lastTipId', lastTipId + 1);
			$this.tip(lastTipId + 1);
		}
	};

	$this.loading = function(loading) {
		//
		if (loading) {
			$("body").css("cursor", "progress");
		} else {
			$("body").css("cursor", "auto");
		}
	};

	$this.resize = function(delta) {
		$this.size += delta;
		// console.log($this.size);
		$this.drawCanvas();
	};

	$this.joinBoard = function() {
		$this.api.joinBoard($this.board.getId());
	};

	$this.debug = function(message) {
		var textElement = $('#debug');
		if (textElement.html() !== "") {
			textElement.append($('<br />'));
		}
		if (typeof message === "object") {
			message = JSON.stringify(message);
		}
		textElement.append($("<span>").text(message));
		// console.log(message);
	};

	function listGamesClickHandler(v) {
		// decide if we need to do the api call, or hide the list
		var el = $("#games");

		if (el.style.display === "none" || el.style.display === null) {
			el.style.display = "block";
			$this.api.listBoards($this.listBoards, null);
		} else {
			el.style.display = "none";
			window.history.back();
		}
	}

	$this.listBoards = function(result) {
		var el = $("#games");
		el.empty();
		// el.style.display="";

		$.each(result.boards, function(index, board) {
			// console.log(board);
			// console.log(board);
			var li = $("<li>");
			var a = $("<a>");
			a.attr("href", "#" + board.id);
			// a.attr("href", "");
			// a.attr("onclick", "return false;");

			a.click(function(v) {
				$this.gameClickHandler(board.id);
			});
			li.append(a);
			// li.append(a);
			a.text("Board " + board.id + " is " + board.disposition + ", in turn " + board.turn);
			el.append(li);
			// $("body").css('cursor', 'auto');

		});
	};

	$this.gameClickHandler = function(id) {
		window.history.pushState(null, "Game $id", "#$id");
	};

	$this.getHashId = function() {
		return window.location.hash.replace("#", "");
	};

	// helper method
	$this.clickHandler = function(point, event) {
		// console.log('BoardUI.clickHandler');
		// only if it's a valid point on the grid
		// console.log(point);
		// console.log($this.board);

		if ($this.board.edges && ($this.board.edges[point.stringify()] || $this.board.resourceGroups[point.stringify()])) {

			$this.activePoint = point;
			$this.debug(point);
			if ($this.currentPlayerName && point.isCenter()) {
				$this.activeResource = point;
			} else if ($this.currentPlayerName) {
				$this.activeSettlement = point;
			}

			$this.drawActivePoints();

			// updateLocationInfo();

			$this.toggleActions();
		}
	};

	$this.toggleActions = function() {
		// console.log($this.activeSettlement);
		// console.log($this.activeResource);
		// console.log($this.activePoint);

		var actions = $this.board.getActions({
			"player" : $this.board.players[$this.currentPlayerName],
			'resourcePoint' : $this.activeResource,
			'settlementPoint' : $this.activeSettlement,
			"resources" : $this.getSelectedResources()
		});
		// end_turn
		if (actions.end_turn) {
			$("#actions #end_turn button").removeAttr("disabled");
		} else {
			$("#actions #end_turn button").attr("disabled", "disabled");
		}

		// build actions
		$("#actions #build button").text(actions.build.to.name);
		if (actions.build.canBuild) {
			$("#actions #build button").removeAttr("disabled");
		} else {
			$("#actions #build button").attr("disabled", "disabled");
		}

		// collect actions
		$.each(actions.collect, function(k, v) {
			// k is resource level: level_1, level_2, level_3
			if (v) {
				$("#actions #collect ." + k + " button").removeAttr("disabled");
			} else {
				// disable action
				$("#actions #collect ." + k + " button").attr("disabled", "disabled");
				// show the message
				$("#actions #collect ." + k + " span").attr("tooltip", actions.messages[k]);
			}
		});
	};

	$this.getSelectedResources = function() {
		// console.log('BoardUI.getSelectedResources');
		var resources = {};
		$("#resourceList li").each(function(i, li) {
			// console.log(i);
			// console.log(li);
			// console.log($(li).data());
			resources[$(li).data().name] = $(".card.selected", li).length;
			// console.log($(".card.selected", li));
			// console.log($(".card.selected", li).length);
		});
		// console.log(resources);
		return resources;
	};

	$this.drawActivePoints = function() {
		// console.log('BoardUI.drawActivePoints');

		$this.toolTipCtx.canvas.width = $this.toolTipCtx.canvas.width;
		// highlight the selected point
		if ($this.activePoint) {
			$this.toolTipCtx.beginPath();
			$this.toolTipCtx.strokeStyle = "black";
			$this.toolTipCtx.lineWidth = 2;
			$this.toolTipCtx.arc($this.activePoint.x($this.size), $this.activePoint.y($this.size), $this.size, 0, Math.PI * 2, true);
			$this.toolTipCtx.closePath();
			$this.toolTipCtx.stroke();
		}

		// highlight the selected point
		if ($this.activeSettlement) {
			$this.toolTipCtx.beginPath();
			$this.toolTipCtx.strokeStyle = "black";
			$this.toolTipCtx.lineWidth = 1;
			$this.toolTipCtx.arc($this.activeSettlement.x($this.size), $this.activeSettlement.y($this.size), $this.size, 0, Math.PI * 2, true);
			$this.toolTipCtx.closePath();
			$this.toolTipCtx.stroke();
		}

		// highlight the selected point
		if ($this.board.activeResource) {
			$this.toolTipCtx.beginPath();
			$this.toolTipCtx.strokeStyle = "black";
			$this.toolTipCtx.lineWidth = 1;
			$this.toolTipCtx.arc($this.activeResource.x($this.size), $this.activeResource.y($this.size), $this.size, 0, Math.PI * 2, true);
			$this.toolTipCtx.closePath();
			$this.toolTipCtx.stroke();
		}
	};

	$this.update = function(result) {
		// console.log(result.board);
		$this.currentPlayerName = result.user;
		$this.draw();
		// make sure the hash is right
		if (result.board !== "undefined" && result.board && result.board.id !== "undefined") {
			if (window.location.hash !== result.board.id) {
				window.location.hash = result.board.id;
			}
		}
	};

	$this.clearResources = function() {
		$this.resourcesCtx.canvas.width = $this.resourcesCtx.canvas.width;
	};

	$this.drawResourceTile = function(point, resource) {

		// color the tile
		// $this.resourcesCtx.fillStyle = resource["color"];

		var radgrad = $this.resourcesCtx.createRadialGradient(point.x($this.size), point.y($this.size), 0, point.x($this.size), point.y($this.size),
				$this.size * 2);
		radgrad.addColorStop(0, resource.color);
		radgrad.addColorStop(0.66, resource.color);
		radgrad.addColorStop(1, '000');

		$this.resourcesCtx.fillStyle = radgrad;

		$this.resourcesCtx.beginPath();
		$this.resourcesCtx.moveTo(point.ne().x($this.size), point.ne().y($this.size));
		$this.resourcesCtx.lineTo(point.e().x($this.size), point.e().y($this.size));
		$this.resourcesCtx.lineTo(point.se().x($this.size), point.se().y($this.size));
		$this.resourcesCtx.lineTo(point.sw().x($this.size), point.sw().y($this.size));
		$this.resourcesCtx.lineTo(point.w().x($this.size), point.w().y($this.size));
		$this.resourcesCtx.lineTo(point.nw().x($this.size), point.nw().y($this.size));

		$this.resourcesCtx.closePath();
		$this.resourcesCtx.fill();
	};

	$this.drawResources = function() {
		// console.log("BoardUI.drawResources");
		$this.clearResources();

		// console.log($this.board.resourceGroups);

		$.each($this.board.resourceGroups, function(pString, resource) {
			// console.log(resource);
			var p = JSON.parse(pString);
			var point = new com.antonytrupe.tend.Point(p.r, p.g, p.b);
			$this.drawResourceTile(point, resource);

			// console.log($this.board.resourceGroups);
			// console.log($this.board.populationLimits);

			$this.print($this.resourcesCtx, resource.name
			// + "\n" + $this.board.populationLimits[pString]
			, point.x($this.size), point.y($this.size), {
				'textAlign' : 'center',
				'textBaseline' : 'middle',
				// 'fillStyle' : this.resourceGroups[i].color,
				'fillStyle' : "black",
				'font' : '700 14px OpenBaskerville'
			});

		});
	};

	$this.clearGrid = function() {
		$this.drawnEdges = [];
		$this.gridCtx.canvas.width = $this.gridCtx.canvas.width;
	};

	$this.getDimensions = function() {
		var x = 0;
		var y = 0;
		$.each($this.board.edges, function(i, v) {
			var p = i;
			if (typeof p === 'string') {
				p = JSON.parse(p);
			}

			var point = new com.antonytrupe.tend.Point(p.r, p.g, p.b);
			if (point.x($this.size) > x) {
				x = point.x($this.size);

			}
			if (point.y($this.size) > y) {
				y = point.y($this.size);
			}
		});
		return {
			"width" : Math.round(x + 2),
			"height" : Math.round(y + 2)
		};
	};

	$this.drawGrid = function() {
		// console.log('BoardUI.drawGrid');
		$this.clearGrid();

		// console.log($this.board.edges);

		$.each($this.board.edges, function(start, ends) {
			$.each(ends, function(end, v) {
				$this.drawEdge(start, end);
			});
		});
	};

	$this.drawEdge = function(startString, endString) {
		// console.log('BoardUI.drawEdge');
		var startJson = JSON.parse(startString);
		var endJson = JSON.parse(endString);
		var start = new com.antonytrupe.tend.Point(startJson.r, startJson.g, startJson.b);
		var end = new com.antonytrupe.tend.Point(endJson.r, endJson.g, endJson.b);

		if (!$this.drawnEdges[startString] || !$this.drawnEdges[startString][endString]) {
			if (!$this.drawnEdges[startString]) {
				$this.drawnEdges[startString] = {};
			}
			if (!$this.drawnEdges[endString]) {
				$this.drawnEdges[endString] = {};
			}
			$this.drawnEdges[startString][endString] = true;
			$this.drawnEdges[endString][startString] = true;
			$this.gridCtx.beginPath();
			$this.gridCtx.moveTo(start.x($this.size), start.y($this.size));
			$this.gridCtx.lineTo(end.x($this.size), end.y($this.size));

			$this.gridCtx.closePath();
			$this.gridCtx.stroke();
		}
	};

	$this.drawCanvas = function() {
		// shrink the canvas's to their minimal size
		var dimensions = $this.getDimensions();

		$("#board").css('width', dimensions.width + 'px');
		$("#board").css('height', dimensions.height + 'px');

		// gridCtx is undefined in tests
		$this.gridCtx.canvas.height = dimensions.height;
		$this.gridCtx.canvas.width = dimensions.width;

		$this.settlementsCtx.canvas.height = dimensions.height;
		$this.settlementsCtx.canvas.width = dimensions.width;

		$this.resourcesCtx.canvas.height = dimensions.height;
		$this.resourcesCtx.canvas.width = dimensions.width;

		$this.toolTipCtx.canvas.height = dimensions.height;
		$this.toolTipCtx.canvas.width = dimensions.width;

		$this.drawSettlements();

		$this.drawResources();
		// drawGrid after resources to get the edges on top
		$this.drawGrid();

		$this.drawActivePoints();
	};

	$this.draw = function() {
		$this.drawCanvas();

		// setUpTradeSelects needs to be called before showCurrentPlayer
		// this.setUpTradeSelects();
		// showCurrentPlayer needs to be called after setUpTradeSelects
		$this.showPlayerInfo($this.currentPlayerName);
		$this.showPlayers($this.board.playersSorted, $this.board.players);
		$this.toggleActions();

		// this.showTurnTimer();
		// $("#id").text(this.id);
		// show points needed to win
		// $("#points_to_win").text(this.pointsToWin);
		// show the disposition of the current board
		// $("#disposition").text(this.disposition);
		// show the current boards turn
		// $("#turn").text(this.turn);

	};

	$this.showPlayers = function(sorted, players) {
		//
		$("#playerList").empty();
		$.each(sorted, function(i, playerName) {
			//
			var player = new com.antonytrupe.tend.Player(players[playerName]);
			// console.log(i);
			// console.log(playerName);
			var li = $("<li>");
			// players[playerName].getScore() + ":" +
			li.text(player.getScore() + ":" + playerName);
			if (playerName === $this.currentPlayerName) {
				li.css('font-weight', 'bold');
			}
			$("#playerList").append(li);
		});
	};

	$this.showPlayerInfo = function(playerName) {
		//
		// console.log(playerName);
		// console.log($this.board.players);
		// console.log($this.board.players[playerName]);
		if (playerName !== "" && $this.board.players[playerName]) {
			$this.showResources($this.board.players[playerName].resources);
		}
	};

	$this.showResources = function(resources) {
		// console.log(resources);
		// preserve selected resources between reloads
		var selected = $this.getSelectedResources();
		// console.log(selected);
		$("#resourceList").empty();
		$.each(resources, function(k, v) {
			//
			// console.log(k);
			// console.log(Resource[k]);

			var li = $("<li>");
			li.addClass(Resource[k].name);
			li.data("name", Resource[k].name);
			var c = $this.resource_card.clone();

			// set the name
			$(".name", c).text(Resource[k].name);
			// set the category
			$(".category", c).text(Resource[k].category.name);
			// console.log(Resource[k]);
			// set the basevalue
			$(".baseValue", c).text(Resource[k].baseValue);
			// set the z-index
			c.css("z-index", v);
			var i;
			for (i = 1; i <= 10; i++) {
				// console.log($(".value.value_" + i, c));
				$(".value.value_" + i, c).text(Resource[k].getValue(i));
			}

			// bold the correct value
			$(".value.value_" + v, c).css("font-weight", "900");
			$(".value.value_" + v, c).css("font-variant", "small-caps");

			// select
			if (selected[Resource[k].name] >= 1) {
				c.addClass('selected');
			} else {
				c.removeClass('selected');
			}

			// add to the dom
			$("#resourceList").append(li.append(c));

			// attach click handler
			// this doesn't work when triggered from test cases
			c.click($this.toggleResource);

			// console.log(v);
			// add the layered cards

			for (i = 2; i <= v; i++) {
				c = c.clone(true);
				// shift to the right
				c.css("left", (i - 1) * 16 + "px");
				// set the z index
				c.css("z-index", v - i);

				// select
				// console.log(selected[Resource[k].name]);
				// console.log(i);
				if (selected[Resource[k].name] >= i) {
					c.addClass('selected');
				} else {
					c.removeClass('selected');
				}

				// add to the dom
				li.append(c);
			}
		});
	};

	$this.toggleResource = function() {
		// console.log("BoardUI.toggleResource");
		// console.log(this);
		$(this).toggleClass("selected");
		$this.toggleActions();
	};

	$this.clearSettlements = function() {
		$this.settlementsCtx.canvas.width = $this.settlementsCtx.canvas.width;
	};

	$this.drawSettlements = function() {

		$this.clearSettlements();
		$.each($this.board.settlementLocations, function(k, v) {
			var p = k;
			if (typeof p === 'string') {
				p = JSON.parse(p);
			}
			var point = new com.antonytrupe.tend.Point(p.r, p.g, p.b);

			$this.settlementsCtx.beginPath();
			if ($this.currentPlayerName && $this.board.players[$this.currentPlayerName]
					&& $this.board.players[$this.currentPlayerName].settlements[point.stringify()]) {
				// put a black circle around the settlement
				$this.settlementsCtx.strokeStyle = "black";
				$this.settlementsCtx.arc(point.x($this.size), point.y($this.size), Settlement[v].level * $this.size / 8 + 1, 0, Math.PI * 2, true);
				$this.settlementsCtx.closePath();
				$this.settlementsCtx.fill();
			}

			$this.settlementsCtx.fillStyle = $this.board.players[$this.board.settlementOwnership[k]].color;

			// make the cities scale with the map
			$this.settlementsCtx.arc(point.x($this.size), point.y($this.size), Settlement[$this.board.settlementLocations[k]].level * $this.size / 8, 0,
					Math.PI * 2, true);
			$this.settlementsCtx.closePath();
			$this.settlementsCtx.fill();
		});

		// draw the current player's queued settlements
		if ($this.currentPlayerName && $this.board.players[$this.currentPlayerName] && $this.board.players[$this.currentPlayerName].queuedSettlements) {

			$.each($this.board.players[$this.currentPlayerName].queuedSettlements, function(p, s) {

				var pJson = JSON.parse(p);
				var point = new com.antonytrupe.tend.Point(pJson.r, pJson.g, pJson.b);
				$this.settlementsCtx.beginPath();
				// get player color
				// $this.settlementsCtx.strokeStyle =
				// $this.board.players[$this.currentPlayerName].color;
				$this.settlementsCtx.strokeStyle = "lightGrey";
				$this.settlementsCtx.lineWidth = 1.5;

				// make the cities scale with the map
				$this.settlementsCtx.arc(point.x($this.size), point.y($this.size), Settlement[s].level * $this.size / 8, 0, Math.PI * 2, true);

				$this.settlementsCtx.closePath();
				$this.settlementsCtx.stroke();
			});
		}
	};

	$this.print = function(ctx, t, x, y, o) {

		var options = $.extend({}, {
			'textAlign' : 'top',
			'textBaseline' : 'left',
			'fillStyle' : 'black',
			'font' : '14px Helvetica',
			'lineHeight' : 14,
			'fitWidth' : 300
		}, o);

		// var ctx = $this.toolTipCtx;
		ctx.font = options.font;
		ctx.fillStyle = options.fillStyle;
		ctx.textAlign = options.textAlign;
		ctx.textBaseline = options.textBaseline;

		var text = t.replace(/(\r\n|\n\r|\r|\n)/g, "\n");
		var sections = text.split("\n");

		var i, str, wordWidth, words, currentLine = 0;

		var printNextLine = function(str1) {
			ctx.fillText(str1, x, y + (options.lineHeight * currentLine));
			currentLine++;
			wordWidth = ctx.measureText(str1).width;
		};

		for (i = 0; i < sections.length; i++) {
			words = sections[i].split(' ');
			var index = 1;

			while (words.length > 0 && index <= words.length) {

				str = words.slice(0, index).join(' ');
				wordWidth = ctx.measureText(str).width;

				if (wordWidth > options.fitWidth) {
					if (index === 1) {
						// Falls to this case if the first word in words[]
						// is bigger than fitWidth
						// so we print this word on its own line; index = 2
						// because slice is
						str = words.slice(0, 1).join(' ');
						words = words.splice(1);
					} else {
						str = words.slice(0, index - 1).join(' ');
						words = words.splice(index - 1);
					}

					printNextLine(str);

					index = 1;
				} else {
					index++;
				}
			}

			// The left over words on the last line
			if (index > 0) {
				printNextLine(words.join(' '));
			}
		}
		// var maxHeight = options.lineHeight * (currentLine);
	};
}