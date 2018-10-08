const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');

const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');

const config = require('./configs/config');

const index = require('./routes/index');
const auth = require('./routes/auth');
const posts = require('./routes/posts');

const app = express();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect(
	config.mongo,
	err => {
		if (err) throw err;
		console.log('Mongoose connected');
	}
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(compression());
app.use(
	logger('dev', {
		skip: function(req, res) {
			if (res.statusCode === 304) return res.statusCode;
		}
	})
);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	session({
		resave: false,
		saveUninitialized: false,
		secret: config.secretString,
		store: new MongoStore({
			mongooseConnection: mongoose.connection
			// ttl: 60 * 60 * 24
		})
	})
);
app.use(passport.initialize());
app.use(passport.session());

/** Get render object for authorized users */
app.use(function(req, res, next) {
	if (req.user) {
		req.renderObject = { user: req.user, posts: null };
	} else {
		req.renderObject = { user: null, posts: null };
	}
	next();
});

app.use('/', index);
app.use('/posts', posts);
app.use('/auth', auth);

/** Prevent POST for unauthorized users  */
app.use(function({ method, renderObject }, res, next) {
	if (method === 'POST' && !renderObject.user) {
		let err = new Error('Unauthorized');
		err.status = 401;
		next(err);
	} else {
		next();
	}
});

/* Catch 404 and forward to error handler */
app.use(function(req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
