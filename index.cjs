const puppeteer = require("puppeteer");
const express = require('express');
const fs = require("fs");

const app = express();
const PORT = 3000;

const scrapeInfiniteScrollPages = async (page, times) => {
  let previousHeight;
  let items = [];

  for (let i = 0; i < times; i++) {
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
      // make it better
      return raw;
    });
  });

  return items;
};

const updateDb = async (filename) => {
  const browser = await puppeteer.launch({
    args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
    ]
  });

  const page = await browser.newPage();
  await page.goto("https://store.steampowered.com/search/?specials=1&hidef2p=1");
  const items = await scrapeInfiniteScrollPages(page, 36);

  fs.writeFileSync(filename, JSON.stringify(items));
  browser.close();
  return JSON.stringify(items);
};

app.get('/', async (req, res) => {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, '0');
  let mm = String(today.getMonth() + 1).padStart(2, '0');
  let yyyy = String(today.getFullYear());
  let PATH = `./cache/${mm}-${dd}-${yyyy}.json`;
  let data;
  if (fs.existsSync(PATH)) {
    console.log(`File ${PATH} found, using cache to resolve the request.`);
    data = fs.readFileSync(PATH, {encoding:'utf8', flag:'r'});
  } else {
    console.log(`File ${PATH} not found, solving the request manually.`);
    data = await updateDb(PATH);
  }
  res.send(data);
})

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})