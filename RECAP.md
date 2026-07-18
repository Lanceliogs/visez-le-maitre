# What we did today

## Pool Generation (complete)

• Added poolSize to contests schema + created pools, poolTeams, matches tables
• Pool generation algorithm (src/lib/server/contest/pools.ts): distributes teams using floor division, respects seeding constraints (best effort), round-robin match generation via circle method
• POST /api/contests/[id]/start-pools — validates, generates pools + matches, flips contest to pools status
• Pool size select (5 or 6) in contest creation form

## Score Submission Flow (complete, untested)

• POST /api/contests/[id]/matches/[matchId]/start — either team starts the match
• POST /api/contests/[id]/matches/[matchId]/score — team submits score
• POST /api/contests/[id]/matches/[matchId]/confirm — opponent confirms
• POST /api/contests/[id]/matches/[matchId]/force — admin forces score
• Team page shows: pending (with opponent availability) → start button → score input → confirm/contest

## SSE Real-time (complete)

• src/lib/server/sse.ts — in-memory client registry + broadcast
• GET /api/contests/[id]/events — SSE stream
• Broadcasts on: team join, match start, score submit, score confirm, force score, pools start
• Both team page and admin page listen and auto-refresh

## Admin Pools View (complete, untested)

• GET /api/contests/[id]/matches — all matches for a contest
• AdminPools.svelte — shows pools with match list, status labels, "Forcer" button with modal

## Refactoring
• src/lib/server/auth.ts — extractToken, getTeamFromToken, validateAdminToken
• src/lib/server/contest/ split into barrel:
  • contests.ts — getContest, createContest
  • teams.ts — getContestTeams, createNewTeam, setTeamSeedGroup
  • pools.ts — generatePools, generatePoolMatches, getContestPools, startPoolPhase
  • matches.ts — getContestMatches, getTeamMatches, getMatch, startMatch, submitScore, confirmScore, forceScore, isOpponentBusy, buildCurrentMatch, buildCompletedMatches
• Admin page split: AdminRegistration.svelte / AdminPools.svelte
• Team page split: TeamWaiting.svelte / TeamPoolMatch.svelte

## What's next

1. Test the full flow — create contest, register 2+ teams, start pools, play a match through start → score → confirm
2. Pool standings — classement (victoires > points > goal-average), admin view + public view
3. End of pool phase — detect when all matches are completed, transition to finals
4. Elimination brackets — main (top N) + consolante (16 next) + challenges (optional)
5. Kiosk mode — PIN-based login for shared devices
6. App admin dashboard — manage all contests, force delete, auto-cleanup