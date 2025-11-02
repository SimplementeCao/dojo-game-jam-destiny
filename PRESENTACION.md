# 🎮 DESTINY - Project Presentation

## 📋 Index
1. [General Overview](#general-overview)
2. [Game Features](#game-features)
3. [Skill System](#skill-system)
4. [Character System](#character-system)
5. [Events and Visual Feedback System](#events-and-visual-feedback-system)
6. [Complete Audio System](#complete-audio-system)
7. [Interactive Hover System](#interactive-hover-system)
8. [UI/UX System](#uiux-system)
9. [Architecture and Technologies](#architecture-and-technologies)
10. [Detailed Battle System](#detailed-battle-system)
11. [User Interface](#user-interface)
12. [Technical Features](#technical-features)
13. [Metrics and Statistics](#metrics-and-statistics)
14. [Technologies Used](#technologies-used)
15. [Conclusion](#conclusion)
---

## 🎯 General Overview

**DESTINY** is a fully on-chain turn-based RPG battle game built on **Starknet** using the **Dojo framework**. The game combines classic strategic RPG mechanics with blockchain capabilities, offering a decentralized gaming experience where all actions are recorded on-chain.

### Main Concept
Players control a team of heroes who must complete 3 difficulty levels (Easy, Medium, Hard), facing monsters in strategic turn-based battles. Each level unlocks sequentially upon completing the previous one, creating a clear progression system.

---

## 🎮 Game Features

### 1. Progression System
- **3 Difficulty Levels**: Easy, Medium, Hard
- **Sequential Unlocking**: Level 1 available from the start, levels 2 and 3 unlock after completing the previous one
- **Progress Persistence**: Progress state is saved on-chain via the `Progress` model
- **Completion Tracking**: System that tracks which levels each player has completed

### 2. Turn-Based Battle System

#### Selection Phase
- **Hero Selection**: Click on a hero to select them
- **Skill Selection**: Choose from the hero's available skills
- **Target Selection**: 
  - Offensive skills → select enemy
  - Support skills (heal/buff) → select ally
- **Auto-execution**: Once all heroes have assigned actions, the turn executes automatically

#### Combat Mechanics
- **Damage System**: 
  - Base damage + character attack + random variation
  - Calculation: `damage = base_damage + attack + random(0, attack/2)`
- **Critical Hits**: Probability based on character's `critical_chance` + 25% base
  - Critical damage = normal damage × 2
  - Special visual effects and unique sound
- **Evasion**: Attacks can miss based on target's `evasion` stat
- **Defense System**: Defense reduces damage received: `actual_damage = damage - defense`

### 3. Skill System (9 Types)

#### Offensive Skills
1. **Basic Attack** (ID: 1): Basic attack that deals moderate damage
2. **Power Attack** (ID: 2): Powerful attack that deals more damage
3. **Flame Attack** (ID: 3): Fire attack with high damage

#### Support Skills (Allies)
4. **Heal** (ID: 4): Restores HP of an ally
5. **Buff Defense** (ID: 5): Increases an ally's defense
6. **Buff Attack** (ID: 6): Increases an ally's attack
7. **Buff Critical Chance** (ID: 7): Increases an ally's critical hit probability

#### Debuff Skills (Enemies)
8. **Debuff Defense** (ID: 8): Reduces an enemy's defense
9. **Debuff Attack** (ID: 9): Reduces an enemy's attack

### 4. Character System

#### Heroes (7 Available Characters)
Each hero has:
- **Unique stats**: HP, Attack, Defense, Critical Chance, Evasion
- **Set of 3 Skills**: Unique combination per character
- **Animations**: Idle, Hit, Damage (pixel-art GIF animations)

#### Monsters
- Different monsters per level
- AI that selects actions automatically
- Same mechanics as heroes

### 5. Events and Visual Feedback System

#### On-Chain Events
- **DamageEvent**: When damage is dealt (with critical flag)
- **HealEvent**: When HP is restored
- **BuffEvent**: When a buff is applied
- **DebuffEvent**: When a debuff is applied
- **MissEvent**: When an attack fails
- **PlayerWinEvent**: When the player wins the battle
- **PlayerLoseEvent**: When the player loses

#### Visual Feedback
- **Floating Numbers**: Animations showing damage, healing, buffs
- **Critical Indicators**: Light red color + "Critical Hit!" label
- **Character Animations**: Change between idle, hit, dmg based on actions
- **Victory Effects**: Large "VICTORY!" message with dark overlay
- **Hover System**: Detailed character information when hovering

### 6. Complete Audio System

#### Background Music
- **Home Music**: Plays `homeMusic.mp3` on home and levels screens
- **Battle Music**: Plays `battleMusic.mp3` during battles
- **Smart Management**: Continuous music between Home and Levels, pauses when entering battle

#### Sound Effects
- **criticalhit.mp3**: Critical hits
- **hit.mp3**: Normal attacks (Basic, Power, Flame Attack)
- **healing.mp3**: Healing abilities
- **buff.mp3**: Buff application
- **debuff.mp3**: Debuff application
- **miss.mp3**: Failed attacks
- **selecheroe.mp3**: Hero, skill, or enemy selection
- **selectlvl.mp3**: Level selection
- **conect.mp3**: Wallet connection
- **victory.mp3**: Battle victory

### 7. Interactive Hover System

#### Character Information
When hovering over a character:
- **Header**: Type (HERO/MONSTER) and character ID
- **Complete Stats**: 
  - HP: Current/Max
  - ATK: Attack value
  - DEF: Defense value
  - CRIT: Critical probability (%)
  - EVA: Evasion probability (%)
- **Skill List**: All available abilities with name and description

### 8. UI/UX System

#### Screens
1. **Home Screen**: 
   - Wallet connection
   - Transition to Levels with sound
   - Loading states

2. **Levels Screen**:
   - 3 Level cards with visible difficulties (EASY/MEDIUM/HARD)
   - Visual lock system (locked levels have dark overlay)
   - Pulse animation on difficulties
   - "CHOOSE YOUR DESTINY" title with visual effects

3. **Battle Screen**:
   - Divided layout: Top (Monsters) / Bottom (Heroes)
   - Information container (character hover)
   - Skills container (action selection)
   - Real-time battle animations

#### Visual States
- **Loading Overlay**: 30% darkening + loading gif on all transitions
- **UI Blocking**: During navigation, all levels are blocked
- **Transition Animations**: Fade-in, slide-down, slide-right

---

## 🏗️ Architecture and Technologies

### Technology Stack

#### Frontend
- **React 18.3.1**: Main framework
- **TypeScript**: Static typing
- **Vite 6.2.5**: Build tool and dev server
- **React Router DOM 7.6.2**: Navigation between screens
- **Tailwind CSS 4.1.3**: Styling and responsive design
- **Framer Motion 12.6.2**: Advanced animations

#### Blockchain / Backend
- **Starknet**: Layer 2 blockchain
- **Dojo Framework 1.7.0**: On-chain game engine
- **Cairo 2.12.2**: Programming language for smart contracts
- **Torii**: Dojo indexer for GraphQL queries

#### Wallet Integration
- **@starknet-react/core 5.0.1**: Integration with Starknet wallets
- **@cartridge/connector**: Cartridge wallet support
- **@dojoengine/sdk 1.7.0-preview.3**: SDK to interact with Dojo

#### Audio and Assets
- **HTML5 Audio API**: Native browser audio system
- **Animated GIFs**: Characters with pixel-art animations
- **Image Formats**: Optimized JPEG, PNG, WebP

### System Architecture

#### Project Structure
```
ded/
├── contracts/          # Smart contracts (Cairo/Dojo)
│   ├── src/
│   │   ├── models.cairo      # Data models (Battle, Character, etc.)
│   │   ├── systems/
│   │   │   └── actions.cairo # Game logic (start_battle, play)
│   │   └── random.cairo      # Random number system
│   └── bindings/             # TypeScript bindings generated
│
└── client/            # Frontend (React/TypeScript)
    ├── src/
    │   ├── components/       # React components
    │   ├── hooks/           # Custom hooks (useGameActions, useBattleData)
    │   ├── dojo/            # Dojo configuration
    │   └── utils/           # Utilities (battleUtils)
    └── public/              # Static assets
```

#### Data Models (On-Chain)

1. **Destiny**: Global battle counter
2. **Battle**: Current battle information
   - `id`: Unique battle ID
   - `level`: Difficulty level (1, 2, 3)
   - `player`: Player address
   - `heroes_ids`: Array of hero IDs
   - `monsters_ids`: Array of monster IDs
   - `is_finished`: Completion status
3. **CurrentBattle**: Active battle for the player
4. **Character**: Base character data (heroes and monsters)
5. **CharacterStatus**: Battle status (HP, stats, etc.)
6. **Progress**: Player progress per level

## ⚔️ Detailed Battle System

### Turn Flow

1. **Player Selection Phase**:
   - Select hero → Skill → Target
   - Repeat for all heroes
   - Actions are saved locally

2. **On-Chain Execution**:
   - All actions are sent as a transaction
   - Contract processes each action sequentially
   - Events are emitted for each action

3. **Visual Processing**:
   - Frontend listens to events
   - Shows animations with delays for better UX
   - Updates stats in real-time

4. **AI Phase (Monsters)**:
   - Monsters select actions automatically
   - Basic AI that randomly chooses targets and skills
   - Their actions are processed

5. **Victory/Defeat Condition Evaluation**:
   - If all monsters die → PlayerWinEvent
   - If all heroes die → PlayerLoseEvent

### Damage Calculation

```cairo
// Pseudocode of the calculation
base_damage = get_base_damage_by_skill(action_id)
damage = base_damage + attacker.attack + random(0, attacker.attack / 2)

if critical_hit:
    damage = damage * 2

actual_damage = max(0, damage - target.defense)
target.current_hp = max(0, target.current_hp - actual_damage)
```

---

## 🎨 User Interface

### Visual Design
- **Pixel-Art Style**: "Press Start 2P" font for main elements
- **Color Palette**: 
  - Heroes: Turquoise (#4ecdc4)
  - Monsters: Red (#ff6b6b)
  - Text: White with shadows
- **Visual Effects**:
  - Animated glows on selectable characters
  - Shadows and glow effects on important text
  - Pulse animations on key elements

### Responsive Design
- **Clamp()**: Adaptive font sizes using `clamp(min, viewport, max)`
- **Flexbox/Grid**: Flexible layouts
- **Media Queries**: Adjustments for mobile devices

### Accessibility
- **ARIA Labels**: Descriptive labels for interactive elements
- **Keyboard Navigation**: Keyboard navigation possible
- **Visual Feedback**: Clear states (hover, disabled, selected)

---

## 🔧 Technical Features

### Optimizations
- **Lazy Loading**: Components loaded on demand
- **Memoization**: Optimized React hooks
- **Audio Reuse**: One audio instance per sound type
- **GraphQL Queries**: Efficient queries for on-chain data

### Security
- **On-Chain Validation**: All critical logic is in the smart contract
- **Wallet Verification**: Ownership verification via wallet
- **Decentralized State**: Progress cannot be manipulated

### Scalability
- **Modular System**: Clear separation between frontend and contracts
- **Type Safety**: TypeScript + Cairo to prevent errors
- **Event-Driven**: Event-based system for updates

---

## 📊 Metrics and Statistics

- **Characters**: 7 unique heroes + multiple monsters
- **Skills**: 9 different skill types
- **Levels**: 3 levels with increasing difficulty
- **Events**: 7 different event types
- **Sound Effects**: 11 unique sound effects
- **Screens**: 3 main screens (Home, Levels, Battle)

---

## 🚀 Technologies Used

### Core Technologies
- **Cairo 2.12.2**: Smart contract language
- **Dojo 1.7.0**: On-chain game engine
- **React 18.3.1**: UI framework
- **TypeScript 5.8.3**: Type-safe development
- **Starknet**: Layer 2 blockchain

### Development Tools
- **Vite**: Build tool
- **Scarb**: Cairo package manager
- **Sozo**: Dojo CLI tool
- **Torii**: Dojo indexer

### Libraries & Frameworks
- **@dojoengine/sdk**: Dojo integration
- **@starknet-react/core**: Starknet React integration
- **React Router**: Navigation
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations

---

## 🎯 Conclusion

DESTINY is a complete on-chain game that demonstrates the capabilities of the Dojo framework for creating decentralized gaming experiences. It combines classic RPG mechanics with the guarantees of transparency and immutability of the blockchain, offering a unique gaming experience where players have real control over their progress and achievements.

### Highlights
✅ Complete and balanced battle system  
✅ Polished UI/UX with visual and audio feedback  
✅ On-chain persistent progression  
✅ Complete integration with Starknet wallets  
✅ Modular and scalable code  
