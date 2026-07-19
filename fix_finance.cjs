const fs = require('fs');
const lines = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
// FinancePanel starts at line 3077 (0-indexed: 3076)
// Next function (HDVModule) starts at line 3291 (0-indexed: 3290)
// Replace the entire corrupted FinancePanel with a clean stub

const stub = `function FinancePanel({order,vouchers,onAddVoucher,onApprove,onReject,pushNotif,currentRole,currentUser,bankAccounts=[],expenses=[]}){
  const [tab,setTab]=React.useState("thu");
  const [showForm,setShowForm]=React.useState(false);
  const [vForm,setVForm]=React.useState({type:"thu",amount:"",method:"cash",note:"",bankId:"",date:new Date().toISOString().slice(0,10)});
  const orderVouchers=(vouchers||[]).filter(v=>v.orderId===order?.id);
  const thuList=orderVouchers.filter(v=>v.type==="thu");
  const chiList=orderVouchers.filter(v=>v.type==="chi");
  const totalThu=thuList.filter(v=>["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
  const totalChi=chiList.filter(v=>["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
  const saveVoucher=()=>{
    if(!vForm.amount||Number(vForm.amount)<=0) return pushNotif&&pushNotif("Nhap so tien","error");
    const newV={id:"V"+Date.now(),orderId:order?.id,type:vForm.type,amount:Number(vForm.amount),method:vForm.method,note:vForm.note,date:vForm.date,status:"pending",createdBy:currentUser?.name,createdAt:new Date().toISOString()};
    onAddVoucher&&onAddVoucher(newV);
    pushNotif&&pushNotif("Da tao phieu - cho duyet","success");
    setShowForm(false);setVForm({type:"thu",amount:"",method:"cash",note:"",bankId:"",date:new Date().toISOString().slice(0,10)});
  };
  const statusBadge=(s)=>{
    const map={pending:{bg:"#fef9c3",color:"#ca8a04",label:"Cho duyet"},approved:{bg:"#dcfce7",color:"#16a34a",label:"Da duyet"},rejected:{bg:"#fee2e2",color:"#dc2626",label:"Tu choi"},confirmed:{bg:"#dbeafe",color:"#2563eb",label:"Da xac nhan"}};
    const c=map[s]||{bg:"#f1f5f9",color:"#64748b",label:s};
    return <span style={{fontSize:11,borderRadius:6,padding:"2px 8px",background:c.bg,color:c.color,fontWeight:600}}>{c.label}</span>;
  };
  return(
    <div style={{marginTop:16}}>
      <div style={{display:"flex",gap:8,marginBottom:16,borderBottom:"2px solid #e2e8f0",paddingBottom:8}}>
        {[["thu","Phieu thu"],["chi","Phieu chi"]].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"6px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,background:tab===k?"#2563eb":"transparent",color:tab===k?"#fff":"#64748b"}}>{label}</button>
        ))}
        <div style={{flex:1}}/>
        <div style={{fontSize:13,color:"#64748b"}}>Thu: <b style={{color:"#16a34a"}}>{totalThu.toLocaleString("vi")}d</b> | Chi: <b style={{color:"#dc2626"}}>{totalChi.toLocaleString("vi")}d</b></div>
      </div>
      {(currentRole==="cashier"||currentRole==="accountant"||currentRole==="manager") && (
        <button onClick={()=>setShowForm(true)} style={{marginBottom:12,background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13}}>+ Tao phieu {tab==="thu"?"thu":"chi"}</button>
      )}
      {showForm&&(
        <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #e2e8f0"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Loai</label>
              <select value={vForm.type} onChange={e=>setVForm(f=>({...f,type:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13}}>
                <option value="thu">Phieu thu</option><option value="chi">Phieu chi</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>So tien (d)</label>
              <input type="number" value={vForm.amount} onChange={e=>setVForm(f=>({...f,amount:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Hinh thuc</label>
              <select value={vForm.method} onChange={e=>setVForm(f=>({...f,method:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13}}>
                <option value="cash">Tien mat</option><option value="bank">Chuyen khoan</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Ngay</label>
              <input type="date" value={vForm.date} onChange={e=>setVForm(f=>({...f,date:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Ghi chu</label>
            <input value={vForm.note} onChange={e=>setVForm(f=>({...f,note:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13,boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={saveVoucher} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:13}}>Luu</button>
            <button onClick={()=>setShowForm(false)} style={{background:"#6b7280",color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:13}}>Huy</button>
          </div>
        </div>
      )}
      {(tab==="thu"?thuList:chiList).length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:13}}>Chua co phieu nao</div>}
      {(tab==="thu"?thuList:chiList).map(v=>(
        <div key={v.id} style={{background:"#fff",borderRadius:10,padding:14,marginBottom:8,border:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:600,fontSize:14}}>{v.id} — {v.method==="cash"?"Tien mat":"CK"}</div>
            <div style={{fontSize:12,color:"#64748b"}}>{v.date} {v.note&&"· "+v.note}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontWeight:700,fontSize:15,color:v.type==="thu"?"#16a34a":"#dc2626"}}>{(v.amount||0).toLocaleString("vi")}d</div>
            <div style={{marginTop:4}}>{statusBadge(v.status)}</div>
            {v.status==="pending"&&(currentRole==="accountant"||currentRole==="manager")&&(
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>onApprove&&onApprove(v.id)} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>Duyet</button>
                <button onClick={()=>onReject&&onReject(v.id)} style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>Tu choi</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}`;

// Replace lines 3077-3290 (0-indexed: 3076-3289) with clean stub
lines.splice(3076, 3290 - 3076, ...stub.split('\n'));
console.log('FinancePanel replaced. New line count:', lines.length);
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', lines.join('\n'), 'utf8');
