var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [{
	id: 1,
	description: 'Meet mom for lunch',
	completed: false
}, {
	id: 2,
	description: 'Goto market',
	completed: false
}, {
	id: 3,
	description: 'Buy milk',
	completed: true
}];

app.get('/', function(req,res) {
	res.send('Todo API Root');
});

// get /todos
app.get('/todos', function(req,res) {
	res.json(todos);
});

// get /todos/:id

app.listen(PORT, function () {
	console.log('Express listening on port: ' + PORT + '!');
});