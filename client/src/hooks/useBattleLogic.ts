import { useState, useCallback } from 'react';
import {
  HeroId,
  EnemyId,
  SkillId,
} from '../types/battle';
import type {
  Hero,
  Enemy,
  HeroAction,
  BattlePhase,
  BattleState,
} from '../types/battle';
import { HEROES_MOCK_DATA, ENEMIES_MOCK_DATA } from '../data/heroesMock';

// Importar datos de mockup (en el futuro vendrán del backend)
const INITIAL_HEROES: Hero[] = HEROES_MOCK_DATA;
const INITIAL_ENEMIES: Enemy[] = ENEMIES_MOCK_DATA;

export const useBattleLogic = () => {
  const [battleState, setBattleState] = useState<BattleState>(() => {

    const skillId = null;
    const initialActions: HeroAction[] = [
      { heroId: HeroId.ANGEL, skillId: skillId, targetEnemyId: null, completed: false },
      { heroId: HeroId.MAGE, skillId: skillId, targetEnemyId: null, completed: false },
      { heroId: HeroId.HERO, skillId: skillId, targetEnemyId: null, completed: false },
    ];

    return {
      phase: 'SELECT_HERO',
      selectedHero: null,
      selectedSkill: null,
      heroes: INITIAL_HEROES,
      enemies: INITIAL_ENEMIES,
      heroActions: initialActions,
      currentHeroIndex: 0,
    };
  });

  // Seleccionar un héroe para asignarle una acción
  const selectHero = useCallback((heroId: HeroId) => {
    console.log('selectHero called in hook:', { heroId });
    setBattleState((prev) => {
      console.log('selectHero - prev state:', {
        phase: prev.phase,
        heroActions: prev.heroActions,
        heroId
      });
      
      // Verificar si el héroe ya tiene una acción completada
      const heroAction = prev.heroActions.find((action) => action.heroId === heroId);
      console.log('selectHero - heroAction found:', heroAction);
      
      if (heroAction?.completed) {
        console.log('Este héroe ya tiene una acción asignada');
        return prev;
      }

      // Encontrar el índice del héroe en la matriz
      const heroIndex = prev.heroActions.findIndex((action) => action.heroId === heroId);
      console.log('selectHero - heroIndex:', heroIndex);
      
      const newState = {
        ...prev,
        phase: 'SELECT_SKILL' as BattlePhase,
        selectedHero: heroId,
        currentHeroIndex: heroIndex >= 0 ? heroIndex : prev.currentHeroIndex,
      };
      
      console.log('selectHero - new state:', newState);
      return newState;
    });
  }, []);

  // Seleccionar un skill para el héroe actual
  // Acepta SkillId enum o números (1-7) de battleUtils
  const selectSkill = useCallback((skillId: SkillId | number) => {
    console.log('selectSkill called in hook:', { skillId });
    setBattleState((prev) => {
      console.log('selectSkill - prev state:', {
        phase: prev.phase,
        selectedHero: prev.selectedHero,
        skillId
      });
      
      // Verificar que hay un héroe seleccionado (puede ser 0, 1 o 2)
      if (prev.selectedHero === null || prev.selectedHero === undefined) {
        console.error('No hay héroe seleccionado. selectedHero:', prev.selectedHero);
        return prev;
      }

      const hero = prev.heroes.find((h) => h.id === prev.selectedHero);
      console.log('selectSkill - hero found:', hero);
      
      if (!hero) {
        console.error('Héroe no encontrado para id:', prev.selectedHero);
        return prev;
      }
      
      // Validar que el skillId sea válido (1-7 correspondientes a los 7 skills disponibles en battleUtils)
      const skillIdNum = typeof skillId === 'number' ? skillId : Number(skillId);
      const validSkillIds = [1, 2, 3, 4, 5, 6, 7]; // IDs usados en battleUtils.ts
      
      if (!validSkillIds.includes(skillIdNum)) {
        console.error('SkillId inválido:', skillId, 'SkillIds válidos:', validSkillIds);
        return prev;
      }
      
      // Actualizar la acción del héroe actual
      const updatedActions = prev.heroActions.map((action) => {
        if (action.heroId === prev.selectedHero) {
          return { ...action, skillId };
        }
        return action;
      });

      // Todos los skills requieren seleccionar un enemigo para mantener el flujo secuencial
      // Flujo: Hero -> Skill -> Enemy
      return {
        ...prev,
        phase: 'SELECT_ENEMY',
        selectedSkill: skillId,
        heroActions: updatedActions,
      };
    });
  }, []);

  // Seleccionar un enemigo como objetivo
  const selectEnemy = useCallback((enemyId: EnemyId) => {
    console.log('selectEnemy called:', { enemyId });
    setBattleState((prev) => {
      console.log('selectEnemy - prev state:', {
        selectedHero: prev.selectedHero,
        selectedSkill: prev.selectedSkill,
        phase: prev.phase,
        heroActions: prev.heroActions
      });

      // Verificar que hay un héroe seleccionado (puede ser 0, 1 o 2, no null/undefined)
      // Verificar que hay un skill seleccionado (puede ser 1-7, no null/undefined)
      if (prev.selectedHero === null || prev.selectedHero === undefined || 
          prev.selectedSkill === null || prev.selectedSkill === undefined) {
        console.error('No hay héroe o skill seleccionado', {
          selectedHero: prev.selectedHero,
          selectedSkill: prev.selectedSkill,
          phase: prev.phase,
          heroActions: prev.heroActions
        });
        return prev;
      }

      // Actualizar la acción del héroe actual con el enemigo objetivo
      const updatedActions = prev.heroActions.map((action) => {
        if (action.heroId === prev.selectedHero) {
          return { ...action, targetEnemyId: enemyId, completed: true };
        }
        return action;
      });

      // Pasar al siguiente héroe que no tenga acción completada
      const nextHeroIndex = updatedActions.findIndex(
        (action, index) => !action.completed && index > prev.currentHeroIndex
      );

      const allCompleted = updatedActions.every((action) => action.completed);

      return {
        ...prev,
        phase: allCompleted ? 'COMPLETE' : 'SELECT_HERO',
        selectedHero: null,
        selectedSkill: null,
        heroActions: updatedActions,
        currentHeroIndex: allCompleted ? prev.currentHeroIndex : nextHeroIndex >= 0 ? nextHeroIndex : prev.currentHeroIndex,
      };
    });
  }, []);

  // Reiniciar el turno - todos los parámetros vuelven a estar vacíos (null)
  // Esperando que el jugador decida qué acción quiere definir
  const resetTurn = useCallback(() => {
    setBattleState((prev) => {
      const resetActions: HeroAction[] = [
        { heroId: HeroId.ANGEL, skillId: null, targetEnemyId: null, completed: false },
        { heroId: HeroId.MAGE, skillId: null, targetEnemyId: null, completed: false },
        { heroId: HeroId.HERO, skillId: null, targetEnemyId: null, completed: false },
      ];

      return {
        ...prev,
        phase: 'SELECT_HERO',
        selectedHero: null,
        selectedSkill: null,
        heroActions: resetActions,
        currentHeroIndex: 0,
      };
    });
  }, []);

  // Obtener las acciones completadas (matriz de los 3 héroes)
  const getHeroActions = useCallback((): HeroAction[] => {
    return battleState.heroActions;
  }, [battleState.heroActions]);

  // Retorna una matriz con solo 3 parámetros por héroe: heroId, skillId, targetEnemyId
  const getCompletedActionsForBackend = useCallback((): Array<{ heroId: HeroId; skillId: number | null; targetEnemyId: EnemyId | null }> | null => {
    // Verificar que todas las acciones estén completadas (incluyendo el tercer héroe)
    const allCompleted = battleState.heroActions.every((action) => action.completed);
    
    if (!allCompleted) {
      return null;
    }

    // Buscar la acción del tercer héroe para verificar que esté completa
    const thirdHeroAction = battleState.heroActions.find((action) => action.heroId === HeroId.HERO);
    
    // Si el tercer héroe tiene una acción completada (completed: true), devolver la matriz
    // Nota: targetEnemyId puede ser null para skills sin target (Heal, Defend, Buffs)
    if (!thirdHeroAction || !thirdHeroAction.completed) {
      return null;
    }

    // Devolver la matriz de acciones completadas en formato para backend
    // Solo 3 parámetros por héroe: heroId, skillId, targetEnemyId (puede ser null para skills sin target)
    const actionsMatrix = battleState.heroActions.map((action) => ({
      heroId: action.heroId,
      skillId: action.skillId,
      targetEnemyId: action.targetEnemyId,
    }));

    // Log de la matriz cada vez que se envía al backend
    console.log('🔵 Matriz de acciones completadas enviada al backend:', actionsMatrix);
    
    return actionsMatrix;
  }, [battleState]);

  // Obtener el héroe actual que debe seleccionar
  const getCurrentHero = useCallback((): Hero | null => {
    if (battleState.phase === 'COMPLETE') return null;
    
    // Si hay un héroe seleccionado (fase SELECT_SKILL o SELECT_ENEMY), devolver ese
    if (battleState.selectedHero !== null) {
      return battleState.heroes.find((h) => h.id === battleState.selectedHero) || null;
    }
    
    // Si no hay héroe seleccionado (fase SELECT_HERO), devolver el siguiente disponible
    const currentAction = battleState.heroActions[battleState.currentHeroIndex];
    if (!currentAction) return null;
    return battleState.heroes.find((h) => h.id === currentAction.heroId) || null;
  }, [battleState]);

  // Obtener todos los IDs de skills disponibles
  const getAllSkillIds = useCallback((): number[] => {
    return [1, 2, 3, 4, 5, 6, 7]; // Todos los skills disponibles según battleUtils
  }, []);

  return {
    battleState,
    selectHero,
    selectSkill,
    selectEnemy,
    resetTurn,
    getHeroActions,
    getCompletedActionsForBackend,
    getCurrentHero,
    getAllSkillIds,
  };
};

