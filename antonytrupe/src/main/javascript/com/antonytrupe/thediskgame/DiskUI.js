/**
 * @constructor
 * @extends UI
 * @param canvas
 * @returns
 */
function DiskUI(canvas) {
	"use strict";

	$.extend(this, new UI(canvas));
	
	var $this = this;

	$this.update = function(disk) {
		"use strict";
		$this.disk = disk;
		//var diskName = disk.name;

		$("#canvas").get(0).getContext('2d').canvas.height = $("#canvas")
				.height();
		$("#canvas").get(0).getContext('2d').canvas.width = $("#canvas")
				.width();

		this.offset.x = $("#canvas").width() / 2;
		this.offset.y = $("#canvas").height() / 2;

		$this.drawDisk($("#canvas").get(0).getContext('2d'), {
			"disk" : disk,
			"mementoInfo" : {
				"location" : {
					"x" : 0,
					"y" : (disk.diameter - 4.25) / 2
				},
				"rotation" : 0
			}
		});
	};
}