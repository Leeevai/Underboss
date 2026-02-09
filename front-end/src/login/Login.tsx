import React, { useState } from 'react'
import { View, Button, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native'
import { serv, ApiError } from '../serve'
import AppSettings from '../AppSettings'
import { useTheme, BRAND, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../common/theme'

// Reusing your existing common components
import KivTextInput from '../common/KivTextInput'
import KivCard from '../common/KivCard'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  titleContainer: {
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4
  },
  errorContainer: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
    width: '100%',
    borderLeftWidth: 4,
  },
  errorText: {
    fontSize: 14
  },
  buttonContainer: {
    marginTop: 16,
    gap: 10
  },
  switchModeContainer: {
    marginTop: 16,
    alignItems: 'center'
  },
  switchModeText: {
    fontSize: 16
  }
})

interface LoginProps {
  onLogUser: (username: string, token: string) => void
}

export default function Login({ onLogUser }: LoginProps) {
  const { colors, isDark } = useTheme();
  
  // Mode state: true = Login, false = Register
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true)
  
  // Form state
  const [username, setUsername] = useState<string>('osman')
  const [password, setPassword] = useState<string>('123')
  const [email, setEmail] = useState<string>('') // Only for register
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Reset errors when user types
  const handleInputChange = (setter: (val: string) => void, value: string) => {
    setter(value)
    setErrorMessage('')
  }

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMessage('Please enter both username and password')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      // serv('login') auto-saves token and returns clean UserInfo
      const user = await serv('login', {
        login: username,
        password: password
      })

      // Token is auto-saved by serv, just pass username to parent
      onLogUser(user.username, AppSettings.token)
    } catch (error) {
      console.error('Login error:', error)
      const msg = error instanceof ApiError 
        ? error.getUserMessage()
        : 'Invalid username or password'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!username || !password || !email) {
      setErrorMessage('All fields are required')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      // 1. Create Account using serv
      await serv('register', {
        username: username, 
        email: email,
        password: password
      })

      // 2. Auto-login on success - serv saves token automatically
      const user = await serv('login', {
        login: username,
        password: password
      })

      onLogUser(user.username, AppSettings.token)

    } catch (error) {
      console.error('Registration error:', error)
      // Display the exact error from backend if available
      const msg = error instanceof ApiError
        ? error.getUserMessage()
        : 'Failed to create account. Username or email might be taken.'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KivCard>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLoginMode ? 'Sign in to continue' : 'Join us to get started'}
          </Text>
        </View>

        {errorMessage ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorLight, borderLeftColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        <KivTextInput
          label="Username"
          value={username}
          onChangeText={(val) => handleInputChange(setUsername, val)}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {!isLoginMode && (
          <KivTextInput
            label="Email"
            value={email}
            onChangeText={(val) => handleInputChange(setEmail, val)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        <KivTextInput
          label="Password"
          value={password}
          onChangeText={(val) => handleInputChange(setPassword, val)}
          secureTextEntry
          autoCapitalize="none"
        />

        <View style={styles.buttonContainer}>
          <Button
            title={isLoginMode ? 'Login' : 'Sign Up'}
            onPress={isLoginMode ? handleLogin : handleRegister}
            disabled={isLoading}
          />
        </View>

        <TouchableOpacity 
          style={styles.switchModeContainer}
          onPress={() => {
            setIsLoginMode(!isLoginMode)
            setErrorMessage('')
          }}
        >
          <Text style={[styles.switchModeText, { color: colors.primary }]}>
            {isLoginMode 
              ? 'No account? Create one >' 
              : '< Have an account? Login'}
          </Text>
        </TouchableOpacity>
      </KivCard>
    </View>
  )
}