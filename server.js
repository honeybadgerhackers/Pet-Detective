const express = require('express');
const mysql = require('mysql');
require('dotenv').config();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const GoogleAuth = require('google-auth-library');
const utilities = require('./utils/searchUtils');

const app = express();
const { PORT, DB, DB_USER, DB_PASSWORD, GOOGLE_API_KEY } = process.env;

const config = {
  host: DB,
  user: DB_USER,
  password: DB_PASSWORD,
  database: 'petdetective',
};

const connection = mysql.createConnection(config);

const auth = new GoogleAuth();
const client = new auth.OAuth2('1036579880288-7vaoh4gg8d0hhapkcuummk2pvqpu1sf0.apps.googleusercontent.com', '', '');

// console.log(auth);
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
  connection.query(`insert into petpost (lostOrFound, type, styles, address, message, date, latlong, user, userpic, petPic) values ('${req.body.lostOrFound}', '${req.body.type}','${req.body.styles}', '${req.body.address}', '${req.body.message}', '${req.body.date}', '${req.body.latlong}', '${req.body.user}', '${req.body.userpic}', '${req.body.petPic}')`, function (err, /* rows, fields */) {
    if (err) {
      console.error(err);
    }
  });
  res.sendStatus(201);
});

app.post('/search', (req, res) => {
  const { searchField: searchText, distance } = req.body;
  utilities.getCoords(searchText, GOOGLE_API_KEY)
    .then((result) => {
      const { results: [{ geometry: { location: { lat, lng } } }] } = JSON.parse(result);
      utilities.radiusSearch(lat, lng, distance, (error, searchResults) => {
        if (error) {
          res.send(error);
        } else {
          res.send(searchResults);
        }
      }, connection);
    });
  // if (isNaN(searchText) || distance === undefined) {
  //   connection.query(
  //     `select * from petpost where 
  //     address like '%${searchText}%'
  //     or message like '%${searchText}%'
  //     or styles like '%${searchText}%'
  //     or type like '%${searchText}%'
  //     or date like'%${searchText}%'
  //     or lostOrFound like '%${searchText}%'`,
  //     (err, rows) => {
  //       if (err) {
  //         res.send(err);
  //       } else {
  //         res.send(rows);
  //       }
  //     });
  // } else {
  //   connection.query(`SELECT lat, lng FROM postalcodes WHERE postalCode=${searchText}`, (err, postalCode) => {
  //     if (err) {
  //       res.send(err);
  //     } else if (postalCode.length) {
  //       const [{ lat, lng }] = postalCode;
  //       utilities.nearbyZips(lat, lng, distance, (postalCodes) => {
  //         connection.query(
  //           `SELECT * FROM petpost WHERE address like '%${postalCodes}%'`, (error, rows) => {
  //             if (error) {
  //               res.send(error);
  //             } else {
  //               res.send(rows);
  //             }
  //           });
  //       }, connection);
  //     } else {
  //       res.send([]);
  //     }
  //   });
  // }
});

app.post('/tokensignin', function (req, res) {
  client.verifyIdToken(
    req.body.idtoken,
    '673527265143-l8gvqn8e0qcm4o23nf914sd9hp0tj82c.apps.googleusercontent.com',
    // Or, if multiple clients access the backend:
    // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
    function (e, login) {
      let token;
      const payload = login.getPayload();
      console.log(payload);
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

