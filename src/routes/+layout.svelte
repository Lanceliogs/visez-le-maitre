<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import ContextMenu from '$lib/components/context-menu.svelte';

    let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen flex flex-col">

    <header class="flex items-center justify-between px-4 py-3 border-b">
        <span class="text-lg font-bold">Visez Le Maître</span>
        <ContextMenu />
    </header>

    <main class="flex-1 w-full max-w-md mx-auto px-4 py-6">
        {@render children()}
    </main>

    <footer class="text-center text-sm text-gray-400 py-4 border-t">
        Visez Le Maître — 2026 — v0.1.0
    </footer>

</div>


