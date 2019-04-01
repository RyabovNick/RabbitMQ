#!/usr/bin/env node

let amqp = require("amqplib/callback_api");

let args = process.argv.slice(2);

if (args.length == 0) {
  console.log("Usage: receive_logs_direct.js [info] [warning] [error]");
  process.exit(1);
}

// см. Hello World, Publish Subscribe для незакоменченных моментов
amqp.connect("amqp://localhost", (err, conn) => {
  if (err) console.log(err);
  conn.createChannel((err, ch) => {
    if (err) console.log(err);
    let ex = "direct_logs";

    ch.assertExchange(ex, "direct", { durable: false });

    ch.assertQueue("", { exclusive: true }, (err, q) => {
      console.log(" [*] Waiting for logs. To exit press CTRL+C");

      args.forEach(severity => {
        ch.bindQueue(q.queue, ex, severity);
      });

      ch.consume(
        q.queue,
        msg => {
          console.log(
            ` [x] ${msg.fields.routingKey}: ${msg.content.toString()}`
          );
        },
        { noAck: true }
      );
    });
  });
});

// rabbitmqctl.bat list_queues name messages_ready messages_unacknowledged
// сообщение будет доставлено после выхода клиента, но RabbitMQ будет потреблять много памяти
// т.к. не сможет выпускать неиспользованные сообщения
