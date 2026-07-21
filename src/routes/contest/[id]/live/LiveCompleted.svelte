<script lang="ts">
    import { onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import { autoScrollOnce, type AutoScrollHandle } from '$lib/utils/autoscroll';
    import type { ContestView, MatchView } from '$lib/types';

    let { contest, matches } = $props<{ contest: ContestView; matches: MatchView[] }>();

    let bracketView = $state<'principale' | 'consolante'>('principale');
    let rotateTimeout: ReturnType<typeof setTimeout> | null = null;
    let contentEl: HTMLDivElement | undefined = $state();
    let scrollHandle: AutoScrollHandle | null = null;

    let principaleMatches = $derived(matches.filter(m => m.bracket === 'principale'));
    let consolanteMatches = $derived(matches.filter(m => m.bracket === 'consolante'));

    function bracketRounds(bMatches: MatchView[]) {
        const rounds = new Map<number, MatchView[]>();
        for (const m of bMatches) {
            const r = m.bracketRound!;
            if (!rounds.has(r)) rounds.set(r, []);
            rounds.get(r)!.push(m);
        }
        return [...rounds.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([round, ms]) => ({ round, matches: ms.sort((a, b) => a.bracketPosition! - b.bracketPosition!) }));
    }

    let principaleRounds = $derived(bracketRounds(principaleMatches));
    let consolanteRounds = $derived(bracketRounds(consolanteMatches));

    function bracketWinner(rounds: { round: number; matches: MatchView[] }[]) {
        if (rounds.length === 0) return null;
        const lastRound = rounds[rounds.length - 1];
        if (lastRound.matches.length !== 1) return null;
        const final = lastRound.matches[0];
        if (final.status !== 'completed') return null;
        return final.winnerId === final.team1Id ? final.team1Name : final.team2Name;
    }

    function roundLabel(round: number, totalRounds: number) {
        const remaining = totalRounds - round;
        if (remaining === 0) return 'Finale';
        if (remaining === 1) return 'Demi-finales';
        if (remaining === 2) return 'Quarts de finale';
        return `Tour ${round}`;
    }

    function scheduleRotate() {
        if (rotateTimeout) clearTimeout(rotateTimeout);
        rotateTimeout = setTimeout(() => {
            bracketView = bracketView === 'principale' ? 'consolante' : 'principale';
        }, 500);
    }

    $effect(() => {
        scrollHandle?.stop();
        if (contentEl && (bracketView === 'principale' || bracketView === 'consolante')) {
            setTimeout(() => {
                if (contentEl) {
                    scrollHandle = autoScrollOnce(contentEl, scheduleRotate);
                }
            }, 350);
        }
    });

    onDestroy(() => {
        if (rotateTimeout) clearTimeout(rotateTimeout);
        scrollHandle?.stop();
    });
</script>

<div class="flex flex-col gap-4">
    <div class="text-center">
        <h1 class="text-2xl font-bold mb-1">{contest.name}</h1>
        <p class="text-primary font-medium">Concours terminé</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
        {#if bracketWinner(principaleRounds)}
            <div class="border border-green-300 bg-green-50 rounded-lg p-4 text-center">
                <p class="text-sm text-text-muted mb-1">Vainqueur — Principale</p>
                <p class="text-2xl font-black text-green-700">{bracketWinner(principaleRounds)}</p>
            </div>
        {/if}
        {#if bracketWinner(consolanteRounds)}
            <div class="border border-orange-300 bg-orange-50 rounded-lg p-4 text-center">
                <p class="text-sm text-text-muted mb-1">Vainqueur — Consolante</p>
                <p class="text-2xl font-black text-orange-700">{bracketWinner(consolanteRounds)}</p>
            </div>
        {/if}
    </div>

    <div class="flex justify-center gap-1 mt-2">
        <button
            onclick={() => bracketView = 'principale'}
            class="px-3 py-1 rounded-lg text-sm font-medium transition {bracketView === 'principale' ? 'bg-primary text-white' : 'bg-primary-light text-text-muted'}"
        >Principale</button>
        <button
            onclick={() => bracketView = 'consolante'}
            class="px-3 py-1 rounded-lg text-sm font-medium transition {bracketView === 'consolante' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-text-muted'}"
        >Consolante</button>
    </div>

    {#key bracketView}
        {#if bracketView === 'principale' || bracketView === 'consolante'}
            {@const rounds = bracketView === 'principale' ? principaleRounds : consolanteRounds}
            <div bind:this={contentEl} class="max-h-[60vh] overflow-y-auto scrollbar-hide" in:fade={{ duration: 300 }}>
                {#each rounds as { round, matches: roundMatches }}
                    <div class="mb-4 max-w-2xl mx-auto w-full">
                        <h3 class="text-sm font-medium text-text-muted mb-2">{roundLabel(round, rounds.length)}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {#each roundMatches as match}
                                {@const t1Won = match.winnerId === match.team1Id}
                                {@const t2Won = match.winnerId === match.team2Id}
                                <div class="border border-card-border bg-white rounded-lg p-2">
                                    <div class="flex items-center justify-between rounded px-2 py-0.5 {t1Won ? 'bg-green-100' : t2Won ? 'opacity-60' : ''}">
                                        <span class="text-sm {t1Won ? 'text-green-800 font-bold' : ''}">{match.team1Name}</span>
                                        <span class="font-bold {t1Won ? 'text-green-700' : t2Won ? 'text-red-500' : ''}">{match.scoreTeam1 ?? '-'}</span>
                                    </div>
                                    <div class="flex items-center justify-between rounded px-2 py-0.5 mt-0.5 {t2Won ? 'bg-green-100' : t1Won ? 'opacity-60' : ''}">
                                        <span class="text-sm {t2Won ? 'text-green-800 font-bold' : ''}">{match.team2Name}</span>
                                        <span class="font-bold {t2Won ? 'text-green-700' : t1Won ? 'text-red-500' : ''}">{match.scoreTeam2 ?? '-'}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {/key}
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
