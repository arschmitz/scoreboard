<script lang="ts">
    import type { State, Play } from '$lib/types';
    import io from 'socket.io-client';
    import { port } from '$lib/env';
    import { STATE } from '$lib/constants';
    import { onMount, tick } from 'svelte';

    let showPass = false;
    let showRun = false;
    let video: string;
    let playing;
    let currentPlay;
    let showGif;
    let showFumble;
    let showInterception;
    let videoElement: HTMLVideoElement;
    let state = JSON.parse(JSON.stringify(STATE));
  
    onMount(() => {
        const socket = io(`${window.location.hostname}:${port}`);
    
        socket.on('sync', (_state: State) => {
            state = _state
        });

        socket.on('play', (play: Play) => {
            console.log('plau')
            if (['pass', 'catch', 'interception'].includes(play.type)) {
                showPass = true;
                setTimeout(() => showPass = false, 4_000);
            }

            if (['run'].includes(play.type)) {
                showRun = true;
                setTimeout(() => showRun = false, 4_000);
            }

            if (['fumble recovery'].includes(play.type)) {
                showFumble = true;
                setTimeout(() => showFumble = false, 4_000);
            }

            if (['interception'].includes(play.type)) {
                showInterception = true;
                setTimeout(() => showInterception = false, 4_000);
            }

            currentPlay = play;

            setTimeout(() => currentPlay = null, 15_000);
            setTimeout(() => showGif = false, 5_000);
        });

        socket.on('video', async (_video) => {
            playing = false;
            video = null;

            await tick();

            video = _video;

            await tick();

            videoElement.play();
            playing = true;
        });
    });
</script>
  
<style>
    .scoreboard {
        background-color: rgb(2, 2, 50);
        color: #fff;
        padding: 3vh;
        width: 100vw;
        height: calc((100vw / 16) * 9);
        overflow: hidden;
        position: relative;
    }
    
    .board-container {
        text-align: center;
        display: flex;
        justify-content: space-between;

    }

    .home, .guest {
        min-width: 25%;
    }

    .center {
        flex-grow: 1;
    }

    .clock {
        margin-top: 15vh;
        font-size: 28vh;
        font-weight: 900;
        transition: all;
        transition-duration: 1s;

        border: 1vh solid #fff;
        border-radius: 5vh;
    }

    .team-name {
        font-size: 7vh;
        font-weight: 900;
        text-transform: uppercase;
    }

    .score {
        font-size: 33vh;
        font-weight: 900;
    }

    .footer {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        font-size: 11rem;
        text-align: center;
        font-weight: 900;
        text-transform: uppercase;
        position: absolute;
        bottom: 0;
    }

    .hTol, .gTol {
        text-align: center;
        font-size: 5vh;
        min-width: 25%;
    }

    .posession {
        font-size: 15vh;
        font-family: 'Noto Color Emoji', sans-serif;
    }

    .quarter {
        font-size: 11vh;
        font-weight: 900;
        text-transform: uppercase;
    }

    .pass {
        position: absolute;
        left: 110%;
        bottom: 0;
    }

    .pass > img {
        width: 6rem;
    }

    .animate-pass {
        left: -80rem;
        bottom: 80%;
        transition: all;
        transition-duration: 2.5s;
    }

    .animate-pass img {
        transition: all;
        transition-duration: 2s;
        width: 70rem;
    }

    .run {
        position: absolute;
        left: 110%;
        bottom: 15rem;
    }

    .run > img {
        width: 30rem;
        transform: scaleX(-1);
    }

    .animate-run {
        left: -80rem;
        transition: all;
        transition-duration: 2.5s;
    }

    .animate-run img {
        transition: all;
        transition-duration: 2s;
        width: 30rem;
    }

    .fumble {
        position: absolute;
        left: 0;
        bottom: 0;
    }

    .fumble > img {
        width: 100vw;
        height: calc(100vh - 16rem);
    }

    .mini .clock {
        font-size: 7rem;
        margin-top: 0rem;
    }

    .play-clock .clock {
        font-size: 12rem;
        margin-top: 0rem;
    }

    .play-clock .quarter {
        display: none;
    }

    .mini .score,
    .mini .footer,
    .mini .quarter,
    .mini .posession {
        display: none;
    }

    video {
        width: 100vw;
        height: 100vh;
        margin-top: -8rem;
        opacity: 0;
        transition: all;
        transition-duration: 4s;
    }

    .video {
        top: 16rem;
        margin-left: -3rem;
        bottom: 0;
        width: 100vw;
        left: 0;
        overflow: hidden;
    }

    video.playing {
        opacity: 1;
    }

    .player-number {
        font-size: 15rem;
        font-family: 'Alfa Slab One', cursive;
    }



    .player {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10rem;
        font-weight: 900;
        text-transform: uppercase;
        text-transform: uppercase;
        background-image: linear-gradient(
            -225deg,
            #231557 0%,
            #44107a 29%,
            #ff1361 67%,
            #fff800 100%
        );
        background-size: auto auto;
        background-clip: border-box;
        background-size: 200% auto;
        color: #fff;
        background-clip: text;
        text-fill-color: transparent;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: textclip 2s linear infinite;
        display: inline-block;
            font-size: 190px;
            }

            :root {
        --color-primary: red;
        --color-secondary: #f49b90;
        --color-tertiary: #f28b7d;
        --color-quaternary: #f07a6a;
        --color-quinary: #ee6352;

}
@keyframes textclip {
  to {
    background-position: 200% center;
  }
}
    .play {
        font-size: 13rem;
        font-family: Arial, Helvetica, sans-serif;
        text-shadow: 3px 3px 0 var(--color-secondary), 6px 6px 0 var(--color-tertiary),
            9px 9px var(--color-quaternary), 12px 12px 0 var(--color-quinary);
        font-weight: 900;
        text-transform: uppercase;
        text-align: center;
        margin: 0;
        color: var(--color-primary);
        animation: shadows 1.2s ease-in infinite, move 1.2s ease-in infinite;
        letter-spacing: 0.4rem;
    }

