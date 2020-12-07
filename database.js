const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('database.sqlite', (error) => {
  if (error) console.log(error);
});

module.exports = db;
