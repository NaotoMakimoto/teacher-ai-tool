const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.post("/api/generate", async (req, res) => {
  // フロントエンドから送信されたデータを取得
  const { grade, subject, unit, plan, purpose } = req.body;
  
  // ユーザー向けのプロンプト: AIに具体的な情報を提供する
  const userPrompt = `
  以下は、授業を設計するための情報です。
  
  - 学年: ${grade}
  - 教科: ${subject}
  - 単元: ${unit}
  - 授業構想: ${plan}
  - 子どもの実態と授業への思い: ${purpose}
  
  この情報に基づき、生成AI（例：ChatGPTなど）を活用できる具体的な場面・手順・注意点を提案してください。
  `; 
  
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          // System Role: AIの役割と出力形式を厳しく定義し、構造化を強制
          { 
            role: "system", 
            content: `
            あなたは日本の小中学校の教員を支援する教育アドバイザーです。
            出力は、日本の対象学年において実現可能な提案を3個から5個の間に限定し、必ず以下のMarkdown構造に従ってください。
            
            各提案は、以下の3つの見出し（Markdownの太字とリスト）を厳密に含める必要があります。冒頭や末尾の挨拶、説明は一切不要です。
            
            - **場面**：具体的な授業段階や活動名。
            - **活用方法**：AIに何をさせ、生徒がどう動くかという具体的な手順。
            - **注意点**：安全面、個人情報の取り扱い、教師による確認など、AI活用における留意事項。
            `
          },
          { role: "user", content: userPrompt },
        ],
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
    if (error.message && error.message.includes("429")) {
        res.status(500).json({ error: "生成AI APIの呼び出しに失敗しました。OpenRouterのプランをご確認ください。（ステータスコード: 429）" });
    } else {
        res.status(500).json({ error: "生成AI APIの呼び出しに失敗しました。" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`✅ サーバー起動: http://localhost:${PORT}`);
});

console.log("API Key Exists:", !!process.env.OPENROUTER_API_KEY);

const path = require("path");

// 静的ファイルのルートを設定
app.use(express.static(path.join(__dirname, "../")));  

// ルートアクセス時に index.html を返す
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../docs/index.html"));
});