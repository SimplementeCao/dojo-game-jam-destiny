import { EnemyId } from '../types/battle'

export type LevelId = 1 | 2 | 3

type LevelConfig = {
  backgroundClass: `escenario-${LevelId}`
  enemies: EnemyId[]
}

export const levelsConfig: Record<LevelId, LevelConfig> = {
  1: {
    backgroundClass: 'escenario-1',
    enemies: [EnemyId.CASTER, EnemyId.SKELETON, EnemyId.DRAKE],
  },
  2: {
    backgroundClass: 'escenario-2',
    enemies: [EnemyId.CASTER, EnemyId.SKELETON],
  },
  3: {
    backgroundClass: 'escenario-3',
    enemies: [EnemyId.DRAKE],
  },
}


