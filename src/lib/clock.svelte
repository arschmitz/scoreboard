<script lang="ts">
  import { onDestroy } from "svelte";

  export let displayTime: string;
  export let displaySeconds: string = '00';
  export let displayMinutes: string = '08';
  export let running = false;
  
  let seconds: number = 0;
  let minutes: number = 8;
  let time = 1000 * 60 * 8;
  let lastTime: number;
  let timerPointer: NodeJS.Timer;

  $: setTime(displayMinutes, displaySeconds);
  $: updateTime(minutes, seconds);
  $: parseTime(time);

  export function parseDisplayTime(_displayTime: string) {
    const times = _displayTime.split(':');
    displayMinutes = times[0];
    displaySeconds = times[1];
  }

  export function setTime(..._: unknown[]) {
    minutes = parseInt(displayMinutes, 10);
    seconds = parseInt(displaySeconds, 10);
  }

  export function reset() {
    minutes = 8;
    seconds = 0;
  }

  export function updateTime(..._: unknown[]) {
    time = (minutes * 60 + seconds) * 1000;
  }

  export function stop() {
    clearInterval(timerPointer);
    timerPointer = null;
    running = false;
  }

  export function start() {
    if (timerPointer) {
      return;
    }
    lastTime = Date.now();
    timer();
    timerPointer = setInterval(timer, 100);
    running = true;
  }

  function parseTime(..._: unknown[]) {
    // does the same job as parseInt truncates the float
    minutes = ((time / 1000) / 60) | 0;
    seconds = ((time / 1000) % 60) | 0;
    displayMinutes = minutes < 10 ? "0" + minutes : `${minutes}`;
    displaySeconds = seconds < 10 ? "0" + seconds : `${seconds}`;
    displayTime = `${displayMinutes}:${displaySeconds}`;
  }

  function timer() {
    const newTime = Date.now();
    let tempTime = time;

    tempTime -= ((newTime - lastTime) | 0);
    lastTime = newTime;

    if (tempTime <= 0) {
      tempTime = 0;
      stop();
    }

    time = tempTime;
  }

  onDestroy(() => {
    clearInterval(timerPointer);
  })
</script>

<div class="clock">
  {displayTime} remaining
</div>
