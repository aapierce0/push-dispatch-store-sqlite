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
    try {
      db.get('PRAGMA user_version;', (error, result) => {
        callback(error, result.user_version);
      });
    } catch (error) {
      callback(error);
    }
  }

  static _readContentsOfTextFile (filepath, callback) {
    fs.readFile(filepath, 'utf8', (error, response) => {
      if (error) {
        callback(error);
        return;
      }

      callback(null, response);
    });
  }

  static _initializeSchema1 (db, callback) {
    // Database initilization is stored in a SQL file.
    SQLiteBackingStore._readContentsOfTextFile(INITIALIZE_SCHEMA_1_FILEPATH, (error, response) => {
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
    // If the input is not an object, return it as-is.
    if (typeof deviceRow !== 'object') {
      return deviceRow;
    }

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
    // Check to see if this device already exists.
    const sql = `SELECT count(*) as row_count FROM ${DEVICES_TABLE} WHERE device_id = ?;`;
    this.db.get(sql, deviceID, (error, result) => {
      if (error) {
        callback(error);
        return;
      }

      if (result.row_count > 0) {
        // If a record already exists in the database, update it.
        this.updateDevice(deviceID, transportIdentifier, deliveryKey, callback);
      } else {
        // If the record does not already exist in the database, insert it.
        this.insertDevice(deviceID, transportIdentifier, deliveryKey, callback);
      }
    });
  }

  updateDevice (deviceID, transportIdentifier, deliveryKey, callback) {
    const sql = `UPDATE ${DEVICES_TABLE} SET ("transport_identifier", "delivery_key") = (?, ?) WHERE device_id = ?;`;
    this.db.run(sql, [transportIdentifier, deliveryKey, deviceID], (error) => {
      callback(error);
    });
  }

  insertDevice (deviceID, transportIdentifier, deliveryKey, callback) {
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

      if (result === undefined) {
        callback(new Error(`Device ID ${deviceID} not found`));
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
    const sql = 'SELECT event_id, transaction_id, Device.device_id, transport_identifier, delivery_key FROM PushTransaction JOIN Device ON Device.device_id = PushTransaction.device_id WHERE event_id = ?;';
    this.db.all(sql, eventID, (error, results) => {
      if (error) {
        callback(error);
        return;
      }

      const transactions = results.map((result) => {
        const device = SQLiteBackingStore._parseDeviceRow(result);
        return {
          eventID: result.event_id,
          transactionID: result.transaction_id,
          device: device
        };
      });

      callback(null, new Set(transactions));
    });
  }
}

module.exports = SQLiteBackingStore;
