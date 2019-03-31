#!/usr/bin/env node

let amqp = require("amqplib/callback_api");

// подключаемся
amqp.connect("amqp://localhost", (err, conn) => {
  if (err) console.log(err);
  // очередь, из которой будем получать
  // создаём её и тут, т.к. можем запустить получателя раньше отправителя
  conn.createChannel((err, ch) => {
    let q = "hello";

    ch.assertQueue(q, { durable: false });
    console.log(` [*] Waiting for messages in ${q}. To exit press CTRL+C`);
    ch.consume(
      q,
      msg => {
        // выполняется, когда в очередь поступают сообщения от отправителя
        console.log(` [x] Received ${msg.content.toString()}`);
      },
      { noAck: true }
    );
  });
});
