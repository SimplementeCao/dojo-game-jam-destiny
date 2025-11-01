import { useEffect, useRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useBattleLogic } from '../hooks/useBattleLogic'
import { HeroId, EnemyId } from '../types/battle'
import '../App.css'
import { levelsConfig, type LevelId } from '../config/levelsConfig'
import { getSkillsIdsByHeroId, getSkillById } from '../utils/battleUtils'

export default function BattleScreen() {
  const { level } = useParams()
  const levelNum = (Number(level) || 1) as LevelId
  const config = levelsConfig[levelNum]

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
  }, [heroActions, getCompletedActionsForBackend, resetTurn])

  return (
    <div className={`escenario-root ${config.backgroundClass}`}>
      <div className="escenario-bg" />

      <div className="side side-left">
        {/* Angel */}
        <div className="character-wrapper">
          <div className="hp-bar-container">
            <span className="hp-label">HP</span>
            <div className="hp-bar-bg">
              <div className="hp-bar-fill" style={{ width: `${((getHero(HeroId.ANGEL)?.health || 0) / (getHero(HeroId.ANGEL)?.maxHealth || 1)) * 100}%` }} />
              <span className="hp-text">{getHero(HeroId.ANGEL)?.health || 0}/{getHero(HeroId.ANGEL)?.maxHealth || 0}</span>
            </div>
          </div>
          <div className={`actor actor-angel ${selectedHeroClass(HeroId.ANGEL)}`} onClick={() => handleHeroClick(HeroId.ANGEL)} title="Angel" />
        </div>

        {/* Mage */}
        <div className="character-wrapper">
          <div className="hp-bar-container">
            <span className="hp-label">HP</span>
            <div className="hp-bar-bg">
              <div className="hp-bar-fill" style={{ width: `${((getHero(HeroId.MAGE)?.health || 0) / (getHero(HeroId.MAGE)?.maxHealth || 1)) * 100}%` }} />
              <span className="hp-text">{getHero(HeroId.MAGE)?.health || 0}/{getHero(HeroId.MAGE)?.maxHealth || 0}</span>
            </div>
          </div>
          <div className={`actor actor-mage ${selectedHeroClass(HeroId.MAGE)}`} onClick={() => handleHeroClick(HeroId.MAGE)} title="Mage" />
        </div>

        {/* Hero */}
        <div className="character-wrapper">
          <div className="hp-bar-container">
            <span className="hp-label">HP</span>
            <div className="hp-bar-bg">
              <div className="hp-bar-fill" style={{ width: `${((getHero(HeroId.HERO)?.health || 0) / (getHero(HeroId.HERO)?.maxHealth || 1)) * 100}%` }} />
              <span className="hp-text">{getHero(HeroId.HERO)?.health || 0}/{getHero(HeroId.HERO)?.maxHealth || 0}</span>
            </div>
          </div>
          <div className={`actor actor-hero ${selectedHeroClass(HeroId.HERO)}`} onClick={() => handleHeroClick(HeroId.HERO)} title="Hero" />
        </div>
      </div>

      <div className="side side-right">
        {config.enemies.map((enemyId, idx) => (
          <div key={`${enemyId}-${idx}`} className="character-wrapper">
            <div className="hp-bar-container">
              <span className="hp-label">HP</span>
              <div className="hp-bar-bg">
                <div className="hp-bar-fill" style={{ width: `${((getEnemy(enemyId)?.health || 0) / (getEnemy(enemyId)?.maxHealth || 1)) * 100}%` }} />
                <span className="hp-text">{getEnemy(enemyId)?.health || 0}/{getEnemy(enemyId)?.maxHealth || 0}</span>
              </div>
            </div>
            <div className={`enemy ${enemyId === EnemyId.CASTER ? 'enemy-caster' : enemyId === EnemyId.SKELETON ? 'enemy-skeleton' : 'enemy-drake'} ${selectedEnemyClass()}`} onClick={() => handleEnemyClick(enemyId)} title={EnemyId[enemyId]} />
          </div>
        ))}
      </div>
      {/* Botones de habilidades - mostrar dinámicamente según el héroe seleccionado */}
      {battleState.phase === 'SELECT_SKILL' && battleState.selectedHero !== null && selectedHeroSkills.length > 0 && (
        <div className="skills-buttons-container">
          {selectedHeroSkills.map((skillId) => {
            const skill = getSkillById(skillId)
            if (!skill) return null
            
            // Comparar como números para que funcione con enum y number
            const selectedSkillNum = battleState.selectedSkill !== null 
              ? (typeof battleState.selectedSkill === 'number' ? battleState.selectedSkill : Number(battleState.selectedSkill))
              : null
            const isSelected = selectedSkillNum === skillId
            
            return (
              <button 
                key={skillId}
                className={`skills-buttons ${isSelected ? 'highlighted' : ''}`}
                onClick={() => {
                  console.log(`🎯 Skill seleccionado: ${skill.name} (ID: ${skillId})`)
                  selectSkill(skillId)
                }}
              >
                <span className="skill-icon">{getSkillIcon(skillId)}</span>
                <span className="skill-text">{skill.name}.</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
