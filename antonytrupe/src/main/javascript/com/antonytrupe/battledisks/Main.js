/**
 * @constructor
 */
function Main() {
	"use strict";
	var $this = this;

	$this.tutorial = function() {
		console.log('Main.tutorial');

		var table = new Table(2, 10, 1, 1, 1, "", "");
		window['table'] = table;
		table.placeStagingDisks();
		table.id = 1;

		var api = new API({
			'offline' : true
		});
		window['api'] = api;

		var bot = new Player("bot");
		bot.type = 'ai';
		window['bot'] = bot;

		var ui = new TableUI(api, table, '#table');
		ui.init();
		window['ui'] = ui;

		var player = new Player("player");
		window['player'] = player;

		ui.mementoId = 0;

		setupBot(null, setupPlayer);

		function setupBot(result, callback) {
			console.log('Main.setupBot');

			// console.log(callback);
			// get the bot's disk
			api.getDisk("Grugs", [ function(result) {
				console.log('Main.setupupBot getDisk Grugs');
				// console.log(result);
				// give the ai a disk
				var diskNumber = bot.addDisk(result.disk);

				// give the ai an army
				bot.addDiskToArmy("1", diskNumber);

				// have the ai join the table
				table.join(bot, "1");
				table.endReinforcements("bot");

				ui.mementoId += 2;

				ui.onSuccess({
					'player' : 'player',
					'table' : table
				});
				ui.draw();

			}, callback ], null, {
				'offline' : false
			});
		}

		function setupPlayer(result, callback) {
			console.log('Main.setupPlayer');

			// console.log(callback);

			// get the player's disk
			api.getDisk("Pikemen", [ function(result) {
				// console.log(result);
				// give the player a disk
				var diskNumber = player.addDisk(result.disk);

				// give the player an army
				player.addDiskToArmy("1", diskNumber);

				// have the player join the table
				table.join(player, "1");
				table.endReinforcements("player");

				// TODO set the mementoId to 4
				console.log('setting ui.mementoId to 4');
				ui.mementoId += 2;

				// var memento = $this.api.getMemento($this.table.getId(),
				// ui.mementoId);

				// table.restoreMemento(memento);

				// I think onSuccess restores the correct memento
				ui.onSuccess({
					'player' : 'player',
					'table' : table
				});
				console.log('after ui.onSuccess in Main');

				ui.draw();
				console.log('after ui.draw in Main');

			}, callback ], null, {
				'offline' : false
			});

		}

	};

	$this.index = function() {
		"use strict";

		var ui = new UI(null);
		window['ui'] = ui;

		var api = new API();
		window['api'] = api;

		api.getAllDisks(function(result) {
			$this.updateLinks(result.user);

		}, function(result) {
			console.log(result);
		});

	};

	$this.disk = function() {
		var disk = new Disk();
		var api = new API();
		var ui = new DiskUI(api, disk, '#table');
		window['ui'] = ui;
		window['disk'] = disk;

		var id = ui.getHashId();

		$(api.getDisk(id, ui.onSuccess, ui.onError));
	};

	$this.table = function() {
		var table = new Table();
		var api = new API();
		var ui = new TableUI(api, table, '#table');
		window['ui'] = ui;
		window['table'] = table;
		window['api'] = api;
		// $(ui.init);
		var id = ui.getHashId();
		table.setId(id);

		$(api.getTable(id, ui.onSuccess, ui.onError));
	};

	$this.leaderboard = function() {
		var api = new API();
		api.getLeaderboard([ function(result) {
			console.log(result);
			console.log(result.players);
			$this.updateLinks(result.user);

			result.players.forEach(/**
									 * @param {{playerName,rating}}
									 *            player
									 */
			function(player) {
				var li = $("<li>");
				li.text(Math.round(player.rating) + " : " + player.playerName);

				$("#leaderboard").append(li);
			});
		} ], [ function(result) {
			console.log(result);
		} ]);
	};

	$this.handleFiles = function(files) {
		"use strict";
		if (files.length) {
			var img = $("#img");
			img = document.getElementById("img");
			img.src = window.URL.createObjectURL(files[0]);
			img.onload = function(e) {
				window.URL.revokeObjectURL(img.src);
			};
		}
	};

	$this.newTable = function() {
		"use strict";

		var api = new API();
		var player = new Player();

		$("#form").submit(
				function() {

					// try to do everything on the client first and see if
					// everything works ok
					var table = new Table(parseInt($('#maxPlayers').val(), 10),
							parseInt($('#maxPoints').val(), 10), parseInt($(
									'#activations').val(), 10), parseInt($(
									'#startingDisks').val(), 10), parseInt($(
									'#reinforcements').val(), 10), String($(
									'#alignmentRestriction').val()), String($(
									'#scenario').val()));

					table.placeStagingDisks();

					var joinResult = table.join(player, $('#armyName').val());

					if (joinResult.success !== true) {
						alert(joinResult.messages);
						// TODO 0 return false to abort form submission
						// return false;
					}

					var s = $(this).serialize();
					// console.log(s);
					api.createTable(s, function(result) {
						// create table
						// if we got an id back
						if (result.id) {
							// go to the table
							window.location = "/battledisks/table.html#!"
									+ result.id;
						}
						// if we didn't get an id, but did get a message
						else if (result.messages) {
							// display the message
							alert(result.messages);
						}
						// if we didn't get an id or a message, wtf
						else {
							console.log(result);
							alert(result);
						}
					}, function(result) {
						console.log(result);
						alert(result.messages);
					});
					return false;
				});

		api
				.getProfile(
						function(result) {
							if (result.user) {
								$this.updateLinks(result.user);

								// console.log(result);

								player.update(result.player);
								var armies = player.getArmies();

								// populate the army select
								$.each(armies, function(i, armyName) {
									//
									var option = $("<option>");
									option.text(armyName);

									option.val(armyName);
									$("#armyName").append(option);
								});

								// manually run the event handler to get
								// everything in sync
								// initially
								armyChange($(":selected", $("#armyName"))
										.text());
							} else {
								// redirect to login page
								window.location = "/login.html?return_to=battledisks%2Fnew_table.html";
							}
						}, function(result) {
							console.log(result);
						});

		// add even handlers to form elements to update the default table name
		$("#form input:not(#description, :hidden)").change(
				updateDefaultDescription);

		// add event handler for when the selected army changes
		$("#armyName").change(function() {
			var selectedArmyName = $(":selected", this).text();
			armyChange(selectedArmyName);
		});

		function updateDefaultDescription() {
			console.log("updateDefaultDescription");
			var dd = $("#maxPlayers").val() + " players, ";
			dd += $("#maxPoints").val() + " point armies";
			$("#description").val(dd);
		}

		function armyChange(selectedArmyName) {
			// var army = player.getArmy(selectedArmyName);
			// console.log(selectedArmyName);
			var armyInfo = player.getArmyInfo(selectedArmyName);
			// console.log(armyInfo);
			if (parseInt($("#maxPoints").val(), 10) < armyInfo.points) {
				$("#maxPoints").val(String(armyInfo.points));
			}
			$("#selectedArmyPoints").text(String(armyInfo.points));
			$("#maxPoints").attr('min', armyInfo.points);
		}

	};

	$this.listTables = function() {
		"use strict";

		new UI(null);

		var api = new API();

		var joinButton = $("<button>").append("Join");
		joinButton.click(function() {
			var tableId = $('input:radio[name=tableId]:checked').val();
			var army = $('#armyName').val();

			// TODO check on the client first

			api.joinTable(tableId, army, function(result) {
				// join on table list
				// if we got an id back
				if (result.id) {
					// go to the table
					window.location = "table.html#!" + result.id;
				}
				// if we didn't get an id, but did get a message
				else if (result.message) {
					// display the message
					alert(result.message);
				}
				// if we didn't get an id or a message, wtf
				else {
					console.log(result);
					alert(result);
				}
			}, function(result) {
				console.log(result);
			});

		});

		var g = $("<span>");
		g.append(joinButton);

		api
				.listTables(
						/**
						 * @param {{openTables,activeTables,user,player}}
						 *            result
						 */
						function(result) {
							// console.log(result);

							var player = new Player();
							window["player"] = player;
							player.update(result.player);

							// console.log(player);

							var armies = player.getArmies();

							var armySelect = $("<select>");
							armySelect.attr("id", "armyName");
							g.prepend(armySelect);

							$.each(armies, function(i, armyName) {
								var option = $("<option>").text(armyName);

								option.val(armyName);

								armySelect.append(option);
							});

							$this.updateLinks(result.user);

							var newTable = $("<li>").append(
									$(".new_table").clone());
							$("#open_tables").append(newTable);

							// openTables
							$
									.each(
											result.openTables,
											function(k) {

												var table = new Table();

												// console.log(result.openTables[k]);

												table
														.restore(result.openTables[k]);
												var title = "";

												var a = $("<a>")
														.append(
																// table.id +
																// ":" +
																Object
																		.keys(table.memento.players).length
																		+ "/"
																		+ table.maxPlayers
																		+ " players, "
																		+ table.maxPoints
																		+ " point armies");

												// a.append(JSON.stringify(v.players));

												// make it bold if its your turn
												if (table.memento.currentPlayer === result.user) {
													a
															.css("font-weight",
																	"bold");
													title += "your turn(bold), ";
												}

												var li = $("<li>").append(a);

												// make it italicized if you are
												// in this table
												if (table.playerOrder
														.indexOf(result.user) > -1) {
													a.css("font-style",
															"italic");
													title += "your game(italicized), ";
												}

												title = title.substr(0,
														title.length - 2);
												a.attr("title", title);

												if (result.user !== ""
														&& Object
																.keys(
																		table.memento.players)
																.indexOf(
																		result.user) === -1
														&& Object
																.keys(table.memento.players).length < table.maxPlayers) {

													var label = $("<label>")
															.text("Join");

													var radio = $("<input>")
															.attr("type",
																	"radio");

													radio.attr("name",
															"tableId");
													radio.attr("value",
															table.id);
													radio.attr('id', 'tableId:'
															+ table.id);

													label.attr('for',
															'tableId:'
																	+ table.id);

													// add join widget
													radio.change(function() {
														$(this).after(g);
													});

													li.append(radio);
													li.append(label);
												}

												// player list
												var players = $("<ol>");
												$
														.each(
																table.playerOrder,
																function(i,
																		playerName) {
																	// add some
																	// info
																	// about the
																	// army
																	var player = new Player(
																			null);
																	Object
																			.keys(
																					table.memento.players[playerName].reinforcements)
																			.forEach(
																					function(
																							i) {
																						// console.log(reinforcementNumber);
																						var diskName = table.memento.players[playerName].reinforcements[i];
																						// console.log(diskName);
																						// console.log(i);
																						var diskNumber = player
																								.addDisk(table.disks[diskName]);
																						player
																								.addDiskToArmy(
																										"reinforcements",
																										diskNumber);
																					});

																	// console.log(table);

																	table
																			.getDiskNumbers()
																			.forEach(
																					function(
																							tableDiskNumber) {
																						// console.log(tableDiskNumber);
																						var diskNumber = player
																								.addDisk(table
																										.getDiskInfo(tableDiskNumber).disk);
																						player
																								.addDiskToArmy(
																										"reinforcements",
																										diskNumber);
																					});

																	// console.log(player);

																	var armyInfo = player
																			.getArmyInfo("reinforcements");
																	// console.log(armyInfo);
																	var factions = "";
																	Object
																			.keys(
																					armyInfo.factions)
																			.forEach(
																					function(
																							faction) {
																						factions += faction
																								+ "("
																								+ armyInfo.factions[faction]
																								+ ")";
																					});

																	players
																			.append($(
																					"<li>")
																					.text(
																							playerName
																									+ ":"
																									+ factions));
																});
												a.attr('href',
														'/battledisks/table.html#!'
																+ table.id);

												li.append(players);

												$("#open_tables").append(li);

											});

							// activeTables
							$
									.each(
											result.activeTables,
											function(k, t) {

												var table = new Table();
												table
														.restore(result.activeTables[k]);
												table
														.restoreMemento(result.activeTables[k].memento);

												var title = "";

												var a = $("<a>")
														.append(
																// table.id +
																// ":" +
																Object
																		.keys(table.memento.players).length
																		+ "/"
																		+ table.maxPlayers
																		+ " players, "
																		+ table.maxPoints
																		+ " point armies");

												// a.append(JSON.stringify(v.players));

												// make it bold if its your turn
												if (table.memento.currentPlayer === result.user) {
													a
															.css("font-weight",
																	"bold");
													title += "your turn(bold), ";
												}

												var li = $("<li>").append(a);

												// make it italicized if you are
												// in this table
												if (table.playerOrder
														.indexOf(result.user) > -1) {
													a.css("font-style",
															"italic");
													title += "your game(italicized), ";
												}

												title = title.substr(0,
														title.length - 2);
												a.attr("title", title);

												var radio = $("<input>").attr(
														"type", "radio");
												radio.attr("name", "tableId");
												radio.attr("value", table.id);

												// player list
												var players = $("<ol>");
												$
														.each(
																table.playerOrder,
																function(i,
																		playerName) {
																	// add some
																	// info
																	// about the
																	// army
																	var player = new Player(
																			null);
																	Object
																			.keys(
																					table.memento.players[playerName].reinforcements)
																			.forEach(
																					function(
																							reinforcementNumber) {
																						// console.log(reinforcementNumber);
																						var diskNumber = player
																								.addDisk(table.memento.players[playerName].reinforcements[reinforcementNumber].disk);
																						player
																								.addDiskToArmy(
																										"reinforcements",
																										diskNumber);
																					});

																	// console.log(table);

																	table
																			.getDiskNumbers()
																			.forEach(
																					function(
																							tableDiskNumber) {
																						// console.log(tableDiskNumber);
																						var diskNumber = player
																								.addDisk(table
																										.getDiskInfo(tableDiskNumber).disk);
																						player
																								.addDiskToArmy(
																										"reinforcements",
																										diskNumber);
																					});

																	// console.log(player);

																	var armyInfo = player
																			.getArmyInfo("reinforcements");
																	// console.log(armyInfo);
																	var factions = "";
																	Object
																			.keys(
																					armyInfo.factions)
																			.forEach(
																					function(
																							faction) {
																						factions += faction
																								+ "("
																								+ armyInfo.factions[faction]
																								+ ")";
																					});

																	players
																			.append($(
																					"<li>")
																					.text(
																							playerName
																									+ ":"
																									+ factions));
																});
												a.attr('href',
														'/battledisks/table.html#!'
																+ table.id);

												li.append(players);

												$("#active_tables").append(li);

											});
							// ///////////////////
						}, function(result) {
							console.log(result);
						});
	};

	$this.updateLinks = function(userName) {
		// console.log(userName);
		var toRemove = "/login.html?return_to=battledisks%2F";
		if (userName !== "" && typeof userName !== "undefined") {
			// log_in
			$("#log_in").attr("href", "profile.html");
			$("#log_in").text(userName);

			// profile
			if ($("#").length) {
				$("#profile").attr("href",
						$("#profile").attr("href").replace(toRemove, ""));
			}

			// new_table
			if ($(".new_table").length) {
				$(".new_table").attr("href",
						$(".new_table").attr("href").replace(toRemove, ""));
			}

			// shop
			if ($("#shop").length) {
				$("#shop").attr("href",
						$("#shop").attr("href").replace(toRemove, ""));
			}

			// new_disk
			if ($("#disk").length) {
				$("#disk").attr("href",
						$("#disk").attr("href").replace(toRemove, ""));
			}
		}
	};

	$this.shop = function() {
		"use strict";
		var player = new Player();
		var table = new Table();
		var api = new API();
		var ui = new ShopUI(api, table, player);
		window['ui'] = ui;
		window['table'] = table;
		window['api'] = api;
		ui.init();

		api.getAllDisks(
		/**
		 * @param {{disks,user,appInfo,player}}
		 *            result
		 */
		function(result) {
			// console.log("Main api.getAllDisks");
			console.log(result);
			$this.updateLinks(result.user);

			ui.displayAppInfo(result.appInfo);
			player.update(result.player);
			ui.updateLinks();

			// console.log(result);

			$.each(result.disks, function(k, disk) {

				if (disk.type === 'creature' || disk.type === 'spell') {
					// console.log(k);
					// console.log(disk);
					var x = getRandomInt($("#table").width() * 0.1, $("#table")
							.width() * 0.9);
					var y = getRandomInt($("#table").height() * 0.1,
							$("#table").height() * 0.9);

					table.place(disk, ui.getTableLocation(x, y), result.user);
				}
			});

			ui.draw();

		}, function(result) {
			console.log(result);
		});
	};

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	$this.profile = function() {
		"use strict";
		var player = new Player();
		window['player'] = player;
		var api = new API();

		var armyName = String(window.location.hash.replace("#", "").replace(
				"!", ""));

		if (armyName === '') {
			armyName = String($("#armyName").val());
		}

		var ui = new ProfileUI(api, player, armyName);
		window['ui'] = ui;

		ui.init();

		console.log('1');

		// ui.listArmies(armies);
		api.getProfile(function(result) {
			console.log(result);

			player.update(result.player);

			ui.displayDirections();
			ui.updateLinks();

			var armies = player.getArmies();
			ui.listArmies(armies);

			ui.init();

			ui.showArmyInfo();
			ui.draw();
		}, function(result) {
			console.log(result);
		});
	};
}

/**
 * @param {...*}
 *            args
 * @return {Array}
 * @this {Array}
 */
Array.prototype.remove = function(args) {
	"use strict";
	var what, a = arguments, L = a.length, ax;
	while (L && this.length) {
		what = a[--L];
		while ((ax = this.indexOf(what)) !== -1) {
			this.splice(ax, 1);
		}
	}
	// bug in JSDT
	return this;
};