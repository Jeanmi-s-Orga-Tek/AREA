import React, {useCallback, useEffect, useRef} from 'react';
import {Alert, Linking, StatusBar, useColorScheme} from 'react-native';
import {RootNavigator} from './src/navigation';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {
  consumePendingOAuthState,
  extractProviderFromState,
  finalizeOAuthLogin,
} from './src/api/auth';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AuthProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <OAuthRedirectHandler />
      <RootNavigator />
    </AuthProvider>
  );
}

export default App;

const OAUTH_SCHEME_PREFIX = 'area.app:';
const OAUTH_PATH = '/auth';

const isOAuthCallbackUrl = (url: string) => {
  if (!url) {
    return false;
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
      try {
        const params = getSearchParams(incomingUrl);
        const state = params.get('state');
        const provider = extractProviderFromState(state);
        const code = params.get('code');
        const token = params.get('token');

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
        Alert.alert(
          'Login error',
          error instanceof Error
            ? error.message
            : 'Unable to complete OAuth login.',
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
