import React, { useEffect, useState } from 'react'
import { View, FlatList, ActivityIndicator, Text, StyleSheet, RefreshControl, TouchableWithoutFeedback, TextInput } from 'react-native'
import { serv, ApiError } from '../serve';
import PapsPost from './PapsPost';
import UnderbossBar from '../header/underbossbar';

export default function PapsFeed() {
  const [paps, setPaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchPaps = async () => {
    try {
      const response = await serv('paps.list')
      // serv returns { paps: [], total_count: number }
      console.log('Fetched paps response:', response)
      console.log('First pap:', response.paps?.[0])
      setPaps(response.paps)
      setError('')
    } catch (err) {
      console.error('Failed to fetch paps', err)
      const msg = err instanceof ApiError ? err.getUserMessage() : 'Failed to load feed.'
      setError(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPaps()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchPaps()
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )
  }

  if (error && paps.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Text onPress={fetchPaps} style={styles.retryText}>Tap to Retry</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View><UnderbossBar /></View>
      <View style ={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', }}>
        <TextInput style = {{borderWidth: 1, borderColor : '#646464',borderRadius:30, margin:10, backgroundColor : '#ecf1f2', color:'#5074b2'}} placeholder = '🔍 Research a job ...' ></TextInput>
      </View>
      <FlatList
        data={paps}
        keyExtractor={(item, index) => item?.id?.toString() || `pap-${index}`}
        renderItem={({ item }) => <PapsPost pap={item} />}
        horizontal={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dce9e9' // White background for that clean look
    
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    color: 'red',
    marginBottom: 10
  },
  retryText: {
    color: 'blue',
    fontWeight: 'bold'
  }
})