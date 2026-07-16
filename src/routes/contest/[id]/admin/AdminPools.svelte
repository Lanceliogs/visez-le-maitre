<script lang="ts">
    import { onMount } from 'svelte';

    let { contestId } = $props<{ contestId: string }>();

    let poolList = $state<any[]>([]);

    onMount(async () => {
        const res = await fetch(`/api/contests/${contestId}/pools`);
        if (res.ok) poolList = await res.json();
    });
</script>

{#if poolList.length === 0}
    <p class="text-center text-gray-400">Chargement des poules...</p>
{:else}
    <div class="border rounded-lg p-4">
        <h2 class="font-semibold mb-3">Poules</h2>
        <div class="flex flex-col gap-3">
            {#each poolList as pool}
                <div class="border rounded p-3">
                    <p class="font-medium mb-1">{pool.name}</p>
                    <div class="flex flex-wrap gap-1">
                        {#each pool.teams as team}
                            <span class="text-xs bg-gray-100 rounded px-2 py-1">{team.name}</span>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/if}
