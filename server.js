import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

// Sample knowledge base for testing (in a real app, this would be in a database)
const knowledgeBase = {
  topic: "Basic Astronomy",
  content: [
    {
      subject: "Solar System",
      facts: [
        "The Solar System consists of the Sun and all celestial objects bound to it by gravity",
        "There are eight recognized planets in our Solar System",
        "The four inner planets are Mercury, Venus, Earth, and Mars",
        "The four outer planets are Jupiter, Saturn, Uranus, and Neptune",
        "Pluto was reclassified as a dwarf planet in 2006"
      ]
    },
    {
      subject: "The Sun",
      facts: [
        "The Sun is a main-sequence star at the center of our Solar System",
        "It contains 99.86% of the Solar System's mass",
        "The Sun's surface temperature is about 5,500°C (10,000°F)",
        "Light from the Sun takes about 8 minutes to reach Earth"
      ]
    }
  ]
};

app.use(express.json());

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// API route for token generation
app.get("/token", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "verse",
        }),
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// API route to get a question based on the knowledge base
app.post("/api/generate-question", async (req, res) => {
  try {
    console.log("Starting question generation...");
    const prompt = `Based on this knowledge about ${knowledgeBase.topic}, generate a thought-provoking open-ended question that tests understanding. Return a JSON object with 'question' and 'relevantFacts' fields. The relevantFacts should contain key points that a good answer should cover. Do not include any markdown formatting or code block indicators in the response.`;
    
    console.log("Sending request to OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a question generator that returns clean JSON without any markdown formatting. Format: {"question": "your question here", "relevantFacts": ["fact1", "fact2", ...]}`
          },
          {
            role: "system",
            content: JSON.stringify(knowledgeBase)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    console.log("Received response from OpenAI API");
    const data = await response.json();
    console.log("OpenAI API Response:", JSON.stringify(data, null, 2));
    
    if (!data.choices?.[0]?.message?.content) {
      console.error("Unexpected API response format:", data);
      return res.status(500).json({ error: "Invalid API response format" });
    }

    const content = data.choices[0].message.content;
    console.log("Raw content from API:", content);
    
    // Clean the content string by removing any markdown formatting
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    console.log("Cleaned content:", cleanContent);
    
    try {
      console.log("Attempting to parse JSON...");
      const parsedContent = JSON.parse(cleanContent);
      console.log("Successfully parsed JSON:", parsedContent);
      res.json(parsedContent);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Failed to parse content:", cleanContent);
      res.status(500).json({ 
        error: "Failed to parse question response",
        details: parseError.message,
        rawContent: cleanContent
      });
    }
  } catch (error) {
    console.error("Question generation error:", error);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    res.status(500).json({ 
      error: "Failed to generate question",
      details: error.message,
      stack: error.stack
    });
  }
});

// API route to evaluate an answer
app.post("/api/evaluate-answer", async (req, res) => {
  try {
    console.log("Starting answer evaluation...");
    const { question, answer, relevantFacts } = req.body;
    console.log("Evaluation request:", { question, answer, relevantFacts });
    
    const prompt = `Evaluate this answer to the question: "${question}". The answer provided was: "${answer}". 
    A good answer should cover these key points: ${JSON.stringify(relevantFacts)}. 
    Provide feedback in JSON format with fields: 'score' (0-100), 'feedback' (constructive feedback), and 'corrections' (any misconceptions to address).`;
    
    console.log("Sending evaluation request to OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert evaluator in " + knowledgeBase.topic
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    console.log("Received evaluation response from OpenAI API");
    const data = await response.json();
    console.log("OpenAI API Evaluation Response:", JSON.stringify(data, null, 2));

    try {
      const parsedContent = JSON.parse(data.choices[0].message.content);
      console.log("Successfully parsed evaluation response:", parsedContent);
      res.json(parsedContent);
    } catch (parseError) {
      console.error("Evaluation parsing error:", parseError);
      console.error("Failed to parse evaluation:", data.choices[0].message.content);
      res.status(500).json({ 
        error: "Failed to parse evaluation response",
        details: parseError.message,
        rawContent: data.choices[0].message.content
      });
    }
  } catch (error) {
    console.error("Answer evaluation error:", error);
    console.error("Full evaluation error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    res.status(500).json({ 
      error: "Failed to evaluate answer",
      details: error.message,
      stack: error.stack
    });
  }
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
