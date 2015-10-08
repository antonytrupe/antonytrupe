/**
 * @class
 * @param {Object}
 *          model - object that represents the world and provides information to
 *          AStar
 * @param {Function}
 *          model.getActions - return a list of objects that have an attributes
 *          state and method: [{'state':'1,'action':'jump'}...]
 * @param {Function}
 *          model.gScore - return actual cost to this state from initial state
 * @param {Function}
 *          model.hScore - return estimated cost from current state to goal
 * @param {Function}
 *          model.atGoal - return false to keep searching, true to stop
 *          searching
 * @param {Function}
 *          model.setState - restore the model to to a specific state
 * @param {Function}
 *          model.getState - return the current state of the model
 */
function AStar(model) {
    "use strict";
    /**
     * the nodes we've already listed, for checking to make sure we don't
     * backtrack
     */
    var closedSet = new Set();
    /**
     * @type {PriorityQueue} - the nodes we've already visited, in order
     */
    var closedPriorityQueue = new PriorityQueue('getH', PriorityQueue.MIN_HEAP);

    /**
     * @type {PriorityQueue} - the nodes we want to visit
     */
    var openPriorityQueue = new PriorityQueue('getF', PriorityQueue.MIN_HEAP);

    // make sure we got a model
    if (typeof model === "undefined") {
        throw "no model provided";
    }

    // make sure the model has the right methods for a_star to use
    var requiredModelMembers = ['getActions', 'gScore', 'hScore', 'setState',
            'getState', 'atGoal', 'keepSearching'];
    var missingMembers = [];
    requiredModelMembers.forEach(function(method) {
        if (typeof model[method] === "undefined") {
            missingMembers.push(method);
        }
    });
    if (missingMembers.length !== 0) {
        throw "model missing attributes: " + JSON.stringify(missingMembers);
    }

    // now initialize some stuff
    var start = new Node({
        'state': model.getState()
    });
    start.setG(0);
    start.setH(model.hScore());

    openPriorityQueue.add(start);

    /**
     * @memberOf AStar
     * @return
     */
    function process() {
        var loops = 0, MAX_LOOPS = 50000;
        // && loops <= MAX_LOOPS
        while (openPriorityQueue.size() > 0 && model.keepSearching()) {
            loops++;
            /**
             * @type {Node}
             */
            var q = openPriorityQueue.peek();
            model.setState(q.getState());

            // the stopping condition(s)
            if (model.atGoal()) {
                // console.log('got to goal or some other constraint');
                return q;
            }

            // remove this node from the open list
            openPriorityQueue.poll();
            // add it to the closed lists
            closedSet.add(JSON.stringify(q.getState()));
            closedPriorityQueue.add(q);

            // get actions returns an array of objects
            model.getActions().forEach(function(n) {
                model.setState(n.state);
                var neighbor = new Node(n);

                neighbor.setPredecessor(q);
                // get the total cost
                neighbor.setG(model.gScore(q.getG(), n.action));
                neighbor.setH(model.hScore());

                // check the closed set to make sure we don't
                // backtrack
                if (!closedSet.has(JSON.stringify(neighbor.getState()))) {
                    openPriorityQueue.add(neighbor);
                }
            });

        }
        /**
         * if we got here, that means we failed to get to the goal. we may have
         * gotten here because openPriorityQueue is empty(no solution) or we may
         * have gotten here because we were forced to stop by some other
         * constraint
         */
        var c = openPriorityQueue.peek();
        if (typeof c === "undefined") {
            c = closedPriorityQueue.peek();
        }
        // return the best path we did find
        // console.log('got to a constraint');
        return c;
    }

    /**
     * @returns best state given constraints
     */
    this.getSolution = function() {
        return process().getState();
    };

    /**
     * @returns list of actions to get to the best state
     */
    this.search = function() {
        return reconstruct_path(process());
    };

    /**
     * @memberOf AStar
     * @param {Node}
     *          q
     * @return an array of objects that describe the path/actions to take
     */
    function reconstruct_path(q) {
        var total_path = [];
        /**
         * @type {Node}
         */
        var current = q;
        while (typeof current.getPredecessor() !== "undefined") {

            total_path.push(current.getAction());
            current = current.getPredecessor();
        }
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
    this.predecessor = args.predecessor;
    // action has method and arguments, if any
    // this is the action to get to this state from the predecessor state
    this.action = args.action;

    this.getAction = function() {
        return this.action;
    };

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

    this.getG = function() {
        return this._g;
    };

    // h is the estimated cost from this node to the goal
    this.setH = function(__h) {
        this._h = __h;
        this._f = this._g + this._h;
    };

    this.getH = function() {
        return this._h;
    };

    // f is total cost from start to goal through this node
    this.getF = function() {
        return this._f;
    };

    this.setPredecessor = function(__p) {
        this.predecessor = __p;
    };
    this.getPredecessor = function() {
        return this.predecessor;
    };
    this.isEqual = function(node) {
        if (!(node instanceof Node)) {
            return false;
        }
        return JSON.stringify(node.getState()) == JSON.stringify(this
                .getState());
    };
    this.compareTo = function(that) {
        if (this.getF() !== that.getF()) {
            if (this.getF() < that.getF()) {
                return -1;
            }
            return 1;
        } else {
            if (this.getH() == that.getH()) {
                return 0;
            } else if (this.getH() < that.getH()) {
                return 1;
            } else {
                return -1;
            }
        }
    };
}

/**
 * https://github.com/prettymuchbryce/easystarjs/blob/master/src/priority-queue.js
 * This is an improved Priority Queue data type implementation that can be used
 * to sort any object type. It uses a technique called a binary heap.
 * 
 * For more on binary heaps see: http://en.wikipedia.org/wiki/Binary_heap
 * 
 * @class
 * @param {String}
 *          criteria The criteria by which to sort the objects. This should be a
 *          property of the objects you're sorting.
 * 
 * @param {Number}
 *          heapType either PriorityQueue.MAX_HEAP or PriorityQueue.MIN_HEAP.
 */
var PriorityQueue = function(criteria, heapType) {
    this.length = 0; // The current length of heap.
    /**
     * @memberOf PriorityQueue
     * @type Array
     */
    var queue = [];
    var isMax = false;

    // Constructor
    if (heapType == PriorityQueue.MAX_HEAP) {
        isMax = true;
    }

    /**
     * @memberOf PriorityQueue
     * @return {number}
     */
    this.size = function() {
        return this.length;
    };

    /**
     * Inserts the value into the heap and sorts it.
     * 
     * @param value
     *          The object to insert into the heap.
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
        } else if (value === 0) {
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

        if (criteria == 'compareTo'
                && typeof queue[self][criteria] === 'function') {
            return queue[self][criteria](queue[target]);
        }
        // Check if the criteria should be the result of a function call.
        else if (typeof queue[self][criteria] === 'function') {
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