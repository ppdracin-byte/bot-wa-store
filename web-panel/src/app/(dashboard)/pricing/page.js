'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw, Percent, Plus } from 'lucide-react';
import axios from 'axios';
import DataTable from '@/app/components/DataTable';

export default function PricingPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await axios.get('/api/pricing/rules');
      setRules(response.data.data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRule = async (category, updates) => {
    setSaving(true);
    try {
      await axios.put(`/api/pricing/rules/${category}`, updates);
      fetchRules();
      alert('Rule updated successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post('/api/pricing/sync');
      alert('Sync started! Check products page in a few minutes.');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    { 
      key: 'category', 
      label: 'Category',
      render: (val) => (
        <span className="capitalize font-medium">{val}</span>
      )
    },
    { 
      key: 'type', 
      label: 'Type',
      render: (val, row) => (
        <select
          value={val}
          onChange={(e) => handleUpdateRule(row.category, { ...row, type: e.target.value })}
          className="input py-1 px-2 text-sm"
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount (Rp)</option>
        </select>
      )
    },
    { 
      key: 'value', 
      label: 'Value',
      render: (val, row) => (
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={val}
            onChange={(e) => handleUpdateRule(row.category, { ...row, value: parseFloat(e.target.value) })}
            className="input py-1 px-2 text-sm w-24"
          />
          <span className="text-sm text-gray-500">
            {row.type === 'percentage' ? '%' : 'Rp'}
          </span>
        </div>
      )
    },
    {
      key: 'example',
      label: 'Example Calculation',
      render: (_, row) => {
        const buyPrice = 10000;
        let sellPrice;
        if (row.type === 'percentage') {
          sellPrice = buyPrice + (buyPrice * (row.value / 100));
        } else {
          sellPrice = buyPrice + row.value;
        }
        return (
          <span className="text-sm text-gray-600">
            Buy: Rp 10,000 → Sell: Rp {Math.ceil(sellPrice / 100) * 100}
          </span>
        );
      }
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Rules</h1>
          <p className="text-gray-500 mt-1">Configure profit margins for each category</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync Products'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <Percent className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Current Settings</h3>
              <p className="text-sm text-blue-700">
                Sosmed: 10% | Game: 6% | Pulsa/PPOB: +Rp 500
              </p>
            </div>
          </div>
        </div>
        
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <Plus className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Auto Pricing</h3>
              <p className="text-sm text-green-700">
                Prices update automatically when syncing from providers
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={rules} pagination={false} />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Profit Report</h3>
        <p className="text-gray-500 text-sm mb-4">
          View detailed profit reports by date range. 
          <a href="/pricing/report" className="text-primary-600 hover:underline ml-1">
            View full report →
          </a>
        </p>
      </div>
    </div>
  );
}
