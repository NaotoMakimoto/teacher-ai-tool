const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- ミドルウェア設定 ---
app.use(cors());
app.use(bodyParser.json());

// 静的ファイルのルートを設定 
app.use(express.static(path.join(__dirname, "../")));  

// ルートアクセス時に index.html を返す
app.get("/", (req, res) => {
 res.sendFile(path.join(__dirname, "../docs/index.html"));
});

// ヘルスチェック（Ping専用）エンドポイント 
app.get("/health", (req, res) => {
 res.status(200).json({ status: "ok", message: "Server is running and healthy." });
});

// --- AI生成エンドポイント
app.post("/api/generate", async (req, res) => {
  const { grade, subject, unit, plan, purpose } = req.body;
  const prompt = `
あなたは日本の小中学校の教員を支援する教育アドバイザーです。

以下は、授業を設計するための情報です。

- 学年: ${grade}
- 教科: ${subject}
- 単元: ${unit}
- 授業構想: ${plan}
- 子どもの実態と授業への思い: ${purpose}

この授業において、どの場面でどのように生成AI（例：ChatGPTなど）を活用できるか、具体的な場面・手順・注意点を箇条書きで3〜5個提案してください。

※ 日本の対象学年において実現可能な提案をしてください。
※ すべて日本語で出力して下さい。
`;

  try {
    console.log("OpenRouter APIリクエスト開始...");
    
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

    console.log("OpenRouter APIレスポンス成功");
    res.json({ result: response.data.choices[0].message.content });
    
  } catch (error) {
    // ★ 詳細なエラー情報をログ出力
    console.error("=== API Error Details ===");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("Headers:", error.response?.headers);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);
    console.error("========================");

    // OpenRouterから返されたステータスコードをそのままクライアントに返す
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || 
                         error.response?.data?.error || 
                         "生成AI APIの呼び出しに失敗しました。";
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.response?.data // デバッグ用
    });
  }
});