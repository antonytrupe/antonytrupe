//model must contain a method named getActions
//getActions must return an array of Nodes
/**
 * @constructor
 * @param {AI}
 *            ai
 * 
 * @callback ai.getActions
 * @return {Array.<{{state: Object, method: String,arguments:Array}}>}
 * 
 * 
 * @param {ai.getActions}
 *            ai.getActions
 * @param {Function}
 *            ai.gScore - actual cost to this point
 * @param {Function}
 *            ai.hScore - estimated cost from this point to goal
 * @param {Function}
 *            ai.getGoal
 * @param {Function}
 *            ai.setState
 * @param {Function}
 *            ai.getState
 * @param options
 */
function AStar(ai, options) {
	"use strict";
	/**
	 * @type PriorityQueue
	 */
	var closed_set = new PriorityQueue('getF', PriorityQueue.MIN_HEAP);
	/**
	 * @type PriorityQueue
	 */
	var open_set = new PriorityQueue('getF', PriorityQueue.MIN_HEAP);

	// make sure the model has the right methods for a_star to use
	if (typeof ai === "undefined") {
		throw "no ai provided";
	}
	var requiredAiMembers = [ 'getActions', 'gScore', 'hScore', 'getGoal',
			'setState', 'getState', 'keepSearching' ];
	var missingMembers = [];
	requiredAiMembers.forEach(function(method) {
		if (typeof ai[method] === "undefined") {
			missingMembers.push(method);
		}
	});
	if (missingMembers.length !== 0) {
		throw "ai missing attributes: " + JSON.stringify(missingMembers);
	}

	// now initialize some stuff
	var start = new Node({
		'state' : ai.getState()
	});
	start.setG(ai.gScore());
	start.setH(ai.hScore());

	var goal = new Node({
		'state' : ai.getGoal()
	});
	// console.log('goal state');
	// console.log(goal.getState());
	// console.log('start state');
	// console.log(start.getState());
	open_set.add(start);
	// console.log('done initializing AStar');

	this.search = function() {
 
		while (open_set.size() > 0 && ai.keepSearching()) {
 			var q = open_set.peek();

			// console.log('current state');
			// console.log(q.getState());

			// the stopping condition(s)
			if (q.isEqual(goal)) {
				// console.log('got to goal');
				return reconstruct_path(q);
			}

			open_set.poll();
			closed_set.add(q);
			// console.log('update ai state');

			ai.setState(q.getState());
			// console.log(ai.getState());

			// console.log('adding neighbors');

			// closed_set.push(q);
			// get actions returns an array of objects
			ai.getActions().forEach(function(n) {
				ai.setState(n.state);
				var neighbor = new Node(n);
				// console.log(neighbor._state);

				neighbor.setPredecessor(q);
				neighbor.setG(ai.gScore());
				neighbor.setH(ai.hScore());

				open_set.add(neighbor);
			});

		}
		// if we got here, that means we failed to get to the goal
		// so return the best path we did find
		var c = closed_set.peek();
		return reconstruct_path(c);

	};

	function reconstruct_path(q) {
		// console.log('reconstruct_path');
		// console.log(q.getState());
		var total_path = [ q.getState() ];
		// console.log(total_path);
		var current = q;
		while (current.getPredecessor()) {
			total_path.push(current.getPredecessor().getState());
			current = current.getPredecessor();
		}

		// console.log(total_path);
		return total_path.reverse();
	}

}

function Node(args) {
	"use strict";
	// f is total cost from start to goal through this node
	this._f;
	// h is the estimated cost from this node to the goal
	this._h;
	// g is the actual cost from start to this node
	this._g;
	//
	this._state = args.state;
	var predecessor = args.predecessor, _actionName = args.actionName, _args = args.args;

	this.setState = function(__state) {
		this._state = __state;
	};
	this.getState = function() {
		return this._state;
	};

	// g is the actual cost from start to this node
	this.setG = function(__g) {
		this._g = __g;
		this._f = this._g + this._h;
	};

	// h is the estimated cost from this node to the goal
	this.setH = function(__h) {
		this._h = __h;
		this._f = this._g + this._h;
	};

	// f is total cost from start to goal through this node
	this.getF = function() {
		return this._f;
	};

	this.setPredecessor = function(__p) {
		predecessor = __p;
	};
	this.getPredecessor = function() {
		return predecessor;
	};
	this.isEqual = function(node) {
		// console.log('Node.isEqual');
		if (!(node instanceof Node)) {
			return false;
		}
		// console.log(JSON.stringify(node.getState()));
		// console.log(JSON.stringify(this.getState()));
		return JSON.stringify(node.getState()) == JSON.stringify(this
				.getState());
	};
}

