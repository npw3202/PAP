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
 
    async insertOrUpdate(tableSchema, columns) {
        /**
         * Inserts or updates a row in a table.
         * This requires that
         * 1. the full key is contained within the row
         * 2. all non-nullable fields are within the row
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
    client = new Client();
    inited = false;
    async insert(tableSchema, row) {
    }
 
    async insertOrUpdate(tableSchema, columns) {
    }

    async update(tableSchema, columns) {
    }

    async del(tableSchema, key) {
    }

    async scan(tableSchema) {
    }
    async endPGConnection() {
        await PGDAO.client.end();
    }
    async startPGConnection() {
        await PGDAO.client.init();
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
 
    async insertOrUpdate(tableSchema, row) {
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
        let currentValue = {}
        if (table.has(JSON.stringify(this.extractKeyColumns(tableSchema, row)))) {
            currentValue = table.get(JSON.stringify(this.extractKeyColumns(tableSchema, row)));
        }
        this.mergeInto(row, currentValue);
        table.set(JSON.stringify(this.extractKeyColumns(tableSchema, row)), currentValue);
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
