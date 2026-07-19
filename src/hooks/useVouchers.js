import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';
import { fetchVouchers, upsertVoucher } from '../db.js';

export function useVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await fetchVouchers().catch(() => []);
    setVouchers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel('vouchers_ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, fetch)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetch]);

  const add = async (v) => {
    await upsertVoucher(v);
    await fetch();
  };

  const update = async (v) => {
    await upsertVoucher(v);
    setVouchers(prev => prev.map(x => x.id === v.id ? v : x));
  };

  return { vouchers, loading, add, update, refetch: fetch };
}
