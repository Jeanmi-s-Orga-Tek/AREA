import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {RootNavigator} from './src/navigation';
import {AuthProvider} from './src/context/AuthContext';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AuthProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </AuthProvider>
  );
}

export default App;
