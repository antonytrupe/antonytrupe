/**
 * @param options
 * @constructor
 * @class
 */
function API(options) {
    "use strict";

    var $this = this;

    // console.log(options);

    // initialize options
    $this.options = (typeof options === "undefined") ? {} : options;

    // initialize cancelPreviousRequests flag
    $this.options.cancelPreviousRequests = (typeof $this.options.cancelPreviousRequests === "undefined") ? false
            : $this.options.cancelPreviousRequests;

    // initialize offline flag
    $this.options.offline = (typeof $this.options.offline === "undefined") ? false
            : $this.options.offline;

    // console.log($this.offline);

    /**
     * @constructor
     */
    var RemoteAPI = function() {
        "use strict";
        // var $thisRemote = this;
        // private variable
        var xhr = null;
        var timeoutID = null;
        this.baseUrl = "/battledisks/";
        this.apiUrl = this.baseUrl + "api";

        /**
         * @return {boolean}
         * @memberOf RemoteAPI
         */
        function cancelPreviousRequests() {
            return true;
        }

        // private method
        var abort = function() {
            "use strict";
            clearTimeout(timeoutID);
            // console.log('clearTimeout:' + $this.timeoutID);
            timeoutID = null;

            if (xhr) {
                try {
                    xhr.abort();
                } catch (e) {
                    console.log(e);
                }
                xhr = null;
            }
        };

        /**
         * 
         * @param {Object}
         *          data
         * @param {Array}
         *          onSuccess
         * @param {Array}
         *          onError
         * @param options
         * @memberOf RemoteAPI
         */
        function sendRequest(data, onSuccess, onError, options) {
            "use strict";
            // console.log('API.sendRequest');

            if (cancelPreviousRequests(options)) {
                // cancel any request in flight
                abort();
            }
            // show the loading icon
            $("#loading").show();
            // console.log("progress");
            $("#table").css("cursor", "progress");

            xhr = $.ajax({
                'url': remoteApi.apiUrl,
                'data': data,
                'dataType': 'json',
                success: function(result) {
                    // console.log(result);
                    $this.doOnSuccess(result, onSuccess);
                },
                error: function(result) {
                    // console.log(result);
                    // TODO move doOnError, or something
                    $this.doOnError(result, onError);
                }
            });
        }

        this.getJWT = function(data, onSuccess, onError) {
            sendRequest(data, onSuccess, onError);
        };

        this.getProfile = function(onSuccess, onError) {
            var data = {
                "action": "PROFILE"
            };
            sendRequest(data, onSuccess, onError);
        };

        this.getAllDisks = function(onSuccess, onError) {
            var data = {
                "action": "GET_ALL_DISKS"
            };
            sendRequest(data, onSuccess, onError);
        };

        this.getDisk = function(diskName, onSuccess, onError) {
            var data = {
                "action": "GET_DISK",
                "diskName": diskName
            };
            // TODO add a callback to save the disk locally
            sendRequest(data, onSuccess, onError);
        };

        this.saveReinforcement = function(data, onSuccess, onError) {
            sendRequest(data, onSuccess, onError);
        };

        this.endReinforcements = function(data, onSuccess, onError) {
            sendRequest(data, onSuccess, onError);
        };

    };
    var remoteApi = new RemoteAPI();

    /**
     * @constructor
     */
    var LocalAPI = function() {
        this.getTable = function() {
            // TODO LocalAPI.getTable
        };

        this.getDisk = function(diskName) {
            var disk = localStorage[diskName];
            if (typeof disk == "undefined") {
                return null;
            }
            // check the ttl
            if (new Date(disk.ttl) > new Date()) {
                // purge the cache
                delete localStorage[diskName];
                return null;
            }
            return disk;
        };

        this.getMemento = function(tableId, mementoId) {
            var memento = localStorage['tableMemento:' + tableId + ":"
                    + mementoId];
            if (memento === undefined) {
                $this.setLastMementoId(tableId, mementoId - 1);
                return null;
            }
            // console.log(JSON.parse(memento));
            return JSON.parse(memento);
        };
    };
    var localApi = new LocalAPI();

    this.abort = function() {
        remoteApi.abort();
    };

    this.activateDisk = function(tableId, diskNumber, onSuccess, onError) {
        var data = {
            "action": "ACTIVATE_DISK",
            "id": tableId,
            "diskNumber": diskNumber
        };
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    this.setAttackee = function(tableId, attacker, attackee, onSuccess, onError) {
        var data = {
            "action": "SET_ATTACKEE",
            "id": tableId,
            "attacker": attacker,
            "attackee": attackee
        };
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    this.buy = function(disks, onSuccess, onError) {
        // console.log("API.buy");
        var data = {
            "action": "BUY",
            "disks": JSON.stringify(disks)
        };
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    this.createTable = function(urlQuery, onSuccess, onError) {
        remoteApi.sendRequest(urlQuery, onSuccess, onError);
    };

    this.setDefendee = function(tableId, defender, defendee, onSuccess, onError) {
        var data = {
            "action": "SET_DEFENDEE",
            "id": tableId,
            "defender": defender,
            "defendee": defendee
        };
        remoteApi.sendRequest(data, onSuccess, onError);
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
            onError = [onError];
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
        // console.log(onSuccess);

        if (typeof onSuccess === "undefined") {
            return;
        }

        if (typeof onSuccess === "function") {
            onSuccess = [onSuccess];
        }

        $.each(onSuccess, function(index, f) {
            if (typeof f !== "function") {
                // console.log(f);
                // console.log(new Error().stack);
                return;
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
            "action": "END_ACTIVATIONS",
            "id": tableId
        };
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    this.endReinforcements = function(tableId, onSuccess, onError) {
        var data = {
            "action": "END_REINFORCEMENTS",
            "id": tableId
        };
        remoteApi.endReinforcements(data, onSuccess, onError);
    };

    this.fireMissiles = function(tableId, diskIndex, missile, tablePoint,
            onSuccess, onError) {
        // API.fireMissile
        var data = {
            "action": "FIRE_MISSILES",
            "id": tableId,
            "diskNumber": diskIndex,
            "point": JSON.stringify(tablePoint),
            "missile": missile
        };
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    this.endMissiles = function(tableId, onSuccess, onError) {
        var data = {
            "action": "END_MISSILES",
            "id": tableId
        };
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    this.getAllDisks = function(onSuccess, onError) {
        remoteApi.getAllDisks(onSuccess, onError);
    };

    this.getDisk = function(diskName, onSuccess, onError) {
        // TODO try to get a local copy
        var disk = localApi.getDisk(diskName);
        console.log(disk);
        if (disk != null) {
            // 
            console.log(disk);
            $this.doOnSuccess({
                'disk': disk
            }, onSuccess);
        }
        // TODO if no local copy, go remote
        remoteApi.getDisk(diskName, onSuccess, onError);
    };

    this.getJWT = function(disks, onSuccess, onError) {
        // console.log("API.getJWT");
        // console.log(JSON.stringify(disks));
        var data = {
            "action": "JWT",
            "disks": JSON.stringify(disks)
        };
        remoteApi.getJWT(data, onSuccess, onError);
    };

    this.getLeaderboard = function(onSuccess, onError) {
        var data = {
            "action": "LEADERBOARD"
        };
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    this.getProfile = function(onSuccess, onError) {
        remoteApi.getProfile(onSuccess, onError);
    };

    this.joinTable = function(tableId, army, onSuccess, onError) {
        // figure out what the latest version we have locally, and ask
        // the server for newer data only
        var mementoId = $this.getLastMementoId(tableId);
        var data = {
            "action": "JOIN_TABLE",
            "id": tableId,
            "mementoId": mementoId,
            "army": army
        };
        // console.log(data);
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    this.listTables = function(onSuccess, onError) {
        var data = {
            "action": "GET_ALL_TABLES"
        };
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    this.getTable = function(tableId, onSuccess, onError) {

        // TODO try to get it locally
        // TODO otherwise, get it remotely

        // figure out what the latest version we have locally, and ask
        // the server for newer data only
        var mementoId = $this.getLastMementoId(tableId);
        // console.log('asking for mementos greater then ' + mementoId);

        if ($this.offline(options)) {
            // TODO get the table info from local storage

            // table.mementos
            // table.memento
            var result = {
                'table': {
                    'mementoId': mementoId,
                    'memento': $this.getMemento(tableId, mementoId),
                    'id': tableId,
                    'mementos': {}
                }
            };

            $this.doOnSuccess(result, onSuccess);
        } else {
            var data = {
                "action": "GET_TABLE",
                "id": tableId,
                "mementoId": mementoId
            };
            remoteApi.sendRequest(data, onSuccess, onError);
        }
    };

    this.offline = function(options) {
        var offline = false;

        // if the local parameter is defined
        if (typeof options !== "undefined"
                && typeof options.offline !== "undefined") {
            // and true
            if (options.offline === true) {
                offline = true;
            }
            // and false
            else {
                offline = false;
            }
        } else {
            offline = $this.options.offline;
        }
        return offline;
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

    this.getBaseUrl = function() {
        return remoteApi.baseUrl;
    };

    this.saveMementos = function(tableId, mementos) {
        // console.log('API.saveMementos');
        // console.log('tableId:' + tableId);
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
                        // room, then try again

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
     *          tableId
     * @param {number}
     *          diskNumber
     * @param {Point}
     *          tableClickPoint
     * @param {Array.
     *          <function()>} onSuccess
     * @param {Array.
     *          <function()>} onError
     */
    this.move = function(tableId, diskNumber, tableClickPoint, onSuccess,
            onError) {
        var data = {
            "action": "MOVE_DISK",
            "id": tableId,
            "diskNumber": diskNumber,
            "point": JSON.stringify(tableClickPoint)
        };
        // console.log(data);
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    /**
     * @param {string}
     *          armyName
     * @param disks
     * @param onSuccess
     * @param onError
     */
    this.saveArmy = function(armyName, disks, onSuccess, onError) {
        // console.log('API.saveArmy');
        var data = {
            "action": "SAVE_ARMY",
            "armyName": armyName,
            "disks": JSON.stringify(disks)
        };
        remoteApi.sendRequest(data, onSuccess, onError);

    };

    this.deleteArmy = function(armyName, onSuccess, onError) {
        var data = {
            "action": "DELETE_ARMY",
            "armyName": armyName
        };
        remoteApi.sendRequest(data, onSuccess, onError);
    };

    this.saveReinforcement = function(tableId, diskNumber, tableClickPoint,
            onSuccess, onError) {
        // console.log('API.saveReinforcement');
        var data = {
            "action": "SAVE_REINFORCEMENT",
            "id": tableId,
            "diskNumber": diskNumber,
            "point": JSON.stringify(tableClickPoint),
            "mementoId": $this.getLastMementoId(tableId)
        };

        remoteApi.saveReinforcement(data, onSuccess, onError);
        // remoteApi.sendRequest(data, onSuccess, onError);
    };

}