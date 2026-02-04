import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Button } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import PapsFeed from '../feed/PapsFeed';
import NotificationPage from '../pages/NotificationPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import Spap from '../spap/SpapFeed';
import ModifyProfil from '../pages/ModifyProfil.tsx';
import Post from '../posting/posting_page'
import Calendar from '../calendar/Calendar'


import { serv, getCurrentUser } from '../serve';
import SpapFeed from '../spap/SpapFeed';


const currentUser = getCurrentUser();


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 10,
    borderTopColor: '#dbdbdb',
    paddingBottom: 20,
    paddingTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  tabLabel: {
    fontSize: 10,
    color: '#8E8E8E'
  },
  tabLabelActive: {
    fontSize: 10,
    color: '#000',
    fontWeight: 'bold'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

// --- Placeholders for core components ---
//const Post = () => (
//  <View style={styles.center}><Text>Post something...</Text></View>
//)
const Message = () => (
  <View style={styles.center}><Text>Message uploading...</Text></View>
)


function MainTabs() {
  
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { height: 150 } }}>
      <Tab.Screen
        name="Home"
        component={PapsFeed}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Spap"
        component={SpapFeed}
        options={{ title: 'Spap' }}
      />
      <Tab.Screen
        name="Post"
        component={Post}
        options={{ title: 'Post' }}
      />
      <Tab.Screen
        name="Message"
        component={Message}
        options={{ title: 'Message' }}
      />
      <Tab.Screen
  name="Calendar"
  component={Calendar}
  options={{
    title: 'Calendar',
    tabBarIcon: ({ color, size, focused }) => (
      <Ionicons
        name={focused ? 'calendar' : 'calendar-outline'}
        size={size}
        color={color}
      />
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


  return (
    <View style={{ flexDirection: 'column', flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Notification" component={NotificationPage} />
          <Stack.Screen name="ProfilePage" component={ProfilePage} />
          <Stack.Screen name="ModifyProfil" component={ModifyProfil} />
          <Stack.Screen name="Settings">
          
            {() => <SettingsPage logoutUser={logoutUser} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  )
}