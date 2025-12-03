# Ajouter un Service, une Action et une REAction

## 1. Nouveau Service
1. **Analyser les services existants** pour comprendre structure, factory, clients API et gestion des secrets.
2. **Créer le dossier** `src/services/<ServiceName>/` avec les sous-fichiers nécessaires en réutilisant les helpers communs.
3. **Définir la configuration** : variables `.env`, paramètres runtime, scopes et mettre à jour la doc des prérequis.
4. **Implémenter le client** (auth, appels API, erreurs) et exposer une interface typée via `index.ts`.
5. **Enregistrer le service** dans le registre global (`services/index.ts`) pour le rendre disponible aux actions/réactions.
6. **Valider** avec lint + tests unitaires.

## 2. Nouvelle Action
1. **Choisir le service source** et relire ses actions pour respecter nommage, inputs et validations.
2. **Créer le fichier de définition** décrivant métadonnées (id, nom, description, champs requis, scopes).
3. **Implémenter le handler** qui récupère les données du service, filtre/transforme et renvoie un payload normalisé.
4. **Ajouter les schémas de validation** (zod/joi) et des tests unitaires couvrant succès + erreurs API.
5. **Enregistrer l’action** dans le catalogue (`src/actions/index.ts`) et mettre à jour les mappings backend/frontend (forms, i18n, icônes).
6. **Exécuter les tests d’intégration** pour vérifier la publication d’événements.

## 3. Nouvelle REAction
1. **Identifier le service cible** et étudier les réactions existantes (auth, quotas, erreurs récupérables).
2. **Définir la fiche métadonnée** (id, nom, description, inputs) alignée sur le payload de l’action.
3. **Implémenter le handler** : consommer le payload, invoquer le client service, gérer idempotence et retours d’erreur (retry, logs).
4. **Enregistrer la réaction** (`src/reactions/index.ts`) et mettre à jour la config front (formulaires, champs dynamiques).
5. **Couvrir par des tests** unitaires + mocks, puis idéalement un test e2e déclencheur→réaction.
6. **Mettre à jour le monitoring** pour suivre la nouvelle réaction.

## Checklist finale
- Secrets ajoutés à `.env.sample` et au vault.
- Types partagés (`types.d.ts`) actualisés.
- Documentation utilisateur (README / wiki) complétée.
- CI (lint, unit, integration) exécutée et validée.
