import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../App.css'
import { useBattleData } from '../hooks/useBattleData'
import { dojoConfig } from '../dojo/dojoConfig'
import { useGameActions } from '../hooks/useGameActions'
import { useRef } from 'react'
import FloatingNumber from './FloatingNumber'
import { getSkillsIdsByCharacterId, getSkillById, isSkillForAllies, isSkillForEnemies } from '../utils/battleUtils'

interface FloatingAnimation {
  id: string
  value: string | number
  x: number
  y: number
  color: string
  critical?: boolean
  label?: string
  victory?: boolean
}

export default function BattleScreen() {
  const { battleId } = useParams()
  const navigate = useNavigate()
  const [heroesStatus, setHeroesStatus] = useState<any[]>([])
  const [monstersStatus, setMonstersStatus] = useState<any[]>([])
  const { battle } = useBattleData(Number(battleId || 0))
  const { play, loading } = useGameActions();
  const [floatingAnimations, setFloatingAnimations] = useState<FloatingAnimation[]>([])
  const [characterAnimations, setCharacterAnimations] = useState<{ [characterId: number]: 'hit' | 'dmg' | 'idle' }>({})
  const [, setActions] = useState<number[]>([]) 
  const [, setTempAction] = useState<number>(0)
  const [hoveredCharacter, setHoveredCharacter] = useState<{ status: any; isMonster: boolean } | null>(null)
  const [hoveredCharacterSkills, setHoveredCharacterSkills] = useState<number[]>([])
  // Track actions by hero index: heroIndex -> action number
  const [heroActions, setHeroActions] = useState<{ [heroIndex: number]: number }>({})
  // Track selected hero and skill for highlighting
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number | null>(null)
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null)
  const loadAllStatuses = useRef<(() => Promise<void>) | null>(null)
  const heroesRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const monstersRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const hasCalledPlay = useRef<boolean>(false)
  const battleMusicRef = useRef<HTMLAudioElement | null>(null)
  
  // Sound effects refs
  const criticalHitSoundRef = useRef<HTMLAudioElement | null>(null)
  const hitSoundRef = useRef<HTMLAudioElement | null>(null)
  const healSoundRef = useRef<HTMLAudioElement | null>(null)
  const buffSoundRef = useRef<HTMLAudioElement | null>(null)
  const debuffSoundRef = useRef<HTMLAudioElement | null>(null)
  const missSoundRef = useRef<HTMLAudioElement | null>(null)
  const selectHeroeSoundRef = useRef<HTMLAudioElement | null>(null)
  const victorySoundRef = useRef<HTMLAudioElement | null>(null)
  
  // State for victory overlay
  const [showVictoryOverlay, setShowVictoryOverlay] = useState(false)

  // Initialize and play battle music when battle starts
  useEffect(() => {
    if (!battle || !battle.id) {
      return
    }

    // Create audio element if it doesn't exist
    if (!battleMusicRef.current) {
      battleMusicRef.current = new Audio('/music/battleMusic.mp3')
      battleMusicRef.current.loop = true
      battleMusicRef.current.volume = 0.5
    }

    // Initialize sound effects
    if (!criticalHitSoundRef.current) {
      criticalHitSoundRef.current = new Audio('/music/criticalhit.mp3')
      criticalHitSoundRef.current.volume = 0.7
    }
    if (!hitSoundRef.current) {
      hitSoundRef.current = new Audio('/music/hit.mp3')
      hitSoundRef.current.volume = 0.7
    }
    if (!healSoundRef.current) {
      healSoundRef.current = new Audio('/music/healing.mp3')
      healSoundRef.current.volume = 0.7
    }
    if (!buffSoundRef.current) {
      buffSoundRef.current = new Audio('/music/buff.mp3')
      buffSoundRef.current.volume = 0.7
    }
    if (!debuffSoundRef.current) {
      debuffSoundRef.current = new Audio('/music/debuff.mp3')
      debuffSoundRef.current.volume = 0.7
    }
    if (!missSoundRef.current) {
      missSoundRef.current = new Audio('/music/miss.mp3')
      missSoundRef.current.volume = 0.7
    }
    if (!selectHeroeSoundRef.current) {
      selectHeroeSoundRef.current = new Audio('/music/selectheroe.mp3')
      selectHeroeSoundRef.current.volume = 0.7
    }
    if (!victorySoundRef.current) {
      victorySoundRef.current = new Audio('/music/victory.mp3')
      victorySoundRef.current.volume = 0.8
    }

    // Play music when battle is loaded
    const playMusic = async () => {
      try {
        if (battleMusicRef.current) {
          await battleMusicRef.current.play()
        }
      } catch (error) {
        console.log('Error playing battle music:', error)
      }
    }

    playMusic()

    // Cleanup: pause music when component unmounts or battle ends
    return () => {
      if (battleMusicRef.current) {
        battleMusicRef.current.pause()
        battleMusicRef.current.currentTime = 0
      }
    }
  }, [battle?.id])

  // Helper function to play sound effects
  const playSound = (soundRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (soundRef.current) {
      soundRef.current.currentTime = 0 // Reset to start
      soundRef.current.play().catch(err => {
        console.log('Error playing sound effect:', err)
      })
    }
  }

  // Load characterStatus for heroes and monsters
  useEffect(() => {
    if (!battle || !battle.id) {
      setHeroesStatus([])
      setMonstersStatus([])
      return
    }

      const loadStatuses = async (forceRefreshBattle = false) => {
      if (!battle || !battle.id) {
        setHeroesStatus([])
        setMonstersStatus([])
        return
      }

      const loadCharacterStatus = async (characterId: number): Promise<any | null> => {
        try {
          const response = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                query GetCharacterStatus($battleId: Int!, $characterId: Int!) {
                  destiny5CharacterStatusModels(
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
          
          if (result.data?.destiny5CharacterStatusModels?.edges?.length > 0) {
            const node = result.data.destiny5CharacterStatusModels.edges[0].node
            return node
          }
          
          return null
        } catch (error) {
          return null
        }
      }

      let updatedHeroIds: any[] = []
      let updatedMonsterIds: any[] = []

      // Only refresh battle data if forceRefreshBattle is true (after play)
      // Otherwise use the battle object we already have
      if (forceRefreshBattle) {
        const battleQueryResponse = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetBattle($battleId: Int!) {
                destiny5BattleModels(where: { id: $battleId }) {
                  edges {
                    node {
                      id
                      heroes_ids
                      monsters_ids
                    }
                  }
                }
              }
            `,
            variables: { battleId: battle.id }
          })
        })

        if (battleQueryResponse.ok) {
          const battleQueryResult = await battleQueryResponse.json()
          if (battleQueryResult.data?.destiny5BattleModels?.edges?.length > 0) {
            const battleNode = battleQueryResult.data.destiny5BattleModels.edges[0].node
            updatedHeroIds = battleNode.heroes_ids || []
            updatedMonsterIds = battleNode.monsters_ids || []
          }
        }
      }

      // If we didn't refresh or refresh failed, use current battle data
      if (updatedHeroIds.length === 0 && updatedMonsterIds.length === 0) {
        updatedHeroIds = battle.heroes_ids || []
        updatedMonsterIds = battle.monsters_ids || []
      }

      // Load heroes and monsters in parallel using IDs
      const heroPromises = updatedHeroIds.map((heroId: any) => 
        loadCharacterStatus(parseToDecimal(heroId))
      )
      const monsterPromises = updatedMonsterIds.map((monsterId: any) => 
        loadCharacterStatus(parseToDecimal(monsterId))
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

    loadAllStatuses.current = () => loadStatuses(true) // When called manually, force refresh battle data
    loadStatuses(false) // Initial load uses existing battle data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle?.id]) // Only re-run when battle.id changes

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
    
    if (!element) {
      return null
    }
    
    const rect = element.getBoundingClientRect()
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
    
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
  const addFloatingAnimation = (value: string | number, x: number, y: number, color: string, critical = false, label?: string, victory = false) => {
    const id = `anim-${Date.now()}-${Math.random()}`
    const animation: FloatingAnimation = { id, value, x, y, color, critical, label, victory }
    
    setFloatingAnimations(prev => [...prev, animation])
    
    // If victory, show overlay and play sound
    if (victory) {
      setShowVictoryOverlay(true)
      playSound(victorySoundRef)
      // Hide overlay after animation
      setTimeout(() => {
        setShowVictoryOverlay(false)
      }, 3000)
    }
    
    // Remove animation after it ends
    setTimeout(() => {
      setFloatingAnimations(prev => prev.filter(a => a.id !== id))
    }, victory ? 3000 : 1000)
  }
 
  const handlePlay = async () => {
    // Reset actions immediately so user can select new actions
    const currentActions = { ...heroActions }
    setHeroActions({})
    setActions([])
    setTempAction(0)
    setSelectedHeroIndex(null)
    setSelectedSkillId(null)
    setSelectionStep('hero')
    
    // Convert heroActions to array of strings in correct order
    const actionStrings = heroesStatus.map((_, index) => {
      const action = currentActions[index]
      return action !== undefined ? String(action).padStart(3, '0') : '000'
    })
    
    const result = await play(actionStrings);
    if (result) {
      // Wait a moment for refs to be updated
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check if there's a win or lose event
      let hasGameEndEvent = false
      for (const event of result.parsed_events) {
        if (event.key === "PlayerWinEvent" || event.key === "PlayerLoseEvent") {
          hasGameEndEvent = true
          break
        }
      }

      // Process events with a small delay between each one for better visualization
      for (let i = 0; i < result.parsed_events.length; i++) {
        const event = result.parsed_events[i]
        
        setTimeout(() => {
          if (event.key === "DamageEvent") {
            const { from_idx, to_idx, critical_hit, damage, is_monster } = event.data;
            
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
                
                // Play sound effect
                // hit.mp3 is used for Basic Attack (id: 1), Power Attack (id: 2), and Flame Attack (id: 3) when not critical
                // criticalhit.mp3 is used for critical hits from any of these attacks
                if (isCritical) {
                  playSound(criticalHitSoundRef)
                  playSound(hitSoundRef)
                } else {
                  // Basic Attack, Power Attack, and Flame Attack use hit.mp3
                  playSound(hitSoundRef)
                }
              }
            }
          } 
          else if (event.key === "BuffEvent") {
            const { from_idx, to_idx, amount, is_monster } = event.data;
            
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
                // Play buff sound effect
                playSound(buffSoundRef)
              }
            }
          }
          else if (event.key === "DebuffEvent") {
            const { from_idx, to_idx, amount, is_monster } = event.data;
            
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
                // Play debuff sound effect
                playSound(debuffSoundRef)
              }
            }
          }
          else if (event.key === "HealEvent") {
            const { from_idx, to_idx, amount, is_monster } = event.data;
            
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
                // Play heal sound effect
                playSound(healSoundRef)
              }
            }
          }
          else if (event.key === "MissEvent") {
            const { from_idx, to_idx, is_monster } = event.data;
            
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
                // Play miss sound effect
                playSound(missSoundRef)
              }
            }
          }
          else if (event.key === "PlayerWinEvent") {
            // Animation in the center of the screen
            const centerX = window.innerWidth / 2
            const centerY = window.innerHeight / 2
            addFloatingAnimation(
              'VICTORY!',
              centerX,
              centerY,
              '#51cf66', // Green for victory
              true, // critical (makes it bigger)
              undefined,
              true // victory (triggers overlay and sound)
            )
          }
          else if (event.key === "PlayerLoseEvent") {
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
      const contractSyncDelay = 1000 // Additional delay to allow contract to sync and remove dead characters
      const redirectDelay = hasGameEndEvent ? 1000 : 0 // 2.5 seconds delay before redirecting if game ended
      const timeUntilAllAnimationsEnd = lastEventStartTime + animationDuration + contractSyncDelay

      // Reload states after all animations end and contract sync (only if game hasn't ended)
      if (!hasGameEndEvent) {
        setTimeout(async () => {
          if (loadAllStatuses.current) {
            await loadAllStatuses.current();
          }
          // Actions are already reset in handlePlay, no need to reset here again
        }, timeUntilAllAnimationsEnd);
      }

      // If game ended (win or lose), redirect after all animations + delay
      if (hasGameEndEvent) {
        setTimeout(() => {
          navigate('/levels')
        }, timeUntilAllAnimationsEnd + redirectDelay)
      }
    }
  }

  const [selectionStep, setSelectionStep] = useState<'hero' | 'skill' | 'enemy' | 'ally'>('hero');

  // All actions must be numbers (and arrays of number), not strings.
  // We'll compose the action step-by-step as numbers, always keeping 3 digit format for logs/UI, but store as numbers.

  // Get skills for selected hero
  const selectedHeroSkills = selectedHeroIndex !== null && heroesStatus[selectedHeroIndex]
    ? getSkillsIdsByCharacterId(heroesStatus[selectedHeroIndex].character_id)
    : []

  // Check if all heroes have actions assigned
  useEffect(() => {
    if (heroesStatus.length > 0 && 
        Object.keys(heroActions).length === heroesStatus.length && 
        !loading &&
        selectionStep === 'hero' &&
        !hasCalledPlay.current) { // Only auto-play when in hero selection step and haven't called yet
      // All heroes have actions, automatically call handlePlay
      hasCalledPlay.current = true
      handlePlay().finally(() => {
        // Reset the flag after play completes (allows next round)
        hasCalledPlay.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroActions, heroesStatus.length, loading, selectionStep])

  const handleHeroClick = (heroIndex: number) => {
    if (selectionStep !== 'hero') return;
    // Check if this hero already has an action
    if (heroActions[heroIndex] !== undefined) {
      return
    }
    // Play select hero sound effect
    playSound(selectHeroeSoundRef)
    // 100 * index (skill and target come later)
    const heroNum = heroIndex * 100;
    setTempAction(heroNum);
    setSelectedHeroIndex(heroIndex);
    setSelectionStep('skill');
  };

  const handleSkillClick = (skillIndex: number) => {
    if (selectionStep !== 'skill') return;
    // Play select sound effect
    playSound(selectHeroeSoundRef)
    setTempAction(prev => {
      // prev is a number (e.g. H00), add skill as ones digit
      const num = prev + skillIndex;
      const result = num;
      setSelectedSkillId(skillIndex);
      // Determine if this skill targets allies or enemies
      if (isSkillForAllies(skillIndex)) {
        setSelectionStep('ally');
      } else if (isSkillForEnemies(skillIndex)) {
        setSelectionStep('enemy');
      } else {
        setSelectionStep('enemy'); // Default to enemy
      }
      return result;
    });
  };

  const handleMonsterClick = (monsterIndex: number) => {
    if (selectionStep !== 'enemy') return;
    if (selectedHeroIndex === null) return;
    
    // Play select sound effect
    playSound(selectHeroeSoundRef)
    
    setTempAction(prev => {
      // prev is Hero+Skill, add monsterIndex * 10 to get full action number
      const num = prev + monsterIndex * 10;
      const result = num;
      
      // Add to actions array and track by hero index
      setActions(a => [...a, result]);
      setHeroActions(prev => ({
        ...prev,
        [selectedHeroIndex]: result
      }));
      
      setSelectionStep('hero');
      setTempAction(0); // Reset temp action for next sequence
      setSelectedHeroIndex(null);
      setSelectedSkillId(null);
      return 0;
    });
  };

  const handleAllyClick = (allyIndex: number) => {
    if (selectionStep !== 'ally') return;
    if (selectedHeroIndex === null) return;
    
    setTempAction(prev => {
      // For allies, use their index directly (no * 10 needed since they're heroes)
      // But we need to follow the same format: Hero*100 + Skill + Target*10
      // For now, we'll use the ally's index as target
      const num = prev + allyIndex * 10;
      const result = num;
      
      // Add to actions array and track by hero index
      setActions(a => [...a, result]);
      setHeroActions(prev => ({
        ...prev,
        [selectedHeroIndex]: result
      }));
      
      setSelectionStep('hero');
      setTempAction(0); // Reset temp action for next sequence
      setSelectedHeroIndex(null);
      setSelectedSkillId(null);
      return 0;
    });
  };


  return (
    <div className={`escenario-root ${battle?.level}`}>
      <div className="contenedor-todo">
        {/* TOP: Monsters infoskills */}
        <div className="contenedor-top">
        <div className="div-espacio-info">
          {hoveredCharacter ? (
            <div className="character-info-box">
              <div className={`character-info-header ${hoveredCharacter.isMonster ? 'monster' : 'hero'}`}>
                {hoveredCharacter.isMonster ? 'MONSTER' : 'HERO'} #{hoveredCharacter.status.character_id}
              </div>
              
              <div className="character-stats-list">
                <div className="character-stat-row">
                  <span>HP:</span>
                  <span>{parseToDecimal(hoveredCharacter.status.current_hp)}/{parseToDecimal(hoveredCharacter.status.max_hp)}</span>
                </div>
                <div className="character-stat-row">
                  <span>ATK:</span>
                  <span>{parseToDecimal(hoveredCharacter.status.attack)}</span>
                </div>
                <div className="character-stat-row">
                  <span>DEF:</span>
                  <span>{parseToDecimal(hoveredCharacter.status.defense)}</span>
                </div>
                <div className="character-stat-row">
                  <span>CRIT:</span>
                  <span>{parseToDecimal(hoveredCharacter.status.critical_chance)}%</span>
                </div>
                <div className="character-stat-row">
                  <span>EVA:</span>
                  <span>{parseToDecimal(hoveredCharacter.status.evasion)}%</span>
                </div>
              </div>

              {hoveredCharacterSkills.length > 0 && (
                <div className="character-skill-list">
                  <div className={`character-skill-list-title ${hoveredCharacter.isMonster ? 'monster' : 'hero'}`}>
                    SKILLS:
                  </div>
                  <div className="character-skills-container">
                    {hoveredCharacterSkills.map((skillId) => {
                      const skill = getSkillById(skillId)
                      if (!skill) return null
                      return (
                        <div key={skillId} className="character-skill-item">
                          <div className="character-skill-item-name">
                            {skill.name}
                          </div>
                          <div className="character-skill-item-description">
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
            <div className="character-info-box-empty">
              <div>HOVER</div>
              <div>
                Over a character<br/>
                to see stats
              </div>
            </div>
          )}
        </div>

        <div className="div-espacio-monsters"></div>
          <div className="monsters-status-list">
            {monstersStatus?.map((status: any, index: number) => {
              // Check if this monster should be highlighted (when selecting skill that targets enemies)
              const shouldHighlight = selectionStep === 'enemy' && selectedSkillId !== null && isSkillForEnemies(selectedSkillId)
              
              return (
                <div 
                  key={status.character_id} 
                  className="character-wrapper"
                  ref={(el) => {
                    if (status.character_id) {
                      monstersRefs.current[status.character_id] = el
                    }
                  }}
                >
                  <div 
                    className={shouldHighlight ? 'character-glow-red' : ''}
                    style={{ position: 'relative', display: 'inline-block' }}
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
                        pointerEvents: loading ? 'none' : 'auto',
                        position: 'relative',
                        zIndex: 2
                      }}
                    />
                  </div>
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
              )
            })}
          </div>
        </div>

        {/* BOTTOM: Heroes + skills */}
        <div className="contenedor-bottom">
          <div className="heroes-status-list">
            {heroesStatus?.map((status: any, index: number) => {
              // Check if this hero should be highlighted
              const isSelectedHero = selectedHeroIndex === index
              const shouldHighlightAsTarget = selectionStep === 'ally' && selectedSkillId !== null && isSkillForAllies(selectedSkillId)
              const hasAction = heroActions[index] !== undefined
              
              return (
                <div 
                  key={status.character_id} 
                  className="character-wrapper"
                  ref={(el) => {
                    if (status.character_id) {
                      heroesRefs.current[status.character_id] = el
                    }
                  }}
                >
                   {!hasAction && (
                    <div className="action-text-glow">
                      ACTION
                    </div>
                  )}
                  <div 
                    className={(isSelectedHero || shouldHighlightAsTarget) ? 'character-glow-white' : ''}
                    style={{ position: 'relative', display: 'inline-block' }}
                  >
                    <img
                      src={`/characters/character_${status.character_id}_${
                        characterAnimations[status.character_id] === 'hit' ? 'hit' :
                        characterAnimations[status.character_id] === 'dmg' ? 'dmg' :
                        'idle'
                      }.gif`}
                      alt={`Hero ${status.character_id}`}
                      onClick={() => {
                        if (!loading && selectionStep === 'hero') {
                          handleHeroClick(index)
                        } else if (!loading && selectionStep === 'ally') {
                          handleAllyClick(index)
                        }
                      }}
                      onMouseEnter={() => setHoveredCharacter({ status, isMonster: false })}
                      onMouseLeave={() => setHoveredCharacter(null)}
                      style={{
                        cursor: loading ? 'not-allowed' : (selectionStep === 'hero' || (selectionStep === 'ally' && !hasAction)) ? 'pointer' : 'default',
                        pointerEvents: loading ? 'none' : 'auto',
                        position: 'relative',
                        zIndex: 2
                      }}
                    />
      </div>
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
              )
            })}
          </div>
          <div className="div-espacio-skills"> 
            {/* Always visible info box - now contains everything */}
            <div className={`skills-info-box ${selectionStep === 'skill' ? 'has-skills' : ''}`}>
              {selectionStep === 'hero' && (
                <div className="selection-message selection-message-hero">
                  <div className="selection-message-title">
                    CHOOSE A HERO
                  </div>
                  <div className="selection-message-subtitle">
                    Click on a hero to execute their action
                  </div>
                </div>
              )}
              
              {selectionStep === 'skill' && selectedHeroSkills.length > 0 && (
                <div className="selection-message selection-message-skill">
                  <div className="selection-message-title">
                    CHOOSE A SKILL
                  </div>
                  <div className="selection-message-subtitle">
                    Select a skill from the available ones below
                  </div>
                </div>
              )}
              
              {selectionStep === 'enemy' && selectedSkillId !== null && (
                <div className="selection-message selection-message-enemy">
                  <div className="selection-message-title">
                    CHOOSE AN ENEMY
                  </div>
                  <div className="selection-message-subtitle">
                    Click on an enemy to target with your selected skill
                  </div>
                </div>
              )}
              
              {selectionStep === 'ally' && selectedSkillId !== null && (
                <div className="selection-message selection-message-ally">
                  <div className="selection-message-title">
                    CHOOSE AN ALLY
                  </div>
                  <div className="selection-message-subtitle">
                    Click on an ally to target with your selected skill
                  </div>
                </div>
              )}
              
              {/* Skills buttons - shown when selecting skill, now inside the box */}
              {selectionStep === 'skill' && selectedHeroSkills.length > 0 && (
                <div className="skills-buttons-list">
                {selectedHeroSkills.map((skillId) => {
                  const skill = getSkillById(skillId)
                  if (!skill) return null
                  const isSelected = selectedSkillId === skillId
                  
                  return (
                    <button 
                      key={skillId}
                      onClick={() => !loading && handleSkillClick(skillId)}
                      disabled={loading || selectionStep !== 'skill'}
                      className={`skill-button ${isSelected ? 'skill-button-selected' : ''}`}
                    >
                      <div className="skill-name">
                        {skill.name}
                      </div>
                      <div className="skill-description">
                        {skill.description}
                      </div>
                    </button>
                  )
                })}
                </div>
              )}
            </div>
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
            victory={animation.victory}
            onComplete={() => {
              setFloatingAnimations(prev => prev.filter(a => a.id !== animation.id))
            }}
          />
        ))}
        
        {/* Victory overlay - darkens background */}
        {showVictoryOverlay && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 9999,
              pointerEvents: 'none',
              transition: 'opacity 0.5s ease-in-out'
            }}
          />
        )}

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
  )
}
