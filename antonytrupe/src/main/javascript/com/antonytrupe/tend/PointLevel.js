goog.provide('com.antonytrupe.tend.PointLevel');

function PointLevel(p, i) {
	"use strict";

	var $this = this;
	$this.point = p;
	$this.level = i;

	function equals(obj) {
		if ($this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		var other = obj;
		if ($this.level == null) {
			if (other.level != null)
				return false;
		} else if (!$this.level.equals(other.level))
			return false;
		if ($this.point == null) {
			if (other.point != null)
				return false;
		} else if (!$this.point.equals(other.point))
			return false;
		return true;
	}

}