'use client';

import { Loader2Icon, PaletteIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpDelete, httpPost, httpPut } from '~/lib/http';
import { toast } from 'sonner';
import { DEFAULT_RENDERER_THEME, type RendererThemeOptions } from '@temply/shared/theme';
import { BRAND_PRESETS } from '@temply/shared/brand-presets';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Badge, Card, EmptyState, ErrorState, PageHeader } from '~/components/ui/surfaces';
import { BrandEditor } from '~/components/brand/brand-editor';
import { brandsQueryOptions, type Brand } from '~/lib/brands';

/** A brand's theme comes back from the API as a raw string; a corrupted or
 *  hand-edited row should degrade to a default look instead of throwing
 *  during render. */
function safeTheme(raw: string): RendererThemeOptions {
  try {
    return JSON.parse(raw) as RendererThemeOptions;
  } catch {
    return structuredClone(DEFAULT_RENDERER_THEME);
  }
}

export default function BrandsPage() {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [name, setName] = useState('');
  const [theme, setTheme] = useState<RendererThemeOptions>(() => structuredClone(BRAND_PRESETS[0].theme));

  const { data, isLoading, isError, refetch } = useQuery(brandsQueryOptions());

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['brands'] });

  const { mutateAsync: createBrand, isPending: isCreating } = useMutation({
    mutationFn: (input: { name: string; theme: RendererThemeOptions }) =>
      httpPost('/api/v1/brands', { name: input.name, theme: JSON.stringify(input.theme) }),
    onSuccess: () => {
      toast.success('Brand created');
      invalidate();
    },
    onError: (error: any) => {
      if (error?.status === 402) {
        toast.error(error.message);
      } else {
        toast.error(error?.message || 'Could not create the brand');
      }
    },
  });

  const { mutateAsync: updateBrand, isPending: isUpdating } = useMutation({
    mutationFn: (input: { id: string; name: string; theme: RendererThemeOptions }) =>
      httpPut(`/api/v1/brands/${input.id}`, { name: input.name, theme: JSON.stringify(input.theme) }),
    onSuccess: () => {
      toast.success('Brand saved');
      invalidate();
    },
    onError: (error: any) => toast.error(error?.message || 'Could not save the brand'),
  });

  const { mutateAsync: deleteBrand } = useMutation({
    mutationFn: (id: string) => httpDelete(`/api/v1/brands/${id}`),
    onSuccess: () => {
      toast.success('Brand deleted');
      invalidate();
    },
    onError: (error: any) => toast.error(error?.message || 'Could not delete the brand'),
  });

  const { mutateAsync: setDefaultBrand } = useMutation({
    mutationFn: (id: string) => httpPost(`/api/v1/brands/${id}/default`, {}),
    onSuccess: () => {
      invalidate();
    },
    onError: (error: any) => toast.error(error?.message || 'Could not set the default brand'),
  });

  const openCreate = () => {
    setEditingBrand(null);
    setName('');
    setTheme(structuredClone(BRAND_PRESETS[0].theme));
    setShowEditor(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setTheme(safeTheme(brand.theme));
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingBrand) {
      await updateBrand({ id: editingBrand.id, name: name.trim(), theme });
    } else {
      await createBrand({ name: name.trim(), theme });
    }
    setShowEditor(false);
  };

  const brands = data ?? [];
  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Brands"
        description="Reusable looks you apply to templates."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <PlusIcon />
            New brand
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2Icon className="size-5 animate-spin text-faint" />
        </div>
      ) : isError ? (
        <ErrorState
          description="We could not load your brands."
          onRetry={() => refetch()}
        />
      ) : brands.length === 0 ? (
        <EmptyState
          icon={PaletteIcon}
          title="No brands yet"
          description="Create a brand to reuse a look across templates."
          action={<Button onClick={openCreate}>New brand</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => {
            const brandTheme = safeTheme(brand.theme);
            return (
              <Card key={brand.id} className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-5 rounded-sm border border-line"
                    style={{ background: brandTheme.body?.backgroundColor }}
                  />
                  <span
                    className="size-5 rounded-sm border border-line"
                    style={{ background: brandTheme.button?.backgroundColor }}
                  />
                  <span
                    className="size-5 rounded-sm border border-line"
                    style={{ background: brandTheme.link?.color }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-ink">{brand.name}</p>
                  {brand.is_default === 1 ? <Badge tone="accent">Default</Badge> : null}
                </div>

                <div className="flex items-center gap-1">
                  <Button size="sm" onClick={() => openEdit(brand)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger-quiet"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this brand? Templates using it keep their own copy of the look.')) {
                        deleteBrand(brand.id);
                      }
                    }}
                  >
                    <Trash2Icon />
                    Delete
                  </Button>
                  {brand.is_default !== 1 ? (
                    <Button size="sm" onClick={() => setDefaultBrand(brand.id)}>
                      Set default
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={showEditor}
        onOpenChange={(open) => {
          setShowEditor(open);
          if (!open) {
            setEditingBrand(null);
            setName('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit brand' : 'Create brand'}</DialogTitle>
            <DialogDescription>
              Pick a preset and tweak it, or dial in your own colors.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="brand-name" className="block text-sm font-medium text-ink">
                Brand name
              </label>
              <input
                id="brand-name"
                className="h-8 w-full rounded-sm border border-line bg-raised px-2.5 text-sm text-ink placeholder:text-faint"
                placeholder="Acme"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <BrandEditor theme={theme} onChange={setTheme} />
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowEditor(false);
                setEditingBrand(null);
                setName('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving ? <Loader2Icon className="animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
