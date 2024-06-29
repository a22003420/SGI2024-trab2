// Description: Main entry point for the application.

require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const methodOverride = require('method-override');

const passport = require('passport');
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'services')));

const { createServer } = require('./services/server');
require('./services/passport');

// const {port, https, certs} = require('./services/https');
require('./services/server');
/*  VIEW ENGINE */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const dbString = process.env.DB_STRING;
// const dbString = process.env.DB_STRING;
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

app.use(passport.initialize());
app.use(passport.session());
app.use('/', require('./routes/authRoutes'));
app.use(express.static(path.join(__dirname, 'public')));

// Create the server according to environment
createServer(app);

