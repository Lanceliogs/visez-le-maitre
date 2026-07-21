<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import { autoScroll, autoScrollOnce, autoScrollDuration, type AutoScrollHandle } from '$lib/utils/autoscroll';
    import type { ContestView, MatchView, PoolStandings } from '$lib/types';

    let { contest, matches, standings } = $props<{
        contest: ContestView;
        matches: MatchView[];
        standings: PoolStandings[];
    }>();

    let poolView = $state<'matches' | 'standings'>('matches');
    let rotateTimeout: ReturnType<typeof setTimeout> | null = null;
    let standingsEl: HTMLDivElement | undefined = $state();
    let qualifEl: HTMLDivElement | undefined = $state();
    let standingsHandle: AutoScrollHandle | null = null;
    let qualifHandle: AutoScrollHandle | null = null;

    function scheduleNext() {
        if (rotateTimeout) clearTimeout(rotateTimeout);
        let delay: number;
        if (poolView === 'standings' && standingsEl) {
            delay = autoScrollDuration(standingsEl) || 6000;
        } else {
            delay = 10000;
        }
        rotateTimeout = setTimeout(() => {
            poolView = poolView === 'matches' ? 'standings' : 'matches';
            scheduleNext();
        }, delay);
    }

    $effect(() => {
        standingsHandle?.stop();
        if (poolView === 'standings' && standingsEl) {
            standingsHandle = autoScrollOnce(standingsEl);
        }
    });

    $effect(() => {
        qualifHandle?.stop();
        if (allPoolsDone && qualifEl) {
            qualifHandle = autoScroll(qualifEl);
        }
    });

    onMount(() => {
        scheduleNext();
    });

    onDestroy(() => {
        if (rotateTimeout) clearTimeout(rotateTimeout);
        standingsHandle?.stop();
        qualifHandle?.stop();
    });

    let poolMatches = $derived(matches.filter(m => m.poolId !== null));
    let completedCount = $derived(poolMatches.filter(m => m.status === 'completed').length);
    let totalMatches = $derived(poolMatches.length);
    let allPoolsDone = $derived(totalMatches > 0 && completedCount === totalMatches);
    let liveMatches = $derived(poolMatches.filter(m => m.status === 'in_progress' || m.status === 'score_submitted'));
    let pendingMatches = $derived(poolMatches.filter(m => m.status === 'pending'));

    let globalRanking = $derived.by(() => {
        if (!standings.length) return [];
        const all: (PoolStandings['standings'][number] & { poolName: string })[] = [];
        for (const pool of standings) {
            for (const team of pool.standings ?? []) {
                all.push({ ...team, poolName: pool.poolName });
            }
        }
        all.sort((a, b) =>
            b.wins - a.wins
            || b.pointsFor - a.pointsFor
            || b.goalAverage - a.goalAverage
        );
        return all;
    });

    function getQualification(index: number): string {
        const nbQualified = contest?.nbQualified ?? 16;
        const nbConsolante = contest?.nbConsolante ?? 16;
        if (index < nbQualified) return 'principale';
        if (index < nbQualified + nbConsolante) return 'consolante';
        return 'eliminee';
    }
</script>

