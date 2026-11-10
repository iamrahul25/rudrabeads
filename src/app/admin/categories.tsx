import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ImageManager, type ManagedImage } from '@/components/admin/ImageManager';
import { AdminPage, Button, ConfirmButton, Empty, Loading, Notice, Panel, adminStyles } from '@/components/admin/ui';
import { ProductImage } from '@/components/ProductImage';
import { TextField } from '@/components/TextField';
import { useAdmin } from '@/context/AdminContext';
import { useCatalog } from '@/context/CatalogContext';
import { useAdminResource } from '@/hooks/useAdminResource';
import { useUploadCleanup } from '@/hooks/useUploadCleanup';
import { deleteCategory, fetchAdminCatalog, reorderCategories, saveCategory } from '@/lib/adminApi';
import { errorMessage } from '@/lib/api';
import type { ApiCategory } from '@/shared/api';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type Editing = { id: string | null; name: string; intro: string; image: ManagedImage[] };

const editorFor = (category: ApiCategory | null): Editing => ({
  id: category?.id ?? null,
  name: category?.name ?? '',
  intro: category?.intro ?? '',
  image: category?.imageKey && category.image ? [{ key: category.imageKey, url: category.image }] : [],
});

export default function AdminCategories() {
  const { run } = useAdmin();
  const storefront = useCatalog();
  const { data, setData, error, loading, reload } = useAdminResource('admin-categories', fetchAdminCatalog);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const categories = data?.categories ?? [];

  const act = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key);
    setMessage(null);
    try {
      await action();
      await reload();
      storefront.refresh();
      setMessage({ tone: 'success', text: success });
      return true;
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const move = (index: number, delta: number) => {
    const next = [...categories];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setData((prev) => (prev ? { ...prev, categories: next } : prev));
    act('reorder', () => run((token) => reorderCategories(token, next.map((c) => c.id))), 'Category order saved.');
  };

  return (
    <AdminPage
      title="Categories"
      subtitle="Shown under “Shop by Style” in this order"
      onRefresh={reload}
      actions={
        <>
          <Button label="Refresh" icon="refresh" variant="outline" onPress={reload} busy={loading} />
          <Button label="Add category" icon="add" onPress={() => setEditing(editorFor(null))} disabled={!!editing} />
        </>
      }
    >
      <Notice tone="error" message={error} />
      <Notice tone={message?.tone ?? 'success'} message={message?.text ?? null} />

      {editing ? (
        <CategoryEditor
          key={editing.id ?? 'new'}
          initial={editing}
          busy={busy === 'save'}
          onCancel={() => setEditing(null)}
          onSave={async (value, settle) => {
            const ok = await act(
              'save',
              () =>
                run((token) =>
                  saveCategory(token, value.id, {
                    name: value.name.trim(),
                    intro: value.intro.trim(),
                    imageKey: value.image[0]?.key ?? null,
                  }),
                ),
              value.id ? 'Category updated.' : 'Category added.',
            );
            if (ok) {
              settle(value.image.map((image) => image.key));
              setEditing(null);
            }
          }}
        />
      ) : null}

      <Panel title={`${categories.length} categories`}>
        {!data && loading ? <Loading /> : null}
        {data && !categories.length ? <Empty icon="grid-outline" message="No categories yet." /> : null}
        {categories.map((category, index) => (
          <View key={category.id} style={styles.row}>
            <View style={styles.order}>
              <OrderButton icon="chevron-up" label={`Move ${category.name} up`} disabled={index === 0 || !!busy} onPress={() => move(index, -1)} />
              <OrderButton
                icon="chevron-down"
                label={`Move ${category.name} down`}
                disabled={index === categories.length - 1 || !!busy}
                onPress={() => move(index, 1)}
              />
            </View>
            <ProductImage source={category.image} style={styles.thumb} contentFit="cover" compact />
            <View style={styles.main}>
              <Text style={adminStyles.strong}>{category.name}</Text>
              <Text style={adminStyles.muted}>
                {category.count} {category.count === 1 ? 'product' : 'products'}
                {category.imageKey ? '' : ' · using first product image'}
              </Text>
              {category.intro ? (
                <Text style={adminStyles.muted} numberOfLines={2}>
                  {category.intro}
                </Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              <Button
                label="Products"
                variant="ghost"
                icon="pricetags-outline"
                onPress={() => router.push('/admin/products')}
              />
              <Button label="Edit" variant="outline" icon="create-outline" onPress={() => setEditing(editorFor(category))} />
              <ConfirmButton
                label="Delete"
                confirmLabel="Confirm delete"
                icon="trash-outline"
                busy={busy === `delete-${category.id}`}
                disabled={category.count > 0}
                accessibilityLabel={
                  category.count > 0 ? `${category.name} has products and can’t be deleted` : `Delete ${category.name}`
                }
                onConfirm={() =>
                  act(`delete-${category.id}`, () => run((token) => deleteCategory(token, category.id)), `“${category.name}” deleted.`)
                }
              />
            </View>
          </View>
        ))}
        {categories.some((c) => c.count > 0) ? (
          <Text style={adminStyles.muted}>Categories that still have products can’t be deleted. Move or delete those products first.</Text>
        ) : null}
      </Panel>
    </AdminPage>
  );
}

function CategoryEditor({
  initial,
  busy,
  onCancel,
  onSave,
}: {
  initial: Editing;
  busy: boolean;
  onCancel: () => void;
  onSave: (value: Editing, settle: (keptKeys: string[]) => void) => void;
}) {
  const uploads = useUploadCleanup();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  return (
    <Panel title={initial.id ? `Edit “${initial.name}”` : 'New category'}>
      <TextField
        label="Name"
        value={value.name}
        onChangeText={(name) => setValue({ ...value, name })}
        placeholder="e.g. Rudraksha Mala"
        maxLength={80}
      />
      <TextField
        label="Intro"
        optional
        value={value.intro}
        onChangeText={(intro) => setValue({ ...value, intro })}
        placeholder="Short text shown at the top of the category page"
        multiline
        maxLength={1000}
      />
      <Text style={adminStyles.label}>Image</Text>
      <ImageManager
        images={value.image}
        onChange={(image) => setValue({ ...value, image })}
        onUploaded={(image) => uploads.track(image.key)}
        max={1}
        single
      />
      <Text style={adminStyles.muted}>Without an image, the category uses its first product’s photo.</Text>
      <Notice tone="error" message={error} />
      <View style={adminStyles.row}>
        <Button
          label={initial.id ? 'Save category' : 'Add category'}
          icon="save-outline"
          busy={busy}
          onPress={() => {
            if (value.name.trim().length < 2) {
              setError('Enter a category name.');
              return;
            }
            setError(null);
            onSave(value, uploads.settle);
          }}
        />
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
      </View>
    </Panel>
  );
}

function OrderButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.orderBtn, disabled && styles.orderBtnDisabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  order: { gap: 2 },
  orderBtn: {
    width: 30,
    height: 26,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBtnDisabled: { opacity: 0.3 },
  thumb: { width: 64, height: 64, borderRadius: radii.sm },
  main: { flex: 1, minWidth: 180, gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
