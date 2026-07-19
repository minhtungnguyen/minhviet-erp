function CrmModule({orders,pushNotif,customers:customersProp=SEED_CUSTOMERS,onUpdateCustomers,currentUser,msgHistory,onLogMessage,onCreateOrderFromLead}){
  const [customers,setCustomers]=React.useState(customersProp);
  const [subView,setSubView]=React.useState("list");
  const [selected,setSelected]=React.useState(null);
  const [search,setSearch]=React.useState("");
  const [filterType,setFilterType]=React.useState("all");
  const [filterTag,setFilterTag]=React.useState("all");
  const [sortBy,setSortBy]=React.useState("revenue");
  const [showForm,setShowForm]=React.useState(false);
  const [editMode,setEditMode]=React.useState(false);
  const [form,setForm]=React.useState({name:"",phone:"",email:"",type:"personal",source:"Facebook",assignedSale:currentUser?.name||"",province:"",notes:"",tags:[]});
  const [composeFor,setComposeFor]=React.useState(null);
  const [composeChannel,setComposeChannel]=React.useState("zalo");
  const [composeBody,setComposeBody]=React.useState("");

  const syncUp=(list)=>{setCustomers(list);onUpdateCustomers&&onUpdateCustomers(list);};
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const fmtTr=(n)=>((n||0)/1e6).toFixed(1)+" trđ";
  const fmtDate=(s)=>s?new Date(s).toLocaleDateString("vi-VN"):"—";
  const hasDebt=(c)=>{
    const myOrders=orders.filter(o=>o.customerPhone===c.phone);
    return myOrders.some(o=>o.status!=="closed"&&o.status!=="cancelled"&&(o.totalPrice||0)>(o.totalPaid||0));
  };

  // ── Sự kiện trong 30 ngày tới ─────────────────────────────
  const upcomingEvents=React.useMemo(()=>{
    const now=new Date();
    const list=[];
    customers.forEach(c=>{
      (c.events||[]).forEach(e=>{
        const ed=new Date(e.date);
        const thisYear=new Date(now.getFullYear(),ed.getMonth(),ed.getDate());
        let diff=Math.round((thisYear-now)/86400000);
        if(diff<0) diff=Math.round((new Date(now.getFullYear()+1,ed.getMonth(),ed.getDate())-now)/86400000);
        if(diff>=0&&diff<=30) list.push({customer:c,event:e,days:diff});
      });
    });
    return list.sort((a,b)=>a.days-b.days);
  },[customers]);

  const filtered=React.useMemo(()=>{
    let list=[...customers];
    if(search.trim()){const q=search.toLowerCase();list=list.filter(c=>c.name?.toLowerCase().includes(q)||c.phone?.includes(q)||c.email?.toLowerCase().includes(q));}
    if(filterType!=="all") list=list.filter(c=>c.type===filterType);
    if(filterTag!=="all") list=list.filter(c=>(c.tags||[]).includes(filterTag));
    if(sortBy==="revenue") list.sort((a,b)=>(b.totalRevenue||0)-(a.totalRevenue||0));
    else if(sortBy==="recent") list.sort((a,b)=>new Date(b.lastOrderDate||0)-new Date(a.lastOrderDate||0));
    else if(sortBy==="name") list.sort((a,b)=>a.name.localeCompare(b.name,"vi"));
    return list;
  },[customers,search,filterType,filterTag,sortBy]);

  const saveCustomer=()=>{
    if(!form.name.trim()||!form.phone.trim()) return pushNotif&&pushNotif("Nhập tên và SĐT","error");
    if(editMode&&selected){
      const updated={...selected,...form};
      syncUp(customers.map(c=>c.id===selected.id?updated:c));
      setSelected(updated); setShowForm(false); pushNotif&&pushNotif("Đã cập nhật khách hàng");
    } else {
      const newC={...form,id:"KH"+Date.now(),totalOrders:0,totalRevenue:0,totalProfit:0,interactions:[],events:[],tags:form.tags||[],createdAt:new Date().toISOString()};
      syncUp([newC,...customers]); setShowForm(false); pushNotif&&pushNotif("Đã thêm khách hàng mới");
    }
  };

  const openEdit=(c)=>{
    setForm({name:c.name||"",phone:c.phone||"",email:c.email||"",type:c.type||"personal",source:c.source||"Facebook",assignedSale:c.assignedSale||"",province:c.province||"",notes:c.notes||"",tags:c.tags||[]});
    setEditMode(true); setShowForm(true);
  };

  const openCompose=(c,evtType)=>{
    const tpl=MSG_TEMPLATES[evtType]||MSG_TEMPLATES.birthday;
    const honorific=c.type==="corp"?"quý công ty":"anh/chị";
    const body=(tpl.body||"").replace(/{name}/g,c.name).replace(/{honorific}/g,honorific).replace(/{year}/g,new Date().getFullYear()).replace(/{years}/g,"1").replace(/{discount}/g,"10").replace(/{companyName}/g,c.name);
    setComposeBody(body); setComposeChannel("zalo"); setComposeFor(c);
  };

  const sendCompose=()=>{
    const rec={ts:new Date().toISOString(),type:composeChannel,note:"Đã soạn thông điệp: "+composeBody.slice(0,60)+"...",by:currentUser?.name};
    const updated=customers.map(c=>c.id===composeFor.id?{...c,interactions:[rec,...(c.interactions||[])]}:c);
    syncUp(updated);
    onLogMessage&&onLogMessage(rec);
    pushNotif&&pushNotif("Đã ghi nhận gửi thông điệp cho "+composeFor.name);
    setComposeFor(null);
  };

  const STAGE_TAGS=CRM_TAGS;

  // ── DETAIL VIEW ──────────────────────────────────────────
  if(subView==="detail"&&selected){
    const live=customers.find(c=>c.id===selected.id)||selected;
    const myOrders=orders.filter(o=>o.customerPhone===live.phone||o.customer===live.name||o.customerId===live.id);
    const missingCccd=!live.cccd;
    const nextBirthday=(live.events||[]).find(e=>e.type==="birthday");
    let bdayDays=null,bdayYears=null;
    if(nextBirthday){
      const now=new Date(); const ed=new Date(nextBirthday.date);
      const thisYear=new Date(now.getFullYear(),ed.getMonth(),ed.getDate());
      bdayDays=Math.round((thisYear-now)/86400000); if(bdayDays<0) bdayDays=Math.round((new Date(now.getFullYear()+1,ed.getMonth(),ed.getDate())-now)/86400000);
      bdayYears=now.getFullYear()-ed.getFullYear();
    }
    const profitMargin=live.totalRevenue?((live.totalProfit||0)/live.totalRevenue*100):0;

    return (
      <div style={{padding:24,maxWidth:1000,margin:"0 auto"}}>
        <button onClick={()=>setSubView("list")} style={{background:"none",border:"none",color:"#2563eb",cursor:"pointer",fontSize:14,marginBottom:16}}>← Danh sách khách</button>

        {nextBirthday&&bdayDays!==null&&(
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:"12px 18px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>🎂</span>
              <span style={{fontWeight:700,fontSize:14}}>Sinh nhật ({bdayYears} năm) {bdayDays} ngày nữa</span>
            </div>
            <button onClick={()=>openCompose(live,"birthday")} style={{background:"#1e3a8a",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontWeight:700,fontSize:12}}>🎁 Soạn thiệp</button>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16}}>
          <div style={{background:"#fff",borderRadius:14,padding:22,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{textAlign:"center",fontWeight:700,fontSize:15,marginBottom:18,color:"#1e293b"}}>👤 Hồ sơ khách hàng</div>
            {[["Họ và tên",live.name,"#2563eb"],["Điện thoại",live.phone],["Email",live.email||"—"],["Ngày sinh",fmtDate(live.dob)],["Tỉnh/TP",live.province||"—"],["Nguồn KH",live.source||"—"],["Sale phụ trách",live.assignedSale||"—"]].map(([k,v,color])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                <span style={{color:"#64748b"}}>{k}</span><span style={{fontWeight:600,color:color||"#1e293b"}}>{v}</span>
              </div>
            ))}
            {(live.tags||[]).length>0&&(
              <div style={{display:"flex",gap:5,marginTop:14,flexWrap:"wrap"}}>
                {live.tags.map(tId=>{const t=CRM_TAGS.find(x=>x.id===tId);return t&&<span key={tId} style={{fontSize:11,background:t.bg,color:t.color,borderRadius:6,padding:"3px 10px",fontWeight:600}}>{t.label}</span>;})}
              </div>
            )}
            {missingCccd&&(
              <div style={{background:"#eff6ff",borderRadius:8,padding:"10px 14px",marginTop:14,fontSize:12,color:"#1d4ed8",textAlign:"center"}}>
                📋 Thiếu CCCD, đơn bị khóa. Cần follow-up.
              </div>
            )}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <button onClick={()=>openEdit(live)} style={{flex:1,background:"#f1f5f9",border:"none",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:600}}>✏️ Sửa hồ sơ</button>
              {onCreateOrderFromLead&&<button onClick={onCreateOrderFromLead} style={{flex:1,background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"8px",cursor:"pointer",fontSize:12,fontWeight:600}}>+ Tạo đơn</button>}
            </div>
          </div>

          <div>
            <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:.5,marginBottom:12,textTransform:"uppercase",textAlign:"center"}}>Giá trị khách hàng (LTV)</div>
              {[["Tổng đơn",(live.totalOrders||myOrders.length)+" đơn"],["Tổng doanh thu",fmtMoney(live.totalRevenue)],["Tổng lợi nhuận",fmtMoney(live.totalProfit)],["Biên LN TB",profitMargin.toFixed(1)+"%"],["Đơn đầu tiên",fmtDate(live.firstOrderDate)]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",fontSize:13}}>
                  <span style={{color:"#64748b"}}>{k}</span><span style={{fontWeight:700,color:"#1e293b"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:.5,marginBottom:12,textTransform:"uppercase",textAlign:"center"}}>Thao tác nhanh</div>
              <button onClick={()=>openCompose(live,"birthday")} style={{width:"100%",textAlign:"left",background:"#f8fafc",border:"none",borderRadius:8,padding:"9px 12px",cursor:"pointer",fontSize:13,marginBottom:6}}>✉️ Soạn email chúc mừng</button>
              <button onClick={()=>openCompose(live,"anniversary")} style={{width:"100%",textAlign:"left",background:"#f8fafc",border:"none",borderRadius:8,padding:"9px 12px",cursor:"pointer",fontSize:13,marginBottom:6}}>💬 Nhắn Zalo</button>
              <button onClick={()=>{navigator.clipboard?.writeText(live.phone);pushNotif&&pushNotif("Đã copy SĐT");}} style={{width:"100%",textAlign:"left",background:"#f8fafc",border:"none",borderRadius:8,padding:"9px 12px",cursor:"pointer",fontSize:13}}>📞 Copy số điện thoại</button>
            </div>
          </div>
        </div>

        {myOrders.length>0&&(
          <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginTop:16}}>
            <div style={{fontWeight:700,marginBottom:12}}>Đơn hàng ({myOrders.length})</div>
            {myOrders.map(o=>(
              <div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
                <span style={{fontWeight:600,fontSize:13}}>{o.id} <span style={{color:"#64748b",fontWeight:400}}>· {o.tourName||o.service}</span></span>
                <span style={{fontWeight:700,color:"#16a34a",fontSize:13}}>{fmtMoney(o.totalPrice)}</span>
              </div>
            ))}
          </div>
        )}

        {showForm&&<CustomerFormModal form={form} setForm={setForm} onSave={saveCustomer} onClose={()=>setShowForm(false)} title="Sửa thông tin khách"/>}
        {composeFor&&<ComposeModal customer={composeFor} channel={composeChannel} setChannel={setComposeChannel} body={composeBody} setBody={setComposeBody} onSend={sendCompose} onClose={()=>setComposeFor(null)}/>}
      </div>
    );
  }

  // ── LIST VIEW (card grid) ─────────────────────────────────
  return (
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>CRM — Khách hàng</h2>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{customers.length} khách hàng</div>
        </div>
        <button onClick={()=>{setEditMode(false);setForm({name:"",phone:"",email:"",type:"personal",source:"Facebook",assignedSale:currentUser?.name||"",province:"",notes:"",tags:[]});setShowForm(true);}} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Thêm khách</button>
      </div>

      {upcomingEvents.length>0&&(
        <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16,overflow:"hidden"}}>
          <div style={{textAlign:"center",background:"#fdf2f8",padding:"10px 16px",fontWeight:700,fontSize:13,color:"#9d174d"}}>📅 Sự kiện trong 30 ngày tới ({upcomingEvents.length})</div>
          {upcomingEvents.map((ev,i)=>{
            const cat=CRM_EVENT_TYPES[ev.event.type]||CRM_EVENT_TYPES.custom;
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderTop:i>0?"1px solid #f1f5f9":"none"}}>
                <span style={{fontSize:22}}>{cat.icon}</span>
                <div style={{flex:1}}>
                  <span style={{fontWeight:700,fontSize:14}}>{ev.customer.name}</span>
                  <span style={{color:"#64748b",fontSize:13}}> — {ev.event.label||cat.label}</span>
                </div>
                <span style={{fontWeight:700,color:"#2563eb",fontSize:13}}>{ev.days===0?"Hôm nay":ev.days+" ngày"}</span>
                <button onClick={()=>openCompose(ev.customer,ev.event.type)} style={{background:"#1e3a8a",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontWeight:700,fontSize:12}}>✉️ Soạn</button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{position:"relative",flex:1,minWidth:220}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm khách hàng, công ty, SĐT, email..." style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:20,padding:"9px 14px 9px 36px",fontSize:13,boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",background:"#f1f5f9",borderRadius:20,padding:3}}>
          {[["all","Tất cả"],["personal","👤 Cá nhân"],["corp","🏢 DN"]].map(([k,l])=>(
            <button key={k} onClick={()=>setFilterType(k)} style={{padding:"6px 14px",borderRadius:18,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterType===k?"#fff":"transparent",color:filterType===k?"#1e293b":"#64748b",boxShadow:filterType===k?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{l}</button>
          ))}
        </div>
        <select value={filterTag} onChange={e=>setFilterTag(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:20,padding:"8px 14px",fontSize:12,background:"#fff"}}>
          <option value="all">Tất cả tag</option>
          {STAGE_TAGS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:20,padding:"8px 14px",fontSize:12,background:"#fff"}}>
          <option value="revenue">Theo doanh thu</option>
          <option value="recent">Gần đây nhất</option>
          <option value="name">Theo tên</option>
        </select>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {filtered.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48,gridColumn:"1/-1"}}>Không tìm thấy khách hàng nào</div>}
        {filtered.map(c=>{
          const debt=hasDebt(c);
          return(
            <div key={c.id} onClick={()=>{setSelected(c);setSubView("detail");}} style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",cursor:"pointer",transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,.07)"}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:c.type==="corp"?"#7c3aed":"#2563eb",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,flexShrink:0}}>
                  {c.type==="corp"?"🏢":c.name?.[0]?.toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                  <div style={{fontSize:12,color:"#64748b"}}>{c.phone}</div>
                </div>
                <span style={{fontSize:10,fontWeight:700,background:c.type==="corp"?"#f5f3ff":"#eff6ff",color:c.type==="corp"?"#7c3aed":"#2563eb",borderRadius:6,padding:"2px 7px",flexShrink:0}}>{c.type==="corp"?"DN":"CN"}</span>
              </div>
              {(c.tags||[]).length>0&&(
                <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
                  {c.tags.map(tId=>{const t=CRM_TAGS.find(x=>x.id===tId);return t&&<span key={tId} style={{fontSize:10,background:t.bg,color:t.color,borderRadius:5,padding:"2px 7px",fontWeight:600}}>{t.label}</span>;})}
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,paddingTop:10,borderTop:"1px solid #f1f5f9"}}>
                {[["Đơn",c.totalOrders||0],["DT",fmtTr(c.totalRevenue)],["LN",fmtTr(c.totalProfit)]].map(([k,v])=>(
                  <div key={k} style={{textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#94a3b8"}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{v}</div>
                  </div>
                ))}
              </div>
              {debt&&<div style={{textAlign:"center",marginTop:10,background:"#fef2f2",color:"#dc2626",borderRadius:6,padding:"3px",fontSize:11,fontWeight:700}}>Còn nợ</div>}
            </div>
          );
        })}
      </div>

      {showForm&&<CustomerFormModal form={form} setForm={setForm} onSave={saveCustomer} onClose={()=>setShowForm(false)} title={editMode?"Sửa thông tin khách":"Thêm khách hàng mới"}/>}
      {composeFor&&<ComposeModal customer={composeFor} channel={composeChannel} setChannel={setComposeChannel} body={composeBody} setBody={setComposeBody} onSend={sendCompose} onClose={()=>setComposeFor(null)}/>}
    </div>
  );
}

