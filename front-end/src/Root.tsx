import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Login from './login/Login'
import ProfileSetupScreen from './login/ProfileSetupScreen'
import MainView from './main/MainView'
import Header from './header/Header'
import AppSettings from './AppSettings'
import { serv, ApiError } from './serve'
import { useCurrentUserProfile } from './cache'
import { ThemeProvider, useTheme, BRAND } from './common/theme'

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  }
})

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
  
  // Hook for reactive profile updates
  const { refreshProfile, clearProfile } = useCurrentUserProfile();

  const checkProfileStatus = useCallback(async () => {
    try {
      // Fetch profile and update the Jotai atom cache
      const profile = await refreshProfile();
      
      if (!profile) {
        AppSettings.isProfileComplete = false
        setIsProfileComplete(false)
        return
      }
      
      // Check if essential profile fields are filled (avatar is optional - uses default)
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
        clearProfile()
        setIsAuthenticated(false)
        setIsProfileComplete(false)
        return
      }
      
      // Otherwise, assume profile is incomplete (404 or other errors)
      AppSettings.isProfileComplete = false
      setIsProfileComplete(false)
    }
  }, [refreshProfile, clearProfile]);

  // Check authentication status on mount
  useEffect(() => {
    const initApp = async () => {
      // Fetch app config (default avatar URL, etc.)
      try {
        const config = await serv('system.config', undefined, { silent: true })
        if (config?.default_avatar_url) {
          AppSettings.defaultAvatarUrl = config.default_avatar_url
        }
      } catch {
        // Silently ignore config fetch errors - non-critical
      }

      // Check if token exists in AppSettings
      if (AppSettings.token) {
        // Check if profile is complete BEFORE setting authenticated
        // This prevents the flash of ProfileSetupScreen
        await checkProfileStatus()
        setIsAuthenticated(true)
      }
      setIsLoading(false)
    }
    initApp()
  }, [checkProfileStatus])

  const onLoginSuccess = async (username: string, token: string) => {
    AppSettings.username = username
    AppSettings.token = token
    setIsAuthenticated(true)
    
    // Check profile completeness
    await checkProfileStatus()
  }

  const onProfileComplete = async () => {
    // Refresh profile to get the latest data including avatar
    await checkProfileStatus()
  }

  const onLogout = () => {
    AppSettings.clearSession()
    clearProfile()
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
      return <ProfileSetupScreen onComplete={onProfileComplete} />
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