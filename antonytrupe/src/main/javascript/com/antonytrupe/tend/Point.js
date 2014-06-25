goog.provide('com.antonytrupe.tend.Point');

/**
 * @constructor
 * @param _r
 * @param _g
 * @param _b
 * @returns
 */
function Point(_r, _g, _b) {
	"use strict";
	this.r = _r, this.g = _g, this.b = _b;
	var $this = this;

	Point.fromXY = function(x_in, y_in, s) {
		var point = new Point();
		var _x = x_in - 1 + Math.sqrt(3) / 2 * s;
		var _y = y_in - 1;
		point.r = Math.round((Math.sqrt(3) / 3 * _x - _y / 3) / s);
		point.b = Math.round(2 / 3 * _y / s);
		point.g = -point.r - point.b;
		return point;
	};

	Point.fromString = function(s) {
		var ps = JSON.parse(s);
		var point = new Point();
		point.r = ps.r;
		point.b = ps.b;
		point.g = ps.g;
		return point;
	};

	this.x = function(s) {
		return Math.sqrt(3) * s * ($this.b / 2 + $this.r) - Math.sqrt(3) / 2 * s + 1;
	};

	this.y = function(s) {
		return 3 / 2 * s * this.b + 1;
	};

	this.nw = function() {
		return new Point($this.r, $this.g + 1, $this.b - 1);
	};

	this.ne = function() {
		return new Point($this.r + 1, $this.g, $this.b - 1);
	};

	this.e = function() {
		return new Point($this.r + 1, $this.g - 1, $this.b);
	};

	this.se = function() {
		return new Point($this.r, $this.g - 1, $this.b + 1);
	};

	this.sw = function() {
		return new Point($this.r - 1, $this.g, $this.b + 1);
	};

	this.w = function() {
		return new Point($this.r - 1, $this.g + 1, $this.b);
	};

	this.isValid = function() {
		return $this.r + $this.b + $this.g === 0;
	};

	this.isCenter = function() {
		return $this.isValid() && Math.abs($this.r - $this.g) % 3 === 0;
	};

	this.isAdjacent = function(that) {
		return $this.distance(that) === 1;
	};

	function toString() {
		return $this.stringify();
	}

	this.distance = function(that) {
		return (Math.abs($this.r - that.r) + Math.abs($this.b - that.b) + Math.abs($this.g - that.g)) / 2;
	};

	this.stringify = function() {
		return JSON.stringify($this);
	};
}