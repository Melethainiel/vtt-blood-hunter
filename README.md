# Blood Hunter - Module Foundry VTT

![Foundry v13](https://img.shields.io/badge/Foundry-v13-informational)
![DnD5e v3.0+](https://img.shields.io/badge/dnd5e-v3.0+-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

Module d'automatisation pour la classe Blood Hunter de Matthew Mercer dans Foundry VTT (système D&D 5e).

**✨ Intégration avancée avec DAE et midi-qol pour une automatisation maximale !**
**🎯 Compatible et testé sur Foundry VTT v13 (version actuelle)**

## Fonctionnalités

### Crimson Rites ✓
- Activation/désactivation automatique des rites
- **🔄 Détection automatique depuis D&D Beyond** : Ne montre que les rites que vous possédez !
- **🎲 Utilise les valeurs natives DDB** : Détecte automatiquement `@scale.blood-hunter.blood-maledict` pour les dés d'hemocraft
- **Configuration flexible** : 3 modes (Auto, Features-Only, Level-Based)
- Calcul automatique du coût en HP selon le niveau (utilise les valeurs DDB quand disponibles)
- Application automatique des dégâts élémentaires aux armes
- Types de rites : Fire, Cold, Lightning, Acid, Poison, Necrotic, Psychic, Radiant, Thunder
- **Intégration DAE** : Les effets sont automatiquement ajoutés à la formule de dégâts
- **Intégration midi-qol** : Dégâts calculés dans le workflow de combat automatisé

### Blood Curses 🔥
- Framework complet pour toutes les malédictions
- **🔄 Détection automatique depuis D&D Beyond** : Ne montre que les malédictions que vous possédez !
- **Configuration flexible** : 3 modes (Auto, Features-Only, Level-Based)
- **Intégration midi-qol** : Réactions automatiques pendant le combat
- Blood Curse of the Marked (avec amplification)
- Blood Curse of Binding (avec amplification)
- Blood Curse of the Anxious (avec amplification)
- Et 5 autres malédictions prêtes à être ajoutées
- Système d'amplification avec coût en HP automatique
- Prompts de réaction en temps réel pendant le combat

### Order of the Lycan 🐺 ✓
- **🔄 Détection automatique depuis D&D Beyond** : Le bouton de transformation apparaît automatiquement si vous avez les features Lycan !
- **Hybrid Transformation** complète avec Active Effects
- **Bonus évolutifs** selon le niveau (AC, vitesse, Force, Dextérité, Réduction de dégâts)
- **Blood Lust** : Système de contrôle avec rappels automatiques
- **Predatory Strikes** : Dégâts hémocratiques automatiques en mêlée
- Transformation dure 1 heure avec gestion automatique
- Interface intuitive avec bouton de transformation sur la feuille
- Progression complète de niveau 3 à 18
- Messages de chat stylisés pour les transformations

### Autres Ordres (à venir)
- Order of the Ghostslayer
- Order of the Mutant
- Order of the Profane Soul

## Installation

1. Dans Foundry VTT, aller dans "Add-on Modules"
2. Cliquer sur "Install Module"
3. Coller l'URL du manifest : `https://github.com/Melethainiel/vtt-blood-hunter/releases/latest/download/module.json`
4. Cliquer sur "Install"

## Utilisation

### Crimson Rites

1. **Importez votre personnage depuis D&D Beyond** (ou créez des features manuellement)
2. Le module **détecte automatiquement** vos rites depuis vos features
3. Le module **utilise automatiquement** la valeur native `@scale.blood-hunter.blood-maledict` de DDB pour les dés d'hemocraft
4. Utilisez la macro "Crimson Rite" ou le bouton dans votre feuille
5. **Seuls vos rites apparaissent** dans la liste de sélection !
6. Sélectionnez l'arme à enchanter
7. Le module calculera automatiquement le coût en HP et appliquera les dégâts

**Exemple** : Blood Hunter niveau 7 avec Rite of Flame et Storm uniquement
- ✅ Dialog affiche : Flame et Storm
- ❌ Dialog ne montre PAS : Frozen, Corrosion, Toxin
- ✅ Utilise automatiquement 1d6 depuis DDB (ou calcul par niveau si non disponible)

**Avec DAE** : Les dégâts sont automatiquement ajoutés à chaque attaque
**Avec midi-qol** : Les dégâts apparaissent dans le workflow de combat automatisé

📖 **Voir [DDB-CONFIGURATION.md](DDB-CONFIGURATION.md) pour le guide complet**

### Blood Curses (avec midi-qol)

1. En combat, quand une condition de déclenchement est remplie, un dialogue apparaît automatiquement
2. Choisissez la malédiction à utiliser
3. Cochez "Amplify" pour amplifier (coûte des HP)
4. Validez et le module applique automatiquement les effets

**Sans midi-qol** : Utilisez les macros de Blood Curse manuellement

### Paramètres

- **Auto-calculate HP cost** : Active/désactive le calcul automatique du coût en HP
- **Show Rite buttons** : Affiche/masque les boutons de Rite sur les armes
- **Crimson Rite Detection Mode** : Comment détecter les rites disponibles
  - **Auto** (Recommandé) : Détecte depuis les features, repli sur niveau
  - **Features Only** : Compatible D&D Beyond, montre uniquement vos rites
  - **Level-Based** : Mode traditionnel, tous les rites selon le niveau
- **Blood Curse Detection Mode** : Comment détecter les malédictions disponibles
  - **Auto** (Recommandé) : Détecte depuis les features, repli sur niveau
  - **Features Only** : Compatible D&D Beyond, montre uniquement vos malédictions
  - **Level-Based** : Mode traditionnel, toutes les malédictions selon le niveau

## Compatibilité

- **Foundry VTT** : v11, v12, v13 (vérifié et testé sur v13)
- **Système D&D 5e** : v3.0.0+
- **Note** : Le module fonctionne parfaitement sur Foundry VTT v13 (version actuelle)

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
