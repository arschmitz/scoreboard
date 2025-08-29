<script lang="ts">
    import type { Media, Play, Player, State, Time, Teams } from '$lib/types';
    import type { Socket } from 'socket.io';
    import type { DefaultEventsMap } from 'socket.io/dist/typed-events';
    import Dialog from '$lib/dialog.svelte';
    import io from 'socket.io-client';
    import { home } from '$lib/teams';
    import { guest } from '$lib/away';
    import { port } from '$lib/env';
    import { onMount } from 'svelte';
    import { STATE, TIME } from '$lib/constants';

    export let connectDialog = false;

    let time: Time = JSON.parse(JSON.stringify(TIME));;
    let motivation: string;
    let playerPicker: boolean;
    let playerResolver: (value: unknown) => void;
    let currentTeam: Player[];
    let play: Play;
    let colorPicker;
    let backgroundColorPicker;
    let menuOpen = false;
    let enteringGuestPlay = false;
    let enteringHomePlay = false;

    const teams: Record<'home' | 'guest', Teams> = Object.freeze({
        home,
        guest,
    });

    let socket: Socket<DefaultEventsMap>;

    let state: State = JSON.parse(JSON.stringify(STATE));

    $: update(state);

    function update(..._: unknown[]) {
        if (!socket) {
            return;
        }
        socket.emit('sync', state)
    }

    function updateColor() {
        socket.emit('color', colorPicker.value);
    }

    function updateBackgroundColor() {
        socket.emit('backgroundColor', backgroundColorPicker.value);
    }

    async function openPicker() {
        playerPicker = true;
        return new Promise((resolve) => playerResolver = resolve);
    }

    function closePicker(_player: Player) {
        playerPicker = false;
        playerResolver(_player);
    }

    async function createPlay(type: string, _team: 'home' | 'guest') {
        const team = _team === 'home' ? 'Westbrook' : state.guestName
        let player;
        currentTeam = teams[_team][state.team].sort(function(a: Player, b: Player) {
            if (a.number < b.number) return -1;
            if (a.number > b.number) return 1;
            return 0;
        });

        switch(type) {
            case 'touchdown': 
                player = await openPicker();
                state[_team === 'home' ? 'home' : 'guest'] += 6;

                play = {
                    ...player,
                    type: 'touchdown',
                    team
                }

                break;
            case 'conversion': 
                player = await openPicker();
                state[_team === 'home' ? 'home' : 'guest'] += 2;
                state.posession = _team !== 'home' ? 'home' : 'guest';
                play = {
                    ...player,
                    type: '2 point conversion',
                    team 
                }

                break;
            case 'safety': 
                player = await openPicker();
                state[_team !== 'home' ? 'home' : 'guest'] += 2;

                play = {
                    ...player,
                    type: 'safety',
                    team 
                }

                break;
            case 'fumble':
                player = await openPicker();
                play = {
                    ...player,
                    type: 'fumble recovery',
                    team 
                }

                break;
            case 'block':
                player = await openPicker();
                play = {
                    ...player,
                    type: 'block',
                    team 
                }

                break;
            case 'run':
                player = await openPicker();
                play = {
                    ...player,
                    type: 'run',
                    team 
                }

                break;
            case 'catch':
                player = await openPicker();
                play = {
                    ...player,
                    type: 'catch',
                    team 
                }

                break;
            case 'pass':
                player = await openPicker();
                play = {
                    ...player,
                    type: 'pass',
                    team 
                }

                break;
            case 'interception':
                player = await openPicker();
                state.posession = team === 'home' ? 'home' : 'guest';
                play = {
                    ...player,
                    type: 'interception',
                    team 
                }

                break;
            case 'tackle':
                player = await openPicker();
                play = {
                    ...player,
                    type: 'tackle',
                    team 
                }

                break;
            case 'sack':
                player = await openPicker();
                play = {
                    ...player,
                    type: 'sack',
                    team 
                }

                break;
        }
        if (player) {
            socket.emit('play', play)
        }
    }

    function selectValue(event: MouseEvent) {
        const target = event.target as HTMLInputElement;

        target.select()
    }

    function newGame() {
        state = STATE;
        socket.emit('set_minutes', '08');
        socket.emit('set_seconds', '00');
    }

    let media: Media[] = [];

    onMount(async () => {
        socket = io(`${window.location.hostname}:${port}`);

        socket.once('sync', (_state) => {
            if (!_state) {
                return;
            }

            state = _state;
        });

        socket.on('time', (_time) => {
            time = _time;
        });

        try {
            const data = await fetch('/media/list');

            if (data.ok) {
                media = await data.json();
            }
            
        } catch {
            console.error('media');
        }
    });
  </script>
  
  <style>
    .menu-wrap {
        display: flex;
        flex-direction: column;
        justify-content:flex-start;
        align-items:flex-start;
    }
    .plays {
        display: flex;
        flex-direction: row;
    }

    .team {
        display: flex;
        flex-direction: column;
    }

    .offense-plays,
    .defense-plays {
        display: flex;
        flex-direction: column;
    }

    h2 {
        text-align: center;
    }

    .clock {
        width: 100%;
    }
    
    :global(.clock .clock) {
        font-size: 4rem;
    }

    select {
        width: 100%;
    }

    main {
        align-items: center;
        background-color: rgb(2, 2, 50);
        color: white;
        display: flex;
        flex-direction: column;
        font-weight: 900;
        padding: 1rem;

    }

    .down, .team {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        border: 4px solid #ccc;
        width: 100%;
        border-radius: 1rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
    }

    .plays {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
    }

    h3 {
        text-align: center;
        padding: 0;
        margin: 0;
    }

    input {
        background: none;
        border: none;
        color: white;
        font-size: 1rem;
        margin: 0;
        padding: 0;
        width: 7rem;
    }

    input, select {
        font-size: 1.5rem;
        font-weight: 700;
    }

    .player {
        width: 100%;
        height: 100%;
        text-align: left;
    }
    
    li {
        list-style: none;
        width: 90%;
        margin-left: 0;
        padding-left: 0;
    }

    ul {
        list-style: none;
        margin-left: 0;
        padding-left: 0;
    }

    .active {
        background-color: black;
        color: white;
    }

    button {
        background-color: navy;
        border: 2px solid white;
        margin: 0.25rem;
        color: white;
        font-weight: 900;
        font-size: 1.5rem;
        padding: 0.25rem;
        min-width: 3rem;
    }

    .timer-button {
        width: 47%;
        font-size: 6vw;
        padding: 1rem;
    }

    .right {
        min-width:60%;
    }

    .clock :global(.clock) {
        display: none;
    }

    .display-clock input{
        font-size: 25vw;
        width: 40vw;
    }

    .display-clock {
        font-size: 10vw;
        color: white;
    }

    .minutes {
        text-align: right;
    }

    .seconds {
        text-align: left;
    }

    .start {
        background-color: green;
    }

    .stop {
        background-color: red;
    }

    .score {
        text-align: center;
        font-size: 8vw;
        width: 100%;
    }

    h2 {
        margin: 0;
        text-align: center;
    }

    h2 input {
        text-align: center;
    }

    .team button {
        margin: 0;
    }

    .menu {
        border: none;
        background: none;
        color: white;
        position: absolute;
        right: 0.5rem;
        font-size: 3rem;
    }

    .button-row {
        display: flex;
        width: 100%;
    }

    .button-row button {
        flex: 1;
    }

    iframe {
        display: inline-block;
    }

    .tol {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 3rem;
    }
    .tol input {
        width: 1em;
        margin-left: 0.5rem;
    }
  </style>
  <main>
    <button class="menu" on:click={() => menuOpen = true }>☰</button>
    <div class="right">
        <div class="clock">
            <div class="display-clock">
                <input
                    on:click={selectValue}
                    on:change={() => { socket.emit('set_minutes', time.minutes) }}
                    name="time-minutes"
                    class="minutes"
                    disabled={time.running}
                    inputmode="numeric"
                    bind:value={time.minutes}
                />
                :    
                <input
                    on:change={() => { socket.emit('set_seconds', time.seconds) }}
                    on:click={selectValue}
                    name="time-seconds"
                    class="seconds"
                    disabled={time.running}
                    inputmode="numeric"
                    bind:value={time.seconds}
                />
            </div>
            <div class="clock">{time.display}</div>
            <div>
                <button
                    class="timer-button start"
                    on:click={() => { socket.emit('start') }}
                >
                    Start Clock
                </button>
                <button
                    class="timer-button stop"
                    on:click={() => { socket.emit('stop') }}
                >
                    Stop Clock
                </button>
            </div>
        </div>
        
        <div class="down" >
            <h3>Down</h3>
            <div>
                <button class:active={state.down === '1st'} on:click={() => state.down = '1st'}>1st</button>
                <button class:active={state.down === '2nd'} on:click={() => state.down = '2nd'}>2nd</button>
                <button class:active={state.down === '3rd'} on:click={() => state.down = '3rd'}>3rd</button>
                <button class:active={state.down === '4th'} on:click={() => state.down = '4th'}>4th</button>
            </div>
            <div class="to-go">
                <label for="to-go">To Go: </label>
                <input on:click={selectValue} id="to-go" name="to-go" type="number" bind:value={state.toGo}/>
                <label for="to-go">Ball on: </label>
                <input on:click={selectValue} id="ball-on" name="ball-on" type="number" bind:value={state.ballOn}/>
            </div>
        </div>
    </div>
    
    <div class="plays">
        <div class="home team">
            <h2>Westbrook</h2>
            <input on:click={selectValue} class="score" type="tel" value={state.home} on:change={({target}) => state.home = target.value}>
            
            <button on:click={() => state.posession = "home"}>Take Ball</button>
            
            <div class="tol">
                <label for="hTol">Timeouts</label>
                <input id="hTol" type="tel" max="3" min="0" bind:value={state.hTol}>
            </div>
            <button on:click={() => enteringHomePlay = true}>Enter Play</button>
        </div>
        <div class="guest team">
            <h2><input bind:value={state.guestName} /></h2>
            <input on:click={selectValue} class="score" type="tel" value={state.guest} on:change={({target}) => state.guest = target.value}>
            
            <button on:click={() => state.posession = "guest"}>Take Ball</button>
            
            <div class="tol">
                <label for="gTol">Timeouts</label>
                <input id="gTol" type="tel" max="3" min="0" bind:value={state.gTol}>
            </div>

            <button on:click={() => enteringGuestPlay = true}>Enter Play</button>
        </div>
    </div>

    Motivational Video
    <br>
    <select bind:value={motivation}>
        {#each media as video}
            <option value={video.file}>{video.artist} - {video.song}</option>
        {:else}
            <option>Loading...</option>
        {/each}
    </select>
    <div class="button-row">
        <button on:click={() => socket.emit('video', motivation)}>Play</button>
        <button on:click={() => socket.emit('video', null)}>Stop</button>
    </div>
    
  </main>
  <div>
</div>

<Dialog bind:open={enteringHomePlay}>
    <div class="home team">
        {#if state.posession === 'home'}
            <button on:click={() => createPlay('touchdown', 'home')}>Touchdown</button>
            <button on:click={() => createPlay('conversion', 'home')}>2 Point Conversion</button>
    
            <div class="offense-plays">
                <button on:click={() => createPlay('block', 'home')}>Block</button>
                <button on:click={() => createPlay('run', 'home')}>Run</button>
                <button on:click={() => createPlay('fumble', 'home')}>Fumble Recovery</button>
                <button on:click={() => createPlay('catch', 'home')}>Catch</button>
                <button on:click={() => createPlay('pass', 'home')}>Pass</button>
            </div>
        {:else}
            <div class="defense-plays">
                <button on:click={() => createPlay('safety', 'home')}>Safety</button>
                <button on:click={() => createPlay('tackle', 'home')}>Tackle</button>
                <button on:click={() => createPlay('sack', 'home')}>Sack</button>
                <button on:click={() => createPlay('fumble', 'home')}>Fumble Recovery</button>
                <button on:click={() => createPlay('interception', 'home')}>Interception</button>
            </div>
        {/if} 
    </div>
</Dialog>

<Dialog bind:open={enteringGuestPlay}>
    <div class="guest team">
        {#if state.posession === 'guest'}
            <button on:click={() => createPlay('touchdown', 'guest')}>Touchdown</button>
            <button on:click={() => createPlay('conversion', 'guest')}>2 Point Conversion</button>
            <div class="offense-plays">
                <button on:click={() => createPlay('block', 'guest')}>Block</button>
                <button on:click={() => createPlay('run', 'guest')}>Run</button>
                <button on:click={() => createPlay('fumble', 'guest')}>Fumble Recovery</button>
                <button on:click={() => createPlay('catch', 'guest')}>Catch</button>
                <button on:click={() => createPlay('pass', 'home')}>Pass</button>
            </div>
        {:else}
            <div class="defense-plays">
                <button on:click={() => state.posession = "guest"}>Take Possesion</button>
                <button on:click={() => createPlay('safety', 'guest')}>Safety</button>
                <button on:click={() => createPlay('tackle', 'guest')}>Tackle</button>
                <button on:click={() => createPlay('sack', 'guest')}>Sack</button>
                <button on:click={() => createPlay('fumble', 'guest')}>Fumble Recovery</button>
                <button on:click={() => createPlay('interception', 'guest')}>Interception</button>
            </div>
        {/if}
    </div>
</Dialog>

<Dialog bind:open={menuOpen}>
    <div class="menu-wrap">
        <label for="quarter">Quarter
        <select id="quarter" bind:value={state.quarter}>
            {#each [1, 2, 3, 4] as quarter}
                <option value={quarter} selected={state.quarter === quarter}>{quarter}</option>
            {/each}
        </select></label>
        <label for="select-team">Select Team
        <select id="team-select" bind:value={state.team}>
            <option value='mites'>Mites</option>
            <option value='peewee'>Pee Wee</option>
            <option value='middleSchool'>Middle School</option>
        </select></label>

        <div>
            <button on:click={() => state.smoke = true}>Smoke On</button>
            <button on:click={() => state.smoke = false}>Smoke Off</button>
        </div>
        <div>
            <button on:click={() => socket.emit('air_cannon', true)}>Air Cannon</button>
            <button on:click={() => socket.emit('rocket', true)}>Launch Rocket</button>
        </div>

        <label for="color">Text Color
        <input bind:this={colorPicker} type="color" id="color" on:change={updateColor}/></label>

        <label for="backgroundColor">Background Color
        <input bind:this={backgroundColorPicker} type="color" id="backgroundColor" on:change={updateBackgroundColor}/></label>
        <div><h2>Scan to connect remote</h2></div>
        <div>
            <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/3o11m032vjqdrOzpmOHtou?utm_source=generator&theme=0" width="49%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
            <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/6DlZrCJxIbHbtHMkdZ1cMG?utm_source=generator&theme=0" width="49%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
             <iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/6Bv7z3SjGOdSNwSQ1njMGk?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </div>
        <button on:click={() => newGame()}>Start New Game</button>
    </div>
</Dialog>

<Dialog bind:open={playerPicker}>
    <ul>
        {#each currentTeam || [] as _player}
            <li><button class="player" on:click={() => closePicker(_player)}>#{_player.number} {_player.name}</button></li>
        {/each}
        <li><button class="player" on:click={() => closePicker(null)}>Unknown</button></li>
    </ul>
    <button on:click={() => { playerPicker = false; playerResolver(null); } }>Cancel</button>
</Dialog>

<Dialog bind:open={connectDialog}>
    <h1>Connect Remote</h1>
    <p>Scan the QR code to connect your phone or tablet as a remote</p>
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://{state.ip}:4173/remote"/>
</Dialog>
  