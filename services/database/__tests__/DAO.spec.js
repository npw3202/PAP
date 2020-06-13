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

    await db.insertOrUpdate(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value3",
        "key3": "value4"
    })
    let searchFromInsertOrUpdate = await db.search(EXAMPLE_TABLE, {
        "key1": "value1",
        "key2": "value3"
    });
    expect(searchFromInsertOrUpdate).toStrictEqual([{
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
    console.log(scanFromDelete)
    expect(scanFromDelete).toStrictEqual([{
        "key1": "value1",
        "key2": "value3",
        "key3": "value4"
    }]);


});
