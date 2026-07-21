<script lang="ts">
    import Button from './button.svelte';

    let { team1Name, team2Name, status, onForce } = $props<{
        team1Name: string;
        team2Name: string;
        status: string;
        onForce: () => void;
    }>();

    let isActive = $derived(status === 'in_progress' || status === 'score_submitted');

    function statusLabel(s: string) {
        switch (s) {
            case 'pending': return 'En attente';
            case 'in_progress': return 'En cours';
            case 'score_submitted': return 'Score soumis';
            default: return s;
        }
    }

    function statusColor(s: string) {
        switch (s) {
            case 'pending': return 'text-text-muted';
            case 'in_progress': return 'text-blue-600';
            case 'score_submitted': return 'text-orange-600';
            default: return '';
        }
    }
</script>

<div class="border rounded-lg px-3 py-2 {isActive ? 'border-orange-300 bg-orange-50' : ''}">
    <div class="flex items-center justify-between">
        <div class="flex flex-col text-sm">
            <span class="font-medium">{team1Name}</span>
            <span class="font-medium">{team2Name}</span>
        </div>
        <div class="flex items-center gap-2">
            <span class="text-xs {statusColor(status)}">{statusLabel(status)}</span>
            <Button onclick={onForce} variant="danger">Forcer</Button>
        </div>
    </div>
</div>
