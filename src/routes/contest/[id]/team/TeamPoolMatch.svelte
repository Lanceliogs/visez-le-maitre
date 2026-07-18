<script lang="ts">
    import Button from '$lib/components/button.svelte';

    let { currentMatch, completedMatches, ranking, contestId, teamToken, onRefresh } = $props<{
        currentMatch: any;
        completedMatches: any[];
        ranking: any;
        contestId: string;
        teamToken: string;
        onRefresh: () => void;
    }>();

    let scoreTeam1 = $state<number | null>(null);
    let scoreTeam2 = $state<number | null>(null);
    let submitting = $state(false);

    async function doStartMatch() {
        submitting = true;
        await fetch(`/api/contests/${contestId}/matches/${currentMatch.id}/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${teamToken}` },
        });
        submitting = false;
        onRefresh();
    }

    async function doSubmitScore() {
        if (scoreTeam1 === null || scoreTeam2 === null) return;
        submitting = true;
        const myScore = currentMatch.isTeam1 ? scoreTeam1 : scoreTeam2;
        const theirScore = currentMatch.isTeam1 ? scoreTeam2 : scoreTeam1;
        await fetch(`/api/contests/${contestId}/matches/${currentMatch.id}/score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${teamToken}`,
            },
            body: JSON.stringify({ myScore, theirScore }),
        });
        submitting = false;
        onRefresh();
    }

    async function doConfirmScore() {
        submitting = true;
        await fetch(`/api/contests/${contestId}/matches/${currentMatch.id}/confirm`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${teamToken}` },
        });
        submitting = false;
        onRefresh();
    }
</script>

{#if currentMatch}
    <div class="border rounded-lg p-4">
        <h2 class="font-semibold mb-2">Tour {currentMatch.roundNumber}</h2>
        <p class="text-sm text-gray-500 mb-3">{currentMatch.team1Name} vs {currentMatch.team2Name}</p>

        {#if currentMatch.status === 'pending'}
            {#if currentMatch.opponentBusy}
                <p class="text-sm text-orange-600">
                    ⏳ Adversaire en match — patientez
                </p>
            {:else}
                <p class="text-sm text-green-600">
                    ✓ Adversaire disponible
                </p>
                <Button
                    onclick={doStartMatch}
                    variant="primary"
                    disabled={submitting}
                    class="w-full py-3 mt-3"
                >
                    Commencer le match
                </Button>
            {/if}

        {:else if currentMatch.status === 'in_progress'}
            <div class="mt-3 flex flex-col gap-3">
                <div class="flex items-center gap-3">
                    <label class="flex-1 text-sm font-medium">
                        {currentMatch.team1Name}
                        <input
                            type="number"
                            bind:value={scoreTeam1}
                            min="0"
                            class="w-full border rounded px-3 py-2 mt-1"
                        />
                    </label>
                    <label class="flex-1 text-sm font-medium">
                        {currentMatch.team2Name}
                        <input
                            type="number"
                            bind:value={scoreTeam2}
                            min="0"
                            class="w-full border rounded px-3 py-2 mt-1"
                        />
                    </label>
                </div>
                <Button
                    onclick={doSubmitScore}
                    variant="primary"
                    disabled={submitting || scoreTeam1 === null || scoreTeam2 === null}
                    class="w-full py-3"
                >
                    Soumettre le score
                </Button>
            </div>

        {:else if currentMatch.status === 'score_submitted'}
            <div class="flex items-center justify-center gap-4 mt-1">
                <div class="text-center">
                    <p class="text-xs text-gray-500">{currentMatch.team1Name}</p>
                    <p class="text-2xl font-bold">{currentMatch.scoreTeam1}</p>
                </div>
                <span class="text-xl text-gray-400">—</span>
                <div class="text-center">
                    <p class="text-xs text-gray-500">{currentMatch.team2Name}</p>
                    <p class="text-2xl font-bold">{currentMatch.scoreTeam2}</p>
                </div>
            </div>
            {#if currentMatch.weSubmitted}
                <p class="text-sm text-gray-500 mt-2 text-center">
                    En attente de confirmation par {currentMatch.opponentName}.
                </p>
            {:else}
                <p class="text-sm text-gray-500 mt-2 text-center">
                    Score proposé par {currentMatch.opponentName}. Confirmez ou contestez.
                </p>
                <div class="flex gap-2 mt-3">
                    <Button
                        onclick={doConfirmScore}
                        variant="primary"
                        disabled={submitting}
                        class="flex-1 py-3"
                    >
                        Confirmer
                    </Button>
                    <Button
                        onclick={() => { scoreTeam1 = currentMatch.scoreTeam1; scoreTeam2 = currentMatch.scoreTeam2; }}
                        variant="danger"
                        class="flex-1 py-3"
                    >
                        Contester
                    </Button>
                </div>
                {#if scoreTeam1 !== null}
                    <div class="mt-3 flex flex-col gap-3">
                        <div class="flex items-center gap-3">
                            <label class="flex-1 text-sm font-medium">
                                {currentMatch.team1Name}
                                <input
                                    type="number"
                                    bind:value={scoreTeam1}
                                    min="0"
                                    class="w-full border rounded px-3 py-2 mt-1"
                                />
                            </label>
                            <label class="flex-1 text-sm font-medium">
                                {currentMatch.team2Name}
                                <input
                                    type="number"
                                    bind:value={scoreTeam2}
                                    min="0"
                                    class="w-full border rounded px-3 py-2 mt-1"
                                />
                            </label>
                        </div>
                        <Button
                            onclick={doSubmitScore}
                            variant="primary"
                            disabled={submitting}
                            class="w-full py-3"
                        >
                            Soumettre mon score
                        </Button>
                    </div>
                {/if}
            {/if}
        {/if}
    </div>
{:else}
    <div class="border rounded-lg p-6 text-center">
        <p class="text-lg font-medium">Phase de poules terminée</p>
        {#if ranking}
            <p class="text-3xl font-bold mt-2">{ranking.rank}e</p>
            <p class="text-sm text-gray-500 mt-1">
                {ranking.wins} victoire{ranking.wins > 1 ? 's' : ''} · {ranking.pointsFor} pts · GA {ranking.goalAverage > 0 ? '+' : ''}{ranking.goalAverage}
            </p>
            <div class="mt-3">
                {#if ranking.qualification === 'principale'}
                    <span class="inline-block bg-green-100 text-green-800 font-semibold text-sm px-3 py-1 rounded-full">
                        Qualifié — Principale
                    </span>
                {:else if ranking.qualification === 'consolante'}
                    <span class="inline-block bg-orange-100 text-orange-800 font-semibold text-sm px-3 py-1 rounded-full">
                        Qualifié — Consolante
                    </span>
                {:else}
                    <span class="inline-block bg-gray-100 text-gray-600 font-semibold text-sm px-3 py-1 rounded-full">
                        Éliminé
                    </span>
                {/if}
            </div>
        {:else}
            <p class="text-sm text-gray-500 mt-2">En attente des résultats.</p>
        {/if}
    </div>
{/if}

{#if completedMatches.length > 0}
    <div class="border rounded-lg p-4">
        <h2 class="font-semibold mb-2">Résultats</h2>
        <div class="flex flex-col gap-2">
            {#each completedMatches as match}
                <div class="flex justify-between items-center border rounded p-2">
                    <span class="text-sm">
                        T{match.roundNumber} — {match.team1Name} vs {match.team2Name}
                    </span>
                    <span class="text-sm font-bold {match.won ? 'text-green-600' : 'text-red-500'}">
                        {match.scoreTeam1} - {match.scoreTeam2}
                    </span>
                </div>
            {/each}
        </div>
    </div>
{/if}
