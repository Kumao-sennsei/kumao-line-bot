require('dotenv').config();
const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const app = express();
const client = new line.Client(config);

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events;
    const results = await Promise.all(events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== 'message') return null;

  // 📸 Vision対応：画像URLをテキストで送信したときだけ
  if (event.message.type === 'text' && event.message.text.startsWith('http')) {
    try {
      const imageUrl = event.message.text.trim();

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'この画像について教えてください。' },
                { type: 'image_url', image_url: { url: imageUrl } }
              ]
            }
          ],
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      const answer = response.data.choices[0].message.content;

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: answer
      });

    } catch (error) {
      console.error('Vision API Error:', error.message);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '画像解析中にエラーが発生しました…(T_T)'
      });
    }
  }

  // 🧠 テキスト返信
  if (event.message.type === 'text') {
    const reply = `くまお先生：「${event.message.text}」に答えたよ！`;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: reply
    });
  }

  return null;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
