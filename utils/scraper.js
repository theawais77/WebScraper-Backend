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
      // Add debugging to see what's actually on the page
      await page.goto("https://www.airbnb.com/", { waitUntil: "load" });

      // Take a screenshot to see what loaded
      await page.screenshot({ path: 'debug.png' });

      // Log the page content to see available selectors
      const content = await page.content();
      console.log('Page loaded, checking for listing containers...');

      // Try multiple possible selectors
      const possibleSelectors = [
        '[data-testid="listing-card"]',
        '[data-testid="card-container"]', 
        '[role="group"]',
        '.c4mnd7m',
        '.g1qv1ctd',
        '[itemprop="itemListElement"]'
      ];

      for (const selector of possibleSelectors) {
        const count = await page.locator(selector).count();
        console.log(`${selector}: ${count} elements found`);
      }

      // Wait for listings to load (try multiple selectors)
      await page.waitForFunction(() => {
        return document.querySelectorAll('[data-testid*="listing"], [role="group"], .c4mnd7m').length > 0;
      }, { timeout: 15000 });

      const listings = await page.locator('[data-testid*="listing"], [role="group"]').first().waitFor();
      const listingCards = page.locator('[data-testid*="listing"], [role="group"]');
      const count = await listingCards.count();
      console.log(`Found ${count} listing cards`);

      const listingsData = [];
      for (let i = 0; i < Math.min(count, 10); i++) {
        const card = listingCards.nth(i);
        const title = await card.locator('h3, h4, [data-testid="title"]').innerText().catch(() => "No title found");
        const price = await card.locator('[data-testid="price"]').innerText().catch(() => "No price found");
        const link = await card.getAttribute('href') || "No link found";
        console.log(`Listing ${i + 1}: Title: ${title}, Price: ${price}, Link: ${link}`);
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
