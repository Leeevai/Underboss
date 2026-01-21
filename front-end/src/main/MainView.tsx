import { Button, View, StyleSheet } from 'react-native'
import AllUsers from './AllUsers'
// import Navbar from './Navbar'; // Tu pantalla inicial

const styles = StyleSheet.create({
  mainContainer: {
    flexGrow: 1
  },
  cardContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    marginBottom: 8
  },
  bottomButton: {
    flexShrink: 0,
    flexBasis: 100
  }
})

/**
 * @param {Object} props - the properties
 * @param {string} props.authToken authToken for the authenticated queries
 * @param {() => void} props.logOutUser return to the logged out state
 * @returns
 */
export default function MainView({ authToken, logoutUser }: 
  { authToken: string, logoutUser: () => void }) {
  return (
    <View style={ styles.mainContainer }>
      <View style={ styles.cardContainer }>
        <AllUsers authToken={ authToken } />
      </View>
      <View style={styles.bottomButton }>
        <Button title="Log out" onPress={  logoutUser }/>
      </View>
      {/* <Navbar/> */}
    </View>

    
  )
}
