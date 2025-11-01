# Guide de Configuration - D&D Beyond & Rites Écarlates

Ce guide explique comment configurer votre Blood Hunter pour que le module détecte automatiquement vos Crimson Rites depuis D&D Beyond ou en configuration manuelle.

## Table des matières

1. [Modes de Détection](#modes-de-détection)
2. [Configuration Automatique (D&D Beyond)](#configuration-automatique-dnd-beyond)
3. [Configuration Manuelle](#configuration-manuelle)
4. [Résolution de Problèmes](#résolution-de-problèmes)
5. [Exemples](#exemples)

## Modes de Détection

Le module offre trois modes de détection des Crimson Rites :

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
3. **Aucune configuration supplémentaire nécessaire !**

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

## Résolution de Problèmes

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
