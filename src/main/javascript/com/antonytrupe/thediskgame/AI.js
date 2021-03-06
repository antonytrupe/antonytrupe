/**
 * @constructor
 * @param {Table}
 *            table
 * @param {Player}
 *            player
 */
function AI(table, playerName) {
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
	this.playerName = playerName;

	/**
	 * @memberOf AI
	 */
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
	 * @returns {boolean}
	 * @memberOf AI
	 */
	this.atGoal = function() {
		// console.log($this.table.memento.players);
		// return true if we are the victor
		var winners = this.table.getWinners();
		// console.log(winners);
		if (winners.indexOf(this.playerName) >= 0) {
			console.log('!!!!!!!!!SOMEONE WON!!!!!!!!!');
			return true;
		}
		// console.log('No Winner Yet');
		return false;
	};

	/**
	 * actual path cost to current state from initial state
	 * 
	 * @return {number}
	 * @memberOf AI
	 */
	this.gScore = function() {
		var g = 0;
		// get the number of points lost so far
		this.table.getPlayerInfo(this.playerName).killed
				.forEach(function(disk) {
					// console.log(disk);
					g += parseFloat(disk.cost);

				});
		// console.log(g);
		return g;
	};

	/**
	 * heuristic, future path cost, --> future value, estimate, best case
	 * 
	 * @return {number}
	 * @memberOf AI
	 */
	this.hScore = function() {
		var h = 0;
		this.table.getEnemyDiskNumbers(this.playerName).forEach(
				function(diskNumber) {
					// console.log(diskNumber);
					var diskInfo = table.getDiskInfo(diskNumber);
					// console.log(diskInfo);
					h += parseFloat(diskInfo.disk.cost);
				});
		// console.log(h);
		return h;

	};

	// in order of estimated cost from the node to the goal
	this.closedPriorityQueueComparator = function(that) {
		if (this.hScore() < that.hScore()) {
			return 1;
		} else if (this.hScore() > that.hScore()) {
			return -1;
		} else {
			return 0;
		}
	};

	// in order of actual cost from start to current node plus estimated
	// cost to goal
	this.openPriorityQueueComparator = function(that) {
		if (this.hScore() + this.gScore() < that.hScore() + that.gScore()) {
			return -1;
		} else if (this.hScore() + this.gScore() > that.hScore()
				+ that.gScore()) {
			return 1;
		} else {
			return 0;
		}
	};

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

		var distance = new Point(attackerInfo.mementoInfo.location.x,
				attackerInfo.mementoInfo.location.y)
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
	 * @return {Array}
	 * @memberOf AI
	 */
	this.getActions = function() {
		var actions = [];
		var table = this.getState();
		// console.log('round');
		// console.log(table.memento.round);
		var currentPlayerName = table.getCurrentPlayer();
		// console.log(currentPlayerName);
		// var currentPlayer = table.getPlayerInfo(currentPlayerName);
		// console.log(currentPlayer.segment);
		switch (table.memento.segment) {
		case Table.SEGMENT.JOIN:
		case Table.SEGMENT.REINFORCEMENTS:
			var a;
			// console.log(this.playerName);
			// console.log(this.table.getPlayerInfo(this.playerName));
			if (this.table.getPlayerInfo(this.playerName).segment === Table.SEGMENT.REINFORCEMENTS) {
				a = this.playerName;
			} else {
				// pick the next player still in reinforcements
				a = table.getPlayersIn(Table.SEGMENT.REINFORCEMENTS)[0];
			}
			// console.log(this.table);
			var newTable = new Table();
			newTable.restore(JSON.parse(JSON.stringify(this.table)));
			newTable.endReinforcements(a);
			var action = {
				'action' : {
					'method' : 'endReinforcements',
					'arguments' : [ a ]
				},
				'model' : new AI(newTable, this.playerName)
			};
			// console.log(action);
			actions.push(action);
			break;
		case Table.SEGMENT.ACTIVATION:
			// console.log(this.table);
			// create a new shell
			var newTable = new Table();
			// load the shell
			newTable.restore(JSON.parse(JSON.stringify(this.table)));
			// advance the game
			newTable.endActivations(currentPlayerName);
			var a = {
				'action' : {
					'method' : 'endActivations',
					'arguments' : [ currentPlayerName ]
				},
				'state' : newTable
			};
			// console.log(a);
			actions.push(a);

			// get disk attack options
			var myDiskNumbers = table.getUnactivatedDisks(currentPlayerName);
			// console.log(myDiskNumbers);
			var enemyDiskNumbers = table.getEnemyDiskNumbers(currentPlayerName);
			// console.log(enemyDiskNumbers);

			// var p = new PriorityQueue("h", PriorityQueue.MAX_HEAP);

			myDiskNumbers.forEach(function(myDiskNumber) {
				// var myDiskInfo = $this.table.getDiskInfo(myDiskNumber);
				enemyDiskNumbers.forEach(function(enemyDiskNumber) {
					var enemyDiskInfo = $this.table
							.getDiskInfo(enemyDiskNumber);
					// var h = foo(myDiskInfo, enemyDiskInfo);

					// create a new shell
					var newTable = new Table();
					// load the shell
					newTable.restore(JSON.parse(JSON.stringify($this.table)));
					// advance the game
					var moveWorked = newTable.move(currentPlayerName,
							myDiskNumber, enemyDiskInfo.mementoInfo.location);
					// console.log(moveWorked);
					// move towards enemy disk
					var a = {
						'action' : {
							'method' : 'move',
							'arguments' : [ currentPlayerName, myDiskNumber,
									enemyDiskInfo.mementoInfo.location ]
						},
						'state' : newTable
					};
					// console.log(a);
					actions.push(a);

					// TODO action to move away from enemy disk

				});
			});
			break;
		}
		return actions;
	};

	function foo(attackerInfo, defenderInfo) {
		var movementPoints = getMovementPoints(attackerInfo, defenderInfo);
		var defenderPoints = getDefenderDamageBonus(attackerInfo, defenderInfo);
		var attackerPoint = getAttackerDamagePenalty(attackerInfo, defenderInfo);
		return movementPoints * (defenderPoints - attackerPoint);
	}

	/**
	 * @param {Table}
	 *            _table
	 * @memberOf AI
	 */
	this.setState = function(_table) {
		this.table = _table;
	};

	/**
	 * @return {Table}
	 * @memberOf AI
	 */
	this.getState = function() {
		return this.table;
	};

	/**
	 * @return
	 * @memberOf AI
	 */
	this.getPath = function() {
		// console.log('AI.search');
		// return [];
		var path = new AStar(this).getPath();
		// if path is empty, then no actions are better
		// so just do the minimum
		console.log(path);
		if (path.length === 0) {
			this.table = this.initial_table;
			var actions = this.getActions();
			if (actions.length >= 1) {
				path[0] = actions[0].action;
			}
		}
		console.log(path);
		// only return the current player's actions
		path = path.filter(function(action) {
			// console.log(action);
			return action.arguments[0] === this.playerName;
		}, this);
		console.log(path);
		return path;
	};

	/**
	 * @return {boolean}
	 * @memberOf AI
	 */
	this.keepSearching = function() {
		// limit how many turns into the future we go
		var initial_round = this.initial_table.memento.round;
		// console.log(initial_round);
		var current_round = this.table.memento.round;
		// console.log(current_round);
		// half way through round 1, finish round 1, all of round 2 and 3, stop
		// when current round is 4
		// 4-1=>3
		var delta = current_round - initial_round;
		// console.log(delta);
		if (delta < 3) {
			// console.log('keep searching');
		} else {
			// console.log('stop searching');
		}
		return delta < 3;
	};

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

			// loopOverFriendlyAttackers
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