import express from 'express';
import { chromium } from 'playwright';
import cors from 'cors';
import { scrapeListings } from './utils/scraper.js';

const app = express();
const PORT= 3000;

app.use(cors());
app.use(express.json());

app.get('/scrape', async (req, res) => {
  const { url = 'https://www.airbnb.com/', maxListings = 10 } = req.query;
  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 ...', // Randomize user agent
    });
    
    const listings = await scrapeListings({ browser: context, url, maxListings });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));