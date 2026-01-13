import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, StarField} from '../components';
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

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [providerLoading, setProviderLoading] = useState(false);
  const [isFetchingProviders, setIsFetchingProviders] = useState(true);
  const {login: setAuthLogin} = useAuth();

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
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login({username: email, password});

    if (result.success) {
      setAuthLogin(result.token || email);
    } else {
      setError(result.error || 'Login failed');
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
        err instanceof Error
          ? err.message
          : 'Unable to start OAuth authentication.';
      setError(message);
    } finally {
      setProviderLoading(false);
    }
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
                <Text style={styles.title}>Connexion</Text>
                <Text style={styles.subtitle}>
                  Retrouvez l&apos;ambiance du tableau de bord web avec un fond étoilé et des cartes glassmorphiques.
                </Text>
              </View>

              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
                {error ? <Text style={styles.errorBox}>{error}</Text> : null}
                <Button
                  title={loading ? 'Connexion en cours...' : 'Se connecter'}
                  onPress={handleLogin}
                  style={styles.button}
                  disabled={loading}
                />
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>OU</Text>
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
                      <Text style={styles.oauthButtonText}>
                        {provider.icon} Se connecter avec {provider.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.oauthFallback}>
                    Aucun fournisseur OAuth disponible.
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
                  Pas encore de compte ? Créez-en un
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsLink}
                onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.settingsLinkText}>Paramètres serveur</Text>
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
