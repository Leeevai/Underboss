// import { ReactNode, useState } from 'react'
// import { Button, View, Text, StyleSheet, Alert } from 'react-native'
// import KivTextInput from '../common/KivTextInput'
// import KivCard from '../common/KivCard'

// import axios, { AxiosResponse } from 'axios'

// const styles = StyleSheet.create({
//   titleContainer: {
//     paddingBottom: 16,
//     alignItems: 'center',
//     width: '100%'
//   },
//   title: {
//     fontSize: 24
//   },
//   incorrectWarning: {
//     backgroundColor: '#FF8A80',
//     padding: 4,
//     borderRadius: 4,
//     marginBottom: 4
//   },
//   buttonRow: {
//     flexDirection: 'row'
//   },
//   button: {
//     flexGrow: 1,
//     padding: 2
//   },
//   inputLabel: {
//     fontSize: 16,
//     alignSelf: 'center',
//     justifyContent: 'center'
//   }
// })

// /**
//  * Create account component
//  * @param {Object} props - the properties
//  * @param {(username: string, token: string) => void} props.onSuccess
//  * @param {() => void} props.onCancel
//  */
// export default function CreateAccount({ onSuccess, onCancel }: 
//   { onSuccess: (username: string, token: string) => void, onCancel: () => void }): ReactNode {
//   const [username, setUsername] = useState<string>('')
//   const [email, setEmail] = useState<string>('')
//   const [password, setPassword] = useState<string>('')
//   const [isLoading, setIsLoading] = useState<boolean>(false)
//   const [hasFailure, setHasFailure] = useState<boolean>(false)
//   const [errorMessage, setErrorMessage] = useState<string>('')

//   const sendUserCreationRequest = () => {
//     // Basic validation
//     if (!username.trim()) {
//       setErrorMessage('Username is required')
//       setHasFailure(true)
//       return
//     }
    
//     if (!email.trim()) {
//       setErrorMessage('Email is required')
//       setHasFailure(true)
//       return
//     }
    
//     if (!password.trim()) {
//       setErrorMessage('Password is required')
//       setHasFailure(true)
//       return
//     }

//     setIsLoading(true)
//     setHasFailure(false)
//     setErrorMessage('')

//     // First, create the account
//     axios.post('/register', { 
//       login: username, 
//       email: email,
//       password: password 
//     })
//       .then((response: AxiosResponse<any, any>) => {
//         console.log('Registration successful:', response.data)
//         setIsLoading(false)
        
//         if (response.status >= 200 && response.status < 300) {
//           setHasFailure(false)
//           // After successful registration, automatically log in
//           loginAfterRegistration()
//         } else {
//           setHasFailure(true)
//           setErrorMessage('Failed to create account')
//         }
//       })
//       .catch((err: any) => {
//         console.error(`Registration failed:`, err)
//         console.error('Error response:', err.response?.data)
        
//         // Extract error message from backend if available
//         const backendError = err.response?.data?.error || 
//                             err.response?.data?.message ||
//                             err.message ||
//                             'Failed to create account'
//         setErrorMessage(backendError)
        
//         Alert.alert('Account Creation Failed', backendError)
//         setIsLoading(false)
//         setHasFailure(true)
//       })
//   }

//   const loginAfterRegistration = () => {
//     // Automatically log in after registration
//     setIsLoading(true)
    
//     axios.get('/login', {
//       auth: { username: username, password: password }
//     })
//       .then((result: AxiosResponse<any, any>) => {
//         console.log('Auto-login response:', result.data)
        
//         // Extract token from response
//         let token: string
//         if (typeof result.data === 'string') {
//           token = result.data
//         } else if (result.data && result.data.token) {
//           token = result.data.token
//         } else {
//           throw new Error('Invalid response format - no token received')
//         }
        
//         console.log('Auto-login successful! Token:', token.substring(0, 20) + '...')
//         setIsLoading(false)
//         setHasFailure(false)
//         onSuccess(username, token)
//       })
//       .catch((err: any) => {
//         console.error(`Auto-login failed:`, err)
//         setIsLoading(false)
//         setHasFailure(true)
//         setErrorMessage('Account created but login failed. Please login manually.')
//         Alert.alert('Please Login', 'Account created successfully. Please login manually.')
//         onCancel() // Go back to login screen
//       })
//   }

//   return (
//     <KivCard>
//       <View style={styles.titleContainer}>
//         <Text style={styles.title}>Create Account</Text>
//       </View>
      
//       {hasFailure && (
//         <View style={styles.incorrectWarning}>
//           <Text style={styles.inputLabel}>
//             {errorMessage || 'Something went wrong while creating the user'}
//           </Text>
//         </View>
//       )}
      
//       <KivTextInput
//         label="Username"
//         value={username}
//         onChangeText={value => { 
//           setUsername(value)
//           setHasFailure(false)
//         }}
//         autoCapitalize="none"
//       />
      
//       <KivTextInput
//         label="Email"
//         value={email}
//         onChangeText={value => { 
//           setEmail(value)
//           setHasFailure(false)
//         }}
//         keyboardType="email-address"
//         autoCapitalize="none"
//       />
      
//       <KivTextInput
//         label="Password"
//         value={password}
//         secureTextEntry={true}
//         onChangeText={value => { 
//           setPassword(value)
//           setHasFailure(false)
//         }}
//         autoCapitalize="none"
//       />
      
//       <View style={styles.buttonRow}>
//         <View style={styles.button}>
//           <Button
//             title="< Login"
//             disabled={isLoading}
//             onPress={() => {
//               onCancel()
//             }}
//           />
//         </View>
//         <View style={styles.button}>
//           <Button
//             title="Create Account"
//             disabled={isLoading}
//             onPress={() => {
//               sendUserCreationRequest()
//             }}
//           />
//         </View>
//       </View>
//     </KivCard>
//   )
// }