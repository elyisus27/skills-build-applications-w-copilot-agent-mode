import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

type ActivityInput = {
  userId?: unknown;
  teamId?: unknown;
  type?: unknown;
  minutes?: unknown;
};

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Activity details are required');
  const { userId, teamId, type, minutes } = input as ActivityInput;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) throw badRequest('A valid userId is required');
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) throw badRequest('A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) throw badRequest('A valid activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) throw badRequest('Minutes must be a positive number');

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw notFound('User not found');
  if (!team) throw notFound('Team not found');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

type TeamInput = {
  name?: unknown;
  mascot?: unknown;
  members?: unknown;
};

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Team details are required');
  const { name, mascot, members } = input as TeamInput;
  if (typeof name !== 'string' || !name.trim()) throw badRequest('A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw badRequest('A team mascot is required');
  if (members !== undefined && (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member)))) {
    throw badRequest('Team members must be valid user IDs');
  }
  const memberIds = (members ?? []) as string[];
  const foundMembers = memberIds.length === 0 ? [] : await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (foundMembers.length !== new Set(memberIds).size) throw notFound('One or more team members were not found');
  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  return team.toObject();
}

export async function getLeaderboard() {
  const [teams, activityTotals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(activityTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw notFound('User not found');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus = recentActivity?.type.toLowerCase() === 'run' || recentActivity?.type.toLowerCase() === 'cycle'
    ? 'endurance'
    : recentActivity?.type.toLowerCase();
  const focus = activityFocus || user.fitnessGoal.toLowerCase();
  const workouts = await Workout.find({ focus: new RegExp(`^${focus}$`, 'i') }).sort({ title: 1 }).lean();
  const suggestions = workouts.length > 0 ? workouts : await Workout.find().sort({ title: 1 }).lean();
  return suggestions.map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === user.fitnessGoal.toLowerCase()
      ? `Matches your ${user.fitnessGoal} fitness goal.`
      : `Recommended based on your recent ${recentActivity?.type ?? 'activity'} activity.`,
  }));
}

export { User };
