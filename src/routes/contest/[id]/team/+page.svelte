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
        {/if}
    </div>
{/if}
