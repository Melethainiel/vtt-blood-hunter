# Guide de Configuration - D&D Beyond & Détection Automatique

Ce guide explique comment configurer votre Blood Hunter pour que le module détecte automatiquement vos capacités (Crimson Rites, Blood Curses, Orders) depuis D&D Beyond ou en configuration manuelle.

**✨ Système Universel de Détection :** Le module détecte automatiquement TOUTES vos capacités Blood Hunter !

## Table des matières

1. [Modes de Détection](#modes-de-détection)
2. [Configuration Automatique (D&D Beyond)](#configuration-automatique-dnd-beyond)
3. [Configuration Manuelle](#configuration-manuelle)
4. [Détection par Type de Capacité](#détection-par-type-de-capacité)
5. [Résolution de Problèmes](#résolution-de-problèmes)
6. [Exemples](#exemples)

## Modes de Détection

Le module offre trois modes de détection pour les **Crimson Rites** et les **Blood Curses** :

### 🔄 Auto (Recommandé)
**Par défaut** - Le meilleur des deux mondes
- Cherche d'abord les rites dans les capacités/features du personnage
- Si aucun rite n'est trouvé, utilise le système par niveau
- Parfait pour les imports D&D Beyond ET les personnages créés manuellement

### 📋 Features Only (D&D Beyond)
**Compatible imports D&D Beyond**
- Affiche UNIQUEMENT les rites trouvés dans les capacités du personnage
- Si vous avez choisi "Rite of the Flame" et "Rite of the Storm" sur D&D Beyond, seuls ces deux apparaîtront
- Idéal pour respecter exactement les choix faits sur D&D Beyond

### 📊 Level-Based (Traditionnel)
**Système classique**
- Affiche tous les rites disponibles selon le niveau
- Niveau 3+ : Flame, Frozen, Storm
- Niveau 6+ : + Corrosion, Toxin
- Niveau 14+ : + Dead, Oracle, Dawn, Roar
- Utile si vous gérez les restrictions vous-même

## Configuration Automatique (D&D Beyond)

### Avec ddb-importer

Si vous utilisez le module **D&D Beyond Importer** :

1. **Importez votre personnage** depuis D&D Beyond
2. Le module détectera automatiquement les rites dans vos features
3. Le module **utilisera automatiquement** la valeur native `@scale.blood-hunter.blood-maledict` pour calculer les dés d'hemocraft
4. **Aucune configuration supplémentaire nécessaire !**

### Hemocraft Die - Valeur Native DDB

Le module détecte et utilise automatiquement la valeur `actor.system.scale["blood-hunter"]["crimson-rite"]` importée par DDB Importer. Cette valeur correspond au dé d'hemocraft selon votre niveau :
- Niveau 1-4 : 1d4
- Niveau 5-10 : 1d6
- Niveau 11-16 : 1d8
- Niveau 17+ : 1d10

**Format DDB** : Les valeurs sont stockées comme objet avec `{ number: 1, faces: 6, modifiers: [] }`, le module convertit automatiquement en format `1d6`.

**Avantages** :
- ✅ Toujours synchronisé avec votre niveau réel
- ✅ Compatible avec les mécaniques de scaling de DDB
- ✅ Fonctionne automatiquement avec tous les imports DDB
- ✅ Aucune maintenance manuelle nécessaire

**Fallback** : Si la valeur DDB n'est pas disponible (personnage créé manuellement), le module utilise un calcul basé sur le niveau de Blood Hunter.

**Résolution de Problèmes** :
- Si vous constatez que le mauvais dé est utilisé, vérifiez la console pour voir si le module détecte correctement la valeur DDB
- Le module affiche des messages de log indiquant quelle méthode est utilisée (DDB vs fallback)

### Comment ça fonctionne

Le module recherche dans vos features/capacités des mots-clés comme :
- "Rite of the Flame", "Flame", "Fire"
- "Rite of the Frozen", "Frozen", "Cold"
- "Rite of the Storm", "Storm", "Lightning"
- etc.

**Exemple avec un Blood Hunter niveau 7 :**

Si vous avez importé votre personnage et choisi :
- ✅ Rite of the Flame
- ✅ Rite of the Storm

Le dialog affichera **uniquement** ces deux options :
```
Select a Rite type:
☑️ Rite of the Flame (Fire)
☑️ Rite of the Storm (Lightning)
```

Et NON toutes les options niveau 7 :
```
❌ Rite of the Frozen (Cold)    <- Masqué
❌ Rite of the Corrosion (Acid) <- Masqué
❌ Rite of the Toxin (Poison)   <- Masqué
```

## Configuration Manuelle

Si vous créez votre personnage manuellement dans Foundry (sans D&D Beyond) :

### Méthode 1 : Créer des Features

1. **Ouvrez la feuille de personnage**
2. **Créez un nouvel item de type "Feature" ou "Feat"**
3. **Nommez-le** avec le nom du rite :
   - "Rite of the Flame"
   - "Crimson Rite: Flame"
   - "Rite - Fire"
   - etc.

4. **Le module le détectera automatiquement !**

**Exemple complet :**
```
Nom: Rite of the Flame
Type: Feature
Description: You can invoke a rite of flames, dealing fire damage...
```

### Méthode 2 : Utiliser les Flags (Avancé)

Pour les utilisateurs avancés, vous pouvez ajouter un flag directement :

```javascript
// Sur un item Feature
item.setFlag('vtt-blood-hunter', 'crimsonRite', true);
item.setFlag('vtt-blood-hunter', 'riteType', 'flame');
```

### Méthode 3 : Mode Level-Based

Si vous préférez ne pas créer de features :

1. **Ouvrez les paramètres du module**
2. **"Crimson Rite Detection Mode"** → **"Level-Based (Traditional)"**
3. Tous les rites appropriés au niveau seront disponibles

## Détection par Type de Capacité

Le module détecte automatiquement différents types de capacités Blood Hunter :

### 🔥 Crimson Rites

**Mots-clés détectés :**
- Anglais : flame, fire, frozen, cold, storm, lightning, corrosion, acid, toxin, poison, dead, necrotic, oracle, psychic, dawn, radiant, roar, thunder
- Français : flamme, feu, givre, froid, tempête, foudre, corrosion, acide, toxine, poison, mort, nécrotique, oracle, psychique, aube, radiant, rugissement, tonnerre

**Exemple de feature :**
```
Nom: Rite of the Flame
Type: Feature
Description: As a bonus action, you can activate a crimson rite...
```

**Configuration :** Module Settings → "Crimson Rite Detection Mode"

### 🩸 Blood Curses

**Mots-clés détectés :**
- **Binding** : binding, bind, lier, entrave
- **Marked** : marked, mark, marque
- **Anxious** : anxious, anxiety, anxieux, anxiété
- **Eyeless** : eyeless, blind, aveugle
- **Fallen Puppet** : fallen puppet, puppet, marionnette
- **Bloated Agony** : bloated agony, agony, agonie
- **Corrosion** : corrosion, corrode
- **Exorcism** : exorcism, exorcise, exorcisme

**Exemple de feature :**
```
Nom: Blood Curse of the Marked
Type: Feature
Description: As a bonus action, you can mark a creature...
```

**Configuration :** Module Settings → "Blood Curse Detection Mode"

### 🐺 Order of the Lycan

**Mots-clés détectés :**
- Anglais : lycan, lycanthrope, hybrid transformation, predatory strikes, blood lust, cursed weakness, heightened senses, stalker's prowess, brand of the voracious
- Français : transformation hybride, frappes prédatrices, soif de sang, faiblesse maudite, sens aiguisés, prouesse du traqueur, marque du vorace

**Exemple de feature :**
```
Nom: Hybrid Transformation
Type: Feature
Description: You can transform into a hybrid form...
```

**Détection :** Automatique - si une feature Lycan est trouvée, le bouton de transformation apparaît

### 🔮 Autres Orders (à venir)

La détection automatique sera étendue aux autres Orders :
- Order of the Ghostslayer
- Order of the Mutant
- Order of the Profane Soul

## Résolution de Problèmes

### Problème : Le module n'utilise pas la bonne valeur de dé d'hemocraft

**Solutions :**

1. **Vérifiez que votre personnage est importé depuis DDB**
   - Ouvrez la console (F12) et tapez : `game.actors.getName("VOTRE_NOM").system.scale`
   - Vérifiez que `blood-hunter.blood-maledict` existe et contient la bonne valeur

2. **Vérifiez les messages de la console**
   - F12 → Console
   - Cherchez : `vtt-blood-hunter | Using DDB scale value for hemocraft die: 1dX`
   - Ou : `vtt-blood-hunter | Using level-based hemocraft die: 1dX (level Y)`

3. **Réimportez votre personnage**
   - Parfois, une réimportation complète résout le problème
   - Assurez-vous que ddb-importer est à jour

### Problème : Aucun rite n'apparaît

**Solutions :**

1. **Vérifiez que vous avez la classe Blood Hunter**
   - Le personnage doit avoir un item de type "Class" nommé "Blood Hunter"

2. **Vérifiez le mode de détection**
   - Module Settings → "Crimson Rite Detection Mode"
   - Essayez "Auto" ou "Level-Based"

3. **Vérifiez vos features**
   - Ouvrez la feuille → Onglet Features
   - Cherchez des items avec "Rite", "Flame", "Fire", etc.
   - Si aucun, créez-les manuellement ou passez en mode "Level-Based"

4. **Consultez la console**
   - F12 → Console
   - Cherchez les messages : `vtt-blood-hunter | Found X rites in features`

### Problème : Trop de rites apparaissent

Si vous voulez UNIQUEMENT vos rites choisis :

1. **Module Settings** → "Crimson Rite Detection Mode"
2. Choisissez **"Features Only"**
3. Créez des features pour chaque rite que vous possédez

### Problème : Le module ne détecte pas mes rites D&D Beyond

**Vérifications :**

1. **Les features sont-elles bien importées ?**
   - Ouvrez la feuille → Features
   - Vérifiez que les rites apparaissent

2. **Les noms sont-ils en anglais ?**
   - Le module cherche "Flame", "Fire", "Frozen", etc.
   - Si vos features sont en français, ajoutez les mots-clés anglais dans la description

3. **Essayez de réimporter**
   - Parfois, une réimportation complète résout le problème

### Problème : Blood Curses ne déclenchent pas de prompt

**Solutions :**

1. **Vérifiez que midi-qol est actif**
   - Les prompts automatiques nécessitent midi-qol
   - Sans midi-qol, utilisez les macros manuellement

2. **Vérifiez le mode de détection**
   - Module Settings → "Blood Curse Detection Mode"
   - Essayez "Auto" ou "Level-Based"

3. **Vérifiez vos features**
   - Cherchez des items avec "Blood Curse", "Marked", "Binding", etc.
   - Si aucun, créez-les ou passez en mode "Level-Based"

### Problème : Bouton de transformation Lycan n'apparaît pas

**Solutions :**

1. **Vérifiez vos features Lycan**
   - Cherchez des items avec "Lycan", "Hybrid Transformation", "Predatory Strikes", etc.
   - Le module détecte automatiquement ces keywords

2. **Créez une feature manuellement**
   - Nom : "Hybrid Transformation" ou "Order of the Lycan"
   - Type : Feature
   - Le bouton apparaîtra automatiquement

3. **Utilisez la macro**
   - Une macro "Hybrid Transformation" est créée automatiquement
   - Utilisez-la si le bouton n'apparaît pas

## Exemples

### Exemple 1 : Blood Hunter niveau 7 avec Rite of Flame et Storm (D&D Beyond)

**Configuration :**
```
Mode: Auto (Features → Level fallback)
Features importées:
  - Rite of the Flame
  - Rite of the Storm
```

**Résultat :**
```
Dialog affiche:
☑️ Rite of the Flame (Fire)
☑️ Rite of the Storm (Lightning)
```

### Exemple 2 : Blood Hunter niveau 3 créé manuellement

**Option A - Avec features :**
```
Mode: Auto
Créer une feature: "Rite of the Flame"

Résultat:
☑️ Rite of the Flame (Fire)
```

**Option B - Sans features :**
```
Mode: Level-Based

Résultat:
☑️ Rite of the Flame (Fire)
☑️ Rite of the Frozen (Cold)
☑️ Rite of the Storm (Lightning)
```

### Exemple 3 : Blood Hunter niveau 14 avec tous les rites

**Configuration :**
```
Mode: Level-Based
(ou créer 9 features, une pour chaque rite)
```

**Résultat :**
```
Dialog affiche les 9 rites:
☑️ Rite of the Flame (Fire)
☑️ Rite of the Frozen (Cold)
☑️ Rite of the Storm (Lightning)
☑️ Rite of the Corrosion (Acid)
☑️ Rite of the Toxin (Poison)
☑️ Rite of the Dead (Necrotic)
☑️ Rite of the Oracle (Psychic)
☑️ Rite of the Dawn (Radiant)
☑️ Rite of the Roar (Thunder)
```

## Mots-Clés de Détection

Le module cherche ces mots-clés dans le **nom** et la **description** des features :

| Rite | Mots-clés anglais | Mots-clés français |
|------|-------------------|-------------------|
| Flame | flame, fire | flamme, feu |
| Frozen | frozen, cold | givre, froid |
| Storm | storm, lightning | tempête, foudre |
| Corrosion | corrosion, acid | corrosion, acide |
| Toxin | toxin, poison | toxine, poison |
| Dead | dead, necrotic | mort, nécrotique |
| Oracle | oracle, psychic | oracle, psychique |
| Dawn | dawn, radiant | aube, radiant |
| Roar | roar, thunder | rugissement, tonnerre |

## Template de Feature pour Configuration Manuelle

Si vous voulez créer vos rites manuellement, voici un template :

```
───────────────────────────────────
NOM: Rite of the Flame
TYPE: Feature
SOURCE: Blood Hunter
ACTIVATION: Bonus Action
CONSOMMATION: 1 HP (auto-calculé par le module)

DESCRIPTION:
As a bonus action, you can activate a crimson rite on a weapon.
While active, attacks with this weapon deal an extra 1d6 fire damage.
The rite lasts until your next short or long rest.

FLAGS: (optionnel)
vtt-blood-hunter.crimsonRite: true
vtt-blood-hunter.riteType: flame
───────────────────────────────────
```

Copiez ce template pour chaque rite que votre personnage connaît.

## Recommandations

### Pour les joueurs avec D&D Beyond
✅ Utilisez le mode **"Auto"** (par défaut)
✅ Importez votre personnage avec ddb-importer
✅ Le module fera le reste automatiquement

### Pour les personnages créés manuellement
✅ Créez des features pour vos rites choisis + Mode "Auto"
✅ OU utilisez le mode "Level-Based" pour tous les rites

### Pour les MJs
✅ Mode "Auto" par défaut pour accommoder tous les types de personnages
✅ Encouragez les joueurs à créer des features pour leurs rites
✅ Le mode "Features Only" peut être activé pour forcer les joueurs à choisir leurs rites

## Support

Si vous rencontrez des problèmes :

1. **Vérifiez la console (F12)** pour les messages de debug
2. **Essayez les différents modes** de détection
3. **Créez des features manuellement** si nécessaire
4. **Ouvrez une issue** sur GitHub avec :
   - Le mode de détection utilisé
   - Screenshot de vos features
   - Message de la console
   - Version du module

---

**Note** : Cette fonctionnalité est conçue pour s'adapter à votre workflow. Si vous préférez l'ancienne méthode (tous les rites selon le niveau), changez simplement le mode en "Level-Based" !

Dernière mise à jour : Janvier 2025
