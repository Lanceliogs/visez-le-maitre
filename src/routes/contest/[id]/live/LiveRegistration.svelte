<script lang="ts">
    import { onDestroy } from 'svelte';
    import { autoScroll, type AutoScrollHandle } from '$lib/utils/autoscroll';
    import type { ContestView, TeamView } from '$lib/types';

    let { contest, teams } = $props<{ contest: ContestView; teams: TeamView[] }>();

    let scrollEl: HTMLDivElement | undefined = $state();
    let handle: AutoScrollHandle | null = null;

    $effect(() => {
        handle?.stop();
        if (teams.length > 0 && scrollEl) {
            handle = autoScroll(scrollEl);
        }
    });

    onDestroy(() => {
        handle?.stop();
    });
</script>

<div class="flex flex-col items-center gap-6">
    <div class="text-center">
        <h1 class="text-2xl font-bold mb-2">{contest.name}</h1>
        <p class="text-lg text-text-muted">Inscriptions en cours</p>
    </div>
    <div class="bg-primary-light border border-primary rounded-2xl px-6 py-3">
        <span class="text-4xl font-black text-primary">{teams.length}</span>
        <span class="text-lg text-primary ml-2">équipe{teams.length > 1 ? 's' : ''}</span>
    </div>
    {#if teams.length > 0}
        <div bind:this={scrollEl} class="w-full max-w-2xl overflow-y-auto max-h-[50vh] scrollbar-hide">
            {#each teams as team}
                <div class="border border-card-border bg-white rounded-lg px-4 py-3 mb-2">
                    <p class="font-semibold">{team.name}</p>
                    {#if team.members?.length}
                        <p class="text-sm text-text-muted">{team.members.map(m => m.name).join(', ')}</p>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
</style>
