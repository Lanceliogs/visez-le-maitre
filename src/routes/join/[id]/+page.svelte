<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    type Member = { name: string; disabled: boolean };
    
    let contest = $state<any>(null);
    let teamName = $state('');
    let pin = $state('');
    let members = $state<Member[]>(
        Array.from({ length: 2 }, () => ({ name: '', disabled: false }))
    );
    let submitting = $state(false);
    let errorMsg = $state('');

    onMount(async () => {
        const response = await fetch(`/api/contests/${page.params.id}`);
        if (response.ok) {
            contest = await response.json();
            members = Array.from({ length: contest.teamSize }, () => ({ name: '', disabled: false }));
        } else {
            errorMsg = 'Concours introuvable';
        }
    });

    async function register() {
        if (!teamName.trim() || !pin.trim())
            return;
        if (members.filter(m => !m.disabled).some(m => !m.name.trim()))
            return;

        submitting = true;
        errorMsg = '';
        const response = await fetch(`/api/contests/${page.params.id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamName,
                pin,
                members: members.filter(m => !m.disabled && m.name.trim()).map(m => m.name.trim()),
            }),
        });
        if (!response.ok) {
            const data = await response.json();
            errorMsg = data.message ?? 'Erreur lors de l\'inscription';
            submitting = false;
            return;
        }
        const data = await response.json();
        localStorage.setItem(`team_${page.params.id}`, JSON.stringify({
            token: data.token,
            contestId: page.params.id,
            contestName: contest.name,
        }));
        goto(`/contest/${page.params.id}`);
    }
</script>

{#if errorMsg && !contest}
    <p class="text-center text-red-500">{errorMsg}</p>
{:else if !contest}
    <p class="text-center text-gray-400">Chargement...</p>
{:else}
    <div class="flex flex-col gap-4">
        <div class="border rounded-lg p-4">
            <h1 class="text-xl font-bold mb-1">{contest.name}</h1>
            <p class="text-sm text-gray-500">Inscription de votre équipe</p>
        </div>
        <div class="border rounded-lg p-4 flex flex-col gap-3">
            <div>
                <label class="block text-sm font-medium mb-1">Nom de l'équipe
                    <input
                        type="text"
                        bind:value={teamName}
                        placeholder="Ex: Les Invincibles"
                        class="w-full border rounded px-3 py-2"
                    />
                </label>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Code PIN (4-6 chiffres)
                    <input
                        type="text"
                        bind:value={pin}
                        placeholder="Ex: 4321"
                        maxlength="6"
                        class="w-full border rounded px-3 py-2"
                    />
                </label>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Joueurs
                    {#each members as member, i}
                        <div class="flex gap-2 mb-2">
                            <input
                                id="name-input-{i}"
                                type="text"
                                bind:value={member.name}
                                placeholder="Nom du joueur {i + 1}"
                                class="flex-1 border rounded px-3 py-2 {member.disabled ? 'bg-gray-100 text-gray-400' : ''}"
                                disabled={member.disabled}
                            />
                            {#if members.length > 1}
                                <button
                                    id="disable-player-{i}" 
                                    onclick={() => member.disabled = !member.disabled}
                                    class="{member.disabled ? 'text-blue-700' : 'text-red-500'} px-2 hover:bg-red-50 rounded w-24 text-center"
                                >{member.disabled ? "Réactiver" : "Désactiver"}</button>
                            {/if}
                        </div>
                    {/each}
                </label>
            </div>
            {#if errorMsg}
                <p class="text-sm text-red-500">{errorMsg}</p>
            {/if}
            <button
                onclick={register}
                disabled={submitting}
                class="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
                {submitting ? 'Inscription...' : "S'inscrire"}
            </button>
        </div>
    </div>
{/if}