<script lang="ts">
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import QRCode from 'qrcode';
    import Button from '$lib/components/button.svelte';
    import ToolButton from '$lib/components/tool-button.svelte';

    let contest = $state<any>(null);
    let teamList = $state<any[]>([]);
    let registrationUrl = $state('');
    let adminToken = $state('');

    let showSeeding = $state(false);
    let nbSeedGroups = $state(2);

    let starting = $state(false);
    
    let qrDataUrl = $state('');
    let showQr = $state(false);

    let copied = $state(false);

    const seedGroupColors = ['', 'bg-blue-100 border-blue-300', 'bg-orange-100 border-orange-300', 'bg-green-100 border-green-300', 'bg-purple-100 border-purple-300'];

    onMount(async () => {
        const id = page.params.id;
        registrationUrl = `${window.location.origin}/join/${id}`;
        QRCode.toDataURL(registrationUrl, { width: 256, margin: 2 }).then(
            url => { qrDataUrl = url; }
        );
        const stored = localStorage.getItem(`admin_${id}`);
        if (stored) {
            adminToken = JSON.parse(stored).token;
        }
        const contestRes = await fetch(`/api/contests/${id}`);
        contest = await contestRes.json();
        await refreshTeams();
    });

    async function refreshTeams() {
        const res = await fetch(`/api/contests/${page.params.id}/teams`);
        teamList = await res.json();
    }

    async function startContest() {
        if (!confirm('Fermer les inscriptions et démarrer le concours ?')) return;
        starting = true;
        await fetch(`/api/contests/${page.params.id}/start-pools`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
        });
        const res = await fetch(`/api/contests/${page.params.id}`);
        contest = await res.json();
        starting = false;
    }

    async function setSeedGroup(teamId: string, group: number) {
        await fetch(`/api/contests/${page.params.id}/teams/${teamId}/seed`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ seedGroup: group }),
        });
        const team = teamList.find((t: any) => t.id === teamId);
        if (team) team.seedGroup = group;
    }

    function cycleSeedGroup(teamId: string, currentGroup: number) {
        const next = currentGroup >= nbSeedGroups ? 0 : currentGroup + 1;
        setSeedGroup(teamId, next);
    }
</script>

{#if !contest}
    <p class="text-center text-gray-400">Chargement...</p>
{:else}
    <div class="flex flex-col gap-4">
        <div class="border rounded-lg p-4">
            <h1 class="text-xl font-bold mb-1">{contest.name}</h1>
            <p class="text-sm text-gray-500">
                Statut : {contest.status === 'registration' ? 'Inscriptions ouvertes' : 'Concours en cours'}
            </p>
        </div>
        {#if contest.status === 'registration'}
            <div class="border rounded-lg p-4">
                <h2 class="font-semibold mb-2">Lien d'inscription</h2>
                
                <input
                    type="text"
                    readonly
                    value={registrationUrl}
                    class="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                    onclick={(e) => e.currentTarget.select()}
                />
                <div class="flex flex-row gap-1 justify-between">
                    <Button
                        onclick={() => {
                            navigator.clipboard.writeText(registrationUrl);
                            copied = true;
                            setTimeout(() => copied = false, 2000);
                        }}
                        class="mt-2 w-28"
                    >
                        {copied ? 'Copié !' : 'Copier le lien'}
                    </Button>
                    {#if qrDataUrl}
                        <Button onclick={() => showQr = true} class="mt-2">
                            Afficher le QR Code
                        </Button>
                    {/if}
                </div>
            </div>
        {/if}
        <div class="border rounded-lg p-4">
            <div class="flex justify-between items-center mb-3">
                <h2 class="font-semibold">Équipes inscrites ({teamList.length})</h2>
                <ToolButton onclick={refreshTeams} label="Rafraîchir la liste" class="text-lg">↻</ToolButton>
            </div>
            {#if teamList.length === 0}
                <p class="text-sm text-gray-400 italic">Aucune équipe inscrite.</p>
            {:else}
                <div class="flex flex-col gap-2">
                    {#each teamList as team}
                        <div class="border rounded p-3 {seedGroupColors[team.seedGroup] || ''}">
                            <div class="flex flex-row justify-between">
                                <p class="font-medium">{team.name}</p>
                                {#if team.seedGroup > 0}
                                    <p class="text-xs text-gray-400"> Seed: {team.seedGroup} </p>
                                {/if}
                            </div>
                            <p class="text-sm text-gray-500">
                                {team.members.map((m: any) => m.name).join(', ')}
                            </p> 
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
        {#if contest.status === 'registration' && teamList.length >= 2}
            <Button onclick={() => showSeeding = true} class="w-full py-3">
                Groupes d'exclusion - Seeding
            </Button>
            <Button onclick={startContest} variant="danger" disabled={starting} class="w-full py-3">
                {starting ? 'Démarrage...' : 'Fermer les inscriptions et démarrer'}
            </Button>
        {/if}
    </div>
{/if}

{#if showQr}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 flex flex-col items-center">
            <h2 class="font-semibold mb-3">Scannez pour vous inscrire</h2>
            <img src={qrDataUrl} alt="QR Code inscription" />
            <Button onclick={() => showQr = false} class="mt-4">
                Fermer
            </Button>
        </div>
    </div>
{/if}

{#if showSeeding}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 class="font-semibold mb-3">Groupes d'exclusion</h2>
            <p class="text-sm text-gray-500 mb-4">
                Les équipes du même groupe ne seront pas dans la même poule.
            </p>
            <label class="block text-sm font-medium mb-3">
                Nombre de groupes
                <input
                    type="number"
                    bind:value={nbSeedGroups}
                    min="1"
                    max="4"
                    class="w-16 border rounded px-2 py-1 ml-2"
                />
            </label>
            <div class="flex flex-col gap-2">
                {#each teamList as team}
                    <div class="flex items-center gap-2">
                        <span class="flex-1 text-sm">{team.name}</span>
                        <ToolButton
                            onclick={() => cycleSeedGroup(team.id, team.seedGroup)}
                            class="border text-sm font-bold {seedGroupColors[team.seedGroup] || ''}"
                        >
                            {team.seedGroup || '-'}
                        </ToolButton>
                        <ToolButton
                            onclick={() => setSeedGroup(team.id, 0)}
                            class="w-auto h-auto text-xs text-gray-400 hover:text-gray-600 hover:bg-transparent"
                        >
                            Reset
                        </ToolButton>
                    </div>
                {/each}
            </div>
            <Button onclick={() => showSeeding = false} class="mt-4">
                Fermer
            </Button>
        </div>
    </div>
{/if}