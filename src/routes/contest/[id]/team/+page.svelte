<script lang="ts">
    import { page } from '$app/state';
    import { onMount, onDestroy } from 'svelte';
    import TeamWaiting from './TeamWaiting.svelte';
    import TeamPoolMatch from './TeamPoolMatch.svelte';

    let contest = $state<any>(null);
    let team = $state<any>(null);
    let teamToken = $state('');
    let errorMsg = $state('');
    let eventSource: EventSource | null = null;

    onMount(async () => {
        const stored = localStorage.getItem(`team_${page.params.id}`);
        if (!stored) {
            errorMsg = 'Aucun token trouvé pour ce concours.';
            return;
        }
        const { token } = JSON.parse(stored);
        teamToken = token;

        const contestRes = await fetch(`/api/contests/${page.params.id}`);
        if (!contestRes.ok) {
            errorMsg = 'Concours introuvable';
            return;
        }
        contest = await contestRes.json();

        const statusRes = await fetch(`/api/contests/${page.params.id}/status`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!statusRes.ok) {
            errorMsg = 'Impossible de charger votre équipe';
            return;
        }
        team = await statusRes.json();

        eventSource = new EventSource(`/api/contests/${page.params.id}/events`);
        eventSource.addEventListener('refresh', () => refreshStatus());
    });

    onDestroy(() => {
        eventSource?.close();
    });

    async function refreshStatus() {
        const res = await fetch(`/api/contests/${page.params.id}/status`, {
            headers: { 'Authorization': `Bearer ${teamToken}` },
        });
        if (res.ok) team = await res.json();
    }
</script>

{#if errorMsg}
    <p class="text-center text-red-500">{errorMsg}</p>
{:else if !contest || !team}
    <p class="text-center text-text-muted">Chargement...</p>
{:else}
    <div class="flex flex-col gap-4">
        <div class="border border-card-border bg-white rounded-lg p-4">
            <h1 class="text-xl font-bold mb-1">{contest.name}</h1>
            <p class="text-sm text-text-muted">Équipe : {team.name}</p>
        </div>

        {#if team.phase === 'registration'}
            <TeamWaiting />
        {:else if team.phase === 'pools'}
            <TeamPoolMatch
                currentMatch={team.currentMatch}
                completedMatches={team.completedMatches}
                ranking={team.ranking}
                contestId={page.params.id!}
                {teamToken}
                onRefresh={refreshStatus}
            />
        {:else if team.phase === 'finals'}
            <TeamPoolMatch
                currentMatch={team.currentMatch}
                completedMatches={team.completedMatches}
                ranking={team.ranking}
                contestId={page.params.id!}
                {teamToken}
                onRefresh={refreshStatus}
            />
        {:else if team.phase === 'completed'}
            <div class="border border-card-border bg-white rounded-lg p-4 text-center">
                <p class="text-lg font-semibold text-primary">Concours terminé</p>
                {#if team.finalRank}
                    <p class="text-3xl font-bold mt-2">{team.finalRank.finalRank}e</p>
                    <div class="mt-2">
                        {#if team.finalRank.bracket === 'principale'}
                            <span class="inline-block bg-green-100 text-green-800 font-semibold text-sm px-3 py-1 rounded-full">
                                Principale
                            </span>
                        {:else if team.finalRank.bracket === 'consolante'}
                            <span class="inline-block bg-orange-100 text-orange-800 font-semibold text-sm px-3 py-1 rounded-full">
                                Consolante
                            </span>
                        {:else}
                            <span class="inline-block bg-gray-100 text-gray-600 font-semibold text-sm px-3 py-1 rounded-full">
                                Éliminée en poules
                            </span>
                        {/if}
                    </div>
                {:else}
                    <p class="text-sm text-text-muted mt-2">Merci pour votre participation !</p>
                {/if}
            </div>
            {#if team.completedMatches?.length > 0}
                <div class="border border-card-border bg-white rounded-lg p-4">
                    <h2 class="font-semibold mb-2">Vos matchs</h2>
                    <div class="flex flex-col gap-1">
                        {#each team.completedMatches as match}
                            <div class="flex items-center justify-between text-sm border-b border-gray-100 py-1 last:border-0">
                                <span class="font-medium">vs {match.opponentName}</span>
                                <span class="font-bold {match.won ? 'text-green-600' : 'text-red-500'}">
                                    {match.scoreTeam1} - {match.scoreTeam2}
                                </span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        {/if}
    </div>
{/if}
