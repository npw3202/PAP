/**
 * This represents the high level (psudeo-) DAO used for interacting with postgres.
 */

const { Client } = require('pg');

class AbstractDAO {
    /**
     * This abstract class is provided primarily for testing
     * The PGDAO overrides with an actual Postgres implementation of the DAO while
     * the InMemDAO is exclusively in memory. The AbstractDAO provides a common interface
     */
    noAbstract() {
        throw new Error("Cannot run request on the AbstractDAO. Use one of its children.");
    }

    async insert(tableSchema, row) {
        /**
         * Inserts a row into a table.
         * This requires that
         * 1. the full key is contained within the row
         * 2. all non-nullable fields are within the row
         * 3. the row does not already exist within the table
         */
        this.noAbstract();
    }
 
    async update(tableSchema, columns) {
        /**
         * Updates an already existing row in a table.
         * This requires that
         * 1. the full key is contained within the row
         * 2. a row already exists with the corresponding key within the table
         */
        this.noAbstract();
    }

    async del(tableSchema, key) {
        /**
         * Deletes a row.
         * This requires
         * 1. only the key is provided (i.e. no extra columns)
         * 2. the key already exists within the table
         */
        this.noAbstract();
    }

    async scan(tableSchema) {
        /**
         * Scans all rows in a table
         */
        this.noAbstract();
    }

    async search(tableSchema, rowSubset) {
        /**
         * Scans for rows satisfying the given requirements within a table
         * This specifically queries for rows with values within the rowSubset
         * e.g. if rowSubset is {k1: v1, k2: v2} and our db is [{k1: v1}, {k1:v1, k2:v2}, {k1:v1, k2:v2, k3:v3}]
         * this will return the [{k1:v1, k2:v2}, {k1:v1, k2:v2, k3:v3}]
         */
        this.noAbstract();
    }

    // the methods below here are common utility functions
    keyColumnsAreContained(tableSchema, row) {
        for (let keyColumn of tableSchema.KEY_COLUMNS) {
            if (!row.hasOwnProperty(keyColumn)) {
                return false;
            }
        }
        return true;
    }

    exactlyKeyColumnsAreContained(tableSchema, row) {
        for (let rowColumn in row) {
            if (!tableSchema.KEY_COLUMNS.includes(rowColumn)) {
                return false;
            }
        }
        return this.keyColumnsAreContained(tableSchema, row);
    }

    nonNullColumnsAreContained(tableSchema, row) {
        for (let keyColumn of tableSchema.NON_NULLABLE_COLUMNS) {
            if (!row.hasOwnProperty(keyColumn)) {
                return false;
            }
        }
        return true;
    }
    
    containsOnlyValidColumns (tableSchema, row) {
        for (let rowColumn in row) {
            if (!tableSchema.COLUMNS.includes(rowColumn)) {
                return false;
            }
        }
        return true;
    }

    extractKeyColumns(tableSchema, row) {
        // this assumes the the row has all the key columns
        let key = {};
        for (let keyColumn of tableSchema.KEY_COLUMNS) {
            key[keyColumn] = row[keyColumn];
        }
        return key;
    }
}

class PGDAO extends AbstractDAO {
    /**
     * This is the basic DAO for postgres. It is important to note that although SQL
     * Injection cannot occur within the value field of a row, it can very easily occur within
     * the key (i.e. the column name) field. Therefore, make sure that the column names are supplied
     * by you. Note that this doesn't yet support transactionality (but this can be added if deemed important).
     */
    client = new Client();
    inited = false;
    dryMode = false;
    requestHistory = [];

    constructor(dryMode = false) {
        super();
        this.dryMode = dryMode;
    }

    async endPGConnection() {
        await this.client.end();
    }

    async startPGConnection() {
        await this.client.connect();
    }

    async insert(tableSchema, row) {
        if (!this.containsOnlyValidColumns(tableSchema, row)) {
            throw new Error("your request contains an invalid column");
        }
        if (!this.keyColumnsAreContained(tableSchema, row)) {
            throw new Error("your request does not contain all the required key columns");
        }
        if (!this.nonNullColumnsAreContained(tableSchema, row)) {
            throw new Error("your request does not contain all the required non-null columns");
        }
        let [names, wildcards, values] = this.paramerterizeRowForInsert(row);
        let queryText = 'INSERT INTO ' + tableSchema.TABLE_NAME + '(' + names + ') VALUES (' + wildcards + ');';
        if (!this.dryMode) {
            await this.client.query(queryText, values);
        }
        this.requestHistory.push([queryText, values]);
    }
 
    async update(tableSchema, row) {
        if (!this.containsOnlyValidColumns(tableSchema, row)) {
            throw new Error("your request contains an invalid column");
        }
        if (!this.keyColumnsAreContained(tableSchema, row)) {
            throw new Error("your request does not contain all the required key columns");
        }
        let [names, values] = this.paramerterizeRowForUpdate(row);
        let queryText = 'UPDATE ' + tableSchema.TABLE_NAME + ' SET ' + names + ';';
        if (!this.dryMode) {
            await this.client.query(queryText, values);
        }
        this.requestHistory.push([queryText, values]);
    }

    async del(tableSchema, row) {
        if (!this.containsOnlyValidColumns(tableSchema, row)) {
            throw new Error("your request contains an invalid column");
        }
        if (!this.exactlyKeyColumnsAreContained(tableSchema, row)) {
            throw new Error("your request does not contain all the required key columns");
        }
        let [names, values] = this.paramerterizeRowForDeleteOrSearch(row);
        let queryText = 'DELETE FROM ' + tableSchema.TABLE_NAME + ' WHERE ' + names + ';';
        if (!this.dryMode) {
            await this.client.query(queryText, values);
        }
        this.requestHistory.push([queryText, values]);
    }

