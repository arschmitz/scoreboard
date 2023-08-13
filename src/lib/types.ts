export interface State {
    displayTime: string;
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
    team: 'mites' | 'peewee' | 'middleSchool';
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
