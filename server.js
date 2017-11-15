const express = require('express');
const mysql = require('mysql');
require('dotenv').config();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const GoogleAuth = require('google-auth-library');

const app = express();
const PORT = process.env.PORT;

const connection = mysql.createConnection({
  host: process.env.DB,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'petdetective',
});
const pool = mysql.createPool({
  host: process.env.DB,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'petdetective',
});
pool.getConnection(function (err, conn) {
  if (err) {
    console.error(err);
  }
  connection.query('select * from petpost', function (error /* , results, fields */) {
    if (error) console.error(error);
  });
});

const auth = new GoogleAuth();
const client = new auth.OAuth2(process.env.OAUTH_ID, '', '');

app.use(express.static('client'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database ...', err);
  }
});

/* eslint-disable */
app.listen(PORT, () => console.log('listening on', PORT)); 
/* eslint-enable */

const userInfo = {
  currentUser: '',
  photo: '',
};

app.get('/bulletin', (req, res) => {
  connection.query('select * from petpost', (err, rows /* , fields */) => {
    if (err) {
      res.send(err);
    } else {
      res.send(rows);
    }
  });
});

app.post('/bulletin', (req, res) => {
  connection.query(`insert into petpost (lostOrFound, type, styles, address, message, date, latlong, user, userpic, petPic) values ('${req.body.lostOrFound}', '${req.body.type}','${req.body.styles}', '${req.body.address}', '${req.body.message}', '${req.body.date}', '${req.body.latlong}', '${req.body.user}', '${req.body.userpic}', '${req.body.petPic}')`, function (err) {
    if (err) {
      console.error(err);
    }
  });
  res.sendStatus(201);
});

app.post('/search', (req, res) => {
  const searchText = req.body.searchField;
  connection.query(
    `select * from petpost where 
    address like '%${searchText}%'
    or message like '%${searchText}%'
    or styles like '%${searchText}%'
    or type like '%${searchText}%'
    or date like'%${searchText}%'
    or lostOrFound like '%${searchText}%'`,
    (err, rows) => {
      if (err) {
        res.send(err);
      } else {
        res.send(rows);
      }
    });
});

app.post('/tokensignin', function (req, res) {
  
  console.log("AM I WORKING?");

  client.verifyIdToken(
    req.body.idtoken,
    process.env.OAUTH_ID,
    // Or, if multiple clients access the backend:
    // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
    function (e, login) {
      let token;
      const payload = login.getPayload();
      userInfo.currentUser = payload.email;
      userInfo.photo = payload.picture;
      if (payload) {
        token = jwt.sign(payload, process.env.MY_SECRET);
      }
      connection.query(`select * from users where email = '${payload.email}'`, (err, data) => {
        if (!data.length) {
          connection.query(`insert into users (email, picture, first_name, last_name) values ('${payload.email}','${payload.picture}','${payload.given_name}','${payload.family_name}')`);
          res.status(200).send(token);
        } else {
          res.status(200).send(token);
        }
      });
      // If request specified a G Suite domain:
      // var domain = payload['hd'];
    });
});

app.post('/deletePost', (req, res) => {
  connection.query(`select * from petpost where user='${req.body.user}' and message='${req.body.message}'`, (err, data) => {
    if (err) { console.error(err); }
    if (data.length) {
      connection.query(`DELETE from petpost where user='${req.body.user}' and message='${req.body.message}'`);
      res.send(data);
    } else {
      res.end();
    }
  });
});

