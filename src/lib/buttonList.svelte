<script lang="ts" context="module">
    export interface ButtonListItem {
      data?: unknown;
      text: String;
      click: () => null;
    };
</script>

<script lang="ts">
    export let buttons:ButtonListItem[];

    $: console.log(buttons);
</script>

<style>
  ul {
    appearance: none;
    width: 100%;
    padding: 0;
    margin: 0;

    & li {
      width: 100%;
      appearance: none;
      font-size: 1rem;
      padding: 0;
      margin: 0;
      list-style: none;
      margin: 0;
      background-color: #ccc;
      border: 1px solid #000;

      & button {
        width: 100%;
        appearance: none;
        border-radius: 0;
      }
    }
  }
</style>

<ul>
  {#if buttons}
    {#each buttons as button}
      <li>
        <button on:click={button.click}>
          {#if button.text}
            {button.text}
          {:else}
            <slot name="content" {button}></slot>
          {/if}
        </button>
      </li>
    {/each}
  {/if}
</ul>