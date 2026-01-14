import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, View, } from 'react-native'
import axios, { AxiosResponse } from 'axios'
import KivCard from '../common/KivCard'
import AllUsersItem, { User } from './AllUsersItem'

const styles = StyleSheet.create({
  titleContainer: {
    paddingBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
  },
  profilePicture: {
    width: 24,
    height: 24,
  },
  userRow: {
    flexDirection: 'row',
  },
  incorrectWarning: {
    backgroundColor: '#FF8A80',
    padding: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 16,
    alignSelf: 'center',
    justifyContent: 'center',
  }
})

/**
 * Displays all the users in Underboss
 * @param {Object} props - the properties
 * @param {string} props.authToken the authentication token
 */
export default function AllUsers({ authToken }: { authToken: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errCode, setErrCode] = useState<number>(0)

  const getAllUsersRequest = () => {
    setIsLoading(true)
    axios.get('/users',
      { headers: { Authorization: 'Bearer ' + authToken } }
    ).then((response: AxiosResponse<User[], any, {}>) => {
      console.log(response.data)
      setIsLoading(false)
      setErrCode(0)
      setUsers(response.data)
    }).catch((err: any) => {
      console.error(`Something went wrong ${err.message}`)
      Alert.alert('something went wrong', `${err.message}`)
      setIsLoading(false)
      setErrCode(err.status)
    })
  }

  useEffect(() => {
    getAllUsersRequest()
  }, [authToken])

  const renderItem = ({ item }: { item: User }) => <AllUsersItem item={ item } key={ item.login } />

  return (
    <KivCard>
      <View style={ styles.titleContainer }>
        <Text style={ styles.title }>All Users</Text>
      </View>
      { (errCode != 0) && (
        <View style={styles.incorrectWarning}>
          <Text style={styles.inputLabel}>Access Forbidden ({errCode})</Text>
        </View>
      ) }
      { isLoading && (
        <ActivityIndicator size="large" animating={true} color="#FF0000" />
      ) }
      { (users != null && users.length > 0) ? (
        <FlatList
          data={ users }
          renderItem={ renderItem }
          keyExtractor={ item => item.login }
        />
      ) : null}
      <Button
        title="Reload"
        disabled={ isLoading }
        onPress={ () => {
          getAllUsersRequest()
        } }
      />
    </KivCard>
  );
}
