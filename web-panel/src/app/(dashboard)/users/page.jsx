'use client';

import { useEffect, useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import axios from 'axios';
import DataTable from '@/app/components/DataTable';
import Modal from '@/app/components/Modal';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceForm, setBalanceForm] = useState({ amount: '', type: 'deposit', notes: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/users/${selectedUser.id}/balance`, {
        amount: parseFloat(balanceForm.amount),
        type: balanceForm.type,
        notes: balanceForm.notes
      });
      setIsModalOpen(false);
      setBalanceForm({ amount: '', type: 'deposit', notes: '' });
      fetchUsers();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const openBalanceModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'balance', 
      label: 'Balance',
      render: (val) => formatCurrency(val)
    },
    { 
      key: 'level', 
      label: 'Level',
      render: (val) => (
        <span className="capitalize px-2 py-1 bg-gray-100 rounded-full text-xs">
          {val}
        </span>
      )
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
        <div className="flex space-x-2">
          <button
            onClick={() => openBalanceModal(row)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Update Balance"
          >
            <Wallet className="w-4 h-4" />
          </button>
          <Link
            href={`/users/${row.id}`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            View
          </Link>
        </div>
      )
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      </div>

      <div className="card">
        <DataTable columns={columns} data={users} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Update Balance - ${selectedUser?.name}`}
      >
        <form onSubmit={handleUpdateBalance} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Balance
            </label>
            <input
              type="text"
              value={formatCurrency(selectedUser?.balance || 0)}
              disabled
              className="input bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={balanceForm.type}
              onChange={(e) => setBalanceForm({...balanceForm, type: e.target.value})}
              className="input"
            >
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              required
              value={balanceForm.amount}
              onChange={(e) => setBalanceForm({...balanceForm, amount: e.target.value})}
              className="input"
              placeholder="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={balanceForm.notes}
              onChange={(e) => setBalanceForm({...balanceForm, notes: e.target.value})}
              className="input"
              rows="3"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Balance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
