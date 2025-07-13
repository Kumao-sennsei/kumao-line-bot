const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { middleware, Client } = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

// 画像一時保存用フォルダ（Renderでは tmp ディレクトリのみ書き込み可能）
const TMP_DIR = '/tmp';

app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message') {
      if (event.message.type === 'image') {
        try {
          const messageId = event.message.id;
          const stream = await client.getMessageContent(messageId);

          const tempFilePath = path.join(TMP_DIR, `${messageId}.jpg`);
          const writable = fs.createWriteStream(tempFilePath);

          await new Promise((resolve, reject) => {
            stream.pipe(writable);
            stream.on('end', resolve);
            stream.on('error', reject);
          });

          // 画像ファイルを base64 に変換して OpenAI Vision に送る用の Data URL にする（後で使う）
          const base64Image = fs.readFileSync(tempFilePath, { encoding: 'base64' });
          const dataUrl = `data:image/jpeg;base64,${base64Image}`;

          // ここで一旦確認メッセージを返す（あとでVision送信処理に接続）
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '画像を受け取りました！解析中です📷✨',
          });

          // 👉 この dataUrl を Vision に送る処理は次のステップで！

        } catch (err) {
          console.error('画像処理エラー:', err);
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '画像の取得に失敗しました🙇‍♂️',
          });
        }
      }
    }
  }

  res.status(200).end();
});
