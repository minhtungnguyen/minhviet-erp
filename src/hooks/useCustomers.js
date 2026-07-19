import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';
import { fetchCustomers, upsertCustomer } from '../db.js';

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await fetchCustomers().catch(() => []);
    setCustomers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel('customers_ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetch)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetch]);

  const add = async (c) => {
    await upsertCustomer(c);
    await fetch();
  };

  const update = async (c) => {
    await upsertCustomer(c);
    setCustomers(prev => prev.map(x => x.id === c.id ? c : x));
  };

  return { customers, loading, add, update, refetch: fetch };
}
