import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import {
  AdminCard,
  AreaField,
  ConfirmDelete,
  MediaField,
  PanelHeader,
  SaveButton,
  SelectField,
  TextField,
  ToggleField,
  useAdminList,
  useAdminMutations,
} from "@/components/admin/admin-kit";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AVAILABILITY_OPTIONS } from "@/lib/cms";
import type { Category } from "@/lib/store";

export const Route = createFileRoute("/admin/products")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Products | Apex Admin" },
      { name: "description", content: "Create, edit, price, publish and delete parts in the catalog." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Products | Apex Admin" },
      { property: "og:description", content: "Full control of the parts catalog." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});

type AdminProduct = {
  id: string;
  category_id: string | null;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  image_url: string | null;
  fitment: string | null;
  warranty: string | null;
  specifications: string | null;
  currency: string;
  condition: string;
  availability: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Panel() {
  const list = useAdminList<AdminProduct>("products", { orderBy: "created_at", ascending: false });
  const categories = useAdminList<Category>("categories", { orderBy: "sort_order", ascending: true });
  const { create, update, remove } = useAdminMutations("products");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "— No category —" },
      ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories.data],
  );

  const filtered = (list.data ?? []).filter((product) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [product.name, product.sku, product.brand ?? ""].some((field) =>
      field.toLowerCase().includes(needle),
    );
  });

  const addProduct = () => {
    const stamp = Date.now().toString().slice(-6);
    create.mutate(
      {
        name: "New part",
        slug: `new-part-${stamp}`,
        sku: `SKU-${stamp}`,
        price: 0,
        stock: 0,
        is_published: true,
      },
      { onSuccess: (row: unknown) => setOpenId((row as AdminProduct).id) },
    );
  };

  const editing = (list.data ?? []).find((p) => p.id === openId) ?? null;

  if (editing) {
    return (
      <>
        <PanelHeader
          title="Edit product"
          description="Change any detail and press Save — it updates the live catalog instantly."
          action={
            <Button variant="outline" onClick={() => setOpenId(null)}>
              <ArrowLeft /> Back to list
            </Button>
          }
        />
        <ProductEditor
          key={editing.id}
          product={editing}
          categoryOptions={categoryOptions}
          pending={update.isPending}
          onClose={() => setOpenId(null)}
          onSave={(values) => update.mutate({ id: editing.id, values })}
          onDelete={() => {
            remove.mutate(editing.id);
            setOpenId(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <PanelHeader
        title="Products"
        description="Everything here writes straight to the live catalog."
        action={
          <Button variant="brass" onClick={addProduct} disabled={create.isPending}>
            <Plus /> Add product
          </Button>
        }
      />

      <AdminCard>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, SKU or brand"
            className="pl-9"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {list.isLoading ? "Loading catalog…" : `${filtered.length} product(s)`}
        </p>
      </AdminCard>

      {filtered.map((product) => (
        <AdminCard key={product.id}>
          <div className="flex flex-wrap items-center gap-3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-14 w-14 shrink-0 rounded border border-border object-cover"
              />
            ) : (
              <span className="diagonal-hazard h-14 w-14 shrink-0 rounded border border-border" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg leading-tight">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.sku} · ${Number(product.price).toFixed(2)} · stock {product.stock} ·{" "}
                {product.is_published ? "published" : "draft"}
              </p>
            </div>
            <Button variant="brass" size="sm" onClick={() => setOpenId(product.id)}>
              <Pencil /> Edit
            </Button>
            <ConfirmDelete
              onConfirm={() => remove.mutate(product.id)}
              description={`"${product.name}" will be removed from the catalog.`}
            />
          </div>
        </AdminCard>
      ))}
    </>
  );
}


function ProductEditor({
  product,
  categoryOptions,
  onSave,
  onDelete,
  onClose,
  pending,
}: {
  product: AdminProduct;
  categoryOptions: { value: string; label: string }[];
  onSave: (values: Record<string, unknown>) => void;
  onDelete: () => void;
  onClose: () => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand ?? "",
    category_id: product.category_id ?? "",
    price: String(product.price ?? 0),
    sale_price: product.sale_price === null ? "" : String(product.sale_price),
    stock: String(product.stock ?? 0),
    currency: product.currency ?? "USD",
    condition: product.condition ?? "new",
    availability: product.availability ?? "available",
    description: product.description ?? "",
    specifications: product.specifications ?? "",
    fitment: product.fitment ?? "",
    warranty: product.warranty ?? "",
    image_url: product.image_url ?? "",
    sort_order: String(product.sort_order ?? 0),
    is_featured: product.is_featured,
    is_published: product.is_published,
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AdminCard title={`Editing: ${product.name}`} toolbar={
      <Button variant="ghost" size="sm" onClick={onClose}>
        Close
      </Button>
    }>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Product name" value={form.name} onChange={set("name")} />
        <TextField
          label="URL slug"
          value={form.slug}
          onChange={set("slug")}
          hint="Used in the product page address."
        />
        <TextField label="SKU / part number" value={form.sku} onChange={set("sku")} />
        <TextField label="Brand" value={form.brand} onChange={set("brand")} />
        <SelectField
          label="Category"
          value={form.category_id}
          onChange={set("category_id")}
          options={categoryOptions}
        />
        <SelectField
          label="Availability"
          value={form.availability}
          onChange={set("availability")}
          options={AVAILABILITY_OPTIONS.map((value) => ({ value, label: value }))}
        />
        <TextField label="Price" type="number" value={form.price} onChange={set("price")} />
        <TextField
          label="Sale price (optional)"
          type="number"
          value={form.sale_price}
          onChange={set("sale_price")}
        />
        <TextField label="Stock quantity" type="number" value={form.stock} onChange={set("stock")} />
        <TextField label="Currency" value={form.currency} onChange={set("currency")} />
        <SelectField
          label="Condition"
          value={form.condition}
          onChange={set("condition")}
          options={["new", "used", "refurbished"].map((value) => ({ value, label: value }))}
        />
        <TextField label="Order" type="number" value={form.sort_order} onChange={set("sort_order")} />
        <div className="md:col-span-2">
          <MediaField label="Product image" value={form.image_url} onChange={set("image_url")} />
        </div>
        <div className="md:col-span-2">
          <AreaField label="Description" value={form.description} onChange={set("description")} />
        </div>
        <div className="md:col-span-2">
          <AreaField
            label="Specifications"
            value={form.specifications}
            onChange={set("specifications")}
            rows={3}
          />
        </div>
        <AreaField label="Fitment" value={form.fitment} onChange={set("fitment")} rows={2} />
        <AreaField label="Warranty" value={form.warranty} onChange={set("warranty")} rows={2} />
        <ToggleField label="Published on website" checked={form.is_published} onChange={set("is_published")} />
        <ToggleField label="Featured on homepage" checked={form.is_featured} onChange={set("is_featured")} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <SaveButton
          pending={pending}
          onClick={() =>
            onSave({
              name: form.name,
              slug: form.slug.trim() ? slugify(form.slug) : slugify(form.name),
              sku: form.sku,
              brand: form.brand || null,
              category_id: form.category_id || null,
              price: Number(form.price) || 0,
              sale_price: form.sale_price === "" ? null : Number(form.sale_price),
              stock: Number(form.stock) || 0,
              currency: form.currency || "USD",
              condition: form.condition,
              availability: form.availability,
              description: form.description || null,
              specifications: form.specifications || null,
              fitment: form.fitment || null,
              warranty: form.warranty || null,
              image_url: form.image_url || null,
              sort_order: Number(form.sort_order) || 0,
              is_featured: form.is_featured,
              is_published: form.is_published,
            })
          }
        />
        <ConfirmDelete onConfirm={onDelete} description={`"${product.name}" will be permanently deleted.`} />
      </div>
    </AdminCard>
  );
}
