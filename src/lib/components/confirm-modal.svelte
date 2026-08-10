<script lang="ts">
    import Button from '$lib/components/button.svelte';

    type Variant = 'primary' | 'secondary' | 'danger';

    let {
        onconfirm,
        oncancel,
        title,
        label,
        confirmtext = 'OK',
        canceltext = 'Annuler',
        variant = 'primary',
    }: {
        onconfirm?: () => void;
        oncancel?: () => void;
        title: string;
        label: string;
        confirmtext?: string;
        canceltext?: string;
        variant?: Variant;
    } = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        class="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-lg bg-surface p-6"
    >
        <h2 id="confirm-title" class="text-lg font-semibold text-text">
            {title}
        </h2>

        <p class="mt-2 text-sm leading-6 text-text-muted">
            {label}
        </p>

        <div class="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onclick={oncancel}>
                {canceltext}
            </Button>
            <Button variant={variant} onclick={onconfirm}>
                {confirmtext}
            </Button>
        </div>
    </div>
</div>
