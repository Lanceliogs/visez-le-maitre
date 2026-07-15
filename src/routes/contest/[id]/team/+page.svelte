<script lang="ts">
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    
    let contest = $state<any>(null);
    let team = $state<any>(null);
    let errorMsg = $state('');

    onMount(async () => {
        const stored = localStorage.getItem(`team_${page.params.id}`);
        if (!stored) {
            errorMsg = 'Aucun token trouvé pour ce concours.';
            return;
        }
        const { token } = JSON.parse(stored);
        const contestRes = await fetch(`/api/contests/${page.params.id}`);
        if (!contestRes.ok) {
            errorMsg = 'Concours introuvable';
            return;
        }
        contest = await contestRes.json();
        const teamRes = await fetch(`/api/contests/${page.params.id}/status`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!teamRes.ok) {
            errorMsg = 'Impossible de charger votre équipe';
            return;
        }
        team = await teamRes.json();
    });
</script>

{#if errorMsg}
    <p class="text-center text-red-500">{errorMsg}</p>
{:else if !contest || !team}
    <p class="text-center text-gray-400">Chargement...</p>
{:else}
    <div class="flex flex-col gap-4">
        <div class="border rounded-lg p-4">
            <h1 class="text-xl font-bold mb-1">{contest.name}</h1>
            <p class="text-sm text-gray-500">Équipe : {team.name}</p>
        </div>
        <div class="border rounded-lg p-6 text-center">
            {#if contest.status === 'registration'}
                <p class="text-lg font-medium">Vous êtes inscrits !</p>
                <p class="text-sm text-gray-500 mt-2">En attente du début du concours.</p>
            {:else}
                <p class="text-lg font-medium">Concours en cours</p>
            {/if}
        </div>
    </div>
{/if}