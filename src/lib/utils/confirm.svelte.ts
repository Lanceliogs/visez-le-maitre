type ConfirmVariant = 'primary' | 'secondary' | 'danger';

type ConfirmOptions = {
    title?: string;
    confirmtext?: string;
    canceltext?: string;
    variant?: ConfirmVariant;
};

export const confirmState = $state({
    open: false,
    title: 'Confirmation',
    label: '',
    confirmtext: 'OK',
    canceltext: 'Annuler',
    variant: 'primary' as ConfirmVariant,
});

let resolver: ((confirmed: boolean) => void) = () => {};

export function confirm(
    label: string,
    options: ConfirmOptions = {}
): Promise<boolean> {
    if (confirmState.open) {
        throw new Error('A confirmation dialog is already open.');
    }
    confirmState.open = true;
    confirmState.label = label;
    confirmState.title = options.title ?? 'Confirmation';
    confirmState.confirmtext = options.confirmtext ?? 'OK';
    confirmState.canceltext = options.canceltext ?? 'Annuler';
    confirmState.variant = options.variant ?? 'primary';

    return new Promise((resolve) => {
        resolver = resolve;
    });
}

export function resolveConfirm(confirmed: boolean) {
    confirmState.open = false;
    resolver(confirmed);
    resolver = () => {};
}