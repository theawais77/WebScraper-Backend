const MAX_RETRIES = 3;

const validateListing = (listing) => {
  return (
    typeof listing.title === "string" &&
    typeof listing.price === "string" &&
    typeof listing.link === "string"
  );
};

export const scrapeListings = async ({ browser, retryCount }) => {
  try {
    const page = await browser.newPage();

    try {
      // Increase timeout and change wait strategy
      await page.goto("https://www.airbnb.com/", { 
        waitUntil: "domcontentloaded", 
        timeout: 60000 
      });

      // Wait for card containers to load
      await page.waitForSelector('[data-testid="card-container"]', { timeout: 30000 });

      const listingCards = page.locator('[data-testid="card-container"]');
      const count = await listingCards.count();
      console.log(`Found ${count} listing cards`);

      const listingsData = [];
      for (let i = 0; i < Math.min(count, 10); i++) {
        const card = listingCards.nth(i);
        
        // Extract title (property name)
        const title = await card.locator('div[data-testid="listing-card-title"]').textContent().catch(() => 
          card.locator('h3, h2, [role="heading"]').first().textContent().catch(() => "N/A")
        );
        
        // Extract price
        const price = await card.locator('span:has-text("$")').first().textContent().catch(() => "N/A");
        
        // Extract link
        const link = await card.locator('a').first().getAttribute('href').catch(() => "N/A");
        
        listingsData.push({ title, price, link });
      }

      const validListings = listingsData.filter(validateListing);
      if (validListings.length === 0) throw new Error("No listings found");

      return validListings;
    } catch (pageError) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        return await scrapeListings({ browser, retryCount: retryCount + 1 });
      } else {
        throw new Error(`Scraping failed after ${MAX_RETRIES} attempts: ${pageError.message}`);
      }
    } finally {
      await page.close();
    }
  } catch (browserError) {
    throw new Error(`Browser error: ${browserError.message}`);
  }
};
