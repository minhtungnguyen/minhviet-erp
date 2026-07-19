import React from "react";

export default function ProfilePage({ currentUser, onUpdate, onBack, pushNotif, verifyLogin }){
  const [form,setForm]=React.useState({name:currentUser?.name||"",email:currentUser?.email||"",phone:currentUser?.phone||"",avatar:currentUser?.avatar||""});
  const [pwForm,setPwForm]=React.useState({current:"",next:"",confirm:""});
  const [pwBusy,setPwBusy]=React.useState(false);
  const [tab,setTab]=React.useState("info");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const saveInfo=()=>{
    if(!form.name.trim()) return pushNotif&&pushNotif("Nhập tên","error");
    onUpdate&&onUpdate({...currentUser,...form});
    pushNotif&&pushNotif("Đã cập nhật thông tin");
  };
  const changePw=async()=>{
    if(pwForm.next.length<6) return pushNotif&&pushNotif("Mật khẩu mới tối thiểu 6 ký tự","error");
    if(pwForm.next!==pwForm.confirm) return pushNotif&&pushNotif("Xác nhận mật khẩu không khớp","error");
    setPwBusy(true);
    try{
      const verified = await verifyLogin?.(currentUser?.username, pwForm.current);
      if(!verified){ pushNotif&&pushNotif("Mật khẩu hiện tại không đúng","error"); return; }
      onUpdate&&onUpdate({...currentUser,password:pwForm.next});
      pushNotif&&pushNotif("Đã đổi mật khẩu thành công");
      setPwForm({current:"",next:"",confirm:""});
    }catch(e){
      pushNotif&&pushNotif("Không thể đổi mật khẩu: "+e.message,"error");
    }finally{
      setPwBusy(false);
    }
  };
  const ROLE_LABEL={manager:"Giám đốc",pho_giam_doc:"Phó Giám đốc",accountant:"Kế toán",cashier:"Thu ngân",sale:"Sale",dieu_hanh:"Điều hành"};
  return(
    <div style={{padding:24,maxWidth:560,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#64748b"}}>←</button>
        <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Hồ sơ cá nhân</h2>
      </div>
      <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.08)",marginBottom:16,textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:800,color:"#fff",margin:"0 auto 12px"}}>{currentUser?.name?.[0]?.toUpperCase()||"U"}</div>
        <div style={{fontSize:18,fontWeight:800}}>{currentUser?.name}</div>
        <div style={{fontSize:13,color:"#64748b",marginTop:4}}>{ROLE_LABEL[currentUser?.role]||currentUser?.role} · {currentUser?.email}</div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:16,background:"#f1f5f9",borderRadius:10,padding:4}}>
        {[["info","Thông tin"],["password","Đổi mật khẩu"]].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:tab===k?"#fff":"transparent",color:tab===k?"#1e293b":"#64748b",boxShadow:tab===k?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{label}</button>
        ))}
      </div>
      {tab==="info"&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          {[["Họ tên","name","text"],["Email","email","email"],["SĐT","phone","tel"]].map(([label,key,type])=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
              <input type={type} value={form[key]||""} onChange={e=>set(key,e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
          ))}
          <button onClick={saveInfo} style={{width:"100%",background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700,fontSize:14}}>Lưu thông tin</button>
        </div>
      )}
      {tab==="password"&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          {[["Mật khẩu hiện tại","current"],["Mật khẩu mới","next"],["Xác nhận mật khẩu mới","confirm"]].map(([label,key])=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
              <input type="password" value={pwForm[key]} onChange={e=>setPwForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
          ))}
          <button onClick={changePw} disabled={pwBusy} style={{width:"100%",background:pwBusy?"#94a3b8":"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:12,cursor:pwBusy?"not-allowed":"pointer",fontWeight:700,fontSize:14}}>{pwBusy?"Đang kiểm tra...":"Đổi mật khẩu"}</button>
        </div>
      )}
    </div>
  );
}
