<script lang="ts">
    let {
        onclick,
        children,
        disabled = false,
        label = '',
        class: extraClass = '',
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
