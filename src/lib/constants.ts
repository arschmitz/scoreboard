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
    homeTeam: null,
    awayTeam: null,
    ip: null,
    trackFieldPosition: true,
    trackDowns: true,
    deviceId:  null,
    paused: true,
    currentTrack: null,
    volume: 0.5,
    tracks: [],
    accessToken: null,
    refreshToken: null,
    expiresAt: 0,
}

export const TIME: Time = {
    minutes: '08',
    seconds: '00',
    display: '08:00',
    running: false
}