/**
 * This server will be the main interface with the postgres database.
 * This server will automatically handle all of the mapping tables.
 */

var Router = require("express-promise-router");
var express = require("express");
var DAO = require('./DAO.js');
var schema = require('./schema.js');
var bodyParser = require('body-parser')

const app = express();
const router = Router();
app.use(router);
app.use(bodyParser.urlencoded({ extended: false }))  
app.listen(3000, () => {
	console.log("Started server")
})

var PGInteractor = new DAO.PGDAO(false);
PGInteractor.startPGConnection();

const SUPPORTED_TABLES = [
	schema.ORGANIZATIONS_SCHEMA,
	schema.ORGANIZATIONS_TO_CASES_SCHEMA,
	schema.INCIDENT_SCHEMA,
	schema.INCIDENT_SCHEMA,
	schema.CASES_SCHEMA,
	schema.CASES_TO_INCIDENTS_SCHEMA,
	schema.OFFICER_SCHEMA,
	schema.USER_SCHEMA,
]

function setupDAOHandler(handle){
	return async (req, res, next) => {
		try {
			let tableName = req.path.substring(1,);
			let requestedTable = undefined;
			for (let table of SUPPORTED_TABLES) {
				if (table.TABLE_NAME.toLowerCase() == tableName.toLowerCase()) {
					requestedTable = table;
				}
			}
			if (requestedTable === undefined) {
				throw Error("Could not find a table with the requested name");
			}
			result = await handle(requestedTable, req)
			res.json(result);
		} catch (e) {
			next(e);
		}
	}
}

app.get("*", setupDAOHandler(async (requestedTable, req) => {
	return await PGInteractor.scan(requestedTable);
}));

app.post("*", setupDAOHandler(async (requestedTable, req) => {
	return await PGInteractor.search(requestedTable, req.body);
}));

app.put("*", setupDAOHandler(async (requestedTable, req) => {
	await PGInteractor.insert(requestedTable, req.body);
	return 'success';
}));

app.patch("*", setupDAOHandler(async (requestedTable, req) => {
	await PGInteractor.update(requestedTable, req.body);
	res.json('success');
}));

app.delete("*", setupDAOHandler(async (requestedTable, req) => {
	await PGInteractor.delete(requestedTable, req.body);
	res.json('success');
}));