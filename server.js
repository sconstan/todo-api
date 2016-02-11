var express = require('express');
var bodyParser = require('body-parser');
var _=require('underscore');


var app = express();
var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function (req,res) {
	res.send('Todo API Root');
});

// get /todos
app.get('/todos', function (req,res) {
	res.json(todos);
});

// get /todos/:id
app.get ('/todos/:id', function (req,res) {

	var todoid = parseInt(req.params.id, 10);

	var foundit = _.findWhere(todos, {id: todoid});

	if (foundit) {
		res.json(foundit);
	} else {
	 	res.status(404).send();
	}
});

// POST /todos
app.post('/todos', function (req,res) {
	var body = _.pick(req.body, 'description', 'completed');

	if ((!_.isBoolean(body.completed)) || (!_.isString(body.description)) || (body.description.trim().length === 0)) {
		return res.status(400).send();
	}

	body.description = body.description.trim();

//	add id field to body
	body.id = todoNextId++;

//	add the Todo to the array...
	todos.push(body);

	res.json(body);

});


// delete /todos/:id
app.delete('/todos/:id', function (req,res) {

	var todoid = parseInt(req.params.id, 10);
	var foundit = _.findWhere(todos, {id: todoid});

	todos = _.without(todos, foundit);
	if (foundit) {
		res.json('Deleted todo item: ' + foundit.id + ' with description ' + foundit.description);
	} else {
		res.json('Item not found');
	}

});


app.listen(PORT, function () {
	console.log('Express listening on port: ' + PORT + '!');
});

