goog.provide('com.antonytrupe.tend.ResourceGroup');

/**
 * @constructor
 */
function ResourceGroup(args) {
	"use strict";
	this.name = args.name;
	this.one = args.one;

	this.two = args.two;
	this.three = args.three;
	this.color = args.color;
	this.populationSupport = args.populationSupport;
	this.populationLimit = args.populationLimit;

	this.escape = function() {
		return "{\\\"name\\\":\\\"" + this.name + "\\\",\\\"one\\\":" + this.one + ",\\\"two\\\":" + this.two + ",\\\"three\\\":" + this.three + "}";
	};

	function nextInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	this.get = function(level) {
		/*
		 * see if they get a calamity instead
		 */switch (level) {
		case 1:
			if (nextInt(this.one.calamityOdds) == this.one.calamityOdds - 1) {
				return this.one.getCalamity();
				/*
				 * // return this.one;
				 */}
			return this.one;

		case 2:
			if (nextInt(this.two.calamityOdds) == this.two.calamityOdds - 1) {
				return this.two.getCalamity();
			}
			return this.two;

		case 3:
			if (nextInt(this.three.calamityOdds) == this.three.calamityOdds - 1) {
				return this.three.getCalamity();
			}
			return this.three;

		}
		throw new RuntimeException("invalid resource level " + level + " for ResourceGroup " + this.toString());
	};

	this.toString = function() {
		return "{\"name\":\"" + this.name + "\",\"one\":\"" + this.one + "\",\"two\":\"" + this.two + "\"" + ",\"three\":\"" + this.three +
		/*
		 * //
		 */"\",\"color\":\"" + this.color + "\"" +
		/*
		 * //
		 */"}";
	};

}
/**
 * // gold
 */
ResourceGroup.FIELD = new ResourceGroup({
	"name" : "FIELD",
	"one" : Resource.WHEAT,
	"two" : Resource.FLOUR,
	"three" : Resource.BREAD,
	"color" : "Gold",
	"populationSupport" : "8",
	"populationLimit" : "21"
});
ResourceGroup[0] = ResourceGroup.FIELD;
/*
 * // greenyellow
 */ResourceGroup.PASTURE = new ResourceGroup({
	"name" : "PASTURE",
	"one" : Resource.FLEECE,
	"two" : Resource.WOOL,
	"three" : Resource.CLOTH,
	"color" : "GreenYellow",
	"populationSupport" : 7,
	"populationLimit" : 21
});
ResourceGroup[1] = ResourceGroup.PASTURE;

/*
 * // purple
 */ResourceGroup.VINEYARD = new ResourceGroup({
	"name" : "VINEYARD",
	"one" : Resource.GRAPES,
	"two" : Resource.RAISINS,
	"three" : Resource.WINE,
	"color" : "Purple",
	"populationSupport" : 6,
	"populationLimit" : 14
});
ResourceGroup[2] = ResourceGroup.VINEYARD;

/*
 * //
 */ResourceGroup.QUARRY = new ResourceGroup({
	"name" : "QUARRY",
	"one" : Resource.STONE,
	"two" : Resource.BRONZE,
	"three" : Resource.IRON,
	"color" : "DarkGray",
	"populationSupport" : 0,
	"populationLimit" : 0
});
ResourceGroup[3] = ResourceGroup.QUARRY;

/*
 * // silver
 */ResourceGroup.MINE = new ResourceGroup({
	"name" : "MINE",
	"one" : Resource.COPPER,
	"two" : Resource.TIN,
	"three" : Resource.BRONZE,
	"color" : "Silver",
	"populationSupport" : 1,
	"populationLimit" : 1
});
ResourceGroup[4] = ResourceGroup.MINE;

/*
 * // brown
 */ResourceGroup.MOUNTAIN = new ResourceGroup({
	"name" : "MOUNTAIN",
	"one" : Resource.SILVER,
	"two" : Resource.GEMS,
	"three" : Resource.GOLD,
	"color" : "#A52A2A",
	"populationSupport" : 2,
	"populationLimit" : 2
});
ResourceGroup[5] = ResourceGroup.MOUNTAIN;

/*
 * // darkgreen
 */ResourceGroup.FOREST = new ResourceGroup({
	"name" : "FOREST",
	"one" : Resource.FUR,
	"two" : Resource.LUMBER,
	"three" : Resource.JERKEY,
	"color" : "DarkGreen",
	"populationSupport" : 5,
	"populationLimit" : 14
});
ResourceGroup[6] = ResourceGroup.FOREST;

/*
 * // navyblue
 */ResourceGroup.WATER = new ResourceGroup({
	"name" : "WATER",
	"one" : Resource.FISH,
	"two" : Resource.SALT,
	"three" : Resource.PEARL,
	"color" : "#008",
	"populationSupport" : 3,
	"populationLimit" : 3
});
ResourceGroup[7] = ResourceGroup.WATER;

/*
 * //
 */ResourceGroup.HILLS = new ResourceGroup({
	"name" : "HILLS",
	"one" : Resource.CLAY,
	"two" : Resource.HIDES,
	"three" : Resource.BRICK,
	"color" : "#810",
	"populationSupport" : 4,
	"populationLimit" : 14
});
ResourceGroup[8] = ResourceGroup.HILLS;

/*
 * //
 */ResourceGroup.DESERT = new ResourceGroup({
	"name" : "DESERT",
	"one" : null,
	"two" : null,
	"three" : null,
	"color" : "tan",
	"populationSupport" : null,
	"populationLimit" : null
});
ResourceGroup[9] = ResourceGroup.DESERT;