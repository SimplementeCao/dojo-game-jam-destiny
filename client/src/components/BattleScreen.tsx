import { useEffect, useRef, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useBattleLogic } from '../hooks/useBattleLogic'
import { HeroId, EnemyId } from '../types/battle'
import '../App.css'
import { levelsConfig, type LevelId } from '../config/levelsConfig'
import { getSkillsIdsByHeroId, getSkillById } from '../utils/battleUtils'
import { useBattleData } from '../hooks/useBattleData'
import { dojoConfig } from '../dojo/dojoConfig'

export default function BattleScreen() {
  const { battleId } = useParams()
  const [heroesStatus, setHeroesStatus] = useState<any[]>([])
  const [monstersStatus, setMonstersStatus] = useState<any[]>([])
  const { battle } = useBattleData(Number(battleId || 0))

  // Cargar characterStatus para héroes y monstruos
  useEffect(() => {
    if (!battle || !battle.id) {
      setHeroesStatus([])
      setMonstersStatus([])
      return
    }

      const loadAllStatuses = async () => {
      console.log('[BattleScreen] 🚀 Starting loadAllStatuses')
      console.log('[BattleScreen] Battle:', battle)
      
      const loadCharacterStatus = async (characterId: number): Promise<any | null> => {
        try {
          console.log(`[BattleScreen] 📡 Loading character ${characterId} for battle ${battle.id}`)
          const response = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                query GetCharacterStatus($battleId: Int!, $characterId: Int!) {
                  destiny4CharacterStatusModels(
                    where: { battle_id: $battleId, character_id: $characterId }
                  ) {
                    edges {
                      node {
                        battle_id
                        character_id
                        current_hp
                        max_hp
                        attack
                        defense
                        critical_chance
                        evasion
                      }
                    }
                  }
                }
              `,
              variables: { battleId: battle.id, characterId: Number(characterId) }
            })
          })
          
          if (!response.ok) {
            console.error(`[BattleScreen] ❌ HTTP error ${response.status} for character ${characterId}`)
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const result = await response.json()
          console.log(`[BattleScreen] 📦 Full response for character ${characterId}:`, JSON.stringify(result, null, 2))
          
          if (result.errors) {
            console.error(`[BattleScreen] ❌ GraphQL errors for character ${characterId}:`, result.errors)
            return null
          }
          
          if (result.data?.destiny4CharacterStatusModels?.edges?.length > 0) {
            const node = result.data.destiny4CharacterStatusModels.edges[0].node
            console.log(`[BattleScreen] ✅ Found data for character ${characterId}:`, node)
            return node
          }
          
          console.warn(`[BattleScreen] ⚠️ No edges found for character ${characterId}`)
          console.warn(`[BattleScreen] Data structure:`, result.data)
          return null
        } catch (error) {
          console.error(`[BattleScreen] ❌ Exception loading character ${characterId}:`, error)
          return null
        }
      }

      // Cargar héroes y monstruos en paralelo
      const heroIds = battle.heroes_ids || []
      const monsterIds = battle.monsters_ids || []
      
      console.log(`[BattleScreen] 📊 Preparing to load ${heroIds.length} heroes and ${monsterIds.length} monsters`)
      console.log('[BattleScreen] Hero IDs:', heroIds)
      console.log('[BattleScreen] Monster IDs:', monsterIds)
      
      const heroPromises = heroIds.map((heroId: any) => 
        loadCharacterStatus(Number(heroId))
      )
      const monsterPromises = monsterIds.map((monsterId: any) => 
        loadCharacterStatus(Number(monsterId))
      )

      console.log('[BattleScreen] ⏳ Waiting for all promises to resolve...')
      const [heroResults, monsterResults] = await Promise.all([
        Promise.all(heroPromises),
        Promise.all(monsterPromises)
      ])

      console.log('[BattleScreen] 📊 Hero results:', heroResults)
      console.log('[BattleScreen] 📊 Monster results:', monsterResults)

      const validHeroes = heroResults.filter((status: any) => status !== null)
      const validMonsters = monsterResults.filter((status: any) => status !== null)
      
      console.log(`[BattleScreen] ✅ Filtered: ${validHeroes.length} heroes, ${validMonsters.length} monsters`)
      console.log('[BattleScreen] ✅ Valid heroes:', validHeroes)
      console.log('[BattleScreen] ✅ Valid monsters:', validMonsters)

      setHeroesStatus(validHeroes)
      setMonstersStatus(validMonsters)
    }

    loadAllStatuses()
  }, [battle?.id])

  const {
    battleState,
    selectHero,
    selectEnemy,
    resetTurn,
    getHeroActions,
    getCompletedActionsForBackend,
    selectSkill,
  } = useBattleLogic()

  const hasProcessedTurn = useRef(false)
  const heroActions = getHeroActions()

  const selectedHeroClass = (heroId: HeroId) => {
    if (battleState.selectedHero === heroId) return 'selected'
    const action = heroActions.find((a) => a.heroId === heroId)
    if (action?.completed) return 'completed'
    if (battleState.phase === 'SELECT_HERO' && action && !action.completed) return 'selectable'
    return ''
  }

  const selectedEnemyClass = () => {
    if (battleState.phase === 'SELECT_ENEMY' && battleState.selectedSkill) return 'selectable'
    return ''
  }

  const getHero = (heroId: HeroId) => battleState.heroes.find((h) => h.id === heroId)
  const getEnemy = (enemyId: EnemyId) => battleState.enemies.find((e) => e.id === enemyId)

  // Obtener los skills del héroe seleccionado
  const selectedHeroSkills = useMemo(() => {
    if (battleState.selectedHero === null) return []
    
    const hero = getHero(battleState.selectedHero)
    if (!hero) return []
    
    // Si el héroe tiene skills en su array, usarlos (convertir SkillId enum a number)
    if (hero.skills && hero.skills.length > 0) {
      return hero.skills.map(skill => {
        // Convertir SkillId enum a número si es necesario
        const skillId = typeof skill.id === 'number' ? skill.id : Number(skill.id)
        return skillId
      })
    }
    
    // Si no, usar la función getSkillsIdsByHeroId como fallback
    return getSkillsIdsByHeroId(battleState.selectedHero)
  }, [battleState.selectedHero, battleState.heroes])

  // Función helper para obtener el icono del skill
  const getSkillIcon = (skillId: number): string => {
    const skill = getSkillById(skillId)
    if (!skill) return '❓'
    
    // Determinar icono según el tipo de skill
    if (skill.damage > 0) return '⚔️'
    if (skill.heal > 0) return '❤️'
    if (skill.buff > 0) return '✨'
    if (skill.debuff > 0) return '💫'
    return '🛡️'
  }

  const handleHeroClick = (heroId: HeroId) => {
    // Solo permitir seleccionar héroe en la fase SELECT_HERO
    if (battleState.phase === 'SELECT_HERO') {
      const heroAction = battleState.heroActions.find((a) => a.heroId === heroId)
      if (heroAction && !heroAction.completed) {
        console.log('🎯 Héroe seleccionado:', HeroId[heroId])
        selectHero(heroId)
      }
    }
  }

  const handleEnemyClick = (enemyId: EnemyId) => {
    // Solo permitir seleccionar enemigo en la fase SELECT_ENEMY cuando hay héroe y skill seleccionados
    if (battleState.phase === 'SELECT_ENEMY' && battleState.selectedHero !== null && battleState.selectedSkill !== null) {
      console.log('🎯 Enemigo seleccionado:', EnemyId[enemyId], 'para atacar')
      selectEnemy(enemyId)
    }
  }

  useEffect(() => {
    console.log('🔍 Battle data:', battle)
    console.log('🔍 Heroes status:', heroesStatus)
    console.log('🔍 Monsters status:', monstersStatus)

    const allCompleted = heroActions.every((a) => a.completed)
    const thirdHeroCompleted = heroActions.find((a) => a.heroId === HeroId.HERO)?.completed

    if (allCompleted && thirdHeroCompleted && !hasProcessedTurn.current) {
      hasProcessedTurn.current = true
      const completedActions = getCompletedActionsForBackend()
      if (completedActions) {
        const timer = setTimeout(() => {
          resetTurn()
          hasProcessedTurn.current = false
        }, 1000)
        return () => clearTimeout(timer)
      } else {
        hasProcessedTurn.current = false
      }
    }

    if (!allCompleted || !thirdHeroCompleted) hasProcessedTurn.current = false
  }, [battle, heroActions, getCompletedActionsForBackend, resetTurn])

  return (
    <div className="battle-screen">
      <h1>Battle Screen</h1>
      <p>Battle ID: {battleId}</p>
      <p>Battle data: {JSON.stringify(battle)}</p>
    </div>
    // <div className={`escenario-root ${config.backgroundClass}`}>
    //   <div className="escenario-bg" />

    //   <div className="side side-left">
    //     {/* Angel */}
    //     <div className="character-wrapper">
    //       <div className="hp-bar-container">
    //         <span className="hp-label">HP</span>
    //         <div className="hp-bar-bg">
    //           <div className="hp-bar-fill" style={{ width: `${((getHero(HeroId.ANGEL)?.health || 0) / (getHero(HeroId.ANGEL)?.maxHealth || 1)) * 100}%` }} />
    //           <span className="hp-text">{getHero(HeroId.ANGEL)?.health || 0}/{getHero(HeroId.ANGEL)?.maxHealth || 0}</span>
    //         </div>
    //       </div>
    //       <div className={`actor actor-angel ${selectedHeroClass(HeroId.ANGEL)}`} onClick={() => handleHeroClick(HeroId.ANGEL)} title="Angel" />
    //     </div>

    //     {/* Mage */}
    //     <div className="character-wrapper">
    //       <div className="hp-bar-container">
    //         <span className="hp-label">HP</span>
    //         <div className="hp-bar-bg">
    //           <div className="hp-bar-fill" style={{ width: `${((getHero(HeroId.MAGE)?.health || 0) / (getHero(HeroId.MAGE)?.maxHealth || 1)) * 100}%` }} />
    //           <span className="hp-text">{getHero(HeroId.MAGE)?.health || 0}/{getHero(HeroId.MAGE)?.maxHealth || 0}</span>
    //         </div>
    //       </div>
    //       <div className={`actor actor-mage ${selectedHeroClass(HeroId.MAGE)}`} onClick={() => handleHeroClick(HeroId.MAGE)} title="Mage" />
    //     </div>

    //     {/* Hero */}
    //     <div className="character-wrapper">
    //       <div className="hp-bar-container">
    //         <span className="hp-label">HP</span>
    //         <div className="hp-bar-bg">
    //           <div className="hp-bar-fill" style={{ width: `${((getHero(HeroId.HERO)?.health || 0) / (getHero(HeroId.HERO)?.maxHealth || 1)) * 100}%` }} />
    //           <span className="hp-text">{getHero(HeroId.HERO)?.health || 0}/{getHero(HeroId.HERO)?.maxHealth || 0}</span>
    //         </div>
    //       </div>
    //       <div className={`actor actor-hero ${selectedHeroClass(HeroId.HERO)}`} onClick={() => handleHeroClick(HeroId.HERO)} title="Hero" />
    //     </div>
    //   </div>

    //   <div className="side side-right">
    //     {config.enemies.map((enemyId, idx) => (
    //       <div key={`${enemyId}-${idx}`} className="character-wrapper">
    //         <div className="hp-bar-container">
    //           <span className="hp-label">HP</span>
    //           <div className="hp-bar-bg">
    //             <div className="hp-bar-fill" style={{ width: `${((getEnemy(enemyId)?.health || 0) / (getEnemy(enemyId)?.maxHealth || 1)) * 100}%` }} />
    //             <span className="hp-text">{getEnemy(enemyId)?.health || 0}/{getEnemy(enemyId)?.maxHealth || 0}</span>
    //           </div>
    //         </div>
    //         <div className={`enemy ${enemyId === EnemyId.CASTER ? 'enemy-caster' : enemyId === EnemyId.SKELETON ? 'enemy-skeleton' : 'enemy-drake'} ${selectedEnemyClass()}`} onClick={() => handleEnemyClick(enemyId)} title={EnemyId[enemyId]} />
    //       </div>
    //     ))}
    //   </div>
    //   {/* Botones de habilidades - mostrar dinámicamente según el héroe seleccionado */}
    //   {battleState.phase === 'SELECT_SKILL' && battleState.selectedHero !== null && selectedHeroSkills.length > 0 && (
    //     <div className="skills-buttons-container">
    //       {selectedHeroSkills.map((skillId) => {
    //         const skill = getSkillById(skillId)
    //         if (!skill) return null
            
    //         // Comparar como números para que funcione con enum y number
    //         const selectedSkillNum = battleState.selectedSkill !== null 
    //           ? (typeof battleState.selectedSkill === 'number' ? battleState.selectedSkill : Number(battleState.selectedSkill))
    //           : null
    //         const isSelected = selectedSkillNum === skillId
            
    //         return (
    //           <button 
    //             key={skillId}
    //             className={`skills-buttons ${isSelected ? 'highlighted' : ''}`}
    //             onClick={() => {
    //               console.log(`🎯 Skill seleccionado: ${skill.name} (ID: ${skillId})`)
    //               selectSkill(skillId)
    //             }}
    //           >
    //             <span className="skill-icon">{getSkillIcon(skillId)}</span>
    //             <span className="skill-text">{skill.name}.</span>
    //           </button>
    //         )
    //       })}
    //     </div>
    //   )}
    // </div>
  )
}
