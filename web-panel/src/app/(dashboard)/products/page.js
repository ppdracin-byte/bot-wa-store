
'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Edit, Filter } from 'lucide-react';
import axios from 'axios';
import DataTable from '@/app/components/DataTable';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await axios.post('/api/pricing/sync');
      alert('Sync started!');
      setTimeout(fetchProducts, 5000);
    } catch (error) {
      alert('Error syncing: ' + error.message);
    }
  };

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => p.provider === filter);

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { 
      key: 'category_name', 
      label: 'Category',
      render: (val) => val || '-'
    },
    { 
      key: 'buy_price', 
      label: 'Buy Price',
      render: (val) => formatCurrency(val)
    },
    { 
      key: 'sell_price', 
      label: 'Sell Price',
      render: (val) => formatCurrency(val)
    },
    { 
      key: 'profit', 
      label: 'Profit',
      render: (_, row) => formatCurrency(row.sell_price - row.buy_price)
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (status) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Link
          href={`/products/${row.id}`}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          <Edit className="w-4 h-4" />
        </Link>
      )
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Providers</option>
            <option value="vip">VIP Reseller</option>
            <option value="medan">Medan Pedia</option>
          </select>
          <button
            onClick={handleSync}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={filteredProducts} />
      </div>
    </div>
  );
}
