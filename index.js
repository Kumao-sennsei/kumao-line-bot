const express = require('express');
const line = require('@line/bot-sdk');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
dotenv.config();

const app = express();

// 💡 LINE SDK の設定
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

// ✅ webhookエンドポイントでは signatureチェック前に bodyParser を使わない！
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

// ✅ その他のエンドポイントで bodyParser を使用
app.use(bodyParser.json());

function handleEvent(event) {
  // ここはたかちゃんの元コードに応じて内容維持！
  if (event.type === 'message' && event.message.type === 'text') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `くまお先生:『${event.message.text}』に答えたよ！`
    });
  }

  return Promise.resolve(null);
}

const client = new line.Client(config);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
