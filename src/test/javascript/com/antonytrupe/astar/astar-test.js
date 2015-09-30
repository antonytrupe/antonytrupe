QUnit.test("hello test", function(assert) {
	assert.ok(1 == "1", "Passed!");
});

QUnit.test("example PriorityQueue.MIN_HEAP", function(assert) {
	var p = new PriorityQueue("value", PriorityQueue.MIN_HEAP);

	var object1 = {};
	var object2 = {};
	var object3 = {};
	var object4 = {};

	object1.value = 5;
	object2.value = 10;
	object3.value = 20;
	object4.value = 15;

	p.insert(object1);
	p.insert(object2);
	p.insert(object3);
	p.insert(object4);

	assert.equal(p.peek(), object1);
	assert.equal(p.shiftHighestPriorityElement(), object1);

	assert.equal(p.peek(), object2);
	assert.equal(p.shiftHighestPriorityElement(), object2);

	assert.equal(p.peek(), object4);
	assert.equal(p.shiftHighestPriorityElement(), object4);

	assert.equal(p.peek(), object3);
	assert.equal(p.shiftHighestPriorityElement(), object3);

	assert.equal(p.length, 0);

});

QUnit.test("example 1 PriorityQueue.MIN_HEAP", function(assert) {
	var p = new PriorityQueue("value", PriorityQueue.MIN_HEAP);

	var object1 = {};
	var object2 = {};

	object1.value = 10;
	object2.value = 5;

	p.insert(object1);
	assert.equal(p.peek(), object1);

	p.insert(object2);
	assert.equal(p.peek(), object2);

	assert.equal(p.shiftHighestPriorityElement(), object2);

});

QUnit.test("reverse PriorityQueue.MIN_HEAP", function(assert) {
	var p = new PriorityQueue("value", PriorityQueue.MIN_HEAP);

	var object1 = {};
	var object2 = {};
	var object3 = {};
	// var object4 = {};

	object1.value = 20;
	object2.value = 15;
	object3.value = 10;
	// object4.value = 5;

	p.add(object1);
	assert.equal(p.peek(), object1);
	p.add(object2);
	assert.equal(p.peek(), object2);
	p.add(object3);
	// p.insert(object4);

	// assert.equal(p.peek(), object4);
	// assert.equal(p.shiftHighestPriorityElement(), object4);

	assert.equal(p.peek(), object3);
	assert.equal(p.shiftHighestPriorityElement(), object3);

	assert.equal(p.peek(), object2);
	assert.equal(p.shiftHighestPriorityElement(), object2);

	assert.equal(p.peek(), object1);
	assert.equal(p.shiftHighestPriorityElement(), object1);

	assert.equal(p.length, 0);

});

QUnit.test("PriorityQueue.MIN_HEAP", function(assert) {

	var pq = new PriorityQueue('state', PriorityQueue.MIN_HEAP);
	var zero = {};
	zero.state = 10;

	// console.log(zero);

	var one = {};
	one.state = 20;
	// console.log(one);

	var two = {};
	two.state = 30;

	// console.log(two);

	// console.log('adding first element');
	pq.add(two);
	// console.log(pq);
	assert.equal(pq.peek().state, 30, "make sure 30 is on the top");

	// console.log('adding second element');
	pq.add(one);
	// console.log(pq);
	// console.log(pq.peek());
	assert.equal(pq.peek().state, 20, "make sure 20 is on the top");

	// console.log('adding third element');
	pq.add(zero);
	// console.log(pq);

	assert.equal(pq.peek().state, 10, "make sure 10 is on the top");
});

QUnit.test("deepEqual", function(assert) {
	function State(_node) {
		this.node = _node;
	}
	var one = new State(1);
	var one1 = new State(1);
	assert.deepEqual({
		'node' : 1
	}, {
		'node' : 1
	}, 'object type the same:object');

	assert.deepEqual(one, one1, 'object type the same:State');
	assert.notDeepEqual(one, {
		'node' : 1
	}, 'object type checked');
});

QUnit.test("node equality", function(assert) {
	assert.ok(new Node({
		'state' : 1
	}).isEqual(new Node({
		'state' : 1
	})), "1==1");
	assert.ok(!new Node({
		'state' : 1
	}).isEqual(new Node({
		'state' : 2
	})), "1==2");

});

