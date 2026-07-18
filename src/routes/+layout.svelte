<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import ContextMenu from '$lib/components/context-menu.svelte';
    import ArrowUp from '@lucide/svelte/icons/arrow-up';
    import { page } from '$app/state';

    let { children } = $props();

    let isKiosk = $derived(page.url.pathname.includes('/kiosk'));
    let mainEl: HTMLElement;
    let showScrollTop = $state(false);

    function onScroll() {
        showScrollTop = mainEl.scrollTop > 100;
    }

    function scrollToTop() {
        mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="h-screen flex flex-col overflow-hidden">

    <header class="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-card-border bg-white">
        <span class="text-lg font-bold text-primary tracking-tight">Visez Le Maître</span>
        {#if !isKiosk}
            <ContextMenu />
        {/if}
    </header>

    <main bind:this={mainEl} onscroll={onScroll} class="flex-1 overflow-y-auto relative">
        <div class="w-full max-w-md mx-auto px-4 py-6">
            {@render children()}
        </div>
    </main>

    <button
        onclick={scrollToTop}
        aria-label="Retour en haut"
        class="fixed bottom-16 right-4 w-10 h-10 rounded-full bg-primary text-white shadow-lg
               flex items-center justify-center transition-all duration-300
               {showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}"
    >
        <ArrowUp size={18} />
    </button>

    <footer class="flex-shrink-0 text-center text-sm text-text-muted py-4 border-t border-card-border bg-white">
        Visez Le Maître — 2026
    </footer>

</div>
