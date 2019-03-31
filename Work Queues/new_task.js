#!/usr/bin/env node

const amqp = require("amqplib/callback_api");

// см. Hello World для незакоменченных моментов
amqp.connect("amqp://localhost", (err, conn) => {
  if (err) console.log(err);
  conn.createChannel((err, ch) => {
    let q = "task_queue";
    let msg = process.argv.slice(2).join(" ") || "One.";

    ch.assertQueue(q, { durable: true }); // долговечная задача (чтобы не потерять во время сбоя)
    ch.sendToQueue(q, Buffer.from(msg), { persistent: true }); // постоянная отправка
    console.log(` [x] Sent ${msg}`);
  });
  setTimeout(() => {
    conn.close();
    process.exit(0);
  }, 500);
});

// rabbitmqctl.bat list_queues in RabbitMQ command prompt to show how many queues exist and unsent messages
