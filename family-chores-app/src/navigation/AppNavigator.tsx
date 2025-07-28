import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { FamilySetupScreen } from '../screens/FamilySetup/FamilySetupScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { RootStackParamList } from '../types';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { ErrorBoundary } from '../components/common/ErrorBoundary/ErrorBoundary';

const Stack = createStackNavigator<RootStackParamList>();

// A simple check to see if a family has been set up.
// In a real app, this would be more robust, probably checking async storage.
const isFamilySetup = false;

export const AppNavigator: React.FC = () => {
  return (
    <Provider store={store}>
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
    </Provider>
  );
};
