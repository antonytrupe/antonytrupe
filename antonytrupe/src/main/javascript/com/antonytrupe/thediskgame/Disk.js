/**
 * @constructor
 * @class
 * @param {string}
 *            name
 * @param {string}
 *            type
 * @param attack
 * @param defense
 * @param toughness
 * @param movement
 * @param wounds
 * @param flying
 * @param swashbuckler
 * @param archer
 * @param arrows
 * @param bolts
 * @param fireballs
 * @param boulders
 * @param missileImmunity
 * @param firstblow
 * @param spellcaster
 * @param limit
 * @param cost
 * @param faction
 * @param alignment
 * @param diameter
 * @param description
 * @param price
 */
function Disk(name, type, attack, defense, toughness, movement, wounds, flying,
		swashbuckler, archer, arrows, bolts, fireballs, boulders,
		missileImmunity, firstblow, spellcaster, limit, cost, faction,
		alignment, diameter, description, price) {
	"use strict";
	var $this = this;
	$this.name = name;
	$this.type = type;
	$this.attack = attack;
	$this.defense = defense;
	$this.toughness = toughness;
	$this.movement = movement;
	$this.wounds = wounds;
	$this.flying = flying;
	$this.swashbuckler = swashbuckler;
	$this.missileImmunity = missileImmunity;
	$this.firstblow = firstblow;
	$this.archer = archer;
	$this.arrows = arrows;
	$this.bolts = bolts;
	$this.fireballs = fireballs;
	$this.boulders = boulders;
	$this.spellcaster = spellcaster;
	$this.limit = limit;
	$this.cost = cost;
	$this.faction = faction;
	$this.alignment = alignment;
	$this.diameter = diameter;
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