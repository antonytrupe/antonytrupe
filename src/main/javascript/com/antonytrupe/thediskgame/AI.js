/**
 * @constructor
 * @param {Table}
 *            table
 * @param {Player}
 *            player
 */
function AI(table, player) {
	"use strict";

	/**
	 * @typedef {object} AiNode
	 * @property {AiNode} parent
	 * @property f_score Estimated total cost from start to goal
	 * @property g_score Cost from start along best known path
	 * @property {Array.<AiNode>} children
	 * @property type
	 * @property diskNumber
	 * @property diskCount
	 */

	/**
	 * @type {AI}
	 * @memberOf AI
	 */
	var $this = this;

	/**
	 * @type {Table}
	 * @memberOf AI
	 */
	this.table = table;

	/**
	 * @memberOf AI
	 */
	this.player = player;

	this.depth = 3;

	/**
	 * @memberOf AI
	 */
	var MOVEMENT_BONUS = 0;

	/**
	 * @private
	 * @memberOf AI
	 */
	var DEFENDER_DIED_BONUS = 0;

	/**
	 * @memberOf AI
	 */
	var ATTACKER_DIED_PENALTY = 0;

	/**
	 * @type {AiNode}
	 * @memberOf AI
	 */
	var tree = {
		"children" : [],
		"value" : Number.NEGATIVE_INFINITY
	};

	/**
	 * priority queue of nodes to be traversed - queue(), dequeue(), peek(),
	 * length
	 * 
	 * @memberOf AI
	 */
	/*
	 * var fringe = new PriorityQueue({ comparator : function(a, b) { return
	 * b.f_score > a.f_score; } });
	 */
	var fringe = {
		"queue" : function() {
		},
		"dequeue" : function() {
		},
		"peek" : function() {
		}
	};

	fringe.queue(tree);

	/**
	 * past path cost
	 * 
	 * @return {number}
	 * @memberOf AI
	 */
	function g() {
		return 0;
	}

	/**
	 * heuristic, future path cost, --> future value, estimate, best case
	 * 
	 * @param attackerInfo
	 * @param defenderInfo
	 * @return {number}
	 * @memberOf AI
	 */
	function h(attackerInfo, defenderInfo) {
		var movementPoints = getMovementPoints(attackerInfo, defenderInfo);
		var defenderPoints = getDefenderDamageBonus(attackerInfo, defenderInfo);
		var attackerPoint = getAttackerDamagePenalty(attackerInfo, defenderInfo);
		return movementPoints * (defenderPoints - attackerPoint);
	}

	/**
	 * @param attackerInfo
	 * @param defenderInfo
	 * @return {number}
	 * @memberOf AI
	 */
	function getDefenderDamageBonus(attackerInfo, defenderInfo) {
		var bonus;

		if (attackerInfo.disk.attack >= defenderInfo.disk.toughness) {
			bonus = defenderInfo.disk.cost
					* (DEFENDER_DIED_BONUS + 1 - (attackerInfo.disk.attack - defenderInfo.disk.toughness)
							/ attackerInfo.disk.attack);
		} else {
			bonus = defenderInfo.disk.cost
					* (attackerInfo.disk.attack / defenderInfo.disk.toughness);
		}
		return bonus;

	}

	function getActions() {
		// TODO
		// get all the disks that can activate
		// get all the options for each disk
	}

	/**
	 * @param attackerInfo
	 * @param defenderInfo
	 * @return {number}
	 * @memberOf AI
	 */
	function getAttackerDamagePenalty(attackerInfo, defenderInfo) {
		var bonus;
		if (defenderInfo.disk.defense >= attackerInfo.disk.toughness) {
			bonus = attackerInfo.disk.cost
					* (ATTACKER_DIED_PENALTY + 1 - (defenderInfo.disk.defense - attackerInfo.disk.toughness)
							/ defenderInfo.disk.defense);
		} else {
			bonus = attackerInfo.disk.cost
					* (defenderInfo.disk.defense / attackerInfo.disk.toughness);
		}
		return bonus;
	}

	/**
	 * @param attackerInfo
	 * @param defenderInfo
	 * @return {number}
	 * @memberOf AI
	 */
	function getMovementPoints(attackerInfo, defenderInfo) {
		var distance = attackerInfo.mementoInfo.location
				.distance(defenderInfo.mementoInfo.location);
		distance = -(attackerInfo.disk.diameter / 2 + defenderInfo.disk.diameter / 2);
		var flips = distance / attackerInfo.disk.diameter;
		var movement_points = (attackerInfo.disk.movement >= flips) ? MOVEMENT_BONUS
				+ flips / attackerInfo.disk.movement
				: attackerInfo.disk.movement / flips;
		console.log(movement_points);
		return movement_points;
	}

	/**
	 * @param {AiNode}
	 *            node
	 * @memberOf AI
	 */
	function addToFringe(node) {
		fringe.queue({
			// node has a parent, children, attacker/defender disk number, and
			// table state after taking the action
			'node' : node,
			// value is used by our comparator
			'value' : node.value
		});
	}

	/**
	 * @param {Object}
	 *            parent - null if creating the root node
	 * @param {string}
	 *            type - root, min, max, expectimax
	 * @param {number}
	 *            value
	 * @param diskNumber
	 * @param diskCount
	 * @param memento
	 * @returns {AiNode}
	 * @memberOf AI
	 */
	function addToTree(parent, type, value, diskNumber, diskCount, memento) {
		// parent
		// children
		// data
		/**
		 * @type AiNode
		 */
		var node = {};
		node.parent = parent;

		node.type = type;
		node.children = [];
		node.node.f_score = value;

		console.log(parent);
		if (parent) {
			parent.children.push(node);
		}

		return node;
	}

	/**
	 * this is the entry point. example usage: var solution=search();
	 * execute(solution); this only finishes the current round
	 * 
	 * @returns {AiNode}
	 * @memberOf AI
	 */
	this.search = function() {

		// console.log($this.table.getCurrentPlayer());
		// sanity checking
		if ($this.table.getCurrentPlayer() === ""
				|| $this.table.getCurrentPlayer() === null
				|| typeof $this.table.getCurrentPlayer() === "undefined") {
			return;
		}
		//
		// console.log($this.table.getPlayerInfo($this.table.getCurrentPlayer()));

		// if the player who's turn it is is not a ai, then don't move for them
		if ($this.table.getPlayerInfo($this.table.getCurrentPlayer()).type != 'ai') {
			return;
		}

		if ($this.table.getSegment() == $this.table.SEGMENT.REINFORCEMENTS) {
			// TODO reinforcements segment AI
		}
		// activation segment AI
		else if ($this.table.getSegment() == $this.table.SEGMENT.ACTIVATION) {

			// get the round
			var stopRound = $this.table.getRound() + $this.depth;

			// while the fringe has nodes
			// and noone has won and we haven't reached the max depth
			// && $this.table.getWinners().length === 0
			while (fringe.length > 0) {
				// TODO
				// get the node in fringe with the highest f_score
				var current = fringe.peek();
				if ($this.table.getWinners().length > 0) {
					return current;
				}
				fringe.dequeue();
				// get
			}

			// get actions(disks that can activate)
			var friendlyDiskNumbers = getFriendlyDisks();
			console.log(friendlyDiskNumbers);
			// create the root node
			// var root = addToTree(null, "root");
			loopOverFriendlyAttackers(friendlyDiskNumbers, 1, tree);
		}
		console.log(tree);

		// var solution = getSolution();
		// return solution;
	};

	/**
	 * return them in lowest value first
	 * 
	 * @return {Array}
	 * @memberOf AI
	 */
	function getFriendlyDisks() {

		return $this.table
				.getPlayerInfo($this.table.getCurrentPlayer())
				.getDiskNumbers()
				.filter(
						function(diskNumber) {
							return $this.table.canActivate($this.table
									.getCurrentPlayer(), diskNumber);
						})
				.sort(
						function(a, b) {

							return $this.table.getDiskInfo(a).disk.cost < $this.table
									.getDiskInfo(b).disk.cost;
						});
	}

	/**
	 * @param friendlyPlayer
	 * @memberOf AI
	 */
	function getEnemyDisks(friendlyPlayer) {
		$this.table.getEnemyDisks(friendlyPlayer);
	}

	/**
	 * @memberOf AI
	 */
	function getSolution() {
		// TODO getSolution
	}

	/**
	 * @memberOf AI
	 */
	this.execute = function() {
		// TODO execute
	};

	/**
	 * @memberOf AI
	 */
	function loopOverFriendlyDefenders() {
		// TODO loopOverFriendlyDefenders
	}

	/**
	 * @memberOf AI
	 */
	function loopOverEnemyAttackers() {
		// TODO loopOverEnemyAttackers
	}

	/**
	 * @param {Array}
	 *            friendlyDiskNumbers - array of friendly disk numbers
	 * @param {number}
	 *            diskCount
	 * @param {AiNode}
	 *            parent
	 * @memberOf AI
	 */
	function loopOverFriendlyAttackers(friendlyDiskNumbers, diskCount, parent) {

		var enemyDiskNumbers = getEnemyDiskNumbers();
		friendlyDiskNumbers.forEach(
		/**
		 * @param {number}
		 *            friendlyDiskNumber
		 */
		function(friendlyDiskNumber) {
			// $this.table.restoreMemento(parent.data.memento);
			// add the friendly attacker to the tree

			// TODO
			var node = addToTree(parent, "max", (-1)
					* $this.table.getDiskInfo(friendlyDiskNumber).disk.cost,
					friendlyDiskNumber, diskCount, $this.table.memento);
			loopOverEnemyDefenders(enemyDiskNumbers, node);

		});

	}

	/**
	 * @param {number}
	 *            attackerDiskNumber
	 * @param {AiNode}
	 *            attackerParentNode
	 * @memberOf AI
	 */
	function loopOverEnemyDefenders(attackerDiskNumber, attackerParentNode) {
		// get all enemy disks
		console.log(attackerDiskNumber);
		console.log($this.table.getDiskInfo(attackerDiskNumber));
		console
				.log($this.table.getDiskInfo(attackerDiskNumber).mementoInfo.player);

		var enemyDiskNumbers = getEnemyDiskNumbers(currentPlayer);

		console.log(enemyDiskNumbers);

		enemyDiskNumbers
				.forEach(
				/**
				 * @param {number}
				 *            enemyDiskNumber
				 */
				function(enemyDiskNumber) {

					// restore the parentNode's memento
					$this.table.restoreMemento(attackerParentNode.memento);
					// we have a friendly
					// disk/enemy disk pair

					// figure out the values

					var value = h($this.table.getDiskInfo(attackerDiskNumber),
							$this.table.getDiskInfo(enemyDiskNumber));

					// do the move, and save the resulting memento
					console.log($this.table.getDiskInfo(enemyDiskNumber));
					$this.table
							.move(
									$this.table.getDiskInfo(attackerDiskNumber).mementoInfo.playerName,
									attackerDiskNumber,
									$this.table.getDiskInfo(enemyDiskNumber).mementoInfo.location);

					// these are our nodes
					// parent, type, value, diskNumber, diskCount, memento
					var node = addToTree(attackerParentNode, "enemy:defender",
							value, enemyDiskNumber, null, $this.table.memento);

					addToFringe(node);

				});

	}
}