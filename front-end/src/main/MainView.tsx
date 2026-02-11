import React, { useState } from 'react'
import { View, Image } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';

import { useTheme, BRAND } from '../common/theme';

// Custom icons
const icons = {
  home: require('../res/icons/homepage.png'),
  spaps: require('../res/icons/spaps.png'),
  post: require('../res/icons/post.png'),
  chats: require('../res/icons/chats.png'),
  calendar: require('../res/icons/calendar.png'),
};

import PapsFeed from '../feed/PapsFeed';
import PaymentPage from '../pages/PayementPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import ModifyProfil from '../pages/ModifyProfil.tsx';
import Post from '../posting/posting_page'
import CalendarScreen from '../calendar/calendarTEMP.tsx'
import ChatScreen from '../chat/ChatScreen';

import { serv, getCurrentUser } from '../serve';
import SpapFeed from '../spap/SpapFeed';


const currentUser = getCurrentUser();


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


// --- Placeholders for core components ---
//const Post = () => (
//  <View style={styles.center}><Text>Post something...</Text></View>
//)


function MainTabs() {
  const { colors, isDark } = useTheme();
  
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false, 
        tabBarStyle: { 
          height: 120,
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 20,
          paddingTop: 8,
          elevation: 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={PapsFeed}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Image source={icons.home} style={{ width: size, height: size, tintColor: color, opacity: focused ? 1 : 0.6 }} />
          ),
        }}
      />
      <Tab.Screen
        name="Spap"
        component={SpapFeed}
        options={{
          title: 'SpapFeed',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Image source={icons.spaps} style={{ width: size, height: size, tintColor: color, opacity: focused ? 1 : 0.6 }} />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={Post}
        options={{
          title: 'Post',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Image source={icons.post} style={{ width: size, height: size, tintColor: color, opacity: focused ? 1 : 0.6 }} />
          ),
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatScreen}
        options={{
          title: 'Chats',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Image source={icons.chats} style={{ width: size, height: size, tintColor: color, opacity: focused ? 1 : 0.6 }} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendar',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Image source={icons.calendar} style={{ width: size, height: size, tintColor: color, opacity: focused ? 1 : 0.6 }} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}


interface MainViewProps {
  logoutUser: () => void

}

export default function MainView({ logoutUser }: MainViewProps) {
  const { colors, isDark } = useTheme();

  // Create custom navigation themes
  const CustomLightTheme = {
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

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <View style={{ flexDirection: 'column', flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer theme={isDark ? CustomDarkTheme : CustomLightTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Payement" component={PaymentPage} />
          <Stack.Screen name="ProfilePage" component={ProfilePage} />
          <Stack.Screen name="ModifyProfil" component={ModifyProfil} />
          <Stack.Screen name="Settings">
          
            {() => <SettingsPage logoutUser={logoutUser} />}
            

          </Stack.Screen>
          {/* <Stack.Screen name="Messages" component={MessagePage} />
          <Stack.Screen name="ChatDetail" component={ChatDetailPage} /> */} 
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  )
}