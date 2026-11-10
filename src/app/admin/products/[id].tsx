import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ImageManager, type ManagedImage } from '@/components/admin/ImageManager';
import { AdminPage, Button, ConfirmButton, Loading, Notice, Panel, adminStyles } from '@/components/admin/ui';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { useAdmin } from '@/context/AdminContext';
import { useCatalog } from '@/context/CatalogContext';
import { useAdminResource } from '@/hooks/useAdminResource';
import { useUploadCleanup } from '@/hooks/useUploadCleanup';
import { deleteProduct, fetchAdminCatalog, saveProduct } from '@/lib/adminApi';
import { errorMessage } from '@/lib/api';
import type { ApiCategory, ApiProduct, ApiProductInput } from '@/shared/api';
import { MAX_LINE_QTY } from '@/shared/orders';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const MAX_IMAGES = 12;
const UNIT_SUGGESTIONS = ['Piece', 'Pack', 'Pair', 'Set', 'Gram', 'Carat', 'Oz'];

const DETAIL_FIELDS = [
  ['origin', 'Origin', 'e.g. Nepal'],
  ['beadSize', 'Bead size', 'e.g. 9 mm'],
  ['certification', 'Certification', 'e.g. Lab Certified'],
  ['labName', 'Lab name', 'e.g. IGL'],
  ['treatment', 'Treatment', 'e.g. Natural'],
  ['rulingDeity', 'Ruling deity', 'e.g. Kalagni Rudra'],
  ['rulingPlanet', 'Ruling planet', 'e.g. Jupiter'],
  ['usage', 'Usage', 'e.g. Meditation, Wearing'],
  ['shape', 'Shape', 'e.g. Round'],
  ['color', 'Color', 'e.g. Brown'],
  ['material', 'Material', 'e.g. Rudraksha seed'],
] as const;

type DetailKey = (typeof DETAIL_FIELDS)[number][0];

type SpecRow = { id: number; label: string; value: string };

type Form = {
  name: string;
  categoryId: string;
  sku: string;
  price: string;
  priceUnit: string;
  minOrderQty: string;
  minOrderUnit: string;
  mukhi: string;
  description: string;
  inStock: boolean;
  featured: boolean;
  specs: SpecRow[];
  images: ManagedImage[];
} & Record<DetailKey, string>;

let nextSpecId = 1;
const specRow = (label = '', value = ''): SpecRow => ({ id: nextSpecId++, label, value });

const text = (value: string | number | null | undefined) => (value == null ? '' : String(value));

function formFromProduct(product: ApiProduct | null, categoryId: string): Form {
  const details = Object.fromEntries(DETAIL_FIELDS.map(([key]) => [key, text(product?.[key])])) as Record<DetailKey, string>;
  return {
    name: product?.name ?? '',
    categoryId: product?.categoryId ?? categoryId,
    sku: product?.sku ?? '',
    price: text(product?.price),
    priceUnit: product ? text(product.priceUnit) : 'Piece',
    minOrderQty: text(product?.minOrderQty),
    minOrderUnit: text(product?.minOrderUnit),
    mukhi: text(product?.mukhi),
    description: product?.description ?? '',
    inStock: product?.inStock ?? true,
    featured: product?.featured ?? false,
    specs: Object.entries(product?.specs ?? {}).map(([label, value]) => specRow(label, value)),
    images: (product?.imageKeys ?? []).map((key, index) => ({ key, url: product!.images[index] })),
    ...details,
  };
}

const orNull = (value: string) => value.trim() || null;

/** Returns an error message, or the request body. */
function toInput(form: Form): string | ApiProductInput {
  const whole = (value: string, label: string, min: number, max: number) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^\d+$/.test(trimmed)) return `${label} must be a whole number.`;
    const n = Number(trimmed);
    if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
    return n;
  };
  if (form.name.trim().length < 2) return 'Enter a product name.';
  if (!form.categoryId) return 'Choose a category.';
  const price = whole(form.price, 'Price', 0, 10_000_000);
  if (typeof price === 'string') return price;
  const minOrderQty = whole(form.minOrderQty, 'Minimum order quantity', 1, MAX_LINE_QTY);
  if (typeof minOrderQty === 'string') return minOrderQty;
  const mukhi = whole(form.mukhi, 'Mukhi', 1, 30);
  if (typeof mukhi === 'string') return mukhi;

  const specs: Record<string, string> = {};
  for (const row of form.specs) {
    const label = row.label.trim();
    const value = row.value.trim();
    if (!label && !value) continue;
    if (!label) return 'Every specification needs a name.';
    if (specs[label] !== undefined) return `The specification “${label}” is listed twice.`;
    if (value) specs[label] = value;
  }

  return {
    name: form.name.trim(),
    categoryId: form.categoryId,
    sku: orNull(form.sku),
    price,
    priceUnit: orNull(form.priceUnit),
    minOrderQty,
    minOrderUnit: minOrderQty == null ? null : orNull(form.minOrderUnit),
    mukhi,
    origin: orNull(form.origin),
    beadSize: orNull(form.beadSize),
    certification: orNull(form.certification),
    labName: orNull(form.labName),
    treatment: orNull(form.treatment),
    rulingDeity: orNull(form.rulingDeity),
    rulingPlanet: orNull(form.rulingPlanet),
    usage: orNull(form.usage),
    shape: orNull(form.shape),
    color: orNull(form.color),
    material: orNull(form.material),
    specs,
    description: form.description.trim(),
    images: form.images.map((image) => image.key),
    inStock: form.inStock,
    featured: form.featured,
  };
}

