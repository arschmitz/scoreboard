#!/usr/bin/env node

import waitOn from "wait-on";
import { promisify } from "node:util";
import { spawn, exec as execCb } from 'node:child_process';
import { findChrome } from 'find-chrome-bin';

const chromeInfo = await findChrome()
console.log(chromeInfo)

const exec = promisify(execCb);

async function startBrowser() {
  console.log("launching browser");

  console.log("Starting Server")
  const { promise, resolve, reject } = Promise.withResolvers();

  const ls = spawn(chromeInfo.executablePath, ['--kiosk', '--new-window', '--user-data-dir=/home/scoreboard/display', '--start-maximized', '--app=http://output.jsbin.com/sisesoq']);
  console.log("Spawned process")


  ls.stdout.on('data', (data) => {
    console.log(data.toString())
  });

  ls.stderr.on('data', (data) => {
    // console.log("ho shit", data.toString());
  });

  ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  return ls;
}

async function startSpotify() {
  try {
    await exec('~/spotifyd --no-daemon &');
  } catch {
    console.log("Failed ot start spotify");
  }
}

async function start() {
  await startBrowser();
  // await startSpotify();

  await waitOn({ resources: ['http://scoreboard.local:4173'] });
  console.log("Host available")
  const ls = spawn(chromeInfo.executablePath, ['--same-tab','--kiosk',, '--user-data-dir=/home/scoreboard/display', '--app=http://scoreboard.local:4173']);
  console.log("running open chrome")
}

start();
