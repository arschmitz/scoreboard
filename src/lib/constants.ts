import type { State, Time } from "$lib/types";

export const STATE: State = {
    posession: 'guest',
    guestName: 'Guest',
    home: 0,
    guest: 0,
    ballOn: 40,
    down: '1st',
    toGo: '10',
    quarter: 1,
    hTol: 3,
    gTol: 3,
    smoke: false,
    team: 'mites',
    ip: null,
    trackFieldPosition: true,
    trackDowns: true
}

export const TIME: Time = {
    minutes: '08',
    seconds: '00',
    display: '08:00',
    running: false
}