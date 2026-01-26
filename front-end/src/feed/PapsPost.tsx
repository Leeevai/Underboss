import React from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'

// Get screen width for full-width images
const { width } = Dimensions.get('window')

interface Pap {
  id: string
  title: string
  description: string
  payment_amount: number | null
  payment_currency: string
  media_urls?: { media_url: string; media_type: string; display_order: number }[]
  location_address?: string
  status: string
  owner_id?: string
  // Add other fields if returned by API
}

interface PapsPostProps {
  pap: Pap
}

export default function PapsPost({ pap }: PapsPostProps) {
  // Use first image or a placeholder
  const imageUrl = pap.media_urls && pap.media_urls.length > 0
    ? pap.media_urls[0].media_url
    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjBGMEYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='

  return (
    <View style={styles.container}>
      {/* Header: User Info */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder} />
        <View>
          <Text style={styles.username}>User #{pap.owner_id || 'Unknown'}</Text>
          {pap.location_address && (
            <Text style={styles.location}>{pap.location_address}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreIcon}>•••</Text>
        </TouchableOpacity>
      </View>

      
      {/* Description / Caption */}
      <View style={styles.content}>
          <Text style={styles.boldUsername}>{pap.title} </Text>
          <Text style={styles.timestamp}>{pap.status.toUpperCase()}</Text>
      </View>

      {/* Actions Bar */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton}><Text style={styles.actionIcon}>❤️</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><Text style={styles.actionIcon}>💬</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><Text style={styles.actionIcon}>✈️</Text></TouchableOpacity>
        </View>
        
      </View>
      <View style={styles.rightActions}>
           <Text style={styles.priceTag}>
             {pap.payment_amount ? `${pap.payment_amount} ${pap.payment_currency}` : 'TBD'}
           </Text>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderColor : '#7c849a',
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    padding :10,
    width: 200,
    height: 350
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginRight: 10
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#262626'
  },
  location: {
    fontSize: 12,
    color: '#8E8E8E'
  },
  moreButton: {
    marginLeft: 'auto',
    padding: 5
  },
  moreIcon: {
    fontSize: 16,
    color: '#262626'
  },
  media: {
    width: width, // Full width
    height: width, // Square aspect ratio like OG Instagram
    backgroundColor: '#F0F0F0'
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16
  },
  rightActions: {},
  actionButton: {},
  actionIcon: {
    fontSize: 24,
    color: '#262626'
  },
  priceTag: {
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    fontSize: 14
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 16
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    color: '#262626'
  },
  boldUsername: {
    fontWeight: 'bold'
  },
  timestamp: {
    fontSize: 10,
    color: '#8E8E8E',
    marginTop: 6
  }
})