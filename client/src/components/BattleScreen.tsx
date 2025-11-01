import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useBattleLogic } from '../hooks/useBattleLogic'
import { HeroId, EnemyId } from '../types/battle'
import '../App.css'
import { levelsConfig, type LevelId } from '../config/levelsConfig'

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

  const handleHeroClick = (heroId: HeroId) => {
    if (battleState.phase === 'SELECT_HERO') {
      const heroAction = battleState.heroActions.find((a) => a.heroId === heroId)
      if (heroAction && !heroAction.completed) selectHero(heroId)
    }
  }

  const handleEnemyClick = (enemyId: EnemyId) => {
    if (battleState.phase === 'SELECT_ENEMY' && battleState.selectedHero !== null && battleState.selectedSkill !== null) {
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

      {/* Diseño inferior: barra de skills (placeholder por ahora) */}
      <div className="bottom-design">
        <div className="bottom-design-rectangle">
          {[1,2,3,4,5,6,7].map((n) => (
            <img
              key={n}
              className="skill-icon"
              src={'/skills/skill1.jpg'}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement
                if (img.src.indexOf('/skillsIcons/') === -1) {
                  img.src = '/skillsIcons/skill1.jpg' // fallback mientras movemos assets a /skills
                }
              }}
              alt="Skill"
            />
          ))}
        </div>
      </div>
    </div>
  )
}


