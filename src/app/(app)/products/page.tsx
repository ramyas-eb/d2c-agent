'use client';
import { useState } from 'react';
import { useProductStore, Product } from '@/store/products';
import { ProductVariant } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, Check, X, Package, ChevronDown, ChevronUp, Tag } from 'lucide-react';

function StockToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className={cn('w-9 h-5 rounded-full transition-colors duration-200 peer-focus:ring-2 peer-focus:ring-blue-200', checked ? 'bg-green-500' : 'bg-gray-300')}>
        <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200', checked ? 'translate-x-4' : 'translate-x-0')} />
      </div>
    </label>
  );
}

// ── Variant editor ────────────────────────────────────────────────────
function VariantEditor({ variants = [], onChange }: { variants?: ProductVariant[]; onChange: (v: ProductVariant[]) => void }) {
  const [newLabel, setNewLabel] = useState('');
  const [newOptions, setNewOptions] = useState(''); // comma-separated

  function addVariant() {
    const label = newLabel.trim();
    const options = newOptions.split(',').map(o => o.trim()).filter(Boolean);
    if (!label || options.length === 0) return;
    onChange([...variants, { label, options }]);
    setNewLabel('');
    setNewOptions('');
  }

  function removeVariant(i: number) {
    onChange(variants.filter((_, idx) => idx !== i));
  }

  function removeOption(vi: number, oi: number) {
    const updated = variants.map((v, i) =>
      i === vi ? { ...v, options: v.options.filter((_, j) => j !== oi) } : v
    ).filter(v => v.options.length > 0);
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      {variants.map((v, vi) => (
        <div key={vi} className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 mb-1">{v.label}</p>
            <div className="flex flex-wrap gap-1">
              {v.options.map((opt, oi) => (
                <span key={oi} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  {opt}
                  <button onClick={() => removeOption(vi, oi)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => removeVariant(vi)} className="text-gray-300 hover:text-red-400 transition-colors mt-0.5">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {/* Add new variant */}
      <div className="flex items-center gap-2">
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="Label (e.g. Size)"
          className="w-24 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-300"
        />
        <input
          value={newOptions}
          onChange={e => setNewOptions(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addVariant()}
          placeholder="Options, comma separated"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-300"
        />
        <button
          onClick={addVariant}
          disabled={!newLabel.trim() || !newOptions.trim()}
          className="text-xs bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ── Product row ───────────────────────────────────────────────────────
function ProductRow({ product }: { product: Product }) {
  const { updateProduct, deleteProduct, toggleStock } = useProductStore();
  const [editing, setEditing] = useState(false);
  const [showVariants, setShowVariants] = useState(false);

  // Edit state
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [price, setPrice] = useState(String(product.price));
  const [desc, setDesc] = useState(product.description);
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants ?? []);

  function saveEdit() {
    updateProduct(product.id, { name: name.trim(), sku: sku.trim(), price: Number(price), description: desc.trim(), variants });
    setEditing(false);
  }

  function cancelEdit() {
    setName(product.name); setSku(product.sku); setPrice(String(product.price));
    setDesc(product.description); setVariants(product.variants ?? []);
    setEditing(false);
  }

  const variantSummary = (product.variants ?? []).map(v => `${v.label}: ${v.options.join(', ')}`).join(' · ');

  return (
    <>
      <tr className={cn('border-b border-gray-100 hover:bg-gray-50 transition-colors group', editing && 'bg-amber-50 hover:bg-amber-50')}>
        {/* Name */}
        <td className="px-4 py-3.5">
          {editing ? (
            <div className="space-y-1.5">
              <input value={name} onChange={e => setName(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-200" placeholder="Product name" />
              <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-200 text-gray-500" placeholder="Description" />
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Package className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{product.description}</p>
                {variantSummary && (
                  <p className="text-xs text-indigo-500 mt-0.5 truncate max-w-xs">{variantSummary}</p>
                )}
              </div>
            </div>
          )}
        </td>

        {/* SKU */}
        <td className="px-4 py-3.5">
          {editing
            ? <input value={sku} onChange={e => setSku(e.target.value)} className="w-full text-xs font-mono border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-200" />
            : <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{product.sku}</span>
          }
        </td>

        {/* Price */}
        <td className="px-4 py-3.5">
          {editing
            ? <div className="relative w-28"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg pl-6 pr-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-200" /></div>
            : <span className="text-sm font-semibold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
          }
        </td>

        {/* Stock */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2">
            <StockToggle checked={product.inStock} onChange={() => toggleStock(product.id)} />
            <span className={cn('text-xs font-medium', product.inStock ? 'text-green-600' : 'text-gray-400')}>
              {product.inStock ? 'In Stock' : 'Out'}
            </span>
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <button onClick={saveEdit} className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                <Check className="w-3 h-3" /> Save
              </button>
              <button onClick={cancelEdit} className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditing(true); setShowVariants(false); }} className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => setShowVariants(v => !v)}
                className={cn('flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors border', showVariants ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border-transparent hover:border-indigo-100')}
              >
                <Tag className="w-3.5 h-3.5" />
                Variants {(product.variants?.length ?? 0) > 0 && <span className="font-bold">{product.variants!.length}</span>}
                {showVariants ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button onClick={() => { if (window.confirm(`Delete "${product.name}"?`)) deleteProduct(product.id); }} className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Variant editor row */}
      {(showVariants || editing) && (
        <tr className="border-b border-gray-100 bg-indigo-50/40">
          <td colSpan={5} className="px-6 py-3">
            <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Variants
            </p>
            <VariantEditor
              variants={editing ? variants : product.variants}
              onChange={vals => {
                if (editing) setVariants(vals);
                else updateProduct(product.id, { variants: vals });
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ── New product form ──────────────────────────────────────────────────
function NewProductForm({ onCancel }: { onCancel: () => void }) {
  const { addProduct } = useProductStore();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showVariants, setShowVariants] = useState(false);

  const valid = name.trim() && sku.trim() && Number(price) > 0;

  function save() {
    if (!valid) return;
    addProduct({ name: name.trim(), sku: sku.trim(), price: Number(price), description: desc.trim(), inStock: true, variants });
    onCancel();
  }

  return (
    <>
      <tr className="border-b border-gray-100 bg-blue-50">
        <td className="px-4 py-3">
          <div className="space-y-1.5">
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Product name" className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-200" />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-200 text-gray-500" />
          </div>
        </td>
        <td className="px-4 py-3">
          <input value={sku} onChange={e => setSku(e.target.value)} placeholder="EKJ-XX-000" className="w-full text-xs font-mono border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-200" />
        </td>
        <td className="px-4 py-3">
          <div className="relative w-28"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span><input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="w-full text-sm border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-200" /></div>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-gray-400">In Stock</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button onClick={save} disabled={!valid} className={cn('flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors', valid ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={() => setShowVariants(v => !v)} className="flex items-center gap-1 text-xs text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors border border-indigo-100">
              <Tag className="w-3 h-3" /> Variants
            </button>
            <button onClick={onCancel} className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </td>
      </tr>
      {showVariants && (
        <tr className="border-b border-gray-100 bg-indigo-50/40">
          <td colSpan={5} className="px-6 py-3">
            <p className="text-xs font-semibold text-indigo-700 mb-2">Variants</p>
            <VariantEditor variants={variants} onChange={setVariants} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { products } = useProductStore();
  const [addingNew, setAddingNew] = useState(false);
  const inStockCount = products.filter(p => p.inStock).length;

  return (
    <div className="p-6 max-w-5xl mx-auto overflow-y-auto h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Product Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">Products, variants, and stock — all read by the DM agent</p>
        </div>
        <button onClick={() => setAddingNew(true)} disabled={addingNew} className={cn('flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors', addingNew ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white')}>
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="flex items-center gap-6 mb-5 px-1">
        <div className="flex items-center gap-2"><span className="text-sm font-semibold text-gray-900">{products.length}</span><span className="text-sm text-gray-500">products</span></div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-sm font-semibold text-gray-900">{inStockCount}</span><span className="text-sm text-gray-500">in stock</span></div>
        {products.length - inStockCount > 0 && (<><div className="w-px h-4 bg-gray-200" /><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-300" /><span className="text-sm font-semibold text-gray-900">{products.length - inStockCount}</span><span className="text-sm text-gray-500">out of stock</span></div></>)}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {addingNew && <NewProductForm onCancel={() => setAddingNew(false)} />}
            {products.map(p => <ProductRow key={p.id} product={p} />)}
            {products.length === 0 && !addingNew && (
              <tr><td colSpan={5} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><Package className="w-6 h-6" /></div>
                  <p className="text-sm font-medium">No products yet</p>
                  <button onClick={() => setAddingNew(true)} className="text-xs text-blue-600 hover:underline">Add your first product</button>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3 px-1">Click "Variants" on any product to add sizes, colours, or custom options.</p>
    </div>
  );
}
