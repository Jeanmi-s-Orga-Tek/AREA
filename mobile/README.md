# AREA Mobile App

Application mobile React Native pour le projet AREA (Action-Reaction).

## Prérequis

### Environnement de développement

- **Node.js** >= 20
- **npm** ou **yarn**
- **Java JDK** 17 ou 21 (pour Android)
- **Android Studio** avec:
  - Android SDK Platform 34
  - Android SDK Build-Tools
  - Android Emulator
- **Watchman** (recommandé sur macOS/Linux)

### Configuration Android SDK

Assurez-vous que les variables d'environnement suivantes sont configurées:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Installation

```bash
cd mobile
npm install
```

## Démarrage

### 1. Lancer Metro Bundler

Dans un premier terminal:

```bash
npm start
```

### 2. Lancer l'application Android

Dans un second terminal:

```bash
npm run android
```

Ou avec `npx`:

```bash
npx react-native run-android
```

### 3. Lancer l'application iOS (macOS uniquement)

Pour iOS, installer d'abord les CocoaPods:

```bash
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

## Structure du projet

```
mobile/
├── android/              # Code natif Android
├── ios/                  # Code natif iOS
├── src/
│   ├── components/       # Composants réutilisables (Button, Card)
│   ├── screens/          # Écrans de l'app (Login, Areas, Settings)
│   ├── navigation/       # Configuration React Navigation
│   ├── theme/            # Thème (colors, spacing, typography)
│   └── api/              # Appels API (à implémenter)
├── App.tsx               # Point d'entrée de l'app
└── package.json
```

## Écrans disponibles

- **LoginScreen**: Écran de connexion
- **AreasScreen**: Liste des AREAs (automations)
- **SettingsScreen**: Paramètres de l'application

## Build APK

Pour générer un APK de release:

```bash
cd android
./gradlew assembleRelease
```

L'APK sera généré dans `android/app/build/outputs/apk/release/`.

## Commandes utiles

```bash
npm start              # Démarrer Metro
npm run android        # Lancer sur Android
npm run ios            # Lancer sur iOS
npm run lint           # Linter le code
npm test               # Lancer les tests
```

## Troubleshooting

### Metro ne démarre pas

```bash
npx react-native start --reset-cache
```

### Erreur de build Android

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Erreur "command not found: adb"

Vérifiez que `ANDROID_HOME` est bien configuré et que `platform-tools` est dans le PATH.

## Learn More

- [React Native Website](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org/)
