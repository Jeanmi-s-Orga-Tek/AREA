import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Button, Card} from '../components';
import {colors, spacing, typography} from '../theme';
import {getApiBaseUrl, setApiBaseUrl, clearApiBaseUrl} from '../api/storage';
import {fetchAbout, AboutResponse} from '../api/about';
import {fetchCurrentUser, CurrentUser} from '../api/user';
import {useAuth} from '../context/AuthContext';
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
          <Text style={styles.connectionSuccess}>Connected ✅</Text>
          <Text style={styles.infoText}>
            Services available: {aboutData.server.services.length}
          </Text>
          <Text style={styles.infoText}>
            Server time: {new Date(aboutData.server.current_time * 1000).toLocaleString()}
          </Text>
          <Text style={styles.infoText}>Client host: {aboutData.client.host}</Text>
        </View>
      );
    }

    if (connectionStatus === 'error') {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.connectionError}>Cannot reach server ❌</Text>
          <Text style={styles.errorDetailText}>{connectionError}</Text>
        </View>
      );
    }

    return null;
  };

  const renderAccountSection = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Account</Text>
      <Text style={styles.cardDescription}>
        Manage your AREA account and authentication
      </Text>
      {userLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.sectionSpinner} />
      ) : (
        <View style={styles.accountDetails}>
          <Text style={styles.infoText}>
            Name: {user?.name || user?.email || 'Unknown user'}
          </Text>
          <Text style={styles.infoText}>Email: {user?.email || 'N/A'}</Text>
          {userError ? <Text style={styles.errorText}>{userError}</Text> : null}
        </View>
      )}
      <Button title="Log out" variant="secondary" onPress={handleLogout} style={styles.cardButton} />
    </Card>
  );

  const renderAboutSection = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>About / Server info</Text>
      <Text style={styles.cardDescription}>
        Inspect the backend instance powering this client
      </Text>
      <Button
        title={connectionStatus === 'loading' ? 'Loading...' : 'View server info'}
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
      <Text style={styles.cardTitle}>Advanced</Text>
      <Text style={styles.cardDescription}>
        Troubleshoot by clearing local configuration and session data
      </Text>
      <Button
        title="Clear local data"
        variant="outline"
        onPress={handleClearLocalData}
        style={styles.cardButton}
      />
    </Card>
  );

  const showServerResultsInline = !isLoggedIn;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{isLoggedIn ? 'Settings' : 'Server settings'}</Text>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Server settings</Text>
          <Text style={styles.cardDescription}>
            {isLoggedIn
              ? 'Changing the server URL will disconnect your current session.'
              : 'Configure the API base URL before logging in.'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="http://10.0.2.2:8080"
            placeholderTextColor={colors.textSecondary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          {savedMessage ? (
            <Text style={styles.successText}>{savedMessage}</Text>
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Button title="Save" onPress={handleSave} style={styles.saveButton} />

          <Text style={styles.currentUrlText}>
            Current server: {currentUrl ? currentUrl : 'Not set'}
          </Text>

          {!isLoggedIn && (
            <Button
              title={connectionStatus === 'loading' ? 'Testing...' : 'Test connection'}
              onPress={handleFetchServerInfo}
              variant="outline"
              disabled={connectionStatus === 'loading' || !currentUrl}
              style={styles.testButton}
            />
          )}

          {!isLoggedIn && connectionStatus === 'loading' && (
            <View style={styles.testingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.testingText}>Testing connection...</Text>
            </View>
          )}

          {showServerResultsInline && renderServerStatus()}
        </Card>

        {isLoggedIn ? (
          <>
            {renderAccountSection()}
            {renderAboutSection()}
            {renderAdvancedSection()}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.success,
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.sm,
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
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  connectionSuccess: {
    ...typography.h3,
    color: colors.success,
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
    backgroundColor: colors.surface,
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
});
