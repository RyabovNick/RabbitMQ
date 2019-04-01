#!/usr/bin/env node

const amqp = require("amqplib/callback_api");

// см. Hello World, Publish Subscribe для незакоменченных моментов
amqp.connect("amqp://localhost", (err, conn) => {
  if (err) console.log(err);
  conn.createChannel((err, ch) => {
    let ex = "logs";
    let msg = process.argv.slice(2).join(" ") || "Hello World!";

    ch.assertExchange(ex, "fanout", { durable: false }); // создание обмена (exchange)
    ch.publish(ex, "", Buffer.from("Hello World!")); // отправляем не в очередь, а в обмен
    // 2 параметр говорит, что мы не хотим отправлять сообщение в конкретную очередь

    console.log(` [x] Sent ${msg}`);
  });
  setTimeout(() => {
    conn.close();
    process.exit(0);
  }, 500);
});

// rabbitmqctl.bat list_exchanges in RabbitMQ command prompt to show how many exchanges exist
