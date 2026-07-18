import { getContestPools } from './pools';
import { getContestMatches } from './matches';
import { getContestTeams } from './teams';
import { getContest } from './contests';

export type TeamStanding = {
    teamId: string;
    teamName: string;
    played: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    goalAverage: number;
};

export type PoolStanding = {
    poolId: string;
    poolName: string;
    standings: TeamStanding[];
};

export async function computeStandings(contestId: string): Promise<PoolStanding[]> {
    const pools = await getContestPools(contestId);
    const matches = await getContestMatches(contestId);
    const teams = await getContestTeams(contestId);
    const teamMap = new Map(teams.map(t => [t.id, t.name]));

    const completedMatches = matches.filter(m => m.status === 'completed');

    return pools
        .sort((a, b) => a.poolNumber - b.poolNumber)
        .map(pool => {
            const poolTeamIds = pool.poolTeams.map(pt => pt.teamId);
            const poolMatches = completedMatches.filter(m => m.poolId === pool.id);

            const standings: TeamStanding[] = poolTeamIds.map(teamId => {
                let wins = 0;
                let losses = 0;
                let pointsFor = 0;
                let pointsAgainst = 0;

                for (const match of poolMatches) {
                    if (match.team1Id === teamId) {
                        pointsFor += match.scoreTeam1 ?? 0;
                        pointsAgainst += match.scoreTeam2 ?? 0;
                        if (match.winnerId === teamId) wins++;
                        else losses++;
                    } else if (match.team2Id === teamId) {
                        pointsFor += match.scoreTeam2 ?? 0;
                        pointsAgainst += match.scoreTeam1 ?? 0;
                        if (match.winnerId === teamId) wins++;
                        else losses++;
                    }
                }

                return {
                    teamId,
                    teamName: teamMap.get(teamId) ?? '?',
                    played: wins + losses,
                    wins,
                    losses,
                    pointsFor,
                    pointsAgainst,
                    goalAverage: pointsFor - pointsAgainst,
                };
            });

            standings.sort((a, b) =>
                b.wins - a.wins
                || b.pointsFor - a.pointsFor
                || b.goalAverage - a.goalAverage
            );

            return {
                poolId: pool.id,
                poolName: pool.name,
                standings,
            };
        });
}

export type PoolRanking = {
    rank: number;
    teamId: string;
    teamName: string;
    poolName: string;
    wins: number;
    pointsFor: number;
    goalAverage: number;
    qualification: 'principale' | 'consolante' | 'eliminee';
};

export async function computeQualifications(contestId: string): Promise<PoolRanking[]> {
    const contest = await getContest(contestId);
    if (!contest) return [];

    const poolStandings = await computeStandings(contestId);

    const allTeams: (TeamStanding & { poolName: string })[] = [];
    for (const pool of poolStandings) {
        for (const team of pool.standings) {
            allTeams.push({ ...team, poolName: pool.poolName });
        }
    }

    allTeams.sort((a, b) =>
        b.wins - a.wins
        || b.pointsFor - a.pointsFor
        || b.goalAverage - a.goalAverage
    );

    const nbQualified = contest.nbQualified;
    const nbConsolante = 16;

    return allTeams.map((team, i) => {
        let qualification: 'principale' | 'consolante' | 'eliminee';
        if (i < nbQualified) {
            qualification = 'principale';
        } else if (i < nbQualified + nbConsolante) {
            qualification = 'consolante';
        } else {
            qualification = 'eliminee';
        }
        return {
            rank: i + 1,
            teamId: team.teamId,
            teamName: team.teamName,
            poolName: team.poolName,
            wins: team.wins,
            pointsFor: team.pointsFor,
            goalAverage: team.goalAverage,
            qualification,
        };
    });
}
