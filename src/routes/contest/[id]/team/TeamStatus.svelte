<script lang="ts">
    let { phase, ranking, bracketDone = false } = $props<{
        phase: string;
        ranking: any;
        bracketDone?: boolean;
    }>();
</script>

<div class="border border-card-border bg-white rounded-lg p-6 text-center">
    {#if phase === 'finals' && bracketDone}
        <p class="text-lg font-medium">Matchs terminés</p>
        <p class="text-sm text-text-muted mt-2">Le score final sera affiché à la fin du tournoi.</p>
    {:else if phase === 'finals' && ranking?.qualification !== 'eliminee'}
        <p class="text-lg font-medium">En attente du prochain tour</p>
        <p class="text-sm text-text-muted mt-2">Votre match est terminé, les autres matchs sont en cours.</p>
    {:else if phase === 'finals' && ranking?.qualification === 'eliminee'}
        <p class="text-lg font-medium">Concours terminé pour vous</p>
        {#if ranking}
            <p class="text-3xl font-bold mt-2">{ranking.rank}e</p>
            <span class="inline-block bg-primary-light text-gray-600 font-semibold text-sm px-3 py-1 rounded-full mt-2">
                Éliminé en poules
            </span>
        {/if}
    {:else}
        <p class="text-lg font-medium">Phase de poules terminée</p>
        {#if ranking}
            <p class="text-3xl font-bold mt-2">{ranking.rank}e</p>
            <p class="text-sm text-text-muted mt-1">
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
                    <span class="inline-block bg-primary-light text-gray-600 font-semibold text-sm px-3 py-1 rounded-full">
                        Éliminé
                    </span>
                {/if}
            </div>
        {:else}
            <p class="text-sm text-text-muted mt-2">Classement en cours de calcul...</p>
        {/if}
    {/if}
</div>
