<script lang="ts">
    let { team1Name, team2Name, scoreTeam1, scoreTeam2, winnerId, team1Id, team2Id } = $props<{
        team1Name: string;
        team2Name: string;
        scoreTeam1: number | null;
        scoreTeam2: number | null;
        winnerId: string | null;
        team1Id: string;
        team2Id: string;
    }>();

    let t1Won = $derived(winnerId === team1Id);
    let t2Won = $derived(winnerId === team2Id);
</script>

<div class="border rounded-lg overflow-hidden">
    <div class="flex items-center px-3 py-1.5 {t1Won ? 'bg-green-100' : 'bg-gray-50 opacity-60'}">
        <span class="flex-1 font-medium text-sm {t1Won ? 'text-green-800' : ''}">{team1Name}</span>
        <span class="font-bold text-sm {t1Won ? 'text-green-700' : 'text-red-500'}">{scoreTeam1}</span>
    </div>
    <div class="flex items-center px-3 py-1.5 border-t {t2Won ? 'bg-green-100' : 'bg-gray-50 opacity-60'}">
        <span class="flex-1 font-medium text-sm {t2Won ? 'text-green-800' : ''}">{team2Name}</span>
        <span class="font-bold text-sm {t2Won ? 'text-green-700' : 'text-red-500'}">{scoreTeam2}</span>
    </div>
</div>
