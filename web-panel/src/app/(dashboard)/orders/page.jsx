'use client';

import { useEffect, useState } from 'react';
import { Filter, Download } from 'lucide-react';
import axios from 'axios';
import OrderTable from '@/app/components/OrderTable';
import DataTable from '@/app/components/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await axios.get('/api/orders', { params });
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      key: 'order_code', 
      label: 'Order ID',
      render: (val, row) => (
        <Link href={`/orders/${row.id}`} className="text-blue-600 hover:underline font-mono">
          {val}
        </Link>
      )
    },
    { key: 'product_name', label: 'Product' },
    { key: 'target_id', label: 'Target' },
    { 
      key: 'total_price', 
      label: 'Amount',
      render: (val) => formatCurrency(val)
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (status) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          status === 'success' ? 'bg-green-100 text-green-800' :
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          status === 'processing' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    { 
      key: 'created_at', 
      label: 'Date',
      render: (val) => formatDate(val)
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              fetchOrders();
            }}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={orders} />
      </div>
    </div>
  );
}
