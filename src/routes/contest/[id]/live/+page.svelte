<script lang="ts">
    import { page } from '$app/state';
    import { onMount, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import Target from '@lucide/svelte/icons/target';

    let contest = $state<any>(null);
    let teams = $state<any[]>([]);
    let matches = $state<any[]>([]);
    let standings = $state<any[]>([]);
    let eventSource: EventSource | null = null;

    // Pool phase: rotate between matches and standings
    let poolView = $state<'matches' | 'standings'>('matches');
    let rotateInterval: ReturnType<typeof setInterval> | null = null;

    const contestId = page.params.id;

    onMount(async () => {
        await fetchAll();

        eventSource = new EventSource(`/api/contests/${contestId}/events`);
        eventSource.addEventListener('refresh', fetchAll);

        rotateInterval = setInterval(() => {
            poolView = poolView === 'matches' ? 'standings' : 'matches';
        }, 8000);
    });

    onDestroy(() => {
        eventSource?.close();
        if (rotateInterval) clearInterval(rotateInterval);
    });

    async function fetchAll() {
        const [contestRes, teamsRes, matchesRes, standingsRes] = await Promise.all([
            fetch(`/api/contests/${contestId}`),
            fetch(`/api/contests/${contestId}/teams`),
            fetch(`/api/contests/${contestId}/matches`),
            fetch(`/api/contests/${contestId}/standings`),
        ]);
        if (contestRes.ok) contest = await contestRes.json();
        if (teamsRes.ok) teams = await teamsRes.json();
        if (matchesRes.ok) matches = await matchesRes.json();
        if (standingsRes.ok) standings = await standingsRes.json();
    }

    let phase = $derived(contest?.status ?? 'registration');
    let completedCount = $derived(matches.filter(m => m.status === 'completed').length);
    let totalMatches = $derived(matches.length);
    let allPoolsDone = $derived(totalMatches > 0 && completedCount === totalMatches);
    let liveMatches = $derived(matches.filter(m => m.status === 'in_progress' || m.status === 'score_submitted'));
    let pendingMatches = $derived(matches.filter(m => m.status === 'pending'));

    // Compute global ranking from standings
    let globalRanking = $derived.by(() => {
        if (!standings.length) return [];
        const all: any[] = [];
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
        if (index < nbQualified) return 'principale';
        if (index < nbQualified + 16) return 'consolante';
        return 'eliminee';
    }
</script>

<svelte:head>
    <title>{contest?.name ?? 'Live'} — Visez Le Maître</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white overflow-hidden">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div class="flex items-center gap-3">
            <Target size={32} class="text-emerald-400" />
            <span class="text-xl font-bold text-emerald-400 tracking-tight">Visez Le Maître</span>
        </div>
        {#if contest}
            <span class="text-sm text-gray-400">{contest.name}</span>
        {/if}
    </header>

    <main class="p-6">
        {#if !contest}
            <div class="flex items-center justify-center h-[80vh]">
                <p class="text-gray-500 text-lg">Chargement...</p>
            </div>

        {:else if phase === 'registration'}
            <!-- REGISTRATION PHASE -->
            <div class="flex flex-col items-center gap-8 pt-12">
                <div class="text-center">
                    <h1 class="text-4xl font-bold mb-3">{contest.name}</h1>
                    <p class="text-xl text-gray-400">Inscriptions en cours</p>
                </div>
                <div class="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl px-8 py-4">
                    <span class="text-5xl font-black text-emerald-400">{teams.length}</span>
                    <span class="text-xl text-emerald-300 ml-3">équipe{teams.length > 1 ? 's' : ''}</span>
                </div>
                {#if teams.length > 0}
                    <div class="w-full max-w-2xl overflow-hidden relative h-[50vh]">
                        <div class="scroll-container">
                            {#each [...teams, ...teams] as team}
                                <div class="bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 mb-3">
                                    <p class="text-lg font-semibold">{team.name}</p>
                                    {#if team.members?.length}
                                        <p class="text-sm text-gray-400">{team.members.map((m: any) => m.name).join(', ')}</p>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

        {:else if phase === 'pools' && !allPoolsDone}
            <!-- POOLS IN PROGRESS -->
            <div class="flex flex-col gap-6">
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-bold">{contest.name}</h1>
                    <div class="bg-gray-800 rounded-lg px-4 py-2 text-sm">
                        <span class="text-emerald-400 font-bold">{completedCount}</span>
                        <span class="text-gray-400">/{totalMatches} matchs terminés</span>
                    </div>
                </div>

                {#key poolView}
                    <div in:fade={{ duration: 300 }}>
                        {#if poolView === 'matches'}
                            <!-- Live matches -->
                            <div class="space-y-6">
                                {#if liveMatches.length > 0}
                                    <h2 class="text-lg font-semibold text-amber-400">En cours ({liveMatches.length})</h2>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {#each liveMatches as match}
                                            <div class="bg-gray-800 border border-amber-500/30 rounded-xl p-4">
                                                <div class="flex items-center justify-between">
                                                    <span class="font-medium text-sm">{match.team1Name}</span>
                                                    <span class="text-2xl font-black text-amber-400">
                                                        {match.scoreTeam1 ?? '-'}
                                                    </span>
                                                </div>
                                                <div class="text-center text-xs text-gray-500 my-1">vs</div>
                                                <div class="flex items-center justify-between">
                                                    <span class="font-medium text-sm">{match.team2Name}</span>
                                                    <span class="text-2xl font-black text-amber-400">
                                                        {match.scoreTeam2 ?? '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <p class="text-gray-500 text-center py-8">Aucun match en cours</p>
                                {/if}

                                {#if pendingMatches.length > 0}
                                    <h2 class="text-lg font-semibold text-gray-400 mt-6">À venir ({pendingMatches.length})</h2>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {#each pendingMatches.slice(0, 9) as match}
                                            <div class="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
                                                <div class="flex items-center justify-between">
                                                    <span class="text-sm text-gray-300">{match.team1Name}</span>
                                                    <span class="text-xs text-gray-600">R{match.roundNumber}</span>
                                                    <span class="text-sm text-gray-300">{match.team2Name}</span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>

                        {:else}
                            <!-- Pool Standings -->
                            <div class="space-y-4">
                                <h2 class="text-lg font-semibold text-emerald-400">Classements des poules</h2>
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 standings-scroll">
                                    {#each standings as pool}
                                        <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
                                            <h3 class="font-bold text-sm text-emerald-300 mb-2">{pool.poolName}</h3>
                                            <table class="w-full text-xs">
                                                <thead>
                                                    <tr class="text-gray-500 border-b border-gray-700">
                                                        <th class="text-left py-1">#</th>
                                                        <th class="text-left py-1">Équipe</th>
                                                        <th class="text-center py-1">V</th>
                                                        <th class="text-center py-1">PF</th>
                                                        <th class="text-center py-1">GA</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {#each pool.standings ?? [] as team, i}
                                                        <tr class="border-b border-gray-800">
                                                            <td class="py-1 text-gray-400">{i + 1}</td>
                                                            <td class="py-1 font-medium truncate max-w-[120px]">{team.teamName}</td>
                                                            <td class="text-center py-1">{team.wins}</td>
                                                            <td class="text-center py-1">{team.pointsFor}</td>
                                                            <td class="text-center py-1 {team.goalAverage >= 0 ? 'text-emerald-400' : 'text-red-400'}">{team.goalAverage > 0 ? '+' : ''}{team.goalAverage}</td>
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

        {:else if phase === 'pools' && allPoolsDone}
            <!-- POOLS COMPLETE - QUALIFICATIONS -->
            <div class="flex flex-col gap-6">
                <div class="text-center pt-4">
                    <h1 class="text-3xl font-bold mb-2">{contest.name}</h1>
                    <p class="text-lg text-emerald-400">Poules terminées — Qualifications</p>
                </div>

                <div class="max-w-3xl mx-auto w-full">
                    <div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="bg-gray-750 border-b border-gray-700 text-gray-400">
                                    <th class="text-left px-4 py-3">#</th>
                                    <th class="text-left px-4 py-3">Équipe</th>
                                    <th class="text-left px-4 py-3">Poule</th>
                                    <th class="text-center px-4 py-3">V</th>
                                    <th class="text-center px-4 py-3">PF</th>
                                    <th class="text-center px-4 py-3">GA</th>
                                    <th class="text-right px-4 py-3">Qualif.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each globalRanking as team, i}
                                    {@const q = getQualification(i)}
                                    {@const isLastPrincipale = q === 'principale' && getQualification(i + 1) !== 'principale'}
                                    {@const isLastConsolante = q === 'consolante' && getQualification(i + 1) !== 'consolante'}
                                    <tr class="
                                        {q === 'principale' ? 'bg-emerald-900/20' : q === 'consolante' ? 'bg-amber-900/20' : 'bg-gray-900/40 text-gray-500'}
                                        {isLastPrincipale || isLastConsolante ? 'border-b-2 border-gray-600' : 'border-b border-gray-800'}
                                    ">
                                        <td class="px-4 py-2 font-bold">{i + 1}</td>
                                        <td class="px-4 py-2 font-medium">{team.teamName}</td>
                                        <td class="px-4 py-2 text-gray-400 text-xs">{team.poolName}</td>
                                        <td class="text-center px-4 py-2">{team.wins}</td>
                                        <td class="text-center px-4 py-2">{team.pointsFor}</td>
                                        <td class="text-center px-4 py-2 {team.goalAverage >= 0 ? 'text-emerald-400' : 'text-red-400'}">{team.goalAverage > 0 ? '+' : ''}{team.goalAverage}</td>
                                        <td class="text-right px-4 py-2">
                                            {#if q === 'principale'}
                                                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-300">Principale</span>
                                            {:else if q === 'consolante'}
                                                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/30 text-amber-300">Consolante</span>
                                            {:else}
                                                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-700 text-gray-500">Éliminée</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        {:else if phase === 'finals'}
            <!-- FINALS PLACEHOLDER -->
            <div class="flex flex-col items-center justify-center h-[80vh] gap-6">
                <h1 class="text-4xl font-bold">{contest.name}</h1>
                <div class="bg-amber-500/20 border border-amber-500/40 rounded-2xl px-8 py-4">
                    <span class="text-2xl font-bold text-amber-400">Phase finale en cours</span>
                </div>
            </div>

        {:else}
            <!-- COMPLETED PLACEHOLDER -->
            <div class="flex flex-col items-center justify-center h-[80vh] gap-6">
                <h1 class="text-4xl font-bold">{contest.name}</h1>
                <div class="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl px-8 py-4">
                    <span class="text-2xl font-bold text-emerald-400">Concours terminé</span>
                </div>
            </div>
        {/if}
    </main>
</div>

<style>
    .scroll-container {
        animation: scroll-up 30s linear infinite;
    }

    @keyframes scroll-up {
        0% { transform: translateY(0); }
        100% { transform: translateY(-50%); }
    }

    .scroll-container:hover {
        animation-play-state: paused;
    }
</style>
