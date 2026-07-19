import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';
import { fetchExpenses, upsertExpense } from '../db.js';

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await fetchExpenses().catch(() => []);
    setExpenses(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel('expenses_ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetch)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetch]);

  const add = async (e) => {
    await upsertExpense(e);
    await fetch();
  };

  const update = async (e) => {
    await upsertExpense(e);
    setExpenses(prev => prev.map(x => x.id === e.id ? e : x));
  };

  return { expenses, loading, add, update, refetch: fetch };
}
