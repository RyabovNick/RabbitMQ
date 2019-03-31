#!/usr/bin/env node

let amqp = require("amqplib/callback_api");

// см. Hello World для незакоменченных моментов
amqp.connect("amqp://localhost", (err, conn) => {
  if (err) console.log(err);
  conn.createChannel((err, ch) => {
    if (err) console.log(err);
    let q = "task_queue";

    ch.assertQueue(q, { durable: true });
    ch.prefetch(1); // Fair dispatch
    console.log(` [*] Waiting for messages in ${q}. To exit press CTRL+C`);

    ch.consume(
      q,
      msg => {
        let secs = msg.content.toString().split(".").length - 1;
        console.log("secs: ", secs);

        console.log(`[x] Received ${msg.content.toString()}`);
        setTimeout(() => {
          console.log(" [x] Done");
          ch.ack(msg); // Message acknowledgment
        }, secs * 1000);
      },
      { noAck: false }
    );
  });
});

// rabbitmqctl.bat list_queues name messages_ready messages_unacknowledged
// сообщение будет доставлено после выхода клиента, но RabbitMQ будет потреблять много памяти
// т.к. не сможет выпускать неиспользованные сообщения
