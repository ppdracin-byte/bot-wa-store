'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, RefreshCw, QrCode, Power } from 'lucide-react';
import Link from 'next/link';

export default function BotDetailPage() {
  const { id } = useParams();
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBot();
  }, [id]);

  const fetchBot = async () => {
    try {
      const response = await axios.get(`/api/bots/${id}/status`);
      setBot(response.data.data);
    } catch (error) {
      console.error('Error fetching bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      await axios.post(`/api/bots/${id}/connect`);
      alert('Check terminal for QR code');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await axios.post(`/api/bots/${id}/disconnect`);
      fetchBot();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!bot) return <div>Bot not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/bots" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Bot Details</h1>
      </div>

      <div className="card">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">{bot.name}</h2>
            <p className="text-gray-500">{bot.phone}</p>
            <div className="mt-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                bot.is_connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {bot.is_connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={fetchBot}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            {bot.is_connected ? (
              <button
                onClick={handleDisconnect}
                className="btn-secondary flex items-center space-x-2"
              >
                <Power className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="btn-primary flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{bot.status}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-medium">{new Date(bot.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
