goog.require('com.antonytrupe.tend.Board');
goog.require('com.antonytrupe.tend.BoardRequest');
goog.require('com.antonytrupe.tend.BoardUI');

function main() {
	"use strict";
	var board = new com.antonytrupe.tend.Board();
	var api = new com.antonytrupe.tend.BoardRequest();
	var ui = new com.antonytrupe.tend.BoardUI(board, api, '#container');
	var id = ui.getHashId();

	api.load(id, [ board.update, ui.update ], [ ui.onError, ui.debug ], 5000);

	// create a handler for hash changes
	window.onpopstate = function(event) {
		var new_id = window.location.hash.replace("#", "").replace("!", "");
		if (new_id !== id) {
			id = new_id;
			// cancel current request
			api.abort();
			api.load(id, [ board.update, ui.update ], [ ui.onError, ui.debug ], 5000);
		}
	};

	api.listBoards([ ui.listBoards ], []);
}