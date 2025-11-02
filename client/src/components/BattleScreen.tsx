import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
// import { useBattleLogic } from '../hooks/useBattleLogic'
import '../App.css'
// import { getSkillsIdsByHeroId, getSkillById } from '../utils/battleUtils'
import { useBattleData } from '../hooks/useBattleData'
import { dojoConfig } from '../dojo/dojoConfig'
import { useGameActions } from '../hooks/useGameActions'
import { useRef } from 'react'
import FloatingNumber from './FloatingNumber'

interface FloatingAnimation {
  id: string
  value: string | number
  x: number
  y: number
  color: string
  critical?: boolean
  label?: string
}

export default function BattleScreen() {
  const { battleId } = useParams()
  const [heroesStatus, setHeroesStatus] = useState<any[]>([])
  const [monstersStatus, setMonstersStatus] = useState<any[]>([])
  const { battle } = useBattleData(Number(battleId || 0))
  const { play } = useGameActions();
  const [floatingAnimations, setFloatingAnimations] = useState<FloatingAnimation[]>([])
  // Estado para rastrear qué personajes están en modo hit/dmg
  const [characterAnimations, setCharacterAnimations] = useState<{ [characterId: number]: 'hit' | 'dmg' | 'idle' }>({})

  const loadAllStatuses = useRef<(() => Promise<void>) | null>(null)
  const heroesRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const monstersRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  // Cargar characterStatus para héroes y monstruos
  useEffect(() => {
    if (!battle || !battle.id) {
      setHeroesStatus([])
      setMonstersStatus([])
      return
    }

      const loadStatuses = async () => {
      const loadCharacterStatus = async (characterId: number): Promise<any | null> => {
        try {
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
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const result = await response.json()
          
          if (result.errors) {
            return null
          }
          
          if (result.data?.destiny4CharacterStatusModels?.edges?.length > 0) {
            const node = result.data.destiny4CharacterStatusModels.edges[0].node
            return node
          }
          
          return null
        } catch (error) {
          return null
        }
      }

      // Cargar héroes y monstruos en paralelo
      const heroIds = battle.heroes_ids || []
      const monsterIds = battle.monsters_ids || []
      
      const heroPromises = heroIds.map((heroId: any) => 
        loadCharacterStatus(Number(heroId))
      )
      const monsterPromises = monsterIds.map((monsterId: any) => 
        loadCharacterStatus(Number(monsterId))
      )

      const [heroResults, monsterResults] = await Promise.all([
        Promise.all(heroPromises),
        Promise.all(monsterPromises)
      ])

      const validHeroes = heroResults.filter((status: any) => status !== null)
      const validMonsters = monsterResults.filter((status: any) => status !== null)

      setHeroesStatus(validHeroes)
      setMonstersStatus(validMonsters)
    }

    loadAllStatuses.current = loadStatuses
    loadStatuses()
  }, [battle?.id])

 
  // Función helper para convertir valores hexadecimales/BigNumberish a número decimal
  const parseToDecimal = (value: any): number => {
    if (typeof value === 'number') return value
    if (typeof value === 'bigint') return Number(value)
    if (typeof value === 'string') {
      // Si es hexadecimal, convertir
      if (value.startsWith('0x') || value.startsWith('0X')) {
        return parseInt(value, 16)
      }
      // Si es un número en string, convertir
      return parseInt(value, 10)
    }
    // Si es BigNumber u otro tipo, intentar convertir
    try {
      return Number(value)
    } catch {
      return 0
    }
  }

  // Función para obtener el character_id desde un índice
  const getCharacterIdFromIndex = (idx: number, isMonster: boolean): number | null => {
    const statusList = isMonster ? monstersStatus : heroesStatus
    if (idx >= 0 && idx < statusList.length) {
      return statusList[idx]?.character_id || null
    }
    return null
  }

  // Función para obtener la posición de un personaje basado en su character_id
  const getCharacterPosition = (characterId: number, isMonster: boolean): { x: number; y: number } | null => {
    const refs = isMonster ? monstersRefs.current : heroesRefs.current
    const element = refs[characterId]
    
    if (!element) return null
    
    const rect = element.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
  }

  // Función para cambiar temporalmente la animación de un personaje
  const setCharacterAnimation = (characterId: number, animation: 'hit' | 'dmg', duration = 600) => {
    setCharacterAnimations(prev => ({
      ...prev,
      [characterId]: animation
    }))

    setTimeout(() => {
      setCharacterAnimations(prev => ({
        ...prev,
        [characterId]: 'idle'
      }))
    }, duration)
  }

  // Función para agregar una animación flotante
  const addFloatingAnimation = (value: string | number, x: number, y: number, color: string, critical = false, label?: string) => {
    const id = `anim-${Date.now()}-${Math.random()}`
    const animation: FloatingAnimation = { id, value, x, y, color, critical, label }
    
    setFloatingAnimations(prev => [...prev, animation])
    
    // Remover la animación después de que termine
    setTimeout(() => {
      setFloatingAnimations(prev => prev.filter(a => a.id !== id))
    }, 1500)
  }

  const handlePlay = async () => {
    const result = await play(["001", "111", "221"]);
    if (result) {
      // Esperar un momento para que los refs estén actualizados
      await new Promise(resolve => setTimeout(resolve, 100))

      // Procesar eventos con un pequeño delay entre cada uno para mejor visualización
      for (let i = 0; i < result.parsed_events.length; i++) {
        const event = result.parsed_events[i]
        
        setTimeout(() => {
          if (event.key === "DamageEvent") {
            const { battle_id, from_idx, to_idx, critical_hit, damage, is_monster } = event.data;
            console.log(`🔥 Damage event: { battle_id: ${battle_id}, from_idx: ${from_idx}, to_idx: ${to_idx}, critical_hit: ${critical_hit}, damage: ${damage}, is_monster: ${is_monster} }`);
            
            const attackerIsMonster = parseToDecimal(is_monster) === 1
            const targetIsMonster = !attackerIsMonster // El objetivo es del lado opuesto
            
            // Obtener character_ids desde los índices
            const fromCharacterId = getCharacterIdFromIndex(parseToDecimal(from_idx), attackerIsMonster)
            const toCharacterId = getCharacterIdFromIndex(parseToDecimal(to_idx), targetIsMonster)
            
            // Cambiar animaciones de ataque y daño
            if (fromCharacterId !== null) {
              setCharacterAnimation(fromCharacterId, 'hit')
            }
            if (toCharacterId !== null) {
              setCharacterAnimation(toCharacterId, 'dmg')
            }
            
            // Mostrar animación flotante en el objetivo
            if (toCharacterId !== null) {
              const position = getCharacterPosition(toCharacterId, targetIsMonster)
              if (position) {
                const isCritical = parseToDecimal(critical_hit) === 1
                const color = isCritical ? '#ff6b6b' : '#ff3333' // Rojo claro para crítico, rojo oscuro para normal
                const damageValue = parseToDecimal(damage)
                addFloatingAnimation(
                  `-${damageValue}`,
                  position.x,
                  position.y,
                  color,
                  isCritical,
                  isCritical ? 'Critical Hit!' : undefined
                )
              }
            }
          } 
          else if (event.key === "BuffEvent") {
            const { battle_id, from_idx, to_idx, buff_id, amount, is_monster } = event.data;
            console.log(`🔥 Buff event: { battle_id: ${battle_id}, from_idx: ${from_idx}, to_idx: ${to_idx}, buff_id: ${buff_id}, amount: ${amount}, is_monster: ${is_monster} }`);
            
            const attackerIsMonster = parseToDecimal(is_monster) === 1
            const targetIsMonster = !attackerIsMonster
            
            const fromCharacterId = getCharacterIdFromIndex(parseToDecimal(from_idx), attackerIsMonster)
            const toCharacterId = getCharacterIdFromIndex(parseToDecimal(to_idx), targetIsMonster)
            
            if (fromCharacterId !== null) {
              setCharacterAnimation(fromCharacterId, 'hit')
            }
            
            if (toCharacterId !== null) {
              const position = getCharacterPosition(toCharacterId, targetIsMonster)
              if (position) {
                const amountValue = parseToDecimal(amount)
                addFloatingAnimation(
                  `+${amountValue}`,
                  position.x,
                  position.y,
                  '#4ecdc4' // Turquesa para buff
                )
              }
            }
          }
          else if (event.key === "DebuffEvent") {
            const { battle_id, from_idx, to_idx, debuff_id, amount, is_monster } = event.data;
            console.log(`🔥 Debuff event: { battle_id: ${battle_id}, from_idx: ${from_idx}, to_idx: ${to_idx}, debuff_id: ${debuff_id}, amount: ${amount}, is_monster: ${is_monster} }`);
            
            const attackerIsMonster = parseToDecimal(is_monster) === 1
            const targetIsMonster = !attackerIsMonster
            
            const fromCharacterId = getCharacterIdFromIndex(parseToDecimal(from_idx), attackerIsMonster)
            const toCharacterId = getCharacterIdFromIndex(parseToDecimal(to_idx), targetIsMonster)
            
            // Animación de ataque para quien aplica el debuff
            if (fromCharacterId !== null) {
              setCharacterAnimation(fromCharacterId, 'hit')
            }
            
            // Animación de daño para quien recibe el debuff (efecto negativo)
            if (toCharacterId !== null) {
              setCharacterAnimation(toCharacterId, 'dmg')
              
              const position = getCharacterPosition(toCharacterId, targetIsMonster)
              if (position) {
                const amountValue = parseToDecimal(amount)
                addFloatingAnimation(
                  `-${amountValue}`,
                  position.x,
                  position.y,
                  '#9b59b6' // Púrpura para debuff
                )
              }
            }
          }
          else if (event.key === "HealEvent") {
            const { battle_id, from_idx, to_idx, amount, is_monster } = event.data;
            console.log(`🔥 Heal event: { battle_id: ${battle_id}, from_idx: ${from_idx}, to_idx: ${to_idx}, amount: ${amount}, is_monster: ${is_monster} }`);
            
            const attackerIsMonster = parseToDecimal(is_monster) === 1
            const targetIsMonster = !attackerIsMonster
            
            const fromCharacterId = getCharacterIdFromIndex(parseToDecimal(from_idx), attackerIsMonster)
            const toCharacterId = getCharacterIdFromIndex(parseToDecimal(to_idx), targetIsMonster)
            
            if (fromCharacterId !== null) {
              setCharacterAnimation(fromCharacterId, 'hit')
            }
            
            if (toCharacterId !== null) {
              const position = getCharacterPosition(toCharacterId, targetIsMonster)
              if (position) {
                const amountValue = parseToDecimal(amount)
                addFloatingAnimation(
                  `+${amountValue}`,
                  position.x,
                  position.y,
                  '#51cf66' // Verde para heal
                )
              }
            }
          }
          else if (event.key === "MissEvent") {
            const { battle_id, from_idx, to_idx, is_monster } = event.data;
            console.log(`🔥 Miss event: { battle_id: ${battle_id}, from_idx: ${from_idx}, to_idx: ${to_idx}, is_monster: ${is_monster} }`);
            
            const attackerIsMonster = parseToDecimal(is_monster) === 1
            const targetIsMonster = !attackerIsMonster
            
            const fromCharacterId = getCharacterIdFromIndex(parseToDecimal(from_idx), attackerIsMonster)
            const toCharacterId = getCharacterIdFromIndex(parseToDecimal(to_idx), targetIsMonster)
            
            if (fromCharacterId !== null) {
              setCharacterAnimation(fromCharacterId, 'hit')
            }
            
            if (toCharacterId !== null) {
              const position = getCharacterPosition(toCharacterId, targetIsMonster)
              if (position) {
                addFloatingAnimation(
                  'MISS',
                  position.x,
                  position.y,
                  '#ffd43b' // Amarillo para miss
                )
              }
            }
          }
          else if (event.key === "PlayerWinEvent") {
            const { battle_id, player } = event.data;
            console.log(`🔥 Player win event: { battle_id: ${battle_id}, player: ${player} }`);
            
            // Animación en el centro de la pantalla
            const centerX = window.innerWidth / 2
            const centerY = window.innerHeight / 2
            addFloatingAnimation(
              'VICTORY!',
              centerX,
              centerY,
              '#51cf66' // Verde para victoria
            )
          }
          else if (event.key === "PlayerLoseEvent") {
            const { battle_id, player } = event.data;
            console.log(`🔥 Player lose event: { battle_id: ${battle_id}, player: ${player} }`);
            
            // Animación en el centro de la pantalla
            const centerX = window.innerWidth / 2
            const centerY = window.innerHeight / 2
            addFloatingAnimation(
              'DEFEAT',
              centerX,
              centerY,
              '#ff3333' // Rojo para derrota
            )
          }
        }, i * 1000) // Delay de 1000ms entre cada animación
      }

      // Calcular cuándo terminan todas las animaciones
      // Último evento empieza en: (número_eventos - 1) * 1000ms
      // Cada animación dura: 1500ms
      // Entonces todas terminan en: (número_eventos - 1) * 1000 + 1500
      const totalEvents = result.parsed_events.length
      const lastEventStartTime = totalEvents > 0 ? (totalEvents - 1) * 1000 : 0
      const animationDuration = 1500 // Duración de cada animación flotante
      const timeUntilAllAnimationsEnd = lastEventStartTime + animationDuration + 500 // Extra 500ms de buffer

      // Recargar estados después de que todas las animaciones terminen
      setTimeout(async () => {
        if (loadAllStatuses.current) {
          await loadAllStatuses.current();
        }
      }, timeUntilAllAnimationsEnd);
    }
  }
  
  // const {
  //   battleState,
  //   selectHero,
  //   selectEnemy,
  //   resetTurn,
  //   getHeroActions,
  //   getCompletedActionsForBackend,
  //   selectSkill,
  // } = useBattleLogic()

  // const hasProcessedTurn = useRef(false)
  // const heroActions = getHeroActions()

  // const selectedHeroClass = (heroId: HeroId) => {
  //   if (battleState.selectedHero === heroId) return 'selected'
  //   const action = heroActions.find((a) => a.heroId === heroId)
  //   if (action?.completed) return 'completed'
  //   if (battleState.phase === 'SELECT_HERO' && action && !action.completed) return 'selectable'
  //   return ''
  // }

  // const selectedEnemyClass = () => {
  //   if (battleState.phase === 'SELECT_ENEMY' && battleState.selectedSkill) return 'selectable'
  //   return ''
  // }

  // const getHero = (heroId: HeroId) => battleState.heroes.find((h) => h.id === heroId)
  // const getEnemy = (enemyId: EnemyId) => battleState.enemies.find((e) => e.id === enemyId)

  // // Obtener los skills del héroe seleccionado
  // const selectedHeroSkills = useMemo(() => {
  //   if (battleState.selectedHero === null) return []
    
  //   const hero = getHero(battleState.selectedHero)
  //   if (!hero) return []
    
  //   // Si el héroe tiene skills en su array, usarlos (convertir SkillId enum a number)
  //   if (hero.skills && hero.skills.length > 0) {
  //     return hero.skills.map(skill => {
  //       // Convertir SkillId enum a número si es necesario
  //       const skillId = typeof skill.id === 'number' ? skill.id : Number(skill.id)
  //       return skillId
  //     })
  //   }
    
  //   // Si no, usar la función getSkillsIdsByHeroId como fallback
  //   return getSkillsIdsByHeroId(battleState.selectedHero)
  // }, [battleState.selectedHero, battleState.heroes])

  // // Función helper para obtener el icono del skill
  // const getSkillIcon = (skillId: number): string => {
  //   const skill = getSkillById(skillId)
  //   if (!skill) return '❓'
    
  //   // Determinar icono según el tipo de skill
  //   if (skill.damage > 0) return '⚔️'
  //   if (skill.heal > 0) return '❤️'
  //   if (skill.buff > 0) return '✨'
  //   if (skill.debuff > 0) return '💫'
  //   return '🛡️'
  // }

  // const handleHeroClick = (heroId: HeroId) => {
  //   // Solo permitir seleccionar héroe en la fase SELECT_HERO
  //     if (battleState.phase === 'SELECT_HERO') {
  //       const heroAction = battleState.heroActions.find((a) => a.heroId === heroId)
  //       if (heroAction && !heroAction.completed) {
  //         selectHero(heroId)
  //       }
  //     }
  // }

  // const handleEnemyClick = (enemyId: EnemyId) => {
  //   // Solo permitir seleccionar enemigo en la fase SELECT_ENEMY cuando hay héroe y skill seleccionados
  //   if (battleState.phase === 'SELECT_ENEMY' && battleState.selectedHero !== null && battleState.selectedSkill !== null) {
  //     selectEnemy(enemyId)
  //   }
  // }

  // useEffect(() => {
  //   const allCompleted = heroActions.every((a) => a.completed)
  //   const thirdHeroCompleted = heroActions.find((a) => a.heroId === HeroId.HERO)?.completed

  //   if (allCompleted && thirdHeroCompleted && !hasProcessedTurn.current) {
  //     hasProcessedTurn.current = true
  //     const completedActions = getCompletedActionsForBackend()
  //     if (completedActions) {
  //       const timer = setTimeout(() => {
  //         resetTurn()
  //         hasProcessedTurn.current = false
  //       }, 1000)
  //       return () => clearTimeout(timer)
  //     } else {
  //       hasProcessedTurn.current = false
  //     }
  //   }

  //   if (!allCompleted || !thirdHeroCompleted) hasProcessedTurn.current = false
  // }, [battle, heroActions, getCompletedActionsForBackend, resetTurn])

  return (
    <div className={`escenario-root ${battle?.level}`}>
      <div className="contenedor-todo">
        <button
          onClick={handlePlay}
          style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000 }}
        >
          PLAY
        </button>

        {/* TOP: Monstruos + espacio vacío */}
        <div className="contenedor-top">
        <div className="div-espacio-info">asdfg</div>

        <div className="div-espacio-monsters"></div>
          <div className="monsters-status-list">
            {monstersStatus?.map((status: any) => (
              <div 
                key={status.character_id} 
                className="character-wrapper"
                ref={(el) => {
                  monstersRefs.current[status.character_id] = el
                }}
              >
                <img
                  src={`/characters/character_${status.character_id}_${
                    characterAnimations[status.character_id] === 'hit' ? 'hit' :
                    characterAnimations[status.character_id] === 'dmg' ? 'dmg' :
                    'idle'
                  }.gif`}
                  alt={`Monster ${status.character_id}`}
                />
                <div className="hp-bar-container">
                  <span className="hp-label">HP</span>
                  <div className="hp-bar-bg">
                    <div
                      className="hp-bar-fill"
                      style={{
                        width: `${
                          status.max_hp && status.max_hp > 0
                            ? (status.current_hp / status.max_hp) * 100
                            : 0
                        }%`
                      }}
                    />
                    <span className="hp-text">
                      {status.current_hp || 0}/{status.max_hp || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM: Héroes + skills/info */}

        <div className="contenedor-bottom">
          <div className="heroes-status-list">
            {heroesStatus?.map((status: any) => (
              <div 
                key={status.character_id} 
                className="character-wrapper"
                ref={(el) => {
                  heroesRefs.current[status.character_id] = el
                }}
              >
                <img
                  src={`/characters/character_${status.character_id}_${
                    characterAnimations[status.character_id] === 'hit' ? 'hit' :
                    characterAnimations[status.character_id] === 'dmg' ? 'dmg' :
                    'idle'
                  }.gif`}
                  alt={`Heroe ${status.character_id}`}
                />
                <div className="hp-bar-container">
                  <span className="hp-label">HP</span>
                  <div className="hp-bar-bg">
                    <div
                      className="hp-bar-fill"
                      style={{
                        width: `${
                          status.max_hp && status.max_hp > 0
                            ? (status.current_hp / status.max_hp) * 100
                            : 0
                        }%`
                      }}
                    />
                    <span className="hp-text">
                      {status.current_hp || 0}/{status.max_hp || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="div-skills-info">
          <div className="div-espacio-skills">asdfg</div>
          </div>
        </div>

        {/* Renderizar animaciones flotantes */}
        {floatingAnimations.map((animation) => (
          <FloatingNumber
            key={animation.id}
            value={animation.value}
            x={animation.x}
            y={animation.y}
            color={animation.color}
            critical={animation.critical}
            label={animation.label}
            onComplete={() => {
              setFloatingAnimations(prev => prev.filter(a => a.id !== animation.id))
            }}
          />
        ))}
      </div>
    </div>
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
