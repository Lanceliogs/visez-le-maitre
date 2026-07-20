export type Match = {
    id: string;
    contestId: string;
    poolId: string | null;
    bracket: string | null;
    bracketRound: number | null;
    bracketPosition: number | null;
    roundNumber: number;
    team1Id: string;
    team2Id: string;
    scoreTeam1: number | null;
    scoreTeam2: number | null;
    submittedBy: string | null;
    confirmed: boolean;
    winnerId: string | null;
    status: string;
};

export type Team = {
    id: string;
    contestId: string;
    name: string;
    token: string;
    pin: string;
    seedGroup: number;
    createdAt: string;
    members?: TeamMember[];
};

export type TeamMember = {
    id: string;
    teamId: string;
    name: string;
};

export type Contest = {
    id: string;
    name: string;
    status: string;
    teamSize: number;
    scoreTarget: number;
    scoreTargetFinal: number;
    scoreTargetConsolanteFinal: number;
    nbQualified: number;
    nbConsolante: number;
    challengesEnabled: boolean;
    poolSize: number;
    createdAt: string;
    completedAt: string | null;
    lastActivityAt: string;
};
