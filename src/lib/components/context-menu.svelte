<script lang="ts">
    import { page } from '$app/state';
    import { isAdmin } from '$lib/admin.svelte';
    import ToolButton from '$lib/components/tool-button.svelte';

    let open = $state(false);
    function toggle() {
        open = !open;
    }
    function close() {
        open = false;
    }
</script>

<svelte:window onclick={close} />

<div class="relative">
    <ToolButton
        label="Menu"
        onclick={(e) => { e.stopPropagation(); toggle(); }}
        class="flex-col gap-1"
    >
        <span class="w-4 h-0.5 bg-gray-700"></span>
        <span class="w-4 h-0.5 bg-gray-700"></span>
        <span class="w-4 h-0.5 bg-gray-700"></span>
    </ToolButton>
    
    {#if open}
    <div class="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg py-1 min-w-48 z-50">
        {#if page.url.pathname !== '/'}
            <a href="/" class="block px-4 py-2 hover:bg-gray-100">Accueil</a>
        {/if}
        {#if page.url.pathname !== '/about'}
            <a href="/about" class="block px-4 py-2 hover:bg-gray-100">À propos</a>
        {/if}
    </div>
    {/if}
</div>
