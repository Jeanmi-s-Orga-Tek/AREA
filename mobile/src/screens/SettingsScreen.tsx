import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, Card} from '../components';
import {colors, spacing, typography} from '../theme';

type RootStackParamList = {
  Login: undefined;
  Areas: undefined;
  Settings: undefined;
};

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({navigation}) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

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
  button: {
    marginBottom: spacing.md,
  },
});
