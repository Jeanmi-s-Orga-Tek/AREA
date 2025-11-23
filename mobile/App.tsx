import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {RootNavigator} from './src/navigation';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </>
  );
}

export default App;
