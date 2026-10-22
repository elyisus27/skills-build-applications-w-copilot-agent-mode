import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot: string; members: Array<string | { name?: string }> };

const loadTeams = () => getJson<Record<string, unknown>>('/api/teams');

export default function Teams() {
  return <CapabilityCard<Team>
    title="Teams"
    description="Manage teams and members."
    loadData={loadTeams}
    dataKey="teams"
    emptyMessage="No teams yet."
    renderItem={(team) => `${team.name} (${team.mascot})${team.members.length ? ` — ${team.members.map((member) => typeof member === 'string' ? member : member.name ?? 'Member').join(', ')}` : ''}`}
  />;
}
