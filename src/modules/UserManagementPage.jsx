import React from "react";
import { NumberInput } from "../components/ui.jsx";
import { PERMISSION_GROUPS, ROLE_DEFAULT_PERMS } from "../utils/permissions.js";

const DEPARTMENTS=["Ban lãnh đạo","Sale","Kế toán","Điều hành tour","Marketing","Nhân sự","Chăm sóc khách hàng"];

export default function UserManagementPage({ userAccounts, onUpdateAccounts, saveUser, removeUser, currentUser, pushNotif, personalTargets=[], onUpdateTargets, approvalThreshold=20000000, onUpdateThreshold }){
  const [showForm,setShowForm]=React.useState(false);
  const [editUser,setEditUser]=React.useState(null);
  const [form,setForm]=React.useState({name:"",username:"",email:"",phone:"",role:"sale",department:DEPARTMENTS[0],jobTitle:"",password:"123456",active:true,photoUrl:"",canViewTourGhep:false,perms:null});
  const [threshold,setThreshold]=React.useState(approvalThreshold/1e6);
  const ROLE_LABEL={manager:"Giám đốc",pho_giam_doc:"Phó Giám đốc",accountant:"Kế toán",cashier:"Thu ngân",sale:"Sale",dieu_hanh:"Điều hành"};
  const ROLE_COLOR={manager:"#7c3aed",pho_giam_doc:"#6d28d9",accountant:"#0891b2",cashier:"#d97706",sale:"#2563eb",dieu_hanh:"#16a34a"};

  const handlePhotoUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(file.size>3*1024*1024) return pushNotif&&pushNotif("Ảnh tối đa 3MB","error");
    const reader=new FileReader();
    reader.onload=()=>setForm(f=>({...f,photoUrl:reader.result}));
    reader.readAsDataURL(file);
  };

  const save=()=>{
    if(!form.name||!form.email) return pushNotif&&pushNotif("Nhập họ tên và email","error");
    // Auto-generate username từ email nếu để trống
    const username = form.username.trim() || form.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g,".");
    if(editUser){
      const updated={...editUser,...form, username};
      onUpdateAccounts((userAccounts||[]).map(u=>u.id===editUser.id?updated:u));
      saveUser?.(updated).catch(e=>{
        console.error("saveUser failed",e);
        pushNotif&&pushNotif("⚠ Lưu lên server thất bại: "+e.message,"error");
      });
      pushNotif&&pushNotif("Đã cập nhật tài khoản "+form.name);
    } else {
      if((userAccounts||[]).some(u=>u.email===form.email)) return pushNotif&&pushNotif("Email đã tồn tại","error");
      const newUser={...form, username, id:"U"+Date.now(), avatar:form.name?.[0]?.toUpperCase()||"?"};
      onUpdateAccounts([...(userAccounts||[]),newUser]);
      saveUser?.(newUser).catch(e=>{
        console.error("saveUser failed",e);
        pushNotif&&pushNotif("⚠ Lưu lên server thất bại: "+e.message,"error");
      });
      pushNotif&&pushNotif("Đã tạo tài khoản "+form.name+" · username: "+username);
    }
    setShowForm(false); setEditUser(null);
    setForm({name:"",username:"",email:"",phone:"",role:"sale",department:DEPARTMENTS[0],jobTitle:"",password:"123456",active:true,photoUrl:"",canViewTourGhep:false});
  };

  const toggleActive=(u)=>{
    const updated={...u,active:!u.active};
    onUpdateAccounts((userAccounts||[]).map(x=>x.id===u.id?updated:x));
    saveUser?.(updated).catch(e=>console.error("saveUser failed",e));
    pushNotif&&pushNotif((u.active?"Đã vô hiệu hóa":"Đã kích hoạt")+" tài khoản "+u.name);
  };

  const saveThreshold=()=>{
    onUpdateThreshold&&onUpdateThreshold(Number(threshold)*1e6);
    pushNotif&&pushNotif("Đã cập nhật ngưỡng duyệt: "+threshold+"M");
  };

  // ── Giao chỉ tiêu (KPI) ──
  const now=new Date();
  const [kpiMonth,setKpiMonth]=React.useState(`${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`);
  const saleUsers=(userAccounts||[]).filter(u=>u.active!==false);
  const ROLE_VN={manager:"Giám đốc",pho_giam_doc:"Phó Giám đốc",accountant:"Kế toán",cashier:"Thủ quỹ",sale:"Sale",dieu_hanh:"Điều hành"};
  const getTarget=(name)=>(personalTargets||[]).find(t=>(t.name===name||t.username===name)&&t.month===kpiMonth)?.target||0;
  const setTarget=(user,value)=>{
    const exist=(personalTargets||[]).find(t=>(t.name===user.name||t.username===user.username)&&t.month===kpiMonth);
    let next;
    if(exist) next=(personalTargets||[]).map(t=>t===exist?{...t,target:value}:t);
    else next=[...(personalTargets||[]),{id:"KPI-"+Date.now(),name:user.name,username:user.username,month:kpiMonth,target:value}];
    onUpdateTargets&&onUpdateTargets(next);
  };

  return(
    <div style={{padding:24}}>
      <h2 style={{margin:"0 0 20px",fontSize:20,fontWeight:800}}>Quản lý người dùng</h2>

      {/* Giao chỉ tiêu KPI */}
      <div style={{background:"var(--c-surface)",borderRadius:14,padding:18,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,display:"flex",alignItems:"center",gap:8}}>🎯 Giao chỉ tiêu doanh thu (KPI)</div>
            <div style={{fontSize:12,color:"var(--c-text-3)",marginTop:2}}>Đặt mục tiêu doanh thu tháng cho toàn bộ nhân viên — mọi bộ phận đều có thể gánh doanh số</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:13,color:"var(--c-text-3)",fontWeight:600}}>Tháng:</span>
            <input value={kpiMonth} onChange={e=>setKpiMonth(e.target.value)} placeholder="MM/YYYY" style={{width:100,border:"1px solid var(--c-border)",borderRadius:8,padding:"7px 10px",fontSize:13,fontWeight:600,textAlign:"center"}}/>
          </div>
        </div>
        {saleUsers.length===0?(
          <div style={{textAlign:"center",color:"var(--c-text-muted)",padding:16,fontSize:13}}>Chưa có nhân viên nào</div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {saleUsers.map(u=>(
              <div key={u.id} style={{background:"var(--c-surface-2)",borderRadius:10,padding:"12px 14px",border:"1px solid var(--c-surface-3)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:"var(--c-primary-mid)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"var(--c-text-inverse)"}}>{(u.name||"?")[0].toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--c-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                    <div style={{fontSize:10,color:"var(--c-text-3)",fontWeight:600}}>{ROLE_VN[u.role]||u.role}</div>
                  </div>
                </div>
                <label style={{fontSize:11,color:"var(--c-text-3)",fontWeight:600,display:"block",marginBottom:4}}>Chỉ tiêu tháng {kpiMonth} (₫)</label>
                <NumberInput value={getTarget(u.name)} onChange={v=>setTarget(u,v)} placeholder="VD: 150.000.000" style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"8px 12px",fontSize:13,boxSizing:"border-box",fontWeight:600}}/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Threshold setting */}
      <div style={{background:"var(--c-surface)",borderRadius:14,padding:18,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,marginBottom:4}}>Ngưỡng phê duyệt tự động</div>
          <div style={{fontSize:12,color:"var(--c-text-3)"}}>Phiếu chi vượt ngưỡng này cần Giám đốc duyệt</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input type="number" value={threshold} onChange={e=>setThreshold(e.target.value)} style={{width:80,border:"1px solid var(--c-border)",borderRadius:8,padding:"7px 10px",fontSize:14,fontWeight:700,textAlign:"center"}}/>
          <span style={{fontWeight:700}}>triệu ₫</span>
          <button onClick={saveThreshold} style={{background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>Lưu</button>
        </div>
      </div>

      {/* User list */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:15}}>Tài khoản ({(userAccounts||[]).length})</div>
        <button onClick={()=>{setEditUser(null);setForm({name:"",username:"",email:"",phone:"",role:"sale",department:DEPARTMENTS[0],jobTitle:"",password:"123456",active:true,photoUrl:"",canViewTourGhep:false});setShowForm(true);}} style={{background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:9,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Thêm</button>
      </div>

      {showForm&&(
        <div style={{background:"var(--c-surface)",borderRadius:14,padding:20,marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <h3 style={{margin:"0 0 16px"}}>{editUser?"Sửa tài khoản":"Tạo tài khoản mới"}</h3>

          <div style={{display:"flex",alignItems:"center",gap:16,background:"var(--c-surface-2)",borderRadius:10,padding:16,marginBottom:16}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:form.photoUrl?"transparent":"var(--c-border-mid)",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {form.photoUrl?<img src={form.photoUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{color:"var(--c-text-inverse)",fontWeight:800,fontSize:22}}>{form.name?.[0]?.toUpperCase()||"?"}</span>}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>Ảnh đại diện</div>
              <div style={{display:"flex",gap:8}}>
                <label style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",border:"none",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>
                  📷 Tải ảnh
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
                </label>
                {form.photoUrl&&<button onClick={()=>setForm(f=>({...f,photoUrl:""}))} style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",border:"none",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>🗑 Xóa</button>}
              </div>
              <div style={{fontSize:11,color:"var(--c-text-muted)",marginTop:5}}>JPG, PNG, WEBP · Tối đa 3MB</div>
            </div>
          </div>

          <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["Họ tên đầy đủ *","name","text"],["Tên đăng nhập","username","text"],["Mật khẩu","password","text"],["Email *","email","email"]].map(([label,key,type])=>(
              <div key={key}>
                <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>{label}</label>
                <input type={type} value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
              </div>
            ))}
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>Phòng ban</label>
              <select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13}}>
                {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>Chức danh</label>
              <input value={form.jobTitle||""} onChange={e=>setForm(f=>({...f,jobTitle:e.target.value}))} placeholder="VD: Tổng Giám đốc" style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>SĐT</label>
              <input value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>Vai trò (quyền hệ thống)</label>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value,perms:null}))} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13}}>
                {Object.entries(ROLE_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* ── MA TRẬN PHÂN QUYỀN ── */}
          {(()=>{
            const effective = Array.isArray(form.perms) ? form.perms : (ROLE_DEFAULT_PERMS[form.role]||[]);
            const isCustom = Array.isArray(form.perms);
            const toggle=(key)=>{
              const cur = Array.isArray(form.perms) ? [...form.perms] : [...(ROLE_DEFAULT_PERMS[form.role]||[])];
              const next = cur.includes(key) ? cur.filter(k=>k!==key) : [...cur,key];
              setForm(f=>({...f,perms:next}));
            };
            return(
              <div style={{marginTop:14,padding:"14px 16px",borderRadius:10,background:"var(--c-surface-2)",border:"1px solid var(--c-border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--c-text)"}}>🔐 Phân quyền chức năng</div>
                    <div style={{fontSize:11,color:"var(--c-text-3)",marginTop:2}}>
                      {isCustom?"Đang dùng quyền TÙY CHỈNH riêng":"Đang dùng quyền MẶC ĐỊNH theo vai trò"}
                    </div>
                  </div>
                  {isCustom&&<button type="button" onClick={()=>setForm(f=>({...f,perms:null}))} style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",border:"1px solid var(--c-primary-pale)",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>↺ Về mặc định</button>}
                </div>
                {PERMISSION_GROUPS.map(grp=>(
                  <div key={grp.group} style={{marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--c-text-muted)",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>{grp.group}</div>
                    <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {grp.items.map(it=>{
                        const checked=effective.includes(it.key);
                        return(
                          <label key={it.key} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"7px 10px",background:checked?"var(--c-primary-light)":"var(--c-surface)",borderRadius:7,border:`1px solid ${checked?"var(--c-primary-pale)":"var(--c-border)"}`,fontSize:12.5}}>
                            <input type="checkbox" checked={checked} onChange={()=>toggle(it.key)} style={{width:15,height:15,cursor:"pointer",accentColor:"var(--c-primary-mid)"}}/>
                            <span style={{color:checked?"var(--c-primary)":"var(--c-text-2)",fontWeight:checked?600:400}}>{it.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          {form.role==="sale"&&(
            <div style={{gridColumn:"1/-1",marginTop:10}}>
              <div style={{padding:"14px 16px",borderRadius:10,background:"var(--c-warning-bg)",border:"0.5px solid var(--c-warning-mid)"}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--c-warning)",marginBottom:10}}>Phân quyền đặc biệt</div>
                <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"10px 12px",background:"var(--c-surface)",borderRadius:8,border:`1.5px solid ${form.canViewTourGhep?"var(--c-success)":"var(--c-border)"}`}}>
                  <input type="checkbox" checked={form.canViewTourGhep||false} onChange={e=>setForm(f=>({...f,canViewTourGhep:e.target.checked}))} style={{marginTop:2,flexShrink:0,width:16,height:16,cursor:"pointer"}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:form.canViewTourGhep?"var(--c-success)":"var(--c-text-2)"}}>
                      Xem được Module Tour Ghép
                      {form.canViewTourGhep&&<span style={{marginLeft:8,fontSize:11,padding:"2px 8px",background:"var(--c-success-bg)",color:"var(--c-success)",borderRadius:999,fontWeight:500}}>Đã bật</span>}
                    </div>
                    <div style={{fontSize:12,color:"var(--c-text-3)",marginTop:3,lineHeight:1.5}}>
                      {form.canViewTourGhep?"Sale này thấy: tên NCC, giá mua, tỷ suất lãi, bảng giá đối tác.":"Mặc định: sale chỉ thấy tên tour + giá bán, không thấy NCC và giá vốn."}
                    </div>
                  </div>
                </label>
                {form.canViewTourGhep&&(
                  <div style={{marginTop:8,padding:"8px 12px",background:"var(--c-danger-bg)",borderRadius:8,fontSize:12,color:"var(--c-danger)",display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{flexShrink:0}}>⚠️</span>
                    <span>Sale này sẽ thấy tên nhà cung cấp và giá mua. Chỉ bật cho nhân viên đáng tin cậy.</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={save} style={{background:"var(--c-success-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700}}>Lưu</button>
            <button onClick={()=>setShowForm(false)} style={{background:"var(--c-text-3)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      <div style={{background:"var(--c-surface)",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,.07)",overflow:"hidden"}}>
        {(userAccounts||[]).map(u=>(
          <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid var(--c-surface-2)",opacity:u.active===false?.5:1}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:u.photoUrl?"transparent":(ROLE_COLOR[u.role]||"var(--c-text-3)"),overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--c-text-inverse)",fontWeight:800,fontSize:16,flexShrink:0}}>
              {u.photoUrl?<img src={u.photoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(u.name?.[0]?.toUpperCase()||"U")}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14}}>{u.name} {u.jobTitle&&<span style={{fontWeight:400,color:"var(--c-text-muted)",fontSize:12}}>— {u.jobTitle}</span>}</div>
              <div style={{fontSize:12,color:"var(--c-text-3)"}}>{u.email} {u.phone?"· "+u.phone:""} {u.department?"· "+u.department:""}</div>
            </div>
            <span style={{background:ROLE_COLOR[u.role]+"22",color:ROLE_COLOR[u.role]||"var(--c-text-3)",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{ROLE_LABEL[u.role]||u.role}</span>
            {u.role==="sale"&&u.canViewTourGhep&&<span style={{background:"var(--c-success-bg)",color:"var(--c-success)",borderRadius:20,padding:"3px 8px",fontSize:10,fontWeight:600}}>Tour Ghép ✓</span>}
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>{setEditUser(u);setForm({name:u.name||"",username:u.username||"",email:u.email||"",phone:u.phone||"",role:u.role||"sale",department:u.department||DEPARTMENTS[0],jobTitle:u.jobTitle||"",password:u.password||"",active:u.active!==false,photoUrl:u.photoUrl||"",canViewTourGhep:u.canViewTourGhep||false,perms:Array.isArray(u.perms)?u.perms:null});setShowForm(true);}} style={{background:"var(--c-surface-3)",border:"none",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>Sửa</button>
              {u.id!==currentUser?.id&&<button onClick={()=>toggleActive(u)} style={{background:u.active===false?"var(--c-success-bg)":"var(--c-danger-bg)",color:u.active===false?"var(--c-success-mid)":"var(--c-danger-mid)",border:"none",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>{u.active===false?"Bật":"Tắt"}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
