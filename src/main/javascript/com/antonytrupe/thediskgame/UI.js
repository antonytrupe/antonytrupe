/**
 *   
 * @constructor
 * @param container
 */
function UI(container) {
	"use strict";
	var $this = this;

	/**
	 * @memberOf UI
	 */
	this.container = container;

	// string
	this.currentPlayer = null;

	// 0 to disable
	this.edgeScrollWidth = 0;

	this.scale = 1;

	this.mousedown = false;
	this.mousemove = false;

	this.offset = {
		"x" : 0,
		"y" : 0
	};

	this.lastMouseEvent = null;

	var TO_RADIANS = Math.PI / 180;
	var PIXELS_PER_INCH = 128;

	$(container).mouseleave(function() {
		clearTimeout($this.scrollTimeout);
		$this.scrollTimeout = null;
	});

	$(document).mouseleave(function() {
		// console.log("#document.mouseleave");
		clearTimeout($this.scrollTimeout);
		$this.scrollTimeout = null;
	});

	$(document).mouseout(function() {
		// console.log("#document.mouseout");
		clearTimeout($this.scrollTimeout);
		$this.scrollTimeout = null;
	});

	$("body").mouseleave(function() {
		// console.log("body.mouseleave");
		clearTimeout($this.scrollTimeout);
		$this.scrollTimeout = null;
	});

	$("#html").mouseleave(function() {
		// console.log("html.mouseleave");
		clearTimeout($this.scrollTimeout);
		$this.scrollTimeout = null;
	});

	// add a click handler to all the toggler elements on the page
	$(".collapsible .toggler").click(
			function(e) {
				var container = $(this).closest(".collapsible");
				$(".content", container).slideToggle(
						function() {

							$(".toggler", container).toggleClass("up down");

							// get the id of the container and persist it
							// locally
							if (container.attr('id')) {
								localStorage[container.attr('id')] = $(
										".content", container).css('display');
							}

						});
				e.preventDefault();

				return false;
			});

	// restore the state of collapsible divs from local storage
	$(".collapsible").each(function(i, div) {
		if ($(div).attr('id')) {
			if (localStorage[$(div).attr('id')]) {
				var display = localStorage[$(div).attr('id')];
				$(".content", div).css('display', display);
				if (display != 'block') {
					$(".toggler", div).toggleClass("up down");
				}
			}
		}
	});

	this.getFilter = function() {
		return $("#search").val();
	};

	this.mouseScrollHandler = function(event) {
		// console.log("UI.mouseScrollHandler");

		var mapWidth = $($this.container).width() / PIXELS_PER_INCH
				* $this.scale;
		var mapHeight = $($this.container).height() / PIXELS_PER_INCH
				* $this.scale;
		var newMapWidth;
		var newMapHeight;

		var tl = this.getTableLocation(0, 0);

		if (event.originalEvent.wheelDelta > 0 && $this.scale > 0.4) {
			$this.scale /= 1.1;
		} else if (event.originalEvent.wheelDelta < 0 && $this.scale < 20) {
			$this.scale /= 0.9;
		}

		newMapWidth = $($this.container).width() / PIXELS_PER_INCH * this.scale;
		newMapHeight = $($this.container).height() / PIXELS_PER_INCH
				* $this.scale;

		var newMapX = tl.x
				- ((event.originalEvent.offsetX - $($this.container).position().left)
						/ $($this.container).width() * (newMapWidth - mapWidth));

		var newMapY = tl.y
				- ((event.originalEvent.offsetY - $($this.container).position().top)
						/ $($this.container).height() * (newMapHeight - mapHeight));

		newMapX *= PIXELS_PER_INCH / $this.scale;
		newMapY *= PIXELS_PER_INCH / $this.scale;

		$this.offset.x = -newMapX;
		$this.offset.y = -newMapY;
		$this.draw();
	};

	this.matchesFilter = function(disk) {
		// console.log('UI.matchesFilter');
		var filter = this.getFilter().toLowerCase().trim();

		// console.log(filter);

		if (filter === null || filter === "") {
			return false;
		}

		// disk name
		if (disk.name.toLowerCase().indexOf(filter) > -1) {
			return true;
		}

		// faction
		if (disk.faction.toLowerCase().indexOf(filter) > -1) {
			return true;
		}

		// description
		if (disk.description.toLowerCase().indexOf(filter) > -1) {
			return true;
		}

		return false;
	};

	this.mouseMoveHandler = function(event) {
		// console.log("UI.mouseMoveHandler");

		// not sure we need to do this
		$this = this;

		var xScroll = 0;
		var yScroll = 0;

		var redraw = false;

		if (event.offsetX < this.edgeScrollWidth) {
			xScroll = (this.edgeScrollWidth - event.offsetX);
		} else if ($(this.container).width() - event.offsetX < this.edgeScrollWidth) {
			xScroll = -(this.edgeScrollWidth + event.offsetX - $(this.container)
					.width());
		}

		if (event.offsetY < this.edgeScrollWidth) {
			yScroll = (this.edgeScrollWidth - event.offsetY);
		} else if ($(this.container).height() - event.offsetY < this.edgeScrollWidth) {
			yScroll = -(this.edgeScrollWidth + event.offsetY - $(this.container)
					.height());
		}

		// console.log(this.lastMouseEvent);
		// console.log(this.mousedown);

		if (this.lastMouseEvent !== null && this.mousedown) {
			// console.log('sliding');
			this.offset.x += event.offsetX - this.lastMouseEvent.offsetX;
			this.offset.y += event.offsetY - this.lastMouseEvent.offsetY;
			this.mousemove = true;
			redraw = true;
		}

		else if (yScroll !== 0 || xScroll !== 0) {
			this.offset.x += xScroll / 20;
			this.offset.y += yScroll / 20;

			redraw = true;

			clearTimeout(this.scrollTimeout);

			this.scrollTimeout = setTimeout(function() {
				$this.mouseMoveHandler(event);
			}, 30);
		}

		else {
			clearTimeout($this.scrollTimeout);
			$this.scrollTimeout = null;
		}

		this.lastMouseEvent = event;

		if (redraw) {
			// use this instead of $this because $this is a private reference
			// and the base UI doesn't have a draw method
			this.draw();
		}
	};

	this.drawCircle = function(ctx, location, radius, options) {
		var o = $.extend({}, {
			'fillStyle' : 'transparent',
			'strokeStyle' : 'black',
			'lineWidth' : 1
		}, options);

		ctx.beginPath();
		ctx.arc(location.x, location.y, radius, 0, Math.PI * 2);
		ctx.lineWidth = o.lineWidth;
		ctx.strokeStyle = o.strokeStyle;
		ctx.fillStyle = o.fillStyle;

		ctx.closePath();
		ctx.stroke();
		ctx.fill();
		// ctx.restore();
	};

	/**
	 * @param {CanvasRenderingContext2D}
	 *            ctx
	 * @param {Image}
	 *            image
	 * @param {number}
	 *            x
	 * @param {number}
	 *            y
	 * @param {number}
	 *            width
	 * @param {number}
	 *            height
	 * @param {number}
	 *            angle in degrees
	 * @param {number}
	 *            alpha
	 */
	this.drawRotatedImage = function(ctx, image, x, y, width, height, angle,
			alpha) {
		if (typeof image === "undefined") {
			return;
		}

		// save the current co-ordinate system
		// before we screw with it
		ctx.save();

		ctx.globalAlpha = alpha;

		// move to the middle of where we want to draw our image
		ctx.translate(x, y);

		// rotate around that point, converting our
		// angle from degrees to radians
		ctx.rotate(angle * TO_RADIANS);

		// draw it up and to the left by half the width
		// and height of the image
		ctx.drawImage(image, -(width / 2), -(height / 2), width, height);

		// and restore the co-ords to how they were when we began
		ctx.restore();
	};

	/**
	 * takes table coordinates and converts them to screen coordinates
	 * 
	 * @param {number}
	 *            x table position
	 * @param {number}
	 *            y table position
	 * @return {Point} translated screen location
	 */
	this.getScreenLocation = function(x, y) {

		return new Point(
		//
		(x * PIXELS_PER_INCH / this.scale) + this.offset.x,
		//
		(y * PIXELS_PER_INCH / this.scale) + this.offset.y);
	};

	/**
	 * takes screen coordinates and converts them to table coordinates
	 * 
	 * @param {number}
	 *            x
	 * @param {number}
	 *            y
	 * @return {Point}
	 */
	this.getTableLocation = function(x, y) {
		return new Point(((x - this.offset.x) / PIXELS_PER_INCH * this.scale),
				((y - this.offset.y) / PIXELS_PER_INCH * this.scale));
	};

	/**
	 * @param {CanvasRenderingContext2D}
	 *            ctx
	 * @param {string}
	 *            t
	 * @param {number}
	 *            x
	 * @param {number}
	 *            y
	 * @param {number}
	 *            angle
	 * @param {object}
	 *            options
	 */
	this.print = function(ctx, t, x, y, angle, options) {

		var o = $.extend({}, {
			'textAlign' : 'left',
			'textBaseline' : 'top',
			'fillStyle' : 'black',
			'strokeStyle' : 'black',
			'font' : '14px Helvetica',
			'lineWidth' : 0,
			'lineHeight' : 14,
			'fitWidth' : 300
		}, options);

		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle * TO_RADIANS);
		ctx.font = o.font;
		ctx.fillStyle = o.fillStyle;
		ctx.strokeStyle = o.strokeStyle;
		ctx.lineWidth = o.lineWidth;
		ctx.textAlign = o.textAlign;
		ctx.textBaseline = o.textBaseline;

		var text = ('' + t).replace(/(\r\n|\n\r|\r|\n)/g, "\n");
		var sections = text.split("\n");

		var i, str, wordWidth, words, currentLine = 0;

		var printNextLine = function(str1) {
			ctx.fillText(str1, 0, 0 + (o.lineHeight * currentLine));
			if (o.lineWidth > 0) {
				ctx.strokeText(str1, 0, 0 + (o.lineHeight * currentLine));
			}
			currentLine++;
			wordWidth = ctx.measureText(str1).width;
		};

		for (i = 0; i < sections.length; i++) {
			words = sections[i].split(' ');
			var index = 1;

			while (words.length > 0 && index <= words.length) {

				str = words.slice(0, index).join(' ');
				wordWidth = ctx.measureText(str).width;

				if (wordWidth > o.fitWidth) {
					if (index === 1) {
						// Falls to this case if the first word in words[]
						// is bigger than fitWidth
						// so we print this word on its own line; index = 2
						// because slice is
						str = words.slice(0, 1).join(' ');
						words = words.splice(1);
					} else {
						str = words.slice(0, index - 1).join(' ');
						words = words.splice(index - 1);
					}

					printNextLine(str);

					index = 1;
				} else {
					index++;
				}
			}

			// The left over words on the last line
			if (index > 0) {
				printNextLine(words.join(' '));
			}
		}
		// var maxHeight = options.lineHeight * (currentLine);
		ctx.restore();
	};

	this.printCenterMiddle = function(ctx, t, x, y, angle, options) {
		var o = $.extend({}, {
			'textAlign' : 'center',
			'textBaseline' : 'middle'
		}, options);

		this.print(ctx, t, x, y, angle, o);
	};

	/**
	 * 
	 * @param ctx
	 * @param info
	 * @param highlightsCtx
	 * @param o
	 */
	this.drawDisk = function(ctx, info, highlightsCtx, o) {
		// console.log("UI.drawDisk");
		// console.log(info);
		// console.log(ctx);

		var options = $.extend(true, {}, {
			// hugh : '',
			// saturation : '100',// %, greyscale, grey(0)-color(100)
			lightness : '0',// %, black(1) to white(100), with color in the
			// middle
			shadow : {
				color : {
					hugh : '0',
					saturation : '0',
					lightness : '0'
				}
			}
		}, o);

		var strokeColor = 'hsla(0,0,0,1)';
		var fillStyle = 'grey';
		if (info.disk.alignment === 'Evil') {
			// strokeColor = '#922';
			strokeColor = 'hsla(0,64%,' + (37 + (100 - 37) * options.lightness)
					+ '%,1)';
			// fillStyle = '#F99';
			fillStyle = 'hsla(0,100%,' + (80 + (100 - 80) * options.lightness)
					+ '%,1)';
		} else if (info.disk.alignment === 'Good') {
			// strokeColor = 'green';
			// strokeColor = 'rgba(0,128,0,' + alpha + ')';
			strokeColor = 'hsla(120,100%,'
					+ (25 + (100 - 25) * options.lightness) + '%,1)';
			// fillStyle = 'lightGreen';
			// fillStyle = 'rgba(144,238,144,' + options.alpha + ')';
			fillStyle = 'hsla(120,73%,' + (75 + (100 - 75) * options.lightness)
					+ '%,1)';
		} else if (info.disk.alignment === 'Neutral') {
			// strokeColor = 'blue';
			// strokeColor = 'rgba(0,0,255,' + 1 + ')';
			strokeColor = 'hsla(240,100%,'
					+ (50 + (100 - 50) * options.lightness) + '%,1)';
			// fillStyle = 'lightBlue';
			// fillStyle = 'rgba(173,216,230,' + 1 + ')';
			fillStyle = 'hsla(195,53%,' + (79 + (100 - 79) * options.lightness)
					+ '%,1)';
		} else if (info.disk.alignment === 'Champion') {
			// strokeColor = '#FBB917';
			// strokeColor = 'rgba(251,185,23,' + 1 + ')';
			strokeColor = 'hsla(43,97%,'
					+ (54 + (100 - 54) * options.lightness) + '%,1)';
			// fillStyle = '#FFF380';
			// fillStyle = 'rgba(255,243,128,' + 1 + ')';
			fillStyle = 'hsla(54,100%,' + (75 + (100 - 75) * options.lightness)
					+ '%,1)';
		}

		if (typeof info.mementoInfo.rotation === 'undefined') {
			info.mementoInfo.rotation = 0;
		}

		var oRotation = info.mementoInfo.rotation;

		var oLocation = info.mementoInfo.location;

		// add a shadow to the outer circle
		ctx.save();
		// ctx.shadowColor = 'rgba(0,0,0,' + options.alpha + ')';
		ctx.shadowColor = 'hsla('
				+ options.shadow.color.hugh
				+ ','
				+ options.shadow.color.saturation
				+ '%,'
				+ (options.shadow.color.lightness + (100 - options.shadow.color.lightness)
						* options.lightness) + '%,' + 1 + ')';
		ctx.shadowBlur = 16 / this.scale;
		ctx.shadowOffsetX = 16 / this.scale;
		ctx.shadowOffsetY = 16 / this.scale;

		// lighter, inner circle
		this.drawCircle(ctx, this.getScreenLocation(oLocation.x, oLocation.y),
				(info.disk.diameter * PIXELS_PER_INCH - 6) / this.scale / 2, {
					// 'strokeStyle' : strokeColor,
					'fillStyle' : fillStyle
				// 'lineWidth' : 6 / this.scale
				});

		ctx.restore();

		// dark, outer circle
		this.drawCircle(ctx, this.getScreenLocation(oLocation.x, oLocation.y),
				(info.disk.diameter * PIXELS_PER_INCH - 6) / this.scale / 2, {
					'strokeStyle' : strokeColor,
					// 'fillStyle' : fillStyle,
					'lineWidth' : 6 / this.scale
				});

		var statDiameter = 50;

		var statlineWidth = 12 / this.scale;

		var statFont = (1 / this.scale) * 3 + "em OpenSans";

		if (info.disk.type == 'missile') {
			statDiameter = 20;
			statFont = (1 / this.scale) * 1.5 + "em OpenSans";
			statlineWidth = 4 / this.scale;
		}

		// print attack
		// pixels from center of disk to center of stat circle
		var radius = info.disk.diameter / 2 - 0.275;

		// 31 pixels(scaled) between the center point of the circles
		var opp = 31 / this.scale;
		var hyp = radius / this.scale * PIXELS_PER_INCH;

		var rotation = oRotation - 90 - (Math.asin(opp / hyp) / TO_RADIANS) * 2;

		if (info.disk.type == 'missile') {
			rotation = -115;
			radius = info.disk.diameter / 2 - .1;
		}

		if (!rotation) {
			rotation = -90;
		}

		// console.log(opp);
		// console.log(hyp);
		// console.log(opp / hyp);
		// console.log(Math.asin(opp / hyp));
		// console.log('-----------');

		var attackLocation = this.getScreenLocation(oLocation.x + radius
				* Math.cos(rotation * TO_RADIANS), oLocation.y + radius
				* Math.sin(rotation * TO_RADIANS));

		this.drawCircle(ctx, attackLocation, statDiameter / this.scale / 2, {
			'fillStyle' : '#EEE',
			'lineWidth' : statlineWidth,
			'strokeStyle' : strokeColor
		});
		this.printCenterMiddle(ctx, info.disk.attack, attackLocation.x,
				attackLocation.y, oRotation, {
					"font" : statFont
				});

		// console.log(info.disk.attack);

		if (info.disk.defense !== undefined && info.disk.type == 'creature') {
			// print defense
			rotation = oRotation - 90;
			var defenseLocation = this.getScreenLocation(oLocation.x + radius
					* Math.cos(rotation * TO_RADIANS), oLocation.y + radius
					* Math.sin(rotation * TO_RADIANS));
			this.drawCircle(ctx, defenseLocation,
					statDiameter / this.scale / 2, {
						'fillStyle' : '#EEE',
						'lineWidth' : statlineWidth,
						'strokeStyle' : strokeColor
					});
			this.printCenterMiddle(ctx, info.disk.defense, defenseLocation.x,
					defenseLocation.y, oRotation, {
						"font" : statFont
					});
		}

		if (info.disk.toughness !== undefined && info.disk.type == 'creature') {
			// print toughness
			// rotation = info.rotation - 45;
			rotation = oRotation - 90 + (Math.asin(opp / hyp) / TO_RADIANS) * 2;
			var toughnessLocation = this.getScreenLocation(oLocation.x + radius
					* Math.cos(rotation * TO_RADIANS), oLocation.y + radius
					* Math.sin(rotation * TO_RADIANS));
			this.drawCircle(ctx, toughnessLocation, statDiameter / this.scale
					/ 2, {
				'fillStyle' : '#EEE',
				'lineWidth' : statlineWidth,
				'strokeStyle' : strokeColor
			});
			this.printCenterMiddle(ctx, info.disk.toughness,
					toughnessLocation.x, toughnessLocation.y, oRotation, {
						"font" : statFont
					});
		}

		// print wounds
		// rotation = info.rotation - 0;
		rotation = oRotation - 90 + (Math.asin(opp / hyp) / TO_RADIANS) * 4;

		if (parseInt(info.disk.wounds, 10) > 1 && info.disk.type == 'creature') {
			var woundsLocation = this.getScreenLocation(oLocation.x + radius
					* Math.cos(rotation * TO_RADIANS), oLocation.y + radius
					* Math.sin(rotation * TO_RADIANS));
			this.drawCircle(ctx, woundsLocation, statDiameter / this.scale / 2,
					{
						// dark red
						'fillStyle' : '#900',
						'lineWidth' : statlineWidth,
						'strokeStyle' : "white"
					});
			this.printCenterMiddle(ctx, info.disk.wounds, woundsLocation.x,
					woundsLocation.y, oRotation, {
						"font" : statFont,
						"fillStyle" : "white"
					});
		}

		if (info.disk.cost !== undefined && info.disk.type == 'creature') {
			// print cost
			rotation = oRotation + 90 - (Math.asin(opp / hyp) / TO_RADIANS) * 2;
			var costLocation = this.getScreenLocation(oLocation.x + radius
					* Math.cos(rotation * TO_RADIANS), oLocation.y + radius
					* Math.sin(rotation * TO_RADIANS));
			this.drawCircle(ctx, costLocation, (40) / this.scale / 2, {
				'fillStyle' : '#000',
				'lineWidth' : statlineWidth,
				'strokeStyle' : "#000"
			});
			// make cost white
			this.printCenterMiddle(ctx, info.disk.cost, costLocation.x,
					costLocation.y, oRotation, {
						"font" : (1 / this.scale) * 2 + "em OpenSans",
						"fillStyle" : "white"
					});
		}

		if (info.disk.movement !== undefined && info.disk.type == 'creature') {
			// print movement
			rotation = oRotation - 225;
			var movementLocation = this.getScreenLocation(oLocation.x + radius
					* Math.cos(rotation * TO_RADIANS), oLocation.y + radius
					* Math.sin(rotation * TO_RADIANS));
			this.drawCircle(ctx, movementLocation, statDiameter / this.scale
					/ 2, {
				'fillStyle' : '#AAF',
				'lineWidth' : statlineWidth,
				'strokeStyle' : "white"
			});
			this.printCenterMiddle(ctx, info.disk.movement
					- (info.mementoInfo.flips ? info.mementoInfo.flips : 0)
					+ "/" + info.disk.movement, movementLocation.x,
					movementLocation.y, oRotation, {
						"font" : (1 / this.scale) * 2 + "em OpenSans"
					});
		}

		// print flying
		if (info.disk.flying && info.disk.type == 'creature') {
			// opp = 46 / 2 / this.scale;
			rotation = oRotation - 225 + (Math.asin(opp / hyp) / TO_RADIANS)
					* 2;
			var flyingLocation = this.getScreenLocation(oLocation.x + radius
					* Math.cos(rotation * TO_RADIANS), oLocation.y + radius
					* Math.sin(rotation * TO_RADIANS));
			this.drawCircle(ctx, flyingLocation, statDiameter / this.scale / 2,
					{
						'fillStyle' : '#AAF',
						'lineWidth' : statlineWidth,
						'strokeStyle' : "#33F"
					});
			this.printCenterMiddle(ctx, "F", flyingLocation.x,
					flyingLocation.y, oRotation, {
						"font" : (1 / this.scale) * 2 + "em OpenSans",
						'fillStyle' : "#33F"
					});
		}

		// print name
		radius = 0.1 * info.disk.diameter;
		rotation = oRotation - 90;
		var nameLocation = this.getScreenLocation(oLocation.x + radius
				* Math.cos(rotation * TO_RADIANS), oLocation.y + radius
				* Math.sin(rotation * TO_RADIANS));
		this.printCenterMiddle(ctx, info.disk.name, nameLocation.x,
				nameLocation.y, oRotation, {
					"font" : statFont,
					"lineHeight" : (1 / this.scale) * 36,
					"fitWidth" : info.disk.diameter * PIXELS_PER_INCH * 1
							/ this.scale// ,
				// "lineWidth" : 1 / this.scale,
				// "strokeStyle" : "darkGrey"
				});

		// print description
		radius = 0.2 * info.disk.diameter;
		rotation = oRotation + 90;
		var descriptionLocation = this.getScreenLocation(oLocation.x + radius
				* Math.cos(rotation * TO_RADIANS), oLocation.y + radius
				* Math.sin(rotation * TO_RADIANS));

		var details = "";

		// print missile info
		if (info.disk.archer) {
			details += "Missle:";
			if (info.disk.arrows > 0) {
				details += " Arrow(" + info.disk.arrows + ")";
			}
			if (info.disk.bolts > 0) {
				details += " Bolts(" + info.disk.bolts + ")";
			}
			if (info.disk.fireballs > 0) {
				details += " Fireballs(" + info.disk.fireballs + ")";
			}
			if (info.disk.boulders > 0) {
				details += " Boulders(" + info.disk.boulders + ")";
			}
			details += ".";
		}

		if (info.disk.firstblow) {
			details += "First Blow. ";
		}
		if (info.disk.missileImmunity) {
			details += 'Immune to Missles. ';
		}

		if (info.disk.spellcaster > 0) {
			details += 'Level ' + info.disk.spellcaster;
			if (info.disk.type == "creature") {
				details += " Spellcaster. ";
			}
		}
		if (info.disk.limit === 1) {
			details += "Unique.";
		} else if (info.disk.limit > 1) {
			details += 'Limit(' + info.disk.limit + ").";
		}

		if (info.disk.description !== undefined) {
			this.printCenterMiddle(ctx, details + info.disk.description,
					descriptionLocation.x, descriptionLocation.y, oRotation, {
						"font" : (1 / this.scale) * 1 + "em OpenSans",
						"lineHeight" : (1 / this.scale) * 12,
						"fitWidth" : info.disk.diameter * PIXELS_PER_INCH * 0.7
								/ this.scale
					});
		}

		if (info.disk.faction !== undefined && info.disk.type == 'creature') {
			// print faction
			radius = 0.42 * info.disk.diameter;
			rotation = oRotation + 90;
			var factionLocation = this.getScreenLocation(oLocation.x + radius
					* Math.cos(rotation * TO_RADIANS), oLocation.y + radius
					* Math.sin(rotation * TO_RADIANS));
			this.printCenterMiddle(ctx, "(" + info.disk.faction + ")",
					factionLocation.x, factionLocation.y, oRotation, {
						"font" : (1 / this.scale) * 1.5 + "em OpenSans"
					});
		}
	};

	// updateLinks
	$this.updateLinks = function() {

		var toRemove = "/login.html?return_to=battledisks%2F";
		if (this.currentPlayer !== "") {
			// log_in
			$("#log_in").attr("href", "profile.html");
			// console.log($this.currentPlayer);
			$("#log_in").text($this.currentPlayer);

			// new_table
			$(".new_table").attr("href",
					$(".new_table").attr("href").replace(toRemove, ""));

			// shop
			$("#shop").attr("href",
					$("#shop").attr("href").replace(toRemove, ""));
		}
	};
}