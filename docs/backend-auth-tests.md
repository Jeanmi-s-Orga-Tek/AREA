# Tests d'authentification Backend

## Prérequis

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install pytest
```

## Lancer les tests

```bash
cd /home/jm/Epitech/Tek3/AREA
pytest Backend/tests
```

## Lire les résultats

- Les tests réussis affichent `PASSED`.
- Les erreurs sont listées avec les détails et les fichiers.
- Pour plus de verbosité, utiliser `pytest -vv Backend/tests`.
- Si Starlette affiche un avertissement PendingDeprecation concernant `python_multipart`, assurez-vous que `python-multipart` est installé (il est maintenant inclus dans `Backend/requirements.txt`).
