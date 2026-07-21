<script lang="ts">
    import { page } from '$app/state';
    import { onMount, onDestroy } from 'svelte';
    import LiveRegistration from './LiveRegistration.svelte';
    import LivePools from './LivePools.svelte';
    import LiveBrackets from './LiveBrackets.svelte';
    import LiveCompleted from './LiveCompleted.svelte';
    import type { ContestView, TeamView, MatchView, PoolStandings } from '$lib/types';

    let contest = $state<ContestView | null>(null);
    let teams = $state<TeamView[]>([]);
    let matches = $state<MatchView[]>([]);
    let standings = $state<PoolStandings[]>([]);
    let eventSource: EventSource | null = null;

    const contestId = page.params.id;

    onMount(async () => {
        await fetchAll();

        eventSource = new EventSource(`/api/contests/${contestId}/events`);
        eventSource.addEventListener('refresh', fetchAll);
        eventSource.addEventListener('open', fetchAll);
    });

    onDestroy(() => {
        eventSource?.close();
    });

    async function fetchAll() {
        const [contestRes, teamsRes, matchesRes, standingsRes] = await Promise.all([
            fetch(`/api/contests/${contestId}`),
            fetch(`/api/contests/${contestId}/teams`),
            fetch(`/api/contests/${contestId}/matches`),
            fetch(`/api/contests/${contestId}/standings`),
        ]);
        if (contestRes.ok) contest = await contestRes.json();
        if (teamsRes.ok) teams = await teamsRes.json();
        if (matchesRes.ok) matches = await matchesRes.json();
        if (standingsRes.ok) standings = await standingsRes.json();
    }

    let phase = $derived(contest?.status ?? 'registration');
</script>

<svelte:head>
    <title>{contest?.name ?? 'Live'} — Visez Le Maître</title>
</svelte:head>

{#if !contest}
    <p class="text-center text-text-muted">Chargement...</p>
{:else if phase === 'registration'}
    <LiveRegistration {contest} {teams} />
{:else if phase === 'pools'}
    <LivePools {contest} {matches} {standings} />
{:else if phase === 'finals'}
    <LiveBrackets {contest} {matches} />
{:else}
    <LiveCompleted {contest} {matches} />
{/if}
