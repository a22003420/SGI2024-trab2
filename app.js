// Get the configuration values
require('dotenv').config();
const express = require('express');
const app = express();
var multer  = require('multer');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'services')));
app.use(express.urlencoded({ extended: false }));
app.use(multer().none());



const { createServer } = require('./services/server');
require('./services/passport');

// const {port, https, certs} = require('./services/https');
require('./services/server');
/*  VIEW ENGINE */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const dbString = process.env.DB_STRING;

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method
    console.log(method,req.body._method)
    delete req.body._method
    return method
  }
}));

// Configuração do express-session
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: dbString,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 1, // 1 hour
    // sameSite: 'none',
  }
}));

// Configuração do body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração do diretório público
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to display messages || hasMessages

app.use(function(req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  req.session.messages = [];
  next();
});

// Middleware to add CSRF token to all views

app.use(function(req, res, next) {
  //res.locals.csrfToken = req.csrfToken();
  res.locals.csrfToken = 'TODO';
  next();
});

app.use(function(req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  req.session.messages = [];
  next();
});



app.use(passport.initialize());
app.use(passport.session());
app.use('/', require('./routes/authRoutes'));
app.use('/lyrics', require('./routes/passRoutes'));
app.use(express.static(path.join(__dirname, 'public')));

// Create the server according to environment
createServer(app);

