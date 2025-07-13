const express = require('express');
const line = require('@line/bot-sdk');
require('dotenv').config();

// LINE Botの設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const app = express();
app.use(express.json());

// Webhookエンドポイント
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

// メッセージイベントの処理
function handleEvent(event) {
  // メッセージタイプ以外 or 無効なメッセージは無視
  if (event.type !== 'message' || !event.message || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // 返信メッセージ
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `＜くまお先生：『${event.message.text}』に答えたよ！`
  });
}

// サーバー起動
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
