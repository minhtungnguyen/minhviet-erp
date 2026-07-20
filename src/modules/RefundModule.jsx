import React from "react";
import { NumberInput } from "../components/ui.jsx";
import { calcRefundPolicy } from "../utils/refund.js";

export default function RefundModule({ orders=[], vouchers=[], refunds=[], onRefundUpdate, onRefundCreate, pushNotif, currentRole, currentUser }) {
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ orderId:'', amount:'', reason:'', method:'cash' });
  const selectedOrder=orders.find(o=>o.id===form.orderId);
  const policyCalc=selectedOrder?.departDate?calcRefundPolicy(selectedOrder.departDate,selectedOrder.totalPrice):null;

  const applyPolicyAmount=()=>{
    if(policyCalc) setForm(f=>({...f,amount:String(policyCalc.amount)}));
  };

  const save = () => {
    if (!form.orderId||!form.amount) return pushNotif('Điền đủ thông tin','error');
    const rec = {...form, id:'RF'+Date.now(), amount:Number(form.amount), status:'pending', createdAt:new Date().toISOString(), createdBy:currentUser?.name, policyPct:policyCalc?.pct};
    onRefundCreate(rec);
    pushNotif('Tạo phiếu hoàn tiền thành công');
    setShowForm(false);
    setForm({orderId:'',amount:'',reason:'',method:'cash'});
  };
  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={{margin:0}}>Hoàn tiền / Refund ({refunds.length})</h2>
        {(currentRole==='manager'||currentRole==='accountant'||currentRole==='cashier') &&
          <button onClick={()=>setShowForm(true)} style={{background:'var(--c-primary-mid)',color:'var(--c-text-inverse)',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer'}}>+ Tạo phiếu hoàn</button>}
      </div>
      {showForm && (
        <div style={{background:'var(--c-surface)',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,.1)'}}>
          <h3 style={{marginTop:0}}>Phiếu hoàn tiền mới</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Đơn hàng</label>
              <select value={form.orderId} onChange={e=>setForm(f=>({...f,orderId:e.target.value}))} style={{width:'100%',border:'1px solid var(--c-border)',borderRadius:8,padding:'8px 12px'}}>
                <option value=''>-- Chon don --</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.id}</option>)}
              </select>
              {policyCalc&&(
                <div onClick={applyPolicyAmount} style={{marginTop:6,background:"var(--c-primary-light)",borderRadius:7,padding:"7px 10px",fontSize:12,color:"var(--c-primary)",cursor:"pointer",fontWeight:600}}>
                  📋 Chính sách: {policyCalc.label} → hoàn {policyCalc.pct}% = {policyCalc.amount.toLocaleString("vi-VN")}₫ <span style={{textDecoration:"underline"}}>(bấm để áp dụng)</span>
                </div>
              )}
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Số tiền hoàn (đ)</label>
              <NumberInput value={form.amount||0} onChange={v=>setForm(f=>({...f,amount:v}))} placeholder="VD: 3.000.000" style={{width:'100%',border:'1px solid var(--c-border)',borderRadius:8,padding:'8px 12px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Hình thức</label>
              <select value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))} style={{width:'100%',border:'1px solid var(--c-border)',borderRadius:8,padding:'8px 12px'}}>
                <option value='cash'>Tiền mặt</option>
                <option value='bank'>Chuyển khoản</option>
              </select>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Lý do</label>
              <input value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} style={{width:'100%',border:'1px solid var(--c-border)',borderRadius:8,padding:'8px 12px',boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={save} style={{background:'var(--c-success-mid)',color:'var(--c-text-inverse)',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Lưu</button>
            <button onClick={()=>setShowForm(false)} style={{background:'var(--c-text-3)',color:'var(--c-text-inverse)',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Hủy</button>
          </div>
        </div>
      )}
      <div style={{display:'grid',gap:8}}>
        {refunds.length===0 && <div style={{textAlign:'center',color:'var(--c-text-muted)',padding:40}}>Không có phiếu hoàn nào</div>}
        {refunds.map(r=>(
          <div key={r.id} style={{background:'var(--c-surface)',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700}}>{r.id} — {r.orderId}</div>
              <div style={{fontSize:13,color:'var(--c-text-3)'}}>{r.reason||'—'} · {r.method==='cash'?'Tiền mặt':'Chuyển khoản'}</div>
              {r.createdBy&&<div style={{fontSize:11,color:'var(--c-text-muted)',marginTop:2}}>Tạo bởi: {r.createdBy}</div>}
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontWeight:700,color:'var(--c-danger-mid)',fontSize:15}}>{(r.amount||0).toLocaleString('vi-VN')}₫</div>
              <span style={{fontSize:12,background:r.status==='approved'?'var(--c-success-bg)':r.status==='rejected'?'var(--c-danger-bg)':'var(--c-warning-bg)',color:r.status==='approved'?'var(--c-success-mid)':r.status==='rejected'?'var(--c-danger-mid)':'var(--c-warning)',borderRadius:6,padding:'2px 8px',display:'inline-block',marginTop:4}}>
                {r.status==='approved'?'Đã duyệt':r.status==='rejected'?'Từ chối':'Chờ duyệt'}
              </span>
              {r.status==='pending'&&(currentRole==='accountant'||currentRole==='manager')&&(
                <div style={{display:'flex',gap:6,marginTop:8,justifyContent:'flex-end'}}>
                  <button onClick={()=>onRefundUpdate&&onRefundUpdate({...r,status:'approved',approvedBy:currentUser?.name,approvedAt:new Date().toISOString()})} style={{background:'var(--c-success-mid)',color:'var(--c-text-inverse)',border:'none',borderRadius:6,padding:'4px 12px',fontSize:12,cursor:'pointer',fontWeight:600}}>Duyệt</button>
                  <button onClick={()=>onRefundUpdate&&onRefundUpdate({...r,status:'rejected',rejectedBy:currentUser?.name,rejectedAt:new Date().toISOString()})} style={{background:'var(--c-danger-mid)',color:'var(--c-text-inverse)',border:'none',borderRadius:6,padding:'4px 12px',fontSize:12,cursor:'pointer',fontWeight:600}}>Từ chối</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
