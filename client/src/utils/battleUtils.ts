// Utilidades compartidas para la lógica de combate en todos los escenarios

import { HeroId, SkillId } from '../types/battle'

// Defini un objeto skill con las propiedades que necesitamos para el juego
export interface Skill {
	id: number
	name: string
	description: string
	damage: number
	heal: number
	buff: number
	debuff: number
}

export const getSkillsIdsByHeroId = (heroId: HeroId): number[] => {
	switch (heroId) {
		case HeroId.ANGEL: return [1, 2, 3, 4, 5, 6, 7]
		case HeroId.MAGE: return [1, 2, 3, 4, 5, 6, 7]
		case HeroId.HERO: return [1, 2, 3, 4, 5, 6, 7]
		default: return []
	}
}

export const getSkillById = (skillId: number): Skill | undefined => {
	const skills: Skill[] = [
		{ id: 1, name: 'Basic Attack', description: 'Un ataque básico contra un enemigo.', damage: 10, heal: 0, buff: 0, debuff: 0 },
		{ id: 2, name: 'Special Attack', description: 'Un ataque especial que inflige más daño.', damage: 20, heal: 0, buff: 0, debuff: 0 },
		{ id: 3, name: 'Flame Attack', description: 'Ataque de fuego que inflige daño de área.', damage: 15, heal: 0, buff: 0, debuff: 0 },
		{ id: 11, name: 'Heal', description: 'Cura a un aliado una cantidad moderada.', damage: 0, heal: 15, buff: 0, debuff: 0 },
		{ id: 12, name: 'Mass Heal', description: 'Cura a todos los aliados.', damage: 0, heal: 8, buff: 0, debuff: 0 },
		{ id: 21, name: 'Buff Defense', description: 'Aumenta la defensa de un aliado.', damage: 0, heal: 0, buff: 10, debuff: 0 },
		{ id: 22, name: 'Buff Attack', description: 'Aumenta el ataque de un aliado.', damage: 0, heal: 0, buff: 10, debuff: 0 },
		{ id: 23, name: 'Buff Critical Chance', description: 'Aumenta la probabilidad de golpe crítico.', damage: 0, heal: 0, buff: 10, debuff: 0 },
		{ id: 24, name: 'Buff Evasion', description: 'Aumenta la evasión de un aliado.', damage: 0, heal: 0, buff: 10, debuff: 0 },
		{ id: 31, name: 'Debuff Defense', description: 'Reduce la defensa de un enemigo.', damage: 0, heal: 0, buff: 0, debuff: 10 },
		{ id: 32, name: 'Debuff Attack', description: 'Reduce el ataque de un enemigo.', damage: 0, heal: 0, buff: 0, debuff: 10 },
		{ id: 33, name: 'Debuff Critical Chance', description: 'Reduce la probabilidad de crítico de un enemigo.', damage: 0, heal: 0, buff: 0, debuff: 10 },
		{ id: 34, name: 'Debuff Evasion', description: 'Reduce la evasión de un enemigo.', damage: 0, heal: 0, buff: 0, debuff: 10 },
	]
	return skills.find((skill) => skill.id === skillId)
}

export const getSkillName = (skillId: SkillId | number): string => {
	const skill = getSkillById(typeof skillId === 'number' ? skillId : skillId)
	return skill?.name || 'Unknown'
}

