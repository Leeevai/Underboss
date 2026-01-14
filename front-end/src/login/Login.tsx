import { useState } from 'react'
import { View } from 'react-native'
import Credentials from './Credentials'
import CreateAccount from './CreateAccount'

const TABS: { [index: string] : string } = Object.freeze({ LOGIN: 'LOGIN', CREATE_ACCOUNT: 'CREATE_ACCOUNT' });

/**
 *
 * @param {Object} props - the properties
 * @param {(authToken:string) => void} props.onLogUser
 * @returns
 */
export default function LoggedOutView({ onLogUser } : { onLogUser : (_username: string, _token: string) => void }) {
  const [tab, setTab] = useState<string>(TABS.LOGIN);

  return (
    <View
      style={ {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      } }>
      { tab == TABS.LOGIN ? (
        <Credentials
          onSuccess={ onLogUser }
          onCancel={ () => { setTab(TABS.CREATE_ACCOUNT) } }
        />
      ) : (
        <CreateAccount
          onSuccess={ () => { setTab(TABS.LOGIN) } }
          onCancel={ () => { setTab(TABS.LOGIN) } }
        />
      )}
    </View>
  )
}
