import React from 'react';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  LoginScreen,
  RegisterScreen,
  AreasScreen,
  CreateAreaScreen,
  EditAreaScreen,
  SettingsScreen,
  ServicesScreen,
} from '../screens';
import {useAuth} from '../context/AuthContext';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import {colors, spacing, typography} from '../theme';
import {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const sharedScreenOptions = {
  headerStyle: {backgroundColor: colors.card},
  headerTintColor: colors.text,
  headerShadowVisible: false,
  headerTitleStyle: {...typography.h4, color: colors.text},
  contentStyle: {backgroundColor: 'transparent'},
};

export const RootNavigator: React.FC = () => {
  const {isLoggedIn, isLoading} = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {isLoggedIn ? (
        <Stack.Navigator initialRouteName="Areas" screenOptions={sharedScreenOptions}>
          <Stack.Screen
            name="Areas"
            component={AreasScreen}
            options={({navigation}) => ({
              headerTitle: 'Mes AREAs',
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Settings')}
                  style={styles.headerButton}>
                  <Text style={styles.headerButtonText}>Paramètres</Text>
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="CreateArea"
            component={CreateAreaScreen}
            options={{title: 'Créer une AREA'}}
          />
          <Stack.Screen
            name="EditArea"
            component={EditAreaScreen}
            options={{title: "Modifier l'AREA"}}
          />
          <Stack.Screen
            name="Services"
            component={ServicesScreen}
            options={{title: 'Services'}}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: 'Paramètres'}}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator initialRouteName="Login" screenOptions={sharedScreenOptions}>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: 'Paramètres serveur'}}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
});
