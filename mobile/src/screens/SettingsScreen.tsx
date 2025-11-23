import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, Card} from '../components';
import {colors, spacing, typography} from '../theme';
import {getApiBaseUrl, setApiBaseUrl} from '../api/storage';

type RootStackParamList = {
  Login: undefined;
  Areas: undefined;
  Settings: undefined;
};

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({navigation}) => {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadUrl();
  }, []);

  const loadUrl = async () => {
    const storedUrl = await getApiBaseUrl();
    if (storedUrl) {
      setUrl(storedUrl);
      setCurrentUrl(storedUrl);
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Server Settings</Text>
          <Text style={styles.cardDescription}>
            Configure the API server URL
          </Text>

          <TextInput
            style={styles.input}
            placeholder="http://10.0.2.2:80"
            placeholderTextColor={colors.textSecondary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          {savedMessage ? (
            <Text style={styles.successText}>{savedMessage}</Text>
          ) : null}

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <Button
            title="Save"
            onPress={handleSave}
            style={styles.saveButton}
          />

          {currentUrl ? (
            <Text style={styles.currentUrlText}>
              Current server: {currentUrl}
            </Text>
          ) : (
            <Text style={styles.currentUrlText}>
              Current server: Not set
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Text style={styles.cardDescription}>
            Manage your account settings and preferences
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <Text style={styles.cardDescription}>
            Configure how you want to be notified
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Connected Services</Text>
          <Text style={styles.cardDescription}>
            Manage your connected apps and services
          </Text>
        </Card>

        <Button
          title="Back to Areas"
          variant="outline"
          onPress={() => navigation.navigate('Areas')}
          style={styles.button}
        />

        <Button
          title="Logout"
          variant="secondary"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
        />
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
  button: {
    marginBottom: spacing.md,
  },
});
