'use strict';

const notImplemented = new Error('not implemented');
class SQLiteBackingStore {
    constructor(path) {

    }



    /** Store information about this device in memory */
    addDevice (deviceID, transportIdentifier, deliveryKey, callback) {
        callback(notImplemented);
    }

    /** Fetch a device from the store */
    fetchDevice (deviceID, callback) {
        callback(notImplemented);
    }


    /** Associate a deviceID with a user */
    associateDevice (deviceID, userID, callback) {
        callback(notImplemented);
    }

    /** Disassociate a deviceID from a user */
    dissociateDevice (deviceID, userID, callback) {
        callback(notImplemented);
    }

    /** Fetch the set of device IDs currently associated with a user */
    fetchDeviceIDsForUser (userID, callback) {
        callback(notImplemented);
    }


    /** Creates a new transaction for this device and event ID, and returns the transaction ID */
    createTransaction (eventID, deviceID, callback) {
        callback(notImplemented);
    }

    /** Fetches the transactions for a given event ID */
    fetchTransactionsForEvent (eventID, callback) {
        callback(notImplemented);
    }
}

module.exports = SQLiteBackingStore;