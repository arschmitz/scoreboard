import type { Time } from '$lib/types';
import { TIME } from '$lib//constants';

let seconds: number = 0;
let minutes: number = 8;
let time = 1000 * 60 * 8;
let lastTime: number;
let timerPointer: NodeJS.Timer;  export let displayTime: string;
let io;

const state: Time = JSON.parse(JSON.stringify(TIME));

export function setupClock(_io) {
    io = _io;
}

export function bindClock(socket) {
    io.emit('time', state);

    socket.on('start', () => {
        if (timerPointer) {
          return;
        }
        lastTime = Date.now();
        timer();
        timerPointer = setInterval(timer, 100);
        state.running = true;
        io.emit('time', state);
    });
    socket.on('stop', stop);
    socket.on('set_minutes',(_minutes) => {
        minutes = parseInt(_minutes, 10);
        updateTime();
        parseTime();
        io.emit('time', state);
    });
    socket.on('set_seconds',(_seconds) => {
        seconds = parseInt(_seconds, 10);
        updateTime();
        parseTime();
        io.emit('time', state);
    })
}

function stop() {
    clearInterval(timerPointer);
    timerPointer = null;
    state.running = false;
    io.emit('time', state);
}

function updateTime() {
    time = (minutes * 60 + seconds) * 1000;
}

function parseTime() {
    // does the same job as parseInt truncates the float
    minutes = ((time / 1000) / 60) | 0;
    seconds = ((time / 1000) % 60) | 0;
    state.minutes = minutes < 10 ? "0" + minutes : `${minutes}`;
    state.seconds = seconds < 10 ? "0" + seconds : `${seconds}`;
    state.display = `${state.minutes}:${state.seconds}`;
    io.emit('time', state);
}

function timer() {
    const newTime = Date.now();
    let tempTime = time;

    tempTime -= ((newTime - lastTime) | 0);
    lastTime = newTime;

    if (tempTime <= 0) {
      tempTime = 0;
      stop();
    }

    time = tempTime;
    parseTime();
}