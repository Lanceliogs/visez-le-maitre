<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    
    let adminContests = $state<{ id: string; name: string }[]>([]);
    let teamContests = $state<{ id: string; name: string }[]>([]);

    onMount(async () => {
        const admins: { key: string; id: string; name: string }[] = [];
        const teams: { key: string; id: string; name: string }[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)!;
            if (key.startsWith('admin_')) {
                const data = JSON.parse(localStorage.getItem(key)!);
                admins.push({ key, id: data.contestId, name: data.contestName });
            } else if (key.startsWith('team_')) {
                const data = JSON.parse(localStorage.getItem(key)!);
                teams.push({ key, id: data.contestId, name: data.contestName });
            }
        }

        const allIds = [...new Set([...admins.map(a => a.id), ...teams.map(t => t.id)])];
        const valid = new Set<string>();

        await Promise.all(allIds.map(async (id) => {
            const res = await fetch(`/api/contests/${id}`);
            if (res.ok) valid.add(id);
        }));

        for (const entry of admins) {
            if (valid.has(entry.id)) {
                adminContests.push({ id: entry.id, name: entry.name });
            } else {
                localStorage.removeItem(entry.key);
            }
        }

        for (const entry of teams) {
            if (valid.has(entry.id)) {
                teamContests.push({ id: entry.id, name: entry.name });
            } else {
                localStorage.removeItem(entry.key);
            }
        }
    });
</script>

<div class="flex flex-col gap-4">
    <a
        href="/create"
        class="block w-full bg-primary text-white font-semibold py-4 rounded-lg hover:bg-primary-hover shadow-sm transition text-center"
    >
      Créer un concours
    </a>
    {#if adminContests.length > 0}
        <section>
            <h2 class="text-sm font-medium text-text-muted mb-2">Mes concours (admin)</h2>
            <div class="flex flex-col gap-3">
                {#each adminContests as contest}
                    <a href="/contest/{contest.id}/admin" class="border border-card-border bg-white rounded-lg p-4 hover:shadow-md transition block">
                        <p class="font-semibold">{contest.name}</p>
                    </a>
                {/each}
            </div>
        </section>
    {/if}
    {#if teamContests.length > 0}
        <section>
            <h2 class="text-sm font-medium text-text-muted mb-2">Mes concours (équipe)</h2>
            <div class="flex flex-col gap-3">
                {#each teamContests as contest}
                    <a href="/contest/{contest.id}/team" class="border border-card-border bg-white rounded-lg p-4 hover:shadow-md transition block">
                        <p class="font-semibold">{contest.name}</p>
                    </a>
                {/each}
            </div>
        </section>
    {/if}
    {#if adminContests.length === 0 && teamContests.length === 0}
        <p class="text-sm text-text-muted italic text-center">Aucun concours pour le moment.</p>
    {/if}
</div>