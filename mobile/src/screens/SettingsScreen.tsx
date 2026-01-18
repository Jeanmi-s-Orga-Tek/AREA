/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** SettingsScreen
*/

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, Card, LanguageToggle, StarField} from '../components';
import {colors, spacing, typography} from '../theme';
import {getApiBaseUrl, setApiBaseUrl, clearApiBaseUrl} from '../api/storage';
import {fetchAbout, AboutResponse} from '../api/about';
import {fetchCurrentUser, CurrentUser} from '../api/user';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
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
  const {t, language} = useLanguage();

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
        error instanceof Error ? error.message : t('settings.account.error'),
      );
    } finally {
      setUserLoading(false);
    }
  }, [isLoggedIn, t]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleSave = async () => {
    setErrorMessage('');
    setSavedMessage('');

    if (!url.trim()) {
      setErrorMessage(t('settings.server_config.url_empty'));
      return;
    }

    try {
      await setApiBaseUrl(url.trim());
      setCurrentUrl(url.trim());
      setSavedMessage(t('settings.server_config.save_success'));
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setErrorMessage(t('settings.server_config.save_error'));
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
        error instanceof Error
          ? error.message
          : t('settings.server_info.error_fallback'),
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
      Alert.alert(
        t('settings.alert.clear.title'),
        t('settings.alert.clear.message'),
      );
    } catch (error) {
      Alert.alert(
        t('settings.alert.clear.error.title'),
        error instanceof Error
          ? error.message
          : t('settings.alert.clear.error.message'),
      );
    }
  };

  const renderServerStatus = () => {
    if (connectionStatus === 'success' && aboutData) {
      return (
        <View style={styles.successContainer}>
          <Text style={styles.connectionSuccess}>
            {t('settings.server_info.connected')}
          </Text>
          <Text style={styles.infoText}>
            {t('settings.server_info.available_services', {
              count: aboutData.server.services.length,
            })}
          </Text>
          <Text style={styles.infoText}>
            {t('settings.server_info.server_time', {
              time: new Date(
                aboutData.server.current_time * 1000,
              ).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US'),
            })}
          </Text>
          <Text style={styles.infoText}>
            {t('settings.server_info.client', {host: aboutData.client.host})}
          </Text>
        </View>
      );
    }

    if (connectionStatus === 'error') {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.connectionError}>
            {t('settings.server_info.unreachable')}
          </Text>
          <Text style={styles.errorDetailText}>{connectionError}</Text>
        </View>
      );
    }

    return null;
  };

  const renderAccountSection = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>{t('settings.account.title')}</Text>
      <Text style={styles.cardDescription}>
        {t('settings.account.description')}
      </Text>
      {userLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.sectionSpinner} />
      ) : (
        <View style={styles.accountDetails}>
          <Text style={styles.infoText}>
            {t('settings.account.name_label', {
              name:
                user?.name ||
                user?.email ||
                t('settings.account.unknown_user'),
            })}
          </Text>
          <Text style={styles.infoText}>
            {t('settings.account.email_label', {
              email: user?.email || t('common.na'),
            })}
          </Text>
          {userError ? <Text style={styles.errorText}>{userError}</Text> : null}
        </View>
      )}
      <Button
        title={t('settings.account.logout')}
        variant="danger"
        onPress={handleLogout}
        style={styles.cardButton}
      />
    </Card>
  );

  const renderAboutSection = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>{t('settings.server_info.title')}</Text>
      <Text style={styles.cardDescription}>
        {t('settings.server_info.description')}
      </Text>
      <Button
        title={
          connectionStatus === 'loading'
            ? t('settings.server_info.button.loading')
            : t('settings.server_info.button.view')
        }
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
      <Text style={styles.cardTitle}>{t('settings.advanced.title')}</Text>
      <Text style={styles.cardDescription}>
        {t('settings.advanced.description')}
      </Text>
      <Button
        title={t('settings.advanced.clear')}
        variant="outline"
        onPress={handleClearLocalData}
        style={styles.cardButton}
      />
    </Card>
  );

  const showServerResultsInline = !isLoggedIn;

  return (
    <StarField padding={0}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {isLoggedIn
              ? t('settings.title.logged_in')
              : t('settings.title.logged_out')}
          </Text>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{t('language.title')}</Text>
            <Text style={styles.cardDescription}>
              {t('language.description')}
            </Text>
            <LanguageToggle compact style={styles.languageToggle} />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>
              {t('settings.server_config.title')}
            </Text>
            <Text style={styles.cardDescription}>
              {isLoggedIn
                ? t('settings.server_config.description.logged_in')
                : t('settings.server_config.description.logged_out')}
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

            <Button
              title={t('settings.server_config.save')}
              onPress={handleSave}
              style={styles.saveButton}
            />

            <Text style={styles.currentUrlText}>
              {t('settings.server_config.current_url', {
                url: currentUrl
                  ? currentUrl
                  : t('settings.server_config.current_url.none'),
              })}
            </Text>

            {!isLoggedIn && (
              <Button
                title={
                  connectionStatus === 'loading'
                    ? t('settings.server_config.testing')
                    : t('settings.server_config.test')
                }
                onPress={handleFetchServerInfo}
                variant="outline"
                disabled={connectionStatus === 'loading' || !currentUrl}
                style={styles.testButton}
              />
            )}

            {!isLoggedIn && connectionStatus === 'loading' && (
              <View style={styles.testingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.testingText}>
                  {t('settings.server_config.testing_inline')}
                </Text>
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
  languageToggle: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: colors.surfaceMuted,
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
});
