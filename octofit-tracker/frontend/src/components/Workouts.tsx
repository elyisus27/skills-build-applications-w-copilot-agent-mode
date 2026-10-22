import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = { title: string; focus: string; minutes: number; difficulty: string; reason: string };

const loadWorkoutSuggestions = () => getJson<Record<string, unknown>>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`);

export default function Workouts() {
  return <CapabilityCard<WorkoutSuggestion>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    loadData={loadWorkoutSuggestions}
    dataKey="suggestions"
    emptyMessage="No workout suggestions are available."
    renderItem={(workout) => `${workout.title} — ${workout.focus}, ${workout.minutes} minutes, ${workout.difficulty}. ${workout.reason}`}
  />;
}
