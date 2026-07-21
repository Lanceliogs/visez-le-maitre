export type ContestView = {
    id: string;
    name: string;
    status: 'registration' | 'pools' | 'finals' | 'completed';
    teamSize: number;
    scoreTarget: number;
    poolSize: number;
    nbQualified: number;
    nbConsolante: number;
};

export type TeamView = {
    id: string;
    name: string;
    members: { id: string; name: string }[];
    seedGroup?: number;
};

export type MatchView = {
    id: string;
    poolId: string | null;
    bracket: 'principale' | 'consolante' | null;
    bracketRound: number | null;
    bracketPosition: number | null;
    roundNumber: number;
    team1Id: string;
    team2Id: string;
    team1Name: string;
    team2Name: string;
    scoreTeam1: number | null;
    scoreTeam2: number | null;
    status: 'pending' | 'in_progress' | 'score_submitted' | 'completed';
    submittedBy: string | null;
    winnerId: string | null;
};

export type PoolStandingEntry = {
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    goalAverage: number;
};

export type PoolStandings = {
    poolId: string;
    poolName: string;
    standings: PoolStandingEntry[];
};
