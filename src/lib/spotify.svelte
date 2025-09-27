<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let socket;
  export let local;

  const CLIENT_ID = "5ee38f1a433e43f7b9edde387d58279d";
  const REDIRECT_URI = "http://127.0.0.1:4173/local-remote";
  const SCOPES = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-modify-playback-state",
    "user-read-playback-state",
  ].join(" ");

  const PLAYLIST_URI = "spotify:playlist:6Bv7z3SjGOdSNwSQ1njMGk";

  let player: any;
  let deviceId: string | null = null;
  let paused = true;
  let currentTrack: any = null;
  let volume = 0.5;
  let ready = false;
  let started = false;
  let tracks: any[] = [];
  let loadingTracks = false;
  let position = 0;
  let duration = 0;

  let trackListContainer: HTMLElement;
  let progressTimer: number;

  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let expiresAt = 0;

  function msToTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function setSession(data: any, existingRefresh?: string) {
    accessToken = data.access_token;
    refreshToken = data.refresh_token || existingRefresh || null;
    expiresAt = Date.now() + data.expires_in * 1000;
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
  }

  function generateRandomString(length: number) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
      .map((x) => chars[x % chars.length])
      .join("");
  }

  async function generateCodeChallenge(verifier: string) {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async function initAuth() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      const data = await fetchAccessToken(code);
      setSession(data);
      history.replaceState({}, "", "/local-remote");
    } else {
      refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        const data = await refreshAccessToken(refreshToken);
        setSession(data, refreshToken);
      } else {
        redirectToSpotifyAuth();
      }
    }
  }

  async function getAccessToken(): Promise<string> {
    if (!accessToken || Date.now() > expiresAt) {
      if (refreshToken) {
        const data = await refreshAccessToken(refreshToken);
        setSession(data, refreshToken);
      } else {
        redirectToSpotifyAuth();
      }
    }
    return accessToken!;
  }

  function redirectToSpotifyAuth() {
    const verifier = generateRandomString(128);
    generateCodeChallenge(verifier).then((challenge) => {
      localStorage.setItem("code_verifier", verifier);
      const params = new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        scope: SCOPES,
        redirect_uri: REDIRECT_URI,
        code_challenge_method: "S256",
        code_challenge: challenge,
      });
      window.location.href =
        "https://accounts.spotify.com/authorize?" + params.toString();
    });
  }

  async function fetchAccessToken(code: string) {
    const verifier = localStorage.getItem("code_verifier")!;
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    });

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return res.json();
  }

  async function refreshAccessToken(refreshToken: string) {
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return res.json();
  }

  async function initPlayer() {
    player = new window.Spotify.Player({
      name: "Svelte Web Player",
      getOAuthToken: async (cb: (token: string) => void) => {
        cb(await getAccessToken());
      },
      volume,
    });

    player.addListener("ready", async ({ device_id }: any) => {
      deviceId = device_id;
      ready = true;
      await loadPlaylistTracks();
    });

    player.addListener("player_state_changed", (state: any) => {
      if (!state) return;
      paused = state.paused;
      currentTrack = state.track_window.current_track;
      position = state.position;
      duration = state.duration;

      const idx = tracks.findIndex((t) => t.uri === currentTrack?.uri);
      if (idx >= 0 && trackListContainer) {
        const el = trackListContainer.querySelector(
          `li[data-index="${idx}"]`
        ) as HTMLElement;
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });

    player.connect();
  }

  async function loadPlaylistTracks() {
    loadingTracks = true;
    const token = await getAccessToken();
    let allTracks: any[] = [];
    let offset = 0;
    const limit = 100;

    try {
      while (true) {
        const res = await fetch(
          `https://api.spotify.com/v1/playlists/6Bv7z3SjGOdSNwSQ1njMGk/tracks?offset=${offset}&limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        allTracks.push(...data.items.map((item: any) => item.track));

        if (!data.next) break;
        offset += limit;
      }
      tracks = allTracks;
    } catch (err) {
      console.error("Error loading playlist tracks", err);
    } finally {
      loadingTracks = false;
    }
  }

  async function transferPlayback(deviceId: string) {
    const token = await getAccessToken();
    await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function playTrack(trackUri: string) {
    const token = await getAccessToken();
    if (!deviceId) return;
    await transferPlayback(deviceId);
    await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: "PUT",
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    started = true;
  }

  async function startPlayback() {
    if (!deviceId) return;
    await transferPlayback(deviceId);
    started = true;
  }

  function togglePlay() {
    socket.emit("spotify", { name: "togglePlay" });
  }
  function nextTrack() {
    socket.emit("spotify", { name: "nextTrack" });
  }
  function prevTrack() {
    socket.emit("spotify", { name: "previousTrack" });
  }
  function changeVolume(e: Event) {
    const target = e.target as HTMLInputElement;
    volume = parseFloat(target.value);
    socket.emit("spotify", { name: "setVolume", args: [volume] });
  }

  onMount(async () => {
    await initAuth();

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      initPlayer();

      if (local) {
        socket.on("spotify", async ({ name, args } = {}) => {
          args ? player[name](...args) : player[name]();
        });
      }
    };

    progressTimer = setInterval(async () => {
      if (player && !paused) {
        const state = await player.getCurrentState();
        if (state) {
          position = state.position;
          duration = state.duration;
        }
      }
    }, 500);
  });

  onDestroy(() => {
    clearInterval(progressTimer);
  });
</script>

<style>
  .player {
    font-family: "Helvetica Neue", sans-serif;
    background: #121212;
    color: #fff;
    border-radius: 12px;
    max-width: 480px;
    margin: auto;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    margin-top: 0.25rem;
  }

  .track-list {
    max-height: calc(100vh - 260px);
    overflow-y: auto;
    margin-top: 1rem;
    border-top: 1px solid #333;
  }

  .track-list ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .track-list li {
    padding: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .track-list li:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .track-list li.selected {
    background: rgba(30, 215, 96, 0.2);
  }

  .track-list img {
    border-radius: 4px;
  }

  .progress-bar {
    height: 4px;
    background: #333;
    border-radius: 2px;
    overflow: hidden;
    margin-top: 0.5rem;
    position: relative;
  }

  .progress {
    height: 100%;
    background: linear-gradient(90deg, #1ed760, #1db954);
    transition: width 0.3s ease;
  }

  .mini-player {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #1e1e1e;
    padding: 1rem;
    border-radius: 8px;
  }

  .album-art {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    animation: spin 10s linear infinite;
  }

  .paused .album-art {
    animation-play-state: paused;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .mini-player-controls button {
    background: transparent;
    border: none;
    color: #1ed760;
    font-size: 1.2rem;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .mini-player-controls button:hover {
    color: #1db954;
  }
</style>

<div class="player">
  {#if !started}
    {#if ready}
      <button class="start-btn" on:click={startPlayback}>🎵 Load Player</button>
    {:else}
      <p>Loading Spotify SDK…</p>
    {/if}
  {/if}

  {#if currentTrack}
    <div class="mini-player {paused ? 'paused' : ''}">
      <img
        class="album-art"
        src={currentTrack.album.images[2]?.url || currentTrack.album.images[0]?.url}
        alt={currentTrack.name}
      />
      <div>
        <div><strong>{currentTrack.name}</strong></div>
        <div><small>{currentTrack.artists.map((a) => a.name).join(", ")}</small></div>

        <div class="mini-player-controls">
          <button on:click={prevTrack}>⏮</button>
          <button on:click={togglePlay}>{paused ? "▶️" : "⏸"}</button>
          <button on:click={nextTrack}>⏭</button>
        </div>

        <div class="progress-bar">
          <div
            class="progress"
            style="width: {(position / duration) * 100}%;"
          ></div>
        </div>

        <div>
          {msToTime(position)} / {msToTime(duration)}
        </div>

        <div class="volume-control">
          🔊
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={volume}
            on:input={changeVolume}
          />
        </div>
      </div>
    </div>
  {/if}

  {#if started}
    {#if loadingTracks}
      <div class="spinner">Loading playlist… ⏳</div>
    {:else if tracks.length > 0}
      <div class="track-list" bind:this={trackListContainer}>
        <ul>
          {#each tracks as track, idx}
            <li
              data-index={idx}
              class:selected={currentTrack?.id === track.id}
              on:click={() => playTrack(track.uri)}
            >
              <img
                src={track.album.images[2]?.url || track.album.images[0]?.url}
                alt={track.name}
                width="40"
                height="40"
              />
              <div>
                <strong>{track.name}</strong><br />
                <small>{track.artists.map((a) => a.name).join(", ")}</small>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</div>
