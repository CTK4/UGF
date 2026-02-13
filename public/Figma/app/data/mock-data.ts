/**
 * Football GM - Mock Data
 * 
 * This file contains all the mock data and utility functions for the Football GM simulation app.
 * The app follows a dark, premium design system inspired by NFL broadcast interfaces and war room software.
 */

export type RatingLevel = 'elite' | 'high' | 'mid' | 'low' | 'poor';

export interface Player {
  id: string;
  name: string;
  position: string;
  archetype: string;
  age: number;
  ovr: number;
  avatar?: string;
  status?: 'normal' | 'injured' | 'rising' | 'declining';
  team?: string;
  contractYears?: number;
  ratings?: {
    physical?: Record<string, number>;
    mental?: Record<string, number>;
    technical?: Record<string, number>;
  };
  traits?: Array<{ text: string; type: 'positive' | 'neutral' | 'negative' }>;
}

export interface NewsItem {
  id: string;
  headline: string;
  timestamp: string;
  description: string;
  cta?: string;
}

export interface Play {
  id: string;
  name: string;
  formation: string;
  usage: number;
  personnel: string;
  isOverused?: boolean;
}

export interface Matchup {
  opponent: string;
  opponentLogo: string;
  location: 'AT' | 'VS';
  yourTeam: string;
  yourLogo: string;
  comparison: {
    off: { opponent: number; yours: number };
    def: { opponent: number; yours: number };
    ovr: { opponent: number; yours: number };
  };
}

export const getRatingColor = (ovr: number): string => {
  if (ovr >= 90) return '#00FF7F'; // elite
  if (ovr >= 80) return '#22C55E'; // high
  if (ovr >= 70) return '#FACC15'; // mid
  if (ovr >= 60) return '#F97316'; // low
  return '#EF4444'; // poor
};

export const getRatingLevel = (ovr: number): RatingLevel => {
  if (ovr >= 90) return 'elite';
  if (ovr >= 80) return 'high';
  if (ovr >= 70) return 'mid';
  if (ovr >= 60) return 'low';
  return 'poor';
};

export const mockMatchup: Matchup = {
  opponent: 'Patriots',
  opponentLogo: '🏈',
  location: 'AT',
  yourTeam: 'Ravens',
  yourLogo: '🦅',
  comparison: {
    off: { opponent: 78, yours: 85 },
    def: { opponent: 82, yours: 79 },
    ovr: { opponent: 80, yours: 82 },
  },
};

export const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Marcus Jackson',
    position: 'QB',
    archetype: 'Field General',
    age: 26,
    ovr: 92,
    status: 'rising',
    team: 'Ravens',
    contractYears: 3,
    ratings: {
      physical: { Speed: 78, Strength: 85, Agility: 82 },
      mental: { Awareness: 95, 'Play Recognition': 93, Poise: 90 },
      technical: { 'Short Accuracy': 94, 'Mid Accuracy': 92, 'Deep Accuracy': 89 },
    },
    traits: [
      { text: 'Clutch Performer', type: 'positive' },
      { text: 'High Football IQ', type: 'positive' },
      { text: 'Injury Prone', type: 'negative' },
    ],
  },
  {
    id: '2',
    name: 'Devon Williams',
    position: 'WR',
    archetype: 'Deep Threat',
    age: 24,
    ovr: 87,
    status: 'rising',
  },
  {
    id: '3',
    name: 'James Rodriguez',
    position: 'LB',
    archetype: 'Run Stopper',
    age: 29,
    ovr: 84,
    status: 'normal',
  },
  {
    id: '4',
    name: 'Tyler Brooks',
    position: 'CB',
    archetype: 'Man Coverage',
    age: 27,
    ovr: 81,
    status: 'normal',
  },
  {
    id: '5',
    name: 'Andre Thompson',
    position: 'RB',
    archetype: 'Power Back',
    age: 31,
    ovr: 76,
    status: 'declining',
  },
  {
    id: '6',
    name: 'Chris Miller',
    position: 'DE',
    archetype: 'Speed Rusher',
    age: 25,
    ovr: 88,
    status: 'rising',
  },
];

export const mockNews: NewsItem[] = [
  {
    id: '1',
    headline: 'Marcus Jackson Named AFC Offensive Player of the Week',
    timestamp: '2 hours ago',
    description:
      'After throwing for 412 yards and 4 TDs in Sunday\'s victory, QB Marcus Jackson has been recognized for his outstanding performance.',
    cta: 'View Stats',
  },
  {
    id: '2',
    headline: 'Injury Report: Andre Thompson Listed as Questionable',
    timestamp: '5 hours ago',
    description:
      'RB Andre Thompson suffered a hamstring injury during practice. His status for Week 8 is uncertain.',
    cta: 'Check Depth Chart',
  },
  {
    id: '3',
    headline: 'Contract Negotiations: Devon Williams Seeking Extension',
    timestamp: '1 day ago',
    description:
      'WR Devon Williams\' agent has requested talks about a long-term extension. Cap space will be tight.',
    cta: 'Review Finances',
  },
];

export const mockPlays: Play[] = [
  {
    id: '1',
    name: 'PA Boot',
    formation: 'Singleback',
    usage: 12,
    personnel: '11',
  },
  {
    id: '2',
    name: 'Inside Zone',
    formation: 'I-Form',
    usage: 18,
    personnel: '21',
    isOverused: true,
  },
  {
    id: '3',
    name: 'Four Verts',
    formation: 'Shotgun',
    usage: 8,
    personnel: '10',
  },
  {
    id: '4',
    name: 'Quick Slants',
    formation: 'Shotgun',
    usage: 15,
    personnel: '11',
  },
  {
    id: '5',
    name: 'Dive Strong',
    formation: 'Goal Line',
    usage: 5,
    personnel: '22',
  },
  {
    id: '6',
    name: 'Y-Corner',
    formation: 'Trips',
    usage: 10,
    personnel: '11',
  },
];

export const mockContacts = [
  { id: '1', name: 'General Manager', role: 'GM', unread: 2 },
  { id: '2', name: 'Offensive Coordinator', role: 'OC', unread: 0 },
  { id: '3', name: 'Defensive Coordinator', role: 'DC', unread: 1 },
  { id: '4', name: 'Team Owner', role: 'Owner', unread: 0 },
  { id: '5', name: 'Player Agent', role: 'Agent', unread: 3 },
];

export const mockDraftProspects: Player[] = [
  {
    id: 'd1',
    name: 'Jayden Miller',
    position: 'QB',
    archetype: 'Dual Threat',
    age: 21,
    ovr: 84,
  },
  {
    id: 'd2',
    name: 'Malik Johnson',
    position: 'WR',
    archetype: 'Route Runner',
    age: 22,
    ovr: 82,
  },
  {
    id: 'd3',
    name: 'Trent Davis',
    position: 'OT',
    archetype: 'Pass Protector',
    age: 23,
    ovr: 80,
  },
];