from fastapi import FastAPI, Request
import openai
import uvicorn

app = FastAPI()

# OpenAIのAPIキーをここに入れてね（安全な方法にあとで変更する）
openai.api_key = "sk-xxxxxxxxxxxxxxxx"

@app.post("/webhook")
async def webhook(req: Request):
    body = await req.json()
    user_message = body.get("message", "こんにちは")

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",  # または gpt-4 など
        messages=[
            {"role": "user", "content": user_message}
        ]
    )
    reply = response.choices[0].message.content
    return {"reply": reply}
