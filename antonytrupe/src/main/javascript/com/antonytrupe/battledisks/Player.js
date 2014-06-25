/**
 * @constructor
 * @param {?string=}
 *            name
 */
function Player(name) {
	"use strict";
	var $this = this;
	this.name = name;
	this.rating = 0.0;

	// {"diskName": diskInfo,...}
	this.disks = {};

	// {diskNumber:{location:{},"diskName":""},...}
	this.diskLocations = {};

	// reinforcements is only used when in a table
	this.reinforcements = [];
	// only used in the context of a game
	this.spells = [];

	// segment is only used when in a table
	this.segment = "REINFORCEMENTS";
	this.activations = 0;

	// {"armyName": {"diskNumber":location,...},...}
	this.armies = {};
	this.cart = {};

	// this.activeTables = {};

	/**
	 * @param {Disk}
	 *            disk
	 * @param {Point=}
	 *            location
	 */
	this.addDisk = function(disk, location) {

		if (location === undefined) {
			location = new Point(0, 0);
		}

		var diskNumber = Object.keys($this.diskLocations).length;

		$this.diskLocations[diskNumber] = {
			"location" : location,
			"diskName" : disk.name
		};
		$this.disks[disk.name] = disk;
		return diskNumber;
	};

	/**
	 * @param {string}
	 *            armyName
	 * @param {number}
	 *            diskNumber
	 * @param {Point=}
	 *            location
	 */
	this.addDiskToArmy = function(armyName, diskNumber, location) {
		// $this.debug('Player.addDiskToArmy');
		// $this.debug('diskNumber:' + diskNumber);
		// $this.debug('armyName:' + armyName);

		// make sure this disk is not already in this army
		if ($this.diskIsInArmy(diskNumber, armyName)) {
			return;
		}

		location = (location === undefined ? $this.diskLocations[diskNumber].location : location);
		if ($this.armies[armyName] === undefined) {
			$this.armies[armyName] = [];
		}

		var index = $this.armies[armyName].length;

		$this.armies[armyName][index] = {
			"diskNumber" : diskNumber,
			"location" : location
		};
	};

	this.getArmies = function() {
		return Object.keys($this.armies);
	};

	/**
	 * @param {string}
	 *            armyName
	 * @return {{points:number,faction:string,factions,alignments}}
	 */
	this.getArmyInfo = function(armyName) {

		var points = 0;
		var factions = {};
		var alignments = {};

		// $this.debug('armyName:' + armyName);

		Object.keys($this.armies[armyName]).forEach(function(order) {
			// armyDisks
			// $this.debug('order:' + order);
			// $this.debug('$this.armies[armyName][order]:' +
			// $this.armies[armyName][order]);
			var armyDiskInfo = $this.armies[armyName][order];
			var diskInfo = $this.getDiskInfo(armyDiskInfo.diskNumber, armyName);
			points += parseInt(diskInfo.disk.cost, 10);
			if (!factions[diskInfo.disk.faction]) {
				factions[diskInfo.disk.faction] = 0;
			}
			factions[diskInfo.disk.faction] += parseInt(diskInfo.disk.cost, 10);

			if (!alignments[diskInfo.disk.alignment]) {
				alignments[diskInfo.disk.alignment] = 0;
			}
			alignments[diskInfo.disk.alignment] += parseInt(diskInfo.disk.cost, 10);

		});

		// get majority faction
		var faction = null;
		var factionPoints = 0;

		Object.keys(factions).forEach(function(f) {
			if (factions[f] > factionPoints) {
				factionPoints = factions[f];
				faction = f;
			}
		});

		return {
			"points" : points,
			"factions" : factions,
			"alignments" : alignments,
			'faction' : faction
		};
	};

	this.move = function(diskNumber, location, armyName) {
		// console.log('Player.move');
		// console.log(armyName);

		if (armyName !== undefined && armyName !== null) {
			$this.armies[armyName].some(function(armyDiskInfo, index) {
				// console.log(armyName);
				// console.log(index);
				// console.log(armyDiskInfo);

				if (armyDiskInfo.diskNumber == diskNumber) {
					// console.log('moving disk ' + diskNumber + ' in army ' +
					// armyName);
					armyDiskInfo.location = location;
					return true;
				}
			});
		} else {
			// console.log(diskNumber);
			$this.diskLocations[diskNumber].location = location;
		}
	};

	this.getArmy = function(armyName) {
		// console.log('Player.getArmy');
		// console.log(armyName);
		if (armyName === "" || armyName === null || $this.armies[armyName] === undefined) {
			return {};
		}
		return $this.armies[armyName];

	};

	this.getDiskNumbers = function() {
		return Object.keys($this.diskLocations);
	};

	this.diskIsInArmy = function(diskNumber, armyName) {
		if ($this.armies[armyName] === undefined) {
			return false;
		}
		return $this.armies[armyName].some(function(armyDiskInfo, index) {
			if (armyDiskInfo.diskNumber == diskNumber) {
				return true;
			}
		});
	};

	/**
	 * @param {number}
	 *            diskNumber
	 * @param {string=}
	 *            armyName
	 */
	this.getDiskInfo = function(diskNumber, armyName) {
		// console.log('Player.getDiskInfo');
		// console.log(diskNumber);
		// console.log(armyName);
		var info = {};

		// console.log($this.disks);

		info.disk = $this.disks[$this.diskLocations[diskNumber].diskName];
		info.location = $this.diskLocations[diskNumber].location;

		// console.log(info);

		if (armyName !== undefined && $this.armies[armyName] !== undefined && $this.armies[armyName] !== null) {
			// console.log($this.armies[armyName]);
			$this.armies[armyName].forEach(function(armyInfo, index) {
				// console.log(index);
				if (armyInfo.diskNumber == diskNumber) {
					// console.log('using army ' + armyName + ' location for ' +
					// diskNumber);
					info.location = armyInfo.location;
				}
			});
		}

		return info;
	};

	this.removeDiskFromArmy = function(armyName, diskNumber) {
		// console.log(armyName);

		if (armyName !== undefined && armyName !== null) {
			$this.armies[armyName].some(function(armyDiskInfo, index) {
				if (armyDiskInfo.diskNumber == diskNumber) {
					$this.armies[armyName].splice(index, 1);
					return true;
				}
			});
		}
	};

	this.setRating = function(rating) {
		$this.rating = rating;
	};

	this.saveArmy = function(armyName, armyDiskNumbers) {
		$this.debug('Player.saveArmy');
		$this.armies[armyName] = armyDiskNumbers;
	};

	this.deleteArmy = function(armyName) {
		// $this.debug('Player.saveArmy');
		delete $this.armies[armyName];
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

	this.getName = function() {
		return $this.name;
	};

	this.saveCart = function(cart) {
		$this.cart = cart;
	};

	this.setName = function(n) {
		$this.name = n;
	};

	this.stringify = function() {
		return JSON.stringify($this);
	};

	/**
	 * 
	 * @param {Object}
	 *            result
	 * @returns
	 */
	this.update = function(result) {
		if (result === undefined) {
			return -1;
		}
		if (result === null) {
			return -2;
		}

		if (result.disks === undefined) {
			return -3;
		}

		if (result.disks === null) {
			return -4;
		}

		// future proof
		Object.keys(result).forEach(function(key) {
			$this[key] = result[key];
		});

		return $this;
	};
}