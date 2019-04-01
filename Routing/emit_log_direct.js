#!/usr/bin/env node

const amqp = require("amqplib/callback_api");

// см. Hello World, Publish Subscribe для незакоменченных моментов
amqp.connect("amqp://localhost", (err, conn) => {
  if (err) console.log(err);
  conn.createChannel((err, ch) => {
    let ex = "direct_logs";
    let args = process.argv.slice(2);
    let msg = args.slice(1).join(" ") || "Hello World!";
    let severity = args.length > 0 ? args[0] : "info";

    ch.assertExchange(ex, "direct", { durable: false }); // создание обмена (exchange)
    ch.publish(ex, severity, Buffer.from(msg)); // отправляем не в очередь, а в обмен
    // 2 параметр говорит, что мы не хотим отправлять сообщение в конкретную очередь

    console.log(` [x] Sent ${severity}: ${msg}`);
  });
  setTimeout(() => {
    conn.close();
    process.exit(0);
  }, 500);
});

// rabbitmqctl.bat list_exchanges in RabbitMQ command prompt to show how many exchanges exist
