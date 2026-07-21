/**
 * db.js — Lớp trung gian giữa React App và Supabase
 * Mỗi hàm tương ứng với 1 bảng trong database
 * App chỉ gọi các hàm này, không import supabase trực tiếp
 */
import { supabase } from './supabase.js'

// ─────────────────────────────────────────
// USER PROFILES
// ─────────────────────────────────────────
export async function fetchUsers() {
  // password bị loại khỏi select — cột này không còn SELECT-able qua anon key (xem migration hash_passwords_and_secure_login)
  const { data, error } = await supabase.from('user_profiles')
    .select('id,username,name,role,dept,job_title,phone,email,photo_url,avatar,active,created_at,perms')
    .order('created_at')
  if (error) throw error
  return data.map(dbToUser)
}
// Đăng nhập: xác thực server-side qua RPC (SECURITY DEFINER), không bao giờ trả password về client
export async function verifyLogin(username, password) {
  const { data, error } = await supabase.rpc('verify_login', { p_username: username, p_password: password })
  if (error) throw error
  if (!data || data.length === 0) return null
  return dbToUser(data[0])
}
export async function upsertUser(u) {
  // Ghi qua RPC upsert_user_account: hash mật khẩu server-side bằng bcrypt (pgcrypto),
  // chỉ đổi mật khẩu khi p_password có giá trị — để trống = giữ nguyên mật khẩu hiện tại
  const { error } = await supabase.rpc('upsert_user_account', {
    p_id: u.id, p_username: u.username, p_name: u.name, p_role: u.role,
    p_dept: u.dept || null, p_job_title: u.jobTitle || null,
    p_phone: u.phone || null, p_email: u.email || null,
    p_photo_url: u.photoUrl || null, p_avatar: u.avatar || null,
    p_active: u.active !== false,
    p_perms: { canViewTourGhep: u.canViewTourGhep === true, perms: Array.isArray(u.perms) ? u.perms : null },
    p_password: u.password || null,
  })
  if (error) throw error
}
export async function deleteUser(id) {
  const { error } = await supabase.from('user_profiles').delete().eq('id', id)
  if (error) throw error
}
function dbToUser(r) {
  const p = r.perms || {}
  return { id:r.id, username:r.username, name:r.name||"",
    role:r.role, dept:r.dept, jobTitle:r.job_title, phone:r.phone,
    email:r.email, photoUrl:r.photo_url,
    avatar: r.avatar || (r.name?.[0]?.toUpperCase()) || "?",
    active:r.active, createdAt:r.created_at,
    canViewTourGhep: p.canViewTourGhep===true,
    perms: Array.isArray(p.perms)?p.perms:null }
}

