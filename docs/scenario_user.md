# Scénario E2E AREA

## 1. Créer un utilisateur
1. **Inscription** : appeler `/api/auth/signup` ou utiliser le formulaire web avec email + mot de passe forts.
2. **Vérification** : confirmer l’adresse via le lien reçu, puis se connecter pour récupérer le token JWT.
3. **Contrôle** : vérifier dans la base ou via `/api/users/me` que le profil est actif.

## 2. Connecter un service
1. **Choisir le service** (ex. GitHub, Slack) et ouvrir la page `Integrations`.
2. **Démarrer l’OAuth** : cliquer sur *Connect*, accepter les scopes demandés.
3. **Stocker les secrets** : assurer que le refresh token apparaît dans le coffre ou la table `service_tokens`.
4. **Tester** : déclencher un ping (`/api/services/{id}/health`) pour valider l’accès.

## 3. Créer un AREA
1. **Sélectionner Action + REAction** dans l’UI ou via `/api/areas`.
2. **Configurer les champs** : renseigner les inputs requis (ex. repo, channel, message template) et sauvegarder.
3. **Activer le workflow** : passer l’AREA à l’état `enabled` et vérifier l’entrée correspondante en DB.
4. **Vérifier les hooks** : s’assurer que le webhook Action est bien enregistré (logs ou `/api/hooks`).

## 4. Produire un événement
1. **Générer l’événement** correspondant à l’Action (ex. pousser un commit si Action=“New Push”).
2. **Observer les logs** Action/Hook pour confirmer la réception (`status=accepted`).
3. **Contrôler la queue** : vérifier que le message est publié dans la file (RabbitMQ/Kafka).

## 5. Vérifier la REAction
1. **Suivre l’exécution** via `/api/executions?areaId=...` ou la console d’observabilité.
2. **Confirmer l’effet** : par exemple message envoyé dans Slack ou ressource créée dans le service cible.
3. **Inspecter les métriques** : `success_count` incrémenté, aucun retry en erreur.
4. **Documenter** : noter l’ID d’exécution et archiver les preuves (captures, logs) pour QA.

## Diagramme de fonctionnement
```text
[User]
   |
   v
[API / UI] --(configure AREA)--> [Action Handler]
   |
   v
[Hook Manager] --(filtre + normalise)--> [Queue/Event Bus]
   |
   v
[REAction Executor] --(payload mappé)--> [Service cible]
   |
   v
[Observability/Logs] --(feedback)--> [User]
```
> Flux : création de l’AREA, émission de l’événement, traitement par Hook, exécution de la REAction puis retour d’état à l’utilisateur.

> Checklist finale : compte actif, service connecté, AREA `enabled`, événement loggé, REAction observée.
