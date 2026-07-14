<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    
    let adminContests = $state<{ id: string; name: string }[]>([]);
    let teamContests = $state<{ id: string; name: string }[]>([]);

    onMount(() => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)!;
            if (key.startsWith('admin_')) {
                const data = JSON.parse(localStorage.getItem(key)!);
                adminContests.push({ id: data.contestId, name: data.contestName });
            } else if (key.startsWith('team_')) {
                const data = JSON.parse(localStorage.getItem(key)!);
                teamContests.push({ id: data.contestId, name: data.contestName });
            }
        }
    });
</script>

<div class="flex flex-col gap-4">
    <a
        href="/create"
        class="block w-full bg-indigo-600 text-white font-semibold py-4 rounded-lg hover:bg-indigo-700 transition text-center"
    >
      Créer un concours
    </a>
    {#if adminContests.length > 0}
        <section>
            <h2 class="text-sm font-medium text-gray-500 mb-2">Mes concours (admin)</h2>
            <div class="flex flex-col gap-3">
                {#each adminContests as contest}
                    <a href="/contest/{contest.id}/admin" class="border rounded-lg p-4 hover:shadow transition block">
                        <p class="font-semibold">{contest.name}</p>
                    </a>
                {/each}
            </div>
        </section>
    {/if}
    {#if teamContests.length > 0}
        <section>
            <h2 class="text-sm font-medium text-gray-500 mb-2">Mes concours (équipe)</h2>
            <div class="flex flex-col gap-3">
                {#each teamContests as contest}
                    <a href="/contest/{contest.id}" class="border rounded-lg p-4 hover:shadow transition block">
                        <p class="font-semibold">{contest.name}</p>
                    </a>
                {/each}
            </div>
        </section>
    {/if}
    {#if adminContests.length === 0 && teamContests.length === 0}
        <p class="text-sm text-gray-400 italic text-center">Aucun concours pour le moment.</p>
    {/if}
</div>