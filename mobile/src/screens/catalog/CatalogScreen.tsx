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
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { API_BASE_URL, ENDPOINTS } from '../../constants';
import { BnplCatalogItem } from '../../types';
import AdBanner from '../../components/AdBanner';
import { colors, layout } from '../../ui/theme';

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

  const formatPrice = (price: number | string) => `₦${Number(price || 0).toLocaleString()}`;

  const renderItem = ({ item }: { item: BnplCatalogItem }) => {
    const uri = getImageUrl(item);
    return (
      <TouchableOpacity
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`View payment plans for ${item.name}, ${formatPrice(item.price)}`}
        onPress={() => navigation.navigate('PlanSelection', { catalogItem: item })}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.placeholder]}>
            <Ionicons name="image-outline" size={30} color={colors.muted} />
            <Text style={styles.placeholderText}>Product image unavailable</Text>
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
          <View style={styles.cardActionRow}><Text style={styles.cardAction}>Choose a payment plan</Text><Ionicons name="arrow-forward" size={18} color={colors.brand} /></View>
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
        ListHeaderComponent={<View style={styles.intro}><Text style={styles.introTitle}>Shop at your pace</Text><Text style={styles.introText}>Choose an item, then pick the payment plan that works for you.</Text></View>}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="bag-handle-outline" size={38} color={colors.muted} />
            <Text style={styles.emptyText}>Nothing to shop yet</Text>
            <Text style={styles.emptyHint}>Pull down to check for newly available items.</Text>
          </View>
        }
        ListFooterComponent={<AdBanner />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { padding: layout.pagePadding, paddingBottom: 32 },
  intro: { marginBottom: 18 }, introTitle: { color: colors.text, fontSize: 24, fontWeight: '800' }, introText: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 5 },
  card: {
    backgroundColor: '#fff',
    borderRadius: layout.radius,
    marginBottom: 16,
    overflow: 'hidden',
    ...layout.shadow,
  },
  cardImage: { width: '100%', height: 184, backgroundColor: '#EAF0F5' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: colors.muted, fontSize: 14, marginTop: 6 },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardDescription: { fontSize: 14, color: colors.muted, marginBottom: 10, lineHeight: 20 },
  cardPrice: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 12 },
  cardActionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 28 }, cardAction: { fontSize: 14, fontWeight: '700', color: colors.brand },
  emptyText: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 10 }, emptyHint: { color: colors.muted, fontSize: 14, marginTop: 4, textAlign: 'center' },
});
