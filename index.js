const express = require('express');
const line = require('@line/bot-sdk'); // ← ここ間違ってない！👍
require('dotenv').config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const app = express();
app.use(express.json());

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('エラー:', err);
      res.status(500).end();
    });
});

const client = new line.Client(config);

function handleEvent(event) {
  // 正しい条件分岐！ text以外は無視する
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `＜くまお先生：『${event.message.text}』に答えたよ！`
  });
}

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
