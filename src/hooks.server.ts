import type { State } from '$lib/types';
import { port } from '$lib/env';
import { Server } from 'socket.io';
import { readdirSync } from 'fs';

let state: State;

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

export async function handle({ event, resolve }) {
    if (event.url.pathname.startsWith('/get-media')) {
        let files = readdirSync('./static/media');

        files.shift();

        files = files.map((file) => {
            const [artist, song] = file.split('.')[0].split('-');
            return {
                artist,
                file,
                song
            }
        })

        return new Response(JSON.stringify(files));
    }
   
    return await resolve(event);
}
