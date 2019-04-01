# RabbitMQ

From docs: https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html

Брокер сообщений.

Когда вы отправляете письмо, вы можете быть уверены, что адреса рано или поздно получит его. RabbitMQ - почтовый ящик, почтовое отделение и почтальон одновременно. Только главное отличие - RabbitMQ принимает, хранит и отправляет бинарные данные - сообщения.

- Producing - отправка (producers - производитель)
- Queue - очередь, почтовый ящик, который находится внутри RabbitMQ. Сообщения могут храниться только там. По сути - это большой буфер сообщений, размер которого зависит от памяти и диска хоста. Много производителей могут отправлять сообщения и много получателей - получать данныые из очереди.
- Consuming - потребление (consumers - получатель (потребитель)), получение. Программа, которая ожидает сообщения.

## Hello World

## Work Queues

Распределение задач между несколькими воркерами.
Цель - избежать немедленного выполнения ресурсоемкой задачи. Мы планируем задачу, которая будет сделана позже.
Инкапсулируем задачу как сообщение и отправляем ее в очередь. Воркер возьмёт и выполнит задачу в конце концов.

Очень полезно в веб-приложениях, где невозможно выполнить сложную задачу во время HTTP-запроса.

В этом примере будем притворяться, что выполняем тяжёлое задание.
Точка - секунда работы в string. Hello..... - 5 секунд работы.

Одно из преимуществ использования задач - распараллеливание работы. Если не успеваем - можем добавить больше воркеров, т.е. легко масштабироваться.

Можем запустить одновременно несколько воркеров. И отправлять сообщения - они будут поступать к каждому воркеру по очереди (1-3-5-7 и т.д. - 1ому: 2-4-6-8 и т.д. - 2ому). Так по умолчанию отправляет сообщения RabbitMQ. В среднем каждый получатель получит одинаковое количество сообщений - round-robin называется такая система.

### Message acknowledgment

В такой системе RabbitMQ сразу помечает отправленное сообщение на удаление. Если воркер помер не завершив его, то мы потеряем сообщение и также мы теряем все отправленные, но не обработанные сообщения воркера. Конечно, это плохо. Если воркер умер, то надо передать его работу другому.

RabbitMQ поддерживает подтверждение сообщений, чтобы убедиться, что сообщение никогда не теряется (message acknowledgments). Ack (acknowledgments) отправляет подтверждение, что сообщение было получено, обработано и RabbitMQ может удаляеть его.

Если потребитель умирает без отправки подтверждения выполнения задачи, то RabbitMQ поймёт, что сообщение не было обработано и поставит его в очередь обратно. Если есть другие живые работники, то сообщение быстро уйдёт кому-то из них, таким образом. можно быть уверенным, что ни одно сообщение не будет потеряно.

### Message durability

Ещё одна проблема - если останавливается сервер RabbitMQ. По умолчанию он забывает об очередях и сообщениях, но можно это запретить. Нужно пометить очередь и сообщения как долговечные, чтобы убедиться, что сообщения не потеряны.

`ch.assertQueue('hello', {durable: true});` - не терять очередь.

`ch.sendToQueue(q, Buffer.from(msg), { persistent: true });` - долговечное сообщение

Примечание: такой подход не гарантирует абсолютную не потерю данных. Есть небольшой промежуток времени, когда сообщение в кэше и не записано на диск. Для решения проблемы можно использовать publisher confirms.

### Fair dispatch

На данном этапе если (для 2-х воркеров) нечётные задачи будут тяжёлые, а чётные - легки, первый воркер будет делать всю тяжёлую работу, а другой отдыхать. RabbitMQ просто отправляет сообщение, не смотря на кол-во неподтвержденных сообщений.

Для решения проблемы можно использовать `prefetch` = 1. Не более 1 сообщению работнику за раз или "не отдавай сообщение работнику, если не подтвердит предыдущее, отправь не занятому".

## Publish/Subscribe

До этого момента задача отправлялась только одному воркеру. Тут - возможность доставки сообщения различным получателям. Такой паттерн называется publish/subscribe.

Для иллюстрации будет сделана простая система логгирования. Состоит из двух программ: одна производит сообщения, другая их печатает на экран.

В такой системе каждая копия получателя будет принимать сообщение.

До этого момента мы только отправляли и получали сообщения в очередь и из очереди.

Ключевая идея RabbitMQ - отправитель никогда не отправляет сообщения напрямую в очередь. И он вообще не знает, будет ли оно вообще доставлено в очередь.

Вместо этого производитель может отправить сообщения на обмен (exchange). Обмен - получает сообщения от производителей и отправляет в очередь. Существуют разные типы обмена: отправить в определенную очередь, отправить во многие очередь, отклонить: direct, topic, headers и fanout.

### Temporary queues

В 1 и 2 разделе были использованы имена - hello, task_queue. Нам необходимо было назвать очередь, чтобы и получатель и отправитель могли взаимодействовать с конкретной очередью.

Но тут мы хотим знать обо всех сообщениях, а не о их части. Также нам интересны текущие сообщения, не старые.

Во-первых, каждый раз, при подключении нам нужная свежая, пустая очередь - можно позволить серверу выбирать название очереди за нас.

Во-вторых, когда потребитель отключается, то очередь должна быть удалена.

`ch.assertQueue('', {exclusive: true});`

### Bindings

Нам необходимо сказать обмену, чтобы он отправлял сообщения в очередь. Отношения между обменом и очередью называются связью (binding).

`ch.bindQueue(queue_name, 'logs', '');`
