
import express from "express";
import { chromium } from "playwright";
import cors from "cors";
import { scrapeListings } from "./utils/scraper.js";
const app = express();
const PORT = 3000;

app.use(cors());

app.get("/scrape", async (req, res) => {
 
});

app.listen(PORT, () => {
  console.log(`Scraper server running on http://localhost:${PORT}`);
});
