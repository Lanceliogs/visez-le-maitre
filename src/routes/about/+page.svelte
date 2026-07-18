<script lang="ts">
    import Target from '@lucide/svelte/icons/target';
    import Users from '@lucide/svelte/icons/users';
    import Trophy from '@lucide/svelte/icons/trophy';
    import Smartphone from '@lucide/svelte/icons/smartphone';
    import ExternalLink from '@lucide/svelte/icons/external-link';
    import Zap from '@lucide/svelte/icons/zap';
</script>

<svelte:head>
    <title>À propos — Visez Le Maître</title>
</svelte:head>

<div class="space-y-8">

    <!-- Hero -->
    <section class="text-center space-y-3">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-light">
            <Target size={32} class="text-primary" />
        </div>
        <h1 class="text-2xl font-bold text-primary">Visez Le Maître</h1>
        <p class="text-text-muted">Gestionnaire de concours de Palet Vendéen</p>
    </section>

    <!-- What is it -->
    <section class="bg-white rounded-xl border border-card-border p-5 space-y-3">
        <h2 class="text-lg font-semibold flex items-center gap-2">
            <Target size={18} class="text-primary" />
            Qu'est-ce que c'est ?
        </h2>
        <p class="text-sm text-text-muted leading-relaxed">
            <strong>Visez Le Maître</strong> est une application web gratuite et open-source pour organiser
            des concours de Palet Vendéen. Elle gère l'intégralité du tournoi :
            inscriptions, constitution des poules, saisie des scores, classements en temps réel,
            et phases finales.
        </p>
    </section>

    <!-- Rules -->
    <section class="bg-white rounded-xl border border-card-border p-5 space-y-3">
        <h2 class="text-lg font-semibold flex items-center gap-2">
            <Trophy size={18} class="text-primary" />
            Règles du Palet Vendéen
        </h2>
        <ul class="text-sm text-text-muted space-y-2 list-none">
            <li class="flex gap-2">
                <span class="text-primary font-bold">1.</span>
                <span>Chaque équipe joue contre toutes les autres de sa poule (round-robin).</span>
            </li>
            <li class="flex gap-2">
                <span class="text-primary font-bold">2.</span>
                <span>Un match se joue en 13 points (configurable). Le premier à atteindre le score cible gagne.</span>
            </li>
            <li class="flex gap-2">
                <span class="text-primary font-bold">3.</span>
                <span>Le classement des poules est déterminé par : victoires &gt; points marqués &gt; goal-average.</span>
            </li>
            <li class="flex gap-2">
                <span class="text-primary font-bold">4.</span>
                <span>Les meilleures équipes accèdent à la <strong>finale principale</strong>, les suivantes à la <strong>consolante</strong>.</span>
            </li>
        </ul>
    </section>

    <!-- How to use -->
    <section class="bg-white rounded-xl border border-card-border p-5 space-y-3">
        <h2 class="text-lg font-semibold flex items-center gap-2">
            <Smartphone size={18} class="text-primary" />
            Comment ça marche ?
        </h2>
        <ul class="text-sm text-text-muted space-y-2 list-none">
            <li class="flex gap-2">
                <span class="text-accent font-bold">→</span>
                <span><strong>L'organisateur</strong> crée un concours et partage le lien ou le QR code.</span>
            </li>
            <li class="flex gap-2">
                <span class="text-accent font-bold">→</span>
                <span><strong>Les équipes</strong> s'inscrivent depuis leur téléphone (ou via un kiosque partagé).</span>
            </li>
            <li class="flex gap-2">
                <span class="text-accent font-bold">→</span>
                <span><strong>Les scores</strong> sont saisis par une équipe et confirmés par l'adversaire.</span>
            </li>
            <li class="flex gap-2">
                <span class="text-accent font-bold">→</span>
                <span><strong>Les classements</strong> se mettent à jour en temps réel pour tous.</span>
            </li>
        </ul>
    </section>

    <!-- Features -->
    <section class="bg-white rounded-xl border border-card-border p-5 space-y-3">
        <h2 class="text-lg font-semibold flex items-center gap-2">
            <Users size={18} class="text-primary" />
            Fonctionnalités
        </h2>
        <div class="grid grid-cols-2 gap-2 text-sm text-text-muted">
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-primary"></span>
                Inscription par QR code
            </div>
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-primary"></span>
                Mode kiosque
            </div>
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-primary"></span>
                Scores en temps réel
            </div>
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-primary"></span>
                Mobile-first
            </div>
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-primary"></span>
                Groupes de seeding
            </div>
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-primary"></span>
                Phases finales
            </div>
        </div>
    </section>

    <!-- Tech stack -->
    <section class="bg-white rounded-xl border border-card-border p-5 space-y-3">
        <h2 class="text-lg font-semibold flex items-center gap-2">
            <Zap size={18} class="text-primary" />
            Stack technique
        </h2>
        <div class="flex flex-wrap gap-2">
            {#each ['SvelteKit', 'Svelte 5', 'Tailwind CSS', 'Drizzle ORM', 'Neon Postgres', 'Vercel', 'SSE'] as tech}
                <span class="px-2.5 py-1 bg-primary-light text-primary text-xs font-medium rounded-full">
                    {tech}
                </span>
            {/each}
        </div>
    </section>

    <!-- Credits -->
    <section class="bg-white rounded-xl border border-card-border p-5 space-y-3 text-center">
        <p class="text-sm text-text-muted">
            Projet open-source sous licence AGPL-3.0
        </p>
        <a
            href="https://github.com/Lanceliogs/visez-le-maitre"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
            <ExternalLink size={16} />
            Voir sur GitHub
        </a>
    </section>

</div>
