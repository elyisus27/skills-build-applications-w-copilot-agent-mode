import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

const loadLeaderboard = () => getJson<Record<string, unknown>>('/api/leaderboard');

export default function Leaderboard() {
  return <CapabilityCard<LeaderboardEntry>
    title="Leaderboard"
    description="Compare team point totals."
    loadData={loadLeaderboard}
    dataKey="leaderboard"
    emptyMessage="No leaderboard rankings yet."
    renderItem={(entry) => `#${entry.rank} ${entry.teamName} — ${entry.totalPoints} points`}
  />;
}
