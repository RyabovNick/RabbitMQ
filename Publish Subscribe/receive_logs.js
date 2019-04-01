#!/usr/bin/env node

let amqp = require("amqplib/callback_api");

// см. Hello World, Publish Subscribe для незакоменченных моментов
amqp.connect("amqp://localhost", (err, conn) => {
  if (err) console.log(err);
  conn.createChannel((err, ch) => {
    if (err) console.log(err);
    let ex = "logs";

    ch.assertExchange(ex, "fanout", { durable: false });

    ch.assertQueue("", { exclusive: true }, (err, q) => {
      console.log(
        ` [*] Waiting for messages in ${q.queue}. To exit press CTRL+C`
      );
      ch.bindQueue(q.queue, ex, "");

      ch.consume(
        q.queue,
        msg => {
          if (msg.content) {
            console.log(` [x] ${msg.content.toString()}`);
          }
        },
        { noAck: true }
      );
    });
  });
});

// rabbitmqctl.bat list_queues name messages_ready messages_unacknowledged
// сообщение будет доставлено после выхода клиента, но RabbitMQ будет потреблять много памяти
// т.к. не сможет выпускать неиспользованные сообщения
