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
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50',
        secondary: 'text-gray-700 hover:bg-gray-100 border',
        danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
    };
</script>

<button
    {onclick}
    {disabled}
    class="p-2 text-sm rounded font-semibold transition {variants[variant]} {extraClass}"
>
    {@render children()}
</button>