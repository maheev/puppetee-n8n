const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

app.get("/parse", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing ?url=" });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle0", timeout: 0 });

    // Автоскролл до конца страницы
    await autoScroll(page);

    // Собираем все ссылки на карточки товаров
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a"))
        .map(a => a.href)
        .filter(href => href.includes("/product/"));
    });

    await browser.close();
    res.json([...new Set(links)]); // Уникальные ссылки
  } catch (err) {
    await browser.close();
    res.status(500).json({ error: err.toString() });
  }
});

// Автоскролл страницы
async function autoScroll(page){
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if(totalHeight >= scrollHeight){
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});