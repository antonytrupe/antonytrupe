function Army() {
	"use strict";
	var $this = this;

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