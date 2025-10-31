# Blood Hunter - Module Foundry VTT

Module d'automatisation pour la classe Blood Hunter de Matthew Mercer dans Foundry VTT (système D&D 5e).

**✨ Intégration avancée avec DAE et midi-qol pour une automatisation maximale !**

## Fonctionnalités

### Crimson Rites ✓
- Activation/désactivation automatique des rites
- Calcul automatique du coût en HP selon le niveau
- Application automatique des dégâts élémentaires aux armes
- Types de rites : Fire, Cold, Lightning, Acid, Poison, Necrotic, Psychic, Radiant, Thunder
- **Intégration DAE** : Les effets sont automatiquement ajoutés à la formule de dégâts
- **Intégration midi-qol** : Dégâts calculés dans le workflow de combat automatisé

### Blood Curses 🔥
- Framework complet pour toutes les malédictions
- **Intégration midi-qol** : Réactions automatiques pendant le combat
- Blood Curse of the Marked (avec amplification)
- Blood Curse of Binding (avec amplification)
- Blood Curse of the Anxious (avec amplification)
- Et 5 autres malédictions prêtes à être ajoutées
- Système d'amplification avec coût en HP automatique
- Prompts de réaction en temps réel pendant le combat

### Ordres (à venir)
- Order of the Ghostslayer
- Order of the Lycan
- Order of the Mutant
- Order of the Profane Soul

## Installation

1. Dans Foundry VTT, aller dans "Add-on Modules"
2. Cliquer sur "Install Module"
3. Coller l'URL du manifest : `https://github.com/Melethainiel/vtt-blood-hunter/releases/latest/download/module.json`
4. Cliquer sur "Install"

## Utilisation

### Crimson Rites

1. Assurez-vous d'avoir la fonctionnalité "Crimson Rite" dans votre feuille de personnage
2. Utilisez la macro "Crimson Rite" ou le bouton dans votre feuille
3. Sélectionnez le type de rite et l'arme à enchanter
4. Le module calculera automatiquement le coût en HP et appliquera les dégâts

**Avec DAE** : Les dégâts sont automatiquement ajoutés à chaque attaque
**Avec midi-qol** : Les dégâts apparaissent dans le workflow de combat automatisé

### Blood Curses (avec midi-qol)

1. En combat, quand une condition de déclenchement est remplie, un dialogue apparaît automatiquement
2. Choisissez la malédiction à utiliser
3. Cochez "Amplify" pour amplifier (coûte des HP)
4. Validez et le module applique automatiquement les effets

**Sans midi-qol** : Utilisez les macros de Blood Curse manuellement

### Paramètres

- **Auto-calculate HP cost** : Active/désactive le calcul automatique du coût en HP
- **Show Rite buttons** : Affiche/masque les boutons de Rite sur les armes

## Compatibilité

- Foundry VTT v11+
- Système D&D 5e v3.0.0+

### Modules Recommandés

#### DAE (Dynamic Active Effects) - Fortement recommandé
- Automatise complètement l'application des dégâts de Crimson Rite
- Les bonus sont automatiquement ajoutés aux jets de dégâts
- Gestion avancée des effets actifs

#### midi-qol - Fortement recommandé
- Automatise le workflow de combat complet
- Réactions Blood Curse en temps réel
- Prompts automatiques pour utiliser les capacités
- Calcul automatique des dégâts avec tous les bonus

#### Advanced Macros - Optionnel
- Support pour les macros d'items complexes
- Permet des automatisations encore plus poussées

### Fonctionnement sans modules additionnels

Le module fonctionne parfaitement **sans** DAE ou midi-qol :
- Les Crimson Rites fonctionnent via les hooks dnd5e standards
- Les dégâts sont ajoutés manuellement aux jets
- Les Blood Curses peuvent être activées via macros

**Mais avec DAE + midi-qol**, l'expérience est **grandement améliorée** avec une automatisation complète !

## Licence

MIT License

## Crédits

Classe Blood Hunter créée par Matthew Mercer (Critical Role)
