import React, { useEffect, useState } from 'react'
import { View, FlatList, ActivityIndicator, Text, StyleSheet, RefreshControl, TextInput } from 'react-native'
import { serv, ApiError,Spap } from '../serve';
import SpapPoster from './SpapPoster';
import UnderbossBar from '../header/underbossbar';

export default function SpapFeed() {
  const [spaps, setSpaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchSpaps = async () => {
    try {
      const response = await serv('spap.my')
      // serv returns { applications: [], count: number }
      console.log(response);
      setSpaps(response.applications)
      setError('')
    } catch (err) {
      console.error('Failed to fetch spaps', err)
      const msg = err instanceof ApiError ? err.getUserMessage() : 'Failed to load applications.'
      setError(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSpaps()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchSpaps()
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )
  }

  if (error && spaps.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Text onPress={fetchSpaps} style={styles.retryText}>Tap to Retry</Text>
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
            data={spaps}
            keyExtractor={(item) => item.spap_id}
            renderItem={({ item }) => <SpapPoster spap={item} />}
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
    backgroundColor: '#dce9e9' // Clean background
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