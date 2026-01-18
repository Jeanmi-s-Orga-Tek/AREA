import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, Card, StarField} from '../components';
import {colors, spacing, typography} from '../theme';
import {getApiBaseUrl, setApiBaseUrl, clearApiBaseUrl} from '../api/storage';
import {fetchAbout, AboutResponse} from '../api/about';
import {fetchCurrentUser, CurrentUser} from '../api/user';
import {useAuth} from '../context/AuthContext';
import {useAccessibility} from '../context/AccessibilityContext';
import {AccessibilityMode} from '../theme/colors';
type ConnectionStatus = 'idle' | 'loading' | 'success' | 'error';

export const SettingsScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState('');
  const [aboutData, setAboutData] = useState<AboutResponse | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const {isLoggedIn, logout} = useAuth();
  const {mode: accessibilityMode, setMode: setAccessibilityMode, colors: themeColors} = useAccessibility();

  const accessibilityModes: {value: AccessibilityMode; label: string; emoji: string; description: string}[] = [
    {value: 'default', label: 'Par défaut', emoji: '🎨', description: 'Couleurs standard'},
    {value: 'high-contrast', label: 'Contraste élevé', emoji: '🔲', description: 'Visibilité améliorée'},
    {value: 'deuteranopia', label: 'Deutéranopie', emoji: '🟢', description: 'Daltonisme rouge-vert'},
    {value: 'protanopia', label: 'Protanopie', emoji: '🔴', description: 'Daltonisme rouge'},
    {value: 'tritanopia', label: 'Tritanopie', emoji: '🔵', description: 'Daltonisme bleu-jaune'},
  ];

  useEffect(() => {
    const loadUrl = async () => {
      const storedUrl = await getApiBaseUrl();
      if (storedUrl) {
        setUrl(storedUrl);
        setCurrentUrl(storedUrl);
      }
    };
    loadUrl();
  }, []);

  const loadUserProfile = useCallback(async () => {
    if (!isLoggedIn) {
      setUser(null);
      setUserError('');
      return;
    }
    setUserLoading(true);
    setUserError('');
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch (error) {
      setUserError(
        error instanceof Error ? error.message : 'Unable to load account information.',
      );
    } finally {
      setUserLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleSave = async () => {
    setErrorMessage('');
    setSavedMessage('');

    if (!url.trim()) {
      setErrorMessage('URL cannot be empty');
      return;
    }

    try {
      await setApiBaseUrl(url.trim());
      setCurrentUrl(url.trim());
      setSavedMessage('Saved ✅');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to save URL');
    }
  };

  const handleFetchServerInfo = async () => {
    setConnectionStatus('loading');
    setConnectionError('');
    setAboutData(null);
    try {
      const info = await fetchAbout();
      setAboutData(info);
      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(
        error instanceof Error ? error.message : 'Unable to reach the server.',
      );
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleClearLocalData = async () => {
    try {
      await clearApiBaseUrl();
      await logout();
      setUrl('');
      setCurrentUrl(null);
      setSavedMessage('');
      setAboutData(null);
      setConnectionStatus('idle');
      Alert.alert('Local data cleared', 'Server URL and session have been cleared.');
    } catch (error) {
      Alert.alert(
        'Unable to clear data',
        error instanceof Error ? error.message : 'Unknown error occurred.',
      );
    }
  };

  const renderServerStatus = () => {
    if (connectionStatus === 'success' && aboutData) {
      return (
        <View style={styles.successContainer}>
          <Text style={styles.connectionSuccess}>Connecté ✅</Text>
          <Text style={styles.infoText}>
            Services disponibles : {aboutData.server.services.length}
          </Text>
          <Text style={styles.infoText}>
            Heure serveur : {new Date(aboutData.server.current_time * 1000).toLocaleString()}
          </Text>
          <Text style={styles.infoText}>Client : {aboutData.client.host}</Text>
        </View>
      );
    }

    if (connectionStatus === 'error') {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.connectionError}>Serveur injoignable ❌</Text>
          <Text style={styles.errorDetailText}>{connectionError}</Text>
        </View>
      );
    }

    return null;
  };

  const renderAccountSection = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Compte</Text>
      <Text style={styles.cardDescription}>
        Gérez votre profil AREA et votre session
      </Text>
      {userLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.sectionSpinner} />
      ) : (
        <View style={styles.accountDetails}>
          <Text style={styles.infoText}>
            Nom : {user?.name || user?.email || 'Utilisateur inconnu'}
          </Text>
          <Text style={styles.infoText}>Email : {user?.email || 'N/A'}</Text>
          {userError ? <Text style={styles.errorText}>{userError}</Text> : null}
        </View>
      )}
      <Button title="Se déconnecter" variant="danger" onPress={handleLogout} style={styles.cardButton} />
    </Card>
  );

  const renderAboutSection = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>À propos / Infos serveur</Text>
      <Text style={styles.cardDescription}>
        Consultez l&apos;instance backend reliée au client mobile
      </Text>
      <Button
        title={connectionStatus === 'loading' ? 'Chargement...' : 'Voir les infos serveur'}
        onPress={handleFetchServerInfo}
        variant="outline"
        disabled={connectionStatus === 'loading'}
        style={styles.cardButton}
      />
      {renderServerStatus()}
    </Card>
  );

  const renderAdvancedSection = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Avancé</Text>
      <Text style={styles.cardDescription}>
        Nettoyez la configuration locale et la session si besoin
      </Text>
      <Button
        title="Effacer les données locales"
        variant="outline"
        onPress={handleClearLocalData}
        style={styles.cardButton}
      />
    </Card>
  );

  const renderAccessibilitySection = () => (
    <Card style={styles.card}>
      <Text style={[styles.cardTitle, {color: themeColors.text}]}>Accessibilité</Text>
      <Text style={[styles.cardDescription, {color: themeColors.textSecondary}]}>
        Personnalisez l'affichage pour une meilleure visibilité
      </Text>
      <View style={styles.accessibilityGrid}>
        {accessibilityModes.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[
              styles.accessibilityOption,
              {backgroundColor: themeColors.surfaceMuted, borderColor: themeColors.border},
              accessibilityMode === m.value && {borderColor: themeColors.primary, backgroundColor: `${themeColors.primary}1A`},
            ]}
            onPress={() => setAccessibilityMode(m.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.accessibilityEmoji}>{m.emoji}</Text>
            <Text
              style={[
                styles.accessibilityLabel,
                {color: themeColors.text},
                accessibilityMode === m.value && {color: themeColors.primary},
              ]}
            >
              {m.label}
            </Text>
            <Text style={[styles.accessibilityDescription, {color: themeColors.textSecondary}]}>{m.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  const showServerResultsInline = !isLoggedIn;

  return (
    <StarField padding={0}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={[styles.title, {color: themeColors.primary}]}>{isLoggedIn ? 'Paramètres' : 'Paramètres serveur'}</Text>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Configuration serveur</Text>
            <Text style={styles.cardDescription}>
              {isLoggedIn
                ? 'Modifier l’URL déconnectera votre session actuelle.'
                : 'Définissez la base d’API avant de vous connecter.'}
            </Text>

            <TextInput
              style={[styles.input, {
                backgroundColor: themeColors.surfaceMuted,
                color: themeColors.text,
                borderColor: themeColors.border,
              }]}
              placeholder="http://10.0.2.2:8080"
              placeholderTextColor={themeColors.textSecondary}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            {savedMessage ? (
              <Text style={styles.successText}>{savedMessage}</Text>
            ) : null}

            <Button title="Enregistrer" onPress={handleSave} style={styles.saveButton} />

            <Text style={styles.currentUrlText}>
              Serveur actuel : {currentUrl ? currentUrl : 'Non défini'}
            </Text>

            {!isLoggedIn && (
              <Button
                title={connectionStatus === 'loading' ? 'Test en cours...' : 'Tester la connexion'}
                onPress={handleFetchServerInfo}
                variant="outline"
                disabled={connectionStatus === 'loading' || !currentUrl}
                style={styles.testButton}
              />
            )}

            {!isLoggedIn && connectionStatus === 'loading' && (
              <View style={styles.testingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.testingText}>Test de connexion...</Text>
              </View>
            )}

            {showServerResultsInline && renderServerStatus()}
          </Card>

          {isLoggedIn ? (
            <>
              {renderAccessibilitySection()}
              {renderAccountSection()}
              {renderAboutSection()}
              {renderAdvancedSection()}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </StarField>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardButton: {
    marginTop: spacing.md,
  },
  input: {
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    borderWidth: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  currentUrlText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  successText: {
    ...typography.bodySmall,
    color: colors.successStrong,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: spacing.xs,
    borderRadius: 8,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: spacing.xs,
    borderRadius: 8,
  },
  testButton: {
    marginTop: spacing.md,
  },
  testingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  testingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  successContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  connectionSuccess: {
    ...typography.h3,
    color: colors.successStrong,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  errorContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  connectionError: {
    ...typography.h3,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  errorDetailText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sectionSpinner: {
    marginTop: spacing.md,
  },
  accountDetails: {
    marginTop: spacing.md,
  },
  accessibilityGrid: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  accessibilityOption: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  accessibilityEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  accessibilityLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  accessibilityDescription: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});

export default SettingsScreen;