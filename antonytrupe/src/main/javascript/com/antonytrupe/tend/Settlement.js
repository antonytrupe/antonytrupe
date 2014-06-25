goog.provide('com.antonytrupe.tend.Settlement');

/**
 * @constructor
 * @param name
 * @param level
 * @param cost
 * @returns
 */
function Settlement(name, level, cost) {
	"use strict";
	var $this = this;
	$this.level = level;
	$this.cost = cost;
	$this.name = name;
	this.getUpgradeCost = function(to) {
		var cost = {};
		// console.log(to.cost);
		// console.log($this.cost);
		for ( var key in to.cost) {
			cost[key] = to.cost[key] - $this.cost[key];
		}
		return cost;
	};

	function escape() {
		return "{\\\"name\\\":\\\"" + $this.name() + "\\\"}";
	}

	function reduce() {
		return reduce(Settlement.NONE);
	}

	function reduce(minimum) {
		var o = $this.ordinal();
		if (o < minimum.ordinal()) {
			o = minimum.ordinal();
		}
		var df = Settlement.values();
		return df[o];
	}

	function serialize() {
		var sb = new StringBuilder();
		sb.append("{\"name\":\"").append($this.name()).append("\",");
		sb.append("\"size\":").append($this.size).append(",");
		sb.append("\"cost\":{");
		var trim = false;
		for ( var entry in $this.cost.entrySet()) {
			trim = true;
			sb.append("\"").append(entry.getKey()).append("\":").append(entry.getValue()).append(",");
		}
		if (trim) {
			sb.deleteCharAt(sb.length() - 1);
		}
		sb.append("}}");

		return sb.toString();
	}

}

Settlement.NONE = new Settlement("NONE", 0, {
	"FOOD" : 0,
	"CONSTRUCTION" : 0,
	"CLOTHING" : 0,
	"LUXURY" : 0
});
Settlement[0] = Settlement.NONE;

Settlement.HAMLET = new Settlement("HAMLET", 1, {
	"FOOD" : 1,
	"CONSTRUCTION" : 1,
	"CLOTHING" : 1,
	"LUXURY" : 0
});
Settlement[1] = Settlement.HAMLET;

// 10 10 9 1
Settlement.VILLAGE = new Settlement("VILLAGE", 2, {
	"FOOD" : 20,
	"CONSTRUCTION" : 20,
	"CLOTHING" : 20,
	"LUXURY" : 1
});
Settlement[2] = Settlement.VILLAGE;

// 50 50 40 20
Settlement.TOWN = new Settlement("TOWN", 3, {
	"FOOD" : 50,
	"CONSTRUCTION" : 50,
	"CLOTHING" : 40,
	"LUXURY" : 20
});
Settlement[3] = Settlement.TOWN;

// 200, 200, 80, 50
Settlement.CITY = new Settlement("CITY", 4, {
	"FOOD" : 200,
	"CONSTRUCTION" : 200,
	"CLOTHING" : 200,
	"LUXURY" : 50
});
Settlement[4] = Settlement.CITY;

// 400, 300, 300, 300
Settlement.METROPOLIS = new Settlement("METROPOLIS", 5, {
	"FOOD" : 400,
	"CONSTRUCTION" : 300,
	"CLOTHING" : 300,
	"LUXURY" : 300
});
Settlement[5] = Settlement.METROPOLIS;

Object.seal(Settlement);