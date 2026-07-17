<script lang="ts">
    import Button from '$lib/components/button.svelte';

    let { currentMatch, completedMatches, contestId, teamToken } = $props<{
        currentMatch: any;
        completedMatches: any[];
        contestId: string;
        teamToken: string;
    }>();
</script>

{#if currentMatch}
    <div class="border rounded-lg p-4">
        <h2 class="font-semibold mb-2">Tour {currentMatch.roundNumber}</h2>

        {#if currentMatch.status === 'pending'}
            <p class="text-lg font-medium">
                Prochain match : vs {currentMatch.opponentName}
            </p>
            {#if currentMatch.opponentBusy}
                <p class="text-sm text-orange-600 mt-2">
                    ⏳ Adversaire en match — patientez
                </p>
            {:else}
                <p class="text-sm text-green-600 mt-2">
                    ✓ Adversaire disponible — vous pouvez jouer !
                </p>
            {/if}

        {:else if currentMatch.status === 'in_progress'}
            <p class="text-lg font-medium">
                En cours : vs {currentMatch.opponentName}
            </p>
            <p class="text-sm text-gray-500 mt-2">
                Saisissez le score une fois la partie terminée.
            </p>
            <!-- Score input will be added here -->

        {:else if currentMatch.status === 'score_submitted'}
            {#if currentMatch.weSubmitted}
                <p class="text-lg font-medium">Score soumis</p>
                <p class="text-2xl font-bold mt-1">
                    {currentMatch.myScore} — {currentMatch.theirScore}
                </p>
                <p class="text-sm text-gray-500 mt-2">
                    En attente de confirmation par {currentMatch.opponentName}.
                </p>
            {:else}
                <p class="text-lg font-medium">Score proposé par {currentMatch.opponentName}</p>
                <p class="text-2xl font-bold mt-1">
                    {currentMatch.myScore} — {currentMatch.theirScore}
                </p>
                <p class="text-sm text-gray-500 mt-2">
                    Confirmez ou contestez ce score.
                </p>
                <!-- Confirm/dispute buttons will be added here -->
            {/if}
        {/if}
    </div>
{:else}
    <div class="border rounded-lg p-6 text-center">
        <p class="text-lg font-medium">Phase de poules terminée</p>
        <p class="text-sm text-gray-500 mt-2">En attente des résultats.</p>
    </div>
{/if}

{#if completedMatches.length > 0}
    <div class="border rounded-lg p-4">
        <h2 class="font-semibold mb-2">Résultats</h2>
        <div class="flex flex-col gap-2">
            {#each completedMatches as match}
                <div class="flex justify-between items-center border rounded p-2">
                    <span class="text-sm">
                        Tour {match.roundNumber} — vs {match.opponentName}
                    </span>
                    <span class="text-sm font-bold {match.won ? 'text-green-600' : 'text-red-500'}">
                        {match.myScore} - {match.theirScore}
                    </span>
                </div>
            {/each}
        </div>
    </div>
{/if}
