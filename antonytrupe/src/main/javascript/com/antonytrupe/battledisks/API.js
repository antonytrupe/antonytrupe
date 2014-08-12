/**
 * @constructor
 */
function API(allowMultipleRequests, offline) {
	"use strict";

	var $this = this;
	$this.xhr = null;
	$this.baseUrl = "/battledisks/";
	$this.images = [];
	var url = this.baseUrl + "api";
	$this.timeoutID = null;

	$this.allowMultipleRequests = (typeof allowMultipleRequests === "undefined") ? false
			: allowMultipleRequests;

	$this.offline = (typeof offline === "undefined") ? false : offline;

	this.abort = function() {
		// console.log('API.abort');
		// console.log($this.timeoutID);
		// cancel any existing timeouts
		clearTimeout($this.timeoutID);
		// console.log('clearTimeout:' + $this.timeoutID);
		$this.timeoutID = null;

		if ($this.xhr) {
			try {
				$this.xhr.abort();
			} catch (e) {
				console.log(e);
			}
			$this.xhr = null;
		}
	};

	this.activateDisk = function(tableId, diskNumber, onSuccess, onError) {
		var data = {
			"action" : "ACTIVATE_DISK",
			"id" : tableId,
			"diskNumber" : diskNumber
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.setAttackee = function(tableId, attacker, attackee, onSuccess, onError) {
		var data = {
			"action" : "SET_ATTACKEE",
			"id" : tableId,
			"attacker" : attacker,
			"attackee" : attackee
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.buy = function(disks, onSuccess, onError) {
		// console.log("API.buy");
		var data = {
			"action" : "BUY",
			"disks" : JSON.stringify(disks)
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.createTable = function(urlQuery, onSuccess, onError) {
		$this.sendRequest(urlQuery, onSuccess, onError);
	};

	this.setDefendee = function(tableId, defender, defendee, onSuccess, onError) {
		var data = {
			"action" : "SET_DEFENDEE",
			"id" : tableId,
			"defender" : defender,
			"defendee" : defendee
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.doOnError = function(result, onError) {
		// console.log('API.doOnError');
		// hide loading icon
		$("#loading").hide();
		// console.log("auto");
		$("#table").css("cursor", "auto");

		if (onError === undefined) {
			return;
		}

		if (typeof onError === "function") {
			onError = [ onError ];
		}
		$.each(onError, function(index, f) {
			if (typeof f === "function") {
				f(result);
			}

		});
		$this.abort();
	};

	this.doOnSuccess = function(result, onSuccess) {
		// console.log("API.doOnSuccess");
		// console.log(result);

		if (onSuccess === undefined) {
			return;
		}

		if (typeof onSuccess === "function") {
			onSuccess = [ onSuccess ];
		}

		$.each(onSuccess, function(index, f) {
			if (typeof f !== "function") {
				console.log(f);
			}
			f(result);
		});

		// hide loading icon
		$("#loading").hide();
		// console.log("auto");
		$("#table").css("cursor", "auto");
	};

	this.endActivations = function(tableId, onSuccess, onError) {
		var data = {
			"action" : "END_ACTIVATIONS",
			"id" : tableId
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.endReinforcements = function(tableId, onSuccess, onError) {
		var data = {
			"action" : "END_REINFORCEMENTS",
			"id" : tableId
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.fireMissiles = function(tableId, diskIndex, missile, tablePoint,
			onSuccess, onError) {
		// API.fireMissile
		var data = {
			"action" : "FIRE_MISSILES",
			"id" : tableId,
			"diskNumber" : diskIndex,
			"point" : JSON.stringify(tablePoint),
			"missile" : missile
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.endMissiles = function(tableId, onSuccess, onError) {
		var data = {
			"action" : "END_MISSILES",
			"id" : tableId
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.getAllDisks = function(onSuccess, onError) {
		var data = {
			"action" : "GET_ALL_DISKS"
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.getDisk = function(diskName, onSuccess, onError) {
		var data = {
			"action" : "GET_DISK",
			"diskName" : diskName
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	/**
	 * 
	 * @param {string}
	 *            imageName
	 * @returns {Image}
	 */
	this.getImage = function(imageName) {
		return $this.images[imageName];
	};

	this.getJWT = function(disks, onSuccess, onError) {
		// console.log("API.getJWT");
		// console.log(JSON.stringify(disks));
		var data = {
			"action" : "JWT",
			"disks" : JSON.stringify(disks)
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.getLeaderboard = function(onSuccess, onError) {
		var data = {
			"action" : "LEADERBOARD"
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.getProfile = function(onSuccess, onError) {
		var data = {
			"action" : "PROFILE"
		};
		// console.log(2.2);
		$this.sendRequest(data, onSuccess, onError);
		// console.log(2.9);
	};

	this.joinTable = function(tableId, army, onSuccess, onError) {
		// figure out what the latest version we have locally, and ask
		// the server for newer data only
		var mementoId = $this.getLastMementoId(tableId);
		var data = {
			"action" : "JOIN_TABLE",
			"id" : tableId,
			"mementoId" : mementoId,
			"army" : army
		};
		// console.log(data);
		$this.sendRequest(data, onSuccess, onError);
	};

	this.listTables = function(onSuccess, onError) {
		var data = {
			"action" : "GET_ALL_TABLES"
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.getTable = function(tableId, onSuccess, onError) {
		// figure out what the latest version we have locally, and ask
		// the server for newer data only
		var mementoId = $this.getLastMementoId(tableId);
		// console.log('asking for mementos greater then ' + mementoId);

		var data = {
			"action" : "GET_TABLE",
			"id" : tableId,
			"mementoId" : mementoId
		};

		$this.sendRequest(data, onSuccess, onError);
	};

	this.getLastMementoId = function(tableId) {
		var mementoId = localStorage['lastMementoId:' + tableId];
		if (mementoId == undefined) {
			mementoId = -1;
		}
		return parseInt(mementoId, 10);
	};

	this.setLastMementoId = function(tableId, mementoId) {
		localStorage['lastMementoId:' + tableId] = mementoId;
		return mementoId;
	};

	this.saveMementos = function(tableId, mementos) {
		var lastMementoId = $this.getLastMementoId(tableId);
		if (mementos === undefined || mementos === null) {
			return;
		}

		// add the tableId to the list of tableIds
		var tableIds = localStorage['tableIds'];
		if (!tableIds) {
			tableIds = [];
		} else {
			tableIds = JSON.parse(tableIds);
		}
		if (tableIds.indexOf(tableId) === -1) {
			tableIds.push(tableId);
		}
		localStorage['tableIds'] = JSON.stringify(tableIds);

		// console.log(lastMementoId);

		$.each(mementos,
				function(mementoId, memento) {
					// console.log('got mementoId ' + mementoId);

					try {
						localStorage['tableMemento:' + tableId + ":"
								+ mementoId] = JSON.stringify(memento);
					} catch (e) {
						console.log(e);
						// TODO eject some other stuff from localStorage to make
						// room,
						// then try again

					}

					// console.log(mementoId);

					if (parseInt(lastMementoId, 10) < parseInt(mementoId, 10)) {
						lastMementoId = $this.setLastMementoId(tableId,
								mementoId);
					}
				});
	};

	this.getMemento = function(tableId, mementoId) {
		// console.log('tableMemento:' + tableId + ":" + mementoId);
		// console.log(localStorage['tableMemento:' + tableId + ":" +
		// mementoId]);
		var memento = localStorage['tableMemento:' + tableId + ":" + mementoId];
		if (memento === undefined) {
			$this.setLastMementoId(tableId, mementoId - 1);
			return null;
		}
		// console.log(JSON.parse(memento));
		return JSON.parse(memento);
	};

	/**
	 * @param {number}
	 *            tableId
	 * @param {number}
	 *            diskNumber
	 * @param {Point}
	 *            tableClickPoint
	 * @param {Array.
	 *            <function()>} onSuccess
	 * @param {Array.
	 *            <function()>} onError
	 */
	this.move = function(tableId, diskNumber, tableClickPoint, onSuccess,
			onError) {
		var data = {
			"action" : "MOVE_DISK",
			"id" : tableId,
			"diskNumber" : diskNumber,
			"point" : JSON.stringify(tableClickPoint)
		};
		// console.log(data);
		$this.sendRequest(data, onSuccess, onError);
	};

	/**
	 * @param {string}
	 *            armyName
	 */
	this.saveArmy = function(armyName, disks, onSuccess, onError) {
		// console.log('API.saveArmy');
		var data = {
			"action" : "SAVE_ARMY",
			"armyName" : armyName,
			"disks" : JSON.stringify(disks)
		};
		$this.sendRequest(data, onSuccess, onError);

	};

	this.deleteArmy = function(armyName, onSuccess, onError) {
		var data = {
			"action" : "DELETE_ARMY",
			"armyName" : armyName
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	this.saveReinforcement = function(tableId, diskNumber, tableClickPoint,
			onSuccess, onError) {
		// console.log('API.saveReinforcement');
		var data = {
			"action" : "SAVE_REINFORCEMENT",
			"id" : tableId,
			"diskNumber" : diskNumber,
			"point" : JSON.stringify(tableClickPoint),
			"mementoId" : $this.getLastMementoId(tableId)
		};
		$this.sendRequest(data, onSuccess, onError);
	};

	/**
	 * 
	 * @param {Object}
	 *            data
	 * @param {Array.
	 *            <function(Object)>} onSuccess
	 * @param {Array.
	 *            <function(Object)>} onError
	 */
	this.sendRequest = function(data, onSuccess, onError, cancelPrevious) {
		// console.log('API.sendRequest');
		// console.log(data);

		cancelPrevious = (typeof cancelPrevious === "undefined") ? allowMultipleRequests
				: cancelPrevious;

		// TODO
		if (cancelPrevious) {
			// cancel any request in flight
			$this.abort();
		}

		// show the loading icon
		$("#loading").show();
		// console.log("progress");
		$("#table").css("cursor", "progress");

		// if not in offline mode
		if (!$this.offline) {
			$this.xhr = $.ajax({
				'url' : url,
				'data' : data,
				'dataType' : 'json',
				success : function(result) {
					// console.log(result);
					$this.doOnSuccess(result, onSuccess);
				},
				error : function(result) {
					// console.log(result);
					$this.doOnError(result, onError);
				}
			});
		}
		// if in offline mode
		else {
			// just be successful
			$this.doOnSuccess(result, onSuccess);
		}
	};
}