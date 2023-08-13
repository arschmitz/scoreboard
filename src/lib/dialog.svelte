<script lang="ts">
    export let open = false;
</script>

<style>
    .dialog {
        position: fixed;
        top: 0;
        left: -100vw;
        width: 100%;
        bottom: 0;
        transition: all 0.5s;
    }

    .dialog-content {
        width: 90%;
        height: 100%;
        padding: 1.5rem;
        overflow-y: scroll;
        box-shadow: 3px 3px 6px #333;
        background-color: white;
        position: absolute;
        left: 0;
        bottom: 0;
    }

    .open {
        left: 0;
    }

    .close-button {
        position: absolute;
        bottom: 0;
        width: 100%;
        left: 0;
        background: navy;
        color: white;
        font-weight: 900;
        font-size: 2rem;
        border: none;
        border-radius: 0;
        padding: 0.25rem;
    }
</style>

<div class="dialog" class:open>
    <div class="dialog-content">
        <slot/>

        <button class="close-button" on:click={() => open = false}>Close</button>
    </div>
</div>