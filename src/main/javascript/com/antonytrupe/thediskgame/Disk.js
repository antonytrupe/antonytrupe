/**
 * @constructor
 * @class
 * @param {string}
 *            name
 * @param {string}
 *            type
 * @param {Number}
 *            attack
 * @param {Number}
 *            defense
 * @param {Number}
 *            toughness
 * @param {Number}
 *            movement
 * @param {Number}
 *            wounds
 * @param {boolean}
 *            flying
 * @param {boolean}
 *            swashbuckler
 * @param {boolean}
 *            archer
 * @param {Number}
 *            arrows
 * @param {Number}
 *            bolts
 * @param {Number}
 *            fireballs
 * @param {Number}
 *            boulders
 * @param {boolean}
 *            missileImmunity
 * @param {boolean}
 *            firstblow
 * @param {boolean}
 *            spellcaster
 * @param {Number}
 *            limit
 * @param {Number}
 *            cost
 * @param {string}
 *            faction
 * @param {string}
 *            alignment
 * @param {Number}
 *            diameter
 * @param {string}
 *            description
 * @param {Number}
 *            price
 */
function Disk(name, type, attack, defense, toughness, movement, wounds, flying,
		swashbuckler, archer, arrows, bolts, fireballs, boulders,
		missileImmunity, firstblow, spellcaster, limit, cost, faction,
		alignment, diameter, description, price) {
	"use strict";
	var $this = this;
	$this.name = name;
	$this.type = type || 'creature';
	$this.attack = attack || 3;
	$this.defense = defense || 3;
	$this.toughness = toughness || 3;
	$this.movement = movement || 3;
	$this.wounds = wounds || 1;
	$this.flying = flying || false;
	$this.swashbuckler = swashbuckler || false;
	$this.missileImmunity = missileImmunity || false;
	$this.firstblow = firstblow || false;
	$this.archer = archer || false;
	$this.arrows = arrows || 0;
	$this.bolts = bolts || 0;
	$this.fireballs = fireballs;
	$this.boulders = boulders;
	$this.spellcaster = spellcaster;
	$this.limit = limit || 0;
	$this.cost = cost;
	$this.faction = faction || 'Unaligned';
	$this.alignment = alignment || 'Neutral';
	$this.diameter = diameter || 2;
	$this.description = description;
	$this.price = price;

	$this.getName = function() {
		return $this.name;
	};

	$this.setName = function(n) {
		$this.name = n;
	};

	$this.stringify = function() {
		return JSON.stringify($this);
	};

	/**
	 * @param {Object}
	 *            result
	 * @returns {Disk|number}
	 */
	$this.update = function(result) {
		if (result === undefined) {
			return -1;
		}
		if (result === null) {
			return -2;
		}

		// future proof
		Object.keys(result).forEach(function(key) {
			$this[key] = result[key];
		});

		return $this;
	};
}