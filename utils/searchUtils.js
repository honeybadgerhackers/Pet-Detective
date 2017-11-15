module.exports = {
  nearbyZips(lat, lng, dist, callback, connection) {
    connection.query(`SELECT postalCode, ( 3959 * acos( cos( radians(${lat}) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( lat ) ) ) ) AS distance FROM postalcodes HAVING (distance < ${dist}) ORDER BY distance;`, (err, rows) => {
      const zips = rows.map(row => row.postalCode);
      const zipString = zips.join("%' OR address LIKE '%");
      callback(zipString);
    });
  },
};
