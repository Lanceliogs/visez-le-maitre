<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    let status = $state<'loading' | 'success' | 'error'>('loading');
    let errorMessage = $state('');

    onMount(async () => {
        const params = $page.params;
        const token = $page.url.searchParams.get('token');

        if (!token) {
            status = 'error';
            errorMessage = 'Token manquant dans l\'URL';
            return;
        }

        const res = await fetch(`/api/contests/${params.id}/kiosk-token?token=${token}`);
        if (!res.ok) {
            status = 'error';
            errorMessage = 'Token kiosque invalide';
            return;
        }

        localStorage.setItem(`kiosk_token_${params.id}`, token);
        status = 'success';

        setTimeout(() => {
            goto(`/contest/${params.id}/kiosk`);
        }, 1000);
    });
</script>

<div class="min-h-screen flex items-center justify-center px-4">
    {#if status === 'loading'}
        <p class="text-text-muted">Activation du kiosque...</p>
    {:else if status === 'success'}
        <div class="text-center">
            <p class="text-lg font-semibold text-green-600">Kiosque activé</p>
            <p class="text-sm text-text-muted mt-2">Redirection...</p>
        </div>
    {:else}
        <div class="text-center">
            <p class="text-lg font-semibold text-red-600">Erreur</p>
            <p class="text-sm text-text-muted mt-2">{errorMessage}</p>
        </div>
    {/if}
</div>