QUnit.test("model validation", function(assert) {
	assert.throws(function() {
		new AStar();
	}, "no ai provided", "no ai provided");
	assert.throws(function() {
		new AStar({});
	}, /ai missing attributes:/, "model missing attributes");
	assert.ok(new AStar({
		'getActions' : function() {
			// mock
		},
		'hScore' : function() {
			// mock
		},
		'keepSearching' : function() {
			return true;
		},
		'getGoal' : function() {
			// mock
			return new Node({});
		},
		'gScore' : function() {
			// mock
		},

		'setState' : function() {
			// mock
		},
		'getState' : function() {
			// mock
			return new Node({});
		}
	}), "mock model");
});

QUnit.test("single node model search", function(assert) {
	var mock_model = {
		'getActions' : function() {
			// mock
			return [];
		},
		'hScore' : function() {
			// mock
		},

		'getGoal' : function() {
			// mock
			return 0;
		},
		'keepSearching' : function() {
			return true;
		},
		'gScore' : function() {
			// mock
		},

		'setState' : function() {
			// mock
			return this;
		},
		'getState' : function() {
			// mock
			return 0;
		}
	};
	assert.deepEqual(new AStar(mock_model).search(), [ 0 ],
			"single node model search");
});

QUnit.test("2 node/one step model search", function(assert) {
	function AI() {
		this._state = 0;
		this.getActions = function() {
			// mock
			if (this._state == 0) {
				return [ {
					'state' : 1
				} ];
			}
			return [];
		};
		this.hScore = function() {
			// mock
		};

		this.getGoal = function() {
			// mock
			return 1;
		};
		this.keepSearching = function() {
			return true;
		};
		this.gScore = function() {
			// mock
		};

		this.setState = function(state) {
			// mock
			this._state = state;
			return this;
		};
		this.getState = function() {
			// mock
			return this._state;
		};

	}

	// console.log([ 0, 1 ]);
	// console.log(new AStar(new AI()).search());
	assert.deepEqual(new AStar(new AI()).search(), [ 0, 1 ],
			"2 node/one step model search");
});

QUnit.test("3 node/one step/dead-end model search", function(assert) {
	function AI() {
		this._state = 0;
		this.getActions = function() {
			// mock
			if (this._state == 0) {
				return [ {
					'state' : 1
				}, {
					'state' : 2
				} ];
			}
			return [];
		};
		this.hScore = function() {
			// mock
		};
		this.keepSearching = function() {
			return true;
		};
		this.getGoal = function() {
			// mock
			return 2;
		};
		this.gScore = function() {
			// mock
		};

		this.setState = function(state) {
			// mock
			this._state = state;
			return this;
		};
		this.getState = function() {
			// mock
			return this._state;
		};
	}
	assert.deepEqual(new AStar(new AI()).search(), [ 0, 2 ],
			"3 node/one step/dead-end model search");
});

QUnit.test("4 node/2 step/dead-end model search", function(assert) {
	function State(_node) {
		this.node = _node;
	}
	var zero = new State(0);
	var one = new State(1);
	var two = new State(2);
	var three = new State(3);

	function AI(_state) {
		// private, use getter and setter methods
		this._state = _state;

		this.getActions = function() {

			// mock
			switch (this._state.node) {
			case 0:
				return [ {
					'state' : one
				}, {
					'state' : two
				} ];
			case 2:

				return [ {
					'state' : three
				} ];
			}
			return [];
		};
		this.hScore = function() {
			// mock
		};

		this.keepSearching = function() {
			return true;
		};
		this.getGoal = function() {
			// mock
			return three;
		};
		this.gScore = function() {
			// mock
		};
		this.setState = function(state) {
			// mock
			this._state = state;
			return this;
		};
		this.getState = function() {
			return this._state;
		};
	}
	// console.log([ { 'node' : 0 }, { 'node' : 2 }, { 'node' : 3 } ]);

	// console.log(new AStar(new AI(zero)));
	// return;
	assert.deepEqual(new AStar(new AI(zero)).search(), [ zero, two, three ],
			"4 node/2 step/dead-end model search");
});

