import type { State, Time } from '$lib/types';
import path from 'path';
import gpio from 'rpi-gpio';
import { MEDIA_PATH } from '$env/static/private';
import { port } from '$lib/env';
import { Server } from 'socket.io';
import { readdirSync, readFileSync } from 'fs';
import { setupClock, bindClock } from '$lib/clock';
import { STATE } from '$lib/constants';
import os from 'node:os';
let ip = os.networkInterfaces().wlan0[0].address;

console.log({ ip })
console.log(MEDIA_PATH);

let state: State = JSON.parse(JSON.stringify(STATE));

state.ip = ip;

gpio.setup(7, gpio.DIR_OUT);
gpio.setup(11, gpio.DIR_OUT);
gpio.setup(13, gpio.DIR_OUT);
gpio.setup(15, gpio.DIR_OUT);

const PINS = {
    SMOKE_ON: 7,
    SOMKE_OFF: 11,
    ROCKET: 15,
    AIR_CANNON: 13,
}

function firePin(action, time) {
    gpio.write(PINS[action], true);

    setTimeout(() => {
        gpio.write(PINS[action], false);
    }, time);
}

try {
    const io = new Server({
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
        }
    });

    setupClock(io);

    io.on('connection', (socket) => {
        bindClock(socket);
        socket.on('sync', (_state: State) => {
            console.log('sync');

            if (state.smoke !== _state.smoke) {
                firePin(_state.smoke ? 'SMOKE_ON' : 'SOMKE_OFF', 5000);
            }

            state = _state;

            io.emit('sync', _state);
        });
        socket.on('play', (play) => {
            io.emit('play', play)
        });
        socket.on('video', (video) => {
            io.emit('video', video)
        });
        socket.on('rocket', () => {
            firePin('ROCKET', 500);
        });
        socket.on('air_cannon', () => {
            firePin('AIR_CANNON', 100);
        });
        socket.on('color', (color) => {
            io.emit('color', color)
        });
        socket.on('backgroundColor', (color) => {
            io.emit('backgroundColor', color)
        });

        setInterval(() => {
            io.emit('sync', state);
        }, 2000);

        io.emit('sync', state);

        console.log('connection');
    });
    io.listen(port)

} catch (error) {

    console.error(error);
}

function getMediaList() {
    let files = readdirSync(path.join(MEDIA_PATH, 'scoreboard-media'));

    files = files
        .filter((item) => !/^\._/.test(item))
        .map((file) => {
            const [artist, song] = file.split('.')[0].split('-');
            return {
                artist,
                file,
                song
            }
        });

    return new Response(JSON.stringify(files));
}

function getMedia(event) {
    const file = decodeURIComponent(event.url.pathname.split('/')[2]);
    const filePath = path.join(MEDIA_PATH, 'scoreboard-media', file);

    const options = { "Content-Type": "application/octet-stream", status: 200 };
    const fileContents = readFileSync(filePath);
    return new Response(fileContents, options);
}

export async function handle({ event, resolve }) {
    if (event.url.pathname.startsWith('/media/list')) {
        return getMediaList();
    }

    if (event.url.pathname.startsWith('/media')) {
        return getMedia(event);
    }
   
    return await resolve(event);
}
