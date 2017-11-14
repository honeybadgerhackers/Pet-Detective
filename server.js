const express = require('express');
const mysql = require('mysql');
require('dotenv').config();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const GoogleAuth = require('google-auth-library');

const app = express();
const PORT = process.env.PORT;
const DB = process.env.DB;

const connection = mysql.createConnection({
  host: DB,
  user: 'root',
  password: '',
  database: 'petdetective',
});
const pool = mysql.createPool({
  host: DB,
  user: 'root',
  password: '',
  database: 'petdetective',
});
pool.getConnection(function (err, conn) {
  if (err) {
    console.error(err);
  }
  conn.query('select * from petpost', function (error /* , results, fields */) {
    if (error) console.error(error);
  });
});

const auth = new GoogleAuth();
const client = new auth.OAuth2('1036579880288-7vaoh4gg8d0hhapkcuummk2pvqpu1sf0.apps.googleusercontent.com', '', '');

app.use(express.static('client'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

connection.connect((err) => {
  if (!err) {
    console.log('Database is connected ...');
  } else {
    console.error('Error connecting to database ...', err);
  }
});

app.listen(PORT, () => console.log('listening on', PORT));

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
  console.log(req.body, 'in server');
  connection.query(`insert into petpost (lostOrFound, type, styles, address, message, date, latlong, user, userpic, petPic) values ('${req.body.lostOrFound}', '${req.body.type}','${req.body.styles}', '${req.body.address}', '${req.body.message}', '${req.body.date}', '${req.body.latlong}', '${req.body.user}', '${req.body.userpic}', '${req.body.petPic}')`, function (err, /* rows, fields */) {
    if (err) {
      console.error(err);
    } else {
      console.log('Your post has been submitted');
    }
  });
  res.sendStatus(201);
});

app.post('/search', (req, res) => {
  console.log(req.body, 'should be SEARCH field');
  connection.query(`select * from petpost where address like '%${req.body.searchField}%' or message like '%${req.body.searchField}%' or type like '%${req.body.searchField}%' or date like'%${req.body.searchField}%' or lostOrFound like '%${req.body.searchField}%'`, function (err, rows) {
    if (err) {
      res.send(err);
    } else {
      console.log(rows, 'in search');
      res.send(rows);
    }
  });
});

app.post('/tokensignin', function (req, res) {
  console.log('baby');
  client.verifyIdToken(
    req.body.idtoken,
    '673527265143-l8gvqn8e0qcm4o23nf914sd9hp0tj82c.apps.googleusercontent.com',
    // Or, if multiple clients access the backend:
    // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
    function (e, login) {
      console.log('whoa');
      let token;
      const payload = login.getPayload();
      userInfo.currentUser = payload.email;
      userInfo.photo = payload.picture;
      console.log(payload, 'payload');
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