// ─────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────
export async function fetchOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(dbToOrder)
}
export async function upsertOrder(o) {
  const { error } = await supabase.from('orders').upsert(orderToDb(o))
  if (error) throw error
}
export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}
function orderToDb(o) {
  // Pack pax fields into JSONB object
  const pax = (o.pax && typeof o.pax === 'object' && !Array.isArray(o.pax)) ? o.pax : {
    adult:    o.adultQty   || 0,
    child10:  o.child10Qty || 0,
    child5:   o.child5Qty  || 0,
    child2:   o.child2Qty  || 0,
    infant:   o.infantQty  || 0,
    passengers: o.passengers || [],
  }
  // Pack pricing fields into JSONB object
  const pricing = (o.pricing && typeof o.pricing === 'object' && !Array.isArray(o.pricing)) ? o.pricing : {
    adultPrice:    o.adultPrice    || 0,
    child10Price:  o.child10Price  || 0,
    child5Price:   o.child5Price   || 0,
    child2Price:   o.child2Price   || 0,
    infantPrice:   o.infantPrice   || 0,
    totalPrice:    o.totalPrice    || 0,
    depositAmount: o.depositAmount || 0,
    depositPct:    o.depositPct    || 0,
    balance:       o.balance       || 0,
    surcharges:    o.surcharges    || [],
  }
  // Pack customer fields into JSONB object
  const customer = (o.customer && typeof o.customer === 'object' && !Array.isArray(o.customer)) ? o.customer : {
    name:    o.customerName    || null,
    phone:   o.customerPhone   || null,
    email:   o.customerEmail   || null,
    address: o.customerAddress || null,
  }
  // Extra fields pack vào JSONB để không mất dữ liệu
  const extra = {
    hdvId:           o.hdvId            || null,
    hdvName:         o.hdvName          || null,
    customerCccd:    o.customerCccd     || null,
    customerAddress: o.customerAddress  || null,
    departFrom:      o.departFrom       || null,
    destination:     o.destination      || null,
    tourGhepProductId:   o.tourGhepProductId   || null,
    tourGhepProductName: o.tourGhepProductName || null,
    tourGhepDepartureId:    o.tourGhepDepartureId    || null,
    tourGhepDepartureLabel: o.tourGhepDepartureLabel || null,
    comboName:       o.comboName        || null,
    comboDiscount:   o.comboDiscount    || 0,
    comboComponents: o.comboComponents  || null,
    additionalItems: o.additionalItems  || [],
    source:          o.source           || null,
    invoiceType:     o.invoiceType      || null,
    customerType:    o.customerType     || null,
    companyName:     o.companyName      || null,
    taxCode:         o.taxCode          || null,
    cancelledAt:     o.cancelledAt      || null,
    cancelReason:    o.cancelReason     || null,
  }
  return {
    id:                o.id,
    service:           o.service           || null,
    service_name:      o.serviceName || o.tourName || null,
    depart_date:       o.departDate        || null,
    return_date:       o.returnDate        || null,
    pax,
    pricing,
    customer,
    sale:              o.sale              || null,
    status:            o.status            || 'pending_payment',
    notes:             o.notes             || null,
    total_paid:        o.totalPaid         || 0,
    validation_errors: o.validationErrors  || [],
    vat_invoice:       o.vatInvoice        || null,
    closed_at:         o.closedAt          || null,
    audit_log:         o.auditLog          || [],
    created_by:        o.createdBy         || null,
    extra,
  }
}
function dbToOrder(r) {
  const pax     = r.pax     || {}
  const pricing = r.pricing || {}
  const customer= r.customer|| {}
  return {
    id:             r.id,
    service:        r.service,
    serviceName:    r.service_name,
    tourName:       r.service_name,
    departDate:     r.depart_date,
    returnDate:     r.return_date,
    // Pax (flat fields cho UI)
    pax,
    adultQty:       pax.adult   || 0,
    child10Qty:     pax.child10 || 0,
    child5Qty:      pax.child5  || 0,
    child2Qty:      pax.child2  || 0,
    infantQty:      pax.infant  || 0,
    passengers:     pax.passengers || [],
    // Pricing (flat fields cho UI)
    pricing,
    adultPrice:     pricing.adultPrice   || 0,
    child10Price:   pricing.child10Price || 0,
    child5Price:    pricing.child5Price  || 0,
    child2Price:    pricing.child2Price  || 0,
    infantPrice:    pricing.infantPrice  || 0,
    totalPrice:     pricing.totalPrice   || 0,
    depositAmount:  pricing.depositAmount|| 0,
    depositPct:     pricing.depositPct   || 0,
    balance:        pricing.balance      || 0,
    surcharges:     pricing.surcharges   || [],
    // Customer (flat fields cho UI)
    customer,
    customerName:   customer.name,
    customerPhone:  customer.phone,
    customerEmail:  customer.email,
    customerAddress:customer.address,
    // Other
    sale:               r.sale,
    status:             r.status,
    notes:              r.notes,
    totalPaid:          Number(r.total_paid) || 0,
    validationErrors:   r.validation_errors  || [],
    vatInvoice:         r.vat_invoice,
    closedAt:           r.closed_at,
    auditLog:           r.audit_log          || [],
    createdBy:          r.created_by,
    createdAt:          r.created_at,
    // Extra fields từ JSONB
    ...(r.extra || {}),
  }
}

// ─────────────────────────────────────────
// VOUCHERS
// ─────────────────────────────────────────
export async function fetchVouchers() {
  const { data, error } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(dbToVoucher)
}
export async function upsertVoucher(v) {
  const { error } = await supabase.from('vouchers').upsert(voucherToDb(v))
  if (error) throw error
}
function voucherToDb(v) {
  return { id:v.id, type:v.type, order_id:v.orderId||null,
    customer_name:v.customerName||null, ncc:v.ncc||null,
    amount:v.amount, method:v.method||null, note:v.note||null,
    date:v.date||null, status:v.status||'pending',
    approved_by:v.approvedBy||null, bill_img:v.billImg||null,
    created_by:v.createdBy||null, installment:v.installment||1,
    pnr_code:v.pnrCode||null }
}
function dbToVoucher(r) {
  return { id:r.id, type:r.type, orderId:r.order_id,
    customerName:r.customer_name, ncc:r.ncc,
    amount:Number(r.amount), method:r.method, note:r.note,
    date:r.date, status:r.status, approvedBy:r.approved_by,
    billImg:r.bill_img, createdBy:r.created_by,
    installment:r.installment, pnrCode:r.pnr_code, createdAt:r.created_at }
}

