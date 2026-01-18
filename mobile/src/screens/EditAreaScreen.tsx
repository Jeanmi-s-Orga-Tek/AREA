/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** EditAreaScreen
*/

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {Button, Card, StarField} from '../components';
import {colors, spacing, typography} from '../theme';
import {fetchAreaById, updateArea, AreaDetail} from '../api/areas';
import {RootStackParamList} from '../navigation/types';

type EditAreaScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditArea'>;
  route: RouteProp<RootStackParamList, 'EditArea'>;
};

const formatLabel = (key: string): string =>
  key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const normalizeParams = (
  params?: Record<string, any>,
): Record<string, string> => {
  const normalized: Record<string, string> = {};
  if (!params) {
    return normalized;
  }
  Object.entries(params).forEach(([key, value]) => {
    normalized[key] = value === undefined || value === null ? '' : String(value);
  });
  return normalized;
};

export const EditAreaScreen: React.FC<EditAreaScreenProps> = ({
  navigation,
  route,
}) => {
  const {areaId} = route.params;
  const [area, setArea] = useState<AreaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [areaName, setAreaName] = useState('');
  const [actionParameters, setActionParameters] = useState<Record<string, string>>(
    {},
  );
  const [reactionParameters, setReactionParameters] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    let isMounted = true;
    const loadArea = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAreaById(areaId);
        if (!isMounted) {
          return;
        }
        setArea(data);
        setAreaName(data.name || '');
        setActionParameters(normalizeParams(data.action_parameters));
        setReactionParameters(normalizeParams(data.reaction_parameters));
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger l'AREA",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadArea();

    return () => {
      isMounted = false;
    };
  }, [areaId]);

  const handleSave = async () => {
    if (!areaName.trim()) {
      Alert.alert(
        'Nom requis',
        "Veuillez saisir un nom pour cette AREA avant d'enregistrer.",
      );
      return;
    }

    setSaving(true);
    setError('');
    try {
      const updated = await updateArea(areaId, {
        name: areaName.trim(),
        action_parameters: actionParameters,
        reaction_parameters: reactionParameters,
      });
      setArea(updated);
      Alert.alert('AREA mise à jour', 'Votre AREA a été mise à jour.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer les modifications.",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderParameterFields = (
    parameters: Record<string, any> | undefined,
    values: Record<string, string>,
    onChange: (key: string, value: string) => void,
  ) => {
    const entries = Object.entries(parameters || {});
    if (!entries.length) {
      return <Text style={styles.parameterEmpty}>Aucun paramètre.</Text>;
    }

    return entries.map(([key]) => (
      <View key={key} style={styles.parameterField}>
        <Text style={styles.parameterLabel}>{formatLabel(key)}</Text>
        <TextInput
          style={styles.parameterInput}
          value={values[key] ?? ''}
          onChangeText={value => onChange(key, value)}
          placeholder={`Entrez ${formatLabel(key)}`}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    ));
  };

  if (loading) {
    return (
      <StarField padding={0}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement de l'AREA...</Text>
          </View>
        </SafeAreaView>
      </StarField>
    );
  }

  if (!area) {
    return (
      <StarField padding={0}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>
              {error || "Impossible d'afficher l'AREA."}
            </Text>
            <Button
              title="Retour"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
          </View>
        </SafeAreaView>
      </StarField>
    );
  }

  return (
    <StarField padding={0}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <Text style={styles.title}>Modifier l'AREA</Text>
            <Text style={styles.subtitle}>
              {area.action.service.display_name} →{' '}
              {area.reaction.service.display_name}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Nom de l'AREA</Text>
            <TextInput
              style={styles.nameInput}
              value={areaName}
              onChangeText={setAreaName}
              placeholder="Nom de votre AREA"
              placeholderTextColor={colors.textSecondary}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Action</Text>
            <Text style={styles.sectionMeta}>
              {area.action.service.display_name}
            </Text>
            <Text style={styles.sectionMeta}>{area.action.action.name}</Text>
            {area.action.action.description ? (
              <Text style={styles.sectionDescription}>
                {area.action.action.description}
              </Text>
            ) : null}
            <View style={styles.parametersContainer}>
              {renderParameterFields(
                area.action_parameters,
                actionParameters,
                (key, value) =>
                  setActionParameters(prev => ({...prev, [key]: value})),
              )}
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Réaction</Text>
            <Text style={styles.sectionMeta}>
              {area.reaction.service.display_name}
            </Text>
            <Text style={styles.sectionMeta}>
              {area.reaction.reaction.name}
            </Text>
            {area.reaction.reaction.description ? (
              <Text style={styles.sectionDescription}>
                {area.reaction.reaction.description}
              </Text>
            ) : null}
            <View style={styles.parametersContainer}>
              {renderParameterFields(
                area.reaction_parameters,
                reactionParameters,
                (key, value) =>
                  setReactionParameters(prev => ({...prev, [key]: value})),
              )}
            </View>
          </Card>

          <View style={styles.footer}>
            <Button
              title={saving ? 'Enregistrement...' : 'Enregistrer'}
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.footerButton}
            />
            <Button
              title="Annuler"
              variant="outline"
              onPress={() => navigation.goBack()}
              disabled={saving}
              style={styles.footerButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </StarField>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sectionDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  parametersContainer: {
    marginTop: spacing.md,
  },
  parameterField: {
    marginBottom: spacing.md,
  },
  parameterLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  parameterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
  },
  parameterEmpty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerButton: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.error + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  backButton: {
    marginTop: spacing.md,
  },
});
