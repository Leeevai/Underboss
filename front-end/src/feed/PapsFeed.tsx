import React, { useEffect, useState } from 'react'
import { View, FlatList, ActivityIndicator, Text, StyleSheet, RefreshControl } from 'react-native'
import axios from 'axios'
import PapsPost from './PapsPost'

export default function PapsFeed() {
  const [paps, setPaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchPaps = async () => {
    try {
      const response = await axios.get('/paps')
      // Assuming API returns newest first, no need to reverse
      setPaps(response.data)
      setError('')
    } catch (err) {
      console.error('Failed to fetch paps', err)
      setError('Failed to load feed.')
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
      <FlatList
        data={paps}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PapsPost pap={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff' // White background for that clean look
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