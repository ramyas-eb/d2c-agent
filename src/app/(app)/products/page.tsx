'use client';
import { useState } from 'react';
import { useProductStore, Product } from '@/store/products';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, Check, X, Package } from 'lucide-react';

// ─── Stock toggle ─────────────────────────────────────────────────────────────

function StockToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className={cn(
        'w-9 h-5 rounded-full transition-colors duration-200 peer-focus:ring-2 peer-focus:ring-blue-200',
        checked ? 'bg-green-500' : 'bg-gray-300',
      )}>
        <div className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        )} />
      </div>
    </label>
  );
}

// ─── Add / Edit form row ──────────────────────────────────────────────────────

interface FormRowProps {
  initialValues?: Partial<Product>;
  onSave: (values: { name: string; sku: string; price: number }) => void;
  onCancel: () => void;
  isNew?: boolean;
}

function FormRow({ initialValues, onSave, onCancel, isNew = false }: FormRowProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [sku, setSku] = useState(initialValues?.sku ?? '');
  const [priceStr, setPriceStr] = useState(
    initialValues?.price !== undefined ? String(initialValues.price) : '',
  );

  const valid = name.trim() !== '' && sku.trim() !== '' && Number(priceStr) > 0;

  const handleSave = () => {
    if (!valid) return;
    onSave({ name: name.trim(), sku: sku.trim(), price: Number(priceStr) });
  };

  const cellCls = 'px-3 py-2.5';

  return (
    <tr className={cn('border-b border-gray-100', isNew ? 'bg-blue-50' : 'bg-amber-50')}>
      {/* Name */}
      <td className={cellCls}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder:text-gray-400"
        />
      </td>

      {/* SKU */}
      <td className={cellCls}>
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="EKJ-XX-000"
          className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder:text-gray-400 font-mono"
        />
      </td>

      {/* Price */}
      <td className={cellCls}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 select-none">₹</span>
          <input
            type="number"
            min={0}
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            placeholder="0"
            className="w-full text-sm bg-white border border-gray-300 rounded-lg pl-6 pr-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder:text-gray-400"
          />
        </div>
      </td>

      {/* Stock (placeholder — editing row inherits current stock) */}
      <td className={cellCls}>
        <span className="text-xs text-gray-400">—</span>
      </td>

      {/* Actions */}
      <td className={cn(cellCls, 'whitespace-nowrap')}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!valid}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
              valid
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            )}
          >
            <Check className="w-3.5 h-3.5" />
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Product row ──────────────────────────────────────────────────────────────

function ProductRow({ product }: { product: Product }) {
  const { updateProduct, deleteProduct, toggleStock } = useProductStore();
  const [editing, setEditing] = useState(false);

  const handleSave = (values: { name: string; sku: string; price: number }) => {
    updateProduct(product.id, values);
    setEditing(false);
  };

  if (editing) {
    return (
      <FormRow
        initialValues={product}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
      {/* Name */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Package className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{product.description}</p>
          </div>
        </div>
      </td>

      {/* SKU */}
      <td className="px-4 py-3.5">
        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
          {product.sku}
        </span>
      </td>

      {/* Price */}
      <td className="px-4 py-3.5">
        <span className="text-sm font-semibold text-gray-900">
          ₹{product.price.toLocaleString('en-IN')}
        </span>
      </td>

      {/* Stock */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <StockToggle checked={product.inStock} onChange={() => toggleStock(product.id)} />
          <span className={cn('text-xs font-medium', product.inStock ? 'text-green-600' : 'text-gray-400')}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete "${product.name}"?`)) {
                deleteProduct(product.id);
              }
            }}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── New product row placeholder ──────────────────────────────────────────────

function NewProductRow({ onCancel }: { onCancel: () => void }) {
  const { addProduct } = useProductStore();

  const handleSave = (values: { name: string; sku: string; price: number }) => {
    addProduct({ ...values, description: '', inStock: true });
    onCancel();
  };

  return (
    <FormRow
      onSave={handleSave}
      onCancel={onCancel}
      isNew
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { products } = useProductStore();
  const [addingNew, setAddingNew] = useState(false);

  const inStockCount = products.filter((p) => p.inStock).length;

  return (
    <div className="p-6 max-w-5xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Product Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">Used by the agent to answer pricing questions</p>
        </div>
        <button
          onClick={() => setAddingNew(true)}
          disabled={addingNew}
          className={cn(
            'flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors',
            addingNew
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white',
          )}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-6 mb-5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{products.length}</span>
          <span className="text-sm text-gray-500">products</span>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-gray-900">{inStockCount}</span>
          <span className="text-sm text-gray-500">in stock</span>
        </div>
        {products.length - inStockCount > 0 && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-sm font-semibold text-gray-900">{products.length - inStockCount}</span>
              <span className="text-sm text-gray-500">out of stock</span>
            </div>
          </>
        )}
      </div>

      {/* Table */}
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
            {products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
            {addingNew && (
              <NewProductRow onCancel={() => setAddingNew(false)} />
            )}
            {products.length === 0 && !addingNew && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium">No products yet</p>
                    <button
                      onClick={() => setAddingNew(true)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Add your first product
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 mt-3 px-1">
        The DM Agent references this catalog when customers ask about pricing, availability, or product details.
      </p>
    </div>
  );
}
