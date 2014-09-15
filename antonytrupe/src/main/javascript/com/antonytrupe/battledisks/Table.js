/**
 * @param {number=}
 *            maxPlayers
 * @param {number=}
 *            maxPoints
 * @param {number=}
 *            activations
 * @param {number=}
 *            startingDisks
 * @param {number=}
 *            reinforcements
 * @param {string=}
 *            alignmentRestriction
 * @param {string=}
 *            scenario
 * @constructor holds states
 */
function Table(maxPlayers, maxPoints, activations, startingDisks,
		reinforcements, alignmentRestriction, scenario) {
	"use strict";
	/**
	 * @type {Table}
	 */
	var $this = this;

	var TO_RADIANS = Math.PI / 180;

	// TODO 1 firstblow
	// TODO 2 berserk
	// TODO 4 magic
	// TODO 5 reanimate
	// TODO 3 rage

	// TODO 8 minimap

	/**
	 * this never changes
	 */
	this.id = null;

	this.ai = new AI($this);

	/**
	 * each memento has a unique it, but its always the most recent one because we
	 * need to know the latest version.
	 */
	this.mementoId = null;

	this.memento = {};

	/**
	 * this changes
	 */
	this.memento.round = 0;
	this.getRound = function() {
		return $this.memento.round;
	};

	// JOIN, REINFORCEMENTS, ACTIVATION, MISSILE,COMBAT,REMOVE_COUNTERS,FINISHED
	/**
	 * Enum for segments.
	 * 
	 * @enum {string}
	 */
	this.SEGMENT = {
		JOIN : "JOIN",
		REINFORCEMENTS : "REINFORCEMENTS",
		ACTIVATION : "ACTIVATION",
		MISSILE : "MISSILE",
		COMBAT : "COMBAT",
		REMOVE_COUNTERS : "REMOVE_COUNTERS",
		FINISHED : "FINISHED"
	};

	this.memento.segment = $this.SEGMENT.JOIN;

	this.maxPlayers = maxPlayers;
	this.maxPoints = maxPoints;
	this.activations = activations;
	this.startingDisks = startingDisks;
	this.reinforcements = reinforcements;
	// None, Single, Neutral
	this.alignmentRestriction = alignmentRestriction;
	this.scenario = scenario;

	// things that don't change, or only have info added to them, do not need to
	// be in the mememto

	/**
	 * the order doesn't change, but players are added to the end.
	 */
	this.playerOrder = [];

	this.disks = {};
	this.spells = {};

	/**
	 * the player that goes/went first this round. this changes each round.
	 */
	this.memento.firstPlayer = null;
	this.getFirstPlayer = function() {
		return $this.memento.firstPlayer;
	};

	/**
	 * the player's name who's turn it is. this changes a lot.
	 */
	this.memento.currentPlayer = null;
	this.getCurrentPlayer = function() {
		return $this.memento.currentPlayer;
	};

	// {"playerName":={"reinforcements":[]},...}
	this.memento.players = {};

	// this can stay on the table for now
	this.actions = [];

	/**
	 * this doesn't get persisted as part of the table
	 */
	this.mementos = {};

	/**
	 * {"0":{diskName:"",location:{}},...}
	 */
	this.memento.diskInfo = {};

	/**
	 * this doesn't change
	 */
	this.stagingDisks = [];

	// returns an object that has
	this.getDiskInfo = function(diskNumber) {

		if ($this.memento.diskInfo[diskNumber] == undefined) {
			console.log(diskNumber);
			console.log(JSON.parse(JSON.stringify($this.memento.diskInfo)));
			console.log($this.memento.diskInfo[diskNumber].diskName);
		}
		return {
			'mementoInfo' : $this.memento.diskInfo[diskNumber],
			'disk' : $this.disks[$this.memento.diskInfo[diskNumber].diskName]
		};
	};

	this.getDiskNumbers = function() {
		// return an object that doesn't have killed disks and
		return Object.keys($this.memento.diskInfo).filter(function(diskNumber) {
			return $this.memento.diskInfo[diskNumber] !== null;
		});
	};

	/**
	 * this creates a record of activating the disk. used for explicitly
	 * activating a disk without taking another action. it also calls
	 * activateDisk2, which does the grunt work.
	 */
	this.activateDisk = function(diskNumber, playerName) {
		if ($this.canActivate(playerName, diskNumber)) {
			$this.activateDisk2(diskNumber, playerName);
			// record action
			$this.recordAction("activateDisk", [ diskNumber, playerName ]);
		}

	};

	/**
	 * Used for activating a disk as part of some other action. Does not create
	 * a record of activating the disk, nor does it create a memento. Does move
	 * the player and/or table to the next segment if appropriate.
	 * 
	 * @private
	 * @param {number}
	 *            diskNumber
	 * @param {string}
	 *            playerName
	 */
	this.activateDisk2 = function(diskNumber, playerName) {
		// check to make sure this player can activate this disk
		if ($this.getDiskInfo(diskNumber).mementoInfo.activated) {
			return;
		}

		if ($this.getDiskInfo(diskNumber).mementoInfo.player !== playerName) {
			return;
		}

		if ($this.getCurrentPlayer() !== playerName) {
			return;
		}

		$this.getDiskInfo(diskNumber).mementoInfo.activated = true;
		$this.getPlayerInfo(playerName).activations++;

		if (!$this.hasUnactivatedDisks(playerName)) {
			// automatically set his segment to MISSILE
			$this.getPlayerInfo(playerName).segment = $this.SEGMENT.MISSILE;
		}

		// check to see how many disks we have flipped this segment
		if (parseInt($this.getPlayerInfo(playerName).activations, 10) === parseInt(
				$this.activations, 10)
				|| $this.getPlayerInfo($this.getCurrentPlayer()).segment !== $this.SEGMENT.ACTIVATION) {
			// clear activations
			$this.getPlayerInfo(playerName).activations = 0;
			this.memento.currentPlayer = $this.getNextPlayer();
			// check to make sure the next player is still in ACTIVATION
			// check to make sure the next player has disks to activate

			while ($this.anyPlayersIn($this.SEGMENT.ACTIVATION)
					&& ($this.getPlayerInfo($this.getCurrentPlayer()).segment !== $this.SEGMENT.ACTIVATION || !$this
							.hasUnactivatedDisks($this.getCurrentPlayer()))) {

				$this.getPlayerInfo($this.getCurrentPlayer()).segment = $this.SEGMENT.MISSILE;
				$this.memento.currentPlayer = $this.getNextPlayer();
			}

		}

		// if no more players are in the activation segment,
		if (!$this.anyPlayersIn($this.SEGMENT.ACTIVATION)) {
			// move the table to the MISSILE segment
			$this.startMissileSegment();
		}

	};

	this.activateMovedDisks = function(playerName, movedDiskNumber) {
		// find previously moved disk(s) that haven't been activated and
		// activate them
		$this.getDiskNumbers().some(
				function(diskNumber) {
					var diskInfo = $this.getDiskInfo(diskNumber);

					if (!diskInfo.mementoInfo.activated
							&& diskInfo.mementoInfo.player === playerName
							&& parseInt(diskInfo.mementoInfo.flips, 10) > 0
							&& parseInt(diskNumber, 10) !== parseInt(
									movedDiskNumber, 10)) {

						$this.activateDisk2(diskNumber, playerName);
						return true;
					}
				});
	};

	/**
	 * 
	 */
	this.addMemento = function() {
		// $this.debug('Table.addMemento');
		// if ($this.mementoId == null) {
		// $this.mementoId = -1;
		// }

		// deep copy
		$this.mementos[$this.mementoId + 1] = JSON.parse(JSON
				.stringify($this.memento));
		$this.mementoId++;
	};

	// returns negative numbers for error codes, and 0 for success
	this.attack = function(attacker) {
		var attackees = $this.getAttackees(attacker);
		if (attackees === null) {
			return -1;
		}
		if ($this.getDiskInfo(attacker).mementoInfo.attacked) {
			return -2;
		}

		// check to make sure all the pinned disks have selected a defendee, or
		// don't need to
		if ($this.getDiskInfo(attacker).mementoInfo.pinning.some(function(
				defender) {
			return $this.isPinnedByEnemy(defender)
					&& $this.getDefendees(defender) === null;
		})) {
			return -3;
		}

		$this.getDiskInfo(attacker).mementoInfo.attacked = true;

		// apply attack
		// handle attackees being an array
		attackees
				.forEach(function(attackee) {
					$this.debug($this.getDiskInfo(attacker).disk.name + "("
							+ attacker + ")" + " does "
							+ $this.getDiskInfo(attacker).disk.attack
							+ " damage to "
							+ $this.getDiskInfo(attackee).disk.name + "("
							+ attackee + ")");

					$this.getDiskInfo(attackee).mementoInfo.carryOverDamage += parseInt(
							$this.getDiskInfo(attacker).disk.attack, 10);

					// convert carryoverdamage to wounds
					$this.getDiskInfo(attackee).mementoInfo.wounds += Math
							.floor($this.getDiskInfo(attackee).mementoInfo.carryOverDamage
									/ $this.getDiskInfo(attackee).disk.toughness);

					// set the carryoverdamage to what is left after converting
					// to wounds
					$this.getDiskInfo(attackee).mementoInfo.carryOverDamage = $this
							.getDiskInfo(attackee).mementoInfo.carryOverDamage
							% $this.getDiskInfo(attackee).disk.toughness;

				});

		// all the pinned disks get to defend
		$this.getDiskInfo(attacker).mementoInfo.pinning.forEach(function(
				defender) {

			if (!$this.getDiskInfo(defender).mementoInfo.defended &&
			// handle the result of getDefendees being null
			$this.getDefendees(defender) !== null &&
			// handle the result of getDefendees being an array
			$this.getDefendees(defender).indexOf(parseInt(attacker, 10)) > -1) {
				$this.defend(defender);
			}
		});

		// see if the attackee is dead
		attackees
				.forEach(function(d) {
					$this.debug($this.getDiskInfo(d).disk.name + "(" + d + ")"
							+ "'s wounds:"
							+ $this.getDiskInfo(d).mementoInfo.wounds + "/"
							+ $this.getDiskInfo(d).disk.wounds);
					if ($this.getDiskInfo(d).mementoInfo.wounds >= $this
							.getDiskInfo(d).disk.wounds) {
						// the disk is dead
						// remove the disk from the table and restack
						$this.remove(d);
					}
				});

		// see if the attacker is dead
		$this.debug($this.getDiskInfo(attacker).disk.name + "(" + attacker
				+ ")" + "'s wounds:"
				+ $this.getDiskInfo(attacker).mementoInfo.wounds + "/"
				+ $this.getDiskInfo(attacker).disk.wounds);
		if ($this.getDiskInfo(attacker).mementoInfo.wounds >= parseInt($this
				.getDiskInfo(attacker).disk.wounds, 10)) {
			// the disk is dead
			// remove the disk from the table and restack
			$this.remove(attacker);
		}
		return 0;
	};

	this.canActivate = function(playerName, diskNumber) {
		if (diskNumber === null) {
			return false;
		}
		if (playerName === null) {
			return false;
		}
		if ($this.memento.segment !== $this.SEGMENT.ACTIVATION) {
			return false;
		}
		if ($this.getPlayerInfo(playerName).segment !== $this.SEGMENT.ACTIVATION) {
			return false;
		}
		if (playerName !== $this.getCurrentPlayer()) {
			return false;
		}
		if ($this.getDiskInfo(diskNumber).mementoInfo.pinnedBy.length !== 0) {
			return false;
		}
		if ($this.getDiskInfo(diskNumber).mementoInfo.activated) {
			return false;
		}

		if ($this.getDiskInfo(diskNumber).mementoInfo.player !== playerName) {
			return false;
		}

		return true;
	};

	this.canCastSpell = function(playerName, diskNumber) {
		if ($this.canActivate(playerName, diskNumber)
				&& $this.getDiskInfo(diskNumber).disk.spellcaster >= 1) {
			return true;
		}
		return false;
	};

	this.isPinnedByCreature = function(diskNumber) {
		if ($this.getDiskInfo(diskNumber).mementoInfo.pinnedBy.length === 0) {
			return false;
		}

		return $this.getDiskInfo(diskNumber).mementoInfo.pinnedBy
				.some(function(pinningDiskNumber) {
					if ($this.getDiskInfo(pinningDiskNumber).disk.type === 'creature') {
						return true;
					}
				});

	};

	this.canMove = function(playerName, diskNumber) {
		if (diskNumber === undefined || diskNumber === null) {
			// $this.debug("Table.canMove:" + "diskNumber");
			return false;
		}

		if (playerName === undefined || playerName === null) {
			// $this.debug("Table.canMove:" + "playerName");
			return false;
		}

		// make sure the moving disk is not pinned
		if ($this.getDiskInfo(diskNumber).mementoInfo.pinnedBy.length > 0) {
			// $this.debug("Table.canMove:" + "pinnedBy");
			return false;
		}

		// make sure this disk has flips left
		if ($this.getDiskInfo(diskNumber).mementoInfo.flips >= $this
				.getDiskInfo(diskNumber).disk.movement) {
			// $this.debug("Table.canMove:" + "movement");
			return false;
		}

		// make sure this disk has not already been activated
		if ($this.getDiskInfo(diskNumber).mementoInfo.activated) {
			// $this.debug("Table.canMove:" + "activated");
			return false;
		}

		// make sure it is this player's disks
		if (playerName !== $this.getDiskInfo(diskNumber).mementoInfo.player) {
			// $this.debug("Table.canMove:" + "player");
			return false;
		}

		// make sure it is this player's turn
		if ($this.getCurrentPlayer() !== playerName) {
			return false;
		}

		// make the table is still in the activation segment
		if ($this.memento.segment !== $this.SEGMENT.ACTIVATION) {
			// $this.debug("Table.canMove:" + $this.SEGMENT.ACTIVATION);
			return false;
		}

		// make sure this player is still in the activation segment
		if ($this.getPlayerInfo(playerName).segment !== $this.SEGMENT.ACTIVATION) {
			// $this.debug("Table.canMove:" + $this.SEGMENT.ACTIVATION);
			return false;
		}

		// make sure this player has activations left this turn
		if (parseInt($this.activations, 10) <= parseInt($this
				.getPlayerInfo(playerName).activations, 10)) {
			// $this.debug("Table.canMove:" + "activations");
			return false;
		}
		return true;
	};

	this.canReinforce = function(playerName, diskNumber) {
		if (diskNumber === null) {
			// $this.debug('3');
			return false;
		}

		if (diskNumber === undefined || diskNumber === null) {
			// $this.debug('4');
			return false;
		}

		if (playerName === undefined || playerName === null) {
			// $this.debug('5');
			return false;
		}

		if (playerName !== $this.getDiskInfo(diskNumber).mementoInfo.player) {
			return false;
		}

		if (!($this.memento.segment === $this.SEGMENT.JOIN || $this.memento.segment === $this.SEGMENT.REINFORCEMENTS)) {
			// $this.debug('6');
			return false;
		}

		return $this.getDiskInfo(diskNumber).mementoInfo.reinforcement;
	};

	this.canReinforceTo = function(playerName, diskNumber, location) {
		if (!$this.canReinforce(playerName, diskNumber)) {
			// $this.debug('1');
			return false;
		}

		var stagingDisk = $this.getStagingDisk(playerName);

		// validate the disk is overlapping the stagingDisk
		// use the new location, not the old location
		var overlapping = $this.isOverLapping({
			'mementoInfo' : {
				"location" : location
			},
			"disk" : this.getDiskInfo(diskNumber).disk
		}, {
			'mementoInfo' : {
				"location" : stagingDisk.location
			},
			"disk" : stagingDisk.disk
		});

		if (!overlapping) {
			// $this.debug('2');
			return false;
		}

		return true;
	};

	/**
	 * @private
	 */
	this.debug = function(message) {
		//
		if (typeof e !== "undefined") {
			e.io.write(message + "\n");
		}
		if (typeof console !== "undefined") {
			console.log(message);
		}
	};

	this.defend = function(defender) {
		var defendees = $this.getDefendees(defender);
		if (defendees === null) {
			return;
		}
		if ($this.getDiskInfo(defender).mementoInfo.defended) {
			return;
		}

		// handle the result of getDefendees being an array
		defendees.forEach(function(d) {
			$this.debug($this.getDiskInfo(defender).disk.name + "(" + defender
					+ ")" + " does " + $this.getDiskInfo(defender).disk.attack
					+ " damage to " + $this.getDiskInfo(d).disk.name + "(" + d
					+ ")");

			// apply defense
			$this.getDiskInfo(d).mementoInfo.carryOverDamage += parseInt($this
					.getDiskInfo(defender).disk.defense, 10);

			// convert carryoverdamage to wounds
			$this.getDiskInfo(d).mementoInfo.wounds += Math.floor($this
					.getDiskInfo(d).mementoInfo.carryOverDamage
					/ $this.getDiskInfo(d).disk.toughness);

			// set the carryoverdamage to what is left after converting
			// to wounds
			$this.getDiskInfo(d).mementoInfo.carryOverDamage = $this
					.getDiskInfo(d).mementoInfo.carryOverDamage
					% $this.getDiskInfo(d).disk.toughness;

		});

		$this.getDiskInfo(defender).mementoInfo.defended = true;

	};

	/**
	 * 
	 */
	this.endActivations = function(playerName) {
		$this.getPlayerInfo(playerName).segment = $this.SEGMENT.MISSILE;

		// clear activations
		$this.getPlayerInfo(playerName).activations = 0;

		// activate any moved disks
		$this.activateMovedDisks(playerName, -1);

		// if it was this players turn, move to the next player
		// get the index of the current player
		if (playerName === $this.getCurrentPlayer()) {
			while ($this.anyPlayersIn($this.SEGMENT.ACTIVATION)
					&& ($this.getPlayerInfo($this.getCurrentPlayer()).segment !== $this.SEGMENT.ACTIVATION || !$this
							.hasUnactivatedDisks($this.getCurrentPlayer()))) {
				$this.getPlayerInfo($this.getCurrentPlayer()).segment = $this.SEGMENT.MISSILE;
				this.memento.currentPlayer = $this.getNextPlayer();
			}
		}

		if (!$this.anyPlayersIn($this.SEGMENT.ACTIVATION)) {
			// move the table to the MISSILE segment
			$this.startMissileSegment();
		}

		// record end activations action
		$this.recordAction("endActivations", [ playerName ]);
	};

	this.endReinforcements = function(playerName) {
		$this.getPlayerInfo(playerName).segment = $this.SEGMENT.ACTIVATION;

		// if all the players are done with reinforcements
		var anyPlayersInReinforcement = $this
				.anyPlayersIn($this.SEGMENT.REINFORCEMENTS);

		if (!anyPlayersInReinforcement
				&& Object.keys($this.memento.players).length === parseInt(
						$this.maxPlayers, 10)) {
			// then proceed to the ACTIVATION segment
			$this.startActivationSegment();
		}

		$this.recordAction("endReinforcements", [ playerName ]);
	};

	this.endMissiles = function(playerName) {
		$this.getPlayerInfo(playerName).segment = $this.SEGMENT.COMBAT;

		// if all the players are done with missiles
		var anyPlayersInMissile = $this.anyPlayersIn('MISSILE');

		if (!anyPlayersInMissile) {
			// then proceed to the Combat segment
			$this.startCombatSegment();
		}

		$this.recordAction("endMissiles", [ playerName ]);
	};

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function getRandomFloat(min, max) {
		return Math.random() * (max - min + 1) + min;
	}

	/**
	 * @param {string}
	 *            playerName
	 * @param {number}
	 *            diskNumber
	 * @param {Point}
	 *            tableClickPoint
	 * @param {Disk}
	 *            missile
	 */
	this.fireMissiles = function(playerName, diskNumber, tableClickPoint,
			missile) {
		// Table.fireMissiles
		$this.debug("Table.fireMissiles");
		$this.debug("playerName:" + playerName);
		$this.debug("diskNumber:" + diskNumber);
		$this.debug("tableClickPoint:" + JSON.stringify(tableClickPoint));
		$this.debug("missile:" + JSON.stringify(missile));

		if (!$this.canMissile(playerName, diskNumber, missile.name)) {
			$this.debug('cannot fireMissiles');
			return false;
		}

		var diskInfo = $this.getDiskInfo(diskNumber);

		var tableLocation = $this.getPointInsideCircle(new Point(
				diskInfo.mementoInfo.location.x,
				diskInfo.mementoInfo.location.y), 12, tableClickPoint);

		// $this.debug(missile.name.toLowerCase());
		// $this.debug(diskInfo.disk[missile.name.toLowerCase() + 's']);

		for (var i = 0; i < diskInfo.disk[missile.name.toLowerCase() + 's']; i++) {
			// pick a random angle
			var angle = getRandomInt(0, 360);

			var percent = getRandomInt(1, 100);

			// $this.debug(percent);

			var distance = 0;

			// these increments need to be in sync with the increments in
			// TableUI.drawMissileTarget
			var innerRadius = 2;
			var middleRadius = 4;
			var outerRadius = 6;

			if (percent <= 68) {
				distance = percent / 68 * innerRadius;
			} else if (percent < 95) {
				distance = (percent - 68) / (95 - 68)
						* (middleRadius - innerRadius) + innerRadius;
			} else if (percent < 99) {
				distance = (percent - 99) / (99 - 95)
						* (outerRadius - middleRadius) + outerRadius;
			} else {
				distance = outerRadius + getRandomFloat(0, 12);
			}

			// $this.debug(distance);

			var x = tableLocation.x + distance * Math.cos(angle);
			var y = tableLocation.y + distance * Math.sin(angle);

			$this.place(missile, new Point(x, y), null);
		}

		// create a memento to capture where the disks landed
		$this.addMemento();

		// only call activateDisk once, so that we don't move out of activation
		// then try to activate again
		$this.activateDisk2(diskNumber, playerName);

		// record move action
		$this.recordAction("fireMissiles", [ playerName, diskNumber,
				tableClickPoint ]);
	};

	/**
	 * @param {Point}
	 *            circleCenter
	 * @param {number}
	 *            radius
	 * @param {Point}
	 *            point
	 * 
	 * given a circle defined by a center and radius and a second point, if the
	 * second point is inside the circle, return it, otherwise return the point
	 * on the circumference of the circle that intersects with the line defined
	 * by the second point and center of the circle
	 */
	this.getPointInsideCircle = function(circleCenter, radius, point) {

		var b = circleCenter.distance(point);
		var distance = Math.min(radius, b);

		var location = new Point(circleCenter.x, circleCenter.y).getEdge(point,
				distance);
		return location;
	};

	this.hasUnactivatedArcherDisks = function(playerName) {
		$this.debug('Table.hasUnactivatedArcherDisks');
		$this.debug($this.getArcherDisks(playerName).length);
		return $this.getArcherDisks(playerName).length > 0;
	};

	/**
	 * checks everything including the specific missile
	 * 
	 * @param {string}
	 *            playerName
	 * @param {number}
	 *            diskNumber
	 * @param {string}
	 *            projectile
	 */
	this.canMissile = function(playerName, diskNumber, projectile) {
		$this.debug('Table.canMissile');
		$this.debug(projectile.toLowerCase());
		$this.debug(JSON.stringify($this.getDiskInfo(diskNumber).disk));
		$this.debug($this.getDiskInfo(diskNumber).disk[projectile.toLowerCase()
				+ 's']);

		// make sure it is this player's turn
		if ($this.getCurrentPlayer() !== playerName) {
			return false;
		}

		// make the table is still in the missile segment
		if ($this.memento.segment !== $this.SEGMENT.MISSILE) {
			return false;
		}

		// make sure this player is still in the missile segment
		if ($this.getPlayerInfo(playerName).segment !== $this.SEGMENT.MISSILE) {
			return false;
		}

		// make sure this disk has missiles
		if ($this.getDiskInfo(diskNumber).disk[projectile.toLowerCase() + 's'] === 0) {
			return false;
		}

		return $this.canMissile1(playerName, diskNumber);

	};

	/**
	 * only checks the disk itself, not anything else about the table(table
	 * segment, player segment, etc)
	 */
	this.canMissile1 = function(playerName, diskNumber) {
		if (diskNumber === undefined || diskNumber === null) {
			return false;
		}

		if (playerName === undefined || playerName === null) {
			return false;
		}

		// make sure the moving disk is not pinned, but only count creature
		// disks, not missiles
		if ($this.isPinnedByCreature(diskNumber)) {
			return false;
		}

		// make sure this disk is not pinning another disk
		if ($this.getDiskInfo(diskNumber).mementoInfo.pinning.length !== 0) {
			return false;
		}

		// make sure this disk is the current players
		if ($this.getDiskInfo(diskNumber).mementoInfo.player !== playerName) {
			return false;
		}

		// make sure this disk has not already been activated
		if ($this.getDiskInfo(diskNumber).mementoInfo.activated) {
			return false;
		}

		// check disk is an archer
		if (!$this.getDiskInfo(diskNumber).disk.archer) {
			return false;
		}

		// check disk is not pinning another disk
		if ($this.getDiskInfo(diskNumber).mementoInfo.pinning.length !== 0) {
			return false;
		}

		return true;

	};

	this.getArcherDisks = function(playerName) {
		$this.debug('Table.getArcherDisks');
		var disks = [];
		$this.getDiskNumbers().forEach(function(diskNumber) {
			// is this not returning disks is should be?
			// make sure the disk is not pinned or pinning another disk
			if ($this.canMissile1(playerName, diskNumber)) {
				disks.push(diskNumber);
			}
		});
		$this.debug(JSON.stringify(disks));
		return disks;
	};

	/**
	 * @param {number}
	 *            attacker
	 * @return {?Array} returns null if the attackee is unknown or there is no
	 *         attackee, otherwise returns an array of attackees
	 */
	this.getAttackees = function(attacker) {
		if ($this.getDiskInfo(attacker).mementoInfo.attackee !== null) {
			return [ parseInt($this.getDiskInfo(attacker).mementoInfo.attackee,
					10) ];
		}
		// only count enemy disks, not all disks
		var enemyDisks = $this.getDiskInfo(attacker).mementoInfo.pinning
				.filter(function(diskNumber) {
					if ($this.getDiskInfo(attacker).mementoInfo.player !== $this
							.getDiskInfo(diskNumber).mementoInfo.player
							&& $this.getDiskInfo(diskNumber).disk.type === 'creature') {
						return true;
					}
					return false;
				});

		// swashbuckler
		if ($this.getDiskInfo(attacker).disk.swashbuckler === true) {
			// return all the pinned enemy disks
			return enemyDisks;
		}

		if (enemyDisks.length === 1) {
			return enemyDisks;
		}

		// didn't find an explicit attackee nor an implicit attackee, and not a
		// swashbuckler
		return null;

	};

	/**
	 * @param {number}
	 *            defender
	 * @return {?(Array.<number>|boolean)}
	 */
	this.getDefendees = function(defender) {
		if ($this.getDiskInfo(defender).mementoInfo.defendee !== null) {
			return [ parseInt($this.getDiskInfo(defender).mementoInfo.defendee,
					10) ];
		}
		// only count enemy disks, not all disks
		var enemyDisks = $this.getDiskInfo(defender).mementoInfo.pinnedBy
				.filter(function(diskNumber) {
					if ($this.getDiskInfo(defender).mementoInfo.player !== $this
							.getDiskInfo(diskNumber).mementoInfo.player
							&& $this.getDiskInfo(diskNumber).disk.type === 'creature') {
						return true;
					}
					return false;
				});

		// swashbuckler
		if ($this.getDiskInfo(defender).disk.swashbuckler === true) {
			// return all the pinned enemy disks
			return enemyDisks;
		}

		if (enemyDisks.length === 1) {
			return enemyDisks;
		}

		// didn't find an explicit attackee nor an implicit attackee
		return null;

	};

	this.getDisksThatNeedAttackee = function(playerName) {
		// make sure we only count enemy disks when counting the number of disks
		// a given disk is pinning
		var disks = [];

		// loop over all the disks
		$this
				.getDiskNumbers()
				.forEach(
						function(diskNumber) {
							if (playerName === $this.getDiskInfo(diskNumber).mementoInfo.player
									&& $this.isPinningEnemy(diskNumber)
									&& $this.getAttackees(diskNumber) === null) {

								disks.push(diskNumber);
							}
						});
		return disks;
	};

	this.getDisksThatNeedDefendee = function(playerName) {
		// make sure we only count enemy disks
		var disks = [];
		// loop over all the disks
		$this
				.getDiskNumbers()
				.forEach(
						function(diskNumber) {
							if (playerName === $this.getDiskInfo(diskNumber).mementoInfo.player
									&& $this.isPinnedByEnemy(diskNumber)
									&& $this.getDefendees(diskNumber) === null) {

								disks.push(diskNumber);
							}
						});
		return disks;
	};

	this.getId = function() {
		return $this.id;
	};

	this.getNextAttacker = function() {
		var stacks = {};

		$this.getDiskNumbers().forEach(function(diskNumber) {
			$this.getTier(diskNumber, stacks);
		});

		// get the highest disk
		var attacker = null;
		var topTier = 0;
		Object
				.keys(stacks)
				.forEach(
						function(diskNumber) {

							var tier = stacks[diskNumber];

							// also check to make sure this disk has attack
							// points left
							// and is pinning an enemy
							if (tier > topTier
									&& !$this.getDiskInfo(diskNumber).mementoInfo.attacked
									&& $this.isPinningEnemy(diskNumber)) {
								attacker = diskNumber;
								topTier = tier;
							}
						});

		// bug in JSDT
		return {
			tier : topTier,
			attacker : attacker
		};
	};

	/**
	 * @param {string=}
	 *            playerName
	 */
	this.getNextPlayer = function(playerName) {
		// this might break things
		if (playerName === undefined) {
			playerName = $this.getCurrentPlayer();
		}
		var index = $this.playerOrder.indexOf(playerName);
		index++;
		// if we are at the end of the list, loop back to the beginning
		if (index === $this.playerOrder.length) {
			index = 0;
		}
		return $this.playerOrder[index];
	};

	/**
	 * @param {number}
	 *            diskNumber
	 * @return {Array}
	 * 
	 */
	this.getOverlappingDisks = function(diskNumber) {
		var overlappingDisks = [];
		$this
				.getDiskNumbers()
				.forEach(
						function(loopDiskNumber) {
							var info1 = $this.getDiskInfo(loopDiskNumber);
							// ignore self
							if (parseInt(loopDiskNumber, 10) !== parseInt(
									diskNumber, 10)
									// only stack creature disks
									&& info1.disk.type == 'creature') {
								var location = new Point(
										$this.getDiskInfo(diskNumber).mementoInfo.location.x,
										$this.getDiskInfo(diskNumber).mementoInfo.location.y);

								var distance = location
										.distance(info1.mementoInfo.location);
								var diameter = (parseFloat($this
										.getDiskInfo(diskNumber).disk.diameter) + parseFloat(info1.disk.diameter)) / 2.0;

								if (distance < diameter) {
									overlappingDisks.push(loopDiskNumber);
								}
							}
						});
		return overlappingDisks;
	};

	this.getPlayerInfo = function(playerName) {
		// console.log($this.memento.players);
		return $this.memento.players[playerName];
	};

	this.getOverlappingDisks1 = function(location, diameter) {
		var overlappingDisks = [];
		$this
				.getDiskNumbers()
				.forEach(
						function(loopDiskNumber) {
							var info1 = $this.getDiskInfo(loopDiskNumber);
							// ignore self
							// if (parseInt(loopDiskNumber, 10) !== parseInt(
							// diskNumber, 10)) {

							var distance = location
									.distance(info1.mementoInfo.location);

							// $this.debug(diameter);
							// $this.debug(parseFloat(info1.disk.diameter));

							var diameter2 = (parseFloat(diameter) + parseFloat(info1.disk.diameter)) / 2.0;
							// $this.debug(distance);
							// $this.debug(diameter2);

							if (distance < diameter2) {
								overlappingDisks.push(loopDiskNumber);
							}
							// }
						});
		return overlappingDisks;
	};

	this.getRatingAdjustment = function(playerName) {
		// $this.debug(playerName);
		var winners = $this.getWinners();
		var k = 32;
		var expectedScore = 0;
		var actualScore = 0;
		Object
				.keys($this.memento.players)
				.forEach(
						function(opponentName) {
							if (playerName === opponentName) {
								// $this.debug('not rating against self');
								return;
							}
							// $this.debug('opponent:' + opponentName);
							var opponent = $this.getPlayerInfo(opponentName);
							if (typeof $this.getPlayerInfo(playerName).rating === "undefined") {
								$this.getPlayerInfo(playerName).rating = 0.0;
							}
							if (typeof opponent.rating === "undefined") {
								opponent.rating = 0.0;
							}
							expectedScore += 1 / (1 + Math
									.pow(
											10,
											(opponent.rating - $this
													.getPlayerInfo(playerName).rating) / 400));
							// $this.debug('expectedScore:' + expectedScore);
							// if loss
							if (winners.indexOf(playerName) === -1) {
								actualScore += 0;
							}
							// if win
							else if (winners.indexOf(opponent.name) === -1) {
								actualScore += 1;
							}
							// else if draw
							else {
								actualScore += 0.5;
							}
							// $this.debug('actualScore:' + actualScore);
						});
		// $this.debug('total expectedScore:' + expectedScore);
		// $this.debug('total actualScore:' + actualScore);
		var adjustment = k * (actualScore - expectedScore);
		// $this.debug('adjustment:' + adjustment);
		return adjustment;
	};

	this.getReinforcementCount = function(playerName) {
		/*
		 * if (playerName === null || playerName === "" || playerName ===
		 * undefined) { return 0; } if ($this.memento.players[playerName] ===
		 * null || typeof $this.memento.players[playerName] === "undefined") {
		 * return 0; }
		 */
		var reinforcementCount = parseInt($this.reinforcements, 10);
		if ($this.round === 0) {
			reinforcementCount = parseInt($this.startingDisks, 10);
		}
		// $this.debug(playerName);
		return Math.min(reinforcementCount,
				$this.getPlayerInfo(playerName).reinforcements.length);
	};

	this.getTier = function(diskNumber, stacks) {
		if (diskNumber === undefined
				|| $this.memento.diskInfo[diskNumber] === null) {
			return -1;
		}
		// else if we've already figured out this disk's tier
		if (typeof stacks[diskNumber] !== "undefined") {
			return stacks[diskNumber];
		}

		// if this disk is not pinning any other disks
		if ($this.getDiskInfo(diskNumber).mementoInfo.pinning.length === 0) {
			stacks[diskNumber] = 1;
			return stacks[diskNumber];
		}

		// get the highest tier of the pinned disks
		var highest = 0;
		$this.getDiskInfo(diskNumber).mementoInfo.pinning.forEach(function(
				number) {
			if (number === undefined) {
				$this.debug("wtf 2");
				highest = -1;
			} else {
				if (stacks[number] === undefined) {
					$this.getTier(number, stacks);
				}
				if (stacks[number] > highest) {
					highest = stacks[number];
				}
			}
		});
		stacks[diskNumber] = highest + 1;
		return stacks[diskNumber];

	};

	/**
	 * @param {Array}
	 *            diskNumbers
	 * @return {Array}
	 */
	this.getTopDisks = function(diskNumbers) {
		var first, second;
		for (first = 0; first < diskNumbers.length; first++) {
			for (second = first; second < diskNumbers.length; second++) {
				if ($this.isBelow(diskNumbers[first], diskNumbers[second])) {
					// 'removing ' + diskNumbers[first]
					// + " because it is below " + diskNumbers[second]);
					diskNumbers.splice(first, 1);

					first--;
					break;
				}
				if ($this.isAbove(diskNumbers[first], diskNumbers[second])) {
					// 'removing ' + diskNumbers[second]
					// + " because it is above " + diskNumbers[first]);
					diskNumbers.splice(second, 1);

					second--;
				}
			}
		}
		return diskNumbers;
	};

	this.getUnactivatedDisks = function(playerName) {
		var disks = [];
		// loop over all the disks
		$this
				.getDiskNumbers()
				.forEach(
						function(diskNumber) {
							if (playerName === $this.getDiskInfo(diskNumber).mementoInfo.player
									&& !$this.getDiskInfo(diskNumber).mementoInfo.activated
									&& $this.getDiskInfo(diskNumber).mementoInfo.pinnedBy.length === 0) {
								disks.push(diskNumber);
							}
						});
		return disks;
	};

	this.getWinners = function() {
		var playersWithDisks = {};

		// see if someone won
		$this.getDiskNumbers().forEach(
				function(diskNumber) {
					var diskInfo = $this.getDiskInfo(diskNumber);
					if (Object.keys(playersWithDisks).indexOf(
							diskInfo.mementoInfo.player) === -1) {
						playersWithDisks[diskInfo.mementoInfo.player] = 0;
					}
					playersWithDisks[diskInfo.mementoInfo.player]++;

				});

		// loop over reinforcement stacks
		Object
				.keys($this.memento.players)
				.forEach(
						function(playerName) {
							if ($this.getPlayerInfo(playerName).reinforcements.length > 0) {
								if (Object.keys(playersWithDisks).indexOf(
										playerName) === -1) {
									playersWithDisks[playerName] = 0;
								}
								playersWithDisks[playerName] += $this
										.getPlayerInfo(playerName).reinforcements.length;
							}
						});
		if (Object.keys(playersWithDisks).length <= 1) {
			return Object.keys(playersWithDisks);
		}
		return [];
	};

	/**
	 * check activation and pinned
	 */
	this.hasUnactivatedDisks = function(playerName) {
		var foundUADisk = false;
		$this.getDiskNumbers().some(
				function(diskNumber) {
					var diskInfo = $this.getDiskInfo(diskNumber);
					if (diskInfo.mementoInfo.player === playerName
							&& !diskInfo.mementoInfo.activated
							&& diskInfo.mementoInfo.pinnedBy.length === 0) {
						foundUADisk = true;
						return true;
					}
				});
		return foundUADisk;
	};

	this.isAbove = function(one, two) {
		if (parseInt(one, 10) === parseInt(two, 10)) {
			return false;
		}

		return $this.getDiskInfo(one).mementoInfo.pinning.some(function(n) {

			if (parseInt(n, 10) === parseInt(two, 10)) {
				// $this.debug(two + " is above " + n);
				return true;
			}
			if (n !== undefined) {
				return $this.isAbove(n, two);
			}
		});
	};

	/**
	 * @param {number}
	 *            one disk number
	 * @param {number}
	 *            two disk number
	 * @return {boolean} true if one is below two
	 */
	this.isBelow = function(one, two) {
		if (parseInt(one, 10) === parseInt(two, 10)) {
			return false;
		}

		return $this.getDiskInfo(one).mementoInfo.pinnedBy.some(function(n) {

			if (parseInt(n, 10) === parseInt(two, 10)) {
				// $this.debug(two + " is below " + n);
				return true;
			}
			if (n !== undefined) {
				return $this.isBelow(one, n);
			}
		});
	};

	/**
	 * @param {{mementoInfo:{location:Point},disk:Disk}}
	 *            one
	 * @param {{mementoInfo:{location:Point},disk:Disk}}
	 *            two
	 */
	this.isOverLapping = function(one, two) {
		// TODO 0

		// $this.debug('one.location:' + JSON.stringify(one.location));

		// $this.debug('two.location:' + JSON.stringify(two.location));

		var distance = new Point(one.mementoInfo.location.x,
				one.mementoInfo.location.y).distance(two.mementoInfo.location),
		//
		diameter = (parseFloat(one.disk.diameter) + parseFloat(two.disk.diameter)) / 2;

		// floating point representation issues
		if (parseFloat(distance.toFixed(10)) <= parseFloat(diameter.toFixed(10))) {
			return true;
		}
		return false;
	};

	this.isPinnedByEnemy = function(diskNumber) {
		if (diskNumber === null) {
			return false;
		}
		return $this.getDiskInfo(diskNumber).mementoInfo.pinnedBy
				.some(function(n) {
					return $this.getDiskInfo(n).mementoInfo.player !== $this
							.getDiskInfo(diskNumber).mementoInfo.player
							&& $this.getDiskInfo(n).disk.type === 'creature';
				});
	};

	this.isPinningEnemy = function(diskNumber) {
		if (diskNumber === null) {
			return false;
		}

		return $this.getDiskInfo(diskNumber).mementoInfo.pinning.some(function(
				n) {
			return $this.getDiskInfo(n).mementoInfo.player !== $this
					.getDiskInfo(diskNumber).mementoInfo.player
					&& $this.getDiskInfo(n).disk.type === 'creature';
		});
	};

	/**
	 * @param {Player}
	 *            player
	 * @param {string}
	 *            armyName
	 * @return {{success:boolean,messages:Array}}
	 */
	this.canJoin = function(player, armyName) {

		var result = {
			'success' : true,
			"messages" : []
		};

		if ($this.memento.segment !== 'JOIN') {
			// 0 pass this to the user
			result.messages
					.push("This table is no longer in the JOIN segment.");
			result.success = false;
		}

		var armyInfo = player.getArmyInfo(armyName);

		// check army size
		if (armyInfo.points > $this.maxPoints) {
			// 0 pass this to the user
			result.messages
					.push("This table's army point cap is lower then the size of this army.");
			result.success = false;
		}

		// check alignment restrictions
		if ($this.alignmentRestriction === 'Single'
				&& Object.keys(armyInfo.alignments).length > 2) {
			// 0 pass this to the user
			// $this.debug('single faction but more then 2');
			result.messages
					.push("This table is restricted to only single faction armies.");
			result.success = false;
		}

		if ($this.alignmentRestriction === 'Single'
				&& Object.keys(armyInfo.alignments).length == 2
				&& !armyInfo.alignments['Unaligned']) {
			// 0 pass this to the user
			// $this.debug('single faction but 2 and one is not unaligned');
			result.messages
					.push("This table is restricted to only single faction armies.");
			result.success = false;
		}

		if ($this.alignmentRestriction === 'Neutral'
				&& armyInfo.alignments['Good'] && armyInfo.alignments['Evil']) {
			// 0 pass this to the user
			// $this.debug('neutral faction allowed but has good and evil');
			result.messages
					.push("This table does not allow armies with both Good and Evil alignments.");
			result.success = false;
		}

		// get majority faction
		var factionPoints = armyInfo.factions[armyInfo.faction];

		// check faction restriction
		if (factionPoints / armyInfo.points < .5) {
			// pass this to the user
			// $this.debug('no majority faction');
			result.messages
					.push("All armies must have one faction that is half or more of the army.");
			result.success = false;
		}
		return result;
	};

	this.join = function(player, armyName) {

		var result = $this.canJoin(player, armyName);
		if (!result.success) {
			return result;
		}

		var playerName = player.name;

		var armyInfo = player.getArmyInfo(armyName);

		// $this.debug(JSON.stringify(armyInfo));

		// get majority faction
		var faction = armyInfo.faction;

		$this.playerOrder.push(playerName);
		if ($this.playerOrder.length === 1) {
			$this.memento.firstPlayer = playerName;
			$this.memento.currentPlayer = playerName;
		}

		$this.memento.players[playerName] = player;

		var stagingDisk = $this.getStagingDisk(playerName);
		if (faction !== null) {
			stagingDisk.disk.name = faction + " Staging";
		}

		var army = player.getArmy(armyName);

		Object.keys(army).forEach(function(i) {
			var diskInfo = player.getDiskInfo(army[i].diskNumber);

			$this.disks[diskInfo.disk.name] = diskInfo.disk;

			//
			if (diskInfo.disk.type === 'creature') {
				player.reinforcements.push(diskInfo.disk.name);
			} else if (diskInfo.disk.type === 'spell') {
				player.spells.push(diskInfo.disk.name);
			}
		});

		if (Object.keys($this.memento.players).length === parseInt(
				$this.maxPlayers, 10)) {
			$this.memento.segment = $this.SEGMENT.REINFORCEMENTS;
		}

		$this.placeReinforcements(playerName);

		// record join action
		$this.recordAction("join", [ playerName, armyName ]);
		return result;
	};

	/**
	 * @param {number}
	 *            movedDiskNumber
	 * @param {Point}
	 *            tableClickPoint
	 */
	this.move = function(playerName, movedDiskNumber, tableClickPoint) {
		// $this.debug("Table.move");
		// console.log(playerName);
		// console.log(movedDiskNumber);
		// console.log(tableClickPoint);

		// make sure we got an x and y
		if (typeof tableClickPoint === "undefined"
				|| typeof tableClickPoint.x === "undefined"
				|| typeof tableClickPoint.y === "undefined") {
			// $this.debug(1);
			return false;
		}

		// need to do this first so no one can activate 2 disks, move a third
		// disk but not activate it, then move/activate a fourth disk
		$this.activateMovedDisks(playerName, movedDiskNumber);

		var canMove = $this.canMove(playerName, movedDiskNumber);
		if (canMove !== true) {
			// $this.debug("Table.move canMove:" + canMove);
			return canMove;
		}

		var diskInfo = $this.getDiskInfo(movedDiskNumber);

		var currentLocation = new Point(diskInfo.mementoInfo.location.x,
				diskInfo.mementoInfo.location.y),
		//
		newLocation = currentLocation.getEdge(new Point(tableClickPoint.x,
				tableClickPoint.y),
				$this.getDiskInfo(movedDiskNumber).disk.diameter),
		//
		rotation = 0,
		//
		a;

		diskInfo.mementoInfo.flips++;

		if (diskInfo.mementoInfo.location.x === newLocation.x) // vertical
		{
			// $this.debug('vertical');
			if (newLocation.y === diskInfo.mementoInfo.location.y) {
				rotation = 0;
			} else if (newLocation.y > diskInfo.mementoInfo.location.y) {
				// going north (90)
				rotation = 90;
			} else {
				// going south (270)
				rotation = 270;
			}
		} else {
			a = (newLocation.y - diskInfo.mementoInfo.location.y)
					/ (newLocation.x - $this.getDiskInfo(movedDiskNumber).mementoInfo.location.x);
			rotation = Math.atan(a) * 180 / Math.PI;
		}

		diskInfo.mementoInfo.rotation += rotation * 2;

		diskInfo.mementoInfo.location = newLocation;

		// check to see if we are pinning a new disk
		var previouslyPinning = diskInfo.mementoInfo.pinning.slice();

		$this.stack(parseInt(movedDiskNumber, 10));

		var pinningNewDisk = false;

		// flying
		// make sure none of the disks that are now pinned are new
		diskInfo.mementoInfo.pinning
				.some(function(value) {
					// if we are pinning a new disk and
					if (previouslyPinning.indexOf(value) === -1
							&& (
							// they are both flying disks and enemies or
							($this.getDiskInfo(movedDiskNumber).disk.flying === true
									&& $this.getDiskInfo(value).disk.flying === true && $this
									.getDiskInfo(movedDiskNumber).mementoInfo.player !== $this
									.getDiskInfo(value).mementoInfo.player) ||
							// the moved disk is not a flying disk
							$this.getDiskInfo(movedDiskNumber).disk.flying === false)) {
						// then the moved disk needs to be activated
						pinningNewDisk = true;
						return true;
					}
				});

		// only call activateDisk once, so that we don't move out of activation
		// then try to activate again
		if (pinningNewDisk
				|| $this.getDiskInfo(movedDiskNumber).mementoInfo.flips >= $this
						.getDiskInfo(movedDiskNumber).disk.movement) {
			$this.activateDisk2(movedDiskNumber, playerName);
		}

		// record move action
		$this.recordAction("move", [ playerName, movedDiskNumber,
				tableClickPoint ]);
		return true;
	};

	// returns the tier we just resolved
	this.nextFight = function() {
		var nextAttacker = $this.getNextAttacker();

		if (nextAttacker.tier > 1) {
			$this.debug('nextAttacker:'
					+ $this.getDiskInfo(nextAttacker.attacker).disk.name + "("
					+ (nextAttacker.attacker) + ")(tier " + nextAttacker.tier
					+ ")");

			// only go to the next fight if we didn't get an error code
			// from this fight
			var attackResult = $this.attack(nextAttacker.attacker);
			$this.debug('attackResult:' + JSON.stringify(attackResult));
			if (attackResult >= 0) {
				return $this.nextFight();
			}
		}
		return nextAttacker.tier;
	};

	/**
	 * this function is used for bringing a disk into play from the
	 * reinforcement stack
	 * 
	 * @param {Disk}
	 *            disk
	 * @param {Point}
	 *            tableLocation
	 * @param {String}
	 *            playerName
	 */
	this.place = function(disk, tableLocation, playerName) {
		// $this.debug('Table.place');

		// $this.debug('memento:' + memento);

		var diskNumber = Object.keys($this.memento.diskInfo).length;

		$this.disks[disk.name] = disk;

		$this.memento.diskInfo[diskNumber] = {
			player : playerName,
			location : tableLocation,
			diskName : disk.name,
			pinning : [],
			pinnedBy : [],
			activated : false,
			flips : 0,
			rotation : 0,
			attacked : false,
			defended : false,
			carryOverDamage : 0,
			wounds : 0,
			attackee : null,
			defendee : null,
			reinforcement : true
		};
		$this.stack(diskNumber);
	};

	/**
	 * place the player's reinforcements on the table and remove those disks
	 * from their reinforcement stack
	 */
	this.placeReinforcements = function(playerName) {
		// $this.debug('Table.placeReinforcements');

		var reinforcementCount = $this.getReinforcementCount(playerName);

		var player = $this.getPlayerInfo(playerName);

		// chop the top of the reinforcement stack off
		var disks = player.reinforcements.splice(0, reinforcementCount);
		// reverse the order
		disks.reverse();

		var stagingDisk = $this.getStagingDisk(player.name);

		// find the angle from this player's staging disk to the center of the
		// board
		var angle = null;
		if (stagingDisk.location.x === 0) {
			if (stagingDisk.location.y > 0) {
				angle = 90 * TO_RADIANS;
			} else {
				angle = 270 * TO_RADIANS;
			}
		} else if (stagingDisk.location.y === 0) {
			if (stagingDisk.location.x > 0) {
				angle = 0 * TO_RADIANS;
			} else {
				angle = 180 * TO_RADIANS;
			}
		} else {
			// $this.debug(JSON.stringify(stagingDisk.location));

			angle = Math.atan(stagingDisk.location.y / stagingDisk.location.x);
		}

		// $this.debug('angle:' + angle);

		// place each disk on the table
		disks
				.forEach(function(diskName, diskNumber) {

					var diskInfo = {};
					diskInfo.disk = $this.disks[diskName];

					// find the right default location for this disk
					var angleOffset = Math.ceil(diskNumber / 2)
							* (360 / reinforcementCount)
							* (diskNumber % 2 === 0 ? 1 : -1) * TO_RADIANS;

					// $this.debug('angleOffset:' + angleOffset);

					var x = ((parseFloat(stagingDisk.disk.diameter) + parseFloat(diskInfo.disk.diameter)) / 2)
							* Math.cos(angle + angleOffset);
					var y = ((parseFloat(stagingDisk.disk.diameter) + parseFloat(diskInfo.disk.diameter)) / 2)
							* Math.sin(angle + angleOffset);

					// $this.debug('x:' + x);
					// $this.debug('y:' + y);

					var location = new Point(stagingDisk.location.x - x,
							stagingDisk.location.y - y);

					$this.place(diskInfo.disk, location, player.name);
				});

	};

	this.getStagingDisk = function(playerName) {
		return $this.stagingDisks[$this.playerOrder.indexOf(playerName)];
	};

	this.placeStagingDisks = function() {
		var i, name = "Staging", //
		type = "land", //
		attack = null, //
		defense = null, //
		toughness = null, //
		movement = null, //
		wounds = null, //
		flying = null, //
		swashbuckler = null, //
		archer = null, arrows = null, bolts = null, fireballs = null, boulders = null, missileImmunity = null, firstblow = null, spellcaster = null, limit = null, cost = null, //
		faction = null, //
		alignment = null, //
		diameter = 4, //
		description = null, //
		price = null, //

		// distance between each staging disk,
		// per Legion's "Tides of War" scenario
		stagingDistance = 18,
		//
		stagingDiameter = stagingDistance
				/ Math.sin(Math.PI / $this.maxPlayers),
		//
		x, y;

		if (parseInt($this.maxPlayers, 10) === 1) {
			stagingDiameter = 0;
		}

		for (i = 1; i <= $this.maxPlayers; i++) {
			x = Math.cos(Math.PI * 2 / $this.maxPlayers * i) * stagingDiameter;
			y = Math.sin(Math.PI * 2 / $this.maxPlayers * i) * stagingDiameter;

			$this.stagingDisks.push({
				disk : new Disk(name, type, attack, defense, toughness,
						movement, wounds, flying, swashbuckler, archer, arrows,
						bolts, fireballs, boulders, missileImmunity, firstblow,
						spellcaster, limit, cost, faction, alignment, diameter,
						description, price),
				location : new Point(x, y)
			});
		}
	};

	this.anyPlayersIn = function(segment) {
		var playersInSegment = false;
		Object.keys($this.memento.players).some(function(pName) {
			if ($this.getPlayerInfo(pName).segment === segment) {
				playersInSegment = true;
				return true;
			}
		});
		return playersInSegment;
	};

	/**
	 * used by API.createUnitTest and the replay functionality. Only call this
	 * after something has changed, ie, do not call this to record attempted and
	 * failed actions. This does create a memento except when methodName is
	 * "createTable"
	 * 
	 * @param methodName
	 * @param args
	 */
	this.recordAction = function(methodName, args) {
		$this.actions.push({
			"method" : methodName,
			"arguments" : args
		});

		if (methodName !== "createTable") {
			$this.addMemento();
		}
		$this.ai.go();
	};

	/**
	 * @param {number}
	 *            diskNumber
	 * @param {boolean=}
	 *            disregardMemento if true, then does not create a memento. if
	 *            false, creates memento
	 */
	this.remove = function(diskNumber, disregardMemento) {
		if (!disregardMemento) {
			$this.debug($this.getDiskInfo(diskNumber).disk.name + "("
					+ diskNumber + ") has been killed.");
		}

		// get the disks that are pinning this disk
		$this.getDiskInfo(diskNumber).mementoInfo.pinnedBy.forEach(function(
				pinningDisk) {

			// remove the disk from pinning
			$this.getDiskInfo(pinningDisk).mementoInfo.pinning.splice($this
					.getDiskInfo(pinningDisk).mementoInfo.pinning
					.indexOf(diskNumber), 1);
			if (!disregardMemento) {
				$this.debug($this.getDiskInfo(pinningDisk).disk.name + "("
						+ pinningDisk + ") is no longer pinning "
						+ $this.getDiskInfo(diskNumber).disk.name + "("
						+ diskNumber + ")");
			}

			$this.getDiskInfo(diskNumber).mementoInfo.pinning.forEach(function(
					pinnedDisk) {
				// remove the disk from pinnedBy

				$this.getDiskInfo(pinnedDisk).mementoInfo.pinnedBy.splice($this
						.getDiskInfo(pinnedDisk).mementoInfo.pinnedBy
						.indexOf(parseInt(diskNumber, 10)), 1);
				if (!disregardMemento) {
					$this.debug($this.getDiskInfo(pinnedDisk).disk.name + "("
							+ pinnedDisk + ") is no longer pinned by "
							+ $this.getDiskInfo(diskNumber).disk.name + "("
							+ diskNumber + ")");
				}

				var overlapping = $this.isOverLapping($this
						.getDiskInfo(pinningDisk), $this
						.getDiskInfo(pinnedDisk));
				if (overlapping) {
					// make sure we always use the same data type for
					// pinning and pinnedBy, either string or number
					if ($this.getDiskInfo(pinningDisk).mementoInfo.pinning
							.indexOf(pinnedDisk) === -1) {
						$this.getDiskInfo(pinningDisk).mementoInfo.pinning
								.push(pinnedDisk);
					}
					$this.getDiskInfo(pinnedDisk).mementoInfo.pinnedBy
							.push(pinningDisk);
					if (!disregardMemento) {
						$this.debug($this.getDiskInfo(pinningDisk).disk.name
								+ "(" + pinningDisk + ") is now pinning "
								+ $this.getDiskInfo(pinnedDisk).disk.name + "("
								+ pinnedDisk + ")");
					}
				}
			});
		});

		// get the disks that are pinned by this disk
		$this.getDiskInfo(diskNumber).mementoInfo.pinning.forEach(function(
				pinnedDisk) {

			if ($this.getDiskInfo(pinnedDisk).mementoInfo.pinnedBy
					.indexOf(parseInt(diskNumber, 10)) > -1) {
				// remove the disk from pinning
				$this.getDiskInfo(pinnedDisk).mementoInfo.pinnedBy.splice($this
						.getDiskInfo(pinnedDisk).mementoInfo.pinnedBy
						.indexOf(parseInt(diskNumber, 10)), 1);
				if (!disregardMemento) {
					$this.debug($this.getDiskInfo(pinnedDisk).disk.name + "("
							+ pinnedDisk + ") is no longer pinned by "
							+ $this.getDiskInfo(diskNumber).disk.name + "("
							+ diskNumber + ")");
				}
			}
		});

		// remove the disk from the table
		if (!disregardMemento) {
			$this.debug('removed ' + $this.getDiskInfo(diskNumber).disk.name
					+ "(" + diskNumber + ")");
		}

		$this.memento.diskInfo[diskNumber] = null;

		if (!disregardMemento) {
			$this.addMemento();
		}
	};

	this.removeActions = function() {
		// clear actions
		$this.actions.length = 0;
	};

	/**
	 * move disks, but keep them in the reinforcement stack
	 */
	this.saveReinforcement = function(playerName, diskNumber, location) {
		// validation
		if (!this.canReinforceTo(playerName, diskNumber, location)) {
			return false;
		}

		$this.slide(location, diskNumber);

		// record save reinforcements command
		$this.recordAction("saveReinforcement", [ playerName, diskNumber,
				location ]);

	};

	this.setAttackee = function(playerName, attacker, attackee) {
		$this.getDiskInfo(attacker).mementoInfo.attackee = attackee;
		if ($this.nextFight() <= 1) {
			$this.startRemoveCountersSegment();
		}

		$this.recordAction("setAttackee", [ playerName, attacker, attackee ]);
	};

	this.setDefendee = function(playerName, defender, defendee) {
		$this.getDiskInfo(defender).mementoInfo.defendee = defendee;
		if ($this.nextFight() <= 1) {
			$this.startRemoveCountersSegment();
		}

		$this.recordAction("setDefendee", [ playerName, defender, defendee ]);
	};

	this.setId = function(id) {
		this.id = id;
	};

	/**
	 * This function is used for sliding a disk that is already in play. It
	 * should also move the disk to the top of any stack it may be in at it's
	 * new location.
	 * 
	 * @param {Point}
	 *            location
	 * @param {number}
	 *            diskNumber
	 */
	this.slide = function(location, diskNumber) {
		// deep copy of the current diskInfo
		var mementoInfo = JSON.parse(JSON.stringify($this
				.getDiskInfo(diskNumber).mementoInfo));
		mementoInfo.pinning.length = 0;
		mementoInfo.pinnedBy.length = 0;
		$this.remove(diskNumber, true);
		// place the disk back on the table in the new location with the
		// same number
		mementoInfo.location = location;
		$this.memento.diskInfo[diskNumber] = mementoInfo;
		// move the disk to the top of the stack
		$this.stack(diskNumber);
	};

	/**
	 * @param {number}
	 *            movedDiskNumber the disk to "drop" on top of the rest of the
	 *            disks on the board.
	 */
	this.stack = function(movedDiskNumber) {
		// unpin previously pinned disks
		// loop over all the disks this disk was pinning
		$this.getDiskInfo(movedDiskNumber).mementoInfo.pinning
				.forEach(function(diskNumber) {

					// remove the entry from the pinned disk's pinning list
					var index = $this.getDiskInfo(diskNumber).mementoInfo.pinnedBy
							.indexOf(movedDiskNumber);
					$this.getDiskInfo(diskNumber).mementoInfo.pinnedBy.splice(
							index, 1);
				});
		$this.getDiskInfo(movedDiskNumber).mementoInfo.pinning.length = 0;

		// see if we are now pinning any disks
		var overlappingDisks = $this.getOverlappingDisks(parseInt(
				movedDiskNumber, 10));

		// remove disks that have an overlapping disk between the moved disk and
		// the overlapped disk
		overlappingDisks = $this.getTopDisks(overlappingDisks);

		// now that we've removed overlapping disks that are not actually
		// touching...
		overlappingDisks.forEach(function(loopDiskNumber) {
			// make sure we always use the same data type for pinning
			// and pinnedBy, either string or number
			$this.getDiskInfo(movedDiskNumber).mementoInfo.pinning
					.push(loopDiskNumber);
			$this.getDiskInfo(loopDiskNumber).mementoInfo.pinnedBy
					.push(movedDiskNumber);
		});
	};

	this.getSegment = function() {
		return $this.memento.segment;
	};

	this.startActivationSegment = function() {
		$this.debug("startActivationSegment");

		// toggle the reinforcement flag on any disks on the table
		$this.getDiskNumbers().forEach(function(diskNumber) {
			$this.getDiskInfo(diskNumber).mementoInfo.reinforcement = false;
		});

		this.memento.segment = $this.SEGMENT.ACTIVATION;
		this.memento.currentPlayer = $this.memento.firstPlayer;

		Object.keys($this.memento.players).forEach(function(player) {
			player.segment = $this.SEGMENT.ACTIVATION;
		});

		// skip players that have no disks available to activate
		while (!$this.hasUnactivatedDisks($this.getCurrentPlayer())) {
			$this.debug('skipping ' + $this.getCurrentPlayer());

			$this.getPlayerInfo($this.getCurrentPlayer()).segment = $this.SEGMENT.MISSILE;
			this.memento.currentPlayer = $this.getNextPlayer();
		}
	};

	this.startCombatSegment = function() {
		$this.debug("startCombatSegment");
		this.memento.segment = $this.SEGMENT.COMBAT;
		this.memento.currentPlayer = $this.memento.firstPlayer;
		Object.keys($this.memento.players).forEach(function(playerName) {
			$this.getPlayerInfo(playerName).segment = $this.SEGMENT.COMBAT;
		});

		// only move to the next segment if we resolved all the stacks to a
		// tier of 1
		if ($this.nextFight() <= 1) {
			$this.startRemoveCountersSegment();
		}
	};

	this.startMissileSegment = function() {
		$this.debug("startMissileSegment");

		this.memento.segment = $this.SEGMENT.MISSILE;
		this.memento.currentPlayer = $this.memento.firstPlayer;

		Object.keys($this.memento.players).forEach(function(playerName) {
			$this.getPlayerInfo(playerName).segment = $this.SEGMENT.MISSILE;

			// we're skipping players we're not supposed to, I think
			if (!$this.hasUnactivatedArcherDisks(playerName)) {
				$this.debug('moving ' + playerName + ' to COMBAT');
				$this.getPlayerInfo(playerName).segment = $this.SEGMENT.COMBAT;
			}
		});

		// if all players are past the missile segment then start combat
		if (!$this.anyPlayersIn($this.SEGMENT.MISSILE)) {
			$this.debug('moving table to COMBAT');
			$this.startCombatSegment();
		}
		// if at least one player is still in missile
		else {
			// find the first player still in the missile segment
			// skip players that have no archer disks to shoot with
			while (!$this.hasUnactivatedArcherDisks($this.getCurrentPlayer())) {
				$this.memento.currentPlayer = $this.getNextPlayer();
				$this.debug('moved currentPlayer to '
						+ $this.memento.currentPlayer);
			}
		}
	};

	this.startReinforcementSegment = function() {
		$this.debug("startReinforcementSegment");
		this.memento.segment = $this.SEGMENT.REINFORCEMENTS;

		this.round = parseInt($this.round, 10) + 1;

		this.memento.currentPlayer = $this.memento.firstPlayer;
		Object
				.keys($this.memento.players)
				.forEach(
						function(playerName) {
							$this.getPlayerInfo(playerName).segment = $this.SEGMENT.REINFORCEMENTS;

							// check if the player has any reinforcements and
							// react accordingly
							if ($this.getPlayerInfo(playerName).reinforcements.length === 0) {
								$this.getPlayerInfo(playerName).segment = $this.SEGMENT.ACTIVATION;
							} else {
								// place reinforcements in default location
								$this.placeReinforcements(playerName);
							}
						});

		// check if we need to immediately go to the next segment
		if (!$this.anyPlayersIn($this.SEGMENT.REINFORCEMENTS)
				&& Object.keys($this.memento.players).length === parseInt(
						$this.maxPlayers, 10)) {
			$this.startActivationSegment();
		}
	};

	this.startRemoveCountersSegment = function() {
		$this.debug("startRemoveCountersSegment");
		this.memento.segment = $this.SEGMENT.REMOVE_COUNTERS;

		$this.getDiskNumbers().forEach(function(diskNumber) {
			// clear carryoverdamage
			// clear attacked and defended flags
			$this.getDiskInfo(diskNumber).mementoInfo.carryOverDamage = 0;
			$this.getDiskInfo(diskNumber).mementoInfo.attacked = false;
			$this.getDiskInfo(diskNumber).mementoInfo.defended = false;
			$this.getDiskInfo(diskNumber).mementoInfo.flips = 0;
			$this.getDiskInfo(diskNumber).mementoInfo.activated = false;
			$this.getDiskInfo(diskNumber).mementoInfo.attackee = null;
			$this.getDiskInfo(diskNumber).mementoInfo.defendee = null;

			// remove missiles and spells from the board
			if ($this.getDiskInfo(diskNumber).disk.type === 'missile') {
				$this.remove(diskNumber, true);
			}

		});

		Object
				.keys($this.memento.players)
				.forEach(
						function(playerName) {
							$this.getPlayerInfo(playerName).segment = $this.SEGMENT.REMOVE_COUNTERS;
						});

		// move the firstPlayer
		this.memento.firstPlayer = $this.getNextPlayer();
		this.memento.currentPlayer = $this.memento.firstPlayer;

		var winners = $this.getWinners();

		if (winners.length > 0 || $this.getDiskNumbers().length === 0) {
			this.memento.segment = $this.SEGMENT.FINISHED;
		}

		if ($this.memento.segment !== $this.SEGMENT.FINISHED) {
			$this.startReinforcementSegment();
		}
	};

	/**
	 * 
	 */
	this.stringify = function(excludedKeys) {
		return JSON.stringify($this, function(key, value) {
			// $this.debug("typeof " + key + ":" + typeof key);
			// $this.debug("typeof value" + ":" + typeof value);
			if (typeof value === "function"
					|| (typeof excludedKeys !== "undefined"
							&& excludedKeys !== null && excludedKeys
							.indexOf(key) !== -1)) {
				// $this.debug("not including " + key);
				return undefined;
			}
			// $this.debug("including " + key);
			return value;

		});
	};

	this.restoreMemento = function(memento) {
		$this.memento = memento;
	};

	/**
	 * @param {Object}
	 *            table
	 * @return {number} flag indicating success or error code
	 */
	this.restore = function(table) {
		// $this.debug('Table.update');
		// $this.debug(JSON.stringify(table));

		if (table === undefined) {
			return -1;
		}
		if (table === null) {
			return -2;
		}

		// future proof
		Object.keys(table).forEach(function(key) {
			$this[key] = table[key];
		});

		// $this.restoreMemento(table.memento);

		return 0;
	};

	// record table creation command
	$this.recordAction("createTable", [ maxPlayers, maxPoints, activations,
			startingDisks, reinforcements, alignmentRestriction, scenario ]);
}