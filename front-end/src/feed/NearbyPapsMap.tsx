/**
 * NearbyPapsMap - Mini map showing nearby job locations
 * 
 * Uses OpenStreetMap via WebView (completely free, no API key needed).
 * Tapping a marker expands the job details similar to feed posts.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Paps, PapsDetail } from '../serve/paps';
import type { MediaItem } from '../serve/common/types';
import { serv } from '../serve';
import { useTheme, BRAND, createShadow } from '../common/theme';
import { useAvatarUrl } from '../cache/profiles';
import MediaViewer from '../common/MediaViewer';

const MAP_HEIGHT = 280;

// =============================================================================
// TYPES
// =============================================================================

interface NearbyPapsMapProps {
  paps: Paps[];
  loading?: boolean;
  userLocation?: { latitude: number; longitude: number };
}

interface PapLocation {
  pap: Paps;
  latitude: number;
  longitude: number;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPaymentType = (type: string) => {
  switch (type) {
    case 'hourly': return '/hr';
    case 'negotiable': return '(negotiable)';
    default: return '';
  }
};

// =============================================================================
// GENERATE LEAFLET HTML
// =============================================================================

function generateMapHtml(
  papsWithLocation: PapLocation[],
  center: { lat: number; lng: number },
  zoom: number,
  isDark: boolean,
  primaryColor: string
): string {
  const markersJson = JSON.stringify(
    papsWithLocation.map((item) => ({
      id: item.pap.id,
      lat: item.latitude,
      lng: item.longitude,
      title: item.pap.title,
      payment: formatCurrency(item.pap.payment_amount, item.pap.payment_currency),
    }))
  );

  // Use CartoDB tiles (free, no API key)
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .custom-marker {
      background: ${primaryColor};
      border: 3px solid white;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 8px;
    }
    .popup-title {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 2px;
    }
    .popup-payment {
      color: ${primaryColor};
      font-weight: 700;
      font-size: 14px;
    }
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
    }
    .leaflet-control-zoom a {
      background: ${isDark ? '#2d3748' : '#fff'} !important;
      color: ${isDark ? '#e2e8f0' : '#333'} !important;
      border: none !important;
    }
    .leaflet-control-zoom a:hover {
      background: ${isDark ? '#4a5568' : '#f0f0f0'} !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const markers = ${markersJson};
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${center.lat}, ${center.lng}], ${zoom});
    
    // Position zoom control on bottom right
    map.zoomControl.setPosition('bottomright');
    
    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: '',
      html: '<div class="custom-marker">💼</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });

    markers.forEach(m => {
      const marker = L.marker([m.lat, m.lng], { icon: markerIcon }).addTo(map);
      marker.bindPopup('<div class="popup-title">' + m.title + '</div><div class="popup-payment">' + m.payment + '</div>');
      marker.on('click', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', id: m.id }));
      });
    });

    // Fit bounds if multiple markers, otherwise zoom to single marker
    if (markers.length > 1) {
      const group = L.featureGroup(markers.map(m => L.marker([m.lat, m.lng])));
      map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 12 });
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13);
    }
  </script>
</body>
</html>
  `.trim();
}

// =============================================================================
// SELECTED PAP MODAL (Similar to PapsPost modal)
// =============================================================================

function SelectedPapModal({
  pap,
  visible,
  onClose,
}: {
  pap: Paps | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<PapsDetail | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const { avatarUrl } = useAvatarUrl(pap?.owner_username);

  // Fetch detailed info when modal opens
  React.useEffect(() => {
    if (visible && pap?.id) {
      setLoadingDetail(true);
      Promise.all([
        serv('paps.get', { paps_id: pap.id }),
        serv('paps.media.list', { paps_id: pap.id }),
      ])
        .then(([detailRes, mediaRes]) => {
          setDetail(detailRes);
          setMediaItems(mediaRes.media || []);
        })
        .catch((err) => console.error('Error fetching pap details:', err))
        .finally(() => setLoadingDetail(false));
    }
  }, [visible, pap?.id]);

  if (!pap) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.background }]}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.card }]} edges={['bottom']}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <View style={[styles.modalDragIndicator, { backgroundColor: colors.borderDark }]} />
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Job Details</Text>
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.backgroundTertiary }]}
              onPress={onClose}
            >
              <Text style={[styles.modalCloseBtnText, { color: colors.textTertiary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {loadingDetail ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading job details...</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Media Gallery */}
              {mediaItems.length > 0 && (
                <View style={styles.mediaSection}>
                  <MediaViewer
                    media={mediaItems}
                    layout="grid"
                    maxVisible={5}
                  />
                </View>
              )}

              {/* Quick Info Boxes */}
              <View style={styles.infoBoxRow}>
                <View style={[styles.infoBox, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
                  <Text style={styles.infoBoxIcon}>💰</Text>
                  <Text style={[styles.infoBoxLabel, { color: colors.primary }]}>Payment</Text>
                  <Text style={[styles.infoBoxValue, { color: colors.text }]}>
                    {formatCurrency(pap.payment_amount, pap.payment_currency)}
                  </Text>
                  <Text style={[styles.infoBoxSub, { color: colors.textTertiary }]}>
                    {formatPaymentType(pap.payment_type)}
                  </Text>
                </View>
                
                <View style={[styles.infoBox, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
                  <Text style={styles.infoBoxIcon}>📍</Text>
                  <Text style={[styles.infoBoxLabel, { color: colors.primary }]}>Location</Text>
                  <Text style={[styles.infoBoxValue, { color: colors.text }]} numberOfLines={2}>
                    {pap.location_address || 'Remote'}
                  </Text>
                </View>
                
                <View style={[styles.infoBox, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
                  <Text style={styles.infoBoxIcon}>👥</Text>
                  <Text style={[styles.infoBoxLabel, { color: colors.primary }]}>Openings</Text>
                  <Text style={[styles.infoBoxValue, { color: colors.text }]}>
                    {pap.max_assignees || 1}
                  </Text>
                </View>
              </View>

              {/* Owner Info */}
              <View style={[styles.ownerSection, { backgroundColor: colors.backgroundTertiary }]}>
                <View style={[styles.ownerAvatar, { backgroundColor: colors.border }]}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.ownerAvatarImage} />
                  ) : (
                    <Text style={[styles.ownerAvatarInitial, { color: colors.textSecondary }]}>
                      {pap.owner_username?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={[styles.ownerName, { color: colors.text }]}>
                    {pap.owner_username || 'Unknown'}
                  </Text>
                  <Text style={[styles.ownerLabel, { color: colors.textSecondary }]}>Job Poster</Text>
                </View>
              </View>

              {/* Title & Description */}
              <View style={styles.contentSection}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{pap.title}</Text>
                {pap.subtitle && (
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{pap.subtitle}</Text>
                )}
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {pap.description}
                </Text>
              </View>

              {/* Categories */}
              {detail?.categories && detail.categories.length > 0 && (
                <View style={styles.categoriesSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Categories</Text>
                  <View style={styles.categoriesRow}>
                    {detail.categories.map((cat, idx) => (
                      <View 
                        key={idx} 
                        style={[styles.categoryChip, { backgroundColor: colors.primary + '20' }]}
                      >
                        <Text style={[styles.categoryChipText, { color: colors.primary }]}>
                          {cat.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function NearbyPapsMap({
  paps,
  loading = false,
  userLocation,
}: NearbyPapsMapProps) {
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [selectedPap, setSelectedPap] = useState<Paps | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Filter paps that have valid coordinates
  const papsWithLocation: PapLocation[] = useMemo(() => {
    return paps
      .filter((pap) => 
        pap.location_lat != null && 
        pap.location_lng != null &&
        !isNaN(pap.location_lat) &&
        !isNaN(pap.location_lng)
      )
      .map((pap) => ({
        pap,
        latitude: pap.location_lat!,
        longitude: pap.location_lng!,
      }));
  }, [paps]);

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (userLocation) {
      return { lat: userLocation.latitude, lng: userLocation.longitude };
    }

    if (papsWithLocation.length === 0) {
      return { lat: 46.6034, lng: 2.3488 }; // France center
    }

    const latSum = papsWithLocation.reduce((sum, p) => sum + p.latitude, 0);
    const lngSum = papsWithLocation.reduce((sum, p) => sum + p.longitude, 0);
    return {
      lat: latSum / papsWithLocation.length,
      lng: lngSum / papsWithLocation.length,
    };
  }, [papsWithLocation, userLocation]);

  // Generate HTML for the map
  const mapHtml = useMemo(() => {
    // Calculate zoom: use 10 for single marker, 5 for multiple spread out
    const defaultZoom = papsWithLocation.length === 1 ? 13 : 5;
    return generateMapHtml(papsWithLocation, mapCenter, defaultZoom, isDark, BRAND.primary);
  }, [papsWithLocation, mapCenter, isDark]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker_click') {
        const pap = paps.find((p) => p.id === data.id);
        if (pap) {
          setSelectedPap(pap);
          setModalVisible(true);
        }
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  }, [paps]);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedPap(null);
  }, []);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingState, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingStateText, { color: colors.textSecondary }]}>Loading map...</Text>
      </View>
    );
  }

  // No locations available
  if (papsWithLocation.length === 0) {
    return (
      <View style={[styles.container, styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.emptyIcon}>🗺️</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No nearby jobs with locations
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, createShadow(3, isDark)]}>
        {/* Map Header */}
        <View style={[styles.mapHeader, { backgroundColor: colors.card }]}>
          <Text style={[styles.mapHeaderTitle, { color: colors.text }]}>📍 Nearby Jobs</Text>
          <Text style={[styles.mapHeaderCount, { color: colors.primary }]}>
            {papsWithLocation.length} job{papsWithLocation.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* OpenStreetMap via WebView */}
        <WebView
          ref={webViewRef}
          style={styles.map}
          source={{ html: mapHtml }}
          onMessage={handleMessage}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="compatibility"
        />

        {/* Hint overlay */}
        <View style={[styles.hintOverlay, { backgroundColor: colors.card + 'CC' }]}>
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            Tap a marker to view job details
          </Text>
        </View>
      </View>

      {/* Selected Pap Modal */}
      <SelectedPapModal
        pap={selectedPap}
        visible={modalVisible}
        onClose={handleCloseModal}
      />
    </>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mapHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  mapHeaderCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    height: MAP_HEIGHT,
  },
  loadingState: {
    height: MAP_HEIGHT + 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingStateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  hintOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalDragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Media
  mediaSection: {
    marginBottom: 16,
  },

  // Info boxes
  infoBoxRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBoxIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  infoBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoBoxValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoBoxSub: {
    fontSize: 11,
    marginTop: 2,
  },

  // Owner
  ownerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  ownerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  ownerAvatarInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  ownerInfo: {
    marginLeft: 12,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  ownerLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  // Content
  contentSection: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Categories
  categoriesSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
