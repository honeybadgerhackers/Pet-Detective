const request = require('request-promise');

module.exports = {
  getCoords(location, GOOGLE_API_KEY) {
    console.log(typeof (location));
    if (typeof (location) === 'string') {
      location = location.split(' ').join('+');
      return request(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${GOOGLE_API_KEY}`);
    }
    const lat = location.geometry.location.lat;
    const lng = location.geometry.location.lng;
    location = `${String(lat)} ${String(lng)}`;
    console.log(location);
    location = location.split(' ').join('+');
    console.log(location);
    return request(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${GOOGLE_API_KEY}`);
  },

  radiusSearch(lat, lng, dist, callback, connection) {
    connection.query(`SELECT *, ( 3959 * acos( cos( radians(${lat}) ) * cos( radians( SUBSTRING_INDEX(latlong, ',', 1) ) ) * cos( radians( SUBSTRING_INDEX(latlong, ',', -1) ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( SUBSTRING_INDEX(latlong, ',', 1) ) ) ) ) AS distance FROM petpost HAVING (distance < ${dist}) ORDER BY distance;`, (err, rows) => {
      if (err) {
        callback(err);
      } else {
        callback(rows);
      }
    });
  },
};
