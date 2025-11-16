import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { FamilySetupScreen } from '../screens/FamilySetup/FamilySetupScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { RootStackParamList } from '../types';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState } from '../store/store';
import { ErrorBoundary } from '../components/common/ErrorBoundary/ErrorBoundary';
import { View, Text } from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();

const AppContent: React.FC = () => {
  // Check if a family has been set up by looking at the Redux store
  const isFamilySetup = useSelector((state: RootState) => state.family.current !== null);

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isFamilySetup ? (
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          ) : (
            <Stack.Screen name="FamilySetup" component={FamilySetupScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Loading...</Text>
          </View>
        }
        persistor={persistor}
      >
        <AppContent />
      </PersistGate>
    </Provider>
  );
};
