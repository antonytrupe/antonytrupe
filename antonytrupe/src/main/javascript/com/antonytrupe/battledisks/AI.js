/**
 * @constructor
 * @param {Table}
 *            table
 * @param {Player}
 *            player
 */
function AI(table) {
	"use strict";

	var $this = this;
	this.table = table;

	/**
	 * 
	 */
	this.go = function() {

		// console.log($this.table.getCurrentPlayer());

		if ($this.table.getCurrentPlayer() === ""
				|| $this.table.getCurrentPlayer() === null
				|| typeof $this.table.getCurrentPlayer() === "undefined") {
			return;
		}
		//
		// if the player who's turn it is is not a ai, then don't move for them
		// console.log($this.table.getPlayerInfo($this.table.getCurrentPlayer()));

		if ($this.table.getPlayerInfo($this.table.getCurrentPlayer()).type != 'ai') {
			return;
		}

		if ($this.table.getSegment() == $this.table.SEGMENT.REINFORCEMENTS) {
		} else if ($this.table.getSegment() == $this.table.SEGMENT.ACTIVATION) {

			var maxDistance = 0;
			var maxDistanceDiskNumber = null;

			var closestEnemyDistance = 9999;
			var closestEnemyDiskNumber = null;

			// find the disk farthest away from the center of the board that can
			// activate
			Object
					.keys($this.table.memento.diskInfo)
					.forEach(
							function(diskNumber) {
								// console.log(diskNumber);

								if (!$this.table.canActivate(
										$this.table.memento.currentPlayer,
										diskNumber)) {
									// console.log('cant activate ' +
									// diskNumber);
									return;
								}

								var distance = $this.table.memento.diskInfo[diskNumber].location
										.distance(new Point(0, 0));

								if (distance > maxDistance) {
									maxDistance = distance;
									maxDistanceDiskNumber = diskNumber;
								}
							});

			// console.log(maxDistanceDiskNumber);

			// find the closest enemy disk
			Object
					.keys($this.table.memento.diskInfo)
					.forEach(
							function(diskNumber) {
								// console.log(diskNumber);

								// only look for enemy disks
								if ($this.table.getDiskInfo(diskNumber).mementoInfo.player === $this.table.memento.currentPlayer) {
									return;
								}

								// console.log(diskNumber);
								// console
								// .log($this.table.memento.diskInfo[diskNumber]);
								// console.log($this.table
								// .getDiskInfo(maxDistanceDiskNumber));

								var distance = $this.table.memento.diskInfo[diskNumber].location
										.distance($this.table
												.getDiskInfo(maxDistanceDiskNumber).mementoInfo.location);

								if (distance < closestEnemyDistance) {
									closestEnemyDistance = distance;
									closestEnemyDiskNumber = diskNumber;
								}
							});

			// console.log(closestEnemyDiskNumber);

			// move that disk towards the closes enemy disk
			$this.table
					.move(
							$this.table.memento.currentPlayer,
							maxDistanceDiskNumber,
							$this.table.getDiskInfo(closestEnemyDiskNumber).mementoInfo.location);

			// if it is still this player's turn
			if ($this.table.memento.currentPlayer == $this.table.memento.currentPlayer) {
				// $this.go();
			}
		}

	};
}