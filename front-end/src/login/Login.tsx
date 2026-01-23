import React, { useState } from 'react'
import { View, Button, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native'
import axios from 'axios'

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
    color: '#333'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F'
  },
  errorText: {
    color: '#D32F2F',
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
    color: '#1E88E5',
    fontSize: 16
  }
})

interface LoginProps {
  onLogUser: (username: string, token: string) => void
}

export default function Login({ onLogUser }: LoginProps) {
  // Mode state: true = Login, false = Register
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true)
  
  // Form state
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
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
      // Login with Basic Auth
      const response = await axios.get('/login', {
        auth: { username, password }
      })

      // Extract token (handling string or object response)
      const token = typeof response.data === 'string' 
        ? response.data 
        : response.data?.token

      if (!token) throw new Error('No token received from server')

      onLogUser(username, token)
    } catch (error: any) {
      console.error('Login error:', error)
      const msg = error.response?.data?.error || 
                  error.response?.data?.message || 
                  'Invalid username or password'
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
      // 1. Create Account
      // FIXED: Changed 'login' to 'username' to match API requirements
      await axios.post('/register', {
        username: username, 
        email: email,
        password: password
      })

      // 2. Auto-login on success
      const loginResponse = await axios.get('/login', {
        auth: { username, password }
      })

      const token = typeof loginResponse.data === 'string' 
        ? loginResponse.data 
        : loginResponse.data?.token

      if (!token) {// --- Placeholder for ProfileSetup ---
        const ProfileSetup = ({ onComplete }: { onComplete: () => void }) => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, marginBottom: 20 }}>Profile Setup Required</Text>
            <Text style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
              (This is a placeholder. Build your profile form here.)
            </Text>
            <Button title="Complete Profile" onPress={onComplete} />
          </View>
        )
        Alert.alert('Account Created', 'Please log in manually.')
        setIsLoginMode(true)
      } else {
        onLogUser(username, token)
      }

    } catch (error: any) {
      console.error('Registration error:', error)
      // Display the exact error from backend if available
      const msg = error.response?.data?.error || 
                  error.response?.data?.message || 
                  'Failed to create account. Username or email might be taken.'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <KivCard>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {isLoginMode ? 'Sign in to continue' : 'Join us to get started'}
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
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
          <Text style={styles.switchModeText}>
            {isLoginMode 
              ? 'No account? Create one >' 
              : '< Have an account? Login'}
          </Text>
        </TouchableOpacity>
      </KivCard>
    </View>
  )
}