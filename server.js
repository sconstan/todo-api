var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var middleware = require('./middleware.js')(db);


var bcrypt = require('bcrypt');

var app = express();
var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET  /todos?completed=true&q=house (all todos by filter)
app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var query = req.query;

	var where = {
		userId: req.user.get('id')
	};

	if (query.hasOwnProperty('completed') && query.completed === 'true') {
		where.completed = true;
	} else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;
	}

	if (query.hasOwnProperty('q') && query.q.length>0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	};

	db.todo.findAll({where: where}).then (function (todos) {
		res.json(todos);

	}, function (e) {
		res.status(500).send();
	});

	// var filteredTodos = todos;

	// if (queryParams.completed==='true') {
	// 	filteredTodos = _.where(filteredTodos, {completed: true});
	// } else if (queryParams.completed==='false') {
	// 	filteredTodos = _.where(filteredTodos, {completed: false});
	// }

	// if (queryParams.hasOwnProperty('q') && queryParams.q.length>0) {
	// 	filteredTodos = _.filter(filteredTodos, function(todo) {
	// 		return todo.description.toLowerCase().indexOf(queryParams.q.toLowercase()) > -1;
	// 	});
	// }

	// res.json(filteredTodos);
});

// GET /todos/:id (get single todo by ID)
app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {

	var todoid = parseInt(req.params.id, 10);

	db.todo.findOne ({
		where: {
			id: todoid,
			userId: req.user.get('id')
		}
	}).then (function (todo) {
		if (!!todo) {
				res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function (e) {
		res.status(500).send();
	});

	// var foundit = _.findWhere(todos, {
	// 	id: todoid
	// });

	// if (foundit) {
	// 	res.json(foundit);
	// } else {
	// 	res.status(404).send();
	// }
});

// POST /todos - create a new Todo
app.post('/todos', middleware.requireAuthentication, function(req, res) {

	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function (todo) {

		req.user.addTodo(todo).then(function () {
			return todo.reload();
		}).then(function (todo) {
			res.json(todo.toJSON());
		});
	}, function (e) {
		res.status(400).json(e);
	});

	// if ((!_.isBoolean(body.completed)) || (!_.isString(body.description)) || (body.description.trim().length === 0)) {
	// 	return res.status(400).send();
	// }
	// body.description = body.description.trim();
	// //	add id field to body
	// body.id = todoNextId++;
	// //	add the Todo to the array...
	// todos.push(body);
	// res.json(body);
});


// delete /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {

	var todoid = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoid,
			userId: req.user.get('id')
		}
	}).then(function (rowsDeleted) {
		if (rowsDeleted === 0) {
			res.status(404).json({
				error: 'No todo with id'
			});
		} else {
			res.status(204).send();
		}
	}, function (e) {
		res.status(500).send();
	});
});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoid = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	// if (!foundit) {
	// 	return res.status(404).send();
	// }

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	} 

	// if description exists, it'a a string and length greater than 0
	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	// _.extend(foundit, validAttributes);
	// res.json(foundit);

	db.todo.findOne({
		where: {
			id: todoid,
			userId: req.user.get('id')
		}
	}).then(function (todo) {
		if (todo) {
			todo.update(attributes).then(function (todo) {
				res.json(todo.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function (e) {
		res.status(500).send();
	})

});

// POST /users
app.post('/users', function (req,res) {

	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then (function(user) {
		res.json(user.toPublicJSON());
	}, function (e) {
		res.status(400).json(e);
	});
});



// POST /users/login
app.post('/users/login', function(req,res) {
	var body = _.pick(req.body, 'email', 'password');
	var userInstance;

	db.user.authenticate(body).then (function (user) {
		var token = user.generateToken('authentication');
		userInstance = user;

		return db.token.create({
			token: token
		});

	}).then (function (tokenInstance) {

//console.log(tokenInstance.get('token'));	

		res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
	}).catch (function (e) {
		res.status(401).send();
	});
 
});

//DELETE /users/login
app.delete('/users/login', middleware.requireAuthentication, function (req,res) {

	req.token.destroy().then(function () {
		res.status(204).send();
	}).catch(function () {
		res.status(500).send();
	});
});


// synchronize the DB
db.sequelize.sync({
	force: true
}).then(function () {
	app.listen(PORT, function() {
		console.log('Express listening on port: ' + PORT + '!');
	});
});



