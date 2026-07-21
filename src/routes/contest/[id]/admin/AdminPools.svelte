<script lang="ts">
    import { onMount } from 'svelte';
    import Button from '$lib/components/button.svelte';
    import MatchCardDone from '$lib/components/match-card-done.svelte';
    import MatchCardActive from '$lib/components/match-card-active.svelte';
    import ChevronRight from '@lucide/svelte/icons/chevron-right';

    let { contestId, adminToken, refreshTick } = $props<{
        contestId: string;
        adminToken: string;
        refreshTick: number;
    }>();

    let poolList = $state<any[]>([]);
    let matchList = $state<any[]>([]);
    let standings = $state<any[]>([]);
    let forceMatchId = $state<string | null>(null);
    let forceScore1 = $state<number | null>(null);
    let forceScore2 = $state<number | null>(null);
    let submitting = $state(false);
    let autoTransition = $state(false);
    let transitioning = $state(false);

    onMount(async () => {
        autoTransition = localStorage.getItem(`autoTransition_${contestId}`) === 'true';
        await refresh();
    });

    $effect(() => {
        if (refreshTick > 0) refresh();
    });

    let poolMatches = $derived(matchList.filter(m => m.poolId !== null));

    function allMatchesCompleted() {
        return poolMatches.length > 0 && poolMatches.every(m => m.status === 'completed');
    }

    $effect(() => {
        localStorage.setItem(`autoTransition_${contestId}`, String(autoTransition));
    });

    $effect(() => {
        if (autoTransition && allMatchesCompleted() && !transitioning) {
            doStartFinals();
        }
    });

    async function doStartFinals() {
        transitioning = true;
        await fetch(`/api/contests/${contestId}/start-finals`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
        });
        transitioning = false;
    }

    async function refresh() {
        const [poolsRes, matchesRes, standingsRes] = await Promise.all([
            fetch(`/api/contests/${contestId}/pools`),
            fetch(`/api/contests/${contestId}/matches`),
            fetch(`/api/contests/${contestId}/standings`),
        ]);
        if (poolsRes.ok) poolList = await poolsRes.json();
        if (matchesRes.ok) matchList = await matchesRes.json();
        if (standingsRes.ok) standings = await standingsRes.json();
    }

    function matchesForPool(poolId: string) {
        return matchList
            .filter(m => m.poolId === poolId)
            .sort((a, b) => a.roundNumber - b.roundNumber);
    }

    function standingsForPool(poolId: string) {
        const pool = standings.find(s => s.poolId === poolId);
        return pool?.standings ?? [];
    }


    function openForce(matchId: string, currentScore1: number | null, currentScore2: number | null) {
        forceMatchId = matchId;
        forceScore1 = currentScore1 ?? 0;
        forceScore2 = currentScore2 ?? 0;
    }

    async function doForceScore() {
        if (!forceMatchId || forceScore1 === null || forceScore2 === null) return;
        submitting = true;
        await fetch(`/api/contests/${contestId}/matches/${forceMatchId}/force`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ scoreTeam1: forceScore1, scoreTeam2: forceScore2 }),
        });
        forceMatchId = null;
        submitting = false;
        await refresh();
    }
</script>

