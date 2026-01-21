import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import axios from 'axios'
import { baseUrl } from './common/const'
import Login from './login/Login'
import MainView from './main/MainView'
import Header from './header/Header'
import Homepage from './homepage/homepage'

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    width: '100%',
    height: '100%',
  }
})

// Paramètres Axios par défaut
axios.defaults.baseURL = baseUrl

export default function Root() {
  const [username, setUsername] = useState<string>('')
  const [authToken, setAuthToken] = useState<string>('')

  const onLogUser = (username: string, authToken: string) : void => {
    setUsername(username)
    setAuthToken(authToken)
  }

  const logoutUser = () : void => {
    setUsername('')
    setAuthToken('')
  }

  return (
    <View>
      <Header username={ username } />
      <View style={ styles.container }>
        {authToken != '' ? (
          <MainView authToken={ authToken } logoutUser={ logoutUser } />
        ) : (
          <Login onLogUser={ onLogUser } />
        )}
        <Homepage/>
      </View>
    </View>
  )
}
