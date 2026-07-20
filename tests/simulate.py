"""
Simulate a full contest: pools + brackets (principale & consolante).

Usage:
    uv run simulate.py [config.yaml]
"""

import random
import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

import requests
import yaml

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

def load_config(path: str = "config.yaml") -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class Client:
    """Thin wrapper around requests for the API."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    def url(self, path: str) -> str:
        return f"{self.base_url}{path}"

    def post(self, path: str, token: str | None = None, **kwargs) -> requests.Response:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.post(self.url(path), headers=headers, **kwargs)
        return resp

    def get(self, path: str, token: str | None = None) -> requests.Response:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return requests.get(self.url(path), headers=headers)


def check(resp: requests.Response, context: str = ""):
    if resp.status_code >= 400:
        detail = resp.text[:200]
        raise RuntimeError(f"[{resp.status_code}] {context}: {detail}")


# ---------------------------------------------------------------------------
# Steps
# ---------------------------------------------------------------------------

def create_contest(client: Client, cfg: dict) -> tuple[str, str]:
    """Create a contest. Returns (contest_id, admin_token)."""
    print("1. Creating contest...")
    resp = client.post("/api/contests", json=cfg["contest"])
    check(resp, "create contest")
    data = resp.json()
    contest_id = data["id"]
    admin_token = data["adminToken"]
    print(f"   Contest created: {contest_id}")
    return contest_id, admin_token


def register_teams(client: Client, contest_id: str, cfg: dict) -> list[dict]:
    """Register N teams. Returns list of {id, name, token, pin}."""
    teams_cfg = cfg["teams"]
    count = teams_cfg["count"]
    prefix = teams_cfg["name_prefix"]
    pin_prefix = teams_cfg["pin_prefix"]
    team_size = cfg["contest"].get("teamSize", 2)

    print(f"2. Registering {count} teams...")
    teams = []
    for i in range(1, count + 1):
        name = f"{prefix} {i}"
        pin = f"{pin_prefix}{i:03d}"
        members = [f"Joueur {i}-{j}" for j in range(1, team_size + 1)]

        resp = client.post(f"/api/contests/{contest_id}/join", json={
            "teamName": name,
            "members": members,
            "pin": pin,
        })
        check(resp, f"register team {name}")
        data = resp.json()
        teams.append({
            "id": data["teamId"],
            "name": name,
            "token": data["token"],
            "pin": pin,
        })

    print(f"   {len(teams)} teams registered.")
    return teams


def start_pools(client: Client, contest_id: str, admin_token: str) -> list[dict]:
    """Start pool phase. Returns pool assignments."""
    print("3. Starting pool phase...")
    resp = client.post(f"/api/contests/{contest_id}/start-pools", token=admin_token)
    check(resp, "start pools")
    data = resp.json()
    pools = data["pools"]
    print(f"   {len(pools)} pools created: {[f'{p['name']}({p['teamCount']})' for p in pools]}")
    return pools


def fetch_matches(client: Client, contest_id: str) -> list[dict]:
    """Fetch all matches for the contest."""
    resp = client.get(f"/api/contests/{contest_id}/matches")
    check(resp, "fetch matches")
    return resp.json()


def play_matches(client: Client, contest_id: str, matches: list[dict], teams: list[dict], score_target: int):
    """Simulate playing all pending matches."""
    team_tokens = {t["id"]: t["token"] for t in teams}
    pending = [m for m in matches if m["status"] == "pending"]
    total = len(pending)
    print(f"4. Playing {total} matches...")

    played = 0
    errors = 0

    for match in pending:
        match_id = match["id"]
        team1_id = match["team1Id"]
        team2_id = match["team2Id"]
        token1 = team_tokens[team1_id]
        token2 = team_tokens[team2_id]

        # Start match (team1 starts it)
        resp = client.post(
            f"/api/contests/{contest_id}/matches/{match_id}/start",
            token=token1,
        )
        if resp.status_code >= 400:
            # Opponent might be busy, retry with a small delay
            time.sleep(0.05)
            resp = client.post(
                f"/api/contests/{contest_id}/matches/{match_id}/start",
                token=token1,
            )
        if resp.status_code >= 400:
            errors += 1
            print(f"   WARN: Could not start match {match_id}: {resp.text[:100]}")
            continue

        # Generate a random score where one team reaches score_target
        winner_score = score_target
        loser_score = random.randint(0, score_target - 1)
        if random.random() < 0.5:
            s1, s2 = winner_score, loser_score
        else:
            s1, s2 = loser_score, winner_score

        # Team1 submits score
        resp = client.post(
            f"/api/contests/{contest_id}/matches/{match_id}/score",
            token=token1,
            json={"myScore": s1, "theirScore": s2},
        )
        if resp.status_code >= 400:
            errors += 1
            print(f"   WARN: Score submission failed for match {match_id}: {resp.text[:100]}")
            continue

        # Team2 confirms score
        resp = client.post(
            f"/api/contests/{contest_id}/matches/{match_id}/confirm",
            token=token2,
        )
        if resp.status_code >= 400:
            errors += 1
            print(f"   WARN: Score confirmation failed for match {match_id}: {resp.text[:100]}")
            continue

        played += 1
        if played % 20 == 0:
            print(f"   ... {played}/{total} matches played")

    print(f"   Done: {played} played, {errors} errors out of {total} total.")
    return played, errors


def verify_standings(client: Client, contest_id: str) -> list[dict]:
    """Fetch and display standings."""
    print("5. Verifying standings...")
    resp = client.get(f"/api/contests/{contest_id}/standings")
    check(resp, "fetch standings")
    standings = resp.json()

    if not standings:
        print("   No standings returned (pools might not be complete).")
        return standings

    print(f"   {len(standings)} pools in standings:")
    for pool in standings:
        pool_name = pool.get("poolName", "?")
        pool_standings = pool.get("standings", [])
        print(f"   - {pool_name}: {len(pool_standings)} teams")
        for t in pool_standings[:3]:
            print(f"     {t.get('teamName', '?'):20s} "
                  f"W:{t.get('wins', 0)} PF:{t.get('pointsFor', 0)} GA:{t.get('goalAverage', 0)}")
        if len(pool_standings) > 3:
            print(f"     ... and {len(pool_standings) - 3} more")

    return standings


def verify_qualifications(client: Client, contest_id: str, teams: list[dict]):
    """Fetch status for all teams to check qualifications assignment."""
    print("6. Checking qualifications...")

    principale = []
    consolante = []
    eliminee = []
    no_ranking = 0

    for team in teams:
        resp = client.get(f"/api/contests/{contest_id}/status", token=team["token"])
        if resp.status_code != 200:
            print(f"   WARN: status returned {resp.status_code} for {team['name']}")
            continue
        data = resp.json()
        ranking = data.get("ranking")
        if not ranking:
            no_ranking += 1
            continue
        entry = {"name": team["name"], **ranking}
        q = ranking.get("qualification", "?")
        if q == "principale":
            principale.append(entry)
        elif q == "consolante":
            consolante.append(entry)
        elif q == "eliminee":
            eliminee.append(entry)

    principale.sort(key=lambda x: x.get("rank", 999))
    consolante.sort(key=lambda x: x.get("rank", 999))
    eliminee.sort(key=lambda x: x.get("rank", 999))

    print(f"\n   PRINCIPALE ({len(principale)} teams):")
    for t in principale:
        print(f"     #{t['rank']:2d} {t['name']:20s} W:{t.get('wins',0)} PF:{t.get('pointsFor',0)} GA:{t.get('goalAverage',0)}")

    print(f"\n   CONSOLANTE ({len(consolante)} teams):")
    for t in consolante:
        print(f"     #{t['rank']:2d} {t['name']:20s} W:{t.get('wins',0)} PF:{t.get('pointsFor',0)} GA:{t.get('goalAverage',0)}")

    print(f"\n   ÉLIMINÉES ({len(eliminee)} teams):")
    for t in eliminee:
        print(f"     #{t['rank']:2d} {t['name']:20s} W:{t.get('wins',0)} PF:{t.get('pointsFor',0)} GA:{t.get('goalAverage',0)}")

    if no_ranking:
        print(f"\n   No ranking: {no_ranking} teams (pools not finished for them?)")


def start_finals(client: Client, contest_id: str, admin_token: str) -> dict:
    """Start the finals phase. Returns bracket sizes."""
    print("\n7. Starting finals...")
    resp = client.post(f"/api/contests/{contest_id}/start-finals", token=admin_token)
    check(resp, "start finals")
    data = resp.json()
    print(f"   Principale: {data['principale']} teams")
    print(f"   Consolante: {data['consolante']} teams")
    return data


def play_bracket(client: Client, contest_id: str, admin_token: str, teams: list[dict], score_target: int):
    """Play all bracket rounds until both brackets are complete."""
    print("\n8. Playing bracket matches...")
    team_tokens = {t["id"]: t["token"] for t in teams}
    round_num = 0

    while True:
        round_num += 1
        matches = fetch_matches(client, contest_id)
        bracket_pending = [m for m in matches if m.get("bracket") and m["status"] == "pending"]

        if not bracket_pending:
            # Check if there are in-progress bracket matches (shouldn't happen in sim)
            bracket_active = [m for m in matches if m.get("bracket") and m["status"] not in ("completed",)]
            if not bracket_active:
                break
            bracket_pending = [m for m in bracket_active if m["status"] == "pending"]
            if not bracket_pending:
                break

        print(f"   Round {round_num}: {len(bracket_pending)} bracket matches to play...")
        played = 0
        errors = 0

        for match in bracket_pending:
            match_id = match["id"]
            team1_id = match["team1Id"]
            team2_id = match["team2Id"]
            token1 = team_tokens.get(team1_id)
            token2 = team_tokens.get(team2_id)

            if not token1 or not token2:
                errors += 1
                print(f"   WARN: missing token for match {match_id}")
                continue

            # Start match
            resp = client.post(
                f"/api/contests/{contest_id}/matches/{match_id}/start",
                token=token1,
            )
            if resp.status_code >= 400:
                time.sleep(0.05)
                resp = client.post(
                    f"/api/contests/{contest_id}/matches/{match_id}/start",
                    token=token1,
                )
            if resp.status_code >= 400:
                errors += 1
                print(f"   WARN: Could not start match {match_id}: {resp.text[:100]}")
                continue

            # Generate score
            winner_score = score_target
            loser_score = random.randint(0, score_target - 1)
            if random.random() < 0.5:
                s1, s2 = winner_score, loser_score
            else:
                s1, s2 = loser_score, winner_score

            # Submit score
            resp = client.post(
                f"/api/contests/{contest_id}/matches/{match_id}/score",
                token=token1,
                json={"myScore": s1, "theirScore": s2},
            )
            if resp.status_code >= 400:
                errors += 1
                print(f"   WARN: Score submission failed: {resp.text[:100]}")
                continue

            # Confirm score
            resp = client.post(
                f"/api/contests/{contest_id}/matches/{match_id}/confirm",
                token=token2,
            )
            if resp.status_code >= 400:
                errors += 1
                print(f"   WARN: Score confirmation failed: {resp.text[:100]}")
                continue

            played += 1

        print(f"   Played {played}, errors {errors}")

        # Advance both brackets
        for bracket in ("principale", "consolante"):
            resp = client.post(
                f"/api/contests/{contest_id}/advance-bracket?bracket={bracket}",
                token=admin_token,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("newMatches", 0) > 0:
                    print(f"   Advanced {bracket}: {data['newMatches']} new matches")
                elif data.get("bracketComplete"):
                    print(f"   {bracket.capitalize()} complete!")

    # Verify final contest status
    resp = client.get(f"/api/contests/{contest_id}")
    if resp.ok:
        status = resp.json().get("status")
        print(f"\n   Final contest status: {status}")


def show_winners(client: Client, contest_id: str):
    """Display the bracket winners."""
    print("\n9. Final results...")
    matches = fetch_matches(client, contest_id)

    for bracket in ("principale", "consolante"):
        bracket_matches = [m for m in matches if m.get("bracket") == bracket]
        if not bracket_matches:
            continue
        max_round = max(m["bracketRound"] for m in bracket_matches)
        final = [m for m in bracket_matches if m["bracketRound"] == max_round]
        if final and final[0]["status"] == "completed":
            winner_id = final[0]["winnerId"]
            winner_name = final[0]["team1Name"] if winner_id == final[0]["team1Id"] else final[0]["team2Name"]
            print(f"   {bracket.upper()}: {winner_name}")
        else:
            print(f"   {bracket.upper()}: pas de vainqueur")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    config_path = sys.argv[1] if len(sys.argv) > 1 else "config.yaml"
    if not Path(config_path).exists():
        print(f"Config file not found: {config_path}")
        sys.exit(1)

    cfg = load_config(config_path)
    client = Client(cfg["base_url"])

    print("=" * 60)
    print(f"SIMULATION: {cfg['contest']['name']}")
    print(f"Teams: {cfg['teams']['count']}, Pool size: {cfg['contest']['poolSize']}")
    print("=" * 60)
    print()

    t0 = time.time()

    contest_id, admin_token = create_contest(client, cfg)
    teams = register_teams(client, contest_id, cfg)
    start_pools(client, contest_id, admin_token)

    matches = fetch_matches(client, contest_id)
    print(f"   {len(matches)} matches fetched.")

    score_target = cfg["contest"].get("scoreTarget", 13)
    played, errors = play_matches(client, contest_id, matches, teams, score_target)

    print()
    verify_standings(client, contest_id)
    print()
    verify_qualifications(client, contest_id, teams)

    # Finals
    start_finals(client, contest_id, admin_token)
    play_bracket(client, contest_id, admin_token, teams, score_target)
    show_winners(client, contest_id)

    elapsed = time.time() - t0
    print()
    print("=" * 60)
    print(f"DONE in {elapsed:.1f}s")
    print(f"Contest ID: {contest_id}")
    print(f"Admin token: {admin_token}")
    if errors:
        print(f"WARNINGS: {errors} pool match errors encountered")
    print("=" * 60)


if __name__ == "__main__":
    main()
