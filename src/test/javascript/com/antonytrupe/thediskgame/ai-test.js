QUnit.test("hello test", function(assert) {
    assert.ok(1 == "1", "Passed!");
});

QUnit.test("reinforcements", function(assert) {
    var table = new Table("", 2);
    table.placeStagingDisks();
    var playerOne = new Player("one");
    var playerTwo = new Player("two");
    var peasant = new Disk("Peasants", "creature", "1", "2", "1", "4", "1",
            "false", "false", "false", "0", "0", "0", "0", "0", "2",
            "Unaligned", "Neutral", "1.75", "", "0");

    playerOne.addDiskToArmy("One", playerOne.addDisk(peasant));
    playerTwo.addDiskToArmy("One", playerTwo.addDisk(peasant));
    table.join(playerOne, "One");
    table.join(playerTwo, "One");
    // console.log(table.memento.players);
    assert.deepEqual(table.memento.players[playerOne.name], playerOne,
            "table has both players");
    assert.deepEqual(table.memento.players[playerTwo.name], playerTwo,
            "table has both players");
    var playerOneAi = new AI(table, playerOne.name);
    assert.equal(playerOneAi.table, table, "ai has table saved");
    var a = playerOneAi.getPath();
    console.log(a);
    // do the first action and make sure the game advances
    assert.equal(a[0].method, 'endReinforcements',
            'endReinforcements for player one');
    assert.deepEqual(a[0].arguments, [playerOne.name],
            'endReinforcements for player one');
    // console.log(table.memento);
    table[a[0].method].apply(table, a[0].arguments);

    // make sure player one advanced to the activations segment
    assert.equal(playerOne.segment, "ACTIVATION", 'player 1 is in activation');
    // make sure the table is still in reinforcements
    assert.equal(table.memento.segment, Table.SEGMENT.REINFORCEMENTS,
            'the table is in reinforcements');

    var playerTwoAi = new AI(table, playerTwo.name);
    var b = playerTwoAi.getPath();
    // console.log(b);
    assert.equal(b[0].method, 'endReinforcements',
            'endReinforcements for player 2');
    assert.deepEqual(b[0].arguments, [playerTwo.name],
            'endReinforcements for player 2');

});

QUnit.test("attack", function(assert) {
    var table = new Table("", 2);
    table.placeStagingDisks();
    var playerOne = new Player("one");
    var playerTwo = new Player("two");
    var peasant = new Disk("Peasants", "creature", "1", "2", "1", "4", "1",
            "false", "false", "false", "0", "0", "0", "0", "0", "2",
            "Unaligned", "Neutral", "1.75", "", "0");

    playerOne.addDiskToArmy("One", playerOne.addDisk(peasant));
    playerTwo.addDiskToArmy("One", playerTwo.addDisk(peasant));
    table.join(playerOne, "One");
    table.join(playerTwo, "One");
    // console.log(table.memento.players);
    assert.deepEqual(table.memento.players[playerOne.name], playerOne,
            "table has both players");
    assert.deepEqual(table.memento.players[playerTwo.name], playerTwo,
            "table has both players");
    var playerOneAi = new AI(table, playerOne.name);
    assert.equal(playerOneAi.table, table, "ai has table saved");
    var onePath = playerOneAi.getPath();
    // console.log(a);
    // do the first action and make sure the game advances
    assert.equal(onePath[0].method, 'endReinforcements',
            'endReinforcements for player one');
    assert.deepEqual(onePath[0].arguments, [playerOne.name],
            'endReinforcements for player one');
    // console.log(table.memento);
    table[onePath[0].method].apply(table, onePath[0].arguments);

    // make sure player one advanced to the activations segment
    assert.equal(playerOne.segment, "ACTIVATION", 'player 1 is in activation');
    // make sure the table is still in reinforcements
    assert.equal(table.memento.segment, Table.SEGMENT.REINFORCEMENTS,
            'the table is in reinforcements');

    var playerTwoAi = new AI(table, playerTwo.name);
    var twoPath = playerTwoAi.getPath();
    // console.log(b);
    assert.equal(twoPath[0].method, 'endReinforcements',
            'endReinforcements for player 2');
    assert.deepEqual(twoPath[0].arguments, [playerTwo.name],
            'endReinforcements for player 2');
    table[twoPath[0].method].apply(table, twoPath[0].arguments);

    // make sure player two advanced to the activations segment
    assert.equal(playerTwo.segment, "ACTIVATION", 'player 2 is in activation');

    // make sure the table is in activation
    assert.equal(table.getSegment(), Table.SEGMENT.ACTIVATION,
            'table is in activation');

    // check the round
    assert.equal(table.getRound(), 0, 'round 0');

    // make sure playerOne is the currentPlayer
    assert.equal(playerOne.name, table.getCurrentPlayer(),
            'player one is the current player');

    // get player one's activations
    onePath = playerOneAi.getPath();
    // execute playerOne's activations
    onePath.forEach(function(action) {
        console.log(action);
        table[action.method].apply(table, action.arguments);
    });
    
    // make sure playerOne advanced to the Combat segment
    assert.equal(playerOne.segment, "MISSILE", 'playerOne is in MISSILE');

    // TODO check the location of playerOne's disk
    assert.equal(table.getDiskInfo(0).mementoInfo.location, new Point(-8, 0),
            'playerOnes disk moved');

    // make sure player two is the current player
    assert.equal(playerTwo.name, table.getCurrentPlayer(),
            'player two is the current player');

    // get playerTwo's moves
    twoPath = playerTwoAi.getPath();
    // do player two's moves
    twoPath.forEach(function(action) {
        console.log(action);
        table[action.method].apply(table, action.arguments);
    });

    // TODO check the location of playerTwo's disk
    assert.equal(table.getDiskInfo(0).mementoInfo.location, new Point(8, 0),
            'playerOnes disk moved');

    // check the round
    assert.equal(table.getRound(), 1, 'round 1');

    // make sure playerOne is the currentPlayer
    assert.equal(playerTwo.name, table.getCurrentPlayer(),
            'player two is the current player');

});