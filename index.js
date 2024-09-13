require('dotenv').config();
const morgan = require('morgan')
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const nocache=require('nocache')
const passport=require('passport')

require('./public/user/js/googleAuth')

const userroute = require('./route/userroute');
const adminroute = require('./route/adminroute');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(morgan('dev'));

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  }));

  app.use(passport.initialize());
  app.use(passport.session());
   
app.use(nocache())
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI, {
    
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

app.use('/admin',adminroute)
app.use('/', userroute);


app.listen(8000, () => {
    console.log('Server is running at http://localhost:8000');
});
