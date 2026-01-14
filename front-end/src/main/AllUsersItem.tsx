import { View, Text, StyleSheet, Image } from 'react-native'

import DefaultProfilePicture from './DefaultProfilePicture'

const styles = StyleSheet.create({
    profilePicture: {
        width: 24,
        height: 24,
    },
    userRow: {
        flexDirection: 'row',
    }
})

export interface User {
    login: string; 
    picture: string; 
    isadmin: boolean;
}

/**
 * Component that displays a user's information
 * @param {Object} props - the properties
 * @param {User} props.item
 */
export default function AllUsersItem({ item }: { item: User }) {
    return (
        <View style={ styles.userRow }>
            { item.picture != ''
                // We do not store the user's picture yet on the DB
                ? <Image
                    style={ styles.profilePicture }
                    source={ { uri: item.picture } }
                />
                : <DefaultProfilePicture style={ styles.profilePicture } />
            }
            <Text>{ item.login }</Text>
            <Text>{ item.isadmin ? ' - Admin' : '' }</Text>
        </View>
    )
}
