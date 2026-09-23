import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/api/ask", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({
      error: "Failed to get response from Gemini",
    });
  }
});

app.listen(5000, () => {
  console.log("AI backend running on http://localhost:5000");
});