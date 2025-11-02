
export interface Skill {
	id: number
	name: string
	description: string
	damage: number
	heal: number
	buff: number
	debuff: number
}

export const getSkillsIdsByCharacterId = (characterId: number): number[] => {
	switch (characterId) {
		case 1: return [2, 5, 6]
		case 2: return [1, 3, 4]
		case 3: return [2, 7, 8]
		case 4: return [1, 7]
		case 5: return [2, 7, 8]
		case 6: return [1, 8, 4]
		case 7: return [1, 2, 3, 8, 6, 7]
		default: return []
	}
}

export const getSkillById = (skillId: number): Skill | undefined => {
	const skills: Skill[] = [
		{ id: 1, name: 'Basic Attack', description: 'A basic attack against an enemy.', damage: 10, heal: 0, buff: 0, debuff: 0 },
		{ id: 2, name: 'Power Attack', description: 'A powerful attack that deals more damage.', damage: 25, heal: 0, buff: 0, debuff: 0 },
		{ id: 3, name: 'Flame Attack', description: 'Fire attack that deals damage.', damage: 30, heal: 0, buff: 0, debuff: 0 },
		{ id: 4, name: 'Heal', description: 'Heals an ally for a moderate amount.', damage: 0, heal: 30, buff: 0, debuff: 0 },
		{ id: 5, name: 'Buff Defense', description: 'Increases an ally\'s defense.', damage: 0, heal: 0, buff: 10, debuff: 0 },
		{ id: 6, name: 'Buff Attack', description: 'Increases an ally\'s attack.', damage: 0, heal: 0, buff: 10, debuff: 0 },
		{ id: 7, name: 'Buff Critical Chance', description: 'Increases the critical hit chance.', damage: 0, heal: 0, buff: 10, debuff: 0 },
		{ id: 8, name: 'Debuff Defense', description: 'Reduces an enemy\'s defense.', damage: 0, heal: 0, buff: 0, debuff: 10 },
		{ id: 9, name: 'Debuff Attack', description: 'Reduces an enemy\'s attack.', damage: 0, heal: 0, buff: 0, debuff: 10 },
	]
	return skills.find((skill) => skill.id === skillId)
}

export const getSkillName = (skillId: number): string => {
	const skill = getSkillById(skillId)
	return skill?.name || 'Unknown'
}

