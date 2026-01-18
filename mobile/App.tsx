import React, {useCallback, useEffect, useRef} from 'react';
import {
  Alert,
  DeviceEventEmitter,
  Linking,
  StatusBar,
} from 'react-native';
import {RootNavigator} from './src/navigation';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {AccessibilityProvider} from './src/context/AccessibilityContext';
import {
  consumePendingOAuthState,
  finalizeOAuthLogin,
  parseOAuthState,
  storeAuthToken,
} from './src/api/auth';
import {
  completeServiceConnection,
  SERVICE_OAUTH_EVENT,
} from './src/api/services';
import {colors} from './src/theme';

function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <OAuthRedirectHandler />
        <RootNavigator />
      </AuthProvider>
    </AccessibilityProvider>
  );
}

export default App;

const OAUTH_SCHEME_PREFIX = 'area.app:';
const OAUTH_PATH = '/auth';
const AREAAPP_CALLBACK_PREFIX = 'areaapp://callback';

const isOAuthCallbackUrl = (url: string) => {
  if (!url) {
    return false;
  }
  if (url.startsWith(AREAAPP_CALLBACK_PREFIX)) {
    return true;
  }
  const normalized = url.replace('://', ':');
  return normalized.startsWith(`${OAUTH_SCHEME_PREFIX}${OAUTH_PATH}`);
};

const getSearchParams = (url: string): URLSearchParams => {
  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');

  const query =
    queryIndex !== -1
      ? url.slice(queryIndex + 1, hashIndex !== -1 ? hashIndex : undefined)
      : '';
  const fragment = hashIndex !== -1 ? url.slice(hashIndex + 1) : '';

  const params = new URLSearchParams(query);
  if (fragment) {
    const fragmentParams = new URLSearchParams(fragment);
    fragmentParams.forEach((value, key) => {
      if (!params.has(key)) {
        params.append(key, value);
      }
    });
  }

  return params;
};

const OAuthRedirectHandler: React.FC = () => {
  const {login} = useAuth();
  const isProcessingRef = useRef(false);

  const processUrl = useCallback(
    async (incomingUrl: string) => {
      if (!isOAuthCallbackUrl(incomingUrl)) {
        return;
      }
      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      let isServiceFlow = false;
      let serviceNameDuringFlow: string | undefined;
      try {
        const params = getSearchParams(incomingUrl);
        const state = params.get('state');
        const parsedState = parseOAuthState(state);
        const code = params.get('code');
        const token = params.get('token');

        const isBackendCallback = incomingUrl.startsWith(AREAAPP_CALLBACK_PREFIX);
        const providerFromUrl = params.get('provider');
        const provider = parsedState?.providerId || providerFromUrl;
        
        isServiceFlow = parsedState?.mode === 'service';
        serviceNameDuringFlow = parsedState?.serviceName;

        if (isBackendCallback && token && !isServiceFlow) {
          await storeAuthToken(token);
          login(token);
          return;
        }

        if (!provider) {
          throw new Error('Missing provider information in OAuth state.');
        }

        if (!code && !token) {
          throw new Error('Missing authorization response parameters.');
        }

        if (state) {
          const known = consumePendingOAuthState(state);
          if (!known) {
            console.warn('Received unknown OAuth state. Proceeding with caution.');
          }
        }

        if (isServiceFlow) {
          if (!serviceNameDuringFlow) {
            throw new Error('Missing service information for OAuth connection.');
          }

          try {
            await completeServiceConnection({
              serviceName: serviceNameDuringFlow,
              code,
              token,
            });
            DeviceEventEmitter.emit(SERVICE_OAUTH_EVENT, {
              serviceName: serviceNameDuringFlow,
              success: true,
            });
          } catch (serviceError) {
            DeviceEventEmitter.emit(SERVICE_OAUTH_EVENT, {
              serviceName: serviceNameDuringFlow,
              success: false,
              error:
                serviceError instanceof Error
                  ? serviceError.message
                  : 'Failed to connect service.',
            });
            throw serviceError;
          }
          return;
        }

        const authResponse = await finalizeOAuthLogin({
          providerId: provider,
          code,
          token,
          state,
        });

        if (authResponse.access_token) {
          login(authResponse.access_token);
        }
      } catch (error) {
        console.error('OAuth handling failed', error);
        const title = isServiceFlow ? 'Service connection' : 'Login error';
        const fallback = isServiceFlow
          ? 'Unable to connect the service.'
          : 'Unable to complete OAuth login.';
        Alert.alert(
          title,
          error instanceof Error ? error.message : fallback,
        );
      } finally {
        isProcessingRef.current = false;
      }
    },
    [login],
  );

  useEffect(() => {
    const handleEvent = ({url}: {url: string}) => {
      if (url) {
        processUrl(url);
      }
    };

    Linking.getInitialURL().then(initialUrl => {
      if (initialUrl) {
        processUrl(initialUrl);
      }
    });

    const subscription = Linking.addEventListener('url', handleEvent);
    return () => subscription.remove();
  }, [processUrl]);

  return null;
};
