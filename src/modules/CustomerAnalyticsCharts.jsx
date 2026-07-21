import React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  FunnelChart, Funnel, LabelList, Cell,
} from "recharts";
import { RFM_SEGMENTS, classifyRFM, customerRevenue, ordersForCustomer } from "../utils/customerSegments.js";
import { customerDisplayName } from "../utils/customers.js";

const fmtMoney = (n) => (n || 0).toLocaleString("vi-VN") + "đ";
const fmtTr = (n) => ((n || 0) / 1e6).toFixed(1) + "tr";

function findCustomerForOrder(order, customers) {
  return (
    customers.find((c) => c.id === order.customerId) ||
    (order.customerPhone && customers.find((c) => c.phone === order.customerPhone)) ||
    (order.customerName && customers.find((c) => c.name?.trim().toLowerCase() === order.customerName.trim().toLowerCase())) ||
    null
  );
}

function EmptyState({ text }) {
  return <div style={{ textAlign: "center", color: "var(--c-text-muted)", padding: "48px 0", fontSize: "var(--text-sm)" }}>{text}</div>;
}

export default function CustomerAnalyticsCharts({ customers = [], orders = [] }) {
  // 1. Xu hướng doanh thu theo phân khúc — 6 tháng gần nhất
  const revenueTrend = React.useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `T${d.getMonth() + 1}/${d.getFullYear()}` });
    }
    const data = months.map((m) => {
      const row = { month: m.label };
      RFM_SEGMENTS.forEach((s) => { row[s.id] = 0; });
      return row;
    });
    orders.forEach((o) => {
      const d = new Date(o.createdAt || o.departDate || 0);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = months.findIndex((m) => m.key === key);
      if (idx === -1) return;
      const cust = findCustomerForOrder(o, customers);
      if (!cust) return;
      const seg = classifyRFM(cust, orders);
      data[idx][seg] += o.totalPrice || 0;
    });
    return data;
  }, [customers, orders]);

  // 2. Top khách hàng giá trị nhất
  const topCustomers = React.useMemo(() => {
    return customers
      .map((c) => ({ id: c.id, name: customerDisplayName(c), revenue: customerRevenue(c, orders) }))
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [customers, orders]);

  // 3. Phễu giữ chân khách — số khách theo số lần mua
  const retentionFunnel = React.useMemo(() => {
    const counts = customers.map((c) => ordersForCustomer(c, orders).length);
    return [
      { name: "Đã mua ≥1 lần", value: counts.filter((n) => n >= 1).length, fill: "#2563eb" },
      { name: "Quay lại lần 2+", value: counts.filter((n) => n >= 2).length, fill: "#7c3aed" },
      { name: "Trung thành (≥3 lần)", value: counts.filter((n) => n >= 3).length, fill: "#16a34a" },
    ];
  }, [customers, orders]);

  const hasAnyOrders = orders.length > 0;

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="resp-grid-split" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--c-surface)", borderRadius: "var(--r-lg)", padding: 18, boxShadow: "var(--sh-sm)" }}>
          <div style={{ fontWeight: 700, fontSize: "var(--text-md)", marginBottom: 4 }}>📈 Xu hướng doanh thu theo phân khúc</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--c-text-muted)", marginBottom: 12 }}>6 tháng gần nhất</div>
          {hasAnyOrders ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtTr} width={40} />
                <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {RFM_SEGMENTS.map((s) => (
                  <Bar key={s.id} dataKey={s.id} name={s.label} stackId="rev" fill={s.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Chưa có đơn hàng nào để vẽ xu hướng" />}
        </div>

        <div style={{ background: "var(--c-surface)", borderRadius: "var(--r-lg)", padding: 18, boxShadow: "var(--sh-sm)" }}>
          <div style={{ fontWeight: 700, fontSize: "var(--text-md)", marginBottom: 4 }}>🔻 Phễu giữ chân khách hàng</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--c-text-muted)", marginBottom: 12 }}>Số khách theo số lần mua</div>
          {customers.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <FunnelChart>
                <Tooltip formatter={(v) => v + " khách"} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Funnel dataKey="value" data={retentionFunnel} isAnimationActive>
                  <LabelList position="right" dataKey="name" fill="var(--c-text-2)" stroke="none" fontSize={12} />
                  <LabelList position="center" dataKey="value" fill="#fff" stroke="none" fontSize={14} fontWeight={700} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          ) : <EmptyState text="Chưa có khách hàng nào" />}
        </div>
      </div>

      <div style={{ background: "var(--c-surface)", borderRadius: "var(--r-lg)", padding: 18, boxShadow: "var(--sh-sm)" }}>
        <div style={{ fontWeight: 700, fontSize: "var(--text-md)", marginBottom: 4 }}>🏆 Top khách hàng giá trị nhất</div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--c-text-muted)", marginBottom: 12 }}>Theo tổng doanh thu</div>
        {topCustomers.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(180, topCustomers.length * 38)}>
            <BarChart data={topCustomers} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--c-border)" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmtTr} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                {topCustomers.map((_, i) => <Cell key={i} fill={i === 0 ? "#7c3aed" : "#2563eb"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState text="Chưa có khách hàng nào phát sinh doanh thu" />}
      </div>
    </div>
  );
}
