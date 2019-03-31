#!/usr/bin/env node

const amqp = require("amqplib/callback_api");

// connect to RabbitMQ server and create channel
amqp.connect("amqp://localhost", (err, conn) => {
  if (err) console.log(err);
  conn.createChannel((err, ch) => {
    let q = "hello"; // создание очереди идемпотентно. Будет создана, если не существует
    // очередь - массив байтов

    ch.assertQueue(q, { durable: false });
    ch.sendToQueue(q, Buffer.from("Hello World!"));
    console.log("Sent 'Hello World!'");
  });
  setTimeout(() => {
    conn.close();
    process.exit(0);
  }, 500);
});

// rabbitmqctl.bat list_queues in RabbitMQ command prompt to show how many queues exist and unsent messages
