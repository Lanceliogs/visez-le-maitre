<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { MouseEventHandler } from 'svelte/elements';

    let {
        onclick,
        children,
        disabled = false,
        label = '',
        class: extraClass = '',
    }: {
        onclick?: MouseEventHandler<HTMLButtonElement>;
        children: Snippet;
        disabled?: boolean;
        label?: string;
        class?: string;
    } = $props();
</script>

<button
    {onclick}
    {disabled}
    aria-label={label || undefined}
    class="w-10 h-10 rounded hover:bg-gray-100 flex items-center justify-center transition {extraClass}"
>
    {@render children()}
</button>
