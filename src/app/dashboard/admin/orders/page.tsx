"use client";

import { useState } from "react";
import Link from "next/link";
import { Can } from "@/providers/PermissionProvider";
import {
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

const orders = [
  { id: "#ORD-001", customer: "João Silva", email: "joao@email.com", items: 2, total: 299.80, status: "Pago", date: "2024-01-15 14:30", payment: "PIX" },
  { id: "#ORD-002", customer: "Maria Santos", email: "maria@email.com", items: 1, total: 149.90, status: "Pendente", date: "2024-01-15 10:15", payment: "Cartão" },
  { id: "#ORD-003", customer: "Pedro Costa", email: "pedro@email.com", items: 3, total: 749.70, status: "Entregue", date: "2024-01-14 16:45", payment: "PIX" },
  { id: "#ORD-004", customer: "Ana Lima", email: "ana@email.com", items: 1, total: 349.90, status: "Pago", date: "2024-01-14 09:20", payment: "PIX" },
  { id: "#ORD-005", customer: "Carlos Souza", email: "carlos@email.com", items: 2, total: 459.80, status: "Cancelado", date: "2024-01-13 11:00", payment: "Cartão" },
  { id: "#ORD-006", customer: "Fernanda Oliveira", email: "fernanda@email.com", items: 1, total: 199.90, status: "Entregue", date: "2024-01-13 15:30", payment: "PIX" },
];

const statuses = ["Todos", "Pendente", "Pago", "Entregue", "Cancelado"];
const paymentMethods = ["Todos", "PIX", "Cartão", "Boleto"];

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedPayment, setSelectedPayment] = useState("Todos");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "Todos" || order.status === selectedStatus;
    const matchesPayment = selectedPayment === "Todos" || order.payment === selectedPayment;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos</h1>
          <p className="text-zinc-400">Gerencie todos os pedidos da loja</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-[#9333EA]/50 hover:text-white">
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por pedido, cliente ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900/80 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-zinc-900 px-3 text-sm text-white"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-zinc-900 px-3 text-sm text-white"
          >
            {paymentMethods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-[#9333EA]/20 bg-[#9333EA]/10 px-4 py-2">
          <span className="text-sm text-[#9333EA]">{selectedOrders.length} pedidos selecionados</span>
          <Can I="orders:manage">
            <div className="ml-auto flex gap-2">
              <button className="rounded bg-[#9333EA] px-3 py-1 text-xs font-medium text-white hover:bg-[#7c3aed]">
                Marcar como Pago
              </button>
              <button className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">
                Marcar como Entregue
              </button>
            </div>
          </Can>
        </div>
      )}

      {/* Orders Table */}
      <div className="rounded-xl border border-white/5 bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleAllOrders}
                    className="h-4 w-4 rounded border-white/10 bg-zinc-900 accent-[#9333EA]"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Pedido</th>
                <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Cliente</th>
                <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Itens</th>
                <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Total</th>
                <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Pagamento</th>
                <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Data</th>
                <th className="px-4 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="h-4 w-4 rounded border-white/10 bg-zinc-900 accent-[#9333EA]"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-medium text-[#9333EA]">{order.id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">{order.customer}</p>
                      <p className="text-xs text-zinc-500">{order.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-300">{order.items}</td>
                  <td className="px-4 py-4 text-sm font-medium text-white">
                    R$ {order.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                      {order.payment}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        order.status === "Pago"
                          ? "bg-green-500/10 text-green-400"
                          : order.status === "Pendente"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : order.status === "Entregue"
                          ? "bg-[#9333EA]/10 text-[#9333EA]"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {order.status === "Pago" && <CheckCircle className="h-3 w-3" />}
                      {order.status === "Pendente" && <Clock className="h-3 w-3" />}
                      {order.status === "Entregue" && <Truck className="h-3 w-3" />}
                      {order.status === "Cancelado" && <XCircle className="h-3 w-3" />}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-500">{order.date}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-[#9333EA]/50 hover:text-[#9333EA]">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
          <p className="text-sm text-zinc-500">
            Mostrando {filteredOrders.length} de {orders.length} pedidos
          </p>
          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-[#9333EA]/50 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-[#9333EA]/50 hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
