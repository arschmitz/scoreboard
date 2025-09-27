<script lang="ts">
  import { onMount } from "svelte";

  export let socket;
  export let local;
  export let state;

  // --- CONFIG ---
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

  // --- STATE ---
  let player: any;
  let ready = false;
  let started = false;
  let loadingTracks = false;

  // --- AUTH ---


  async function initAuth() {
    if (!local) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      const data = await fetchAccessToken(code);
      setSession(data);
      history.replaceState({}, "", "/local-remote");
    } else {
      if (!state.refresh_token) {
        state.refreshToken = localStorage.getItem("refresh_token");
      }
      if (state.refreshToken) {
        const data = await refreshAccessToken(state.refreshToken);
        setSession(data, state.refreshToken);
      } else {
        redirectToSpotifyAuth();
      }
    }
  }

  async function getAccessToken(): Promise<string> {
    if (!state.accessToken || Date.now() > state.expiresAt) {
      if (state.refreshToken) {
        const data = await refreshAccessToken(state.refreshToken);
        setSession(data, state.refreshToken);
      } else {
        redirectToSpotifyAuth();
      }
    }
    return state.accessToken!;
  }

  function setSession(data: any, existingRefresh?: string) {
    state.accessToken = data.access_token;
    state.refreshToken = data.refresh_token || existingRefresh || null;
    state.expiresAt = Date.now() + data.expires_in * 1000;
    if (state.refreshToken) {
      localStorage.setItem("refresh_token", state.refreshToken);
    }
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

  // --- PLAYER ---
  async function initPlayer() {
    player = new window.Spotify.Player({
      name: "Svelte Web Player",
      getOAuthToken: async (cb: (token: string) => void) => {
        cb(await getAccessToken());
      },
      volume: state.volume,
    });

    player.addListener("ready", async ({ device_id }: any) => {
      state.deviceId = device_id;
      socket.emit("sync", state);
      ready = true;
      console.log("Ready with Device ID", device_id);
      await loadPlaylistTracks();
    });

    player.addListener("player_state_changed", (_state: any) => {
      if (!_state) return;
      state.paused = _state.paused;
      state.currentTrack = _state.track_window.current_track;

      socket.emit("sync", state);
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
      state.tracks = allTracks;
      socket.emit("sync", state);
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
    if (!state.deviceId) return;
    await transferPlayback(state.deviceId);
    await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`,
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
    if (!state.deviceId) return;
    await transferPlayback(state.deviceId);
    started = true;
  }

  // --- Controls ---
  function togglePlay() {
    console.log("play")
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
    state.volume = parseFloat(target.value);
    socket.emit("spotify", { name: "setVolume", args: [state.volume] });
  }

  // --- MOUNT ---
  onMount(async () => {
    await initAuth();

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      initPlayer();
      if (local) {
        socket.on("spotify", async ({ name, args } = {}) => {
          console.log(name, args)
          args ? player[name](...args) : player[name]();
        });
      }
    };
  });
</script>

<style>
  .player {
    text-align: center;
    font-family: sans-serif;
    padding: 1rem;
  }
  img {
    border-radius: 8px;
  }
  button {
    margin: 0.25rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }
  input[type="range"] {
    width: 200px;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    padding: 0.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  li:hover {
    background: #eee;
  }
  li.selected {
    background: rgba(30, 215, 96, 0.2);
    border-radius: 4px;
  }
  li img {
    margin-right: 8px;
    border-radius: 4px;
  }
  .spinner {
    font-size: 1rem;
    color: #666;
    margin-top: 1rem;
  }
</style>

<div class="player">
  {#if !started}
    {#if ready}
      <button on:click={startPlayback}>🎵 Load Player</button>
    {:else}
      <p>Loading Spotify SDK…</p>
    {/if}
  {/if}

  {#if state.currentTrack}
    <img
      src={state.currentTrack.album.images[0]?.url}
      alt={state.currentTrack.name}
      width="200"
    />
    <p><strong>{state.currentTrack.name}</strong></p>
    <p>{state.currentTrack.artists.map((a) => a.name).join(", ")}</p>
  {/if}

  {#if started}
    <div>
      <button on:click={prevTrack}>⏮ Previous</button>
      <button on:click={togglePlay}>
        {state.paused ? "▶️ Play" : "⏸ Pause"}
      </button>
      <button on:click={nextTrack}>⏭ Next</button>
    </div>

    <div style="margin-top: 1rem;">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        bind:value={state.volume}
        on:input={changeVolume}
      />
      <p>Volume</p>
    </div>

    {#if loadingTracks}
      <div class="spinner">Loading playlist… ⏳</div>
    {:else if state.tracks.length > 0}
      <h3>Playlist Tracks</h3>
      <ul>
        {#each state.tracks as track}
          <li
            class:selected={state.currentTrack?.id === track.id}
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
    {/if}
  {/if}
</div>
