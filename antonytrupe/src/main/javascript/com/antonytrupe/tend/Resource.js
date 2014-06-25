goog.provide('com.antonytrupe.tend.Resource');

var Category = {
	FOOD : {
		name : "FOOD"
	},
	CONSTRUCTION : {
		name : "CONSTRUCTION"
	},
	CLOTHING : {
		name : "CLOTHING"
	},
	LUXURY : {
		name : "LUXURY"
	},
	CALAMITY : {
		name : "CALAMITY"
	}
};

/**
 * @constructor
 * @param name
 * @param baseValue
 * @param category
 * @returns
 */
function Resource(name, baseValue, category) {
	"use strict";
	this.name = name;
	this.baseValue = baseValue;
	this.category = category;

	// var calamityOdds = 9 - this.baseValue + 10;

	function escape() {
		return "{\\\"name\\\":\\\"" + this.name() + "\\\",\\\"baseValue\\\":" + this.baseValue + ",\\\"category\\\":\\\"" + this.category + "\\\"}";
	}

	function getCalamity() {
		switch (this.baseValue) {
		case 1:
			return this;
		case 2:
			return Resource.EARTHQUAKE;
		case 3:
			return Resource.FAMINE;
		case 4:
			return Resource.CIVIL_WAR;
		case 5:
			return Resource.FLOOD;
		case 6:
			return Resource.EPIDEMIC;
		case 7:
			return Resource.CIVIL_DISORDER;
		case 8:
			return Resource.ICONOCLASM;
		case 9:
			return Resource.PIRACY;
		default:
			/*
			 * // invalid level calamity
			 */
			throw new RuntimeException("invalid calamity level");
		}

	}

	this.getValue = function(count) {
		return this.baseValue * count * count;
	};

	function serialize() {
		return "{\"name\":\"" + this.name() + "\"," +
		/*
		 * //
		 */"\"baseValue\":" + this.baseValue + "," +
		/*
		 * //
		 */"\"category\":\"" + this.category + "\"}";
	}

}

/*
 * // food
 */
Resource.WHEAT = new Resource('WHEAT', 1, Category.FOOD);
Resource.GRAPES = new Resource('GRAPES', 3, Category.FOOD);
Resource.FISH = new Resource('FISH', 3, Category.FOOD);
Resource.SHEEP = new Resource('SHEEP', 3, Category.FOOD);
Resource.RAISINS = new Resource('RAISINS', 4, Category.FOOD);
Resource.FLOUR = new Resource('FLOUR', 5, Category.FOOD);
Resource.BREAD = new Resource('BREAD', 9, Category.FOOD);
Resource.JERKEY = new Resource('JERKEY', 9, Category.FOOD);
/*
 * // clothing
 */Resource.FUR = new Resource('FUR', 1, Category.CLOTHING);
Resource.FLEECE = new Resource('FLEECE', 2, Category.CLOTHING);
Resource.WOOL = new Resource('WOOL', 6, Category.CLOTHING);
Resource.HIDES = new Resource('HIDES', 6, Category.CLOTHING);
Resource.CLOTH = new Resource('CLOTH', 9, Category.CLOTHING);
/*
 * // construction
 */Resource.STONE = new Resource('STONE', 1, Category.CONSTRUCTION);
Resource.CLAY = new Resource('CLAY', 2, Category.CONSTRUCTION);
Resource.COPPER = new Resource('COPPER', 3, Category.CONSTRUCTION);
Resource.LUMBER = new Resource('LUMBER', 4, Category.CONSTRUCTION);
Resource.IRON = new Resource('IRON', 6, Category.CONSTRUCTION);
Resource.TIN = new Resource('TIN', 6, Category.CONSTRUCTION);
Resource.BRONZE = new Resource('BRONZE', 7, Category.CONSTRUCTION);
Resource.BRICK = new Resource('BRICK', 8, Category.CONSTRUCTION);
/*
 * // luxury
 */Resource.SILVER = new Resource('SILVER', 1, Category.LUXURY);
Resource.SALT = new Resource('SALT', 4, Category.LUXURY);
Resource.GEMS = new Resource('GEMS', 5, Category.LUXURY);
Resource.WINE = new Resource('WINE', 7, Category.LUXURY);
Resource.PEARL = new Resource('PEARL', 7, Category.LUXURY);
Resource.GOLD = new Resource('GOLD', 8, Category.LUXURY);

/*
 * // calamities
 */Resource.EARTHQUAKE = new Resource('EARTHQUAKE', 4, Category.CALAMITY);
Resource.FAMINE = new Resource('FAMINE', 5, Category.CALAMITY);
Resource.CIVIL_WAR = new Resource('CIVIL_WAR', 6, Category.CALAMITY);
Resource.FLOOD = new Resource('FLOOD', 6, Category.CALAMITY);
Resource.EPIDEMIC = new Resource('EPIDEMIC', 7, Category.CALAMITY);
Resource.CIVIL_DISORDER = new Resource('CIVIL_DISORDER', 7, Category.CALAMITY);
Resource.ICONOCLASM = new Resource('ICONOCLASM', 8, Category.CALAMITY);
Resource.PIRACY = new Resource('PIRACY', 8, Category.CALAMITY);
/*
 * // other
 */Resource.OCHRE = new Resource('OCHRE', 0, null);
Resource.PAPYRUS = new Resource('PAPYRUS', 0, null);