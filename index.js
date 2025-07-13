const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new Client(config);

app.use(middleware(config));

// Webhook受信処理
app.post('/webhook', (req, res) => {
  console.log('📩 Webhook received:', JSON.stringify(req.body.events));

  Promise.all(req.body.events.map(async (event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `＜くまお先生：『${event.message.text}』に答えたよ！＞`
      });
    }
  }))
  .then(() => res.status(200).end())
  .catch((err) => {
    console.error('❌ Error:', err);
    res.status(500).end();
  });
});

// 動作確認用ルート
app.get('/', (req, res) => {
  res.send('くまお先生は起動中です！');
});

// Renderが使うポート
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`✅ サーバー起動中: http://localhost:${port}`);
});
