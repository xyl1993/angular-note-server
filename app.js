var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');  //我是新引入的ejs插件
const log4js = require('log4js');
var logger = require('./log4js');

var indexRouter = require('./routes/indexController');
var loginRouter = require('./routes/loginController');
var noteController = require('./routes/noteController');
var middleRouter = require('./routes/middle');

var app = express();

app.engine('html', ejs.__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.use(log4js.connectLogger(logger, { level: 'auto', format: ':method :url  :status  :response-time ms' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/',express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
app.use('/api/login', loginRouter);
app.use('/api/note', noteController);
app.use('/api/HFSystem', middleRouter);
// app.use(function (req, res, next) {
//   console.log(req);
//   next(createError(404));
// });

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// if (app.get('env') === 'development') {
//   app.use(function (err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }
// app.use(function (err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });

module.exports = app;
