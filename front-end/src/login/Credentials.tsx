import { useState } from 'react'
import { Alert, Button, StyleSheet, Text, View } from 'react-native'
import KivTextInput from '../common/KivTextInput'
import KivCard from '../common/KivCard'

import axios, { AxiosResponse } from 'axios'
import { baseUrl } from '../common/const'

const styles = StyleSheet.create({
  titleContainer: {
    paddingBottom: 16,
    alignItems: 'center',
    width: '100%'
  },
  title: {
    fontSize: 24
  },
  incorrectWarning: {
    backgroundColor: '#FF8A80',
    padding: 4,
    borderRadius: 4,
    marginBottom: 4
  },
  buttonRow: {
    flexDirection: 'row'
  },
  button: {
    flexGrow: 1,
    padding: 2
  },
  inputLabel: {
    fontSize: 16,
    alignSelf: 'center',
    justifyContent: 'center'
  }
})

/**
 * Credentials input component with User & Password
 * @param {Object} props - the properties
 * @param {(username: string, authToken: string) => void} props.onSuccess
 * @param {() => void} props.onCancel
 */
export default function Credentials({ onSuccess, onCancel }: 
  { onSuccess: (username: string, token: string) => void, onCancel: () => void }) {
  // Default credentials for testing - remove in production!
  const [username, setUsername] = useState<string>('calvin');
  const [password, setPassword] = useState<string>('hobbes');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasInvalidLogin, setHasInvalidLogin] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const sendLoginRequest = (): void => {
    // Basic validation
    if (!username.trim()) {
      setErrorMessage('Username is required');
      setHasInvalidLogin(true);
      return;
    }
    
    if (!password.trim()) {
      setErrorMessage('Password is required');
      setHasInvalidLogin(true);
      return;
    }

    setIsLoading(true);
    setHasInvalidLogin(false);
    setErrorMessage('');

    console.log(`Request GET on ${baseUrl}/login`);

    // Login with Basic Auth - can use either username or email
    axios.get('/login', {
      auth: { username: username, password: password }
    })
      .then((result: AxiosResponse<string, any>) => {
        console.log('Login successful! Token: ' + result.data);
        setIsLoading(false);
        setHasInvalidLogin(false);
        onSuccess(username, result.data);
      })
      .catch((err: any) => {
        console.error(`Login failed: ${err.message}`);
        
        // Extract error message from backend if available
        const backendError = err.response?.data?.error || 'Invalid username or password';
        setErrorMessage(backendError);
        
        Alert.alert('Login Failed', backendError);
        setIsLoading(false);
        setHasInvalidLogin(true);
      });
  };

  return (
    <KivCard>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Login</Text>
      </View>
      
      {hasInvalidLogin && (
        <View style={styles.incorrectWarning}>
          <Text style={styles.inputLabel}>
            {errorMessage || 'The username or password is incorrect'}
          </Text>
        </View>
      )}
      
      <KivTextInput
        label="Username or Email"
        value={username}
        onChangeText={(value: string) => { 
          setUsername(value);
          setHasInvalidLogin(false);
        }}
        autoCapitalize="none"
      />
      
      <KivTextInput
        label="Password"
        value={password}
        onChangeText={(value: string) => { 
          setPassword(value);
          setHasInvalidLogin(false);
        }}
        secureTextEntry={true}
        autoCapitalize="none"
      />
      
      <View style={styles.buttonRow}>
        <View style={styles.button}>
          <Button
            title="Create Account >"
            disabled={isLoading}
            onPress={() => {
              onCancel();
            }}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Login"
            disabled={isLoading}
            onPress={() => {
              sendLoginRequest();
            }}
          />
        </View>
      </View>
    </KivCard>
  )
}