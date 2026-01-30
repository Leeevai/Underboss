import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';

/*********************************************************
 * 📋 1. TYPES DEFINITION 
 *********************************************************/
interface ChatItem {
  id: string;
  userName: string;
  lastMessage: string;
  time: string;
  avatar: string;
  unread: boolean;
}

/*********************************************************
 * 💾 2. MOCK DATA
 *********************************************************/
const CHATS_DATA: ChatItem[] = [
  {
    id: '1',
    userName: 'Juan Pérez',
    lastMessage: '¿Is the gardener position still available?',
    time: '10:30 AM',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    unread: true,
  },
  {
    id: '2',
    userName: 'María García',
    lastMessage: '¡Perfect!See you tomorrow at 8.',
    time: '9:15 AM',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    unread: false,
  },
  {
    id: '3',
    userName: 'Carlos Ruiz',
    lastMessage: 'I have sent you the photos.',
    time: 'Yesterday',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    unread: false,
  },
];

/*********************************************************
 * 📱 3. COMPONENTE PRINCIPAL
 *********************************************************/
export default function MessagesPage({navigation }: any) {

  // Function that renders each row of the list
  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ChatDetail', { 
    userName: item.userName 
  })}
    >
      {/* Avatar circle */}
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      
      {/* Message content */}
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        
        <View style={styles.messageFooter}>
          <Text style={[styles.lastMessage, item.unread && styles.lastMessageUnread]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {/* Blue point of not read */}
          {item.unread && <View style={styles.unreadBadge} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Head like Post page*/}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>Manage your job conversations</Text>
        </View>

        {/* Chat List */}
        <FlatList
          data={CHATS_DATA}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />

      </View>
    </SafeAreaView>
  );
}

/*********************************************************
 * 🎨 4. Styles
 *********************************************************/
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D3B66', // Azul oscuro corporativo
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#5DA9E9', // Celeste
  },
  listContainer: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E1E8ED',
  },
  chatContent: {
    flex: 1,
    marginLeft: 15,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0D3B66',
  },
  chatTime: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#7A869A',
    flex: 1,
    marginRight: 10,
  },
  lastMessageUnread: {
    color: '#222',
    fontWeight: '600', // El texto resalta si no está leído
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5DA9E9', // Punto celeste
  },
});