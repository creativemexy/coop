import { Linking, StyleSheet, Text, View } from 'react-native';

/**
 * "Design by Kobolabs Limited" credit line for the mobile app.
 * Used at the bottom of auth screens and the profile/about section.
 */
export default function DesignCredit({ light = false }: { light?: boolean }) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.text, light && styles.textLight]}>
        Design by{' '}
        <Text
          style={[styles.link, light && styles.linkLight]}
          onPress={() => Linking.openURL('https://www.kobolabs.com')}
          accessibilityRole="link"
          accessibilityLabel="Kobolabs Limited website"
        >
          Kobolabs Limited
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 24, marginBottom: 8, paddingHorizontal: 16 },
  text: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  textLight: { color: 'rgba(255,255,255,0.7)' },
  link: { color: '#173F38', fontWeight: '700', textDecorationLine: 'underline' },
  linkLight: { color: '#F7D674' },
});