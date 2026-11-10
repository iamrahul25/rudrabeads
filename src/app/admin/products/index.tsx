import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AdminPage, Badge, Button, ConfirmButton, Empty, Loading, Notice, Panel, adminStyles } from '@/components/admin/ui';
import { Chip } from '@/components/Chip';
import { ProductImage } from '@/components/ProductImage';
import { useAdmin } from '@/context/AdminContext';
import { useCatalog } from '@/context/CatalogContext';
import { formatINR } from '@/data/products';
import { useAdminResource } from '@/hooks/useAdminResource';
import { deleteProduct, fetchAdminCatalog } from '@/lib/adminApi';
import { errorMessage } from '@/lib/api';
import { normalizeText } from '@/lib/search';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export default function AdminProducts() {
  const { run } = useAdmin();
  const storefront = useCatalog();
  const { data, setData, error, loading, reload } = useAdminResource('admin-catalog', fetchAdminCatalog);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const products = useMemo(() => {
    if (!data) return [];
    const q = normalizeText(search);
    return data.products.filter(
      (p) =>
        (!categoryId || p.categoryId === categoryId) &&
        (!q || normalizeText(`${p.name} ${p.sku} ${p.id}`).includes(q)),
    );
  }, [data, search, categoryId]);

  const remove = async (id: string, name: string) => {
    setDeleting(id);
    setMessage(null);
    try {
      await run((token) => deleteProduct(token, id));
      setData((prev) => (prev ? { ...prev, products: prev.products.filter((p) => p.id !== id) } : prev));
      setMessage({ tone: 'success', text: `“${name}” was deleted.` });
      storefront.refresh();
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminPage
      title="Products"
      subtitle={data ? `${data.products.length} products in ${data.categories.length} categories` : undefined}
      onRefresh={reload}
      actions={
        <>
          <Button label="Refresh" icon="refresh" variant="outline" onPress={reload} busy={loading} />
          <Button
            label="Add product"
            icon="add"
            onPress={() => router.push({ pathname: '/admin/products/[id]', params: { id: 'new' } })}
          />
        </>
      }
    >
      <Panel>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or SKU"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel="Search products"
          />
        </View>
        {data ? (
          <View style={adminStyles.row}>
            <Chip label="All categories" selected={!categoryId} onPress={() => setCategoryId(null)} />
            {data.categories.map((c) => (
              <Chip
                key={c.id}
                label={`${c.name} (${c.count})`}
                selected={categoryId === c.id}
                onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
              />
            ))}
          </View>
        ) : null}
      </Panel>

      <Notice tone="error" message={error} />
      <Notice tone={message?.tone ?? 'success'} message={message?.text ?? null} />

      <Panel title={data ? `${products.length} shown` : undefined}>
        {!data && loading ? <Loading /> : null}
        {data && !products.length ? <Empty icon="pricetags-outline" message="No products match." /> : null}
        {products.map((p) => (
          <View key={p.id} style={styles.row}>
            <ProductImage source={p.images[0]} style={styles.thumb} compact />
            <View style={styles.main}>
              <Text style={adminStyles.strong} numberOfLines={2}>
                {p.name}
              </Text>
              <Text style={adminStyles.muted} numberOfLines={1}>
                {p.sku || p.id} · {p.category} · {p.images.length} {p.images.length === 1 ? 'image' : 'images'}
              </Text>
              <View style={adminStyles.row}>
                <Text style={styles.price}>
                  {formatINR(p.price)}
                  {p.price != null && p.priceUnit ? ` / ${p.priceUnit}` : ''}
                </Text>
                {p.minOrderQty ? <Badge label={`MOQ ${p.minOrderQty} ${p.minOrderUnit ?? ''}`.trim()} /> : null}
                {!p.inStock ? <Badge label="Out of stock" tone="danger" /> : null}
                {p.featured ? <Badge label="Featured" tone="success" /> : null}
              </View>
            </View>
            <View style={styles.actions}>
              <Button
                label="Edit"
                icon="create-outline"
                variant="outline"
                onPress={() => router.push({ pathname: '/admin/products/[id]', params: { id: p.id } })}
              />
              <ConfirmButton
                label="Delete"
                confirmLabel="Confirm delete"
                icon="trash-outline"
                busy={deleting === p.id}
                onConfirm={() => remove(p.id, p.name)}
              />
            </View>
          </View>
        ))}
      </Panel>
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.text, paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  thumb: { width: 64, height: 64, borderRadius: radii.sm, backgroundColor: colors.surface },
  main: { flex: 1, minWidth: 200, gap: 4 },
  price: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
