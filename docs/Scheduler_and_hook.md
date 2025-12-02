# Tests unitaires – Scheduler / Hook

## Objectif

Vérifier que :

1. Une **Action factice** (FakeAction) est correctement déclenchée par le **scheduler**.
2. Les **Hooks** associés à cette Action sont bien invoqués.
3. Les **REActions associées** à ces Hooks sont toutes appelées avec les bonnes données de contexte.
4. Aucune REAction non concernée n'est déclenchée.

---

## Pré-requis techniques

- Un système de **scheduler** capable de :
  - planifier une exécution d'Action (cron, interval, trigger manuel simulé, etc.),
  - appeler un **hook dispatcher** ou similaire.
- Une API/contrat pour :
  - **Action** (interface ou classe de base),
  - **Hook** (ou équivalent),
  - **REAction** (ou Handler d'effet),
  - un **EventBus** ou mécanisme de messagerie interne (optionnel, selon ton archi).
- Capacité de **mock/stub** :
  - Timer / scheduler,
  - Couche d’IO (HTTP, DB, etc.),
  - REActions (pour compter les appels).

---

## Cas de test principaux

### 1. Déclenchement d’une Action factice planifiée

**But** : s’assurer que le scheduler exécute bien l’Action prévue.

**Scénario :**

1. Enregistrer une FakeAction (`FakeActionScheduled`) dans le scheduler, pour une exécution quasi immédiate.
2. Démarrer le scheduler dans un contexte de test (boucle d’événements simulée, avancée de temps, etc.).
3. Vérifier que :
   - la méthode `execute` (ou équivalent) de `FakeActionScheduled` est appelée,
   - les paramètres d’entrée attendus sont bien passés,
   - aucun autre job non configuré n’est exécuté.

**Pseudo-code (agnostique langage) :**

```text
setup:
  scheduler = new InMemoryScheduler()
  fakeAction = new FakeAction()
  spy(fakeAction.execute)

  scheduler.schedule(fakeAction, at = NOW + 1s)

test:
  advanceTime(2s)
  scheduler.tick()

assert:
  fakeAction.execute was called exactly once
  fakeAction.execute was called with expected context
```

---

### 2. Appel des Hooks associés après l’Action

**But** : vérifier que les Hooks liés à l’Action sont déclenchés une fois l’Action terminée.

**Scénario :**

1. Créer une `FakeAction` avec un ou plusieurs **Hooks** associés (`FakeHookA`, `FakeHookB`).
2. Mocker/spyer les méthodes `handle` des Hooks.
3. Déclencher l’Action via le scheduler.
4. Vérifier que :
   - tous les Hooks enregistrés sur cette Action sont appelés,
   - l’ordre d’appel (si important) est respecté,
   - les données retournées par l’Action (payload) sont transmises aux Hooks.

**Pseudo-code :**

```text
setup:
  action = new FakeActionReturningPayload()
  hookA = new FakeHookA()
  hookB = new FakeHookB()
  spy(hookA.handle)
  spy(hookB.handle)

  hookRegistry.register(actionType = FakeAction, hooks = [hookA, hookB])
  scheduler.schedule(action, at = NOW + 1s)

test:
  advanceTime(2s)
  scheduler.tick()

assert:
  hookA.handle was called once with payload from FakeActionReturningPayload
  hookB.handle was called once with payload from FakeActionReturningPayload
```

---

### 3. Appel des REActions associées aux Hooks

**But** : vérifier que les REActions sont déclenchées pour chaque Hook, avec les bons paramètres.

**Scénario :**

1. Créer une `FakeREAction1` et `FakeREAction2` associées à `FakeHookA`.
2. Mocker/spyer leurs méthodes d’exécution (`run`, `execute`, etc.).
3. Exécuter le même flux : scheduler → Action → Hooks.
4. Vérifier que :
   - `FakeREAction1` et `FakeREAction2` sont toutes les deux appelées,
   - elles reçoivent le bon **contexte** (payload Action + métadonnées Hook + config AREA),
   - aucune REAction non enregistrée pour ce Hook n’est invoquée.

**Pseudo-code :**

```text
setup:
  action = new FakeActionReturningPayload()
  hookA = new FakeHookA()
  reAction1 = new FakeREAction1()
  reAction2 = new FakeREAction2()

  spy(reAction1.run)
  spy(reAction2.run)

  hookRegistry.register(FakeAction, [hookA])
  reActionRegistry.register(hookA, [reAction1, reAction2])

  scheduler.schedule(action, at = NOW + 1s)

test:
  advanceTime(2s)
  scheduler.tick()

assert:
  reAction1.run was called once with context { payload, hook: hookA, areaConfig: ... }
  reAction2.run was called once with context { payload, hook: hookA, areaConfig: ... }
  no other REActions were called
```

---

### 4. Cas d’erreur : Action échoue, quelles REActions ?

**But** : définir et tester le comportement attendu si l’Action échoue (exception, timeout…).

**Scénario (exemple de politique) :**

- Si l’Action échoue :
  - Les Hooks ne sont **pas** appelés,
  - Une REAction spéciale de type “onError” peut être appelée (optionnel, selon design).

**Pseudo-code :**

```text
setup:
  action = new FakeActionThrowingError()
  hookA = new FakeHookA()
  errorReAction = new FakeErrorREAction()

  spy(hookA.handle)
  spy(errorReAction.run)

  hookRegistry.register(FakeActionThrowingError, [hookA])
  errorHandler.register(FakeActionThrowingError, errorReAction)

  scheduler.schedule(action, at = NOW + 1s)

test:
  advanceTime(2s)
  scheduler.tick()

assert:
  hookA.handle was never called
  errorReAction.run was called once with error context
```

---

## Recommandations d’implémentation des tests “réels”

- **Langage** : utiliser le même langage que le backend (ex. Python, Node, Go).
- **Framework de test** :
  - Python : `pytest`, `unittest`, avec `unittest.mock` pour les spies/mocks.
  - Node : `jest`, `vitest`, etc.
- **Isolation** :
  - Ne pas appeler de services externes (HTTP, DB) : mocker/stubber.
  - Utiliser un **scheduler in-memory** ou un “fake timer” (ex. jest fake timers).
- **Nommer clairement les tests** :
  - `test_scheduler_triggers_fake_action`
  - `test_hooks_are_called_after_action`
  - `test_reactions_are_called_for_each_hook`
  - `test_no_reaction_called_on_action_failure`  

---

## Diagramme simplifié du flux testé

```text
[Scheduler] 
   |
   v
[Action.execute()] ----> (produit un payload)
   |
   v
[HookDispatcher] ----> [HookA.handle(payload)]
                            |
                            v
                 [REAction1.run(ctx), REAction2.run(ctx)]
```

Ce fichier `.md` te sert de spécification fonctionnelle des tests.  
Ensuite, tu peux traduire chaque pseudo-code dans des fichiers de tests concrets (ex. Python avec `pytest`), en suivant exactement ces scénarios.

