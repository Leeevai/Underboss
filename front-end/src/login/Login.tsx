import { useState } from 'react'
import { View } from 'react-native'
import Credentials from './Credentials'
import CreateAccount from './CreateAccount'

const TABS: { [index: string]: string } = Object.freeze({ 
  LOGIN: 'LOGIN', 
  CREATE_ACCOUNT: 'CREATE_ACCOUNT' 
});

/**
 * Logged out view component - handles login and account creation
 * @param {Object} props - the properties
 * @param {(username: string, token: string) => void} props.onLogUser - callback when user logs in
 * @returns
 */
export default function LoggedOutView({ onLogUser }: { 
  onLogUser: (username: string, token: string) => void 
}) {
  const [tab, setTab] = useState<string>(TABS.LOGIN);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      {tab === TABS.LOGIN ? (
        <Credentials
          onSuccess={onLogUser}
          onCancel={() => { setTab(TABS.CREATE_ACCOUNT) }}
        />
      ) : (
        <CreateAccount
          onSuccess={() => { setTab(TABS.LOGIN) }}
          onCancel={() => { setTab(TABS.LOGIN) }}
        />
      )}
    </View>
  )
}