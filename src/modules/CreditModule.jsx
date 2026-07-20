import React from "react";
import { daysToExpiry, computeCreditStatus, calcCreditAmount, isValidCreditUsage } from "../utils/creditCalc.js";

export default function CreditModule({ orders=[], pushNotif, credits=[], onUpdateCredits, currentUser }) {
  const [showForm,setShowForm]=React.useState(false);
  const [selected,setSelected]=React.useState(null);
  const [useAmount,setUseAmount]=React.useState("");
  const [useOrderId,setUseOrderId]=React.useState("");
  const [form,setForm]=React.useState({orderId:"",customerName:"",customerPhone:"",airlineName:"",route:"",ticketNo:"",pnr:"",originalAmount:"",feeDeducted:"",expiryDate:"",conditions:"",notes:""});

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const sync=(list)=>onUpdateCredits&&onUpdateCredits(list);

  const computeStatus=computeCreditStatus;
  const STATUS={active:{bg:"var(--c-success-bg)",c:"var(--c-success)",label:"Còn hiệu lực"},partial:{bg:"var(--c-primary-pale)",c:"var(--c-primary)",label:"Đã dùng 1 phần"},used:{bg:"var(--c-surface-3)",c:"var(--c-text-2)",label:"Đã dùng hết"},expired:{bg:"var(--c-danger-bg)",c:"var(--c-danger-mid)",label:"Đã hết hạn"}};

  const decorated=credits.map(c=>({...c,_status:computeStatus(c)}));
  const totalRemaining=decorated.filter(c=>c._status==="active"||c._status==="partial").reduce((s,c)=>s+(c.remainingAmount||0),0);
  const expiringSoon=decorated.filter(c=>(c._status==="active"||c._status==="partial")&&daysToExpiry(c.expiryDate)<=30&&daysToExpiry(c.expiryDate)>=0);

  const saveNew=()=>{
    if(!form.customerName||!form.originalAmount) return pushNotif&&pushNotif("Nhập tên khách và số tiền gốc","error");
    const original=Number(form.originalAmount)||0;
    const fee=Number(form.feeDeducted)||0;
    const creditAmount=calcCreditAmount(original,fee);
    const rec={...form,id:"BL"+Date.now(),originalAmount:original,feeDeducted:fee,creditAmount,usedAmount:0,remainingAmount:creditAmount,issueDate:new Date().toISOString().slice(0,10),status:"active",usageHistory:[],createdBy:currentUser?.name};
    sync([rec,...credits]);
    pushNotif&&pushNotif("Đã tạo bảo lưu vé "+rec.id+" — còn "+fmtMoney(creditAmount));
    setShowForm(false);
    setForm({orderId:"",customerName:"",customerPhone:"",airlineName:"",route:"",ticketNo:"",pnr:"",originalAmount:"",feeDeducted:"",expiryDate:"",conditions:"",notes:""});
  };

  const applyCredit=()=>{
    if(!selected) return;
    const amt=Number(useAmount)||0;
    if(!isValidCreditUsage(amt,selected.remainingAmount)) return pushNotif&&pushNotif("Số tiền sử dụng không hợp lệ","error");
    if(!useOrderId.trim()) return pushNotif&&pushNotif("Nhập mã đơn áp dụng","error");
    const usage={ts:new Date().toISOString(),orderId:useOrderId,amount:amt,by:currentUser?.name};
    const updated={...selected,usedAmount:(selected.usedAmount||0)+amt,remainingAmount:selected.remainingAmount-amt,usageHistory:[...(selected.usageHistory||[]),usage]};
    sync(credits.map(c=>c.id===selected.id?updated:c));
    setSelected(updated);
    pushNotif&&pushNotif("Đã áp dụng "+fmtMoney(amt)+" cho đơn "+useOrderId);
    setUseAmount(""); setUseOrderId("");
  };

  const fieldStyle={width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"};
  const labelStyle={display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"};

  if(selected){
    const sc=STATUS[selected._status];
    const days=daysToExpiry(selected.expiryDate);
    return(
      <div style={{padding:24,maxWidth:640,margin:"0 auto"}}>
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"var(--c-primary-mid)",cursor:"pointer",fontSize:14,marginBottom:16}}>← Danh sách bảo lưu</button>
        <div style={{background:"var(--c-surface)",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:19,fontWeight:800}}>{selected.id}</div>
              <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:4}}>{selected.customerName} · {selected.customerPhone}</div>
            </div>
            <span style={{background:sc.bg,color:sc.c,borderRadius:20,padding:"5px 14px",fontWeight:700,fontSize:12}}>{sc.label}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:18}}>
            {[["Hãng bay",selected.airlineName],["Chặng",selected.route],["Số vé",selected.ticketNo],["PNR",selected.pnr],["Ngày cấp",new Date(selected.issueDate).toLocaleDateString("vi-VN")],["Hạn dùng",new Date(selected.expiryDate).toLocaleDateString("vi-VN")+(days>=0?" ("+days+" ngày nữa)":" (đã hết hạn)")]].map(([k,v])=>(
              <div key={k} style={{background:"var(--c-surface-2)",borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:11,color:"var(--c-text-3)"}}>{k}</div>
                <div style={{fontSize:13,fontWeight:600}}>{v||"—"}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:14}}>
            <div style={{background:"var(--c-primary-light)",borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:11,color:"var(--c-primary)"}}>Giá trị bảo lưu</div>
              <div style={{fontSize:16,fontWeight:800,color:"var(--c-primary)"}}>{fmtMoney(selected.creditAmount)}</div>
            </div>
            <div style={{background:"var(--c-warning-bg)",borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:11,color:"var(--c-warning)"}}>Đã dùng</div>
              <div style={{fontSize:16,fontWeight:800,color:"var(--c-warning)"}}>{fmtMoney(selected.usedAmount)}</div>
            </div>
            <div style={{background:"var(--c-success-bg)",borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:11,color:"var(--c-success)"}}>Còn lại</div>
              <div style={{fontSize:16,fontWeight:800,color:"var(--c-success)"}}>{fmtMoney(selected.remainingAmount)}</div>
            </div>
          </div>
          {selected.conditions&&<div style={{fontSize:12,color:"var(--c-text-3)",marginTop:14,fontStyle:"italic"}}>Điều kiện: {selected.conditions}</div>}
        </div>

        {selected._status!=="expired"&&selected._status!=="used"&&(
          <div style={{background:"var(--c-surface)",borderRadius:16,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16}}>
            <div style={{fontWeight:700,marginBottom:12}}>Áp dụng bảo lưu cho đơn mới</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={labelStyle}>Mã đơn áp dụng</label>
                <select value={useOrderId} onChange={e=>setUseOrderId(e.target.value)} style={fieldStyle}>
                  <option value="">-- Chọn đơn --</option>
                  {orders.map(o=><option key={o.id} value={o.id}>{o.id} - {o.customerName}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Số tiền áp dụng (tối đa {fmtMoney(selected.remainingAmount)})</label>
                <input type="number" max={selected.remainingAmount} value={useAmount} onChange={e=>setUseAmount(e.target.value)} style={fieldStyle}/>
              </div>
            </div>
            <button onClick={applyCredit} style={{marginTop:12,background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:13}}>Áp dụng</button>
          </div>
        )}

        <div style={{background:"var(--c-surface)",borderRadius:16,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:12}}>Lịch sử sử dụng</div>
          {(selected.usageHistory||[]).length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:20,fontSize:13}}>Chưa sử dụng lần nào</div>}
          {(selected.usageHistory||[]).map((u,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--c-surface-3)",fontSize:13}}>
              <span>{u.orderId} · {u.by}</span>
              <span style={{fontWeight:700,color:"var(--c-primary)"}}>{fmtMoney(u.amount)}</span>
              <span style={{color:"var(--c-text-muted)",fontSize:11}}>{new Date(u.ts).toLocaleDateString("vi-VN")}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Bảo lưu vé máy bay</h2>
          <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:2}}>{credits.length} phiếu · Tổng giá trị còn lại: <b style={{color:"var(--c-success)"}}>{fmtMoney(totalRemaining)}</b></div>
        </div>
        <button onClick={()=>setShowForm(true)} style={{background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:9,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:14}}>+ Tạo bảo lưu</button>
      </div>

      {expiringSoon.length>0&&(
        <div style={{background:"var(--c-warning-bg)",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13,color:"var(--c-warning)"}}>
          ⚠️ <b>{expiringSoon.length} phiếu</b> sắp hết hạn trong 30 ngày tới — nhắc khách sử dụng trước khi mất giá trị
        </div>
      )}

      {showForm&&(
        <div style={{background:"var(--c-surface)",borderRadius:14,padding:20,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <h3 style={{margin:"0 0 16px"}}>Tạo phiếu bảo lưu vé mới</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["Tên khách *","customerName"],["SĐT","customerPhone"],["Hãng bay","airlineName"],["Chặng bay","route"],["Số vé","ticketNo"],["Mã PNR","pnr"]].map(([label,key])=>(
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input value={form[key]} onChange={e=>set(key,e.target.value)} style={fieldStyle}/>
              </div>
            ))}
            <div>
              <label style={labelStyle}>Giá trị vé gốc (₫) *</label>
              <input type="number" value={form.originalAmount} onChange={e=>set("originalAmount",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Phí huỷ/đổi bị trừ (₫)</label>
              <input type="number" value={form.feeDeducted} onChange={e=>set("feeDeducted",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Hạn sử dụng *</label>
              <input type="date" value={form.expiryDate} onChange={e=>set("expiryDate",e.target.value)} style={fieldStyle}/>
            </div>
          </div>
          {form.originalAmount&&<div style={{marginTop:10,fontSize:13,color:"var(--c-primary)",fontWeight:600}}>Giá trị bảo lưu thực tế: {fmtMoney(calcCreditAmount(Number(form.originalAmount)||0,Number(form.feeDeducted)||0))}</div>}
          <div style={{marginTop:12}}>
            <label style={labelStyle}>Điều kiện sử dụng</label>
            <input value={form.conditions} onChange={e=>set("conditions",e.target.value)} placeholder="VD: Áp dụng mọi chặng, không hoàn tiền mặt..." style={fieldStyle}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={saveNew} style={{background:"var(--c-success-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700}}>Tạo phiếu</button>
            <button onClick={()=>setShowForm(false)} style={{background:"var(--c-text-3)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      <div style={{display:"grid",gap:10}}>
        {decorated.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:48}}>Chưa có phiếu bảo lưu nào</div>}
        {decorated.map(c=>{
          const sc=STATUS[c._status];
          const days=daysToExpiry(c.expiryDate);
          return(
            <div key={c.id} onClick={()=>setSelected(c)} style={{background:"var(--c-surface)",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.07)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)"}>
              <div>
                <div style={{fontWeight:700}}>{c.id} — {c.customerName}</div>
                <div style={{fontSize:12,color:"var(--c-text-3)",marginTop:3}}>{c.airlineName} {c.route?"· "+c.route:""} {(c._status==="active"||c._status==="partial")&&days>=0&&<span style={{color:days<=30?"var(--c-danger-mid)":"var(--c-text-3)"}}> · còn {days} ngày</span>}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:700,fontSize:14,color:"var(--c-success)"}}>{fmtMoney(c.remainingAmount)}</div>
                <span style={{fontSize:11,background:sc.bg,color:sc.c,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{sc.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
