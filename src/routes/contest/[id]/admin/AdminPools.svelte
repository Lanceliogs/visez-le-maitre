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
    let forceMatchId = $state<string | null>(null);
    let forceScore1 = $state<number | null>(null);
    let forceScore2 = $state<number | null>(null);
    let submitting = $state(false);

    onMount(async () => {
        await refresh();
    });

    $effect(() => {
        if (refreshTick > 0) refresh();
    });

    async function refresh() {
        const [poolsRes, matchesRes] = await Promise.all([
            fetch(`/api/contests/${contestId}/pools`),
            fetch(`/api/contests/${contestId}/matches`),
        ]);
        if (poolsRes.ok) poolList = await poolsRes.json();
        if (matchesRes.ok) matchList = await matchesRes.json();
    }

    function matchesForPool(poolId: string) {
        return matchList
            .filter(m => m.poolId === poolId)
            .sort((a, b) => a.roundNumber - b.roundNumber);
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
            case 'pending': return 'text-gray-400';
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
    <p class="text-center text-gray-400">Chargement des poules...</p>
{:else}
    {#each poolList as pool}
        <div class="border rounded-lg p-4">
            <h2 class="font-semibold mb-2">{pool.name}</h2>
            <div class="flex flex-wrap gap-1 mb-3">
                {#each pool.teams as team}
                    <span class="text-xs bg-gray-100 rounded px-2 py-1">{team.name}</span>
                {/each}
            </div>
            <div class="flex flex-col gap-1">
                {#each matchesForPool(pool.id) as match}
                    <div class="flex items-center justify-between border rounded px-2 py-1 text-sm">
                        <div class="flex-1">
                            <span class="font-medium">{match.team1Name}</span>
                            <span class="text-gray-400 mx-1">vs</span>
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
