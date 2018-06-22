'use strict';
const Barrier = require('cb-barrier');
const Code = require('code');
const Lab = require('lab');

const sqlite3 = require('sqlite3');
const SQLiteBackingStore = require('../lib');

// Test shortcuts
const lab = exports.lab = Lab.script();
const { describe, it, beforeEach, afterEach } = lab;
const { expect } = Code;

describe('SQLiteBackingStore', function () {
  describe('constructor', function () {
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
          barrier.pass();
        });
      });

      return barrier;
    });
  });


  describe('addDevice()', function () {
    let backingStore;
    beforeEach(() => {
      backingStore = new SQLiteBackingStore('');
      return new Promise((resolve, reject) => {
        backingStore.setup((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    });

    afterEach(() => {
      return new Promise((resolve, reject) => {
        backingStore.db.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
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
  });
});
