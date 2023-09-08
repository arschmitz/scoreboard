import type { State } from '$lib/types';
import path from 'path';
import gpio from 'rpi-gpio';
import { MEDIA_PATH } from '$env/static/private';
import { port } from '$lib/env';
import { Server } from 'socket.io';
import { readdirSync, readFileSync } from 'fs';

console.log(MEDIA_PATH);

let state: State;

gpio.setup(7, gpio.DIR_OUT);

try {
    const io = new Server({
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
        }
    });

    io.on('connection', (socket) => {
        socket.on('sync', (_state: State) => {
            console.log('sync')
            state = _state;

            gpio.write(7, state.smoke, function(err) {
                if (err) throw err;
                console.log('Written to pin');
            });

            io.emit('sync', _state);
        });
        socket.on('play', (play) => {
            io.emit('play', play)
        });
        socket.on('video', (video) => {
            io.emit('video', video)
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
