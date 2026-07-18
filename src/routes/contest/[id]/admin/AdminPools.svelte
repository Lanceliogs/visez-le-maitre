<script lang="ts">
    import { onMount } from 'svelte';
    import Button from '$lib/components/button.svelte';

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
        await refresh();
    });

    $effect(() => {
        if (refreshTick > 0) refresh();
    });

    function allMatchesCompleted() {
        return matchList.length > 0 && matchList.every(m => m.status === 'completed');
    }

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

    function statusLabel(status: string) {
        switch (status) {
            case 'pending': return 'En attente';
            case 'in_progress': return 'En cours';
            case 'score_submitted': return 'Score soumis';
            case 'completed': return 'Terminé';
            default: return status;
        }
    }

    function statusColor(status: string) {
        switch (status) {
            case 'pending': return 'text-text-muted';
            case 'in_progress': return 'text-blue-600';
            case 'score_submitted': return 'text-orange-600';
            case 'completed': return 'text-green-600';
            default: return '';
        }
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
        <div class="border border-card-border bg-white rounded-lg p-4">
            <h2 class="font-semibold mb-2">{pool.name}</h2>
            <div class="flex flex-wrap gap-1 mb-3">
                {#each pool.teams as team}
                    <span class="text-xs bg-primary-light rounded px-2 py-1">{team.name}</span>
                {/each}
            </div>
            {#if standingsForPool(pool.id).length > 0}
                <table class="w-full text-xs mb-3">
                    <thead>
                        <tr class="text-left text-text-muted border-b">
                            <th class="py-1">#</th>
                            <th class="py-1">Équipe</th>
                            <th class="py-1 text-center">V</th>
                            <th class="py-1 text-center">D</th>
                            <th class="py-1 text-center">PM</th>
                            <th class="py-1 text-center">GA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each standingsForPool(pool.id) as team, i}
                            <tr class="border-b last:border-0">
                                <td class="py-1 text-text-muted">{i + 1}</td>
                                <td class="py-1 font-medium">{team.teamName}</td>
                                <td class="py-1 text-center">{team.wins}</td>
                                <td class="py-1 text-center">{team.losses}</td>
                                <td class="py-1 text-center">{team.pointsFor}</td>
                                <td class="py-1 text-center">{team.goalAverage > 0 ? '+' : ''}{team.goalAverage}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
            <div class="flex flex-col gap-1">
                {#each matchesForPool(pool.id) as match}
                    <div class="flex items-center justify-between border rounded px-2 py-1 text-sm">
                        <div class="flex-1">
                            <span class="font-medium">{match.team1Name}</span>
                            <span class="text-text-muted mx-1">vs</span>
                            <span class="font-medium">{match.team2Name}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            {#if match.status === 'completed'}
                                <span class="font-bold">{match.scoreTeam1} - {match.scoreTeam2}</span>
                            {:else if match.status === 'score_submitted'}
                                <span class="text-orange-600">{match.scoreTeam1} - {match.scoreTeam2} ?</span>
                            {/if}
                            <span class="text-xs {statusColor(match.status)}">{statusLabel(match.status)}</span>
                            {#if match.status !== 'completed'}
                                <button
                                    onclick={() => openForce(match.id, match.scoreTeam1, match.scoreTeam2)}
                                    class="text-xs text-red-500 hover:text-red-700 ml-1"
                                >
                                    Forcer
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/each}
{/if}

<div class="border border-card-border bg-white rounded-lg p-4 flex flex-col gap-3">
    <p class="text-sm text-text-muted">
        {matchList.filter(m => m.status === 'completed').length} / {matchList.length} matchs terminés
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
