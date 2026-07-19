import React from "react";

export default function BankAccountModule({ bankAccounts, onUpdate, pushNotif }){
  const [showForm,setShowForm]=React.useState(false);
  const [editAcc,setEditAcc]=React.useState(null);
  const [form,setForm]=React.useState({bankName:"",accountNumber:"",accountName:"",branch:"",balance:"",note:""});
  const save=()=>{
    if(!form.bankName||!form.accountNumber) return pushNotif&&pushNotif("Nhập tên ngân hàng và số tài khoản","error");
    const payload={...form,balance:form.balance!==""?Number(form.balance):undefined};
    if(editAcc){
      onUpdate((bankAccounts||[]).map(a=>a.id===editAcc.id?{...a,...payload}:a));
      pushNotif&&pushNotif("Đã cập nhật tài khoản");
    } else {
      onUpdate([...(bankAccounts||[]),{...payload,id:"BA"+Date.now(),active:true}]);
      pushNotif&&pushNotif("Đã thêm tài khoản ngân hàng");
    }
    setShowForm(false); setEditAcc(null); setForm({bankName:"",accountNumber:"",accountName:"",branch:"",balance:"",note:""});
  };
  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Tài khoản ngân hàng ({(bankAccounts||[]).length})</h2>
        <button onClick={()=>{setEditAcc(null);setForm({bankName:"",accountNumber:"",accountName:"",branch:"",note:""});setShowForm(true);}} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 18px",cursor:"pointer",fontWeight:700,fontSize:14}}>+ Thêm TK</button>
      </div>
      {showForm&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <h3 style={{margin:"0 0 16px",fontSize:15}}>{editAcc?"Sửa tài khoản":"Thêm tài khoản"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["Ngân hàng *","bankName"],["Số tài khoản *","accountNumber"],["Tên tài khoản","accountName"],["Chi nhánh","branch"]].map(([label,key])=>(
              <div key={key}>
                <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
                <input value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
              </div>
            ))}
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Số dư hiện tại (₫)</label>
              <input type="number" value={form.balance} onChange={e=>setForm(f=>({...f,balance:e.target.value}))} placeholder="Để trống nếu chưa biết" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Ghi chú</label>
            <input value={form.note||""} onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={save} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700}}>Lưu</button>
            <button onClick={()=>setShowForm(false)} style={{background:"#6b7280",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}
      <div style={{display:"grid",gap:10}}>
        {(bankAccounts||[]).length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48}}>Chưa có tài khoản nào</div>}
        {(bankAccounts||[]).map(a=>(
          <div key={a.id} style={{background:"#fff",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"#1e293b"}}>{a.shortName||a.bankName}</div>
              <div style={{fontFamily:"monospace",fontSize:15,fontWeight:700,color:"#2563eb",marginTop:4,letterSpacing:2}}>{a.accountNumber||a.accountNo}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{a.accountName} {a.branch?"· "+a.branch:""}</div>
              {a.note&&<div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{a.note}</div>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {a.balance!=null&&<div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#94a3b8"}}>Số dư</div><div style={{fontWeight:800,fontSize:15,color:"#15803d"}}>{(a.balance||0).toLocaleString("vi-VN")}₫</div></div>}
              <button onClick={()=>{setEditAcc(a);setForm({bankName:a.bankName||"",accountNumber:a.accountNumber||a.accountNo||"",accountName:a.accountName||"",branch:a.branch||"",balance:a.balance!=null?String(a.balance):"",note:a.note||""});setShowForm(true);}} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>Sửa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
