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
	 * @typedef {Object} Node
	 * @property parent
	 * @property value
	 * @property children
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

	/**
	 * @memberOf AI
	 */
	var MOVEMENT_BONUS = 0;

	/**
	 * @memberOf AI
	 */
	var DEFENDER_DIED_BONUS = 0;

	/**
	 * @memberOf AI
	 */
	var ATTACKER_DIED_PENALTY = 0;

	/**
	 * priority queue of nodes to be traversed - queue(), dequeue(), peek(),
	 * length
	 * 
	 * @memberOf AI
	 */
	var fringe = new PriorityQueue({
		comparator : function(a, b) {
			return b.value > a.value;
		}
	});

	/**
	 * @memberOf AI
	 */
	var tree = {
		"children" : []
	};

	/**
	 * past path cost
	 * 
	 * @memberOf AI
	 */
	function g() {
		return 0;
	}

	/**
	 * heuristic, future path cost, --> future value, estimate, best case
	 * 
	 * @memberOf AI
	 */
	function h(attackerInfo, defenderInfo) {
		var movementPoints = getMovementPoints(attackerInfo, defenderInfo);
		var defenderPoints = getDefenderDamageBonus(attackerInfo, defenderInfo);
		var attackerPoint = getAttackerDamagePenalty(attackerInfo, defenderInfo);
		return movementPoints * (defenderPoints - attackerPoint);
	}

	/**
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

	/**
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
	 * @param {Node}
	 *            node
	 * @param value
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
	 * @param {?Object}
	 *            parent - null if creating the root node
	 * @param {string}
	 *            type - root, min, max, expectimax
	 * @param {number}
	 *            value
	 * @param diskNumber
	 * @param diskCount
	 * @param memento
	 * @returns {Node}
	 * @memberOf AI
	 */
	function addToTree(parent, type, value, diskNumber, diskCount, memento) {
		// parent
		// children
		// data
		/**
		 * @type Node
		 */
		var node = {};
		node.parent = parent;

		node.type = type;
		node.children = [];
		node.node.value = value;

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

			// get actions(disks that can activate)
			var friendlyDiskNumbers = getFriendlyDisks();
			console.log(friendlyDiskNumbers);
			// create the root node
			// var root = addToTree(null, "root");
			loopOverFriendlyAttackers(friendlyDiskNumbers, 1, tree);
		}
		console.log(tree);

		var solution = getSolution();
		return solution;
	};

	/**
	 * return them in lowest value first
	 * 
	 * @memberOf AI
	 */
	function getFriendlyDisks() {

		return $this.table.getPlayerInfo($this.table.getCurrentPlayer())
				.getDiskNumbers().filter(
						function(diskNumber) {
							return $this.table.canActivate($this.table
									.getCurrentPlayer(), diskNumber);
						}).sort(
						function(a, b) {

							$this.table.getDiskInfo(a).disk.cost < $this.table
									.getDiskInfo(b).disk.cost;
						});
	}

	/**
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
	};

	/**
	 * @memberOf AI
	 */
	function loopOverFriendlyDefenders() {
	}

	/**
	 * @memberOf AI
	 */
	function loopOverEnemyAttackers() {
	}

	/**
	 * @param {number[]}
	 *            diskNumbers - array of friendly disk numbers
	 * @param {number}
	 *            diskCounter
	 * @param {Node}
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
	 * @param {Node}
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
					// parent, attackerDiskNumber, defenderDiskNumber, memento,
					// value
					var node = addToTree(attackerParentNode, "enemy:defender",
							value, {
								"diskNumber" : enemyDiskNumber
							});

					addToFringe(node, value);

				});

	}
}