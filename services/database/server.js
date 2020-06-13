/**
 * This server will be the main interface with the postgres database.
 * This server will automatically handle all of the mapping tables.
 */

var express = require('express');
var app = express();

app.get("/user", (req, res) => {
	res.json(["hello", "world", "hi", typeof(req)]);
});

app.listen(3000, () => {
	console.log("Started server")
})
