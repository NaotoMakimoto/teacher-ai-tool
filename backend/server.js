const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("../frontend")); // frontendを公開

app.post("/api/generate", async (req, res) => {
  const { grade, subject, unit, plan } = req.body;
  const prompt = `
  あなたは日本の小中学校の教員を支援する教育アドバイザーです。
  
  以下は、授業を設計するための情報です。
  
  - 学年: ${grade}
  - 教科: ${subject}
  - 単元: ${unit}
  - 授業構想: ${plan}
  
  この授業において、どの場面でどのように生成AI（例：ChatGPTなど）を活用できるか、具体的な場面・手順・注意点を箇条書きで3〜5個提案してください。
  
  ※ 日本の対象学年において実現可能な提案をしてください。
  ※ すべて日本語で出力して下さい。
  `;
  
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ result: response.data.choices[0].message.content });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({ error: "生成AI APIの呼び出しに失敗しました。" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ サーバー起動: http://localhost:${PORT}`);
});