function CustomerFormModal({form,setForm,onSave,onClose,title}){
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-panel" style={{padding:28,width:480,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
        <h3 style={{margin:"0 0 20px",fontSize:18,fontWeight:800}}>{title}</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Loại khách</label>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13}}>
              <option value="personal">Cá nhân</option><option value="corp">Doanh nghiệp</option>
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Nguồn</label>
            <select value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13}}>
              {["Facebook","Zalo","TikTok","Giới thiệu","Website","Walk-in","Khác"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          {[["Họ tên *","name","text"],["SĐT *","phone","tel"],["Email","email","email"],["Tỉnh/Thành","province","text"]].map(([label,key,type])=>(
            <div key={key}>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
              <input type={type} value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>
        <div style={{marginTop:12}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:6,color:"#374151"}}>Nhãn phân loại</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {CRM_TAGS.map(tag=>{
              const active=(form.tags||[]).includes(tag.id);
              return(
                <button key={tag.id} onClick={()=>setForm(f=>({...f,tags:active?(f.tags||[]).filter(t=>t!==tag.id):[...(f.tags||[]),tag.id]}))}
                  style={{padding:"5px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:active?tag.bg:"#f1f5f9",color:active?tag.color:"#64748b",boxShadow:active?"inset 0 0 0 1.5px "+tag.color:"none"}}>
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{marginTop:12}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Ghi chú</label>
          <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,boxSizing:"border-box",resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button onClick={onSave} style={{flex:1,background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontWeight:700,fontSize:14}}>Lưu</button>
          <button onClick={onClose} style={{flex:1,background:"#f1f5f9",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontWeight:600,fontSize:14}}>Hủy</button>
        </div>
      </div>
    </div>
  );
}

function ComposeModal({customer,channel,setChannel,body,setBody,onSend,onClose}){
  const links={
    email:"mailto:"+(customer.email||"")+"?subject="+encodeURIComponent("Minh Việt Travel")+"&body="+encodeURIComponent(body),
    zalo:"https://zalo.me/"+customer.phone,
    sms:"sms:"+customer.phone,
  };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-panel" style={{padding:0,width:520,maxWidth:"95vw",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:800,fontSize:16,color:"#1e3a8a"}}>🎂 Soạn thông điệp</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#94a3b8"}}>✕</button>
        </div>
        <div style={{padding:"16px 24px",overflowY:"auto",flex:1}}>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {[["email","✉️ Email"],["zalo","💬 Zalo"],["sms","📱 SMS"]].map(([k,l])=>(
              <button key={k} onClick={()=>setChannel(k)} style={{flex:1,padding:"8px",borderRadius:8,border:"1.5px solid "+(channel===k?"#1e3a8a":"#e2e8f0"),background:channel===k?"#eff6ff":"#fff",color:channel===k?"#1e3a8a":"#64748b",cursor:"pointer",fontWeight:600,fontSize:13}}>{l}</button>
            ))}
          </div>
          <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:.5,marginBottom:6,textTransform:"uppercase"}}>Nội dung</div>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={10} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 12px",fontSize:13,boxSizing:"border-box",resize:"vertical",fontFamily:"inherit"}}/>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 14px",marginTop:14,fontSize:13}}>
            <b>Gửi đến:</b> {customer.name} · 📞 {customer.phone}
          </div>
          <div style={{background:"#fffbeb",borderRadius:8,padding:"10px 14px",marginTop:10,fontSize:12,color:"#92400e"}}>
            💡 <b>Gửi thủ công:</b> Dùng nút bên dưới để mở Gmail/Zalo với nội dung điền sẵn, hoặc Copy rồi paste vào ứng dụng bạn dùng. Tích hợp gửi tự động sẽ được kích hoạt sau khi deploy với Supabase + Resend.
          </div>
        </div>
        <div style={{padding:"16px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10}}>
          <button onClick={()=>{navigator.clipboard?.writeText(body);}} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"10px 18px",cursor:"pointer",fontWeight:600,fontSize:13}}>📋 Copy</button>
          <a href={links[channel]} onClick={onSend} style={{flex:1,background:"#1e3a8a",color:"#fff",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontWeight:700,fontSize:13,textAlign:"center",textDecoration:"none"}}>Mở {channel==="email"?"Gmail":channel==="zalo"?"Zalo":"SMS"} →</a>
        </div>
      </div>
    </div>
  );
}
