import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Text, Button, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Login from './login/Login'
import MainView from './main/MainView'
import Header from './header/Header'
import AppSettings from './AppSettings'
import { serv, ApiError } from './serve'
import { ThemeProvider, useTheme, BRAND } from './common/theme'

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  }
})

// --- Placeholder for ProfileSetup ---
const ProfileSetup = ({ onComplete }: { onComplete: () => void }) => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 18, marginBottom: 20, color: colors.text }}>Profile Setup Required</Text>
      <Text style={{ textAlign: 'center', marginBottom: 20, color: colors.textSecondary }}>
        (This is a placeholder. Build your profile form here.)
      </Text>
      <Button title="Complete Profile" onPress={onComplete} color={BRAND.primary} />
    </View>
  );
}

// Loading screen component
const LoadingScreen = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={BRAND.primary} />
    </View>
  );
}

function RootContent() {
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
      return <LoadingScreen />
    }

    if (!isAuthenticated) {
      return <Login onLogUser={onLoginSuccess} />
    }
    
    if (!isProfileComplete) {
      return <ProfileSetup onComplete={onProfileComplete} />
    }
    
    return <MainView logoutUser={onLogout} />
  }

  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header 
        username={AppSettings.username} 
        isAuthenticated={isAuthenticated}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderContent()}
      </View>
    </View>
  )
}

// Root component wrapped with providers
export default function Root() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}