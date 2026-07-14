<script lang="ts">
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    let contest = $state<any>(null);
    let registrationUrl = $state('');
    
    onMount(async () => {
        const id = page.params.id;
        const response = await fetch(`/api/contests/${id}`);
        contest = await response.json();
        registrationUrl = `${window.location.origin}/join/${id}`;
    });
</script>

{#if contest}
    <div class="flex flex-col gap-4">
        <div class="border rounded-lg p-4">
            <h1 class="text-xl font-bold mb-1">{contest.name}</h1>
            <p class="text-sm text-gray-500">Statut : Inscriptions ouvertes</p>
        </div>
        <div class="border rounded-lg p-4">
            <h2 class="font-semibold mb-2">Lien d'inscription</h2>
            <input
                type="text"
                readonly
                value={registrationUrl}
                class="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                onclick={(e) => e.currentTarget.select()}
            />
            <button
                onclick={() => navigator.clipboard.writeText(registrationUrl)}
                class="mt-2 text-sm text-indigo-600 hover:underline"
            >
                Copier le lien
            </button>
        </div>
    </div>
{:else}
    <p class="text-center text-gray-400">Chargement...</p>
{/if}
