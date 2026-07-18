<script lang="ts">
    import { page } from '$app/state';
    import { onMount, onDestroy } from 'svelte';

    let contest = $state<any>(null);
    let standings = $state<any[]>([]);
    let eventSource: EventSource | null = null;

    onMount(async () => {
        const id = page.params.id;
        const contestRes = await fetch(`/api/contests/${id}`);
        if (contestRes.ok) contest = await contestRes.json();
        await refreshStandings();

        eventSource = new EventSource(`/api/contests/${id}/events`);
        eventSource.addEventListener('refresh', () => refreshStandings());
    });

    onDestroy(() => {
        eventSource?.close();
    });

    async function refreshStandings() {
        const res = await fetch(`/api/contests/${page.params.id}/standings`);
        if (res.ok) standings = await res.json();
    }
</script>

{#if !contest}
    <p class="text-center text-gray-400">Chargement...</p>
{:else}
    <div class="flex flex-col gap-4">
        <div class="border rounded-lg p-4">
            <h1 class="text-xl font-bold mb-1">{contest.name}</h1>
            <p class="text-sm text-gray-500">Classement des poules</p>
        </div>

        {#each standings as pool}
            <div class="border rounded-lg p-4">
                <h2 class="font-semibold mb-2">{pool.poolName}</h2>
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-gray-500 border-b">
                            <th class="py-1">#</th>
                            <th class="py-1">Équipe</th>
                            <th class="py-1 text-center">J</th>
                            <th class="py-1 text-center">V</th>
                            <th class="py-1 text-center">D</th>
                            <th class="py-1 text-center">PM</th>
                            <th class="py-1 text-center">PE</th>
                            <th class="py-1 text-center">GA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each pool.standings as team, i}
                            <tr class="border-b last:border-0">
                                <td class="py-1 text-gray-400">{i + 1}</td>
                                <td class="py-1 font-medium">{team.teamName}</td>
                                <td class="py-1 text-center">{team.played}</td>
                                <td class="py-1 text-center">{team.wins}</td>
                                <td class="py-1 text-center">{team.losses}</td>
                                <td class="py-1 text-center">{team.pointsFor}</td>
                                <td class="py-1 text-center">{team.pointsAgainst}</td>
                                <td class="py-1 text-center">{team.goalAverage > 0 ? '+' : ''}{team.goalAverage}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/each}
    </div>
{/if}