QUnit.test("diamond:first path is shorter", function(assert) {

	function State(_node) {
		this.node = _node;
	}
	var zero = new State(0);
	var one = new State(1);
	var two = new State(2);
	var three = new State(3);

	// a mock up of thediskgame.AI
	// the AI is responsible for creating new world/game states
	function AI(state) {
		this._state = state;
		// returns an array of objects
		// each object contains 3 attributes: the 'action' to get to the new
		// state, the 'args' for the function in the first argument,
		// and the 'state' resulting from calling the 'action' with the 'args'
		this.getActions = function() {
			// mock
			switch (this._state.node) {
			case 0:

				return [ {
					'state' : one
				}, {
					'state' : two
				} ];
			case 1:
			case 2:
				return [ {
					'action' : '',
					'args' : '',
					'state' : three
				} ];

			default:
				return [];
			}
		};
		// h, heuristic, estimated cost from the node to the goal
		this.hScore = function() {
			switch (this._state.node) {
			case 0:
				return 10;
			case 1:
				return 4;
			case 2:
				return 5;
			}
			// mock
		};
		this.keepSearching = function() {
			return true;
		};
		this.getGoal = function() {
			// mock
			return three;
		};
		// actual cost from start to current node
		this.gScore = function() {
			// mock
		};

		this.setState = function(_state) {
			// mock
			this._state = _state;
			return this;
		};
		this.getState = function() {
			return this._state;
		};
	}
	assert.deepEqual(new AStar(new AI(zero)).search(), [ zero, one, three ],
			"diamond:first path is shorter");
});

QUnit.test("diamond:second path is shorter", function(assert) {

	function State(_node) {
		this.node = _node;
	}
	var zero = new State(0);
	var one = new State(1);
	var two = new State(2);
	var three = new State(3);

	function AI(state) {
		this._state = state;
		this.getActions = function() {
			// mock
			switch (this._state.node) {
			case 0:
				return [ {
					'function' : 'moveToNode',
					'arguments' : 1,
					'state' : one
				}, {
					'function' : 'moveToNode',
					'arguments' : 2,
					'state' : two
				} ];

				// both nodes 1 and 2 go to 3
			case 1:
			case 2:
				return [ {
					'function' : 'moveToNode',
					'arguments' : 3,
					'state' : three
				} ];
			default:
				return [];
			}
		};
		// h, heuristic, estimated cost from the node to the goal
		this.hScore = function() {
			// console.log(this._state.node);
			switch (this._state.node) {
			case 0:
				return 10;
			case 1:
				return 5;
			case 2:
				return 4;
			}
			// mock
		};
		this.setState = function(_state) {
			// console.log(_state);
			// mock
			this._state = _state;
			// console.log(this._state);
			return this;
		};
		this.getState = function() {
			return this._state;
		};
		this.getGoal = function() {
			// mock
			return three;
		};
		this.keepSearching = function() {
			return true;
		};
		// actual cost from start to current node
		this.gScore = function() {
			// mock
			return 0;
		};

	}

	assert.deepEqual(new AStar(new AI(zero)).search(), [ zero, two, three ],
			"diamond:second path is shorter");
});

QUnit.test("no path to goal", function(assert) {

	function State(_node) {
		this.node = _node;
	}
	var zero = new State(0);
	var one = new State(1);
	var two = new State(2);
	var three = new State(3);
	var four = new State(4);

	function AI(state) {
		this._state = state;
		this.getActions = function() {
			// mock
			switch (this._state.node) {
			case 0:
				return [ {
					'function' : 'moveToNode',
					'arguments' : 1,
					'state' : one
				}, {
					'function' : 'moveToNode',
					'arguments' : 2,
					'state' : two
				} ];

				// both nodes 1 and 2 go to 3
			case 1:
			case 2:
				return [ {
					'function' : 'moveToNode',
					'arguments' : 3,
					'state' : three
				} ];
			default:
				return [];
			}
		};
		// h, heuristic, estimated cost from the node to the goal
		this.hScore = function() {
			// console.log(this._state.node);
			switch (this._state.node) {
			case 0:
				return 10;
			case 1:
				return 5;
			case 2:
				return 4;
			case 3:
				return 1;
			}
			// mock
		};
		this.setState = function(_state) {
			// console.log(_state);
			// mock
			this._state = _state;
			// console.log(this._state);
			return this;
		};
		this.getState = function() {
			return this._state;
		};
		this.getGoal = function() {
			// mock
			return four;
		};
		this.keepSearching = function() {
			return true;
		};
		// actual cost from start to current node
		this.gScore = function() {
			// mock
			switch (this._state.node) {
			case 0:
				return 0;
			case 1:
				return 5;
			case 2:
				return 4;
			case 3:
				return 1;
			}
		};

	}

	assert.deepEqual(new AStar(new AI(zero)).search(), [ zero, two, three ],
			"no path to goal");
});
