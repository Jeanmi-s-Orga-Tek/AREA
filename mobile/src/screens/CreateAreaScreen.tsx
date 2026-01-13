import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, StarField} from '../components';
import {colors, spacing, typography} from '../theme';
import {
  fetchServices,
  fetchServiceCapabilities,
  ServiceActionSummary,
  ServiceReactionSummary,
  ServiceSummary,
} from '../api/services';
import {createArea} from '../api/areas';
import {RootStackParamList} from '../navigation/types';

interface ParameterDefinition {
  id: string;
  label: string;
  type: 'text' | 'number';
}

interface ActionOption extends ServiceActionSummary {
  parameterDefs: ParameterDefinition[];
}

interface ReactionOption extends ServiceReactionSummary {
  parameterDefs: ParameterDefinition[];
}

type CreateAreaScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateArea'>;
};

const formatLabel = (key: string): string => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const parseParameters = (params?: Record<string, any>): ParameterDefinition[] => {
  if (!params) {
    return [];
  }

  return Object.entries(params).map(([key, value]) => ({
    id: key,
    label: formatLabel(key),
    type: typeof value === 'number' ? 'number' : 'text',
  }));
};

export const CreateAreaScreen: React.FC<CreateAreaScreenProps> = ({navigation}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [error, setError] = useState('');
  const [capabilitiesLoadingId, setCapabilitiesLoadingId] = useState<number | null>(
    null,
  );
  const [actionOptions, setActionOptions] = useState<Record<number, ActionOption[]>>({});
  const [reactionOptions, setReactionOptions] = useState<Record<number, ReactionOption[]>>({});

  const [selectedActionService, setSelectedActionService] =
    useState<ServiceSummary | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionOption | null>(null);
  const [actionParameters, setActionParameters] = useState<Record<string, string>>({});

  const [selectedReactionService, setSelectedReactionService] =
    useState<ServiceSummary | null>(null);
  const [selectedReaction, setSelectedReaction] =
    useState<ReactionOption | null>(null);
  const [reactionParameters, setReactionParameters] = useState<Record<string, string>>({});

  const [areaName, setAreaName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      setError('');
      try {
        const data = await fetchServices();
        if (isMounted) {
          setServices(data);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to load services';
        setError(message);
      } finally {
        if (isMounted) {
          setServiceLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const ensureCapabilities = async (serviceId: number) => {
    if (actionOptions[serviceId] || reactionOptions[serviceId]) {
      return;
    }

    setCapabilitiesLoadingId(serviceId);
    setError('');
    try {
      const capabilities = await fetchServiceCapabilities(serviceId);
      setActionOptions(prev => ({
        ...prev,
        [serviceId]: capabilities.actions.map(action => ({
          ...action,
          parameterDefs: parseParameters(action.parameters),
        })),
      }));
      setReactionOptions(prev => ({
        ...prev,
        [serviceId]: capabilities.reactions.map(reaction => ({
          ...reaction,
          parameterDefs: parseParameters(reaction.parameters),
        })),
      }));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load service capabilities';
      setError(message);
    } finally {
      setCapabilitiesLoadingId(null);
    }
  };

  const handleSelectActionService = async (service: ServiceSummary) => {
    setSelectedActionService(service);
    setSelectedAction(null);
    setActionParameters({});
    await ensureCapabilities(service.id);
  };

  const handleSelectReactionService = async (service: ServiceSummary) => {
    setSelectedReactionService(service);
    setSelectedReaction(null);
    setReactionParameters({});
    await ensureCapabilities(service.id);
  };

  const hydrateParameters = (
    parameterDefs: ParameterDefinition[],
    defaults?: Record<string, any>,
  ): Record<string, string> => {
    const hydrated: Record<string, string> = {};
    parameterDefs.forEach(def => {
      const value = defaults?.[def.id];
      hydrated[def.id] =
        value === undefined || value === null ? '' : String(value);
    });
    return hydrated;
  };

  const handleSelectAction = (action: ActionOption) => {
    setSelectedAction(action);
    setActionParameters(hydrateParameters(action.parameterDefs, action.parameters));
  };

  const handleSelectReaction = (reaction: ReactionOption) => {
    setSelectedReaction(reaction);
    setReactionParameters(
      hydrateParameters(reaction.parameterDefs, reaction.parameters),
    );
  };

  const handleActionParameterChange = (id: string, value: string) => {
    setActionParameters(prev => ({...prev, [id]: value}));
  };

  const handleReactionParameterChange = (id: string, value: string) => {
    setReactionParameters(prev => ({...prev, [id]: value}));
  };

  const handleNextStep = () => {
    setCurrentStep(step => Math.min(step + 1, 5));
  };

  const handlePreviousStep = () => {
    setCurrentStep(step => Math.max(step - 1, 1));
  };

  const handleSubmit = async () => {
    if (
      !selectedActionService ||
      !selectedAction ||
      !selectedReactionService ||
      !selectedReaction
    ) {
      setError('Please complete all steps before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createArea({
        name: areaName.trim(),
        action_service_id: selectedActionService.id,
        action_id: selectedAction.id,
        action_parameters: actionParameters,
        reaction_service_id: selectedReactionService.id,
        reaction_id: selectedReaction.id,
        reaction_parameters: reactionParameters,
      });

      Alert.alert('AREA created', 'Your automation is now active.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Areas'),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to create AREA.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return Boolean(selectedActionService);
      case 2:
        return Boolean(selectedAction);
      case 3:
        return Boolean(selectedReactionService);
      case 4:
        return Boolean(selectedReaction);
      case 5:
        return areaName.trim().length > 0;
      default:
        return true;
    }
  };

  const renderServiceCard = (
    service: ServiceSummary,
    isSelected: boolean,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      key={service.id}
      style={[
        styles.serviceCard,
        isSelected && styles.serviceCardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Text style={styles.serviceIcon}>{service.icon || '⚙️'}</Text>
      <Text style={styles.serviceName} numberOfLines={1}>
        {service.display_name || service.name}
      </Text>
    </TouchableOpacity>
  );

  const currentActionOptions = selectedActionService
    ? actionOptions[selectedActionService.id]
    : undefined;
  const currentReactionOptions = selectedReactionService
    ? reactionOptions[selectedReactionService.id]
    : undefined;

  const loadingCapabilities = (serviceId: number | null) =>
    serviceId !== null && capabilitiesLoadingId === serviceId;

  return (
    <StarField padding={0}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <Text style={styles.title}>Créer une AREA</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {serviceLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Chargement des services…</Text>
            </View>
          ) : (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>Étape {currentStep} / 5</Text>

              {currentStep === 1 && (
                <>
                  <Text style={styles.stepTitle}>
                    Choisissez le service déclencheur
                  </Text>
                  <View style={styles.servicesGrid}>
                    {services.map(service =>
                      renderServiceCard(service, selectedActionService?.id === service.id, () =>
                        handleSelectActionService(service),
                      ),
                    )}
                  </View>
                </>
              )}

              {currentStep === 2 && selectedActionService && (
                <>
                  <Text style={styles.stepTitle}>
                    Sélectionnez une action dans {selectedActionService.display_name || selectedActionService.name}
                  </Text>
                  {loadingCapabilities(selectedActionService.id) && (
                    <ActivityIndicator color={colors.primary} />
                  )}
                  {!loadingCapabilities(selectedActionService.id) &&
                    (currentActionOptions?.length ? (
                      currentActionOptions.map(action => (
                        <TouchableOpacity
                          key={action.id}
                          style={[
                            styles.listCard,
                            selectedAction?.id === action.id && styles.listCardSelected,
                          ]}
                          onPress={() => handleSelectAction(action)}>
                          <Text style={styles.listCardTitle}>{action.name}</Text>
                          {action.description ? (
                            <Text style={styles.listCardDescription}>
                              {action.description}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.helperText}>
                        Aucune action disponible pour ce service.
                      </Text>
                    ))}

                  {selectedAction && selectedAction.parameterDefs.length > 0 && (
                    <View style={styles.parametersContainer}>
                      <Text style={styles.parametersTitle}>Configurer l&apos;action</Text>
                      {selectedAction.parameterDefs.map(param => (
                        <View key={param.id} style={styles.parameterField}>
                          <Text style={styles.parameterLabel}>{param.label}</Text>
                          <TextInput
                            style={styles.parameterInput}
                            placeholder={`Entrez ${param.label}`}
                            value={actionParameters[param.id] || ''}
                            onChangeText={value =>
                              handleActionParameterChange(param.id, value)
                            }
                            keyboardType={param.type === 'number' ? 'numeric' : 'default'}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              {currentStep === 3 && (
                <>
                  <Text style={styles.stepTitle}>
                    Choisissez le service récepteur
                  </Text>
                  <View style={styles.servicesGrid}>
                    {services.map(service =>
                      renderServiceCard(service, selectedReactionService?.id === service.id, () =>
                        handleSelectReactionService(service),
                      ),
                    )}
                  </View>
                </>
              )}

              {currentStep === 4 && selectedReactionService && (
                <>
                  <Text style={styles.stepTitle}>
                    Sélectionnez une réaction dans {selectedReactionService.display_name || selectedReactionService.name}
                  </Text>
                  {loadingCapabilities(selectedReactionService.id) && (
                    <ActivityIndicator color={colors.primary} />
                  )}
                  {!loadingCapabilities(selectedReactionService.id) &&
                    (currentReactionOptions?.length ? (
                      currentReactionOptions.map(reaction => (
                        <TouchableOpacity
                          key={reaction.id}
                          style={[
                            styles.listCard,
                            selectedReaction?.id === reaction.id && styles.listCardSelected,
                          ]}
                          onPress={() => handleSelectReaction(reaction)}>
                          <Text style={styles.listCardTitle}>{reaction.name}</Text>
                          {reaction.description ? (
                            <Text style={styles.listCardDescription}>
                              {reaction.description}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.helperText}>
                        Aucune réaction disponible pour ce service.
                      </Text>
                    ))}

                  {selectedReaction && selectedReaction.parameterDefs.length > 0 && (
                    <View style={styles.parametersContainer}>
                      <Text style={styles.parametersTitle}>Configurer la réaction</Text>
                      {selectedReaction.parameterDefs.map(param => (
                        <View key={param.id} style={styles.parameterField}>
                          <Text style={styles.parameterLabel}>{param.label}</Text>
                          <TextInput
                            style={styles.parameterInput}
                            placeholder={`Entrez ${param.label}`}
                            value={reactionParameters[param.id] || ''}
                            onChangeText={value =>
                              handleReactionParameterChange(param.id, value)
                            }
                            keyboardType={param.type === 'number' ? 'numeric' : 'default'}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              {currentStep === 5 && (
                <>
                  <Text style={styles.stepTitle}>Nommez votre AREA</Text>
                  <View style={styles.parameterField}>
                    <Text style={styles.parameterLabel}>Nom de l&apos;AREA</Text>
                    <TextInput
                      style={styles.parameterInput}
                      placeholder="ex : Issue GitHub → Message Discord"
                      value={areaName}
                      onChangeText={setAreaName}
                    />
                  </View>

                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Récapitulatif</Text>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryColumn}>
                        <Text style={styles.summaryLabel}>Action</Text>
                        <Text style={styles.summaryValue}>
                          {selectedActionService?.display_name ||
                            selectedActionService?.name ||
                            'Non défini'}
                        </Text>
                        <Text style={styles.summaryValueSecondary}>
                          {selectedAction?.name || 'Non défini'}
                        </Text>
                        {Object.keys(actionParameters).length > 0 && (
                          <View style={styles.summaryParams}>
                            {Object.entries(actionParameters).map(([key, value]) => (
                              <Text key={key} style={styles.summaryParamText}>
                                {formatLabel(key)}: {value || '—'}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                      <Text style={styles.summaryArrow}>→</Text>
                      <View style={styles.summaryColumn}>
                        <Text style={styles.summaryLabel}>Réaction</Text>
                        <Text style={styles.summaryValue}>
                          {selectedReactionService?.display_name ||
                            selectedReactionService?.name ||
                            'Non défini'}
                        </Text>
                        <Text style={styles.summaryValueSecondary}>
                          {selectedReaction?.name || 'Non défini'}
                        </Text>
                        {Object.keys(reactionParameters).length > 0 && (
                          <View style={styles.summaryParams}>
                            {Object.entries(reactionParameters).map(([key, value]) => (
                              <Text key={key} style={styles.summaryParamText}>
                                {formatLabel(key)}: {value || '—'}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Annuler"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.footerButton}
          />
          {currentStep > 1 && (
            <Button
              title="Retour"
              variant="secondary"
              onPress={handlePreviousStep}
              style={styles.footerButton}
            />
          )}
          {currentStep < 5 && (
            <Button
              title="Suivant"
              onPress={handleNextStep}
              disabled={!isStepValid(currentStep)}
              style={styles.footerButton}
            />
          )}
          {currentStep === 5 && (
            <Button
              title={submitting ? 'Création…' : 'Créer l’AREA'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={!isStepValid(5) || submitting}
              style={styles.footerButton}
            />
          )}
        </View>
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
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.error,
    ...typography.body,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: colors.error,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    borderRadius: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  stepContainer: {
    gap: spacing.lg,
  },
  stepLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepTitle: {
    ...typography.h3,
    color: colors.text,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  serviceCard: {
    width: '30%',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    shadowColor: colors.glow,
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  serviceIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  serviceName: {
    ...typography.bodySmall,
    color: colors.text,
    textAlign: 'center',
  },
  listCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  listCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
  },
  listCardTitle: {
    ...typography.h4,
    color: colors.text,
  },
  listCardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  parametersContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.md,
  },
  parametersTitle: {
    ...typography.h4,
    color: colors.text,
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
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  summaryColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    color: colors.text,
  },
  summaryValueSecondary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  summaryParams: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  summaryParamText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryArrow: {
    ...typography.h3,
    color: colors.accent,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  footerButton: {
    flexGrow: 1,
  },
});
