export enum HeroId {
  ANGEL = 0,
  MAGE = 1,
  HERO = 2,
}

export enum EnemyId {
  CASTER = 0,
  SKELETON = 1,
  DRAKE = 2,
}

export enum SkillId {
  BASIC_ATTACK = 0,
  SPECIAL_ATTACK = 1,
  HEAL = 2,
  DEFEND = 3,
}

export interface Hero {
  id: HeroId;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  skills: Skill[];
}

export interface Enemy {
  id: EnemyId;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
}

export interface Skill {
  id: SkillId;
  name: string;
  damage?: number;
  heal?: number;
  description: string;
  cooldown?: number;
}

export interface HeroAction {
  heroId: HeroId;
  skillId: SkillId | number | null; // Acepta enum (0-3), números (1-7) de battleUtils, o null si no se ha seleccionado
  targetEnemyId: EnemyId | null;
  completed: boolean;
}

export type BattlePhase = 'SELECT_HERO' | 'SELECT_SKILL' | 'SELECT_ENEMY' | 'EXECUTING' | 'COMPLETE';

export interface BattleState {
  phase: BattlePhase;
  selectedHero: HeroId | null;
  selectedSkill: SkillId | number | null; // Acepta enum (0-3) o números (1-7) de battleUtils
  heroes: Hero[];
  enemies: Enemy[];
  heroActions: HeroAction[]; // Matriz de acciones de los 3 héroes
  currentHeroIndex: number; // Índice del héroe que está seleccionando (0-2)
}