// ─────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────
export async function fetchExpenses() {
  const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(dbToExpense)
}
export async function upsertExpense(e) {
  const { error } = await supabase.from('expenses').upsert(expenseToDb(e))
  if (error) throw error
}
function expenseToDb(e) {
  return { id:e.id, order_id:e.orderId||null, ncc:e.ncc||null,
    amount:e.amount, budget_line:e.budgetLine||0, method:e.method||null,
    note:e.note||null, status:e.status||'pending_kt',
    created_by:e.createdBy||null, audit_log:e.auditLog||[] }
}
function dbToExpense(r) {
  return { id:r.id, type:r.type, orderId:r.order_id, ncc:r.ncc,
    amount:Number(r.amount), budgetLine:Number(r.budget_line)||0,
    method:r.method, note:r.note, status:r.status,
    createdBy:r.created_by, auditLog:r.audit_log||[], createdAt:r.created_at }
}

// ─────────────────────────────────────────
// REFUNDS
// ─────────────────────────────────────────
export async function fetchRefunds() {
  const { data, error } = await supabase.from('refunds').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(dbToRefund)
}
export async function upsertRefund(r) {
  const { error } = await supabase.from('refunds').upsert(refundToDb(r))
  if (error) throw error
}
function refundToDb(r) {
  return { id:r.id, order_id:r.orderId||null, order_name:r.orderName||null,
    customer_name:r.customerName||null, customer_phone:r.customerPhone||null,
    service_type:r.serviceType||null, reason:r.reason||null,
    reason_note:r.reasonNote||null, policy_note:r.policyNote||null,
    total_paid:r.totalPaid||0, fee_amount:r.feeAmount||0,
    refund_amount:r.refundAmount||0, ncc_recovery:r.nccRecovery||0,
    ncc_recovery_note:r.nccRecoveryNote||null, net_loss:r.netLoss||0,
    method:r.method||null, bank_info:r.bankInfo||null, status:r.status||'pending_approve',
    created_by:r.createdBy||null, approved_by:r.approvedBy||null,
    approved_at:r.approvedAt||null, paid_at:r.paidAt||null, audit_log:r.auditLog||[] }
}
function dbToRefund(r) {
  return { id:r.id, orderId:r.order_id, orderName:r.order_name,
    customerName:r.customer_name, customerPhone:r.customer_phone,
    serviceType:r.service_type, reason:r.reason, reasonNote:r.reason_note,
    policyNote:r.policy_note, totalPaid:Number(r.total_paid),
    feeAmount:Number(r.fee_amount), refundAmount:Number(r.refund_amount),
    nccRecovery:Number(r.ncc_recovery), nccRecoveryNote:r.ncc_recovery_note,
    netLoss:Number(r.net_loss), method:r.method, bankInfo:r.bank_info,
    status:r.status, createdBy:r.created_by, approvedBy:r.approved_by,
    approvedAt:r.approved_at, paidAt:r.paid_at,
    auditLog:r.audit_log||[], createdAt:r.created_at }
}

// ─────────────────────────────────────────
// NCC LIST
// ─────────────────────────────────────────
// ── Suppliers (full object saved as JSONB) ──────────────
export async function fetchSuppliers() {
  const { data, error } = await supabase.from('ncc_list').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(r => r.data ? { ...r.data, _dbId: r.id } : dbToNcc(r))
}
export async function upsertSupplier(s) {
  const { error } = await supabase.from('ncc_list').upsert({
    id: s.id,
    name: s.ten || s.name || '',
    data: s,
  })
  if (error) throw error
}
export async function deleteSupplierDb(id) {
  const { error } = await supabase.from('ncc_list').delete().eq('id', id)
  if (error) throw error
}
// Legacy helpers (kept for backward compat)
export async function fetchNccList() { return fetchSuppliers() }
export async function upsertNcc(n) { return upsertSupplier(n) }
export async function deleteNcc(id) { return deleteSupplierDb(id) }
function dbToNcc(r) {
  return { id:r.id, ten:r.name||'', name:r.name||'', loai_hinh:[],
    khu_vuc_hoat_dong:[], sdt:r.phone||'', email:'', nguoi_lien_he:r.contact||'',
    tai_khoan_ngan_hang:{ngan_hang:'',so_tk:'',chu_tk:''},
    cong_no:0, trang_thai_hop_dong:'chua', danh_gia_noi_bo:3, dich_vu:[],
    createdAt:r.created_at }
}

