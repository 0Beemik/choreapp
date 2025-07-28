import React, { useEffect, useState } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database';
import { Text, View } from 'react-native';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadDatabase() {
      try {
        await initializeDatabase();
        setDbInitialized(true);
      } catch (e) {
        setDbError(e as Error);
      }
    }
    loadDatabase();
  }, []);

  if (dbError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error initializing database:</Text>
        <Text>{dbError.message}</Text>
      </View>
    );
  }

  if (!dbInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}
