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

  const ls = spawn(chromeInfo.executablePath, ['--kiosk', '--new-window', '--start-maximized', '--app=http://scoreboard.local:4173']);
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

async function startSpotify() {
  try {
    await exec('~/spotifyd --no-daemon &');
  } catch {
    console.log("Failed ot start spotify");
  }
}

async function start() {
  await startSpotify();
  await waitOn({ resources: ['http://scoreboard.local:4173'] });
  await startBrowser();
  console.log("running open chrome")
}

start();
