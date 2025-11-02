import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import '../App.css'
import { useBattleData } from '../hooks/useBattleData'
import { dojoConfig } from '../dojo/dojoConfig'
import { useGameActions } from '../hooks/useGameActions'
import { useRef } from 'react'
import FloatingNumber from './FloatingNumber'
import { getSkillsIdsByCharacterId, getSkillById } from '../utils/battleUtils'

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
  const [selectedHero, setSelectedHero] = useState<number | null>(null)
  const { battle } = useBattleData(Number(battleId || 0))
  const { play, loading } = useGameActions();
  const [floatingAnimations, setFloatingAnimations] = useState<FloatingAnimation[]>([])
  const [characterAnimations, setCharacterAnimations] = useState<{ [characterId: number]: 'hit' | 'dmg' | 'idle' }>({})
  const [actions, setActions] = useState<number[]>([]) 
  const [tempAction, setTempAction] = useState<number>(0)
  const [hoveredCharacter, setHoveredCharacter] = useState<{ status: any; isMonster: boolean } | null>(null)
  const [hoveredCharacterSkills, setHoveredCharacterSkills] = useState<number[]>([])
  const loadAllStatuses = useRef<(() => Promise<void>) | null>(null)
  const heroesRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const monstersRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  // Load characterStatus for heroes and monsters
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

      // Load heroes and monsters in parallel
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

  // Load character skills when hovering
  useEffect(() => {
    if (!hoveredCharacter?.status?.character_id) {
      setHoveredCharacterSkills([])
      return
    }

    // Use getSkillsIdsByCharacterId to get the skill IDs for this character
    const skillIds = getSkillsIdsByCharacterId(hoveredCharacter.status.character_id)
    setHoveredCharacterSkills(skillIds)
  }, [hoveredCharacter?.status?.character_id])

 
  // Helper function to convert hexadecimal/BigNumberish values to decimal number
  const parseToDecimal = (value: any): number => {
    if (typeof value === 'number') return value
    if (typeof value === 'bigint') return Number(value)
    if (typeof value === 'string') {
      // If it's hexadecimal, convert
      if (value.startsWith('0x') || value.startsWith('0X')) {
        return parseInt(value, 16)
      }
      // If it's a number in string, convert
      return parseInt(value, 10)
    }
    // If it's BigNumber or another type, try to convert
    try {
      return Number(value)
    } catch {
      return 0
    }
  }

  // Function to get character_id from an index
  const getCharacterIdFromIndex = (idx: number, isMonster: boolean): number | null => {
    const statusList = isMonster ? monstersStatus : heroesStatus
    if (idx >= 0 && idx < statusList.length) {
      return statusList[idx]?.character_id || null
    }
    return null
  }

  // Function to get character position based on character_id
  const getCharacterPosition = (characterId: number, isMonster: boolean): { x: number; y: number } | null => {
    const refs = isMonster ? monstersRefs.current : heroesRefs.current
    const element = refs[characterId]
    
    console.log('📍 Looking for position for character_id:', characterId, 'isMonster:', isMonster, 'element:', !!element)
    
    if (!element) {
      console.warn('⚠️ Element not found for character_id:', characterId, 'Available refs:', Object.keys(refs))
      return null
    }
    
    const rect = element.getBoundingClientRect()
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
    
    console.log('✅ Position found:', position)
    return position
  }

  // Function to temporarily change a character's animation
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

  // Function to add a floating animation
  const addFloatingAnimation = (value: string | number, x: number, y: number, color: string, critical = false, label?: string) => {
    const id = `anim-${Date.now()}-${Math.random()}`
    const animation: FloatingAnimation = { id, value, x, y, color, critical, label }
    
    console.log('🎬 Adding floating animation:', { id, value, x, y, color, critical, label })
    
    setFloatingAnimations(prev => {
      const newAnimations = [...prev, animation]
      console.log('📊 Total animations:', newAnimations.length)
      return newAnimations
    })
    
    // Remove animation after it ends
    setTimeout(() => {
      setFloatingAnimations(prev => prev.filter(a => a.id !== id))
    }, 1500)
  }

  const handlePlay = async () => {
    const result = await play(["005", "111", "221"]);
    if (result) {
      // Wait a moment for refs to be updated
      await new Promise(resolve => setTimeout(resolve, 100))

      // Process events with a small delay between each one for better visualization
      for (let i = 0; i < result.parsed_events.length; i++) {
        const event = result.parsed_events[i]
        
        setTimeout(() => {
          if (event.key === "DamageEvent") {
            const { battle_id, from_idx, to_idx, critical_hit, damage, is_monster } = event.data;
            console.log(`🔥 Damage event: { battle_id: ${battle_id}, from_idx: ${from_idx}, to_idx: ${to_idx}, critical_hit: ${critical_hit}, damage: ${damage}, is_monster: ${is_monster} }`);
            
            const attackerIsMonster = parseToDecimal(is_monster) === 1
            const targetIsMonster = !attackerIsMonster // The target is on the opposite side
            
            // Get character_ids from indices
            const fromCharacterId = getCharacterIdFromIndex(parseToDecimal(from_idx), attackerIsMonster)
            const toCharacterId = getCharacterIdFromIndex(parseToDecimal(to_idx), targetIsMonster)
            
            // Change attack and damage animations
            if (fromCharacterId !== null) {
              setCharacterAnimation(fromCharacterId, 'hit')
            }
            if (toCharacterId !== null) {
              setCharacterAnimation(toCharacterId, 'dmg')
            }
            
            // Show floating animation on target
            if (toCharacterId !== null) {
              const position = getCharacterPosition(toCharacterId, targetIsMonster)
              if (position) {
                const isCritical = parseToDecimal(critical_hit) === 1
                const color = isCritical ? '#ff6b6b' : '#ff3333' // Light red for critical, dark red for normal
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
            
            // Buff only applies between allies, so from_idx and to_idx are in the same array
            const isMonster = parseToDecimal(is_monster) === 1
            
            const fromCharacterId = getCharacterIdFromIndex(parseToDecimal(from_idx), isMonster)
            const toCharacterId = getCharacterIdFromIndex(parseToDecimal(to_idx), isMonster)
            
            if (fromCharacterId !== null) {
              setCharacterAnimation(fromCharacterId, 'hit')
            }
            
            if (toCharacterId !== null) {
              const position = getCharacterPosition(toCharacterId, isMonster)
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
            
            // Attack animation for who applies the debuff
            if (fromCharacterId !== null) {
              setCharacterAnimation(fromCharacterId, 'hit')
            }
            
            // Damage animation for who receives the debuff (negative effect)
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
            
            // Heal only applies between allies, so from_idx and to_idx are in the same array
            const isMonster = parseToDecimal(is_monster) === 1
            
            const fromCharacterId = getCharacterIdFromIndex(parseToDecimal(from_idx), isMonster)
            const toCharacterId = getCharacterIdFromIndex(parseToDecimal(to_idx), isMonster)
            
            if (fromCharacterId !== null) {
              setCharacterAnimation(fromCharacterId, 'hit')
            }
            
            if (toCharacterId !== null) {
              const position = getCharacterPosition(toCharacterId, isMonster)
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
            
            // Animation in the center of the screen
            const centerX = window.innerWidth / 2
            const centerY = window.innerHeight / 2
            addFloatingAnimation(
              'VICTORY!',
              centerX,
              centerY,
              '#51cf66' // Green for victory
            )
          }
          else if (event.key === "PlayerLoseEvent") {
            const { battle_id, player } = event.data;
            console.log(`🔥 Player lose event: { battle_id: ${battle_id}, player: ${player} }`);
            
            // Animation in the center of the screen
            const centerX = window.innerWidth / 2
            const centerY = window.innerHeight / 2
            addFloatingAnimation(
              'DEFEAT',
              centerX,
              centerY,
              '#ff3333' // Red for defeat
            )
          }
        }, i * 1000) // 1000ms delay between each animation
      }

      // Calculate when all animations end
      // Last event starts at: (number_events - 1) * 1000ms
      // Each animation lasts: 1500ms
      // So all end at: (number_events - 1) * 1000 + 1500
      const totalEvents = result.parsed_events.length
      const lastEventStartTime = totalEvents > 0 ? (totalEvents - 1) * 1000 : 0
      const animationDuration = 1500 // Duration of each floating animation
      const timeUntilAllAnimationsEnd = lastEventStartTime + animationDuration + 500 // Extra 500ms buffer

      // Reload states after all animations end
      setTimeout(async () => {
        if (loadAllStatuses.current) {
          await loadAllStatuses.current();
        }
      }, timeUntilAllAnimationsEnd);
    }
  }

  const [selectionStep, setSelectionStep] = useState<'hero' | 'skill' | 'enemy'>('hero');

  // All actions must be numbers (and arrays of number), not strings.
  // We'll compose the action step-by-step as numbers, always keeping 3 digit format for logs/UI, but store as numbers.

  const handleHeroClick = (heroIndex: number) => {
    if (selectionStep !== 'hero') return;
    // 100 * index (skill and target come later)
    const heroNum = heroIndex * 100;
    setTempAction(heroNum);
    setSelectionStep('skill');
    console.log(`hero index: ${heroIndex} (selected), Temp action: ${String(heroNum).padStart(3, "0")}`);
  };

  const handleSkillClick = (skillIndex: number) => {
    if (selectionStep !== 'skill') return;
    setTempAction(prev => {
      // prev is a number (e.g. H00), add skill as ones digit
      const num = prev + skillIndex;
      const result = num;
      console.log(`skill index: ${skillIndex} (selected), Temp action: ${String(result).padStart(3, '0')}`);
      return result;
    });
    setSelectionStep('enemy');
  };

  const handleMonsterClick = (monsterIndex: number) => {
    if (selectionStep !== 'enemy') return;
    setTempAction(prev => {
      // prev is Hero+Skill, add monsterIndex * 10 to get full action number
      const num = prev + monsterIndex * 10;
      const result = num;
      console.log(`monster index: ${monsterIndex} (selected), Final action: ${String(result).padStart(3, '0')}`);
      setActions(a => [...a, result]);
      setSelectionStep('hero');
      setTempAction(0); // Reset temp action for next sequence
      return 0;
    });
  };


  return (
    <div className={`escenario-root ${battle?.level}`}>
      <div className="contenedor-todo">
        <button
          onClick={handlePlay}
          disabled={loading}
          style={{ 
            position: 'absolute', 
            top: '10px', 
            left: '10px', 
            zIndex: 1000,
            opacity: loading ? 0.5 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          PLAY
        </button>

        {/* TOP: Monsters infoskills */}
        <div className="contenedor-top">
        <div className="div-espacio-info" style={{
          marginLeft: '20px',
          marginTop: '20px'
        }}>
          {hoveredCharacter ? (
            <div style={{
              background: 'rgba(0, 0, 0, 0.85)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '15px',
              color: '#fff',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '10px',
              lineHeight: '1.6',
              minWidth: '200px'
            }}>
              <div style={{ 
                marginBottom: '10px', 
                fontSize: '12px', 
                textAlign: 'center',
                textDecoration: 'underline',
                color: hoveredCharacter.isMonster ? '#ff6b6b' : '#4ecdc4'
              }}>
                {hoveredCharacter.isMonster ? 'MONSTER' : 'HERO'} #{hoveredCharacter.status.character_id}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>HP:</span>
                  <span>{parseToDecimal(hoveredCharacter.status.current_hp)}/{parseToDecimal(hoveredCharacter.status.max_hp)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ATK:</span>
                  <span>{parseToDecimal(hoveredCharacter.status.attack)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>DEF:</span>
                  <span>{parseToDecimal(hoveredCharacter.status.defense)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CRIT:</span>
                  <span>{parseToDecimal(hoveredCharacter.status.critical_chance)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>EVA:</span>
                  <span>{parseToDecimal(hoveredCharacter.status.evasion)}%</span>
                </div>
              </div>

              {hoveredCharacterSkills.length > 0 && (
                <div style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  paddingTop: '10px',
                  marginTop: '10px'
                }}>
                  <div style={{
                    fontSize: '10px',
                    marginBottom: '8px',
                    color: hoveredCharacter.isMonster ? '#ff6b6b' : '#4ecdc4'
                  }}>
                    SKILLS:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {hoveredCharacterSkills.map((skillId) => {
                      const skill = getSkillById(skillId)
                      if (!skill) return null
                      return (
                        <div key={skillId} style={{
                          fontSize: '8px',
                          padding: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px'
                        }}>
                          <div style={{ color: '#fff', marginBottom: '2px' }}>
                            {skill.name}
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '7px' }}>
                            {skill.description}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '10px',
              textAlign: 'center',
              padding: '15px'
            }}>
              Hover over a character to see their stats
            </div>
          )}
        </div>

        <div className="div-espacio-monsters"></div>
          <div className="monsters-status-list">
            {monstersStatus?.map((status: any, index: number) => (
              <div 
                key={status.character_id} 
                className="character-wrapper"
                ref={(el) => {
                  if (status.character_id) {
                    monstersRefs.current[status.character_id] = el
                  }
                }}
              >
                <img
                  src={`/characters/character_${status.character_id}_${
                    characterAnimations[status.character_id] === 'hit' ? 'hit' :
                    characterAnimations[status.character_id] === 'dmg' ? 'dmg' :
                    'idle'
                  }.gif`}
                  alt={`Monster ${status.character_id}`}
                  onClick={() => !loading && handleMonsterClick(index)}
                  onMouseEnter={() => setHoveredCharacter({ status, isMonster: true })}
                  onMouseLeave={() => setHoveredCharacter(null)}
                  style={{
                    cursor: loading ? 'not-allowed' : 'pointer',
                    pointerEvents: loading ? 'none' : 'auto'
                  }}
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

        {/* BOTTOM: Heroes + skills */}
        <div className="contenedor-bottom">
          <div className="heroes-status-list">
            {heroesStatus?.map((status: any, index: number) => (
              <div 
                key={status.character_id} 
                className="character-wrapper"
                ref={(el) => {
                  if (status.character_id) {
                    heroesRefs.current[status.character_id] = el
                  }
                }}
              >
                <img
                  src={`/characters/character_${status.character_id}_${
                    characterAnimations[status.character_id] === 'hit' ? 'hit' :
                    characterAnimations[status.character_id] === 'dmg' ? 'dmg' :
                    'idle'
                  }.gif`}
                  alt={`Hero ${status.character_id}`}
                  onClick={() => !loading && handleHeroClick(index)}
                  onMouseEnter={() => setHoveredCharacter({ status, isMonster: false })}
                  onMouseLeave={() => setHoveredCharacter(null)}
                  style={{
                    cursor: loading ? 'not-allowed' : 'pointer',
                    pointerEvents: loading ? 'none' : 'auto'
                  }}
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
          <div className="div-espacio-skills"> 
            {/* Add skill buttons, for now only test buttons using the css skill-icon skills-buttons-container skills-buttons */}(
              <div className="skills-buttons-container">
                <button 
                  className="skill-icon" 
                  onClick={() => !loading && handleSkillClick(1)}
                  disabled={loading}
                  style={{
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  1
                </button>
                <button 
                  className="skill-icon" 
                  onClick={() => !loading && handleSkillClick(2)}
                  disabled={loading}
                  style={{
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  2
                </button>
                <button 
                  className="skill-icon" 
                  onClick={() => !loading && handleSkillClick(3)}
                  disabled={loading}
                  style={{
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  3
                </button>
              </div>
            )
          </div>
        </div>

        {/* Render floating animations */}
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

        {/* Loading indicator */}
        {loading && (
          <div
            style={{
              position: 'fixed',
              bottom: '50%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10001,
              pointerEvents: 'none'
            }}
          >
            <img
              src="/loading.gif"
              alt="Loading..."
              style={{
                width: '150px',
                height: '150px',
              }}
            />
          </div>
        )}
      </div>
    </div>
    //   {/* Skill buttons - show dynamically according to selected hero */}
    //   {battleState.phase === 'SELECT_SKILL' && battleState.selectedHero !== null && selectedHeroSkills.length > 0 && (
    //     <div className="skills-buttons-container">
    //       {selectedHeroSkills.map((skillId) => {
    //         const skill = getSkillById(skillId)
    //         if (!skill) return null
            
    //         // Compare as numbers to work with enum and number
    //         const selectedSkillNum = battleState.selectedSkill !== null 
    //           ? (typeof battleState.selectedSkill === 'number' ? battleState.selectedSkill : Number(battleState.selectedSkill))
    //           : null
    //         const isSelected = selectedSkillNum === skillId
            
    //         return (
    //           <button 
    //             key={skillId}
    //             className={`skills-buttons ${isSelected ? 'highlighted' : ''}`}
    //             onClick={() => {
    //               console.log(`🎯 Skill selected: ${skill.name} (ID: ${skillId})`)
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
