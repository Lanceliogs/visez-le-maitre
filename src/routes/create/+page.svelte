<script lang="ts">
    import { goto } from '$app/navigation'

    let name = $state('');
    let teamSize = $state(1);
    let scoreTarget = $state(13);
    let scoreTargetFinal = $state(15);
    let scoreTargetConsolanteFinal = $state(15);
    let nbQualified = $state(16);
    let challengesEnabled = $state(false);

    let creating = $state(false);

    async function createContest() {
        if (!name.trim()) return;
        creating = true;
        const response = await fetch('/api/contests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                teamSize,
                scoreTarget,
                scoreTargetFinal,
                scoreTargetConsolanteFinal,
                nbQualified,
                challengesEnabled,
            }),
        });
        const data = await response.json();
        localStorage.setItem(`admin_${data.id}`, JSON.stringify({
            token: data.adminToken,
            contestId: data.id,
            contestName: name,
        }));
        goto(`/contest/${data.id}/admin`);
    }

</script>

<div class="border rounded-lg p-4">
    <h2 class="font-semibold mb-3">Créer un concours</h2>
    <div class="flex flex-col gap-3">
        <label class="block text-sm font-medium">
            Nom du concours
            <input
                type="text"
                bind:value={name}
                placeholder="Ex: Concours des Herbiers"
                class="w-full border rounded px-3 py-2 mt-1"
            />
        </label>
        <label class="block text-sm font-medium">
            Joueurs par équipe
            <select bind:value={teamSize} class="w-full border rounded px-3 py-2 mt-1">
                <option value={1}>1 (individuel)</option>
                <option value={2}>2 (doublette)</option>
                <option value={3}>3 (triplette)</option>
            </select>
        </label>
        <label class="block text-sm font-medium">
            Score cible
            <input
                type="number"
                bind:value={scoreTarget}
                min="1"
                class="w-full border rounded px-3 py-2 mt-1"
            />
        </label>
        <label class="block text-sm font-medium">
            Score finale
            <input
                type="number"
                bind:value={scoreTargetFinal}
                min="1"
                class="w-full border rounded px-3 py-2 mt-1"
            />
        </label>
        <label class="block text-sm font-medium">
            Score finale consolante
            <input
                type="number"
                bind:value={scoreTargetConsolanteFinal}
                min="1"
                class="w-full border rounded px-3 py-2 mt-1"
            />
        </label>
        <label class="block text-sm font-medium">
            Équipes qualifiées pour la principale
            <select bind:value={nbQualified} class="w-full border rounded px-3 py-2 mt-1">
                <option value={16}>16</option>
                <option value={32}>32</option>
            </select>
        </label>
        <label class="flex items-center gap-2 text-sm font-medium">
            <input
                type="checkbox"
                bind:checked={challengesEnabled}
                class="rounded"
            />
            Activer les challenges
        </label>
        <button
            onclick={createContest}
            disabled={creating || !name.trim()}
            class="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
            {creating ? 'Création...' : 'Créer'}
        </button>
    </div>
</div>
