/**
 * Blood Curse type definitions and registry
 */

export const CURSE_TYPES = {
  binding: {
    name: 'Blood Curse of Binding',
    level: 1,
    timing: 'reaction',
    trigger: 'creature within 30 feet moves',
    amplified: 'Also apply Strength save or restrained',
    usesHemocraft: true
  },
  marked: {
    name: 'Blood Curse of the Marked',
    level: 1,
    timing: 'bonus',
    trigger: 'before attack roll',
    amplified: 'Additional hemocraft die',
    usesHemocraft: true
  },
  anxious: {
    name: 'Blood Curse of the Anxious',
    level: 1,
    timing: 'reaction',
    trigger: 'creature makes ability check',
    amplified: 'Disadvantage on next saving throw',
    usesHemocraft: false
  },
  eyeless: {
    name: 'Blood Curse of the Eyeless',
    level: 6,
    timing: 'reaction',
    trigger: 'creature attacks with advantage',
    amplified: 'Creature attacks with disadvantage',
    usesHemocraft: false
  },
  fallen_puppet: {
    name: 'Blood Curse of the Fallen Puppet',
    level: 6,
    timing: 'reaction',
    trigger: 'creature within 30 feet dies',
    amplified: 'Creature makes weapon attack',
    usesHemocraft: false
  },
  bloated_agony: {
    name: 'Blood Curse of Bloated Agony',
    level: 10,
    timing: 'bonus',
    trigger: 'at will',
    amplified: 'Constitution save or stunned',
    usesHemocraft: true
  },
  corrosion: {
    name: 'Blood Curse of Corrosion',
    level: 14,
    timing: 'reaction',
    trigger: 'creature casts a spell',
    amplified: 'Also deal psychic damage',
    usesHemocraft: true
  },
  exorcism: {
    name: 'Blood Curse of the Exorcism',
    level: 18,
    timing: 'bonus',
    trigger: 'fiend, fey, or undead',
    amplified: 'Banishment effect',
    usesHemocraft: true
  }
};
