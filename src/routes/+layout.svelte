<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import ContextMenu from '$lib/components/context-menu.svelte';
    import ConfirmModal from '$lib/components/confirm-modal.svelte';
    import { confirmState, resolveConfirm } from '$lib/utils/confirm.svelte';
    import ArrowUp from '@lucide/svelte/icons/arrow-up';
    import { page } from '$app/state';
    import { state as refreshState } from '$lib/utils/refresh.svelte';
    import { onMount } from 'svelte';

    let { children } = $props();

    let isKiosk = $derived(page.url.pathname.includes('/kiosk'));
    let isLive = $derived(page.url.pathname.includes('/live'));
    let isFullWidth = $derived(isKiosk || isLive);
    let mainEl: HTMLElement;
    let showScrollTop = $state(false);
    let now = $state(Date.now());

    onMount(() => {
        const interval = setInterval(() => {
            now = Date.now();
        }, 10_000);
        return () => clearInterval(interval);
    });

    function onScroll() {
        showScrollTop = mainEl.scrollTop > 100;
    }

    function scrollToTop() {
        mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updatedAt() {
        const id = page.params.id;
        if (!id || id != refreshState.contestId)
            return "";

        if (!refreshState.lastRefresh)
            return "Pas encore mis à jour";

        const seconds = Math.floor(
            (now - refreshState.lastRefresh) / 1000
        );
        if (seconds < 5)
            return "Mis à jour à l'instant";
        if (seconds < 60)
            return `Mis à jour il y a ${seconds} sec`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60)
            return `Mis à jour il y a ${minutes} min`;
        return `Mis à jour il y a ${Math.floor(minutes / 60)} h`;
    }

    function footerText() {
        const text = updatedAt();
        if (!text)
            return "Visez Le Maître — 2026"
        return `Visez Le Maître — 2026 — ${text}`
    }
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="h-screen flex flex-col overflow-hidden">

    <header class="shrink-0 flex items-center justify-between px-4 py-3 border-b border-card-border bg-white">
        <a href="/" aria-label="ACCUEIL" class="flex flex-row gap-2 items-center">
            <img src={favicon} alt="" width="30" height="30" />
            <span class="text-lg font-bold text-primary tracking-tight">Visez Le Maître</span>
        </a>
        {#if !isFullWidth}
            <ContextMenu />
        {/if}
    </header>

    <main bind:this={mainEl} onscroll={onScroll} class="flex-1 min-h-0 overflow-y-auto overscroll-contain relative">
        {#if isFullWidth}
            <div class="w-full px-4 py-6">
                {@render children()}
            </div>
        {:else}
            <div class="w-full max-w-md mx-auto px-4 py-6">
                {@render children()}
            </div>
        {/if}
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

    {#if !isFullWidth}
        <footer class="shrink-0 text-center text-sm text-text-muted py-4 border-t border-card-border bg-white">
            {footerText()}
        </footer>
    {/if}

    {#if confirmState.open}
        <ConfirmModal
            title={confirmState.title}
            label={confirmState.label}
            confirmtext={confirmState.confirmtext}
            canceltext={confirmState.canceltext}
            variant={confirmState.variant}
            onconfirm={() => resolveConfirm(true)}
            oncancel={() => resolveConfirm(false)}
        />
    {/if}

</div>
