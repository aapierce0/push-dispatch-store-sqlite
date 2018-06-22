BEGIN TRANSACTION;

-- Create a table for Devices
CREATE TABLE Device (
"device_id" TEXT PRIMARY KEY NOT NULL UNIQUE,
"transport_identifier" TEXT NOT NULL,
"delivery_key" TEXT
);

-- Create a join table for UserDevice
CREATE TABLE UserDevice (
"device_id" TEXT REFERENCES "Device"("device_id") NOT NULL,
"user_id" TEXT NOT NULL
);

-- Create a table for Transactions.
-- The word "Transaction" is a reserved keyword, so we use "PushTransaction" instead.
CREATE TABLE PushTransaction (
"transaction_id" TEXT PRIMARY KEY NOT NULL UNIQUE,
"device_id" TEXT REFERENCES "Device"("device_id") NOT NULL,
"event_id" TEXT
);

-- After the item is complete, update the user version.
PRAGMA user_version = 1;

COMMIT TRANSACTION;