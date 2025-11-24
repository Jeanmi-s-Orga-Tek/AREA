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
import {useAuth} from '../context/AuthContext';

type RootStackParamList = {
  Login: undefined;
  Areas: undefined;
  Settings: undefined;
};

type AreasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Areas'>;
};

export const AreasScreen: React.FC<AreasScreenProps> = ({navigation}) => {
  const {logout} = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>My AREAs</Text>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Email to SMS</Text>
          <Text style={styles.cardDescription}>
            Automatically send SMS when you receive important emails
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          </View>
        </Card>

        <Button
          title="Create New AREA"
          variant="primary"
          onPress={() => {}}
          style={styles.button}
        />

        <Button
          title="Go to Settings"
          variant="outline"
          onPress={() => navigation.navigate('Settings')}
          style={styles.button}
        />

        <Button
          title="Logout"
          variant="secondary"
          onPress={handleLogout}
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
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  badge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeText: {
    ...typography.bodySmall,
    color: colors.background,
    fontWeight: '600',
  },
  button: {
    marginBottom: spacing.md,
  },
});
