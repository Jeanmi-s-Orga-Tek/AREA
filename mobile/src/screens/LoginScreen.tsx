/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** LoginScreen
*/

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SvgUri, SvgXml} from 'react-native-svg';
import {Button, LanguageToggle, StarField} from '../components';
import {colors, spacing, typography} from '../theme';
import {
  createOAuthState,
  fetchOAuthProviders,
  getOAuthAuthorizationUrl,
  login,
  OAuthProvider,
  recordPendingOAuthState,
} from '../api/auth';
import {useAuth} from '../context/AuthContext';
import {RootStackParamList} from '../navigation/types';
import {useLanguage} from '../context/LanguageContext';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const {t} = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [providerLoading, setProviderLoading] = useState(false);
  const [isFetchingProviders, setIsFetchingProviders] = useState(true);
  const [svgFailures, setSvgFailures] = useState<Record<string, boolean>>({});
  const {login: setAuthLogin} = useAuth();

  const svgFallbacks: Record<string, string> = {
    google: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/google.svg',
    microsoft: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/microsoft.svg',
    github: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg',
    spotify: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/spotify.svg',
  };

  useEffect(() => {
    let isMounted = true;
    const loadProviders = async () => {
      try {
        const providers = await fetchOAuthProviders();
        if (isMounted) {
          setOauthProviders(providers);
        }
      } catch (err) {
        console.error('Unable to fetch OAuth providers', err);
      } finally {
        if (isMounted) {
          setIsFetchingProviders(false);
        }
      }
    };

    loadProviders();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('login.error.missing_fields'));
      return;
    }

    setLoading(true);
    setError('');

    const result = await login({username: email, password});

    if (result.success) {
      setAuthLogin(result.token || email);
    } else {
      setError(result.error || t('login.error.failed'));
    }

    setLoading(false);
  };

  const handleOAuthLogin = async (providerId: string) => {
    setError('');
    setProviderLoading(true);
    try {
      const state = createOAuthState(providerId);
      recordPendingOAuthState(state);
      const authUrl = await getOAuthAuthorizationUrl(providerId, state);
      await Linking.openURL(authUrl);
    } catch (err) {
      console.error(`OAuth start failed for ${providerId}`, err);
      const message =
        err instanceof Error ? err.message : t('login.error.oauth_start');
      setError(message);
    } finally {
      setProviderLoading(false);
    }
  };

  const renderProviderIcon = (provider: OAuthProvider) => {
    const icon = provider.icon;
    const initial = (provider.name?.[0] || '•').toUpperCase();
    const key = (provider.id || provider.name || '').toLowerCase();
    const fallbackUri = svgFallbacks[key];

    const renderFallback = () => {
      if (fallbackUri) {
        if (svgFailures[fallbackUri]) {
          return <Text style={styles.oauthIcon}>{initial}</Text>;
        }
        return (
          <View style={styles.svgWrapper}>
            <SvgUri
              width={28}
              height={28}
              uri={fallbackUri}
              onError={() =>
                setSvgFailures(prev => ({
                  ...prev,
                  [fallbackUri]: true,
                }))
              }
            />
          </View>
        );
      }
      return <Text style={styles.oauthIcon}>{initial}</Text>;
    };

    const handleSvgError = () =>
      setSvgFailures(prev => ({
        ...prev,
        [icon || key]: true,
      }));

    if (!icon) {
      return renderFallback();
    }

    if (/^\s*<svg/i.test(icon)) {
      if (svgFailures[icon]) {
        return renderFallback();
      }
      return (
        <View style={styles.svgWrapper}>
          <SvgXml xml={icon} width={28} height={28} onError={handleSvgError} />
        </View>
      );
    }

    if (/^https?:\/\//i.test(icon)) {
      if (/\.svg(\?|$)/i.test(icon)) {
        if (svgFailures[icon]) {
          return renderFallback();
        }
        return (
          <View style={styles.svgWrapper}>
            <SvgUri
              width={28}
              height={28}
              uri={icon}
              onError={handleSvgError}
            />
          </View>
        );
      }
      return (
        <Image
          source={{uri: icon}}
          style={styles.oauthImage}
          resizeMode="contain"
        />
      );
    }

    return renderFallback();
  };

  return (
    <StarField>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>{t('login.title')}</Text>
                <LanguageToggle compact style={styles.languageToggle} />
              </View>

              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder={t('login.email.placeholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('login.password.placeholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
                {error ? <Text style={styles.errorBox}>{error}</Text> : null}
                <Button
                  title={
                    loading ? t('login.button.loading') : t('login.button')
                  }
                  onPress={handleLogin}
                  style={styles.button}
                  disabled={loading}
                />
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>
                  {t('login.oauth.divider')}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.oauthSection}>
                {isFetchingProviders ? (
                  <ActivityIndicator color={colors.primary} />
                ) : oauthProviders.length ? (
                  oauthProviders.map(provider => (
                    <TouchableOpacity
                      key={provider.id}
                      style={[
                        styles.oauthButton,
                        {borderLeftColor: provider.color || colors.primary},
                      ]}
                      disabled={providerLoading}
                      onPress={() => handleOAuthLogin(provider.id)}>
                      <View style={styles.oauthButtonContent}>
                        {renderProviderIcon(provider)}
                        <Text style={styles.oauthButtonText}>
                          {t('login.oauth.with_provider', {
                            provider: provider.name || provider.id,
                          })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.oauthFallback}>
                    {t('login.oauth.none')}
                  </Text>
                )}
                {providerLoading && (
                  <ActivityIndicator
                    color={colors.primary}
                    style={styles.oauthSpinner}
                  />
                )}
              </View>

              <TouchableOpacity
                style={styles.linkContainer}
                disabled={loading}
                onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>
                  {t('login.link.register')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsLink}
                onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.settingsLinkText}>
                  {t('login.link.settings')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </StarField>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  header: {
    marginBottom: spacing.lg,
  },
  languageToggle: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
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
  },
  button: {
    marginTop: spacing.md,
  },
  errorBox: {
    color: colors.error,
    ...typography.bodySmall,
    textAlign: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: colors.error,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  oauthSection: {
    gap: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  oauthButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  oauthButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  oauthImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  svgWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthIcon: {
    fontSize: 22,
  },
  oauthButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  oauthIcon: {
    width: 20,
    height: 20,
  },
  oauthButtonText: {
    ...typography.body,
    color: colors.text,
  },
  oauthFallback: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  oauthSpinner: {
    marginTop: spacing.sm,
  },
  linkContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    ...typography.body,
  },
  settingsLink: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  settingsLinkText: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    ...typography.bodySmall,
  },
});
