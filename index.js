const express = require('express');
const line = require('@line/bot-sdk');
const dotenv = require('dotenv');

dotenv.config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const app = express();
const client = new line.Client(config);

app.post('/webhook', express.json(), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error('🔥エラーが発生しました:', err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const msg = event.message.text.trim();
  let replyText = '';

  if (msg.includes('こんにちは')) {
    replyText = 'こんばんは。今日は何を勉強しますか？';
  } else if (msg.includes('英語')) {
    replyText = 'OK！今日の英単語は "profit"（利益）です！';
  } else if (msg.includes('プログラミング')) {
    replyText = 'JavaScriptを学ぶなら、まずはconsole.logから始めましょう！';
  } else {
    replyText = 'AIくまお先生が現在考え中です…しばらくお待ちください。';
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText,
  });
}

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
