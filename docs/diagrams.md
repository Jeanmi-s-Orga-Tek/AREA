# Diagrammes des entités AREA

## Diagramme de classes UML
```text
+-----------------+       1        +-----------------+
|     Service     |--------------- |      Action     |
+-----------------+    possède     +-----------------+
| - id: UUID      |    (1..*)      | - id: UUID      |
| - name: string  |                | - name: string  |
| - authConfig    |                | - triggers: []  |
| - client: API   |                | - schema: JSON  |
+-----------------+                +-----------------+
         |                                   |
         | 1..*                              | 1
         |                                   v
+-----------------+       1        +-----------------+
|    Workflow     |--------------- |      Hook       |
+-----------------+   orchestre    +-----------------+
| - id: UUID      |    (1..*)      | - id: UUID      |
| - userId: UUID  |                | - endpointURL   |
| - status        |                | - filters       |
| - steps: []     |                +-----------------+
+-----------------+                        |
         | 1..*                             | 1..*
         v                                   v
+-----------------+       1        +-----------------+
|     REAction    |--------------- |  ServiceClient  |
+-----------------+   consomme     +-----------------+
| - id: UUID      |    (1..*)      | - name: string  |
| - name: string  |                | - call()        |
| - effects: []   |                | - mapPayload()  |
| - schema: JSON  |                +-----------------+
+-----------------+
```

### Légende
- Les flèches simples indiquent une association directionnelle.
- (1..*) signifie que l’entité source gère plusieurs instances de l’entité cible.

## Diagramme de séquence (Action → Hook → REAction)
Participants : User · ActionHandler · HookManager · REActionExecutor · TargetService

1. User → ActionHandler : `configureWorkflow(payload)`
2. ActionHandler → HookManager : `emitEvent(triggerData)`
3. HookManager → HookManager : filtrer et normaliser l’événement
4. HookManager → REActionExecutor : `dispatch(eventPayload)`
5. REActionExecutor → REActionExecutor : valider et transformer le payload
6. REActionExecutor → TargetService : `invokeSideEffect(mappedPayload)`
7. TargetService → REActionExecutor : `ack / error`
8. REActionExecutor → HookManager : reporter l’exécution (logs, retries)
9. HookManager → ActionHandler : notifier l’état final (success/failure)
10. ActionHandler → User : afficher le résultat (UI / notification)
