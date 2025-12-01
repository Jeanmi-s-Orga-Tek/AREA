import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  DeviceEventEmitter,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button} from '../components';
import {colors, spacing, typography} from '../theme';
import {
  fetchServices,
  fetchConnectedServices,
  disconnectService,
  SERVICE_OAUTH_EVENT,
  type ServiceSummary,
  type ServiceAccountSummary,
} from '../api/services';
import {
  createOAuthState,
  getOAuthAuthorizationUrl,
  recordPendingOAuthState,
} from '../api/auth';
import {RootStackParamList} from '../navigation/types';

interface ServiceListItem {
  id: number;
  keyName: string;
  displayName: string;
  description: string;
  icon?: string;
  color?: string;
  oauthProvider?: string;
  isConnected: boolean;
  remoteEmail?: string;
}

export const ServicesScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>(
    {},
  );

  const mapServices = useCallback(
    (
      available: ServiceSummary[],
      connected: ServiceAccountSummary[],
    ): ServiceListItem[] => {
      const connectedMap = new Map<number, ServiceAccountSummary>();
      connected
        .filter(sa => sa.is_active && sa.service)
        .forEach(sa => connectedMap.set(sa.service.id, sa));

      return available.map(service => {
        const connection = connectedMap.get(service.id);
        return {
          id: service.id,
          keyName: service.name,
          displayName: service.display_name || service.name,
          description:
            service.description || `Connect ${service.display_name} to AREA`,
          icon: service.icon,
          color: service.color || colors.primary,
          oauthProvider: service.oauth_provider,
          isConnected: Boolean(connection),
          remoteEmail: connection?.remote_email,
        };
      });
    },
    [],
  );

  const loadData = useCallback(async (options?: {showSpinner?: boolean}) => {
    const showSpinner = options?.showSpinner ?? true;
    try {
      if (showSpinner) {
        setLoading(true);
      }
      setError(null);
      const [available, connected] = await Promise.all([
        fetchServices(),
        fetchConnectedServices(),
      ]);
      setServices(mapServices(available, connected));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load services.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [mapServices]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      SERVICE_OAUTH_EVENT,
      payload => {
        if (payload?.success) {
          setError(null);
          loadData({showSpinner: false});
        } else if (payload?.error) {
          setError(payload.error);
        }
      },
    );
    return () => subscription.remove();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData({showSpinner: false});
    setRefreshing(false);
  }, [loadData]);

  const handleConnect = useCallback(
    async (service: ServiceListItem) => {
      if (!service.oauthProvider) {
        Alert.alert(
          'Unavailable',
          'This service is not configured for OAuth connections yet.',
        );
        return;
      }

      try {
        setActionLoading(prev => ({...prev, [service.id]: true}));
        const state = createOAuthState(service.oauthProvider, {
          mode: 'service',
          serviceName: service.keyName,
        });
        recordPendingOAuthState(state);
        const authUrl = await getOAuthAuthorizationUrl(
          service.oauthProvider,
          state,
        );
        await Linking.openURL(authUrl);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to start OAuth connection.';
        Alert.alert('Service connection', message);
      } finally {
        setActionLoading(prev => ({...prev, [service.id]: false}));
      }
    },
    [],
  );

  const handleDisconnect = useCallback(async (service: ServiceListItem) => {
    try {
      setActionLoading(prev => ({...prev, [service.id]: true}));
      await disconnectService(service.id);
      await loadData({showSpinner: false});
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to disconnect service.';
      Alert.alert('Service connection', message);
    } finally {
      setActionLoading(prev => ({...prev, [service.id]: false}));
    }
  }, [loadData]);

  const connectedCount = useMemo(
    () => services.filter(service => service.isConnected).length,
    [services],
  );

  const renderItem = ({item}: {item: ServiceListItem}) => {
    const isProcessing = Boolean(actionLoading[item.id]);
    return (
      <View
        style={[styles.card, item.isConnected && styles.cardConnected]}
        key={item.id}>
        <View style={styles.cardHeader}>
          <Text style={styles.serviceIcon}>{item.icon || '🔗'}</Text>
          {item.isConnected && (
            <View style={styles.badge}> 
              <Text style={styles.badgeText}>Connected</Text>
            </View>
          )}
        </View>
        <Text style={styles.serviceName}>{item.displayName}</Text>
        <Text style={styles.serviceDescription}>{item.description}</Text>
        {item.remoteEmail && (
          <Text style={styles.serviceMeta}>Account: {item.remoteEmail}</Text>
        )}
        <Button
          title={item.isConnected ? 'Disconnect' : 'Connect'}
          variant={item.isConnected ? 'outline' : 'primary'}
          loading={isProcessing}
          style={styles.cardAction}
          onPress={() =>
            item.isConnected ? handleDisconnect(item) : handleConnect(item)
          }
        />
      </View>
    );
  };

  if (loading && !refreshing && services.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading services...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>&lt; Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.subtitle}>
          {connectedCount} / {services.length} services connected
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
      <FlatList
        data={services}
        keyExtractor={item => `${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={
          services.length ? styles.listContent : styles.emptyContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No services available yet. Pull down to refresh.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backLink: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
    marginBottom: spacing.md,
  },
  cardConnected: {
    borderWidth: 1,
    borderColor: colors.success,
  },
  cardAction: {
    marginTop: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 28,
  },
  badge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  badgeText: {
    ...typography.caption,
    color: colors.background,
  },
  serviceName: {
    ...typography.h2,
    color: colors.text,
  },
  serviceDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  serviceMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default ServicesScreen;
