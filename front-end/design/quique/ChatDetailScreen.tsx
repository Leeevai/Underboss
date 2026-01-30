import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView 
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

/******************************************************************
 * 📋 SECTION: TYPES & INTERFACES
 ******************************************************************/
interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

interface RouteParams {
  userName: string;
  chatId?: string; // El signo ? significa que es opcional
}

export default function ChatDetailPage({ route, navigation }: any) {
  /****************************************************************
   * 🛠️ SECTION: NAVIGATION PARAMS
   ****************************************************************/
  // We extract the userName passed from the MessagesPage
    const { userName } = route.params as RouteParams;

  /****************************************************************
   * 🧠 SECTION: STATE & LOGIC
   ****************************************************************/
     const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: `Hi! I saw your post for the gardener position.`, sender: 'other', time: '10:00 AM' },
        { id: '2', text: `Hi ${userName || 'there'}, yes, it is still available.`, sender: 'me', time: '10:05 AM' },
      { id: '3', text: 'Yes, I have been working in villa maintenance for 3 years.', sender: 'other', time: '10:10 AM' },
    ]);
     const [inputText, setInputText] = useState('');

        const sendMessage = () => {
            if (inputText.trim().length === 0) return;

            const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages([...messages, newMessage]);
            setInputText('');
        };

  /****************************************************************
   * 🎨 SECTION: RENDER COMPONENTS
   ****************************************************************/
  const renderItem = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer, 
      item.sender === 'me' ? styles.myMessage : styles.otherMessage
    ]}>
        <TouchableOpacity 
        onPress={() => navigation.goBack()} // <--- HERE is the action
        style={styles.backButton}
      >
        <AntDesign name="arrowleft" size={24} color="#0D3B66" />
      </TouchableOpacity>
      
      <Text style={[
        styles.messageText, 
        item.sender === 'me' ? styles.myMessageText : styles.otherMessageText
      ]}>
        {item.text}
      </Text>
      <Text style={styles.messageTime}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* CUSTOM HEADER WITH BACK BUTTON */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#0D3B66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userName}</Text>
        <View style={{ width: 40 }} /> {/* Spacer to center the title */}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.flexContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} 
      >
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* INPUT BAR AREA */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#A0A0A0"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <AntDesign name="arrowup" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
/******************************************************************
 * 🎨 SECTION: STYLES
 ******************************************************************/
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  flexContainer: { 
    flex: 1 
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D3B66',
  },
  listContainer: { 
    padding: 20 
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0D3B66',
    borderBottomRightRadius: 2,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F3F5',
    borderBottomLeftRadius: 2,
  },
  messageText: { 
    fontSize: 15,
    lineHeight: 20 
  },
  myMessageText: { 
    color: '#FFF' 
  },
  otherMessageText: { 
    color: '#0D3B66' 
  },
  messageTime: {
    fontSize: 10,
    color: '#A0A0A0',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#FFF',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#5DA9E9',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});