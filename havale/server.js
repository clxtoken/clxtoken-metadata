const express = require("express");
const fs = require("fs");
const xml2js = require("xml2js");
const app = express();
app.use(express.json());
app.use(express.static("."));

async function getRandomAccount() {
  const xml = fs.readFileSync("hesaplar.xml", "utf8");
  const result = await xml2js.parseStringPromise(xml);
  const hesaplar = result.hesaplar.hesap;
  const secilen = hesaplar[Math.floor(Math.random() * hesaplar.length)];
  return {
    banka: secilen.banka[0],
    iban: secilen.iban[0],
    ad: secilen.ad[0]
  };
}

app.post("/api/havale", async (req, res) => {
  const { userCode } = req.body;
  const amount = 500; // sabit tutar

  const hesap = await getRandomAccount();
  const response = {
    userCode,
    amount,
    bank: hesap.banka,
    iban: hesap.iban,
    accountName: hesap.ad,
    status: "pending",
    timestamp: new Date().toISOString()
  };

  fs.appendFileSync("logs.txt", JSON.stringify(response) + "\n");
  res.json(response);
});

app.post("/api/havale/confirm", (req, res) => {
  const { userCode, amount, timestamp } = req.body;
  const now = new Date();
  const işlemSüresi = (now - new Date(timestamp)) / 1000;

  let alarm = null;
  if (amount > 100000) alarm = "Yüksek tutarlı işlem";
  else if (işlemSüresi > 1200) alarm = "Zaman aşımı";
  else if (!userCode || !amount) alarm = "Eksik parametre";

  const result = {
    userCode,
    amount,
    status: alarm ? "flagged" : "success",
    confirmedAt: now.toISOString(),
    alarm: alarm || null
  };

  fs.appendFileSync("logs.txt", JSON.stringify(result) + "\n");
  res.json(result);
});

app.listen(3000, () => console.log("Havale API hazır: http://localhost:3000"));