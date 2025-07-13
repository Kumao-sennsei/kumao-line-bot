const crypto = require('crypto');
const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new Client(config);
const app = express();

// ✅ bodyの生データを取得できるように
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-line-signature'];
  const body = req.rawBody;

  const hash = crypto
    .createHmac('SHA256', config.channelSecret)
    .update(body)
    .digest('base64');

  if (hash !== signature) {
    return res.status(401).send('Unauthorized');
  }

  // parse後のボディはそのまま利用
  const events = req.body.events;
  events.forEach((event) => {
    if (event.type === 'message') {
      const reply = {
        type: 'text',
        text: 'くまお先生: こんにちは！'
      };
      client.replyMessage(event.replyToken, [reply]);
    }
  });

  res.status(200).send('OK');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
