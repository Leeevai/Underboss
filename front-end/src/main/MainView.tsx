import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Button } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import PapsFeed from '../feed/PapsFeed'

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

// --- Placeholders for missing components ---
const Post = () => (
  <View style={styles.center}><Text>Post something...</Text></View>
)
const Message = () => (
  <View style={styles.center}><Text>Message uploading...</Text></View>
)
const ProfilePage = () => (
  <View style={styles.center}><Text>Profile Page</Text></View>
)
const SettingsPage = ({ logoutUser }: { logoutUser: () => void }) => (
    <View style={styles.center}>
        <Text style={{ marginBottom: 20 }}>Settings</Text>
        <Button title="Log Out" onPress={logoutUser} /> 
    </View>
)


interface MainViewProps {
  logoutUser: () => void

}

export default function MainView({ logoutUser }: MainViewProps) {


  return (
    <View style={{flexDirection: 'column', flex: 1}}>
      <View style={{ height: 50, backgroundColor: '#1E375A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 10, color:"white" }}>UnderBoss</Text>
      </View>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { height: 150 } }}>
          <Tab.Screen
          name="PapsFeed"
          component={PapsFeed}
          options={{ title: 'PapsFeed' }}
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
            name="Profile"
            component={ProfilePage}
            options={{ title: 'ProfilePage' }}
          />
          <Tab.Screen
                        name="Settings"
                        
                        children={() => <SettingsPage logoutUser={logoutUser} />}
                        options={{ title: 'SettingsPage' }}
                    />
          
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  )
}