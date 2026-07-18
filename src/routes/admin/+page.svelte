<script lang="ts">
    import { onMount } from 'svelte';
    import Button from '$lib/components/button.svelte';

    let password = $state('');
    let sessionToken = $state('');
    let authenticated = $state(false);
    let contestList = $state<any[]>([]);
    let loading = $state(false);
    let error = $state('');
    let cleanupDays = $state(7);
    let cleanupResult = $state<string | null>(null);

    onMount(() => {
        const saved = localStorage.getItem('app_admin_token');
        if (saved) {
            sessionToken = saved;
            tryToken();
        }
    });

    async function login() {
        error = '';
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        if (res.ok) {
            const data = await res.json();
            sessionToken = data.token;
            localStorage.setItem('app_admin_token', sessionToken);
            authenticated = true;
            password = '';
            await refresh();
        } else {
            error = 'Mot de passe incorrect';
        }
    }

    async function tryToken() {
        const res = await fetch('/api/admin/contests', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        if (res.ok) {
            authenticated = true;
            contestList = await res.json();
        } else {
            localStorage.removeItem('app_admin_token');
            sessionToken = '';
        }
    }

    async function refresh() {
        const res = await fetch('/api/admin/contests', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        if (res.ok) contestList = await res.json();
    }

    async function deleteContest(id: string, name: string) {
        if (!confirm(`Supprimer le concours « ${name} » et toutes ses données ?`)) return;
        loading = true;
        await fetch(`/api/admin/contests/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        await refresh();
        loading = false;
    }

    async function cleanup() {
        if (!confirm(`Supprimer tous les concours inactifs depuis plus de ${cleanupDays} jours ?`)) return;
        loading = true;
        cleanupResult = null;
        const res = await fetch('/api/admin/cleanup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({ maxAgeDays: cleanupDays }),
        });
        if (res.ok) {
            const data = await res.json();
            cleanupResult = `${data.deleted} concours supprimé${data.deleted > 1 ? 's' : ''}`;
            await refresh();
        }
        loading = false;
    }

    function logout() {
        localStorage.removeItem('app_admin_token');
        authenticated = false;
        sessionToken = '';
        contestList = [];
    }

    function statusLabel(status: string) {
        switch (status) {
            case 'registration': return 'Inscriptions';
            case 'pools': return 'Poules';
            case 'finals': return 'Finales';
            case 'completed': return 'Terminé';
            default: return status;
        }
    }

    function statusColor(status: string) {
        switch (status) {
            case 'registration': return 'bg-blue-100 text-blue-700';
            case 'pools': return 'bg-orange-100 text-orange-700';
            case 'finals': return 'bg-purple-100 text-purple-700';
            case 'completed': return 'bg-green-100 text-green-700';
            default: return 'bg-primary-light text-text';
        }
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
</script>

<div class="max-w-xl mx-auto py-8 px-4 flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Administration</h1>

    {#if !authenticated}
        <form onsubmit={(e) => { e.preventDefault(); login(); }} class="flex flex-col gap-3">
            <label class="text-sm font-medium">
                Mot de passe
                <input
                    type="password"
                    bind:value={password}
                    class="w-full border rounded px-3 py-2 mt-1"
                    placeholder="Mot de passe administrateur"
                />
            </label>
            {#if error}
                <p class="text-sm text-red-600">{error}</p>
            {/if}
            <Button onclick={login} variant="primary" class="w-full py-2">Connexion</Button>
        </form>
    {:else}
        <div class="flex items-center justify-between">
            <p class="text-sm text-text-muted">{contestList.length} concours</p>
            <div class="flex gap-2">
                <Button onclick={refresh} class="text-sm px-3 py-1">Rafraîchir</Button>
                <Button onclick={logout} class="text-sm px-3 py-1">Déconnexion</Button>
            </div>
        </div>

        {#if contestList.length === 0}
            <p class="text-center text-text-muted py-8">Aucun concours</p>
        {:else}
            <div class="flex flex-col gap-2">
                {#each contestList as contest}
                    <div class="border border-card-border bg-white rounded-lg p-3 flex items-center justify-between">
                        <div class="flex-1 min-w-0">
                            <p class="font-medium truncate">{contest.name}</p>
                            <div class="flex items-center gap-2 mt-1 text-xs text-text-muted">
                                <span class="px-2 py-0.5 rounded-full text-xs font-medium {statusColor(contest.status)}">
                                    {statusLabel(contest.status)}
                                </span>
                                <span>{contest.teamCount} équipe{contest.teamCount > 1 ? 's' : ''}</span>
                                <span>·</span>
                                <span>{formatDate(contest.createdAt)}</span>
                            </div>
                        </div>
                        <button
                            onclick={() => deleteContest(contest.id, contest.name)}
                            disabled={loading}
                            class="text-red-500 hover:text-red-700 text-sm font-medium ml-3"
                        >
                            Supprimer
                        </button>
                    </div>
                {/each}
            </div>
        {/if}

        <div class="border border-card-border bg-white rounded-lg p-4 flex flex-col gap-3">
            <h2 class="font-semibold text-sm">Nettoyage automatique</h2>
            <div class="flex items-center gap-2">
                <label class="text-sm">Supprimer les concours inactifs depuis plus de</label>
                <input
                    type="number"
                    bind:value={cleanupDays}
                    min="1"
                    class="w-16 border rounded px-2 py-1 text-sm"
                />
                <span class="text-sm">jours</span>
            </div>
            <Button onclick={cleanup} variant="danger" disabled={loading} class="w-full py-2">
                Nettoyer
            </Button>
            {#if cleanupResult}
                <p class="text-sm text-green-600">{cleanupResult}</p>
            {/if}
        </div>
    {/if}
</div>
