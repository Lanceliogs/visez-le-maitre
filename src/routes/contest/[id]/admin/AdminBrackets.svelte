<script lang="ts">
    import { onMount } from 'svelte';
    import Button from '$lib/components/button.svelte';

    let { contestId, adminToken, refreshTick } = $props<{
        contestId: string;
        adminToken: string;
        refreshTick: number;
    }>();

    let matchList = $state<any[]>([]);
    let autoTransition = $state(false);
    let advancingPrincipale = $state(false);
    let advancingConsolante = $state(false);
    let forceMatchId = $state<string | null>(null);
    let forceScore1 = $state<number | null>(null);
    let forceScore2 = $state<number | null>(null);
    let submitting = $state(false);

    let principaleMatches = $derived(matchList.filter(m => m.bracket === 'principale'));
    let consolanteMatches = $derived(matchList.filter(m => m.bracket === 'consolante'));

    function bracketRounds(matches: any[]) {
        const rounds = new Map<number, any[]>();
        for (const m of matches) {
            const r = m.bracketRound;
            if (!rounds.has(r)) rounds.set(r, []);
            rounds.get(r)!.push(m);
        }
        return [...rounds.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([round, matches]) => ({
                round,
                matches: matches.sort((a: any, b: any) => a.bracketPosition - b.bracketPosition),
            }));
    }

    let principaleRounds = $derived(bracketRounds(principaleMatches));
    let consolanteRounds = $derived(bracketRounds(consolanteMatches));

    function currentRound(rounds: { round: number; matches: any[] }[]) {
        if (rounds.length === 0) return null;
        return rounds[rounds.length - 1];
    }

    function roundAllCompleted(rounds: { round: number; matches: any[] }[]) {
        const cr = currentRound(rounds);
        return cr ? cr.matches.every((m: any) => m.status === 'completed') : false;
    }

    function bracketComplete(rounds: { round: number; matches: any[] }[]) {
        const cr = currentRound(rounds);
        return cr ? cr.matches.length === 1 && cr.matches[0].status === 'completed' : false;
    }

    function bracketWinner(rounds: { round: number; matches: any[] }[]) {
        const cr = currentRound(rounds);
        if (!cr || cr.matches.length !== 1) return null;
        const final = cr.matches[0];
        if (final.status !== 'completed') return null;
        return final.winnerId === final.team1Id ? final.team1Name : final.team2Name;
    }

    onMount(() => {
        autoTransition = localStorage.getItem(`autoTransition_${contestId}`) === 'true';
        refresh();
    });

    $effect(() => {
        localStorage.setItem(`autoTransition_${contestId}`, String(autoTransition));
    });

    $effect(() => {
        if (refreshTick > 0) refresh();
    });

    $effect(() => {
        if (!autoTransition) return;
        if (roundAllCompleted(principaleRounds) && !bracketComplete(principaleRounds) && !advancingPrincipale) {
            doAdvance('principale');
        }
        if (roundAllCompleted(consolanteRounds) && !bracketComplete(consolanteRounds) && !advancingConsolante) {
            doAdvance('consolante');
        }
    });

    async function refresh() {
        const res = await fetch(`/api/contests/${contestId}/matches`);
        if (res.ok) matchList = await res.json();
    }

    async function doAdvance(bracket: 'principale' | 'consolante') {
        if (bracket === 'principale') advancingPrincipale = true;
        else advancingConsolante = true;

        await fetch(`/api/contests/${contestId}/advance-bracket?bracket=${bracket}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
        });

        if (bracket === 'principale') advancingPrincipale = false;
        else advancingConsolante = false;

        await refresh();
    }

    function openForce(matchId: string, currentScore1: number | null, currentScore2: number | null) {
        forceMatchId = matchId;
        forceScore1 = currentScore1 ?? 0;
        forceScore2 = currentScore2 ?? 0;
    }

    async function doForceScore() {
        if (!forceMatchId || forceScore1 === null || forceScore2 === null) return;
        submitting = true;
        await fetch(`/api/contests/${contestId}/matches/${forceMatchId}/force`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ scoreTeam1: forceScore1, scoreTeam2: forceScore2 }),
        });
        forceMatchId = null;
        submitting = false;
        await refresh();
    }

    function roundLabel(round: number, totalRounds: number) {
        const remaining = totalRounds - round;
        if (remaining === 0) return 'Finale';
        if (remaining === 1) return 'Demi-finales';
        if (remaining === 2) return 'Quarts de finale';
        return `Tour ${round}`;
    }

    function statusLabel(status: string) {
        switch (status) {
            case 'pending': return 'En attente';
            case 'in_progress': return 'En cours';
            case 'score_submitted': return 'Score soumis';
            case 'completed': return 'Terminé';
            default: return status;
        }
    }

    function statusColor(status: string) {
        switch (status) {
            case 'pending': return 'text-text-muted';
            case 'in_progress': return 'text-blue-600';
            case 'score_submitted': return 'text-orange-600';
            case 'completed': return 'text-green-600';
            default: return '';
        }
    }
</script>

{#snippet bracketSection(title: string, rounds: { round: number; matches: any[] }[], bracket: 'principale' | 'consolante', advancing: boolean)}
    <div class="border border-card-border bg-white rounded-lg p-4">
        <h2 class="font-semibold mb-3">{title}</h2>

        {#if bracketComplete(rounds)}
            <div class="bg-primary-light border border-primary rounded-lg p-3 mb-3 text-center">
                <p class="text-sm text-text-muted">Vainqueur</p>
                <p class="text-lg font-bold text-primary">{bracketWinner(rounds)}</p>
            </div>
        {/if}

        {#each rounds as { round, matches }, idx}
            <div class="mb-4">
                <h3 class="text-sm font-medium text-text-muted mb-2">
                    {roundLabel(round, rounds.length + (bracketComplete(rounds) ? 0 : Math.ceil(Math.log2(rounds[0].matches.length * 2)) - rounds.length))}
                </h3>
                <div class="flex flex-col gap-1">
                    {#each matches as match}
                        <div class="flex items-center justify-between border rounded px-2 py-1 text-sm">
                            <div class="flex-1">
                                <span class="font-medium">{match.team1Name}</span>
                                <span class="text-text-muted mx-1">vs</span>
                                <span class="font-medium">{match.team2Name}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                {#if match.status === 'completed'}
                                    <span class="font-bold">{match.scoreTeam1} - {match.scoreTeam2}</span>
                                {:else if match.status === 'score_submitted'}
                                    <span class="text-orange-600">{match.scoreTeam1} - {match.scoreTeam2} ?</span>
                                {/if}
                                <span class="text-xs {statusColor(match.status)}">{statusLabel(match.status)}</span>
                                {#if match.status !== 'completed'}
                                    <button
                                        onclick={() => openForce(match.id, match.scoreTeam1, match.scoreTeam2)}
                                        class="text-xs text-red-500 hover:text-red-700 ml-1"
                                    >
                                        Forcer
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}

        {#if !bracketComplete(rounds)}
            {#if roundAllCompleted(rounds)}
                <Button
                    onclick={() => doAdvance(bracket)}
                    variant="primary"
                    disabled={advancing}
                    class="w-full py-2"
                >
                    {advancing ? 'Avancement...' : 'Avancer au tour suivant'}
                </Button>
            {:else}
                <label class="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" bind:checked={autoTransition} class="rounded" />
                    Avancer automatiquement au tour suivant
                </label>
            {/if}
        {/if}
    </div>
{/snippet}

{#if matchList.length === 0}
    <p class="text-center text-text-muted">Chargement des finales...</p>
{:else}
    {@render bracketSection('Principale', principaleRounds, 'principale', advancingPrincipale)}
    {@render bracketSection('Consolante', consolanteRounds, 'consolante', advancingConsolante)}
{/if}

{#if forceMatchId}
    {@const match = matchList.find(m => m.id === forceMatchId)}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 class="font-semibold mb-3">Forcer le score</h2>
            {#if match}
                <div class="flex items-center gap-3 mb-4">
                    <label class="flex-1 text-sm font-medium">
                        {match.team1Name}
                        <input
                            type="number"
                            bind:value={forceScore1}
                            min="0"
                            class="w-full border rounded px-3 py-2 mt-1"
                        />
                    </label>
                    <label class="flex-1 text-sm font-medium">
                        {match.team2Name}
                        <input
                            type="number"
                            bind:value={forceScore2}
                            min="0"
                            class="w-full border rounded px-3 py-2 mt-1"
                        />
                    </label>
                </div>
            {/if}
            <div class="flex gap-2">
                <Button onclick={doForceScore} variant="danger" disabled={submitting} class="flex-1 py-2">
                    Valider
                </Button>
                <Button onclick={() => forceMatchId = null} class="flex-1 py-2">
                    Annuler
                </Button>
            </div>
        </div>
    </div>
{/if}
