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
    const coookievalue =
      "9DDA6206B18D5773C19880CE31BC4F7D64F2A53A7C2394D1D80AA4397EDFA5C714299A17486585A755FE9C54CDA4ED91AF7444F1A4D2B0CEC31A3C0D03208671480168B6BBB09BD3109EEC9A1B9E720C7B5AB39F6B36F828ED4E2C68E6B506346C469D401288D36F6543897E20069838172F3BB45B1B8D564ADEC83FFFB6A0D8384A63F1F9ED288AE470FE22D490A1B458887C26BBA79B67B9967BE6CDCFD67A05E60A44D725EA2A9883F5DDB34495962C5E8C99D9F330AB5DF67D1F4D16C7165F3899DA5FCC8038B170FBD170AAFCDA";
    const cookiename = "NOINK.SECURE";
    const cookies = [
      {
        name: cookiename,
        value: coookievalue,
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
