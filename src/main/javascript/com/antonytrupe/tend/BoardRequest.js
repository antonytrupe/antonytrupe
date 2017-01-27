goog.provide('com.antonytrupe.tend.BoardRequest');

function BoardRequest() {
	"use strict";
	var $this = this;
	$this.xhr = null;
	$this.timeoutID = null;

	// to test against production data
	// this.baseUrl="http://www.antonytrupe.com/hex/"

	// to test against dev
	// this.baseUrl = "http://localhost:8888/tend/";

	// to deploy
	$this.baseUrl = "/tend/";

	var url = $this.baseUrl + "api";

	$this.doOnSuccess = function(result, onSuccess, time, callback) {
		// console.log("BoardRequest.doOnSuccess");
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

		if (time > 0) {
			// console.log(callback);
			$this.timeoutID = setTimeout(callback, time);
		}
	};

	$this.abort = function() {
		if ($this.xhr) {
			$this.xhr.abort();
			delete $this.xhr;
			clearTimeout($this.timeoutID);
		}
	};

	$this.sendRequest = function(data, onSuccess, onError, time, callBack) {
		// console.log(onSuccess);
		$this.xhr = $.ajax({
			'url' : url,
			'data' : data,
			'dataType' : 'json',
			success : function(result) {
				// console.log(result);
				$this.doOnSuccess(result, onSuccess, time, callBack);
			},
			error : function(result) {
				// console.log(result);
				$this.doOnError(result, onError, time);
			}
		});
	};

	// public
	$this.load = function(id, onSuccess, onError, time) {
		// console.log("BoardRequest.load");
		// see if there is a load in progress already
		var data = {
			"action" : "GET_BOARD",
			"id" : id
		};

		$this.sendRequest(data, onSuccess, onError, time, function() {
			// console.log(onSuccess);
			$this.load(data.id, onSuccess, onError, time);
		});

	};

	$this.doOnError = function(result, onError, time) {
		// console.log("BoardRequest.doOnError");
		// console.log(result);

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
	};

	$this.queueSettlement = function(id, settlementPoint, settlementName,
			resources, onSuccess, onError) {
		//
		var data = {
			"action" : "QUEUE_SETTLEMENT",
			"id" : id,
			"settlementName" : settlementName,
			"resources" : JSON.stringify(resources),
			"settlementPoint" : JSON.stringify(settlementPoint)
		};
		$this.sendRequest(data, onSuccess, onError, 0);
	};

	$this.endTurn = function(id, onSuccess, onError) {
		var data = {
			"action" : "FINISH_TURN",
			"id" : id
		};
		$this.sendRequest(data, onSuccess, onError, 0);
	};

	$this.joinBoard = function(id) {
		var identity = null;
		if (identity === null) {
			window.location = "api?action=JOIN_BOARD&id=" + id;
			return;
		}
		var data = {
			"action" : "JOIN_BOARD",
			"id" : id
		};
		$this.sendRequest(data);
	};

	$this.listBoards = function(onSuccess, onError) {
		var data = {
			"action" : "LIST_BOARDS"
		};
		$this.sendRequest(data, onSuccess, onError);
	};
}