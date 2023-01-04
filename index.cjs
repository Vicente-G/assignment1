const puppeteer = require("puppeteer");
const fs = require("fs")

const scrapeInfiniteScrollItems = async (page, pageCount) => {
  let previousHeight;
  let items = [];

  for (let i = 0; i < pageCount; i++) {
    previousHeight = await page.evaluate("document.body.scrollHeight");
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await page.waitForFunction(
      `document.body.scrollHeight > ${previousHeight}`
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  items = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll(".search_result_row"));
    return items.map((item) => {
      let raw = item.innerText.split("\n");
      return raw;
    });
  });

  return items;
};

(async () => {
  const browser = await puppeteer.launch({
    args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
    ]
});

  const page = await browser.newPage();
  await page.goto("https://store.steampowered.com/search/?specials=1&hidef2p=1");

  const items = await scrapeInfiniteScrollItems(page, 36);

  fs.writeFileSync("items.json", JSON.stringify(items));
  browser.close();
})();