// ─────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────
export async function fetchCustomers() {
  const { data, error } = await supabase.from('customers').select('*').order('total_revenue', { ascending: false })
  if (error) throw error
  return data.map(dbToCustomer)
}
export async function upsertCustomer(c) {
  const { error } = await supabase.from('customers').upsert(customerToDb(c))
  if (error) throw error
}
export async function deleteCustomer(id) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}
function customerToDb(c) {
  // Bảng customers thật ràng buộc CHECK type IN ('personal','business') — app dùng
  // "corp" nội bộ khắp UI (card/badge/filter), map ở đây để không đụng vào UI.
  const dbType = (c.type==="corp"||c.type==="corporate") ? "business" : "personal";
  return { id:c.id, type:dbType, name:c.name,
    company_name:c.companyName||null, company_size:c.companySize||null,
    industry:c.industry||null, phone:c.phone||null, email:c.email||null,
    dob:c.dob||null, province:c.province||null, cccd:c.cccd||null,
    tags:c.tags||[], assigned_sale:c.assignedSale||null,
    total_orders:c.totalOrders||0, total_revenue:c.totalRevenue||0,
    total_profit:c.totalProfit||0, last_order_date:c.lastOrderDate||null,
    first_order_date:c.firstOrderDate||null, notes:c.notes||null,
    source:c.source||null, events:c.events||[], interactions:c.interactions||[],
    representative_title:c.representativeTitle||null, company_address:c.companyAddress||null,
    company_bank_account:c.companyBankAccount||null,
    contact_name:c.contactName||null, contact_phone:c.contactPhone||null }
}
function dbToCustomer(r) {
  return { id:r.id, type:r.type==="business"?"corp":"personal", name:r.name, companyName:r.company_name,
    companySize:r.company_size, industry:r.industry, phone:r.phone,
    email:r.email, dob:r.dob, province:r.province, cccd:r.cccd,
    tags:r.tags||[], assignedSale:r.assigned_sale,
    representativeTitle:r.representative_title, companyAddress:r.company_address,
    companyBankAccount:r.company_bank_account,
    contactName:r.contact_name, contactPhone:r.contact_phone,
    totalOrders:r.total_orders||0, totalRevenue:Number(r.total_revenue)||0,
    totalProfit:Number(r.total_profit)||0, lastOrderDate:r.last_order_date,
    firstOrderDate:r.first_order_date, notes:r.notes, source:r.source,
    events:r.events||[], interactions:r.interactions||[], createdAt:r.created_at }
}

// ─────────────────────────────────────────
// REALTIME SUBSCRIPTIONS
// Subscribe to changes on any table
// Usage: const unsub = subscribeTable('orders', () => refetch())
// ─────────────────────────────────────────
export function subscribeTable(table, onChange) {
  const channel = supabase
    .channel(`realtime_${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ─────────────────────────────────────────
// APP COLLECTIONS — bảng JSONB chung cho:
// quotes, bookings, credits, tasks, careTasks, personalTargets
// ─────────────────────────────────────────
export async function fetchCollection(collection) {
  const { data, error } = await supabase
    .from('app_collections')
    .select('*')
    .eq('collection', collection)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data.map(r => r.data)
}
export async function upsertCollectionItem(collection, item) {
  if (!item?.id) return
  const { error } = await supabase
    .from('app_collections')
    .upsert({ collection, id: String(item.id), data: item, updated_at: new Date().toISOString() })
  if (error) throw error
}
export async function deleteCollectionItem(collection, id) {
  const { error } = await supabase
    .from('app_collections')
    .delete()
    .eq('collection', collection)
    .eq('id', String(id))
  if (error) throw error
}

// ─────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────
export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data.map(r => ({
    id: r.id, msg: r.msg, type: r.type || 'info',
    targetRole: r.role, targetUser: r.target_user, createdBy: r.created_by,
    orderId: r.order_id, taskId: r.task_id, read: !!r.read,
    time: r.created_at,
  }))
}

export async function insertNotification(n) {
  const { error } = await supabase.from('notifications').insert({
    msg: n.msg, type: n.type || 'info',
    role: n.targetRole || null,
    target_user: n.targetUser || null,
    created_by: n.createdBy || null,
    order_id: n.orderId || null,
    task_id: n.taskId || null,
  })
  if (error) throw error
}

export async function markNotificationRead(notifId) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId)
  if (error) throw error
}
