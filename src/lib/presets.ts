import type { ChoreFrequency } from '../models';

export const AVATAR_EMOJIS = ['🦊', '🐼', '🦁', '🐸', '🐵', '🦄', '🐯', '🐨', '🐙', '🦖', '🐰', '🐶', '🐱', '🐧', '🦉', '🐝'];

export const AVATAR_COLORS = ['#FF8A65', '#4FC3F7', '#81C784', '#BA68C8', '#FFD54F', '#F06292', '#4DB6AC', '#7986CB'];

export const CHORE_ICONS = ['🛏️', '🍽️', '🗑️', '🧺', '🧹', '🐕', '🪴', '🧸', '🚿', '📚', '🦷', '🍳', '🧽', '🚗', '🍂', '✨'];

export interface ChorePreset {
  name: string;
  icon: string;
  frequency: ChoreFrequency;
}

export const STARTER_CHORES: ChorePreset[] = [
  { name: 'Make your bed', icon: '🛏️', frequency: 'daily' },
  { name: 'Clear the table', icon: '🍽️', frequency: 'daily' },
  { name: 'Tidy your room', icon: '🧸', frequency: 'weekly' },
  { name: 'Take out the trash', icon: '🗑️', frequency: 'weekly' },
  { name: 'Feed the pet', icon: '🐕', frequency: 'daily' },
  { name: 'Put away laundry', icon: '🧺', frequency: 'weekly' },
  { name: 'Water the plants', icon: '🪴', frequency: 'weekly' },
  { name: 'Sweep the kitchen', icon: '🧹', frequency: 'weekly' },
];
