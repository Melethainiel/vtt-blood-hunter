# Blood Hunter pour Foundry VTT

Module Foundry VTT pour jouer la classe Blood Hunter de Matthew Mercer avec le système D&D 5e.

![Foundry v14](https://img.shields.io/badge/Foundry-v14-informational)
![dnd5e 5.3.2](https://img.shields.io/badge/dnd5e-5.3.2-blue)
![Module 1.4.5](https://img.shields.io/badge/module-1.4.5-green)

## Compatibilité

- Foundry VTT 14.
- Système `dnd5e` 5.3.2.
- DAE et midi-qol sont optionnels. Le module fonctionne sans eux, avec moins d'automatisation.

## Ce que fait le module

- Détecte les personnages Blood Hunter et leur niveau.
- Gère les dés d'hemocraft depuis les valeurs d'échelle DDB quand elles existent, sinon depuis le niveau.
- Ajoute des boutons d'action sur les fiches de personnage Blood Hunter.
- Fournit un compendium de capacités Blood Hunter synchronisable avec les personnages importés.

## Fonctionnalités

### Crimson Rite

- Activation d'un rite sur une arme.
- Jet du coût en points de vie et application automatique si l'option est activée.
- Ajout des dégâts du rite aux activités d'attaque via le système d'enchantement `dnd5e`.
- Suppression des rites à la fin d'un repos court ou long.
- Détection des rites connus depuis les features importées, avec repli possible sur le niveau.

### Blood Curses

- Détection des malédictions connues depuis les features du personnage.
- Gestion de Blood Maledict et du coût d'amplification.
- Support de Blood Curse of the Marked, Blood Curse of Binding, Blood Curse of the Anxious et Blood Curse of the Fallen Puppet.
- Hooks midi-qol quand le module est présent.

### Order of the Lycan

- Hybrid Transformation avec effets actifs.
- Bonus de forme hybride selon le niveau.
- Rappels Blood Lust.
- Gestion de Predatory Strikes et des bonus associés.

## Installation

Dans Foundry VTT, installez le module depuis cette URL de manifeste :

```text
https://github.com/Melethainiel/vtt-blood-hunter/releases/latest/download/module.json
```

Activez ensuite le module dans le monde concerné.

## Utilisation

### Personnages importés depuis D&D Beyond

Le module est prévu pour travailler avec les features importées par DDB Importer. Les modes de détection permettent de choisir comment les rites et malédictions disponibles sont déterminés :

- `Auto` : utilise les features si possible, sinon le niveau du Blood Hunter.
- `Features Only` : affiche uniquement les capacités détectées sur la fiche.
- `Level-Based` : se base uniquement sur le niveau de classe.

Voir `DDB-CONFIGURATION.md` pour le détail des formats pris en charge.

### Synchronisation des features

Un bouton de synchronisation est ajouté aux fiches Blood Hunter. Il remplace les features importées par les versions du compendium du module lorsque les identifiants correspondent.

Cette action modifie les items du personnage. Faites une copie de l'acteur si vous voulez tester sans risque.

### Crimson Rite

Lancez l'activité Crimson Rite depuis la feature ou utilisez le bouton dédié sur la fiche. Le module demande le rite et l'arme, applique le coût en points de vie, puis crée l'effet actif sur l'arme.

## Modules optionnels

- DAE : durée des effets et automatisation plus robuste des effets actifs.
- midi-qol : intégration avec le workflow de combat et certaines réactions.

Ces modules ne sont pas requis pour installer ou charger Blood Hunter.

## Développement

Commandes utiles :

```bash
npm run lint
npm run validate
npm run build:packs
npm run build
```

Les sources des compendiums sont dans `packData/`. Ne modifiez pas directement `packs/`, qui est généré.

## Licence

MIT. La classe Blood Hunter est une création de Matthew Mercer / Critical Role.
