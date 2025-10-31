# Guide d'Intégration - DAE & midi-qol

**✅ Compatible Foundry VTT v13**

Ce guide explique comment tirer le meilleur parti du module Blood Hunter avec DAE (Dynamic Active Effects) et midi-qol sur Foundry VTT v11-v13.

## Table des matières

1. [Installation des modules requis](#installation-des-modules-requis)
2. [Crimson Rites avec DAE](#crimson-rites-avec-dae)
3. [Blood Curses avec midi-qol](#blood-curses-avec-midi-qol)
4. [Configuration recommandée](#configuration-recommandée)
5. [Résolution de problèmes](#résolution-de-problèmes)

## Installation des modules requis

### DAE (Dynamic Active Effects)

1. Dans Foundry VTT, allez dans "Add-on Modules"
2. Recherchez "Dynamic Active Effects" (ou "DAE")
3. Installez et activez le module dans votre monde

**Ce que DAE apporte aux Crimson Rites :**
- Ajout automatique des dégâts à la formule d'attaque
- Pas besoin de calcul manuel
- Les effets sont visibles sur la feuille de personnage
- Gestion automatique des durées d'effet

### midi-qol

1. Dans Foundry VTT, allez dans "Add-on Modules"
2. Recherchez "midi-qol"
3. Installez et activez le module dans votre monde

**Ce que midi-qol apporte :**
- Workflow de combat automatisé
- Prompts de réaction pour les Blood Curses
- Calcul automatique de tous les bonus de dégâts
- Gestion des conditions et effets en temps réel

### Advanced Macros (Optionnel)

Pour des automatisations encore plus avancées :
1. Recherchez "Advanced Macros"
2. Installez et activez

## Crimson Rites avec DAE

### Comment ça fonctionne

Quand vous activez un Crimson Rite avec DAE actif :

1. **Activation du rite** : Le module crée un effet actif sur l'arme
2. **DAE ajoute automatiquement** les dégâts à la formule de l'arme
3. **Chaque attaque** avec cette arme inclut automatiquement les dégâts du rite
4. **Les dégâts s'adaptent** au niveau du Blood Hunter (1d4 → 1d6 → 1d8 → 1d10)

### Exemple d'utilisation

```
Blood Hunter niveau 7 active Rite of the Flame sur une épée longue

Sans DAE :
- Attaque : 1d8 + modificateur
- Dégâts du rite : Ajoutés manuellement (1d6 feu)

Avec DAE :
- Attaque : 1d8 + modificateur + 1d6[fire]
- Tout est automatique !
```

### Configuration DAE

Le module Blood Hunter configure automatiquement les effets DAE avec :
- **Key** : `system.damage.parts`
- **Mode** : ADD
- **Value** : `[riteDamage, damageType]`
- **Transfer** : true (l'effet est transféré à l'acteur quand l'arme est équipée)

## Blood Curses avec midi-qol

### Comment ça fonctionne

Les Blood Curses utilisent le système de réactions de midi-qol :

1. **Trigger automatique** : Quand une condition est remplie (attaque, jet de sauvegarde, etc.)
2. **Prompt de réaction** : Un dialogue apparaît demandant si vous voulez utiliser une Blood Curse
3. **Sélection** : Choisissez la malédiction et si vous l'amplifiez
4. **Application automatique** : Les effets sont appliqués immédiatement
5. **Coût HP** : Si amplifié, les HP sont automatiquement déduits

### Curses actuellement implémentées

#### Blood Curse of the Marked
- **Trigger** : Avant une attaque
- **Effet** : Ajoute 1 dé hémocratique aux dégâts
- **Amplifié** : Ajoute 2 dés hémocratiques
- **Hook midi-qol** : `preDamageRoll`

#### Blood Curse of Binding
- **Trigger** : Une créature se déplace dans un rayon de 30 pieds
- **Effet** : Réduit la vitesse à 0
- **Amplifié** : Jet de Force ou entravé
- **Hook midi-qol** : `preCheckHits`

#### Blood Curse of the Anxious
- **Trigger** : Une créature fait un test de caractéristique
- **Effet** : Désavantage au test
- **Amplifié** : Aussi désavantage au prochain jet de sauvegarde
- **Hook midi-qol** : `preAttackRoll`

### Workflow midi-qol

```
1. Créature attaque
   ↓
2. midi-qol.preAttackRoll hook
   ↓
3. Module Blood Hunter détecte les Blood Hunters dans la scène
   ↓
4. Affiche le dialogue de réaction (timeout 10 secondes)
   ↓
5. Joueur sélectionne une curse + amplify
   ↓
6. Module applique les effets et déduit les HP
   ↓
7. Message de chat créé
   ↓
8. Combat continue
```

### Configuration midi-qol

#### Paramètres recommandés

Dans les paramètres de midi-qol :

- **Workflow** : "Standard" ou "Better Rolls"
- **Auto roll attack** : Activé
- **Auto roll damage** : Activé
- **Enable Reactions** : **ACTIVÉ** (crucial pour les Blood Curses)
- **Reaction timeout** : 10 secondes (ou plus si besoin)

#### Hooks utilisés par le module

Le module Blood Hunter s'intègre dans ces hooks midi-qol :

- `midi-qol.preAttackRoll` : Avant le jet d'attaque
- `midi-qol.preCheckHits` : Avant la vérification des touches
- `midi-qol.preDamageRoll` : Avant le jet de dégâts
- `midi-qol.DamageRollComplete` : Après les dégâts (pour Crimson Rite)
- `midi-qol.RollComplete` : À la fin du workflow complet

## Configuration recommandée

### Pour une expérience optimale

1. **Installez les trois modules** : Blood Hunter, DAE, midi-qol
2. **Activez-les dans cet ordre** :
   - D&D 5e (système)
   - DAE
   - midi-qol
   - Blood Hunter

3. **Paramètres Blood Hunter** :
   - Auto-calculate HP cost : ✅ Activé
   - Show Rite buttons : ✅ Activé

4. **Paramètres midi-qol** :
   - Enable Reactions : ✅ Activé
   - Reaction timeout : 10 secondes minimum
   - Auto roll attack : ✅ Activé
   - Auto roll damage : ✅ Activé

5. **Paramètres DAE** :
   - (Configuration par défaut suffit)

### Macros recommandées

Le module crée automatiquement ces macros :

- **Crimson Rite** : Active/désactive un rite
- (Plus de macros à venir pour les Blood Curses individuelles)

## Résolution de problèmes

### Les dégâts du Crimson Rite ne s'ajoutent pas

**Problème** : Les dégâts du rite n'apparaissent pas dans les jets d'attaque

**Solutions** :
1. Vérifiez que DAE est actif : `game.modules.get('dae')?.active`
2. Vérifiez que l'effet est bien sur l'arme (ouvrez la fiche de l'arme)
3. Vérifiez que l'effet a `transfer: true`
4. Rechargez Foundry

### Les Blood Curses ne déclenchent pas de prompt

**Problème** : Aucun dialogue n'apparaît pour utiliser une Blood Curse

**Solutions** :
1. Vérifiez que midi-qol est actif : `game.modules.get('midi-qol')?.active`
2. Vérifiez que "Enable Reactions" est activé dans midi-qol
3. Vérifiez que vous êtes en combat (les réactions ne fonctionnent qu'en combat)
4. Vérifiez que votre personnage a la classe Blood Hunter
5. Ouvrez la console (F12) pour voir les logs

### Les dégâts apparaissent en double

**Problème** : Les dégâts du Crimson Rite sont comptés deux fois

**Solutions** :
1. Le module détecte automatiquement midi-qol et désactive le hook dnd5e
2. Si le problème persiste, vérifiez qu'il n'y a pas de conflit avec d'autres modules
3. Vérifiez les logs console pour les messages d'erreur

### Ordre de chargement des modules

Si vous avez des problèmes, l'ordre de chargement peut être important :

**Ordre recommandé** :
1. lib-wrapper (si installé)
2. libwrapper dependencies
3. DAE
4. midi-qol
5. Blood Hunter
6. Autres modules

Pour modifier l'ordre : Utilisez "Module Management +" ou éditez manuellement `module.json`

## API pour développeurs

### Vérifier si DAE/midi-qol est actif

```javascript
// Vérifier DAE
if (game.bloodhunter.integrations.isDAEActive()) {
  console.log('DAE est actif');
}

// Vérifier midi-qol
if (game.bloodhunter.integrations.isMidiQOLActive()) {
  console.log('midi-qol est actif');
}
```

### Créer un effet DAE pour Crimson Rite

```javascript
const effectData = game.bloodhunter.integrations.createCrimsonRiteEffect(
  'flame',      // riteType
  'fire',       // damageType
  '1d6',        // riteDamage
  weaponId,     // weaponId
  actor         // actor
);
```

### Exécuter une Blood Curse

```javascript
await game.bloodhunter.BloodCurse.execute(
  actor,        // Blood Hunter actor
  curse,        // Curse item
  workflow,     // midi-qol workflow
  amplify       // boolean
);
```

## Support et contribution

Si vous rencontrez des problèmes ou avez des suggestions :

1. Ouvrez une issue sur GitHub
2. Consultez les logs console (F12)
3. Vérifiez que tous les modules sont à jour

## Changelog des intégrations

### v1.0.0 - Intégration initiale
- ✅ Support DAE pour Crimson Rites
- ✅ Support midi-qol pour le workflow de combat
- ✅ Framework Blood Curse avec réactions
- ✅ 3 Blood Curses implémentées
- ✅ Détection automatique des modules
- ✅ Fallback gracieux si modules absents

### Prochaines versions
- 🔄 Plus de Blood Curses
- 🔄 Intégration des Ordres (Lycan, Mutant, etc.)
- 🔄 Support Advanced Macros pour des automatisations avancées