@keyframes shadows {
  0% {
    text-shadow: none;
  }
  10% {
    text-shadow: 3px 3px 0 var(--color-secondary);
  }
  20% {
    text-shadow: 3px 3px 0 var(--color-secondary),
      6px 6px 0 var(--color-tertiary);
  }
  30% {
    text-shadow: 3px 3px 0 var(--color-secondary),
      6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary);
  }
  40% {
    text-shadow: 3px 3px 0 var(--color-secondary),
      6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary),
      12px 12px 0 var(--color-quinary);
  }
  50% {
    text-shadow: 3px 3px 0 var(--color-secondary),
      6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary),
      12px 12px 0 var(--color-quinary);
  }
  60% {
    text-shadow: 3px 3px 0 var(--color-secondary),
      6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary),
      12px 12px 0 var(--color-quinary);
  }
  70% {
    text-shadow: 3px 3px 0 var(--color-secondary),
      6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary);
  }
  80% {
    text-shadow: 3px 3px 0 var(--color-secondary),
      6px 6px 0 var(--color-tertiary);
  }
  90% {
    text-shadow: 3px 3px 0 var(--color-secondary);
  }
  100% {
    text-shadow: none;
  }
}

@keyframes move {
  0% {
    transform: translate(0px, 0px);
  }
  40% {
    transform: translate(-12px, -12px);
  }
  50% {
    transform: translate(-12px, -12px);
  }
  60% {
    transform: translate(-12px, -12px);
  }
  100% {
    transform: translate(0px, 0px);
  }
}

.play-gif {
    width: 100%;
}

.action {
    display: flex;
    align-items: center;
    justify-items: center;
    margin-top: 5rem;
}
</style>
  
<div class="scoreboard" class:mini={video}>
    <div class="board-container">
        <div class="home">
            <div class="team-name">Westbrook</div>
            <div class="score">{state.home}</div>
            <div class="posession">{#if state.posession === 'home'}🏈{/if}</div>
        </div>
        <div class="center" class:play-clock={currentPlay}>
            <div class="clock">{state.displayTime}</div>
            <div class="quarter">Quarter {state.quarter}</div>
            {#if currentPlay}
                <div class="action">
                    <div class="currentPlay">
                        <div class="play">
                            {currentPlay.type}
                        </div>
                        <img src="spinning-football.gif" class="spinning-football">
                        <div class="player-number">
                            #{currentPlay.number}
                        </div>
                        <div class="player">
                            {currentPlay.name}
                        </div>
                    </div>
                </div>
            {/if}
        </div>
        <div class="guest">
            <div class="team-name">{state.guestName}</div>
            <div class="score">{state.guest}</div>
            <div class="posession">{#if state.posession === 'guest'}🏈{/if}</div>
        </div>
    </div>
    <div class="footer">
        <div class="hTol">Time outs: {state.hTol}</div>
        <div>{state.down} & {state.toGo} on the {state.ballOn}</div>
        <div class="gTol">Time outs: {state.gTol}</div>
    </div>
    <div class="pass" class:animate-pass={showPass}>
        <img src="football-fire.gif" alt="football"/>
    </div>
    <div class="run" class:animate-run={showRun}>
        <img src="sonic-run.gif" alt="football"/>
    </div>
    {#if showFumble}
        <div class="fumble">
            <img src="fumble-recovery.gif" alt="football"/>
        </div>
    {/if}
    {#if showInterception}
        <div class="fumble">
            <img src="interception.gif" alt="football"/>
        </div>
    {/if}
    {#if video}
        <div class="video">
            <video
                class:playing={playing}
                autoplay
                src={`/media/${video}`}
                bind:this={videoElement}
                on:ended={() => video = null}
                on:play={() => playing = true}>
            </video>
        </div>
    {/if}
</div>
