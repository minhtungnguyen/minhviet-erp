import React from "react";
import { NumberInput } from "../components/ui.jsx";
import { REFUND_POLICY } from "../constants/refundPolicy.js";

function daysUntilDepart(departDateStr){
  const now = new Date();
  const depart = new Date(departDateStr);
  return Math.max(0, Math.ceil((depart - now) / 86400000));
}

function calcRefundPolicy(departDateStr,totalPrice){
  const days=daysUntilDepart?daysUntilDepart(departDateStr):Math.ceil((new Date(departDateStr)-new Date())/86400000);
  const rule=REFUND_POLICY.find(r=>days>=r.minDays)||REFUND_POLICY[REFUND_POLICY.length-1];
  return {days,pct:rule.pct,label:rule.label,amount:Math.round((totalPrice||0)*rule.pct/100)};
}

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
          <button onClick={()=>setShowForm(true)} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer'}}>+ Tạo phiếu hoàn</button>}
      </div>
      {showForm && (
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,.1)'}}>
          <h3 style={{marginTop:0}}>Phiếu hoàn tiền mới</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Đơn hàng</label>
              <select value={form.orderId} onChange={e=>setForm(f=>({...f,orderId:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px'}}>
                <option value=''>-- Chon don --</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.id}</option>)}
              </select>
              {policyCalc&&(
                <div onClick={applyPolicyAmount} style={{marginTop:6,background:"#eff6ff",borderRadius:7,padding:"7px 10px",fontSize:12,color:"#1d4ed8",cursor:"pointer",fontWeight:600}}>
                  📋 Chính sách: {policyCalc.label} → hoàn {policyCalc.pct}% = {policyCalc.amount.toLocaleString("vi-VN")}₫ <span style={{textDecoration:"underline"}}>(bấm để áp dụng)</span>
                </div>
              )}
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Số tiền hoàn (đ)</label>
              <NumberInput value={form.amount||0} onChange={v=>setForm(f=>({...f,amount:v}))} placeholder="VD: 3.000.000" style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Hình thức</label>
              <select value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px'}}>
                <option value='cash'>Tiền mặt</option>
                <option value='bank'>Chuyển khoản</option>
              </select>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Lý do</label>
              <input value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={save} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Lưu</button>
            <button onClick={()=>setShowForm(false)} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Hủy</button>
          </div>
        </div>
      )}
      <div style={{display:'grid',gap:8}}>
        {refunds.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Không có phiếu hoàn nào</div>}
        {refunds.map(r=>(
          <div key={r.id} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700}}>{r.id} — {r.orderId}</div>
              <div style={{fontSize:13,color:'#64748b'}}>{r.reason||'—'} · {r.method==='cash'?'Tiền mặt':'Chuyển khoản'}</div>
              {r.createdBy&&<div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>Tạo bởi: {r.createdBy}</div>}
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontWeight:700,color:'#dc2626',fontSize:15}}>{(r.amount||0).toLocaleString('vi-VN')}₫</div>
              <span style={{fontSize:12,background:r.status==='approved'?'#dcfce7':r.status==='rejected'?'#fee2e2':'#fef9c3',color:r.status==='approved'?'#16a34a':r.status==='rejected'?'#dc2626':'#ca8a04',borderRadius:6,padding:'2px 8px',display:'inline-block',marginTop:4}}>
                {r.status==='approved'?'Đã duyệt':r.status==='rejected'?'Từ chối':'Chờ duyệt'}
              </span>
              {r.status==='pending'&&(currentRole==='accountant'||currentRole==='manager')&&(
                <div style={{display:'flex',gap:6,marginTop:8,justifyContent:'flex-end'}}>
                  <button onClick={()=>onRefundUpdate&&onRefundUpdate({...r,status:'approved',approvedBy:currentUser?.name,approvedAt:new Date().toISOString()})} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontSize:12,cursor:'pointer',fontWeight:600}}>Duyệt</button>
                  <button onClick={()=>onRefundUpdate&&onRefundUpdate({...r,status:'rejected',rejectedBy:currentUser?.name,rejectedAt:new Date().toISOString()})} style={{background:'#dc2626',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontSize:12,cursor:'pointer',fontWeight:600}}>Từ chối</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
