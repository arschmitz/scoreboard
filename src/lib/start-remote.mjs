#!/usr/bin/env node

import waitOn from "wait-on";
import puppeteer from "puppeteer-core";
import { promisify } from "node:util";
import { spawn, exec as execCb } from 'node:child_process';
import { findChrome } from 'find-chrome-bin';

const chromeInfo = await findChrome()
console.log(chromeInfo)

const exec = promisify(execCb);

async function startServer() {
  console.log("Starting Server")
  const { promise, resolve, reject } = Promise.withResolvers();

  const ls = spawn('npm', ['run', 'preview', '--host', '--port=4173']);
  console.log("Spawned process")


  ls.stdout.on('data', (data) => {
    try {
      console.log(data.toString())
      if (/Network/.test(data.toString())) {
        resolve();
      }
    } catch (error) {
      console.log("resolve bad")
      console.log(error)
    }
  });

  ls.stderr.on('data', (data) => {
    // console.log("ho shit", data.toString());
  });

  ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  try {
    await promise;
    console.log("Server Running");
  } catch {
    console.log("all bad")
  }

  return ls;
}

async function startBrowser() {
  console.log("launching browser");
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see the browser window
    args: [
      '--start-fullscreen', // Opens in full-screen
      '--kiosk',           // Enables Chrome's kiosk mode
      '--app=http://localhost:4173/remote' // to launch a specific URL as an app
    ],
    executablePath: chromeInfo.executablePath
  });
  console.log("browser running");

  const page = await browser.newPage();
  // await page.goto('https://www.example.com'); // Navigate to your desired page

  // Keep the browser open for interaction or close it after a certain time
  // await new Promise(resolve => setTimeout(resolve, 60000)); // Keep open for 60 seconds
  // await browser.close();
}

async function startSpotify() {
  try {
    await exec('~/spotifyd --no-daemon &');
  } catch {
    console.log("Failed ot start spotify");
  }
}

async function killProcess() {
  try {
    await exec("fuser -k 7005/tcp");
  } catch {
    console.log('Failed to kill process');
  }
}

async function start() {
  await killProcess();
  await startSpotify();

  const webServer = await startServer();
  await startBrowser();
  console.log("running open chrome")
}

start();
