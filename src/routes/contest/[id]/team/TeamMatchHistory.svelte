<script lang="ts">
    let { completedMatches } = $props<{
        completedMatches: any[];
    }>();
</script>

{#if completedMatches.length > 0}
    <div class="border border-card-border bg-white rounded-lg p-4">
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
