var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');  //我是新引入的ejs插件
const log4js = require('log4js');
var logger = require('./log4js');

var oAuthRouter = require('./routes/oAuthRouter');
var articleRouter = require('./routes/articleRouter');
var loginRouter = require('./routes/loginController');
var noteController = require('./routes/noteController');
var middleRouter = require('./routes/middle');

var app = express();

//Set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = 'mongodb://602165057:xyl19930418@ds261072.mlab.com:61072/summer_note';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(log4js.connectLogger(logger, { level: 'auto', format: ':method :url  :status  :response-time ms' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/article', articleRouter);
app.use('/api/login', loginRouter);
app.use('/api/note', noteController);
app.use('/api/HFSystem', middleRouter);
app.use('/oAuth', oAuthRouter);
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.use(function(req, res, next) {
  console.log(req);
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  console.log(err);
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