export default function AdminProductScreen() {
  const params = useLocalSearchParams<{ id: string; saved?: string }>();
  const id = String(params.id);
  const isNew = id === 'new';
  const { data, error, loading } = useAdminResource(`admin-catalog-${id}`, fetchAdminCatalog);

  if (!data) {
    return (
      <AdminPage title={isNew ? 'Add product' : 'Edit product'}>
        {loading ? <Loading /> : <Notice tone="error" message={error} />}
      </AdminPage>
    );
  }

  const product = isNew ? null : (data.products.find((p) => p.id === id) ?? null);
  if (!isNew && !product) {
    return (
      <AdminPage title="Edit product">
        <Notice tone="error" message="This product no longer exists." />
        <Button label="Back to products" variant="outline" icon="arrow-back" onPress={() => router.replace('/admin/products')} />
      </AdminPage>
    );
  }

  return (
    <ProductEditor
      key={product?.id ?? 'new'}
      product={product}
      categories={data.categories}
      justSaved={params.saved === '1'}
    />
  );
}

function ProductEditor({
  product,
  categories,
  justSaved,
}: {
  product: ApiProduct | null;
  categories: ApiCategory[];
  justSaved: boolean;
}) {
  const { run } = useAdmin();
  const storefront = useCatalog();
  const uploads = useUploadCleanup();
  const [form, setForm] = useState(() => formFromProduct(product, categories[0]?.id ?? ''));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(
    justSaved ? { tone: 'success', text: 'Product added. It appears in the app within a minute.' } : null,
  );

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    const input = toInput(form);
    if (typeof input === 'string') {
      setMessage({ tone: 'error', text: input });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const { product: saved } = await run((token) => saveProduct(token, product?.id ?? null, input));
      uploads.settle(saved.imageKeys);
      storefront.refresh();
      if (!product) {
        router.replace({ pathname: '/admin/products/[id]', params: { id: saved.id, saved: '1' } });
        return;
      }
      setForm(formFromProduct(saved, saved.categoryId));
      setMessage({ tone: 'success', text: 'Changes saved. They appear in the app within a minute.' });
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      await run((token) => deleteProduct(token, product.id));
      storefront.refresh();
      router.replace('/admin/products');
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
      setDeleting(false);
    }
  };

  const actions = (
    <>
      <Button label="Products" variant="ghost" icon="arrow-back" onPress={() => router.push('/admin/products')} />
      {product ? (
        <Button
          label="View in store"
          variant="outline"
          icon="open-outline"
          onPress={() => router.push(`/product/${product.id}`)}
        />
      ) : null}
      <Button label={product ? 'Save changes' : 'Add product'} icon="save-outline" onPress={save} busy={saving} />
    </>
  );

  return (
    <AdminPage
      title={product ? product.name : 'Add product'}
      subtitle={product ? `ID ${product.id} · SKU ${product.sku || '—'}` : 'Fill in the details and add at least one image.'}
      actions={actions}
    >
      <Notice tone={message?.tone ?? 'success'} message={message?.text ?? null} />

      <View style={styles.columns}>
        <View style={styles.wide}>
          <Panel title="Basics">
            <TextField
              label="Product name"
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="e.g. 5 Mukhi Nepali Rudraksha"
              maxLength={120}
            />
            <Text style={adminStyles.label}>Category</Text>
            {categories.length ? (
              <View style={adminStyles.row}>
                {categories.map((c) => (
                  <Chip key={c.id} label={c.name} selected={form.categoryId === c.id} onPress={() => set('categoryId', c.id)} />
                ))}
              </View>
            ) : (
              <Notice tone="info" message="Create a category first on the Categories page." />
            )}
            <TextField
              label="Description"
              value={form.description}
              onChangeText={(v) => set('description', v)}
              placeholder="What the customer should know about this product"
              multiline
              maxLength={5000}
              style={styles.top}
            />
          </Panel>

          <Panel title="Images">
            <ImageManager
              images={form.images}
              onChange={(images) => set('images', images)}
              onUploaded={(image) => uploads.track(image.key)}
              max={MAX_IMAGES}
            />
          </Panel>

          <Panel title="Pricing & quantity">
            <View style={styles.fields}>
              <TextField
                label="Price (₹)"
                optional
                value={form.price}
                onChangeText={(v) => set('price', v.replace(/\D/g, ''))}
                placeholder="Leave empty for “Price on request”"
                keyboardType="number-pad"
                inputMode="numeric"
                style={styles.field}
              />
              <TextField
                label="Price unit"
                optional
                value={form.priceUnit}
                onChangeText={(v) => set('priceUnit', v)}
                placeholder="Piece"
                maxLength={20}
                style={styles.field}
              />
            </View>
            <View style={adminStyles.row}>
              {UNIT_SUGGESTIONS.map((unit) => (
                <Chip key={unit} label={unit} selected={form.priceUnit === unit} onPress={() => set('priceUnit', unit)} />
              ))}
            </View>
            <View style={[styles.fields, styles.top]}>
              <TextField
                label="Minimum order quantity (MOQ)"
                optional
                value={form.minOrderQty}
                onChangeText={(v) => set('minOrderQty', v.replace(/\D/g, ''))}
                placeholder="Empty = no minimum"
                keyboardType="number-pad"
                inputMode="numeric"
                style={styles.field}
              />
              <TextField
                label="MOQ unit"
                optional
                value={form.minOrderUnit}
                onChangeText={(v) => set('minOrderUnit', v)}
                placeholder="Piece"
                maxLength={20}
                style={styles.field}
              />
            </View>
            <Text style={adminStyles.muted}>
              Customers can’t order fewer than the MOQ, and the cart starts at this quantity.
            </Text>
          </Panel>
        </View>

        <View style={styles.narrow}>
          <Panel title="Visibility">
            <Toggle
              label="In stock"
              hint="Out-of-stock products are shown but can’t be ordered."
              value={form.inStock}
              onChange={(v) => set('inStock', v)}
            />
            <Toggle
              label="Featured"
              hint="Featured products are shown first under Popular Products."
              value={form.featured}
              onChange={(v) => set('featured', v)}
            />
          </Panel>

          <Panel title="Details">
            <TextField
              label="SKU"
              optional
              value={form.sku}
              onChangeText={(v) => set('sku', v)}
              placeholder="Created automatically if empty"
              maxLength={40}
            />
            <TextField
              label="Mukhi"
              optional
              value={form.mukhi}
              onChangeText={(v) => set('mukhi', v.replace(/\D/g, ''))}
              placeholder="e.g. 5"
              keyboardType="number-pad"
              inputMode="numeric"
            />
            {DETAIL_FIELDS.map(([key, label, placeholder]) => (
              <TextField
                key={key}
                label={label}
                optional
                value={form[key]}
                onChangeText={(v) => set(key, v)}
                placeholder={placeholder}
                maxLength={key === 'usage' ? 200 : 80}
              />
            ))}
          </Panel>

          <Panel
            title="Specifications"
            right={<Button label="Add" icon="add" variant="ghost" onPress={() => set('specs', [...form.specs, specRow()])} />}
          >
            {form.specs.length === 0 ? (
              <Text style={adminStyles.muted}>Shown as a table on the product page, e.g. “Fitting Type: Loose Bead”.</Text>
            ) : null}
            {form.specs.map((row) => (
              <View key={row.id} style={styles.spec}>
                <TextField
                  label="Name"
                  value={row.label}
                  onChangeText={(v) => set('specs', form.specs.map((r) => (r.id === row.id ? { ...r, label: v } : r)))}
                  maxLength={60}
                  style={styles.specField}
                />
                <TextField
                  label="Value"
                  value={row.value}
                  onChangeText={(v) => set('specs', form.specs.map((r) => (r.id === row.id ? { ...r, value: v } : r)))}
                  maxLength={300}
                  style={styles.specField}
                />
                <Button
                  label="Remove"
                  variant="ghost"
                  icon="close"
                  accessibilityLabel={`Remove ${row.label || 'specification'}`}
                  onPress={() => set('specs', form.specs.filter((r) => r.id !== row.id))}
                />
              </View>
            ))}
          </Panel>

          {product ? (
            <Panel title="Delete product">
              <Text style={adminStyles.muted}>
                Removes the product and its images. Past orders keep the product name and price.
              </Text>
              <ConfirmButton label="Delete product" confirmLabel="Tap again to delete" icon="trash-outline" busy={deleting} onConfirm={remove} />
            </Panel>
          ) : null}
        </View>
      </View>

      <View style={adminStyles.row}>{actions}</View>
    </AdminPage>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <Pressable style={styles.toggleText} onPress={() => onChange(!value)} accessible={false}>
        <Text style={adminStyles.label}>{label}</Text>
        <Text style={adminStyles.muted}>{hint}</Text>
      </Pressable>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        accessibilityHint={hint}
        trackColor={{ true: colors.primarySoft, false: colors.border }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, alignItems: 'flex-start' },
  wide: { flexGrow: 2, flexBasis: 480, gap: spacing.lg },
  narrow: { flexGrow: 1, flexBasis: 300, gap: spacing.lg },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  field: { flexGrow: 1, flexBasis: 200, marginBottom: 0 },
  top: { marginTop: spacing.sm },
  spec: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: spacing.sm },
  specField: { flexGrow: 1, flexBasis: 120, marginBottom: 0 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleText: { flex: 1, gap: 2 },
});
