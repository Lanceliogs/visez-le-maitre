<script lang="ts">
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import AdminRegistration from './AdminRegistration.svelte';
    import AdminPools from './AdminPools.svelte';

    let contest = $state<any>(null);
    let adminToken = $state('');
    let teamList = $state<any[]>([]);

    onMount(async () => {
        const id = page.params.id;
        const stored = localStorage.getItem(`admin_${id}`);
        if (stored) {
            adminToken = JSON.parse(stored).token;
        }
        const contestRes = await fetch(`/api/contests/${id}`);
        contest = await contestRes.json();
        const teamsRes = await fetch(`/api/contests/${id}/teams`);
        teamList = await teamsRes.json();
    });

    async function reload() {
        const res = await fetch(`/api/contests/${page.params.id}`);
        contest = await res.json();
    }
</script>

{#if !contest}
    <p class="text-center text-gray-400">Chargement...</p>
{:else}
    <div class="flex flex-col gap-4">
        <div class="border rounded-lg p-4">
            <h1 class="text-xl font-bold mb-1">{contest.name}</h1>
            <p class="text-sm text-gray-500">
                Statut : {contest.status === 'registration' ? 'Inscriptions ouvertes' : 'Phase de poules'}
            </p>
        </div>

        {#if contest.status === 'registration'}
            <AdminRegistration
                contestId={page.params.id!}
                {adminToken}
                {teamList}
                onStart={reload}
            />
        {:else if contest.status === 'pools'}
            <AdminPools contestId={page.params.id!} />
        {/if}
    </div>
{/if}
