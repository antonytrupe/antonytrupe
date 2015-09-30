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
    var a = playerOneAi.search();
    console.log(a);
    // do the first action and make sure the game advances
    assert.equal(a[0].action.method, 'endReinforcements',
            'endReinforcements for player one');
    assert.deepEqual(a[0].action.arguments, [playerOne.name],
            'endReinforcements for player one');
    console.log(table.memento);
    table[a[0].action.method].apply(table, a[0].action.arguments);

    // make sure player one advanced to the activations segment
    assert.equal(playerOne.segment, "ACTIVATION" ,'player 1 is in activation');
    // make sure the table is still in reinforcements
    assert.equal(table.memento.segment, Table.SEGMENT.REINFORCEMENTS,'the table is in reinforcements');

    var playerTwoAi = new AI(table, playerTwo.name);
    var b = playerTwoAi.search();
    console.log(b);
    assert.equal(b[0].action.method, 'endReinforcements',
            'endReinforcements for player 2');
    assert.deepEqual(b[0].action.arguments, [playerTwo.name],
            'endReinforcements for player 2');

});