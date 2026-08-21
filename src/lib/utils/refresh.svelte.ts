// Tiny API to diplay when the contest data was last fetched in the footer

export const state = $state({
    contestId: null as string | null,
    lastRefresh: null as number | null
});

export function markRefreshed(contestId: string) {
    state.contestId = contestId;
    state.lastRefresh = Date.now();
}
