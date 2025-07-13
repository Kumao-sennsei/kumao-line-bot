const express = require('express');
const line = require('@line/bot-sdk');
require('dotenv').config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const app = express();
app.use(express.json());

const client = new line.Client(config);

// Webhook エンドポイント
app.post('/webhook', line.middleware(config), (req, res) => {
  if (!req.body.events || !Array.isArray(req.body.events)) {
    console.error('イベントが不正です');
    return res.status(400).end();
  }

  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('エラー:', err);
      res.status(500).end();
    });
});

// イベントハンドラ
function handleEvent(event) {
  if (event.type !== 'message' || !event.message || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `＜くまお先生：『${event.message.text}』に答えたよ！＞`
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
