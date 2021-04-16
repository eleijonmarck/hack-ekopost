require("dotenv").config();
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://secure.ekopost.se/authorize/signin");

  const alreadyCookies = false;
  // login with cookies
  if (alreadyCookies) {
    const cookiename = "";
    const cookievalue = "";
    const cookies = [
      {
        name: cookiename,
        value: cookievalue,
      },
    ];

    await page.setCookie(...cookies);
  } else {
    // login with password
    const username = process.env.EKOPOST_USERNAME;
    if (!username) {
      throw new Error("add the ekopost username to a .env");
    }
    const password = process.env.EKOPOST_PASSWORD;
    if (!password) {
      throw new Error("add the ekopost password to a .env");
    }
    await page.focus("#Username");
    await page.keyboard.type(username);
    await page.focus("#Password");
    await page.keyboard.type(password);
    await Promise.all([
      page.click("button[type=submit]"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);
  }

  await page.goto("https://secure.ekopost.se/online/send");

  // upload
  await page.waitForSelector('input[type="file"]');
  // fs -> read the dir
  // INPUT:
  const dirNumber = "1";
  const dir = `invoices/${dirNumber}`;
  // const dir = "testinvoices/1";
  let filePaths: string[] = [];
  const absolutePath = path.resolve("./");
  fs.readdirSync(dir).forEach((file) => {
    filePaths.push(absolutePath + "/" + dir + "/" + file);
  });
  const files = await Promise.all(filePaths);
  const input = await page.$('input[type="file"]');
  input && input.uploadFile(...files);

  await page.waitForNavigation({
    waitUntil: "networkidle0",
    // if it takes MORE than 5 min -> timeout
    timeout: 1000 * 60 * 5,
  });

  // written in the docuement to read address from files
  await page.click('input[type="radio"]');

  // address -> next
  const button = await page.waitForSelector("#submitbutton");
  console.log(`button`);
  await Promise.all([
    button && button.click(),
    page.waitForNavigation({
      waitUntil: "networkidle0",
      // if it takes MORE than 10 min -> timeout
      timeout: 1000 * 60 * 10,
    }),
  ]);
  console.log(`navi`);
  // check -> next
  await page.click("#confirmation-envelopes > div > button");

  // delay 1 sec
  await new Promise((resolve) => setTimeout(resolve, 1000 * 1));

  // check -> confirmation
  await Promise.all([
    page.click(".swal2-buttonswrapper > button"),
    page.waitForNavigation({ waitUntil: "networkidle0" }),
  ]);

  console.log(`confirmation`);
  // we know know the id
  const urlRoutes = page.url().split("/");
  const campaignID = urlRoutes[urlRoutes.length - 1];

  // attach
  await Promise.all([
    page.click(`a[href="/online/send/setup/${campaignID}"]`),
    page.waitForNavigation({ waitUntil: "networkidle0" }),
  ]);

  // configure -> select label color
  await Promise.all([
    page.click("#Color"),
    page.waitForNavigation({ waitUntil: "networkidle0" }),
  ]);

  // configure -> focus campaign name input
  const nameOfCampaign = `2021-04-15 #${dirNumber}`;
  await page.focus("#Name");
  await page.keyboard.type(nameOfCampaign);

  // configure confirmation
  await Promise.all([
    // focus out
    page.$eval("#Name", (e) => (e as HTMLElement).blur()),
    page.waitForNavigation({ waitUntil: "networkidle0" }),
  ]);

  // confgure confiraimtion
  await Promise.all([
    page.click("#btnNext"),
    page.waitForNavigation({ waitUntil: "networkidle0" }),
  ]);

  const sendoutButton = await page.waitForSelector("#submitbutton");
  console.log(sendoutButton);
  // confirm
  //   await Promise.all([
  //     page.click("#submitbutton"),
  //     page.waitForNavigation({ waitUntil: "networkidle0" }),
  //   ]);

  // delay forever 2 sec
  // awaits for the fucntion resolve to be called
  await new Promise((resolve) => setTimeout(resolve, 1000 * 100000));

  await browser.close();
})();
