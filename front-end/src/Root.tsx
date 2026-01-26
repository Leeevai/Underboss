import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Text, Button } from 'react-native'
import Login from './login/Login'
import MainView from './main/MainView'
import Header from './header/Header'
import AppSettings from './AppSettings'
import { serv, ApiError } from './serve'

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E3F2FD',
    width: '100%',
    height: '100%',
  }
})

// --- Placeholder for ProfileSetup ---
const ProfileSetup = ({ onComplete }: { onComplete: () => void }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ fontSize: 18, marginBottom: 20 }}>Profile Setup Required</Text>
    <Text style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
      (This is a placeholder. Build your profile form here.)
    </Text>
    <Button title="Complete Profile" onPress={onComplete} />
  </View>
)

export default function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    // Check if token exists in AppSettings
    if (AppSettings.token) {
      setIsAuthenticated(true)
      // Check if profile is complete
      await checkProfileStatus()
    }
    setIsLoading(false)
  }

  const checkProfileStatus = async () => {
    try {
      // serv auto-caches profile in AppSettings
      const profile = await serv('profile.get')
      
      // Check if essential profile fields are filled
      const isComplete = !!(
        profile.first_name &&
        profile.last_name &&
        profile.display_name &&
        profile.bio
      )
      
      AppSettings.isProfileComplete = isComplete
      setIsProfileComplete(isComplete)
    } catch (error) {
      console.error('Failed to check profile status:', error)
      
      // If we get an authentication error, the token is invalid
      if (error instanceof ApiError && error.isAuthError()) {
        console.log('Token invalid, logging out')
        AppSettings.clearSession()
        setIsAuthenticated(false)
        setIsProfileComplete(false)
        return
      }
      
      // Otherwise, assume profile is incomplete (404 or other errors)
      AppSettings.isProfileComplete = false
      setIsProfileComplete(false)
    }
  }

  const onLoginSuccess = async (username: string, token: string) => {
    AppSettings.username = username
    AppSettings.token = token
    setIsAuthenticated(true)
    
    // Check profile completeness
    await checkProfileStatus()
  }

  const onProfileComplete = () => {
    AppSettings.isProfileComplete = true
    setIsProfileComplete(true)
  }

  const onLogout = () => {
    AppSettings.clearSession()
    setIsAuthenticated(false)
    setIsProfileComplete(false)
  }

  // Determine which view to show
  const renderContent = () => {
    if (isLoading) {
      return <View style={{flex: 1, backgroundColor: '#fff'}} /> // Simple loading state
    }

    if (!isAuthenticated) {
      return <Login onLogUser={onLoginSuccess} />
    }
    
    if (!isProfileComplete) {
      return <ProfileSetup onComplete={onProfileComplete} />
    }
    
    return <MainView logoutUser={onLogout} />
  }

  return (
    <View style={{ flex: 1 }}>
      <Header 
        username={AppSettings.username} 
        isAuthenticated={isAuthenticated}
      />
      <View style={styles.container}>
        {renderContent()}
      </View>
    </View>
  )
}