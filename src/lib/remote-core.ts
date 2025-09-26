import type { Media, Play, Player, State, Time, Team, Teams } from '$lib/types';
import type { Socket } from 'socket.io';
import type { DefaultEventsMap } from 'socket.io/dist/typed-events';
import io from 'socket.io-client';
import { home } from '$lib/teams';
import { guest } from '$lib/away';
import { port } from '$lib/env';
import { STATE, TIME } from '$lib/constants';


