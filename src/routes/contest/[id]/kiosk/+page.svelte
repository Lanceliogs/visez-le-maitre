<script lang="ts">
    import { page } from '$app/state';
    import { onMount, onDestroy } from 'svelte';
    import Button from '$lib/components/button.svelte';
    import Eye from '@lucide/svelte/icons/eye';
    import EyeOff from '@lucide/svelte/icons/eye-off';
    import TeamWaiting from '../team/TeamWaiting.svelte';
    import TeamPoolMatch from '../team/TeamPoolMatch.svelte';

    type Member = { name: string; disabled: boolean };

    let kioskToken = $state('');
    let contest = $state<any>(null);
    let team = $state<any>(null);
    let teamToken = $state('');
    let mode = $state<'not-activated' | 'login' | 'register' | 'team'>('not-activated');
    let eventSource: EventSource | null = null;
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

    // Login state
    let pin = $state('');
    let loginTeamName = $state('');
    let loginError = $state('');
    let loggingIn = $state(false);
    let showPin = $state(false);
    let teamNames = $state<string[]>([]);
    let filteredNames = $state<string[]>([]);

    // Register state
    let teamName = $state('');
    let newPin = $state('');
    let members = $state<Member[]>([]);
    let registerError = $state('');
    let registering = $state(false);

    const INACTIVITY_MS = 2 * 60 * 1000;

    onMount(async () => {
        const stored = localStorage.getItem(`kiosk_token_${page.params.id}`);
        if (!stored) {
            mode = 'not-activated';
            return;
        }
        kioskToken = stored;

        const res = await fetch(`/api/contests/${page.params.id}`);
        if (!res.ok) return;
        contest = await res.json();

        members = Array.from({ length: contest.teamSize }, () => ({ name: '', disabled: false }));
        mode = 'login';

        const teamsRes = await fetch(`/api/contests/${page.params.id}/teams`);
        if (teamsRes.ok) {
            const list = await teamsRes.json();
            teamNames = list.map((t: any) => t.name);
        }

        eventSource = new EventSource(`/api/contests/${page.params.id}/events`);
        eventSource.addEventListener('refresh', async () => {
            if (mode === 'team') refreshStatus();
            const [contestRes, teamsRes] = await Promise.all([
                fetch(`/api/contests/${page.params.id}`),
                fetch(`/api/contests/${page.params.id}/teams`),
            ]);
            if (contestRes.ok) contest = await contestRes.json();
            if (teamsRes.ok) teamNames = (await teamsRes.json()).map((t: any) => t.name);
            if (mode === 'register' && contest?.status !== 'registration') {
                mode = 'login';
            }
        });
    });

    onDestroy(() => {
        eventSource?.close();
        if (inactivityTimer) clearTimeout(inactivityTimer);
    });

    function resetInactivity() {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logout, INACTIVITY_MS);
    }

    function updateFilteredNames() {
        const query = loginTeamName.toLowerCase().trim();
        if (!query) {
            filteredNames = [];
            return;
        }
        filteredNames = teamNames.filter(n => n.toLowerCase().includes(query)).slice(0, 5);
    }

    async function loginWithPin() {
        loginError = '';
        loggingIn = true;

        const res = await fetch(`/api/contests/${page.params.id}/kiosk-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, teamName: loginTeamName, kioskToken }),
        });

        if (!res.ok) {
            loginError = 'Nom ou PIN incorrect';
            pin = '';
            loggingIn = false;
            return;
        }

        const data = await res.json();
        teamToken = data.teamToken;
        await loadTeamStatus();
        mode = 'team';
        pin = '';
        loginTeamName = '';
        filteredNames = [];
        loggingIn = false;
        resetInactivity();
    }

    async function register() {
        if (!teamName.trim() || !newPin.trim()) return;
        if (members.filter(m => !m.disabled).some(m => !m.name.trim())) return;

        registering = true;
        registerError = '';

        const res = await fetch(`/api/contests/${page.params.id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamName,
                pin: newPin,
                members: members.filter(m => !m.disabled && m.name.trim()).map(m => m.name.trim()),
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            registerError = data.message ?? 'Erreur lors de l\'inscription';
            registering = false;
            return;
        }

        const data = await res.json();
        teamToken = data.token;
        await loadTeamStatus();
        mode = 'team';
        teamName = '';
        newPin = '';
        members = Array.from({ length: contest.teamSize }, () => ({ name: '', disabled: false }));
        registering = false;
        resetInactivity();
    }

    async function loadTeamStatus() {
        const res = await fetch(`/api/contests/${page.params.id}/status`, {
            headers: { 'Authorization': `Bearer ${teamToken}` },
        });
        if (res.ok) team = await res.json();
    }

    async function refreshStatus() {
        await loadTeamStatus();
        resetInactivity();
    }

    function logout() {
        team = null;
        teamToken = '';
        mode = 'login';
        if (inactivityTimer) clearTimeout(inactivityTimer);
    }

    function showRegister() {
        if (contest?.status !== 'registration') return;
        mode = 'register';
        loginError = '';
    }

    function showLogin() {
        mode = 'login';
        registerError = '';
    }
</script>

<svelte:document onpointerdown={mode === 'team' ? resetInactivity : undefined} />

<div class="min-h-screen flex flex-col px-4 py-6 max-w-md mx-auto">
    {#if mode === 'not-activated'}
        <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
                <p class="text-lg font-semibold text-gray-600">Kiosque non activé</p>
                <p class="text-sm text-text-muted mt-2">Demandez à l'organisateur d'activer ce dispositif.</p>
            </div>
        </div>

    {:else if mode === 'login'}
        <div class="flex flex-col gap-4">
            {#if contest}
                <div class="border border-card-border bg-white rounded-lg p-4 text-center">
                    <h1 class="text-xl font-bold">{contest.name}</h1>
                    <p class="text-sm text-text-muted mt-1">Kiosque partagé</p>
                </div>
            {/if}
            <div class="border border-card-border bg-white rounded-lg p-4 flex flex-col gap-3">
                <h2 class="font-semibold">Connexion</h2>
                <label class="text-sm font-medium relative">
                    Nom de l'équipe
                    <input
                        type="text"
                        bind:value={loginTeamName}
                        oninput={updateFilteredNames}
                        placeholder="Votre équipe"
                        class="w-full border rounded px-3 py-2 mt-1"
                        autocomplete="off"
                    />
                    {#if filteredNames.length > 0}
                        <div class="absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10">
                            {#each filteredNames as name}
                                <button
                                    type="button"
                                    onclick={() => { loginTeamName = name; filteredNames = []; }}
                                    class="w-full text-left px-3 py-2 text-sm hover:bg-primary-light"
                                >
                                    {name}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </label>
                <div class="text-sm font-medium">
                    Code PIN
                    <div class="relative mt-1">
                        <input
                            type={showPin ? 'text' : 'password'}
                            bind:value={pin}
                            maxlength="6"
                            autocomplete="off"
                            class="w-full border rounded-lg ps-9 py-2 pe-9 text-center text-lg tracking-widest"
                            onkeydown={(e) => { if (e.key === 'Enter') loginWithPin(); }}
                        />
                        <button
                            type="button"
                            onclick={() => showPin = !showPin}
                            class="absolute inset-y-0 inset-e-0 flex w-9 items-center justify-center text-text-muted hover:text-text transition"
                            aria-label={showPin ? 'Masquer le PIN' : 'Afficher le PIN'}
                            aria-pressed={showPin}
                        >
                            {#if showPin}
                                <Eye size={16} strokeWidth={2} />
                            {:else}
                                <EyeOff size={16} strokeWidth={2} />
                            {/if}
                        </button>
                    </div>
                </div>
                {#if loginError}
                    <p class="text-sm text-red-500">{loginError}</p>
                {/if}
                <Button onclick={loginWithPin} variant="primary" disabled={loggingIn || !pin.trim() || !loginTeamName.trim()} class="w-full py-3">
                    {loggingIn ? 'Connexion...' : 'Se connecter'}
                </Button>
            </div>
            {#if contest?.status === 'registration'}
                <Button onclick={showRegister} variant="primary" class="w-full py-4 text-lg">
                    Nouvelle équipe ? S'inscrire
                </Button>
            {/if}
        </div>

    {:else if mode === 'register'}
        <div class="flex flex-col gap-4">
            {#if contest}
                <div class="border border-card-border bg-white rounded-lg p-4 text-center">
                    <h1 class="text-xl font-bold">{contest.name}</h1>
                    <p class="text-sm text-text-muted mt-1">Inscription</p>
                </div>
            {/if}
            <div class="border border-card-border bg-white rounded-lg p-4 flex flex-col gap-3">
                <label class="text-sm font-medium">
                    Nom de l'équipe
                    <input
                        type="text"
                        bind:value={teamName}
                        placeholder="Ex: Les Invincibles"
                        class="w-full border rounded px-3 py-2 mt-1"
                    />
                </label>
                <label class="text-sm font-medium">
                    Code PIN (4-6 chiffres)
                    <input
                        type="text"
                        bind:value={newPin}
                        placeholder="Ex: 4321"
                        maxlength="6"
                        class="w-full border rounded px-3 py-2 mt-1"
                    />
                </label>
                <div>
                    <p class="text-sm font-medium mb-1">Joueurs</p>
                    {#each members as member, i}
                        <div class="flex gap-2 mb-2">
                            <input
                                type="text"
                                bind:value={member.name}
                                placeholder="Nom du joueur {i + 1}"
                                class="flex-1 border rounded px-3 py-2 {member.disabled ? 'bg-primary-light text-text-muted' : ''}"
                                disabled={member.disabled}
                            />
                            {#if members.length > 1}
                                <button
                                    onclick={() => member.disabled = !member.disabled}
                                    class="{member.disabled ? 'text-blue-700' : 'text-red-500'} px-2 hover:bg-red-50 rounded text-sm"
                                >{member.disabled ? 'Réactiver' : 'Désactiver'}</button>
                            {/if}
                        </div>
                    {/each}
                </div>
                {#if registerError}
                    <p class="text-sm text-red-500">{registerError}</p>
                {/if}
                <Button onclick={register} variant="primary" disabled={registering} class="w-full py-3">
                    {registering ? 'Inscription...' : "S'inscrire"}
                </Button>
                <button onclick={showLogin} class="text-sm text-text-muted hover:underline text-center">
                    Retour à la connexion
                </button>
            </div>
        </div>

    {:else if mode === 'team' && team}
        <div class="flex flex-col gap-4">
            <div class="border border-card-border bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                    <h1 class="text-xl font-bold">{contest?.name}</h1>
                    <p class="text-sm text-text-muted">Équipe : {team.name}</p>
                </div>
                <Button onclick={logout} class="text-sm px-3 py-1">
                    Déconnexion
                </Button>
            </div>

            {#if team.phase === 'registration'}
                <TeamWaiting />
            {:else if team.phase === 'pools'}
                <TeamPoolMatch
                    currentMatch={team.currentMatch}
                    completedMatches={team.completedMatches}
                    ranking={team.ranking}
                    contestId={page.params.id!}
                    {teamToken}
                    onRefresh={refreshStatus}
                />
            {/if}
        </div>
    {/if}
</div>
