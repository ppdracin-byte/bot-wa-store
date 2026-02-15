import { formatCurrency, formatDate } from '@/lib/utils';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function OrderTable({ orders }) {
  if (!orders || orders.length === 0) {
    return <p className="text-gray-500 text-center py-8">No orders found</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Order ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <span className="font-mono text-sm text-gray-900">{order.order_code}</span>
              </td>
              <td className="py-3 px-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.product_name}</p>
                  <p className="text-xs text-gray-500">Target: {order.target_id}</p>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-900">{order.user_phone}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(order.total_price)}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-500">
                  {formatDate(order.created_at)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
