import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import client from '../../api/client';
import { API_BASE_URL, ENDPOINTS } from '../../constants';
import { BnplCatalogItem } from '../../types';
import AdBanner from '../../components/AdBanner';

function getImageUrl(item: BnplCatalogItem): string | null {
  const raw = item.imageUrl ?? item.images?.[0]?.url ?? null;
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return `${API_BASE_URL}${raw}`;
  return `${API_BASE_URL}/${raw}`;
}

export default function CatalogScreen({ navigation }: { navigation: any }) {
  const [items, setItems] = useState<BnplCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCatalog = async () => {
    try {
      const { data } = await client.get(ENDPOINTS.catalog);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCatalog();
  };

  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

  const renderItem = ({ item }: { item: BnplCatalogItem }) => {
    const uri = getImageUrl(item);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PlanSelection', { catalogItem: item })}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.placeholder]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.cardAction}>View Plans →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a1a2e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No catalog items available</Text>
          </View>
        }
        ListFooterComponent={<AdBanner />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: { width: '100%', height: 180, backgroundColor: '#e0e0e0' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#999', fontSize: 14 },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 8, lineHeight: 20 },
  cardPrice: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  cardAction: { fontSize: 14, fontWeight: '600', color: '#4a90d9' },
  emptyText: { fontSize: 16, color: '#999' },
});
