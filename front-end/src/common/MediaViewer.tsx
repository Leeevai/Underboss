/**
 * MediaViewer - Universal media viewer component
 * 
 * Handles display of images, videos, and PDFs from PAPS media
 * Includes fullscreen modal for detailed viewing
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Text,
  Dimensions,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import type { MediaItem, MediaType } from '../serve/common/types';
import { getMediaUrl } from '../serve';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface MediaViewerProps {
  /** Array of media items to display */
  media: MediaItem[];
  /** Size variant for thumbnails */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show as carousel or grid */
  layout?: 'carousel' | 'grid';
  /** Max items to show before "more" indicator */
  maxVisible?: number;
  /** Callback when media count badge is pressed */
  onMorePress?: () => void;
}

interface SingleMediaProps {
  item: MediaItem;
  size: 'small' | 'medium' | 'large';
  onPress: () => void;
}

interface FullscreenViewerProps {
  visible: boolean;
  media: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

// =============================================================================
// SIZE CONFIGURATIONS
// =============================================================================

const SIZES = {
  small: { width: 80, height: 80, borderRadius: 8 },
  medium: { width: 120, height: 120, borderRadius: 12 },
  large: { width: SCREEN_WIDTH - 48, height: 200, borderRadius: 16 },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getMediaIcon(type: MediaType): string {
  switch (type) {
    case 'image': return '🖼️';
    case 'video': return '🎬';
    case 'document': return '📄';
    default: return '📎';
  }
}

function isImage(mimeType?: string): boolean {
  return mimeType?.startsWith('image/') ?? false;
}

function isVideo(mimeType?: string): boolean {
  return mimeType?.startsWith('video/') ?? false;
}

function isPDF(mimeType?: string): boolean {
  return mimeType === 'application/pdf';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =============================================================================
// SINGLE MEDIA THUMBNAIL
// =============================================================================

function SingleMedia({ item, size, onPress }: SingleMediaProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const dimensions = SIZES[size];
  const mediaUrl = getMediaUrl(item.media_url);

  const renderContent = () => {
    if (error) {
      return (
        <View style={[styles.mediaThumbnail, dimensions, styles.errorContainer]}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Failed</Text>
        </View>
      );
    }

    if (item.media_type === 'image' || isImage(item.mime_type)) {
      return (
        <>
          {loading && (
            <View style={[styles.loadingOverlay, dimensions]}>
              <ActivityIndicator color="#3182CE" />
            </View>
          )}
          <Image
            source={{ uri: mediaUrl || '' }}
            style={[styles.mediaThumbnail, dimensions]}
            resizeMode="cover"
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        </>
      );
    }

    if (item.media_type === 'video' || isVideo(item.mime_type)) {
      return (
        <View style={[styles.mediaThumbnail, dimensions, styles.videoThumbnail]}>
          <Text style={styles.mediaTypeIcon}>🎬</Text>
          <Text style={styles.videoLabel}>Video</Text>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
      );
    }

    // PDF / Document
    return (
      <View style={[styles.mediaThumbnail, dimensions, styles.documentThumbnail]}>
        <Text style={styles.documentIcon}>📄</Text>
        <Text style={styles.documentLabel} numberOfLines={1}>
          {isPDF(item.mime_type) ? 'PDF' : 'Document'}
        </Text>
        <Text style={styles.fileSize}>{formatFileSize(item.file_size_bytes)}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.thumbnailWrapper}
    >
      {renderContent()}
      {/* Type badge */}
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{getMediaIcon(item.media_type)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// FULLSCREEN VIEWER
// =============================================================================

function FullscreenViewer({ visible, media, initialIndex, onClose }: FullscreenViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const videoRef = useRef<Video>(null);

  const currentItem = media[currentIndex];
  const mediaUrl = getMediaUrl(currentItem?.media_url);

  const handleOpenExternal = async () => {
    if (mediaUrl) {
      const canOpen = await Linking.canOpenURL(mediaUrl);
      if (canOpen) {
        await Linking.openURL(mediaUrl);
      }
    }
  };

  const renderFullscreenItem = ({ item }: { item: MediaItem }) => {
    const url = getMediaUrl(item.media_url);

    if (item.media_type === 'image' || isImage(item.mime_type)) {
      return (
        <View style={styles.fullscreenItemContainer}>
          <Image
            source={{ uri: url || '' }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </View>
      );
    }

    if (item.media_type === 'video' || isVideo(item.mime_type)) {
      return (
        <View style={styles.fullscreenItemContainer}>
          <Video
            ref={videoRef}
            source={{ uri: url || '' }}
            style={styles.fullscreenVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
          />
        </View>
      );
    }

    // PDF / Document - show in WebView or open externally
    if (Platform.OS === 'web') {
      return (
        <View style={styles.fullscreenItemContainer}>
          <WebView
            source={{ uri: url || '' }}
            style={styles.fullscreenPDF}
          />
        </View>
      );
    }

    // For native, show a preview card with open button
    return (
      <View style={styles.fullscreenItemContainer}>
        <View style={styles.documentPreviewCard}>
          <Text style={styles.documentPreviewIcon}>📄</Text>
          <Text style={styles.documentPreviewTitle}>
            {isPDF(item.mime_type) ? 'PDF Document' : 'Document'}
          </Text>
          <Text style={styles.documentPreviewSize}>
            {formatFileSize(item.file_size_bytes)}
          </Text>
          <TouchableOpacity
            style={styles.openExternalButton}
            onPress={handleOpenExternal}
          >
            <Text style={styles.openExternalText}>Open in Browser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.fullscreenOverlay}>
        {/* Header */}
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>
            {currentIndex + 1} / {media.length}
          </Text>
          <TouchableOpacity onPress={handleOpenExternal} style={styles.externalButton}>
            <Text style={styles.externalButtonText}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <FlatList
          ref={flatListRef}
          data={media}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(newIndex);
          }}
          renderItem={renderFullscreenItem}
          keyExtractor={(item) => item.media_id}
        />

        {/* Thumbnail strip */}
        {media.length > 1 && (
          <View style={styles.thumbnailStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {media.map((item, index) => (
                <TouchableOpacity
                  key={item.media_id}
                  onPress={() => {
                    setCurrentIndex(index);
                    flatListRef.current?.scrollToIndex({ index, animated: true });
                  }}
                  style={[
                    styles.stripThumbnail,
                    currentIndex === index && styles.stripThumbnailActive,
                  ]}
                >
                  {item.media_type === 'image' ? (
                    <Image
                      source={{ uri: getMediaUrl(item.media_url) || '' }}
                      style={styles.stripThumbnailImage}
                    />
                  ) : (
                    <View style={styles.stripThumbnailPlaceholder}>
                      <Text>{getMediaIcon(item.media_type)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MediaViewer({
  media,
  size = 'medium',
  layout = 'carousel',
  maxVisible = 4,
  onMorePress,
}: MediaViewerProps) {
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!media || media.length === 0) {
    return null;
  }

  const handleMediaPress = (index: number) => {
    setSelectedIndex(index);
    setFullscreenVisible(true);
  };

  const visibleMedia = media.slice(0, maxVisible);
  const remainingCount = media.length - maxVisible;

  if (layout === 'grid') {
    return (
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          {visibleMedia.map((item, index) => (
            <View key={item.media_id} style={styles.gridItem}>
              <SingleMedia
                item={item}
                size={size}
                onPress={() => handleMediaPress(index)}
              />
              {/* Show "more" overlay on last visible item */}
              {index === maxVisible - 1 && remainingCount > 0 && (
                <Pressable
                  style={[styles.moreOverlay, SIZES[size]]}
                  onPress={onMorePress || (() => handleMediaPress(index))}
                >
                  <Text style={styles.moreText}>+{remainingCount}</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        <FullscreenViewer
          visible={fullscreenVisible}
          media={media}
          initialIndex={selectedIndex}
          onClose={() => setFullscreenVisible(false)}
        />
      </View>
    );
  }

  // Carousel layout
  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
      >
        {visibleMedia.map((item, index) => (
          <View key={item.media_id} style={styles.carouselItem}>
            <SingleMedia
              item={item}
              size={size}
              onPress={() => handleMediaPress(index)}
            />
          </View>
        ))}
        {remainingCount > 0 && (
          <Pressable
            style={[styles.moreCard, SIZES[size]]}
            onPress={onMorePress || (() => handleMediaPress(maxVisible - 1))}
          >
            <Text style={styles.moreCardText}>+{remainingCount}</Text>
            <Text style={styles.moreCardLabel}>more</Text>
          </Pressable>
        )}
      </ScrollView>

      <FullscreenViewer
        visible={fullscreenVisible}
        media={media}
        initialIndex={selectedIndex}
        onClose={() => setFullscreenVisible(false)}
      />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Thumbnail styles
  thumbnailWrapper: {
    position: 'relative',
  },
  mediaThumbnail: {
    overflow: 'hidden',
  },
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    zIndex: 1,
  },
  errorContainer: {
    backgroundColor: '#FED7D7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 10,
    color: '#C53030',
    fontWeight: '600',
  },

  // Video thumbnail
  videoThumbnail: {
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTypeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  videoLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  playButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: '#2D3748',
    marginLeft: 3,
  },

  // Document thumbnail
  documentThumbnail: {
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  documentIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  documentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A5568',
  },
  fileSize: {
    fontSize: 9,
    color: '#718096',
    marginTop: 2,
  },

  // Type badge
  typeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
  },

  // Carousel layout
  carouselContainer: {},
  carouselContent: {
    paddingHorizontal: 4,
    gap: 10,
  },
  carouselItem: {
    marginRight: 0,
  },

  // Grid layout
  gridContainer: {},
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    position: 'relative',
  },

  // More overlay/card
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  moreCard: {
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCardText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4A5568',
  },
  moreCardLabel: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },

  // Fullscreen styles
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
  },
  pageIndicator: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  externalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  externalButtonText: {
    color: '#fff',
    fontSize: 18,
  },

  // Fullscreen items
  fullscreenItemContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
  },
  fullscreenVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 250,
  },
  fullscreenPDF: {
    width: SCREEN_WIDTH - 20,
    height: SCREEN_HEIGHT - 200,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Document preview card
  documentPreviewCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    width: SCREEN_WIDTH - 80,
  },
  documentPreviewIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  documentPreviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  documentPreviewSize: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 24,
  },
  openExternalButton: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openExternalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Thumbnail strip
  thumbnailStrip: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  stripThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginHorizontal: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stripThumbnailActive: {
    borderColor: '#3182CE',
  },
  stripThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  stripThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4A5568',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
