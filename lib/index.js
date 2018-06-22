'use strict';

const fs = require('fs');

const sqlite3 = require('sqlite3');
const uuidv4 = require('uuid/v4');

const DEVICES_TABLE = 'Device';
const TRANSACTIONS_TABLE = 'PushTransaction';
const USER_DEVICE_TABLE = 'UserDevice';

const INITIALIZE_SCHEMA_1_FILEPATH = `${__dirname}/sql/initialize_schema_1.sql`;

class SQLiteBackingStore {
  constructor (path, options) {
    this.db = new sqlite3.Database(path);
    this.options = options || {};
  }


  static _currentSchemaVersion (db, callback) {
    db.get('PRAGMA user_version;', (error, result) => {
      callback(error, result.user_version);
    });
  }


  static _initializeSchema1 (db, callback) {
    // Database initilization is stored in a SQL file.
    fs.readFile(INITIALIZE_SCHEMA_1_FILEPATH, 'utf8', (error, response) => {
      if (error) {
        callback(error);
        return;
      }

      // Execute the commands from the initialization file.
      db.exec(response, (error, results) => {
        callback(error, results);
      });
    });
  }

  static _parseDeviceRow (deviceRow) {
    return {
      deviceID: deviceRow.device_id,
      transportIdentifier: deviceRow.transport_identifier,
      deliveryKey: deviceRow.delivery_key
    };
  }


  setup (callback) {
    // Get the current version of the database
    SQLiteBackingStore._currentSchemaVersion(this.db, (error, version) => {
      if (error) {
        callback(error);
        return;
      }

      // If the version is 0, the database needs to be initialized.
      if (version < 1) {
        // Initialize the database.
        SQLiteBackingStore._initializeSchema1(this.db, (error) => {
          callback(error);
        });
      } else {
        // The database was already initialized. We can proceed.
        callback(null);
      }
    });
  }


  /** Store information about the device in the database */
  addDevice (deviceID, transportIdentifier, deliveryKey, callback) {
    const sql = `INSERT INTO "${DEVICES_TABLE}"("device_id", "transport_identifier", "delivery_key") VALUES (?, ?, ?);`;
    this.db.run(sql, [deviceID, transportIdentifier, deliveryKey], (error) => {
      callback(error);
    });
  }

  /** Fetch a device from the store */
  fetchDevice (deviceID, callback) {
    const sql = `SELECT * FROM ${DEVICES_TABLE} WHERE device_id = ?;`;
    this.db.get(sql, deviceID, (error, result) => {
      if (error) {
        callback(error);
        return;
      }

      // Convert the object into a device object
      const device = SQLiteBackingStore._parseDeviceRow(result);
      callback(null, device);
    });
  }


  /** Add a row to the UserDevice table */
  associateDevice (deviceID, userID, callback) {
    const sql = `SELECT (COUNT(*) > 0) as pair_exists FROM ${USER_DEVICE_TABLE} WHERE device_id = ? AND user_id = ?;`;
    this.db.get(sql, [deviceID, userID], (error, result) => {
      if (error) {
        callback(error);
        return;
      }

      // If the pair exists already, do nothing.
      if (result.pair_exists) {
        callback();
        return;
      }

      // Insert the pair into the database.
      const sql = `INSERT INTO ${USER_DEVICE_TABLE}("device_id", "user_id") VALUES (?, ?);`;
      this.db.run(sql, [deviceID, userID], (error) => {
        callback(error);
      });
    });
  }

  /** Disassociate a deviceID from a user */
  dissociateDevice (deviceID, userID, callback) {
    const sql = `DELETE FROM ${USER_DEVICE_TABLE} WHERE device_id = ? AND user_id = ?;`;
    this.db.run(sql, [deviceID, userID], (error) => {
      callback(error);
    });
  }


  fetchDevicesForUser (userID, callback) {
    const sql = `SELECT ${DEVICES_TABLE}.* FROM ${DEVICES_TABLE} INNER JOIN ${USER_DEVICE_TABLE} ON ${DEVICES_TABLE}.device_id = ${USER_DEVICE_TABLE}.device_id WHERE user_id = ?;`;
    this.db.all(sql, userID, (error, results) => {
      if (error) {
        callback(error);
        return;
      }

      const deviceSet = new Map();
      results.forEach((result) => {
        deviceSet.set(result.device_id, result);
      });

      const devices = Array.from(deviceSet.values()).map((result) => { return SQLiteBackingStore._parseDeviceRow(result); });
      callback(error, new Set(devices));
    });
  }


  /** Creates a new transaction for this device and event ID, and returns the transaction ID */
  createTransaction (eventID, deviceID, callback) {
    const txID = uuidv4();
    const sql = `INSERT INTO ${TRANSACTIONS_TABLE}("transaction_id", "event_id", "device_id") VALUES (?, ?, ?); SELECT last_insert_rowid() FROM ${TRANSACTIONS_TABLE};`;
    this.db.get(sql, [txID, eventID, deviceID], (error, result) => {
      if (error) {
        callback(error);
        return;
      }

      callback(null, txID);
    });
  }

  /** Fetches the transactions for a given event ID */
  fetchTransactionsForEvent (eventID, callback) {
    const sql = `SELECT transaction_id FROM ${TRANSACTIONS_TABLE} WHERE event_id = ?;`;
    this.db.all(sql, eventID, (error, result) => {
      if (error) {
        callback(error);
        return;
      }

      const txIDs = result.map((result) => { return result.transaction_id; });
      callback(null, new Set(txIDs));
    });
  }
}

module.exports = SQLiteBackingStore;
