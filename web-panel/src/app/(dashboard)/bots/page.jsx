'use client';

import { useEffect, useState } from 'react';
import { Plus, QrCode, Power, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import DataTable from '@/app/components/DataTable';
import Modal from '@/app/components/Modal';

export default function BotsPage() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', phone_number: '' });

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const response = await axios.get('/api/bots');
      setBots(response.data.data);
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/bots', newBot);
      setIsModalOpen(false);
      setNewBot({ name: '', phone_number: '' });
      fetchBots();
    } catch (error) {
      alert('Error creating bot: ' + error.message);
    }
  };

  const handleConnect = async (id) => {
    try {
      await axios.post(`/api/bots/${id}/connect`);
      alert('Check terminal for QR code');
    } catch (error) {
      alert('Error connecting bot: ' + error.message);
    }
  };

  const handleDisconnect = async (id) => {
    try {
      await axios.post(`/api/bots/${id}/disconnect`);
      fetchBots();
    } catch (error) {
      alert('Error disconnecting bot: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(`/api/bots/${id}`);
      fetchBots();
    } catch (error) {
      alert('Error deleting bot: ' + error.message);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone_number', label: 'Phone' },
    { 
      key: 'status', 
      label: 'Status',
      render: (status) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          status === 'connected' ? 'bg-green-100 text-green-800' :
          status === 'qr_ready' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
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
          {row.status !== 'connected' ? (
            <button
              onClick={() => handleConnect(row.id)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Connect"
            >
              <QrCode className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleDisconnect(row.id)}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
              title="Disconnect"
            >
              <Power className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Bots</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bot</span>
        </button>
      </div>

      <div className="card">
        <DataTable columns={columns} data={bots} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Bot"
      >
        <form onSubmit={handleCreateBot} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bot Name
            </label>
            <input
              type="text"
              required
              value={newBot.name}
              onChange={(e) => setNewBot({...newBot, name: e.target.value})}
              className="input"
              placeholder="e.g., Bot 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              required
              value={newBot.phone_number}
              onChange={(e) => setNewBot({...newBot, phone_number: e.target.value})}
              className="input"
              placeholder="628123456789"
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
              Create Bot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
