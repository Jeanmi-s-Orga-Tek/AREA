import React, {useState} from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, StarField} from '../components';
import {colors, spacing, typography} from '../theme';
import {register as registerUser} from '../api/auth';
import {useAuth} from '../context/AuthContext';
import {RootStackParamList} from '../navigation/types';

interface RegisterScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {login: authenticate} = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await registerUser({
      email,
      new_password: password,
      name,
    });

    if (result.success) {
      if (result.token) {
        authenticate(result.token);
      } else {
        setSuccess('Account created. Please log in.');
        Alert.alert('Account created', 'Please log in with your new credentials.');
        navigation.navigate('Login');
      }
    } else {
      setError(result.error || 'Registration failed');
    }

    setLoading(false);
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
                <Text style={styles.title}>Créer un compte</Text>
                <Text style={styles.subtitle}>
                  Même esthétique que le web : fond nocturne, cartes vitrées et actions colorées.
                </Text>
              </View>

              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Nom complet"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
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
                <TextInput
                  style={styles.input}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!loading}
                />
                {error ? <Text style={styles.errorBox}>{error}</Text> : null}
                {success ? <Text style={styles.successBox}>{success}</Text> : null}
                <Button
                  title={loading ? 'Création en cours...' : 'Créer mon compte'}
                  onPress={handleRegister}
                  style={styles.button}
                  disabled={loading}
                />
                {loading && <ActivityIndicator color={colors.primary} />}
              </View>

              <TouchableOpacity
                style={styles.linkContainer}
                disabled={loading}
                onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Déjà inscrit ? Se connecter</Text>
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
    maxWidth: 480,
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
  successBox: {
    color: colors.successStrong,
    ...typography.bodySmall,
    textAlign: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: colors.successStrong,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
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
