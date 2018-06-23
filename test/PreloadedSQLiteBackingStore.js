'use strict';

const fs = require('fs');

const SQLiteBackingStore = require('../lib');

const POPULATE_SCHEMA_1_FILEPATH = `${__dirname}/sql/populate_schema_1.sql`;

function basic (callback) {
  createBasic('', callback);
}

function createBasic (path, callback) {
  callback = callback || (() => {});

  // Initialize a new database
  const backingStore = new SQLiteBackingStore(path);
  backingStore.setup((error) => {
    if (error) {
      callback(error);
      return;
    }

    // Database initilization is stored in a SQL file.
    fs.readFile(POPULATE_SCHEMA_1_FILEPATH, 'utf8', (error, fileContents) => {
      if (error) {
        callback(error);
        return;
      }

      // Execute the commands from the initialization file.
      backingStore.db.exec(fileContents, (error) => {
        if (error) {
          callback(error);
          return;
        }

        callback(null, backingStore);
      });
    });
  });
}

module.exports = {
  basic: basic,
  createBasic: createBasic
};
