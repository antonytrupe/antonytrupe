/**
 * @constructor
 */
function Point(x, y) {
	// "use strict";
	var $this = this;
	$this.x = parseFloat(x.toFixed(10));
	$this.y = parseFloat(y.toFixed(10));

	$this.getEdge = function(p1, distance) {
		// e.io.write("Point.getEdge");
		// e.io.write($this);
		// e.io.write(p1);
		var vx = p1.x - $this.x,
		//
		vy = p1.y - $this.y,

		// Then calculate the length:
		mag = Math.sqrt(vx * vx + vy * vy), x, y;
		// e.io.write("mag:" + mag + "\n");
		if (mag === 0) {
			mag = 1;
		}
		// e.io.write("mag:" + mag + "\n");

		// Normalize the vector to unit length:
		vx /= mag;
		vy /= mag;

		// Finally calculate the new vector, which is x2y2 + vxvy * (mag +
		// distance).
		x = ($this.x + vx * (distance));
		y = ($this.y + vy * (distance));
		return new Point(parseFloat(x.toFixed(10)), parseFloat(y.toFixed(10)));
	};

	$this.distance = function(that) {
		var a = Math.pow($this.x - that.x, 2),
		//
		b = Math.pow($this.y - that.y, 2),
		//
		c = Math.sqrt(a + b);
		// e.io.write(a);
		// e.io.write(b);
		// e.io.write(c);
		return c;
	};
}