INSERT INTO Device("device_id", "transport_identifier", "delivery_key")
VALUES ("device1", "com.example.test1", "deliveryKey1");

INSERT INTO Device("device_id", "transport_identifier", "delivery_key")
VALUES ("device2", "com.example.test1", "deliveryKey2");

INSERT INTO Device("device_id", "transport_identifier", "delivery_key")
VALUES ("device3", "com.example.test2", "deliveryKey3");

INSERT INTO Device("device_id", "transport_identifier", "delivery_key")
VALUES ("device4", "com.example.test2", "deliveryKey4");

INSERT INTO Device("device_id", "transport_identifier", "delivery_key")
VALUES ("device5", "com.example.test2", "deliveryKey5");

INSERT INTO Device("device_id", "transport_identifier", "delivery_key")
VALUES ("device6", "com.example.test1", "deliveryKey6");


INSERT INTO UserDevice("device_id", "user_id")
VALUES ("device1", "user1");

INSERT INTO UserDevice("device_id", "user_id")
VALUES ("device2", "user2");

INSERT INTO UserDevice("device_id", "user_id")
VALUES ("device3", "user2");

INSERT INTO UserDevice("device_id", "user_id")
VALUES ("device4", "user3");

INSERT INTO UserDevice("device_id", "user_id")
VALUES ("device5", "user3");


INSERT INTO PushTransaction("transaction_id", "event_id", "device_id")
VALUES ("tx1", "event1", "device1");

INSERT INTO PushTransaction("transaction_id", "event_id", "device_id")
VALUES ("tx2", "event2", "device2");

INSERT INTO PushTransaction("transaction_id", "event_id", "device_id")
VALUES ("tx3", "event2", "device3");

INSERT INTO PushTransaction("transaction_id", "event_id", "device_id")
VALUES ("tx4", "event3", "device4");

INSERT INTO PushTransaction("transaction_id", "event_id", "device_id")
VALUES ("tx5", "event4", "device2");

INSERT INTO PushTransaction("transaction_id", "event_id", "device_id")
VALUES ("tx6", "event4", "device3");

INSERT INTO PushTransaction("transaction_id", "event_id", "device_id")
VALUES ("tx7", "event5", "device4");

INSERT INTO PushTransaction("transaction_id", "event_id", "device_id")
VALUES ("tx8", "event5", "device5");