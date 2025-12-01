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
import {Button} from '../components';
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to AREA</Text>
          <Text style={styles.subtitle}>Connect your apps and automate</Text>

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
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              title={loading ? 'Signing in...' : 'Sign in'}
              onPress={handleLogin}
              style={styles.button}
              disabled={loading}
            />
            {loading && <ActivityIndicator color={colors.primary} />}
          </View>

          <View style={styles.oauthSection}>
            <Text style={styles.orLabel}>Or continue with</Text>
            {isFetchingProviders ? (
              <ActivityIndicator color={colors.primary} />
            ) : oauthProviders.length ? (
              oauthProviders.map(provider => (
                <TouchableOpacity
                  key={provider.id}
                  style={[styles.oauthButton, {borderColor: provider.color}]}
                  disabled={providerLoading}
                  onPress={() => handleOAuthLogin(provider.id)}>
                  <Text style={styles.oauthButtonText}>
                    {provider.icon} Continue with {provider.name}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.oauthFallback}>
                No OAuth providers are currently available.
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
            style={styles.settingsLink}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsLinkText}>Server settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkContainer}
            disabled={loading}
            onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Need an account? Create one</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.md,
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
  },
  button: {
    marginTop: spacing.md,
  },
  error: {
    color: colors.error,
    ...typography.body,
    textAlign: 'center',
  },
  oauthSection: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  orLabel: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  oauthButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
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
  settingsLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  settingsLinkText: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    ...typography.bodySmall,
  },
  linkContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    ...typography.body,
  },
});
