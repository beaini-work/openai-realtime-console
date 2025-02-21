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
