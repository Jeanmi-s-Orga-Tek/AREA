import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Switch,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, Card, StarField} from '../components';
import {colors, spacing, typography} from '../theme';
import {useAuth} from '../context/AuthContext';
import {fetchAreas, toggleArea, deleteArea, AreaDetail} from '../api/areas';
import {RootStackParamList} from '../navigation/types';

type AreasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Areas'>;
};

export const AreasScreen: React.FC<AreasScreenProps> = ({navigation}) => {
  const {logout} = useAuth();
  const [areas, setAreas] = useState<AreaDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAreas = useCallback(async () => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAreas();
    }, [loadAreas]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAreas();
  }, [loadAreas]);

  const handleToggle = async (area: AreaDetail) => {
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

  const handleDelete = (area: AreaDetail) => {
    Alert.alert(
      'Supprimer cette AREA ?',
      `“${area.name || 'AREA'}” sera supprimée définitivement.`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteArea(area.id);
              setAreas(prev => prev.filter(a => a.id !== area.id));
            } catch (err) {
              setError(
                err instanceof Error ? err.message : 'Impossible de supprimer',
              );
            }
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login');
  };

  if (loading) {
    return (
      <StarField padding={0}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </StarField>
    );
  }

  const renderArea = ({item}: {item: AreaDetail}) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name || 'AREA sans nom'}</Text>
          <View style={styles.cardTags}>
            <View
              style={[
                styles.statusBadge,
                item.is_active
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive,
              ]}>
              <Text style={styles.statusBadgeText}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Text style={styles.cardMeta}>
              {item.action.service.display_name} →{' '}
              {item.reaction.service.display_name}
            </Text>
          </View>
          <Text style={styles.cardDescription}>
            {item.action.action.name} • {item.reaction.reaction.name}
          </Text>
        </View>
        <Switch
          value={item.is_active}
          onValueChange={() => handleToggle(item)}
          trackColor={{false: colors.borderMuted, true: colors.primary}}
          thumbColor={item.is_active ? colors.surface : colors.textSecondary}
        />
      </View>
      <View style={styles.cardActions}>
        <Button
          title="Supprimer"
          variant="danger"
          onPress={() => handleDelete(item)}
        />
      </View>
    </Card>
  );

  return (
    <StarField padding={0}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Mes AREAs</Text>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{areas.length || 0}</Text>
              <Text style={styles.statLabel}>total</Text>
            </View>
            <View style={[styles.statPill, styles.statPillSuccess]}>
              <Text style={styles.statValue}>
                {areas.filter(a => a.is_active).length}
              </Text>
              <Text style={styles.statLabel}>actives</Text>
            </View>
            <View style={[styles.statPill, styles.statPillMuted]}>
              <Text style={styles.statValue}>
                {areas.filter(a => !a.is_active).length}
              </Text>
              <Text style={styles.statLabel}>inactives</Text>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {areas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune AREA pour l’instant</Text>
            <Text style={styles.emptySubtext}>
              Créez votre première automatisation
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
            title="Créer une nouvelle AREA"
            variant="primary"
            onPress={() => navigation.navigate('CreateArea')}
            style={styles.button}
          />

          <Button
            title="Services"
            variant="outline"
            onPress={() => navigation.navigate('Services')}
            style={styles.button}
          />

          <Button
            title="Paramètres"
            variant="outline"
            onPress={() => navigation.navigate('Settings')}
            style={styles.button}
          />

          <Button
            title="Déconnexion"
            variant="danger"
            onPress={handleLogout}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    </StarField>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 0.32,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 14,
    elevation: 10,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 90,
  },
  statPillSuccess: {
    borderColor: colors.successStrong,
  },
  statPillMuted: {
    borderColor: colors.borderMuted,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    borderWidth: 1,
    borderColor: colors.error,
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
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  button: {},
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeActive: {
    borderColor: colors.successStrong,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeInactive: {
    borderColor: colors.borderMuted,
    backgroundColor: colors.surfaceMuted,
  },
  statusBadgeText: {
    ...typography.caption,
    color: colors.text,
  },
  cardActions: {
    marginTop: spacing.md,
  },
});
