<script lang="ts">
    import { page } from '$app/state';
    import { onMount, onDestroy } from 'svelte';
    import AdminRegistration from './AdminRegistration.svelte';
    import AdminPools from './AdminPools.svelte';
    import AdminBrackets from './AdminBrackets.svelte';

    let contest = $state<any>(null);
    let adminToken = $state('');
    let teamList = $state<any[]>([]);
    let refreshTick = $state(0);
    let eventSource: EventSource | null = null;

    onMount(async () => {
        const id = page.params.id;
        const urlToken = new URLSearchParams(window.location.search).get('token');
        if (urlToken) {
            localStorage.setItem(`admin_${id}`, JSON.stringify({ token: urlToken }));
            adminToken = urlToken;
            history.replaceState(null, '', window.location.pathname);
        } else {
            const stored = localStorage.getItem(`admin_${id}`);
            if (stored) {
                adminToken = JSON.parse(stored).token;
            }
        }
        const contestRes = await fetch(`/api/contests/${id}`);
        contest = await contestRes.json();
        const teamsRes = await fetch(`/api/contests/${id}/teams`);
        teamList = await teamsRes.json();

        eventSource = new EventSource(`/api/contests/${id}/events`);
        const onRefresh = () => { refreshAll(); refreshTick++; };
        eventSource.addEventListener('refresh', onRefresh);
        eventSource.addEventListener('open', onRefresh);
    });

    onDestroy(() => {
        eventSource?.close();
    });

    async function refreshAll() {
        const id = page.params.id;
        const [contestRes, teamsRes] = await Promise.all([
            fetch(`/api/contests/${id}`),
            fetch(`/api/contests/${id}/teams`),
        ]);
        contest = await contestRes.json();
        teamList = await teamsRes.json();
    }

    async function reload() {
        await refreshAll();
    }
</script>

{#if !contest}
    <p class="text-center text-text-muted">Chargement...</p>
{:else}
    <div class="flex flex-col gap-4">
        <div class="border border-card-border bg-white rounded-lg p-4">
            <h1 class="text-xl font-bold mb-1">{contest.name}</h1>
            <p class="text-sm text-text-muted">
                Statut : {contest.status === 'registration' ? 'Inscriptions ouvertes' : contest.status === 'pools' ? 'Phase de poules' : contest.status === 'finals' ? 'Finales' : 'Terminé'}
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
            <AdminPools contestId={page.params.id!} {adminToken} {refreshTick} />
        {:else if contest.status === 'finals'}
            <AdminBrackets contestId={page.params.id!} {adminToken} {refreshTick} />
        {:else if contest.status === 'completed'}
            <div class="border border-card-border bg-white rounded-lg p-4 text-center">
                <p class="text-lg font-semibold text-primary">Concours terminé</p>
            </div>
            <AdminBrackets contestId={page.params.id!} {adminToken} {refreshTick} />
        {/if}
    </div>
{/if}
