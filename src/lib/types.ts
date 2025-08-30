export interface State {
    posession: 'guest' | 'home';
    ballOn: number;
    down: string;
    home: number;
    guest: number;
    toGo: string;
    quarter: number;
    hTol: number;
    gTol: number;
    guestName: string;
    smoke: boolean;
    team: 'mites' | 'peewee' | 'middleSchool';
    ip: string;
    trackDowns: boolean;
    trackFieldPosition: boolean;
}

export interface Time {
    display: string;
    minutes: string;
    running: boolean;
    seconds: string;
}

export interface Play {
    team: string;
    name: number;
    number: number;
    type: string;
}

export interface Player {
    name: string;
    number: number;
    photo?: string;
    video?: string;
    song?: string;
}

export interface Teams {
    mites: Player[];
    peewee: Player[];
    middleSchool: Player[];
}

export interface Media {
    artist: string;
    file: string;
    song: string;
}
