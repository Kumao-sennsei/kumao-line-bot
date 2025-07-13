// ✅ Vision対応LINE Bot（最新版）
require('dotenv').config();
const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');
const fs = require('fs');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
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

  if (event.message.type === 'image') {
    try {
      const stream = await client.getMessageContent(event.message.id);
      const filePath = `/tmp/${event.message.id}.jpg`;
      const writable = fs.createWriteStream(filePath);
      stream.pipe(writable);

      await new Promise((resolve) => writable.on('finish', resolve));

      const imageData = fs.readFileSync(filePath);
      const base64Image = imageData.toString('base64');

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'この画像について教えてください。' },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                },
              ],
            },
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const answer = response.data.choices[0].message.content;
      return client.replyMessage(event.replyToken, { type: 'text', text: answer });
    } catch (error) {
      console.error('Image processing error:', error);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '画像の処理中にエラーが発生しました。',
      });
    }
  }

  if (event.message.type === 'text') {
    const reply = `くまお先生：「${event.message.text}」に答えたよ！`;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: reply,
    });
  }

  return null;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
