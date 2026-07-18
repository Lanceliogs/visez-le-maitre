<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { MouseEventHandler } from 'svelte/elements';

    let {
        onclick,
        children,
        variant = 'secondary',
        disabled = false,
        class: extraClass = ''
    }: {
        onclick?: MouseEventHandler<HTMLButtonElement>;
        children: Snippet;
        variant?: 'primary' | 'secondary' | 'danger';
        disabled?: boolean;
        class?: string;
    } = $props();

    const variants: Record<string, string> = {
        primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm disabled:opacity-50',
        secondary: 'text-text hover:bg-primary-light border border-card-border',
        danger: 'bg-danger text-white hover:bg-danger-hover shadow-sm disabled:opacity-50',
    };
</script>

<button
    {onclick}
    {disabled}
    class="px-3 py-2 text-sm rounded-lg font-semibold transition {variants[variant]} {extraClass}"
>
    {@render children()}
</button>