/**
 * This is an improved Priority Queue data type implementation that can be used
 * to sort any object type. It uses a technique called a binary heap.
 * 
 * For more on binary heaps see: http://en.wikipedia.org/wiki/Binary_heap
 * 
 * @param {String}
 *            criteria The criteria by which to sort the objects. This should be
 *            a property of the objects you're sorting.
 * 
 * @param {Number}
 *            heapType either PriorityQueue.MAX_HEAP or PriorityQueue.MIN_HEAP.
 */
var PriorityQueue = function(criteria, heapType) {
	this.length = 0; // The current length of heap.
	/**
	 * @memberOf PriorityQueue
	 */
	var queue = [];
	var isMax = false;

	// Constructor
	if (heapType == PriorityQueue.MAX_HEAP) {
		isMax = true;
	}

	this.size = function() {
		return this.length;
	};

	/**
	 * Inserts the value into the heap and sorts it.
	 * 
	 * @param value
	 *            The object to insert into the heap.
	 * @memberOf PriorityQueue
	 * @return
	 */
	this.insert = function(value) {
		if (!value.hasOwnProperty(criteria)) {
			throw "Cannot insert " + value
					+ " because it does not have a property by the name of "
					+ criteria + ".";
		}
		queue.push(value);
		this.length++;
		bubbleUp(this.length - 1);
	};

	this.add = this.insert;

	/**
	 * Peeks at the highest priority element.
	 * 
	 * @return the highest priority element
	 */
	this.getHighestPriorityElement = function() {
		return queue[0];
	};

	this.peek = this.getHighestPriorityElement;

	/**
	 * Removes and returns the highest priority element from the queue.
	 * 
	 * @return the highest priority element
	 */
	this.shiftHighestPriorityElement = function() {
		if (this.length === 0) {
			throw ("There are no more elements in your priority queue.");
		} else if (this.length === 1) {
			var onlyValue = queue[0];
			queue = [];
			this.length = 0;
			return onlyValue;
		}
		var oldRoot = queue[0];
		var newRoot = queue.pop();
		this.length--;
		queue[0] = newRoot;
		swapUntilQueueIsCorrect(0);
		return oldRoot;
	};

	this.poll = this.shiftHighestPriorityElement;

	/**
	 * @memberOf PriorityQueue
	 */
	var bubbleUp = function(index) {
		if (index === 0) {
			return;
		}
		var parent = getParentOf(index);
		if (evaluate(index, parent)) {
			swap(index, parent);
			bubbleUp(parent);
		} else {
			return;
		}
	};

	var swapUntilQueueIsCorrect = function(value) {
		var left = getLeftOf(value);
		var right = getRightOf(value);
		if (evaluate(left, value)) {
			swap(value, left);
			swapUntilQueueIsCorrect(left);
		} else if (evaluate(right, value)) {
			swap(value, right);
			swapUntilQueueIsCorrect(right);
		} else if (value == 0) {
			return;
		} else {
			swapUntilQueueIsCorrect(0);
		}
	};

	var swap = function(self, target) {
		var placeHolder = queue[self];
		queue[self] = queue[target];
		queue[target] = placeHolder;
	};

	var evaluate = function(self, target) {
		if (queue[target] === undefined || queue[self] === undefined) {
			return false;
		}

		var selfValue;
		var targetValue;

		// Check if the criteria should be the result of a function call.
		if (typeof queue[self][criteria] === 'function') {
			selfValue = queue[self][criteria]();
			targetValue = queue[target][criteria]();
		} else {
			selfValue = queue[self][criteria];
			targetValue = queue[target][criteria];
		}

		if (isMax) {
			if (selfValue > targetValue) {
				return true;
			} else {
				return false;
			}
		} else {
			if (selfValue < targetValue) {
				return true;
			} else {
				return false;
			}
		}
	};

	var getParentOf = function(index) {
		return Math.floor(Math.floor((index - 1) / 2));
	};

	var getLeftOf = function(index) {
		return index * 2 + 1;
	};

	var getRightOf = function(index) {
		return index * 2 + 2;
	};
};

// Constants
PriorityQueue.MAX_HEAP = 0;
PriorityQueue.MIN_HEAP = 1;