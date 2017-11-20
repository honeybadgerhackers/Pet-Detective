const express = require('express');
const https = require('https');
const fs = require('fs');
const mysql = require('mysql');
require('dotenv').config();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const GoogleAuth = require('google-auth-library');
const utilities = require('./utils/searchUtils');
const { html } = require('./emailTemplate');

const app = express();
const { PORT,
  DB,
  DB_USER,
  DB_PASSWORD,
  GOOGLE_API_KEY,
  EMAIL_USER,
  EMAIL_PASS,
  OAUTH_ID,
  MY_SECRET } = process.env;
const nodemailer = require('nodemailer');

const poolConfig = {
  // pool: true,
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use TLS
  auth: {
    user: `${EMAIL_USER}`,
    pass: `${EMAIL_PASS}`,
  },
};

const transporter = nodemailer.createTransport(poolConfig);
transporter.verify((err) => {
  if (err) {
    console.error(err);
  } else {
    /* eslint-disable */
    console.info('SMTP CONNECTED');
    /* eslint-enable */
  }
});


const config = {
  host: DB,
  user: DB_USER,
  password: DB_PASSWORD,
  database: 'petdetective',
};

const connection = mysql.createConnection(config);

const auth = new GoogleAuth();
const client = new auth.OAuth2(OAUTH_ID, '', '');

app.use(express.static('client'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

connection.connect((err) => {
  console.warn(err || `succesfully connected to DB ${DB}`);
});

const userInfo = {
  currentUser: '',
  photo: '',
};

app.get('/bulletin', (req, res) => {
  connection.query('select * from petpost', (err, posts) => {
    if (err) {
      res.send(err);
    } else {
      connection.query('select * from comments', (error, comments) => {
        const objectRows = comments.reduce((prev, current) => {
          if (!prev[current.postId]) {
            prev[current.postId] = [];
          }
          prev[current.postId].push(current);
          return prev;
        }, {});

        const combined = posts.map((e) => {
          if (objectRows[e.id]) {
            e.comments = objectRows[e.id].reverse();
          }
          return e;
        });

        res.send(combined);
      });
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

const sendEmail = (targetEmail) => {
  const message = {
    from: `${EMAIL_USER}`,
    to: targetEmail,
    subject: 'New Comment on Pet-Detective',
    text: 'You have a new message on your post on Pet-Detective',
    html,
  };
  transporter.sendMail(message);
};

const getComments = (res, posts) => {
  const postIdList = posts.map(e => e.id).join(',');
  connection.query(`select * from comments where postId in (${postIdList}) `, (error, comments) => {
    if (error) {
      console.error(error);
    }
    const objectRows = comments.reduce((prev, current) => {
      if (!prev[current.postId]) {
        prev[current.postId] = [];
      }
      prev[current.postId].push(current);
      return prev;
    }, {});
    posts.forEach((e) => {
      if (objectRows[e.id]) {
        e.comments = objectRows[e.id].reverse();
      }
    });
    res.send(posts);
  });
};

app.post('/comments', (req, res) => {
  const { comment, senderEmail, postId, time, name, postEmail } = req.body;
  connection.query(`insert into comments (postId, name, message, time, senderEmail) values ('${postId}', '${name}', '${comment}', '${time}', '${senderEmail}')`, (err) => {
    if (err) {
      console.error(err);
    } else {
      if (EMAIL_USER.length) {
        sendEmail(postEmail);
      }
      connection.query(`select * from comments where postId = ${postId}`, (error, comments) => {
        if (error) {
          console.error(error);
        } else {
          res.send(comments);
        }
      });
    }
  });
});

app.post('/search', (req, res) => {
  const { searchLocation, searchDistance, searchAnimalType } = req.body;
  let { searchTags } = req.body;
  if (!searchTags) {
    searchTags = [{ text: '' }];
  }
  const searchQuery = `SELECT * FROM petpost WHERE address LIKE '%${searchLocation}%' AND (styles LIKE '%${searchTags[0].text}%' OR type LIKE '%${searchAnimalType}%') ORDER BY id;`;
  // console.log(searchQuery);
  if (!searchDistance) {
    connection.query(
      searchQuery,
      (err, rows) => {
        if (err) {
          res.send(err);
        } else {
          getComments(res, rows);
        }
      });
  } else {
    utilities.getCoords(searchLocation, GOOGLE_API_KEY)
      .then((result) => {
        const { results: [{ geometry: { location: { lat, lng } } }] } = JSON.parse(result);
        utilities.radiusSearch(lat, lng, searchDistance, (error, searchResults) => {
          if (error) {
            res.send(error);
          } else {
            getComments(res, searchResults);
          }
        }, connection);
      });
  }
});

app.post('/tokensignin', function (req, res) {
  client.verifyIdToken(
    req.body.idtoken,
    OAUTH_ID,
    // Or, if multiple clients access the backend:
    // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
    function (e, login) {
      let token;
      const payload = login.getPayload();
      userInfo.currentUser = payload.email;
      userInfo.photo = payload.picture;
      if (payload) {
        token = jwt.sign(payload, MY_SECRET);
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

/* eslint-disable */
app.listen(PORT, () => console.log('listening on', PORT)); 
/* eslint-enable */
