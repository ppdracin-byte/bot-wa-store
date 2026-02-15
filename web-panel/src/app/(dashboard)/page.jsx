'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/app/components/StatCard';
import OrderTable from '@/app/components/OrderTable';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  Bot,
  TrendingUp,
  DollarSign 
} from 'lucide-react';
import axios from 'axios';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    orders: { total: 0, pending: 0, success: 0 },
    users: { total: 0, new_today: 0 },
    products: { total: 0, active: 0 },
    revenue: { total: 0, profit: 0 }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [orderStats, userStats, productStats, recent] = await Promise.all([
        axios.get('/api/orders/stats'),
        axios.get('/api/users/stats'),
        axios.get('/api/products/stats'),
        axios.get('/api/orders/recent?limit=5')
      ]);

      setStats({
        orders: orderStats.data.data,
        users: userStats.data.data,
        products: productStats.data.data,
        revenue: {
          total: orderStats.data.data.total_revenue || 0,
          profit: orderStats.data.data.total_profit || 0
        }
      });
      setRecentOrders(recent.data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={stats.orders.total}
          subtitle={`${stats.orders.pending} pending, ${stats.orders.success} success`}
          icon={ShoppingCart}
          trend="+12%"
          color="blue"
        />
        <StatCard
          title="Total Users"
          value={stats.users.total}
          subtitle={`${stats.users.new_today} new today`}
          icon={Users}
          trend="+5%"
          color="green"
        />
        <StatCard
          title="Products"
          value={stats.products.total}
          subtitle={`${stats.products.active} active`}
          icon={Package}
          trend="0%"
          color="purple"
        />
        <StatCard
          title="Revenue"
          value={`Rp ${(stats.revenue.total / 1000000).toFixed(1)}M`}
          subtitle={`Profit: Rp ${(stats.revenue.profit / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          trend="+8%"
          color="yellow"
        />
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <a href="/orders" className="text-primary-600 hover:text-primary-700 text-sm">
            View All
          </a>
        </div>
        <OrderTable orders={recentOrders} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/bots" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Manage Bots</h3>
              <p className="text-sm text-gray-500">Connect WhatsApp accounts</p>
            </div>
          </div>
        </a>
        
        <a href="/products" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Products</h3>
              <p className="text-sm text-gray-500">Sync and manage products</p>
            </div>
          </div>
        </a>
        
        <a href="/pricing" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Pricing Rules</h3>
              <p className="text-sm text-gray-500">Set profit margins</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
