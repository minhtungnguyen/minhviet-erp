// src/hooks/useOrders.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';

function normalizeOrder(row) {
  const base = {
    id:           row.id,
    service:      row.service,
    serviceName:  row.service_name,
    departDate:   row.depart_date,
    returnDate:   row.return_date,
    pax:          row.pax || {},
    pricing:      row.pricing || {},
    customer:     row.customer || {},
    sale:         row.sale,
    status:       row.status,
    notes:        row.notes,
    totalPaid:    Number(row.total_paid) || 0,
    auditLog:     row.audit_log || [],
    validationErrors: row.validation_errors || [],
    vatInvoice:   row.vat_invoice,
    closedAt:     row.closed_at,
    createdAt:    row.created_at,
  };
  return {
    ...base,
    paxAdults:   base.pax?.adults   ?? base.paxAdults   ?? 1,
    paxChildren: base.pax?.children ?? base.paxChildren ?? 0,
    paxBabies:   base.pax?.babies   ?? base.paxBabies   ?? 0,
    pax:         (base.pax?.adults ?? 1) + (base.pax?.children ?? 0) + (base.pax?.babies ?? 0),
    totalPrice:  base.pricing?.totalPrice ?? base.totalPrice ?? 0,
    costPrice:   base.pricing?.costPrice  ?? base.costPrice  ?? 0,
    profit:      base.pricing?.profit     ?? base.profit     ?? 0,
    adultPrice:  base.pricing?.adultPrice ?? 0,
    childPrice:  base.pricing?.childPrice ?? 0,
    customerName:     base.customer?.name     ?? base.customerName     ?? '',
    customerPhone:    base.customer?.phone    ?? base.customerPhone    ?? '',
    customerEmail:    base.customer?.email    ?? base.customerEmail    ?? '',
    customerCccd:     base.customer?.cccd     ?? base.customerCccd     ?? '',
    customerProvince: base.customer?.province ?? base.customerProvince ?? '',
    tourName: base.serviceName ?? base.tourName ?? '',
  };
}

export function useOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('useOrders fetch error:', error);
      setError(error.message);
    } else {
      setOrders((data || []).map(normalizeOrder));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const createOrder = async (orderData) => {
    const newId = 'DH' + new Date().getFullYear().toString().slice(-2)
                + String(Date.now()).slice(-5);
    const row = {
      id:           newId,
      service:      orderData.service     || 'tour',
      service_name: orderData.tourName    || orderData.serviceName || '',
      depart_date:  orderData.departDate  || null,
      return_date:  orderData.returnDate  || null,
      pax: {
        adults:   orderData.paxAdults   ?? orderData.pax ?? 1,
        children: orderData.paxChildren ?? 0,
        babies:   orderData.paxBabies   ?? 0,
      },
      pricing: {
        adultPrice: orderData.adultPrice ?? 0,
        childPrice: orderData.childPrice ?? 0,
        totalPrice: orderData.totalPrice ?? 0,
        costPrice:  orderData.costPrice  ?? 0,
        profit:     orderData.profit     ?? 0,
      },
      customer: {
        name:     orderData.customerName     || '',
        phone:    orderData.customerPhone    || '',
        email:    orderData.customerEmail    || '',
        cccd:     orderData.customerCccd     || '',
        province: orderData.customerProvince || '',
        dob:      orderData.customerDob      || null,
      },
      sale:             orderData.sale    || '',
      status:           orderData.status  || 'pending_payment',
      total_paid:       orderData.totalPaid ?? 0,
      notes:            orderData.note    || orderData.notes || '',
      payment_deadline: orderData.paymentDeadline || null,
      quote_id:         orderData.quoteId || null,
      additional_items: orderData.additionalItems || [],
      payment_schedule: orderData.paymentSchedule || [],
      audit_log: [{
        ts:     new Date().toISOString(),
        by:     orderData.sale || 'system',
        action: 'Tạo đơn hàng',
      }],
      validation_errors: [],
      vat_invoice: orderData.invoiceType || 'no_invoice',
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').insert(row);
    if (error) throw new Error('Tạo đơn thất bại: ' + error.message);
    await fetchOrders();
    return newId;
  };

  const updateOrder = async (updatedOrder) => {
    const patch = {
      service:          updatedOrder.service,
      service_name:     updatedOrder.tourName || updatedOrder.serviceName || '',
      depart_date:      updatedOrder.departDate || null,
      return_date:      updatedOrder.returnDate || null,
      status:           updatedOrder.status,
      total_paid:       updatedOrder.totalPaid ?? 0,
      notes:            updatedOrder.note || updatedOrder.notes || '',
      payment_deadline: updatedOrder.paymentDeadline || null,
      additional_items: updatedOrder.additionalItems || [],
      payment_schedule: updatedOrder.paymentSchedule || [],
      audit_log:        updatedOrder.auditLog || [],
      validation_errors: updatedOrder.validationErrors || [],
      closed_at:        updatedOrder.closedAt || null,
      updated_at:       new Date().toISOString(),
      pricing: {
        adultPrice: updatedOrder.adultPrice ?? 0,
        childPrice: updatedOrder.childPrice ?? 0,
        totalPrice: updatedOrder.totalPrice ?? 0,
        costPrice:  updatedOrder.costPrice  ?? 0,
        profit:     updatedOrder.profit     ?? 0,
      },
      customer: {
        name:     updatedOrder.customerName     || '',
        phone:    updatedOrder.customerPhone    || '',
        email:    updatedOrder.customerEmail    || '',
        cccd:     updatedOrder.customerCccd     || '',
        province: updatedOrder.customerProvince || '',
      },
    };

    const { error } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', updatedOrder.id);
    if (error) throw new Error('Cập nhật đơn thất bại: ' + error.message);

    setOrders(prev => prev.map(o =>
      o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
    ));
  };

  return { orders, loading, error, createOrder, updateOrder, refetch: fetchOrders };
}
