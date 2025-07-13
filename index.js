require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());

// LINE bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new line.Client(config);

// 画像 → base64
const imageToBase64 = async (messageId) => {
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
  });
  return Buffer.from(response.data).toString('base64');
};

// OpenAI Vision API 呼び出し
const callOpenAIWithImage = async (base64, promptText = '') => {
  const result = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText || 'この画像を説明して。' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // ✅ Visionは message.content が配列
  return result.data.choices[0].message.content[0].text;
};

// webhookルート
app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message') {
      const message = event.message;
      let reply = 'AIくまお先生が考え中です…';

      try {
        if (message.type === 'image') {
          const base64 = await imageToBase64(message.id);
          reply = await callOpenAIWithImage(base64);
        } else if (message.type === 'text') {
          reply = await callOpenAIWithImage('', message.text);
        }
      } catch (err) {
        console.error('エラー:', err);
        reply = '画像の処理中にエラーが発生しました。';
      }

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: reply,
      });
    }
  }

  res.sendStatus(200);
});

// 起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`くまお先生がポート${PORT}で授業開始！`);
});
