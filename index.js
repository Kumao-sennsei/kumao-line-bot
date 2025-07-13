const express = require('express');
const { Client } = require('@line/bot-sdk');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new Client(config);
const app = express();

// ✅ LINE署名検証のための rawBody を取得
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// ✅ Webhook受信＆署名検証付き
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-line-signature'];
  const body = req.rawBody;

  // ハッシュ生成（署名検証）
  const hash = crypto
    .createHmac('SHA256', config.channelSecret)
    .update(body)
    .digest('base64');

  if (hash !== signature) {
    return res.status(401).send('Unauthorized');
  }

  const events = req.body.events;
  Promise
    .all(events.map(handleEvent))
    .then(() => res.status(200).send('OK'))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// ✅ メッセージ応答処理
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const replyMessage = {
    type: 'text',
    text: `くまお先生: 「${event.message.text}」ですね！よい質問です✨`
  };

  return client.replyMessage(event.replyToken, replyMessage);
}

// ✅ サーバー起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
