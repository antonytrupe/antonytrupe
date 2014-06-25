/**
 * @constructor
 * @extends UI
 * @param {Table}
 *            table
 * @param {API}
 *            api
 * @param {Player}
 *            player
 * @returns
 */
function DiskUI(api, disk) {
	"use strict";

	$.extend(this, new UI("#table"));
	var $this = this;

	this.api = api;

	this.disk = disk;

	this.skipUI = false;

	// add onchange handlers to every form element
	$('#disk *').filter(':input').each(function() {
		// your code here
		$(this).change(function() {
			$this.fieldUpdate($(this).attr("id"));
		});
	});

	this.getHashId = function() {
		return window.location.hash.replace("#", "").replace("!", "");
	};

	// create a handler for hash changes
	window.onpopstate = function() {
		// alert('DiskUI window.onpopstate');
		var newDiskName = window.location.hash.replace("#", "").replace("!", "");
		if (newDiskName !== disk.name) {

			api.getDisk(newDiskName, function(result) {
				$this.onSuccess(result);
			}, null);
		}
	};

	this.onSuccess = function(result) {
		console.log(result);
		// ui update
		$this.update(result.disk);
	};

	$this.update = function(disk) {
		"use strict";
		$this.disk = disk;
		var diskName = disk.name;

		if (diskName !== "") {
			$("#diskName").text(diskName);

			$this.updateDiskForm();
			$this.fieldUpdate();

			$("#canvas").get(0).getContext('2d').canvas.height = $("#canvas").height();
			$("#canvas").get(0).getContext('2d').canvas.width = $("#canvas").width();

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
		}
	};

	$this.fieldUpdate = function(field) {

		if ($this.skipUI) {
			return;
		}

		if ($("#" + field).val() != $("#" + field).attr("value")) {
			$("#" + field).siblings(".previous").show();
			$("#" + field).siblings(".previous").text($("#" + field).attr("value"));
		} else {
			$("#" + field).siblings(".previous").hide();

		}

		// archer info
		if ($('#archer').is(':checked')) {
			$("#archerInfo").show();
		} else {
			$("#archerInfo").hide();
		}

		// spellcaster
		if ($('#type').val() == 'spell') {
			// set the min to 1 for spells
			$('#spellcaster').attr('min', 1);
			// bump to 1 from 0
			if ($('#spellcaster').val() == 0) {
				$('#spellcaster').val(1);
			}
		} else {
			// set min to 0 for everything else
			$('#spellcaster').attr("min", 0);
		}

		// faction
		if ($('#type').val() == 'spell') {
			// hide faction
			$('#faction').closest("div").hide();
			// set it to unaligned
			$("#faction").val('Unaligned');
		} else {
			$('#faction').closest("div").show();
		}

		// hide alignment
		if ($('#type').val() == 'spell') {
			$('#alignment').closest("div").hide();
		} else {
			$('#alignment').closest("div").show();
		}
		// hide wounds
		if ($('#type').val() == 'spell') {
			$('#wounds').closest("div").hide();
		} else {
			$('#wounds').closest("div").show();
		}
		// hide limit
		if ($('#type').val() == 'spell') {
			$('#limit').closest("div").hide();
		} else {
			$('#limit').closest("div").show();
		}
		// force diameter
		if ($('#type').val() == 'spell') {
			$('#diameter').val('1');
		} else if ($('#type').val() == 'terrain') {
			$('#diameter').val('4');
		}
	};

	$this.updateDiskForm = function() {
		// console.log(disk);

		$this.skipUI = true;

		$.each($this.disk, function(name, value) {
			// handle checkboxes/boolean values differently
			if (value === 'true' || value === true) {
				$('#' + name).prop('checked', true);
			} else if (value === 'false' || value === false) {
				$('#' + name).prop('checked', false);
			} else {
				$("#" + name).val(value);
				$("#" + name).attr('value', value);
			}
		});

		$this.skipUI = false;

	};
}