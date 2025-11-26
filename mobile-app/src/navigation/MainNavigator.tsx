// @ts-ignore
import React from 'react';
// @ts-ignore
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// @ts-ignore
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/Main/HomeScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import DocumentsScreen from '../screens/Main/DocumentsScreen';
import LawyersScreen from '../screens/Main/LawyersScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';

export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Documents: undefined;
  Lawyers: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Start',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="chat" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          title: 'Dokumente',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="file-document" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Lawyers"
        component={LawyersScreen}
        options={{
          title: 'Anwälte',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="account-tie" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