{#if !allPoolsDone}
    <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold">{contest.name}</h1>
            <div class="bg-primary-light rounded-lg px-3 py-1 text-sm">
                <span class="text-primary font-bold">{completedCount}</span>
                <span class="text-text-muted">/{totalMatches} matchs</span>
            </div>
        </div>

        {#key poolView}
            <div in:fade={{ duration: 300 }}>
                {#if poolView === 'matches'}
                    <div class="flex flex-col gap-4">
                        {#if liveMatches.length > 0}
                            <h2 class="text-lg font-semibold text-orange-600">En cours ({liveMatches.length})</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {#each liveMatches as match}
                                    <div class="border border-orange-300 bg-orange-50 rounded-lg p-3 relative">
                                        <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-orange-200 pointer-events-none">VS</span>
                                        <div class="flex items-center justify-between">
                                            <span class="font-medium text-sm">{match.team1Name}</span>
                                            <span class="text-xl font-black text-orange-600">
                                                {match.scoreTeam1 ?? '-'}
                                            </span>
                                        </div>
                                        <div class="h-1"></div>
                                        <div class="flex items-center justify-between">
                                            <span class="font-medium text-sm">{match.team2Name}</span>
                                            <span class="text-xl font-black text-orange-600">
                                                {match.scoreTeam2 ?? '-'}
                                            </span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <p class="text-text-muted text-center py-6">Aucun match en cours</p>
                        {/if}

                        {#if pendingMatches.length > 0}
                            <h2 class="text-lg font-semibold text-text-muted mt-2">À venir ({pendingMatches.length})</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {#each pendingMatches.slice(0, 9) as match}
                                    <div class="border border-card-border bg-white rounded-lg p-2">
                                        <div class="flex items-center justify-between text-sm">
                                            <span>{match.team1Name}</span>
                                            <span class="text-xs text-text-muted">R{match.roundNumber}</span>
                                            <span>{match.team2Name}</span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                {:else}
                    <div class="flex flex-col gap-4">
                        <h2 class="text-lg font-semibold text-primary">Classements des poules</h2>
                        <div bind:this={standingsEl} class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto scrollbar-hide">
                            {#each standings as pool}
                                <div class="border border-card-border bg-white rounded-lg p-3">
                                    <h3 class="font-bold text-sm text-primary mb-2">{pool.poolName}</h3>
                                    <table class="w-full text-xs">
                                        <thead>
                                            <tr class="text-text-muted border-b border-card-border">
                                                <th class="text-left py-1">#</th>
                                                <th class="text-left py-1">Équipe</th>
                                                <th class="text-right py-1">V:PM:GA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each pool.standings ?? [] as team, i}
                                                <tr class="border-b border-card-border last:border-0">
                                                    <td class="py-1 text-text-muted">{i + 1}</td>
                                                    <td class="py-1 font-medium truncate max-w-[120px]">{team.teamName}</td>
                                                    <td class="text-right py-1 tabular-nums">{team.wins}:{team.pointsFor}:<span class="{team.goalAverage >= 0 ? 'text-green-600' : 'text-red-500'}">{team.goalAverage > 0 ? '+' : ''}{team.goalAverage}</span></td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/key}
    </div>

{:else}
    <!-- POOLS COMPLETE - QUALIFICATIONS -->
    <div class="flex flex-col gap-4">
        <div class="text-center">
            <h1 class="text-2xl font-bold mb-1">{contest.name}</h1>
            <p class="text-primary font-medium">Poules terminées — Qualifications</p>
        </div>

        <div bind:this={qualifEl} class="w-full max-h-[75vh] overflow-y-auto scrollbar-hide">
            <div class="border border-card-border bg-white rounded-lg overflow-hidden">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-card-border text-text-muted bg-primary-light">
                            <th class="text-left px-2 py-2">#</th>
                            <th class="text-left px-2 py-2">Équipe</th>
                            <th class="text-right px-2 py-2">V:PM:GA</th>
                            <th class="text-right px-2 py-2">Qualif.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each globalRanking as team, i}
                            {@const q = getQualification(i)}
                            {@const isLastPrincipale = q === 'principale' && getQualification(i + 1) !== 'principale'}
                            {@const isLastConsolante = q === 'consolante' && getQualification(i + 1) !== 'consolante'}
                            <tr class="
                                {q === 'principale' ? 'bg-green-50' : q === 'consolante' ? 'bg-orange-50' : 'bg-gray-50 text-text-muted'}
                                {isLastPrincipale || isLastConsolante ? 'border-b-2 border-gray-300' : 'border-b border-card-border'}
                            ">
                                <td class="px-2 py-1.5 font-bold">{i + 1}</td>
                                <td class="px-2 py-1.5 font-medium">{team.teamName}</td>
                                <td class="text-right px-2 py-1.5 tabular-nums">{team.wins}:{team.pointsFor}:<span class="{team.goalAverage >= 0 ? 'text-green-600' : 'text-red-500'}">{team.goalAverage > 0 ? '+' : ''}{team.goalAverage}</span></td>
                                <td class="text-right px-2 py-1.5">
                                    {#if q === 'principale'}
                                        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">P</span>
                                    {:else if q === 'consolante'}
                                        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">C</span>
                                    {:else}
                                        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-text-muted">É</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
{/if}

<style>
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
</style>