    async scan(tableSchema) {
        let queryText = "SELECT * FROM " + tableSchema.TABLE_NAME + ';';
        this.requestHistory.push([queryText]);
        if (this.dryMode) {
            return [];
        }
        let res = await this.client.query(queryText);
        return res.rows;
    }

    async search(tableSchema, rowSubset) {
        if (!Object.keys(rowSubset).length) {
            // without any rowsubset, this is just a scan.
            return await this.scan(tableSchema);
        }
        let [names, values] = this.paramerterizeRowForDeleteOrSearch(rowSubset);
        let queryText = "SELECT * FROM " + tableSchema.TABLE_NAME + " WHERE " + names + ';';
        this.requestHistory.push([queryText, values]);
        if (this.dryMode) {
            return [];
        }
        let res = await this.client.query(queryText, values);
        return res.rows;
    }

    paramerterizeRowForInsert(row){
        let names = "";
        let wildCards = "";
        let values = [];
        let cntr = 1;
        for (let key in row) {
            if (cntr > 1) {
                names += ", "
                wildCards += ", "
            }
            values.push(row[key]);
            // this is the sql injectable portion (though a majority of the sql injectability is handeled by the)
            // "containsOnlyValidColumns" code
            names += key;
            wildCards += "$" + cntr.toString();
            cntr++;
        }
        return [names, wildCards, values];
    }

    paramerterizeRowForUpdate(row){
        let names = "";
        let values = [];
        let cntr = 1;
        for (let key in row) {
            values.push(row[key]);
            if (cntr > 1) {
                names += ", "
            }
            // this is the sql injectable portion (though a majority of the sql injectability is handeled by the)
            // "containsOnlyValidColumns" code
            names += key + " = $"+cntr.toString();
            cntr++;
        }
        return [names, values];
    }

    paramerterizeRowForDeleteOrSearch(row){
        let names = "";
        let values = [];
        let cntr = 1;
        for (let key in row) {
            values.push(row[key]);
            if (cntr > 1) {
                names += " AND "
            }
            // this is the sql injectable portion (though a majority of the sql injectability is handeled by the)
            // "containsOnlyValidColumns" code
            names += key + " = $"+cntr.toString();
            cntr++;
        }
        return [names, values];
    }
}

// TODO: make all the error messages more descriptive (i.e. what is not contained)
class InMemDAO extends AbstractDAO {
    // this database is a nested map containing table_name => key_name => row
    database = new Map();
    constructor(tables) {
        super();
        for (let table of tables) {
            this.database.set(table.TABLE_NAME, new Map());
        }
    }
    async insert(tableSchema, row) {
        if (!this.containsOnlyValidColumns(tableSchema, row)) {
            throw new Error("your request contains an invalid column");
        }
        if (!this.keyColumnsAreContained(tableSchema, row)) {
            throw new Error("your request does not contain all the required key columns");
        }
        if (!this.nonNullColumnsAreContained(tableSchema, row)) {
            throw new Error("your request does not contain all the required non-null columns");
        }
        let table = this.database.get(tableSchema.TABLE_NAME);
        table.set(JSON.stringify(this.extractKeyColumns(tableSchema, row)), row)
    }
 
    async update(tableSchema, row) {
        if (!this.containsOnlyValidColumns(tableSchema, row)) {
            throw new Error("your request contains an invalid column");
        }
        if (!this.keyColumnsAreContained(tableSchema, row)) {
            throw new Error("your request does not contain all the required key columns");
        }
        let table = this.database.get(tableSchema.TABLE_NAME);
        if (!table.has(JSON.stringify(this.extractKeyColumns(tableSchema, row)))) {
            throw new Error("no row with the specified key exists in the database");
        }
        let currentValue = table.get(JSON.stringify(this.extractKeyColumns(tableSchema, row)));
        this.mergeInto(row, currentValue);
        table.set(JSON.stringify(this.extractKeyColumns(tableSchema, row)), currentValue);
    }

    async del(tableSchema, row) {
        if (!this.containsOnlyValidColumns(tableSchema, row)) {
            throw new Error("your request contains an invalid column");
        }
        if (!this.exactlyKeyColumnsAreContained(tableSchema, row)) {
            throw new Error("your request does not contain all the required key columns");
        }
        let table = this.database.get(tableSchema.TABLE_NAME);
        if (!table.has(JSON.stringify(this.extractKeyColumns(tableSchema, row)))) {
            throw new Error("no row with the specified key exists in the database");
        }
        table.delete(JSON.stringify(this.extractKeyColumns(tableSchema, row)));
    }

    async scan(tableSchema) {
        let table = this.database.get(tableSchema.TABLE_NAME);
        return Array.from(table.values());
    }

    async search(tableSchema, rowSubset) {
        let result = [];
        let table = this.database.get(tableSchema.TABLE_NAME);
        for (let row of table.values()) {
            let matched = true;
            for (let col in rowSubset) {
                if (!row.hasOwnProperty(col) || row[col] != rowSubset[col]) {
                    matched = false;
                }
            }
            if (matched) {
                result.push(row);
            }
        }
        return result;
    }
    mergeInto(source, destination) {
        for (let i in source){
            destination[i] = source[i];
        }
    }
}

exports.InMemDAO = InMemDAO
exports.AbstractDAO = AbstractDAO
exports.PGDAO = PGDAO