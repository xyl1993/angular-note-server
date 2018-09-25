const createError = require('http-errors');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const ejs = require('ejs');  //我是新引入的ejs插件
const log4js = require('log4js');
const logger = require('./log4js');

const config = require('./config/environment');

const oAuthRouter = require('./routes/oAuthRouter');
const articleRouter = require('./routes/articleRouter');
const loginRouter = require('./routes/loginController');
const noteController = require('./routes/noteController');
const middleRouter = require('./routes/middle');

var app = express();

if (process.env.NODE_ENV !== 'test') {
  mongoose.set('useCreateIndex', true);
  mongoose.connect(config.mongo.uri, config.mongo.options);
  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
    process.exit(-1);
  });
}


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
