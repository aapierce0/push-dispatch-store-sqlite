'use strict';
const Barrier = require('cb-barrier');
const Code = require('code');
const Lab = require('lab');

const sqlite3 = require('sqlite3');
const SQLiteBackingStore = require('../lib');
const preloadedSQLiteBackingStore = require('./PreloadedSQLiteBackingStore.js');
const MockSQLiteDatabase = require('./MockSQLiteDatabase.js');

// Test shortcuts
const {promisify} = require('util');
const lab = exports.lab = Lab.script();
const { describe, it, before, after, beforeEach, afterEach } = lab;
const { expect } = Code;

describe('SQLiteBackingStore', function () {
  describe('constructor', function () {
    it('should initialize a new SQLite database', function () {
      const backingStore = new SQLiteBackingStore('');
      expect(backingStore.db).to.be.an.instanceof(sqlite3.Database);
    });

    it('should default the options to an empty object when options aren\'t provided', function () {
      const backingStore = new SQLiteBackingStore('');
      expect(backingStore.options).to.equal({});
    });

    it('should keep the options set by the caller', function () {
      const backingStore = new SQLiteBackingStore('', {foo: 'bar', baz: 10});
      expect(backingStore.options).to.be.equal({foo: 'bar', baz: 10});
    });
  });

  describe('_readContentsOfTextFile()', function () {
    it('should read the contents of a text file', function () {
      const barrier = new Barrier();
      const filePath = `${__dirname}/TestTextFile.txt`;
      SQLiteBackingStore._readContentsOfTextFile(filePath, (error, contents) => {
        expect(error).to.not.exist();
        expect(contents).to.equal('Hello World!\nFoo Bar Baz.');
        barrier.pass();
      });

      return barrier;
    });

    it('should generate an error if the file doesn\'t exist', function () {
      const barrier = new Barrier();
      const filePath = `${__dirname}/NonExistantFile.txt`;
      SQLiteBackingStore._readContentsOfTextFile(filePath, (error, contents) => {
        expect(error).to.be.error();
        expect(error.code).to.be.equal('ENOENT');
        expect(contents).to.not.exist();
        barrier.pass();
      });

      return barrier;
    });
  });

  describe('_currentSchemaVersion()', function () {
    it('should be 0 on a new database', function () {
      const barrier = new Barrier();
      const db = new sqlite3.Database('');

      SQLiteBackingStore._currentSchemaVersion(db, (error, value) => {
        expect(error).to.not.exist();
        expect(value).to.equal(0);
        barrier.pass();
      });

      return barrier;
    });

    it('should return the current value of the user_version property of the sqlite database', function () {
      const barrier = new Barrier();
      const db = new sqlite3.Database('');

      db.run('PRAGMA user_version = 1', (error) => {
        expect(error).to.not.exist();

        SQLiteBackingStore._currentSchemaVersion(db, (error, value) => {
          expect(error).to.not.exist();
          expect(value).to.equal(1);

          // Lets set it to some arbitrary number.
          db.run('PRAGMA user_version = 5', (error) => {
            expect(error).to.not.exist();

            SQLiteBackingStore._currentSchemaVersion(db, (error, value) => {
              expect(error).to.not.exist();
              expect(value).to.equal(5);
              barrier.pass();
            });
          });
        });
      });

      return barrier;
    });
  });

  describe('_initializeSchema1()', function () {
    it('should create the Device table with the correct schema', function () {
      const barrier = new Barrier();
      const db = new sqlite3.Database('');
      SQLiteBackingStore._initializeSchema1(db, (error) => {
        expect(error).to.not.exist();

        db.get('SELECT count(*) as table_count FROM sqlite_master WHERE type="table" AND name=?;', 'Device', (error, result) => {
          expect(error).to.not.exist();
          expect(result.table_count).to.equal(1);

          db.all('PRAGMA table_info(Device);', (error, result) => {
            expect(error).to.not.exist();
            expect(result).to.only.include([
              { cid: 0,
                name: 'device_id',
                type: 'TEXT',
                notnull: 1,
                dflt_value: null,
                pk: 1 },
              { cid: 1,
                name: 'transport_identifier',
                type: 'TEXT',
                notnull: 1,
                dflt_value: null,
                pk: 0 },
              { cid: 2,
                name: 'delivery_key',
                type: 'TEXT',
                notnull: 0,
                dflt_value: null,
                pk: 0 } ]
            );

            barrier.pass();
          });
        });
      });

      return barrier;
    });

    it('should create the UserDevice table with the correct schema', function () {
      const barrier = new Barrier();
      const db = new sqlite3.Database('');
      SQLiteBackingStore._initializeSchema1(db, (error) => {
        expect(error).to.not.exist();

        db.get('SELECT count(*) as table_count FROM sqlite_master WHERE type="table" AND name=?;', 'UserDevice', (error, result) => {
          expect(error).to.not.exist();
          expect(result.table_count).to.equal(1);

          db.all('PRAGMA table_info(UserDevice);', (error, result) => {
            expect(error).to.not.exist();
            expect(result).to.only.include([
              { cid: 0,
                name: 'device_id',
                type: 'TEXT',
                notnull: 1,
                dflt_value: null,
                pk: 0 },
              { cid: 1,
                name: 'user_id',
                type: 'TEXT',
                notnull: 1,
                dflt_value: null,
                pk: 0 } ]
            );
            barrier.pass();
          });
        });
      });

      return barrier;
    });


    it('should create the PushTransaction table with the correct schema', function () {
      const barrier = new Barrier();
      const db = new sqlite3.Database('');
      SQLiteBackingStore._initializeSchema1(db, (error) => {
        expect(error).to.not.exist();

        db.get('SELECT count(*) as table_count FROM sqlite_master WHERE type="table" AND name=?;', 'PushTransaction', (error, result) => {
          expect(error).to.not.exist();
          expect(result.table_count).to.equal(1);

          db.all('PRAGMA table_info(PushTransaction);', (error, result) => {
            expect(error).to.not.exist();
            expect(result).to.only.include([
              { cid: 0,
                name: 'transaction_id',
                type: 'TEXT',
                notnull: 1,
                dflt_value: null,
                pk: 1 },
              { cid: 1,
                name: 'device_id',
                type: 'TEXT',
                notnull: 1,
                dflt_value: null,
                pk: 0 },
              { cid: 2,
                name: 'event_id',
                type: 'TEXT',
                notnull: 0,
                dflt_value: null,
                pk: 0 } ]
            );
            barrier.pass();
          });
        });
      });

      return barrier;
    });

    describe('error condition', function () {
      let _readContentsOfTextFile;
      before(() => {
        // Override the _readContentsOfTextFile function.
        _readContentsOfTextFile = SQLiteBackingStore._readContentsOfTextFile;
        SQLiteBackingStore._readContentsOfTextFile = function (filepath, callback) {
          callback(new Error('Unspecified error opening the file'));
        };
      });

      after(() => {
        // Set the function back to normal
        SQLiteBackingStore._readContentsOfTextFile = _readContentsOfTextFile;
      });

      it('should handle an error caused by opening the initialization sql file.', function () {
        const barrier = new Barrier();
        const db = new sqlite3.Database('');
        SQLiteBackingStore._initializeSchema1(db, (error) => {
          expect(error).to.be.error();
          barrier.pass();
        });

        return barrier;
      });
    });
  });


  describe('_parseDeviceRow()', function () {
    it('should parse a device correctly', function () {
      const mockDeviceRow = {
        device_id: 'device1',
        transport_identifier: 'transport',
        delivery_key: 'deliveryKey1'
      };

      const mockDevice = SQLiteBackingStore._parseDeviceRow(mockDeviceRow);

      expect(mockDevice).to.equal({
        deviceID: 'device1',
        transportIdentifier: 'transport',
        deliveryKey: 'deliveryKey1'
      });
    });

    it('should return undefined if the input is undefined', function () {
      const mockDeviceRow = undefined;
      const mockDevice = SQLiteBackingStore._parseDeviceRow(mockDeviceRow);
      expect(mockDevice).to.equal(undefined);
    });
  });


  describe('setup()', function () {
    it('should setup a blank database with no errors', function () {
      const barrier = new Barrier();
      const backingStore = new SQLiteBackingStore('');
      backingStore.setup((error) => {
        expect(error).to.not.exist();

        // Make sure the version is now 1
        SQLiteBackingStore._currentSchemaVersion(backingStore.db, (error, result) => {
          expect(error).to.not.exist();
          expect(result).to.equal(1);
          barrier.pass();
        });
      });

      return barrier;
    });

    it('should not modify a database that has schema version >= 1', function () {
      const barrier = new Barrier();
      const backingStore = new SQLiteBackingStore('');
      backingStore.db.run('PRAGMA user_version = 5', (error, result) => {
        expect(error).to.not.exist();

        backingStore.setup((error) => {
          expect(error).to.not.exist();

          // Make sure the version hasn't changed
          SQLiteBackingStore._currentSchemaVersion(backingStore.db, (error, result) => {
            expect(error).to.not.exist();
            expect(result).to.equal(5);
            barrier.pass();
          });
        });
      });

      return barrier;
    });

    it('should throw an error if the database is not configurable', function () {
      const barrier = new Barrier();
      const backingStore = new SQLiteBackingStore('');
      backingStore.db = null;

      backingStore.setup((error) => {
        expect(error).to.be.error(TypeError, 'Cannot read property \'get\' of null');
        barrier.pass();
      });

      return barrier;
    });
  });


  describe('addDevice()', function () {
    let backingStore;
    beforeEach(() => {
      backingStore = new SQLiteBackingStore('');
      return promisify(backingStore.setup.bind(backingStore))();
    });

    afterEach(() => {
      const db = backingStore.db;
      return promisify(db.close.bind(db))();
    });

    it('should add a device to the database', function () {
      const barrier = new Barrier();

      backingStore.addDevice('device1', 'com.example.test', 'deliveryKey', (error) => {
        expect(error).to.not.exist();

        backingStore.db.all('SELECT * FROM Device', (error, results) => {
          expect(error).to.not.exist();

          expect(results).to.only.include({
            device_id: 'device1',
            transport_identifier: 'com.example.test',
            delivery_key: 'deliveryKey'
          });

          barrier.pass();
        });
      });

      return barrier;
    });

    it('should update a device that already exists in the database', function () {
      const barrier = new Barrier();
      preloadedSQLiteBackingStore.basic((error, backingStore) => {
        expect(error).to.not.exist();

        // Verify that the database already has a device1
        backingStore.db.get('SELECT * FROM Device WHERE device_id = ?', 'device1', (error, result) => {
          expect(error).to.not.exist();
          expect(result).to.equal({
            device_id: 'device1',
            transport_identifier: 'com.example.test1',
            delivery_key: 'deliveryKey1'
          });

          //  The addDevice call should update it.
          backingStore.addDevice('device1', 'com.example.test2', 'deliveryKey_test1', (error) => {
            expect(error).to.not.exist();

            backingStore.db.get('SELECT * FROM Device WHERE device_id = ?', 'device1', (error, result) => {
              expect(error).to.not.exist();
              expect(result).to.equal({
                device_id: 'device1',
                transport_identifier: 'com.example.test2',
                delivery_key: 'deliveryKey_test1'
              });

              barrier.pass();
            });
          });
        });
      });

      return barrier;
    });

    it('should call back with the error returned by the database', function () {
      const barrier = new Barrier();
      const backingStore = new SQLiteBackingStore('');

      backingStore.db = new MockSQLiteDatabase({
        get (sql, parameters, callback) {
          callback(new Error('unspecified SQL error'));
        }
      });

      backingStore.addDevice('device1', 'com.example.test1', 'deliveryKey1', (error) => {
        expect(error).to.be.error(Error, 'unspecified SQL error');
        barrier.pass();
      });

      return barrier;
    });
  });

  describe('updateDevice()', function () {
    let backingStore;
    before(() => {
      return promisify(preloadedSQLiteBackingStore.basic)()
        .then((_backingStore) => {
          backingStore = _backingStore;
        });
    });

    after(() => {
      const db = backingStore.db;
      return promisify(db.close.bind(db))();
    });

    it('should update the device with a new delivery token and transport.', function () {
      const barrier = new Barrier();
      backingStore.updateDevice('device1', 'com.example.test2', 'deliveryKey_test1', (error) => {
        expect(error).to.not.exist();

        backingStore.db.get('SELECT * FROM Device WHERE device_id = ?', 'device1', (error, result) => {
          expect(error).to.not.exist();
          expect(result).to.equal({
            device_id: 'device1',
            transport_identifier: 'com.example.test2',
            delivery_key: 'deliveryKey_test1'
          });

          barrier.pass();
        });
      });

      return barrier;
    });
  });

  describe('insertDevice()', function () {
    let backingStore;
    before(() => {
      return promisify(preloadedSQLiteBackingStore.basic)()
        .then((_backingStore) => {
          backingStore = _backingStore;
        });
    });

    after(() => {
      const db = backingStore.db;
      return promisify(db.close.bind(db))();
    });

    it('should add a new device to the store', function () {
      const barrier = new Barrier();

      backingStore.insertDevice('device7', 'com.example.test', 'deliveryKey7', (error) => {
        expect(error).to.not.exist();

        backingStore.db.all('SELECT * FROM Device', (error, results) => {
          expect(error).to.not.exist();

          expect(results).to.include({
            device_id: 'device7',
            transport_identifier: 'com.example.test',
            delivery_key: 'deliveryKey7'
          });

          barrier.pass();
        });
      });

      return barrier;
    });
  });

  describe('fetchDevice()', function () {
    let backingStore;
    before(() => {
      return promisify(preloadedSQLiteBackingStore.basic)()
        .then((_backingStore) => {
          backingStore = _backingStore;
        });
    });

    after(() => {
      const db = backingStore.db;
      return promisify(db.close.bind(db))();
    });

    it('should return the device that exists in the database', function () {
      const barrier = new Barrier();

      backingStore.fetchDevice('device3', (error, device) => {
        expect(error).to.not.exist();
        expect(device).to.equal({
          deviceID: 'device3',
          transportIdentifier: 'com.example.test2',
          deliveryKey: 'deliveryKey3'
        });

        barrier.pass();
      });

      return barrier;
    });

    it('should throw an error if the device does not exist', function () {
      const barrier = new Barrier();

      backingStore.fetchDevice('some_unknown_device', (error, device) => {
        expect(error).to.be.error(Error, 'Device ID some_unknown_device not found');
        expect(device).to.not.exist();
        barrier.pass();
      });

      return barrier;
    });

    it('should return an error that the database throws', function () {
      const barrier = new Barrier();
      const brokenBackingStore = new SQLiteBackingStore('');
      brokenBackingStore.db = new MockSQLiteDatabase({
        get (sql, parameters, callback) {
          callback(new Error('TEST an unspecified error occurred'));
        }
      });

      brokenBackingStore.fetchDevice('device1', (error, device) => {
        expect(error).to.be.error(Error, 'TEST an unspecified error occurred');
        expect(device).to.not.exist();
        barrier.pass();
      });

      return barrier;
    });
  });

  describe('associateDevice()', function () {
    let backingStore;
    beforeEach(() => {
      return promisify(preloadedSQLiteBackingStore.basic)()
        .then((_backingStore) => {
          backingStore = _backingStore;
        });
    });

    afterEach(() => {
      const db = backingStore.db;
      return promisify(db.close.bind(db))();
    });

    it('should add a relationship from a device to a user', function () {
      const barrier = new Barrier();
      backingStore.associateDevice('device6', 'user4', (error) => {
        expect(error).to.not.exist();

        backingStore.db.get('SELECT count(*) as row_count FROM UserDevice WHERE device_id = ? AND user_id = ?;', ['device6', 'user4'], (error, result) => {
          expect(error).to.not.exist();
          expect(result).to.equal({row_count: 1});
          barrier.pass();
        });
      });

      return barrier;
    });

    it('should not duplicate the relationship if it already exists', function () {
      const barrier = new Barrier();
      backingStore.associateDevice('device1', 'user1', (error) => {
        expect(error).to.not.exist();

        backingStore.db.get('SELECT count(*) as row_count FROM UserDevice WHERE device_id = ? AND user_id = ?;', ['device1', 'user1'], (error, result) => {
          expect(error).to.not.exist();
          expect(result).to.equal({row_count: 1});
          barrier.pass();
        });
      });

      return barrier;
    });

    it('should return an error that the database throws', function () {
      const barrier = new Barrier();
      const brokenBackingStore = new SQLiteBackingStore('');
      brokenBackingStore.db = new MockSQLiteDatabase({
        get (sql, parameters, callback) {
          callback(new Error('TEST an unspecified error occurred'));
        }
      });

      brokenBackingStore.associateDevice('device1', 'user1', (error) => {
        expect(error).to.be.error(Error, 'TEST an unspecified error occurred');
        barrier.pass();
      });

      return barrier;
    });
  });


  describe('dissociateDevice()', function () {
    let backingStore;
    beforeEach(() => {
      return promisify(preloadedSQLiteBackingStore.basic)()
        .then((_backingStore) => {
          backingStore = _backingStore;
        });
    });

    afterEach(() => {
      const db = backingStore.db;
      return promisify(db.close.bind(db))();
    });

    it('should remove the association of a user to a device', function () {
      const barrier = new Barrier();
      backingStore.dissociateDevice('device2', 'user2', (error) => {
        expect(error).to.not.exist();

        backingStore.db.get('SELECT count(*) as row_count FROM UserDevice WHERE device_id = ? AND user_id = ?;', ['device2', 'user2'], (error, result) => {
          expect(error).to.not.exist();
          expect(result).to.equal({row_count: 0});
          barrier.pass();
        });
      });
    });
  });


  describe('fetchDevicesForUser()', function () {
    let backingStore;
    beforeEach(() => {
      return promisify(preloadedSQLiteBackingStore.basic)()
        .then((_backingStore) => {
          backingStore = _backingStore;
        });
    });

    afterEach(() => {
      const db = backingStore.db;
      return promisify(db.close.bind(db))();
    });

    it('should return all the devices for a known user', function () {
      const barrier = new Barrier();

      backingStore.fetchDevicesForUser('user2', (error, devices) => {
        expect(error).to.not.exist();
        expect(Array.from(devices)).to.only.include([
          {
            deviceID: 'device2',
            transportIdentifier: 'com.example.test1',
            deliveryKey: 'deliveryKey2'
          },
          { deviceID: 'device3',
            transportIdentifier: 'com.example.test2',
            deliveryKey: 'deliveryKey3'
          }
        ]);

        barrier.pass();
      });

      return barrier;
    });

    it('should return an error that the database throws', function () {
      const barrier = new Barrier();
      const brokenBackingStore = new SQLiteBackingStore('');
      brokenBackingStore.db = new MockSQLiteDatabase({
        all (sql, parameters, callback) {
          callback(new Error('TEST an unspecified error occurred'));
        }
      });

      brokenBackingStore.fetchDevicesForUser('user2', (error, devices) => {
        expect(error).to.be.error(Error, 'TEST an unspecified error occurred');
        expect(devices).to.not.exist();
        barrier.pass();
      });

      return barrier;
    });
  });


  describe('createTransaction()', function () {
    let backingStore;
    beforeEach(() => {
      return promisify(preloadedSQLiteBackingStore.basic)()
        .then((_backingStore) => {
          backingStore = _backingStore;
        });
    });

    afterEach(() => {
      const db = backingStore.db;
      return promisify(db.close.bind(db))();
    });

    it('should create a new transaction', function () {
      const barrier = new Barrier();

      backingStore.createTransaction('event10', 'device6', (error, txID) => {
        expect(error).to.not.exist();
        expect(txID).to.be.a.string();

        backingStore.db.get('SELECT * FROM PushTransaction WHERE transaction_id = ?', txID, (error, result) => {
          expect(error).to.not.exist();
          expect(result).to.be.an.object();
          expect(result.device_id).to.equal('device6');
          expect(result.event_id).to.equal('event10');
          barrier.pass();
        });
      });

      return barrier;
    });

    it('should return an error that the database throws', function () {
      const barrier = new Barrier();
      const brokenBackingStore = new SQLiteBackingStore('');
      brokenBackingStore.db = new MockSQLiteDatabase({
        get (sql, parameters, callback) {
          callback(new Error('TEST an unspecified error occurred'));
        }
      });

      brokenBackingStore.createTransaction('event10', 'device6', (error, devices) => {
        expect(error).to.be.error(Error, 'TEST an unspecified error occurred');
        expect(devices).to.not.exist();
        barrier.pass();
      });

      return barrier;
    });
  });

  describe('fetchTransactionsForEvent()', function () {
    let backingStore;
    beforeEach(() => {
      return promisify(preloadedSQLiteBackingStore.basic)()
        .then((_backingStore) => {
          backingStore = _backingStore;
        });
    });

    afterEach(() => {
      const db = backingStore.db;
      return promisify(db.close.bind(db))();
    });

    it('should return all of the transactions for the event', function () {
      const barrier = new Barrier();

      backingStore.fetchTransactionsForEvent('event4', (error, transactions) => {
        expect(error).to.not.exist();
        expect(transactions).to.be.instanceof(Set);
        expect(Array.from(transactions)).to.only.include([
          { eventID: 'event4',
            transactionID: 'tx5',
            device:
            { deviceID: 'device2',
              transportIdentifier: 'com.example.test1',
              deliveryKey: 'deliveryKey2' } },
          { eventID: 'event4',
            transactionID: 'tx6',
            device:
              { deviceID: 'device3',
                transportIdentifier: 'com.example.test2',
                deliveryKey: 'deliveryKey3' } }]);
        barrier.pass();
      });

      return barrier;
    });

    it('should return an error that the database throws', function () {
      const barrier = new Barrier();
      const brokenBackingStore = new SQLiteBackingStore('');
      brokenBackingStore.db = new MockSQLiteDatabase({
        all (sql, parameters, callback) {
          callback(new Error('TEST an unspecified error occurred'));
        }
      });

      brokenBackingStore.fetchTransactionsForEvent('event4', (error, transactions) => {
        expect(error).to.be.error(Error, 'TEST an unspecified error occurred');
        expect(transactions).to.not.exist();
        barrier.pass();
      });

      return barrier;
    });
  });
});
