const request = require('request-promise');

module.exports = {
  getCoords(location, GOOGLE_API_KEY) {
    location = location.split(' ').join('+');
    return request(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${GOOGLE_API_KEY}`);
  },

  radiusSearch(lat, lng, dist, callback, connection) {
    connection.query(`SELECT *, ( 3959 * acos( cos( radians(${lat}) ) * cos( radians( SUBSTRING_INDEX(latlong, ',', 1) ) ) * cos( radians( SUBSTRING_INDEX(latlong, ',', -1) ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( SUBSTRING_INDEX(latlong, ',', 1) ) ) ) ) AS distance FROM petpost HAVING (distance < ${dist}) ORDER BY distance;`, (err, rows) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, rows);
      }
    });
  },
};
