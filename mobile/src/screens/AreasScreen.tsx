import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Switch,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, Card} from '../components';
import {colors, spacing, typography} from '../theme';
import {useAuth} from '../context/AuthContext';
import {fetchAreas, toggleArea, AreaRead} from '../api/areas';
import {RootStackParamList} from '../navigation/types';

type AreasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Areas'>;
};

export const AreasScreen: React.FC<AreasScreenProps> = ({navigation}) => {
  const {logout} = useAuth();
  const [areas, setAreas] = useState<AreaRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAreas = async () => {
    try {
      setError('');
      const data = await fetchAreas();
      setAreas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load areas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAreas();
  }, []);

  const handleToggle = async (area: AreaRead) => {
    const previousState = area.is_active;
    setAreas(prev =>
      prev.map(a => (a.id === area.id ? {...a, is_active: !a.is_active} : a)),
    );

    try {
      await toggleArea(area.id);
    } catch (err) {
      setAreas(prev =>
        prev.map(a => (a.id === area.id ? {...a, is_active: previousState} : a)),
      );
      setError(err instanceof Error ? err.message : 'Toggle failed');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderArea = ({item}: {item: AreaRead}) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            Action #{item.action_id} → Reaction #{item.reaction_id}
          </Text>
          <Text style={styles.cardDescription}>
            Service {item.action_service_id} → Service{' '}
            {item.reaction_service_id}
          </Text>
        </View>
        <Switch
          value={item.is_active}
          onValueChange={() => handleToggle(item)}
          trackColor={{false: colors.border, true: colors.primary}}
          thumbColor={item.is_active ? colors.surface : colors.textSecondary}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {areas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No AREAs yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first automation
          </Text>
        </View>
      ) : (
        <FlatList
          data={areas}
          renderItem={renderArea}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      <View style={styles.footer}>
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    ...typography.h2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.error + '20',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  button: {},
});
