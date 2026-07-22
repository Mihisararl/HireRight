import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { PublicNavProvider } from '../context/PublicNavContext';
import LoadingView from '../components/LoadingView';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/public/HomeScreen';
import PublicServicesScreen from '../screens/public/PublicServicesScreen';
import HowItWorksScreen from '../screens/public/HowItWorksScreen';
import BecomeWorkerScreen from '../screens/public/BecomeWorkerScreen';
import JobsScreen from '../screens/JobsScreen';
import JobDetailsScreen from '../screens/JobDetailsScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function JobsStack() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="JobsList"
        component={JobsScreen}
        options={{ title: t('mobile.jobs'), headerShown: false }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ title: t('mobile.jobDetails') }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="JobsTab"
        component={JobsStack}
        options={{
          title: t('mobile.jobs'),
          headerShown: false,
          tabBarLabel: t('mobile.jobs'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          title: t('provider.earnings'),
          tabBarLabel: t('provider.earnings'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>💰</Text>,
        }}
      />
      <Tab.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{
          title: t('provider.reviews'),
          tabBarLabel: t('provider.reviews'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>⭐</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('profile'),
          tabBarLabel: t('profile'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function PublicStack() {
  return (
    <PublicNavProvider>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Services" component={PublicServicesScreen} />
        <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
        <Stack.Screen name="BecomeWorker" component={BecomeWorkerScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </PublicNavProvider>
  );
}

export default function AppNavigator() {
  const { t } = useTranslation();
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingView message={t('mobile.startingApp')} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Public" component={PublicStack} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
