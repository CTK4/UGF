import leagueDB from './leagueDB.json';

export interface Team {
  teamId: string;
  name: string;
  logoKey: string;
  city: string;
  tier: string;
  ovr: number;
  off: number;
  def: number;
}

export interface Player {
  playerId: string;
  firstName: string;
  lastName: string;
  position: string;
  archetype: string;
  age: number;
  ovr: number;
  contractTeamId: string;
  contractYears: number;
  contractSalary: number;
  ratings?: {
    physical?: Record<string, number>;
    mental?: Record<string, number>;
    technical?: Record<string, number>;
  };
  traits?: Array<{ text: string; type: 'positive' | 'neutral' | 'negative' }>;
  status?: 'normal' | 'injured' | 'rising' | 'declining';
}

export interface Personnel {
  personnelId: string;
  firstName: string;
  lastName: string;
  role: string;
  age: number;
  ovr: number;
  contractTeamId: string;
  contractYears: number;
  contractSalary: number;
  specialty: string;
}

/**
 * Normalize role for display
 */
export function normalizeRole(role: string): string {
  if (role === 'WR_RB_COACH') {
    return 'WR/RB Coach';
  }
  return role;
}

/**
 * Check if role is a position coach (not coordinator, not HC)
 */
export function isPositionCoach(role: string): boolean {
  const coordinatorRoles = ['HC', 'OC', 'DC', 'STC'];
  return !coordinatorRoles.includes(role);
}

/**
 * Get team logo path
 */
export function getTeamLogoPath(logoKey: string): string {
  return `/logos/${logoKey}.png`;
}

/**
 * List all teams
 */
export function listTeams(): Team[] {
  return leagueDB.Teams as Team[];
}

/**
 * Get team by ID
 */
export function getTeam(teamId: string): Team | null {
  const team = leagueDB.Teams.find((t) => t.teamId === teamId);
  return team ? (team as Team) : null;
}

/**
 * Get roster for a team
 */
export function getRoster(teamId: string): Player[] {
  return leagueDB.Players.filter((p) => p.contractTeamId === teamId) as Player[];
}

/**
 * Get player by ID
 */
export function getPlayer(playerId: string): Player | null {
  const player = leagueDB.Players.find((p) => p.playerId === playerId);
  return player ? (player as Player) : null;
}

/**
 * Get staff for a team
 */
export function getStaff(teamId: string): Personnel[] {
  return leagueDB.Personnel.filter((p) => p.contractTeamId === teamId) as Personnel[];
}

/**
 * Get all free agent coaches
 */
export function getFreeAgentCoaches(): Personnel[] {
  return leagueDB.Personnel.filter((p) => p.contractTeamId === 'FREE_AGENT') as Personnel[];
}

/**
 * Get personnel by ID
 */
export function getPersonnel(personnelId: string): Personnel | null {
  const personnel = leagueDB.Personnel.find((p) => p.personnelId === personnelId);
  return personnel ? (personnel as Personnel) : null;
}
