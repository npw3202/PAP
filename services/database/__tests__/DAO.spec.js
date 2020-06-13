// this doesn't test the postgres :-( I couldn't come up with a slick way of doing that.
// I've manually verified the postgres for the time being

var DAO = require('../DAO.js');
var schema = require('../schema.js');

class EXAMPLE_TABLE extends schema.TABLE_SCHEMA {
        static TABLE_NAME = "EXAMPLE";
        static KEY_COLUMNS = ["key1", "key2"];
        static NON_NULLABLE_COLUMNS = ["key1", "key2", "key3"];
        static COLUMNS = ["key1", "key2", "key3", "key4"];
}

test('Primary code path', async () => {
    let db = new DAO.InMemDAO([EXAMPLE_TABLE]);
    await db.insert(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value2",
        "key3": "value3"
    })
    let scanFromInsert = await db.scan(EXAMPLE_TABLE);
    expect(scanFromInsert).toStrictEqual([{
        "key1": "value1",
        "key2": "value2",
        "key3": "value3"
    }]);

    await db.insert(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value3",
        "key3": "value4"
    })
    let searchFromSecondInsert = await db.search(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value3"
    });
    expect(searchFromSecondInsert).toStrictEqual([{
        "key1": "value1",
        "key2": "value3",
        "key3": "value4"
    }]);

    await db.update(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value2",
        "key4": "value4"
    })
    let searchFromUpdate = await db.search(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value2"
    });
    expect(searchFromUpdate).toStrictEqual([{
        "key1": "value1",
        "key2": "value2",
        "key3": "value3",
        "key4": "value4"
    }]);
    await db.del(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value2"
    });
    let scanFromDelete = await db.scan(EXAMPLE_TABLE);
    expect(scanFromDelete).toStrictEqual([{
        "key1": "value1",
        "key2": "value3",
        "key3": "value4"
    }]);
});


test('Primary code path for Postgres', async () => {
    let db = new DAO.PGDAO(true);
    await db.insert(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value2",
        "key3": "value3"
    })
    await db.update(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value2",
        "key4": 2
    })
    await db.scan(EXAMPLE_TABLE);
    await db.search(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value2"
    });
    await db.del(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value2"
    });
    expect(db.requestHistory).toStrictEqual([
        [
          'INSERT INTO EXAMPLE(key1, key2, key3) VALUES ($1, $2, $3);',
          [ 'value1', 'value2', 'value3' ]
        ],
        [
          'UPDATE EXAMPLE SET key1 = $1, key2 = $2, key4 = $3;',
          [ 'value1', 'value2', 2 ]
        ],
        [ 'SELECT * FROM EXAMPLE;' ],
        [
          'SELECT * FROM EXAMPLE WHERE key1 = $1 AND key2 = $2;',
          [ 'value1', 'value2' ]
        ],
        [
          'DELETE FROM EXAMPLE WHERE key1 = $1 AND key2 = $2;',
          [ 'value1', 'value2' ]
        ]
    ]);
});