{#if poolList.length === 0}
    <p class="text-center text-text-muted">Chargement des poules...</p>
{:else}
    {#each poolList as pool}
        {@const poolMatchList = matchesForPool(pool.id)}
        {@const doneCount = poolMatchList.filter(m => m.status === 'completed').length}
        {@const activeCount = poolMatchList.filter(m => m.status === 'in_progress' || m.status === 'score_submitted').length}
        <details class="border border-card-border bg-white rounded-lg group">
            <summary class="flex items-center justify-between px-4 py-3 cursor-pointer select-none">
                <div class="flex items-center gap-2">
                    <ChevronRight size={16} class="text-text-muted transition-transform group-open:rotate-90" />
                    <span class="font-semibold">{pool.name}</span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                    {#if activeCount > 0}
                        <span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{activeCount} en cours</span>
                    {/if}
                    <span class="text-text-muted">{doneCount}/{poolMatchList.length}</span>
                </div>
            </summary>
            <div class="px-4 pb-4 flex flex-col gap-3">
                {#if standingsForPool(pool.id).length > 0}
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="text-left text-text-muted border-b">
                                <th class="py-1">#</th>
                                <th class="py-1">Équipe</th>
                                <th class="py-1 text-center">V</th>
                                <th class="py-1 text-center">PF</th>
                                <th class="py-1 text-center">GA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each standingsForPool(pool.id) as team, i}
                                <tr class="border-b last:border-0">
                                    <td class="py-1 text-text-muted">{i + 1}</td>
                                    <td class="py-1 font-medium">{team.teamName}</td>
                                    <td class="py-1 text-center">{team.wins}</td>
                                    <td class="py-1 text-center">{team.pointsFor}</td>
                                    <td class="py-1 text-center {team.goalAverage >= 0 ? 'text-green-600' : 'text-red-500'}">{team.goalAverage > 0 ? '+' : ''}{team.goalAverage}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}
                <div class="flex flex-col gap-1">
                    {#each poolMatchList as match}
                        {#if match.status === 'completed'}
                            <MatchCardDone
                                team1Name={match.team1Name}
                                team2Name={match.team2Name}
                                scoreTeam1={match.scoreTeam1}
                                scoreTeam2={match.scoreTeam2}
                                winnerId={match.winnerId}
                                team1Id={match.team1Id}
                                team2Id={match.team2Id}
                            />
                        {:else}
                            <MatchCardActive
                                team1Name={match.team1Name}
                                team2Name={match.team2Name}
                                status={match.status}
                                onForce={() => openForce(match.id, match.scoreTeam1, match.scoreTeam2)}
                            />
                        {/if}
                    {/each}
                </div>
            </div>
        </details>
    {/each}
{/if}

<div class="border border-card-border bg-white rounded-lg p-4 flex flex-col gap-3">
    <p class="text-sm text-text-muted">
        {poolMatches.filter(m => m.status === 'completed').length} / {poolMatches.length} matchs terminés
    </p>
    {#if allMatchesCompleted()}
        <p class="text-sm text-green-600 font-medium">✓ Tous les matchs de poule sont terminés</p>
        <Button
            onclick={doStartFinals}
            variant="primary"
            disabled={transitioning}
            class="w-full py-3"
        >
            {transitioning ? 'Transition...' : 'Lancer les finales'}
        </Button>
    {:else}
        <label class="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" bind:checked={autoTransition} class="rounded" />
            Passer en finales automatiquement quand tous les matchs sont terminés
        </label>
    {/if}
</div>

{#if forceMatchId}
    {@const match = matchList.find(m => m.id === forceMatchId)}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 class="font-semibold mb-3">Forcer le score</h2>
            {#if match}
                <div class="flex items-center gap-3 mb-4">
                    <label class="flex-1 text-sm font-medium">
                        {match.team1Name}
                        <input
                            type="number"
                            bind:value={forceScore1}
                            min="0"
                            class="w-full border rounded px-3 py-2 mt-1"
                        />
                    </label>
                    <label class="flex-1 text-sm font-medium">
                        {match.team2Name}
                        <input
                            type="number"
                            bind:value={forceScore2}
                            min="0"
                            class="w-full border rounded px-3 py-2 mt-1"
                        />
                    </label>
                </div>
            {/if}
            <div class="flex gap-2">
                <Button onclick={doForceScore} variant="danger" disabled={submitting} class="flex-1 py-2">
                    Valider
                </Button>
                <Button onclick={() => forceMatchId = null} class="flex-1 py-2">
                    Annuler
                </Button>
            </div>
        </div>
    </div>
{/if}
