/**
 * useSupabase.js — Hook trung tâm kết nối App với Supabase
 *
 * Cách dùng trong App.jsx:
 *   const db = useSupabase()
 *   // db.orders, db.vouchers, db.loading, db.error
 *   // db.saveOrder(o), db.saveVoucher(v), ...
 *
 * Khi Supabase chưa cấu hình (.env.local thiếu) → fallback sang SEED data
 */
import { useState, useEffect, useCallback } from 'react'
import * as DB from './db.js'

// Import SEED data làm fallback
import {
  SEED_ORDERS, SEED_VOUCHERS, SEED_EXPENSES,
  SEED_REFUNDS, SEED_NCC_MASTER, SEED_CUSTOMERS, USER_ACCOUNTS,
} from './seeds/index.js'

const SUPABASE_READY = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export function useSupabase() {
  const [loading,       setLoading]       = useState(SUPABASE_READY)
  const [error,         setError]         = useState(null)
  const [orders,        setOrders]        = useState(SEED_ORDERS)
  const [vouchers,      setVouchers]      = useState(SEED_VOUCHERS)
  const [expenses,      setExpenses]      = useState(SEED_EXPENSES)
  const [refunds,       setRefunds]       = useState(SEED_REFUNDS)
  const [nccList,       setNccList]       = useState(SEED_NCC_MASTER)
  const [customers,     setCustomers]     = useState(SEED_CUSTOMERS)
  const [users,         setUsers]         = useState(USER_ACCOUNTS)
  const [dbNotifs,      setDbNotifs]      = useState([])

  // Load tất cả data khi mount — mỗi bảng độc lập, 1 bảng lỗi không ảnh hưởng bảng khác
  useEffect(()=>{
    if(!SUPABASE_READY) return
    console.log('[useSupabase] Supabase READY, loading from DB...')
    ;(async()=>{
      setLoading(true)
      const safe = async (fetcher, setter, name) => {
        try {
          const data = await fetcher()
          setter(data) // luôn set — kể cả empty array để xóa SEED data
          console.log(`[useSupabase] ${name}: ${data.length} rows`)
        } catch(err) {
          console.warn(`[useSupabase] ${name} load failed:`, err.message)
          // On error: giữ nguyên state hiện tại (SEED as fallback)
        }
      }
      await Promise.all([
        safe(DB.fetchOrders,        setOrders,    'orders'),
        safe(DB.fetchVouchers,      setVouchers,  'vouchers'),
        safe(DB.fetchExpenses,      setExpenses,  'expenses'),
        safe(DB.fetchRefunds,       setRefunds,   'refunds'),
        safe(DB.fetchNccList,       setNccList,   'ncc_list'),
        safe(DB.fetchCustomers,     setCustomers, 'customers'),
        safe(DB.fetchUsers,         setUsers,     'user_profiles'),
        safe(DB.fetchNotifications, setDbNotifs,  'notifications'),
      ])
      setLoading(false)
    })()
  },[])

  // Realtime subscriptions
  useEffect(()=>{
    if(!SUPABASE_READY) return
    const unsubs = [
      DB.subscribeTable('orders',        ()=>DB.fetchOrders().then(setOrders)),
      DB.subscribeTable('vouchers',      ()=>DB.fetchVouchers().then(setVouchers)),
      DB.subscribeTable('expenses',      ()=>DB.fetchExpenses().then(setExpenses)),
      DB.subscribeTable('refunds',       ()=>DB.fetchRefunds().then(setRefunds)),
      DB.subscribeTable('ncc_list',      ()=>DB.fetchNccList().then(setNccList)),
      DB.subscribeTable('customers',     ()=>DB.fetchCustomers().then(setCustomers)),
      DB.subscribeTable('notifications', ()=>DB.fetchNotifications().then(setDbNotifs)),
    ]
    return ()=>unsubs.forEach(fn=>fn())
  },[])

  // ── Write helpers (optimistic update + DB sync) ──────
  const saveOrder = useCallback(async(o)=>{
    setOrders(prev=>{
      const exists = prev.find(x=>x.id===o.id)
      return exists ? prev.map(x=>x.id===o.id?o:x) : [o,...prev]
    })
    if(SUPABASE_READY){
      try{ await DB.upsertOrder(o) }
      catch(e){
        console.error('[saveOrder failed]', e)
        // Re-throw để caller có thể hiển thị lỗi cho user
        throw e
      }
    }
  },[])

  const removeOrder = useCallback(async(id)=>{
    setOrders(prev=>prev.filter(x=>x.id!==id))
    if(SUPABASE_READY){ try{ await DB.deleteOrder(id) }catch(e){ console.error('[removeOrder failed]',e); throw e } }
  },[])

  const saveVoucher = useCallback(async(v)=>{
    setVouchers(prev=>{
      const exists = prev.find(x=>x.id===v.id)
      return exists ? prev.map(x=>x.id===v.id?v:x) : [v,...prev]
    })
    if(SUPABASE_READY){ try{ await DB.upsertVoucher(v) }catch(e){ console.error(e) } }
  },[])

  const saveExpense = useCallback(async(e)=>{
    setExpenses(prev=>{
      const exists = prev.find(x=>x.id===e.id)
      return exists ? prev.map(x=>x.id===e.id?e:x) : [e,...prev]
    })
    if(SUPABASE_READY){ try{ await DB.upsertExpense(e) }catch(e){ console.error(e) } }
  },[])

  const saveRefund = useCallback(async(r)=>{
    setRefunds(prev=>{
      const exists = prev.find(x=>x.id===r.id)
      return exists ? prev.map(x=>x.id===r.id?r:x) : [r,...prev]
    })
    if(SUPABASE_READY){ try{ await DB.upsertRefund(r) }catch(e){ console.error(e) } }
  },[])

  const saveNcc = useCallback(async(n)=>{
    setNccList(prev=>{
      const exists = prev.find(x=>x.id===n.id)
      return exists ? prev.map(x=>x.id===n.id?n:x) : [...prev,n]
    })
    if(SUPABASE_READY){ try{ await DB.upsertNcc(n) }catch(e){ console.error(e) } }
  },[])

  const removeNcc = useCallback(async(id)=>{
    setNccList(prev=>prev.filter(x=>x.id!==id))
    if(SUPABASE_READY){ try{ await DB.deleteNcc(id) }catch(e){ console.error(e) } }
  },[])

  const saveCustomer = useCallback(async(c)=>{
    setCustomers(prev=>{
      const exists = prev.find(x=>x.id===c.id)
      return exists ? prev.map(x=>x.id===c.id?c:x) : [c,...prev]
    })
    if(SUPABASE_READY){ try{ await DB.upsertCustomer(c) }catch(e){ console.error(e) } }
  },[])

  // Xác thực đăng nhập — server-side qua RPC khi có Supabase; fallback seed data khi chạy offline/dev
  const verifyLogin = useCallback(async(username, password)=>{
    if (SUPABASE_READY) return await DB.verifyLogin(username, password)
    const u = USER_ACCOUNTS.find(a => a.username === username.trim().toLowerCase() && a.password === password)
    if (!u || u.active === false) return null
    const { password: _pw, ...safe } = u
    return safe
  },[])

  const saveUser = useCallback(async(u)=>{
    // Không giữ password ở local state — chỉ đi kèm request lên server để hash
    const { password: _pw, ...safeU } = u
    setUsers(prev=>{
      const exists = prev.find(x=>x.id===u.id)
      return exists ? prev.map(x=>x.id===u.id?safeU:x) : [...prev,safeU]
    })
    if(SUPABASE_READY){
      try{
        await DB.upsertUser(u)
        console.log('[saveUser] ✅ Saved to Supabase:', u.id, u.name, u.username)
      }catch(e){
        console.error('[saveUser] ❌ FAILED:', u.id, u.name, e.message)
        throw e // re-throw để caller biết
      }
    } else {
      console.warn('[saveUser] Supabase not ready — saved to RAM only, will lose on refresh!')
    }
  },[])

  const removeUser = useCallback(async(id)=>{
    setUsers(prev=>prev.filter(x=>x.id!==id))
    if(SUPABASE_READY){ try{ await DB.deleteUser(id) }catch(e){ console.error(e) } }
  },[])

  const saveNotification = useCallback(async(n)=>{
    // Optimistic: không thêm local vì realtime subscription sẽ tự cập nhật
    if(SUPABASE_READY){ try{ await DB.insertNotification(n) }catch(e){ console.error('[saveNotification]',e) } }
  },[])

  return {
    // Data
    orders, vouchers, expenses, refunds, nccList, customers, users, dbNotifs,
    // State setters (cho local operations không cần DB)
    setOrders, setVouchers, setExpenses, setRefunds, setNccList, setCustomers, setUsers,
    // DB-synced savers
    saveOrder, removeOrder, saveVoucher, saveExpense, saveRefund,
    saveNcc, removeNcc, saveCustomer, saveUser, removeUser,
    saveNotification, verifyLogin,
    // Meta
    loading, error,
    supabaseReady: SUPABASE_READY,
  }
}
