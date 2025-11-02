/**
 * Mockup de datos de héroes y enemigos
 * 
 * IMPORTANTE: Esta estructura será reemplazada por datos del backend en el futuro.
 * Todos los datos aquí definidos (stats, skills, etc.) vendrán directamente del backend.
 * 
 * Estructura esperada del backend:
 * - Héroes: id, name, health, maxHealth, attack, defense, skills[]
 * - Enemigos: id, name, health, maxHealth, attack, defense
 * - Skills: id, name, description, damage, heal, buff, debuff
 */

// import { HeroId, EnemyId } from '../types/battle'
// import type { Hero, Enemy } from '../types/battle'

/**
 * Mockup de datos de héroes con todas sus stats
 * Stats disponibles:
 * - health: Vida actual
 * - maxHealth: Vida máxima
 * - attack: Poder de ataque
 * - defense: Defensa
 * - skills: Array de skills disponibles (en el futuro vendrá del backend)
 */
// export const HEROES_MOCK_DATA: Hero[] = [
//   {
//     id: HeroId.ANGEL,
//     name: 'Angel',
//     health: 100,
//     maxHealth: 100,
//     attack: 15,
//     defense: 10,
//     skills: [], // Los skills se obtienen dinámicamente desde battleUtils
//     // En el futuro el backend devolverá los skills aquí directamente
//   },
//   {
//     id: HeroId.MAGE,
//     name: 'Mage',
//     health: 80,
//     maxHealth: 80,
//     attack: 20,
//     defense: 5,
//     skills: [], // Los skills se obtienen dinámicamente desde battleUtils
//     // En el futuro el backend devolverá los skills aquí directamente
//   },
//   {
//     id: HeroId.HERO,
//     name: 'Hero',
//     health: 90,
//     maxHealth: 90,
//     attack: 18,
//     defense: 8,
//     skills: [], // Los skills se obtienen dinámicamente desde battleUtils
//     // En el futuro el backend devolverá los skills aquí directamente
//   },
// ]

// /**
//  * Mockup de datos de enemigos con todas sus stats
//  * Stats disponibles:
//  * - health: Vida actual
//  * - maxHealth: Vida máxima
//  * - attack: Poder de ataque
//  * - defense: Defensa
//  */
// export const ENEMIES_MOCK_DATA: Enemy[] = [
//   {
//     id: EnemyId.CASTER,
//     name: 'Caster',
//     health: 60,
//     maxHealth: 60,
//     attack: 12,
//     defense: 5,
//   },
//   {
//     id: EnemyId.SKELETON,
//     name: 'Skeleton',
//     health: 80,
//     maxHealth: 80,
//     attack: 10,
//     defense: 8,
//   },
//   {
//     id: EnemyId.DRAKE,
//     name: 'Drake',
//     health: 100,
//     maxHealth: 100,
//     attack: 15,
//     defense: 10,
//   },
// ]

/**
 * Notas para integración con backend:
 * 
 * 1. Los héroes deberán incluir sus skills directamente en el array skills[]
 * 2. Cada skill debe tener: id, name, description, damage, heal, buff, debuff
 * 3. Los valores de health pueden cambiar durante la batalla (serán actualizados por el backend)
 * 4. Los enemigos pueden tener diferentes stats por nivel/escenario
 * 5. La estructura debe mantenerse compatible con los tipos definidos en types/battle.ts
 */

