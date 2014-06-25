goog.provide('com.antonytrupe.tend.Board');

goog.require('com.antonytrupe.tend.Point');
goog.require('com.antonytrupe.tend.Player');

function Board() {
	"use strict";
	var $this = this;

	$this.size = 32;
	$this.id = null;
	$this.edges = {};
	$this.settlementLocations = {};
	$this.settlementOwnership = {};
	$this.resourceGroups = {};
	$this.players = {};
	$this.playersSorted = [];
	$this.turnDuration = null;
	$this.turnStartedOn = null;
	$this.populationLimits = {};
	$this.turn = 0;
	$this.disposition = null;
	$this.pointsToWin = null;

	$this.getId = function() {
		return $this.id;
	};

	$this.setId = function(id) {
		$this.id = id;
	};

	$this.processSettlements = function() {
		Object.keys($this.playersSorted).forEach(function(i) {
			var playerName = $this.playersSorted[i];
			var player = $this.players[playerName];
			Object.keys(player.queuedSettlements).forEach(function(p) {
				var settlement = Settlement[player.queuedSettlements[p]];

				// console.log(p);
				var pJson = JSON.parse(p);
				var settlementPoint = new com.antonytrupe.tend.Point(pJson.r, pJson.g, pJson.b);
				// console.log(settlement);

				if ($this.canSettle(player, settlementPoint, settlement)
				// check resources
				&& $this.sufficientResources(Settlement[$this.settlementLocations[p]], settlement, player.queuedSettlementsResources[p])) {

					$this.settlementLocations[settlementPoint.stringify()] = settlement.name;
					$this.settlementOwnership[settlementPoint.stringify()] = player.name;

					player.settlements[settlementPoint.stringify()] = settlement.name;

				} else {
					// give the resources back,
					// or are they forever lost?
				}
				// remove queued
				// settlement/resources
				delete player.queuedSettlements[settlementPoint.stringify()];
				delete player.queuedSettlementsResources[settlementPoint.stringify()];

			});
		});
	};

	$this.join = function(username) {
		// make sure the player is not already in $this board
		if ($this.players[username] != null) {
			return $this.players[username];
		}
		var p = new com.antonytrupe.tend.Player({
			"name" : username
		});
		// FOOD
		p.addResources(Resource.WHEAT, 4);
		// p.addResources(Resource.GRAPES, 2);
		// CLOTHING
		p.addResources(Resource.FUR, 3);
		// p.addResources(Resource.FLEECE, 3);
		// CONSTRUCTION
		p.addResources(Resource.STONE, 4);
		// p.addResources(Resource.COPPER, 2);
		// LUXURY
		// p.addResources(Resource.SALT, 1);
		p.addResources(Resource.SILVER, 1);

		$this.players[username] = p;
		$this.playersSorted.push(username);
		return p;
	};

	$this.getActionMessages = function() {
		//
		return {};
	};

	/**
	 * @param {Player}
	 *            player
	 * @param {Point}
	 *            settlementPoint
	 * @param {Object}
	 *            resources
	 * @return {Object} .
	 */
	$this.getBuildActions = function(player, settlementPoint, resources) {
		var actions = {
			"to" : Settlement.NONE,
			"canBuild" : false,
			"messages" : []
		};

		var from = Settlement.NONE;
		if (settlementPoint && $this.settlementLocations[settlementPoint.stringify()]) {
			from = Settlement[$this.settlementLocations[settlementPoint.stringify()]];
		}

		actions.to = Settlement[from.level + 1];

		// console.log(from.level + 1);
		// console.log(Settlement[1]);

		// console.log(from);
		// console.log(actions.to);

		var sufficientResources = $this.sufficientResources(from, actions.to, resources);
		if (!sufficientResources) {
			actions.messages.push("You must select more resources before building.");
		}

		var canSettle = $this.canSettle(player, settlementPoint, Settlement.HAMLET);
		if (!canSettle) {
			actions.messages.push("You may not build here.");
		}

		actions.canBuild = canSettle && sufficientResources;

		return actions;
	};

	/**
	 * @param {String}
	 *            playerName
	 * @param {String}
	 *            settlementPoint
	 * @param {String}
	 *            settlementName
	 * @param {String}
	 *            r resources
	 * @return {Object}
	 */
	$this.queueSettlement = function(playerName, settlementPoint, settlementName, r) {
		var p = $this.players[playerName];

		// settlementPoint needs to be converted to a Point
		var point = Point.fromString(settlementPoint);
		// resources needs to be converted to an object
		var resources = JSON.parse(r);
		var canDo = $this.getBuildActions(playerName, point, resources);
		// console.log(canDo);
		// console.log(settlement.name);
		// console.log(canDo[settlement.name]);

		if (canDo.to.name === settlementName) {
			p.queueSettlement(point, Settlement[settlementName], resources);
		}
	};

	/**
	 * @param {Settlement}
	 *            from
	 * @param {Settlement}
	 *            to
	 * @param {Object}
	 *            resources
	 * @return {Object}
	 */
	$this.sufficientResources = function(from, to, resources) {
		if (from === undefined) {
			from = Settlement.NONE;
		}

		// group resources by category
		var cat = {};
		// $ is not defined on server
		Object.keys(resources).forEach(function(r) {
			var count = resources[r];

			// console.log(r);
			// console.log(count);
			var resource = Resource[r];
			// console.log(resource);
			if (cat[resource.category.name] === undefined) {
				cat[resource.category.name] = 0;
			}
			cat[resource.category.name] += resource.getValue(count);
			// console.log(cat[resource.name]);
		});
		// console.log(cat);
		var cost = from.getUpgradeCost(to);
		// console.log(cost);
		var foo = true;

		Object.keys(cost).forEach(function(category) {
			var c = cost[category];

			// console.log(category);
			// console.log(c);
			// console.log(cat[category]);
			if (c > 0 && (cat[category] === undefined || cat[category] < c)) {
				foo = false;
				return false;
			}
		});
		return foo;
	};

	/**
	 * @param {Player}
	 *            player
	 * @param {Point}
	 *            settlementPoint
	 * @param {Settlement}
	 *            settlement
	 * @return {boolean}
	 */
	$this.canSettle = function(player, settlementPoint, settlement) {
		if (!player || player === null) {
			return false;
		}
		if (settlementPoint === null) {
			return false;
		}
		var from = Settlement.NONE;
		if ($this.settlementLocations[settlementPoint.stringify()]) {
			from = Settlement[$this.settlementLocations[settlementPoint.stringify()]];
		}

		// check if someone else already built here
		if (from !== Settlement.NONE && $this.settlementOwnership[settlementPoint.stringify()] !== player.name) {
			return false;
		}

		// make sure its only a single step up
		if (from.level !== settlement.level - 1) {
			return false;
		}

		// holy crap, we can build/upgrade
		return true;
	};

	/**
	 * @param {Player}
	 *            player
	 * @param {Point}
	 *            settlementPoint
	 * @param {Point}
	 *            resourcePoint
	 * @return {Object}
	 */
	$this.getCollectActions = function(player, settlementPoint, resourcePoint) {
		var result = {
			"level_1" : $this.canCollect(player, settlementPoint, resourcePoint, 1),
			"level_2" : $this.canCollect(player, settlementPoint, resourcePoint, 2),
			"level_3" : $this.canCollect(player, settlementPoint, resourcePoint, 3)
		};
		// console.log(result);
		return result;
	};

	/**
	 * @param {Player}
	 *            player
	 * @param {Point}
	 *            settlementPoint
	 * @param {Point}
	 *            resourcePoint
	 * @param {number}
	 *            level 1 2 3
	 * @return {boolean}
	 */
	$this.canCollect = function(player, settlementPoint, resourcePoint, level) {
		if (settlementPoint === null || settlementPoint === undefined) {
			return false;
		}

		if (resourcePoint === null || resourcePoint === undefined) {
			return false;
		}

		// make sure it's a valid collect
		var result =
		// make sure the points are adjacent
		settlementPoint.isAdjacent(resourcePoint)
		// make sure the current player owns the city
		&& player.hasSettlement(settlementPoint)
		// make sure the city is big enough
		&& Settlement[$this.settlementLocations[settlementPoint.stringify()]].level >= level;
		// check to make sure $this settlement has enough points left
		// check to make sure $this player hasn't already collected $this
		// resource
		return result;
	};

	$this.endTurn = function() {
		//
		// console.log('Board.endTurn');
		$this.sortPlayers();
		$this.processSettlements();
		$this.turn++;
	};

	$this.sortPlayers = function() {
		$this.playersSorted.sort(function(one, two) {
			//
			return $this.players[two].getScore() - $this.players[one].getScore();
		});
	};

	/*
	 * options can contain the following properties: player, settlementPoint,
	 * resourcePoint, resources
	 */
	$this.getActions = function(options) {

		// console.log(options);

		return {
			'messages' : $this.getActionMessages(options),
			'build' : $this.getBuildActions(options.player, options.settlementPoint, options.resources),
			'collect' : $this.getCollectActions(options.player, options.settlementPoint, options.resourcePoint),
			'trade' : {},
			"end_turn" : true
		};

	};

	$this.stringify = function() {
		return JSON.stringify($this);
	};

	$this.addEdge = function(start, end) {
		if (!$this.edges[start.stringify()]) {
			// $this.edges.push(start.stringify());
			$this.edges[start.stringify()] = {};
		}
		if (!$this.edges[start.stringify()][end.stringify()]) {
			$this.edges[start.stringify()][end.stringify()] = true;
		}
		if (!$this.edges[end.stringify()]) {
			// $this.edges.push(end.stringify());
			$this.edges[end.stringify()] = {};
		}
		if (!$this.edges[end.stringify()][start.stringify()]) {
			$this.edges[end.stringify()][start.stringify()] = true;
		}
	};

	$this.randomResourceGroup = function() {
		var s = Math.floor(Math.random() * (9 + 1)), r2 = ResourceGroup[s];
		// console.log(s);
		return r2;
	};

	$this.addResourceGroup = function(point, r) {
		// $this.resourceGroups.push(p);
		// console.log(point);
		// console.log(r);
		$this.resourceGroups[point.stringify()] = r;
	};

	$this.grow = function(startX, startY, width, height) {

		if (width === 0 || height === 0) {
			return;
		}
		var start = $this.ORIGIN, i = 0, point1, y = 0, x = 0, point2, r2;

		for (i = 0; i < startX; i++) {
			start = start.e();
			if ((i) % 2 === 0) {
				start = start.se();
			} else {
				start = start.ne();
			}
		}

		for (i = 0; i < startY; i++) {
			start = start.se().sw();
		}

		point1 = start;
		for (y = 0; y < height; y++) {
			point2 = point1;
			for (x = 0; x < width; x++) {
				$this.addEdge(point2, point2.ne());
				$this.addEdge(point2, point2.se());

				r2 = $this.randomResourceGroup();

				$this.addResourceGroup(point2.e(), r2);

				point2 = point2.ne();
				$this.addEdge(point2, point2.e());
				point2 = point2.e();

				$this.addEdge(point2, point2.se());
				point2 = point2.se();

				$this.addEdge(point2, point2.sw());

				$this.addEdge(point2.sw(), point2.sw().w());

				if ((x + startX) % 2 === 0) {
					point2 = point2.sw();
				} else {
					point2 = point2.nw();
				}

			}
			point1 = point1.se().sw();
		}
	};

	/**
	 * @param {Object}
	 *            result object that contains an attribute named board
	 * @return {number} flag indicating success or error code
	 */
	$this.update = function(result) {

		if (result === undefined) {
			return -1;
		}
		if (result === null) {
			return -2;
		}

		if (typeof result === "string") {
			result = JSON.parse(result);
		}

		if (result.board === undefined) {
			return -3;
		}

		if (result.board === null) {
			return -4;
		}

		$this.turn = result.board.turn;
		$this.turnDuration = result.board.turnDuration;
		$this.turnStartedOn = result.board.turnStartedOn;
		$this.disposition = result.board.disposition;
		$this.turn = result.board.turn;
		$this.pointsToWin = result.board.pointsToWin;
		$this.id = result.board.id;

		$this.edges = result.board.edges;
		// convert to Player objects
		Object.keys(result.board.players).forEach(function(playerName) {
			$this.players[playerName] = new com.antonytrupe.tend.Player(result.board.players[playerName]);
		});

		$this.playersSorted = result.board.playersSorted;
		$this.settlementLocations = result.board.settlementLocations;
		$this.settlementOwnership = result.board.settlementOwnership;
		$this.resourceGroups = result.board.resourceGroups;
		$this.populationLimits = result.board.populationLimits;

	};
	$this.ORIGIN = new com.antonytrupe.tend.Point(0, -1, 1);
}