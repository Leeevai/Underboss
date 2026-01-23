import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Button } from 'react-native'
import PapsFeed from '../feed/PapsFeed'

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
    borderTopWidth: 1,
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
const SearchPage = () => (
  <View style={styles.center}><Text>Search Component</Text></View>
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

type TabName = 'feed' | 'search' | 'profile' | 'settings'

export default function MainView({ logoutUser }: MainViewProps) {
  const [activeTab, setActiveTab] = useState<TabName>('feed')

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <PapsFeed /> // Now using the real feed!
      case 'search':
        return <SearchPage />
      case 'profile':
        return <ProfilePage />
      case 'settings':
        return <SettingsPage logoutUser={logoutUser} />
      default:
        return <PapsFeed />
    }
  }

  const Tab = ({ name, icon, label }: { name: TabName; icon: string; label: string }) => {
    const isActive = activeTab === name
    return (
      <TouchableOpacity
        style={styles.tab}
        onPress={() => setActiveTab(name)}
      >
        <Text style={[styles.tabIcon, { color: isActive ? '#000' : '#8E8E8E' }]}>
          {icon}
        </Text>
        <Text style={isActive ? styles.tabLabelActive : styles.tabLabel}>
          {label}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
      
      <View style={styles.tabBar}>
        <Tab name="feed" icon="🏠" label="Feed" />
        <Tab name="search" icon="🔍" label="Search" />
        <Tab name="profile" icon="👤" label="Profile" />
        <Tab name="settings" icon="⚙️" label="Settings" />
      </View>
    </View>
  )
}