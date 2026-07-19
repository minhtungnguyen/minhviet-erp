import React from "react";
import { exportCustomersToExcel } from "../utils/importExcel.js";
import { SEED_CUSTOMERS } from "../seeds/index.js";
import { Btn, SearchInp, PageHeader, TabBar } from "../components/ui.jsx";

const CRM_TAGS = [
  {id:"vip",      label:"VIP",            color:"#7a5a00", bg:"#fef9e7"},
  {id:"loyal",    label:"Khách thân",     color:"#1a4d8f", bg:"#e6f1fb"},
  {id:"new",      label:"Khách mới",      color:"#2563eb", bg:"#eff6ff"},
  {id:"risk",     label:"Có rủi ro",      color:"#8b2a1a", bg:"#fdf0ee"},
  {id:"corp",     label:"Doanh nghiệp",   color:"#5c2eb0", bg:"#f3f0ff"},
  {id:"potential",label:"Tiềm năng",      color:"#0e7490", bg:"#ecfeff"},
];

// Loại sự kiện quan trọng để nhắc
const CRM_EVENT_TYPES = {
  birthday:       {label:"Sinh nhật",          icon:"🎂", color:"#be185d", bg:"#fdf2f8"},
  anniversary:    {label:"Kỷ niệm hợp tác",   icon:"🤝", color:"#1e3a8a", bg:"#eff6ff"},
  founding:       {label:"Ngày thành lập DN",  icon:"🏢", color:"#5c2eb0", bg:"#f3f0ff"},
  contract_anniv: {label:"Kỷ niệm hợp đồng",  icon:"📄", color:"#0e7490", bg:"#ecfeff"},
  custom:         {label:"Sự kiện tùy chỉnh",  icon:"⭐", color:"#7a5a00", bg:"#fef9e7"},
};

// Template thiệp/email mẫu
const MSG_TEMPLATES = {
  birthday: {
    subject:"🎂 Chúc mừng sinh nhật {name}!",
    body:`Kính gửi {name},\n\nNhân dịp sinh nhật, Minh Việt Travel xin gửi đến {honorific} những lời chúc tốt đẹp nhất!\n\nNhư một lời tri ân, chúng tôi xin dành tặng {honorific} ưu đãi đặc biệt 5% cho chuyến đi tiếp theo.\n\nMã ưu đãi: BDAY{year}\nHạn sử dụng: 30 ngày\n\nTrân trọng,\nMinh Việt Travel\n📞 0906 001 359`,
  },
  anniversary: {
    subject:"🤝 {years} năm đồng hành cùng Minh Việt Travel!",
    body:`Kính gửi {name},\n\nHôm nay đánh dấu {years} năm {honorific} đồng hành cùng Minh Việt Travel. Chúng tôi chân thành cảm ơn sự tin tưởng của {honorific} suốt thời gian qua!\n\nĐể tri ân, Minh Việt xin dành tặng ưu đãi đặc biệt {discount}% cho chuyến đi sắp tới.\n\nMã ưu đãi: ANNIV{year}\nHạn sử dụng: 60 ngày\n\nTrân trọng,\nMinh Việt Travel\n📞 0906 001 359`,
  },
  founding: {
    subject:"🏢 Chúc mừng kỷ niệm thành lập {companyName}!",
    body:`Kính gửi Ban lãnh đạo {companyName},\n\nNhân dịp kỷ niệm ngày thành lập, Minh Việt Travel xin gửi lời chúc mừng nồng nhiệt!\n\nChúng tôi rất vinh dự được đồng hành cùng quý công ty trong các chuyến du lịch và teambuilding. Kính mời quý công ty tham khảo các chương trình teambuilding hè đặc biệt của chúng tôi.\n\nTrân trọng,\nMinh Việt Travel — 0906 001 359`,
  },
};

export default function CrmModule({orders,pushNotif,customers:customersProp=SEED_CUSTOMERS,onUpdateCustomers,currentUser,msgHistory,onLogMessage,onCreateOrderFromLead,onViewOrder}){
  const [customers,setCustomers]=React.useState(customersProp);
  const [subView,setSubView]=React.useState("list");
  const [mainTab,setMainTab]=React.useState("list"); // "list"|"segment"|"history"
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
  const [bulkCompose,setBulkCompose]=React.useState(null); // {seg, list}

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

  // ── RFM SEGMENTATION ─────────────────────────────────────
  const RFM_SEGMENTS = [
    { id:"vip",     label:"VIP",           color:"#7c3aed", bg:"#f5f3ff", desc:"≥4 đơn & ≥50 triệu" },
    { id:"loyal",   label:"Thân thiết",    color:"#0284c7", bg:"#e0f2fe", desc:"≥2 đơn, <180 ngày" },
    { id:"active",  label:"Đang hoạt động",color:"#15803d", bg:"#dcfce7", desc:"Đơn gần nhất <90 ngày" },
    { id:"atrisk",  label:"Có rủi ro",     color:"#d97706", bg:"#fef3c7", desc:"90–365 ngày vắng" },
    { id:"dormant", label:"Ngủ đông",      color:"#dc2626", bg:"#fee2e2", desc:">365 ngày vắng" },
    { id:"new",     label:"Khách mới",     color:"#64748b", bg:"#f1f5f9", desc:"Mới 1 đơn" },
  ];
  const classifyRFM = (c) => {
    const now = new Date();
    const myOrds = orders.filter(o => o.customerId===c.id||(o.customerPhone&&o.customerPhone===c.phone)||o.customerName?.trim().toLowerCase()===c.name?.trim().toLowerCase());
    const n = myOrds.length;
    const rev = c.totalRevenue || myOrds.reduce((s,o)=>s+(o.totalPrice||0),0);
    const lastDate = c.lastOrderDate ? new Date(c.lastOrderDate) : (myOrds.length ? new Date(Math.max(...myOrds.map(o=>new Date(o.createdAt||o.departDate||0)))) : null);
    const daysSince = lastDate ? Math.round((now - lastDate)/86400000) : 9999;
    if(n>=4 && rev>=50e6) return "vip";
    if(n>=2 && daysSince<=180) return "loyal";
    if(daysSince<=90) return "active";
    if(daysSince<=365) return "atrisk";
    if(daysSince>365 && n>0) return "dormant";
    return "new";
  };
  const customersWithSeg = React.useMemo(()=>customers.map(c=>({...c,_seg:classifyRFM(c)})),[customers,orders]);
  const segCounts = React.useMemo(()=>{
    const m={};
    RFM_SEGMENTS.forEach(s=>{m[s.id]=customersWithSeg.filter(c=>c._seg===s.id).length;});
    return m;
  },[customersWithSeg]);
  const [segFilter,setSegFilter]=React.useState(null);

  // ── DETAIL VIEW ──────────────────────────────────────────
  if(subView==="detail"&&selected){
    const live=customers.find(c=>c.id===selected.id)||selected;
    const myOrders=orders.filter(o=>o.customerId===live.id||(o.customerPhone&&(o.customerPhone===live.phone||o.customerPhone===live.sdt))||o.customerName?.trim().toLowerCase()===live.name?.trim().toLowerCase()||o.customer===live.name);
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
        <button onClick={()=>setSubView("list")} style={{background:"none",border:"none",color:"var(--c-primary-mid)",cursor:"pointer",fontSize:"var(--text-md)",marginBottom:16}}>← Danh sách khách</button>

        {nextBirthday&&bdayDays!==null&&(
          <div style={{background:"var(--c-warning-bg)",border:"1px solid var(--c-warning-border)",borderRadius:"var(--r-lg)",padding:"12px 18px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>🎂</span>
              <span style={{fontWeight:700,fontSize:"var(--text-md)"}}>Sinh nhật ({bdayYears} năm) {bdayDays} ngày nữa</span>
            </div>
            <Btn onClick={()=>openCompose(live,"birthday")}>🎁 Soạn thiệp</Btn>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16}}>
          <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:22,boxShadow:"var(--sh-sm)"}}>
            <div style={{textAlign:"center",fontWeight:700,fontSize:"var(--text-lg)",marginBottom:18,color:"var(--c-text-2)"}}>👤 Hồ sơ khách hàng</div>
            {[["Họ và tên",live.name,"var(--c-primary-mid)"],["Điện thoại",live.phone],["Email",live.email||"—"],["Ngày sinh",fmtDate(live.dob)],["Tỉnh/TP",live.province||"—"],["Nguồn KH",live.source||"—"],["Sale phụ trách",live.assignedSale||"—"]].map(([k,v,color])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--c-border)",fontSize:"var(--text-base)"}}>
                <span style={{color:"var(--c-text-3)"}}>{k}</span><span style={{fontWeight:600,color:color||"var(--c-text-2)"}}>{v}</span>
              </div>
            ))}
            {(live.tags||[]).length>0&&(
              <div style={{display:"flex",gap:5,marginTop:14,flexWrap:"wrap"}}>
                {live.tags.map(tId=>{const t=CRM_TAGS.find(x=>x.id===tId);return t&&<span key={tId} style={{fontSize:"var(--text-xs)",background:t.bg,color:t.color,borderRadius:"var(--r-xs)",padding:"3px 10px",fontWeight:600}}>{t.label}</span>;})}
              </div>
            )}
            {missingCccd&&(
              <div style={{background:"var(--c-primary-light)",borderRadius:"var(--r-sm)",padding:"10px 14px",marginTop:14,fontSize:"var(--text-sm)",color:"var(--c-primary-mid)",textAlign:"center"}}>
                📋 Thiếu CCCD, đơn bị khóa. Cần follow-up.
              </div>
            )}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <Btn variant="secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>openEdit(live)}>✏️ Sửa hồ sơ</Btn>
              {onCreateOrderFromLead&&<Btn style={{flex:1,justifyContent:"center"}} onClick={onCreateOrderFromLead}>+ Tạo đơn</Btn>}
            </div>
          </div>

          <div>
            <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:18,boxShadow:"var(--sh-sm)",marginBottom:14}}>
              <div style={{fontSize:"var(--text-xs)",fontWeight:700,color:"var(--c-text-muted)",letterSpacing:.5,marginBottom:12,textTransform:"uppercase",textAlign:"center"}}>Giá trị khách hàng (LTV)</div>
              {[["Tổng đơn",(live.totalOrders||myOrders.length)+" đơn"],["Tổng doanh thu",fmtMoney(live.totalRevenue)],["Tổng lợi nhuận",fmtMoney(live.totalProfit)],["Biên LN TB",profitMargin.toFixed(1)+"%"],["Đơn đầu tiên",fmtDate(live.firstOrderDate)]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",fontSize:"var(--text-base)"}}>
                  <span style={{color:"var(--c-text-3)"}}>{k}</span><span style={{fontWeight:700,color:"var(--c-text-2)"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:18,boxShadow:"var(--sh-sm)"}}>
              <div style={{fontSize:"var(--text-xs)",fontWeight:700,color:"var(--c-text-muted)",letterSpacing:.5,marginBottom:12,textTransform:"uppercase",textAlign:"center"}}>Thao tác nhanh</div>
              <button onClick={()=>openCompose(live,"birthday")} style={{width:"100%",textAlign:"left",background:"var(--c-surface-2)",border:"none",borderRadius:"var(--r-sm)",padding:"9px 12px",cursor:"pointer",fontSize:"var(--text-base)",marginBottom:6}}>✉️ Soạn email chúc mừng</button>
              <button onClick={()=>openCompose(live,"anniversary")} style={{width:"100%",textAlign:"left",background:"var(--c-surface-2)",border:"none",borderRadius:"var(--r-sm)",padding:"9px 12px",cursor:"pointer",fontSize:"var(--text-base)",marginBottom:6}}>💬 Nhắn Zalo</button>
              <button onClick={()=>{navigator.clipboard?.writeText(live.phone);pushNotif&&pushNotif("Đã copy SĐT");}} style={{width:"100%",textAlign:"left",background:"var(--c-surface-2)",border:"none",borderRadius:"var(--r-sm)",padding:"9px 12px",cursor:"pointer",fontSize:"var(--text-base)"}}>📞 Copy số điện thoại</button>
            </div>
          </div>
        </div>

        {myOrders.length>0&&(
          <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:20,boxShadow:"var(--sh-sm)",marginTop:16}}>
            <div style={{fontWeight:700,marginBottom:12}}>Đơn hàng ({myOrders.length})</div>
            {myOrders.map(o=>(
              <div key={o.id} onClick={()=>onViewOrder?.(o)} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--c-border)",cursor:onViewOrder?"pointer":"default",borderRadius:6,paddingLeft:4,paddingRight:4}}
                onMouseEnter={e=>{if(onViewOrder)e.currentTarget.style.background="var(--c-surface-2)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                <span style={{fontWeight:600,fontSize:"var(--text-base)"}}>{o.id} <span style={{color:"var(--c-text-3)",fontWeight:400}}>· {o.tourName||o.service}</span></span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontWeight:700,color:"var(--c-success-mid)",fontSize:"var(--text-base)"}}>{fmtMoney(o.totalPrice)}</span>
                  {onViewOrder&&<span style={{fontSize:"var(--text-xs)",color:"var(--c-primary-mid)"}}>→</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm&&<CustomerFormModal form={form} setForm={setForm} onSave={saveCustomer} onClose={()=>setShowForm(false)} title="Sửa thông tin khách"/>}
        {composeFor&&<ComposeModal customer={composeFor} channel={composeChannel} setChannel={setComposeChannel} body={composeBody} setBody={setComposeBody} onSend={sendCompose} onClose={()=>setComposeFor(null)}/>}
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────
  const MAIN_TABS = [
    { k:"list",    label:"Khách hàng",     count:customers.length },
    { k:"segment", label:"Phân khúc RFM",  count:null },
    { k:"history", label:"Lịch sử gửi tin",count:(msgHistory||[]).length },
  ];
  return (
    <div style={{padding:24}}>
      {/* Header + Tab bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:"var(--text-2xl)",fontWeight:"var(--fw-bold)",color:"var(--c-text)"}}>CRM — Khách hàng</h2>
          <div style={{fontSize:"var(--text-base)",color:"var(--c-text-3)",marginTop:2}}>{customers.length} khách hàng</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {mainTab==="list"&&<>
            <Btn variant="success" style={{background:"var(--c-success-bg)",color:"var(--c-success)",border:"1px solid var(--c-success-border)"}} onClick={()=>exportCustomersToExcel(filtered)}>📊 Xuất Excel</Btn>
            <Btn onClick={()=>{setEditMode(false);setForm({name:"",phone:"",email:"",type:"personal",customerType:"personal",cccd:"",dob:"",companyName:"",taxCode:"",source:"Facebook",assignedSale:currentUser?.name||"",province:"",notes:"",tags:[]});setShowForm(true);}}>+ Thêm khách</Btn>
          </>}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:2,borderBottom:"2px solid var(--c-border)",marginBottom:20}}>
        {MAIN_TABS.map(t=>(
          <button key={t.k} onClick={()=>setMainTab(t.k)} style={{
            padding:"9px 18px",border:"none",cursor:"pointer",fontSize:"var(--text-base)",fontWeight:mainTab===t.k?700:500,
            background:"transparent",color:mainTab===t.k?"var(--c-primary-mid)":"var(--c-text-3)",
            borderBottom:mainTab===t.k?"2.5px solid var(--c-primary-mid)":"2.5px solid transparent",
            marginBottom:-2,transition:"color .15s"
          }}>
            {t.label}
            {t.count!=null&&t.count>0&&<span style={{marginLeft:6,background:mainTab===t.k?"var(--c-primary-pale)":"var(--c-border)",color:mainTab===t.k?"var(--c-primary-hover)":"var(--c-text-2)",borderRadius:"var(--r-pill)",padding:"1px 7px",fontSize:"var(--text-xs)",fontWeight:700}}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── TAB: DANH SÁCH KHÁCH HÀNG ── */}
      {mainTab==="list"&&(<>
        {upcomingEvents.length>0&&(
          <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",boxShadow:"var(--sh-sm)",marginBottom:16,overflow:"hidden"}}>
            <div style={{textAlign:"center",background:"var(--c-danger-bg)",padding:"10px 16px",fontWeight:700,fontSize:"var(--text-base)",color:"var(--c-danger)"}}>📅 Sự kiện trong 30 ngày tới ({upcomingEvents.length})</div>
            {upcomingEvents.map((ev,i)=>{
              const cat=CRM_EVENT_TYPES[ev.event.type]||CRM_EVENT_TYPES.custom;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderTop:i>0?"1px solid var(--c-border)":"none"}}>
                  <span style={{fontSize:22}}>{cat.icon}</span>
                  <div style={{flex:1}}>
                    <span style={{fontWeight:700,fontSize:"var(--text-md)"}}>{ev.customer.name}</span>
                    <span style={{color:"var(--c-text-3)",fontSize:"var(--text-base)"}}> — {ev.event.label||cat.label}</span>
                  </div>
                  <span style={{fontWeight:700,color:"var(--c-primary-mid)",fontSize:"var(--text-base)"}}>{ev.days===0?"Hôm nay":ev.days+" ngày"}</span>
                  <Btn size="sm" onClick={()=>openCompose(ev.customer,ev.event.type)}>✉️ Soạn</Btn>
                </div>
              );
            })}
          </div>
        )}

        <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
          <SearchInp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm khách hàng, công ty, SĐT, email..." style={{flex:1,minWidth:220}}/>
          <div style={{display:"flex",background:"var(--c-surface-2)",borderRadius:"var(--r-pill)",padding:3}}>
            {[["all","Tất cả"],["personal","👤 Cá nhân"],["corp","🏢 DN"]].map(([k,l])=>(
              <button key={k} onClick={()=>setFilterType(k)} style={{padding:"6px 14px",borderRadius:"var(--r-md)",border:"none",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:600,background:filterType===k?"var(--c-surface)":"transparent",color:filterType===k?"var(--c-text)":"var(--c-text-3)",boxShadow:filterType===k?"var(--sh-xs)":"none"}}>{l}</button>
            ))}
          </div>
          <select value={filterTag} onChange={e=>setFilterTag(e.target.value)} style={{border:"1px solid var(--c-border)",borderRadius:"var(--r-pill)",padding:"8px 14px",fontSize:"var(--text-sm)",background:"var(--c-surface)",color:"var(--c-text)"}}>
            <option value="all">Tất cả tag</option>
            {STAGE_TAGS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:"1px solid var(--c-border)",borderRadius:"var(--r-pill)",padding:"8px 14px",fontSize:"var(--text-sm)",background:"var(--c-surface)",color:"var(--c-text)"}}>
            <option value="revenue">Theo doanh thu</option>
            <option value="recent">Gần đây nhất</option>
            <option value="name">Theo tên</option>
          </select>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
          {filtered.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:48,gridColumn:"1/-1"}}>Không tìm thấy khách hàng nào</div>}
          {filtered.map(c=>{
            const debt=hasDebt(c);
            const seg=RFM_SEGMENTS.find(s=>s.id===classifyRFM(c));
            return(
              <div key={c.id} onClick={()=>{setSelected(c);setSubView("detail");}} style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:18,boxShadow:"var(--sh-sm)",cursor:"pointer",transition:"box-shadow .15s"}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="var(--sh-md)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="var(--sh-sm)"}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:c.type==="corp"?"var(--c-purple)":"var(--c-primary-mid)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"var(--text-lg)",flexShrink:0}}>
                    {c.type==="corp"?"🏢":c.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:"var(--text-md)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                    <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)"}}>{c.phone}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                    <span style={{fontSize:"var(--text-2xs)",fontWeight:700,background:c.type==="corp"?"var(--c-purple-bg)":"var(--c-primary-light)",color:c.type==="corp"?"var(--c-purple)":"var(--c-primary-mid)",borderRadius:"var(--r-xs)",padding:"2px 7px"}}>{c.type==="corp"?"DN":"CN"}</span>
                    {seg&&<span style={{fontSize:"var(--text-2xs)",fontWeight:700,background:seg.bg,color:seg.color,borderRadius:"var(--r-xs)",padding:"2px 7px"}}>{seg.label}</span>}
                  </div>
                </div>
                {(c.tags||[]).length>0&&(
                  <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
                    {c.tags.map(tId=>{const t=CRM_TAGS.find(x=>x.id===tId);return t&&<span key={tId} style={{fontSize:"var(--text-2xs)",background:t.bg,color:t.color,borderRadius:"var(--r-xs)",padding:"2px 7px",fontWeight:600}}>{t.label}</span>;})}
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,paddingTop:10,borderTop:"1px solid var(--c-border)"}}>
                  {[["Đơn",c.totalOrders||0],["DT",fmtTr(c.totalRevenue)],["LN",fmtTr(c.totalProfit)]].map(([k,v])=>(
                    <div key={k} style={{textAlign:"center"}}>
                      <div style={{fontSize:"var(--text-2xs)",color:"var(--c-text-muted)"}}>{k}</div>
                      <div style={{fontSize:"var(--text-base)",fontWeight:700,color:"var(--c-text-2)"}}>{v}</div>
                    </div>
                  ))}
                </div>
                {debt&&<div style={{textAlign:"center",marginTop:10,background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",borderRadius:"var(--r-xs)",padding:"3px",fontSize:"var(--text-xs)",fontWeight:700}}>Còn nợ</div>}
              </div>
            );
          })}
        </div>
      </>)}

      {/* ── TAB: PHÂN KHÚC RFM ── */}
      {mainTab==="segment"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
            {RFM_SEGMENTS.map(seg=>(
              <div key={seg.id} onClick={()=>setSegFilter(segFilter===seg.id?null:seg.id)}
                style={{background:segFilter===seg.id?seg.bg:"var(--c-surface)",border:"2px solid "+(segFilter===seg.id?seg.color:"var(--c-border)"),
                  borderRadius:"var(--r-md)",padding:"16px 18px",cursor:"pointer",transition:"all .15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <span style={{fontSize:"var(--text-xs)",fontWeight:700,background:seg.bg,color:seg.color,borderRadius:"var(--r-xs)",padding:"2px 9px"}}>{seg.label}</span>
                  <span style={{fontSize:"var(--text-3xl)",fontWeight:800,color:seg.color,lineHeight:1}}>{segCounts[seg.id]||0}</span>
                </div>
                <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)"}}>{seg.desc}</div>
                <div style={{fontSize:"var(--text-xs)",color:seg.color,marginTop:4,fontWeight:600}}>
                  {segCounts[seg.id]?`${Math.round((segCounts[seg.id]/customers.length)*100)}% tổng KH`:"Không có"}
                </div>
              </div>
            ))}
          </div>

          {segFilter&&(()=>{
            const seg=RFM_SEGMENTS.find(s=>s.id===segFilter);
            const list=customersWithSeg.filter(c=>c._seg===segFilter);
            return (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:"var(--text-lg)"}}>
                    Khách hàng phân khúc: <span style={{color:seg.color}}>{seg.label}</span>
                    <span style={{marginLeft:8,fontSize:"var(--text-base)",fontWeight:400,color:"var(--c-text-3)"}}>({list.length} người)</span>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {list.length>0&&<Btn size="sm" style={{background:seg.color}} onClick={()=>setBulkCompose({seg,list})}>📣 Gửi tin hàng loạt ({list.length})</Btn>}
                    <button onClick={()=>setSegFilter(null)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--c-text-muted)",fontSize:18}}>✕</button>
                  </div>
                </div>
                <div style={{background:"var(--c-surface)",borderRadius:"var(--r-md)",overflow:"hidden",boxShadow:"var(--sh-sm)"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"var(--text-base)"}}>
                    <thead>
                      <tr style={{background:"var(--c-surface-2)"}}>
                        {["Khách hàng","SĐT","Đơn","Doanh thu","Ngày cuối","Thao tác"].map(h=>(
                          <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:600,fontSize:"var(--text-sm)",color:"var(--c-text-3)",borderBottom:"1px solid var(--c-border)"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--c-text-muted)"}}>Không có khách hàng nào</td></tr>}
                      {list.map((c,i)=>(
                        <tr key={c.id} style={{borderBottom:i<list.length-1?"1px solid var(--c-border)":"none"}} className="table-row-hover">
                          <td style={{padding:"10px 14px"}}>
                            <div style={{fontWeight:700}}>{c.name}</div>
                            <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>{c.type==="corp"?"Doanh nghiệp":"Cá nhân"}</div>
                          </td>
                          <td style={{padding:"10px 14px",color:"var(--c-text-2)"}}>{c.phone}</td>
                          <td style={{padding:"10px 14px",fontWeight:700,color:"var(--c-primary-mid)"}}>{c.totalOrders||0}</td>
                          <td style={{padding:"10px 14px",fontWeight:700,color:"var(--c-success)"}}>{fmtTr(c.totalRevenue)}</td>
                          <td style={{padding:"10px 14px",color:"var(--c-text-3)",fontSize:"var(--text-sm)"}}>{c.lastOrderDate?new Date(c.lastOrderDate).toLocaleDateString("vi-VN"):"—"}</td>
                          <td style={{padding:"10px 14px"}}>
                            <Btn size="xs" variant="secondary" onClick={()=>{setSelected(c);setSubView("detail");}}>Xem</Btn>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
          {!segFilter&&(
            <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-md)",padding:"20px 24px"}}>
              <div style={{fontWeight:600,fontSize:"var(--text-base)",color:"var(--c-text-2)",marginBottom:8}}>Hướng dẫn sử dụng</div>
              <ul style={{margin:0,padding:"0 0 0 18px",fontSize:"var(--text-base)",color:"var(--c-text-3)",lineHeight:2}}>
                <li>Click vào thẻ phân khúc để xem danh sách khách hàng trong nhóm đó</li>
                <li><b style={{color:"var(--c-purple)"}}>VIP</b>: ưu tiên chăm sóc đặc biệt, tặng quà, ưu đãi riêng</li>
                <li><b style={{color:"var(--c-info)"}}>Thân thiết</b>: duy trì tương tác đều đặn, tư vấn tour mới</li>
                <li><b style={{color:"var(--c-warning-mid)"}}>Có rủi ro</b>: cần liên hệ lại, hỏi lý do vắng, đề xuất ưu đãi</li>
                <li><b style={{color:"var(--c-danger-mid)"}}>Ngủ đông</b>: chiến dịch win-back, ưu đãi đặc biệt để kéo lại</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: LỊCH SỬ GỬI TIN ── */}
      {mainTab==="history"&&(
        <div>
          {(!msgHistory||msgHistory.length===0)?(
            <div style={{textAlign:"center",padding:64,color:"var(--c-text-muted)"}}>
              <div style={{fontSize:40,marginBottom:12}}>📤</div>
              <div style={{fontWeight:600,fontSize:"var(--text-lg)",marginBottom:4}}>Chưa có lịch sử gửi tin</div>
              <div style={{fontSize:"var(--text-base)"}}>Vào hồ sơ khách hàng và soạn tin để ghi lịch sử tại đây</div>
            </div>
          ):(
            <div style={{background:"var(--c-surface)",borderRadius:"var(--r-md)",overflow:"hidden",boxShadow:"var(--sh-sm)"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"var(--text-base)"}}>
                <thead>
                  <tr style={{background:"var(--c-surface-2)"}}>
                    {["Thời gian","Khách hàng","Kênh","Sự kiện / Nội dung","Người gửi"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:600,fontSize:"var(--text-sm)",color:"var(--c-text-3)",borderBottom:"1px solid var(--c-border)"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(msgHistory||[]).slice(0,100).map((rec,i)=>{
                    const ch={email:"✉️ Email",zalo:"💬 Zalo",sms:"📱 SMS"}[rec.type]||rec.type||"—";
                    return(
                      <tr key={i} style={{borderBottom:i<(msgHistory.length-1)?"1px solid var(--c-border)":"none"}} className="table-row-hover">
                        <td style={{padding:"10px 14px",color:"var(--c-text-3)",fontSize:"var(--text-sm)",whiteSpace:"nowrap"}}>{new Date(rec.ts).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td>
                        <td style={{padding:"10px 14px"}}>
                          <div style={{fontWeight:700,color:"var(--c-text-2)"}}>{rec.customerName||"—"}</div>
                          {rec.phone&&<div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>{rec.phone}</div>}
                        </td>
                        <td style={{padding:"10px 14px",whiteSpace:"nowrap"}}>{ch}</td>
                        <td style={{padding:"10px 14px",maxWidth:300}}>
                          <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--c-text-2)"}}>{rec.note||rec.body||"—"}</div>
                        </td>
                        <td style={{padding:"10px 14px",color:"var(--c-text-3)",fontSize:"var(--text-sm)"}}>{rec.by||rec.sentBy||"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(msgHistory||[]).length>100&&<div style={{textAlign:"center",padding:"12px",fontSize:"var(--text-sm)",color:"var(--c-text-muted)"}}>Hiển thị 100 / {msgHistory.length} bản ghi gần nhất</div>}
            </div>
          )}
        </div>
      )}

      {showForm&&<CustomerFormModal form={form} setForm={setForm} onSave={saveCustomer} onClose={()=>setShowForm(false)} title={editMode?"Sửa thông tin khách":"Thêm khách hàng mới"}/>}
      {composeFor&&<ComposeModal customer={composeFor} channel={composeChannel} setChannel={setComposeChannel} body={composeBody} setBody={setComposeBody} onSend={sendCompose} onClose={()=>setComposeFor(null)}/>}
      {bulkCompose&&<BulkComposeModal seg={bulkCompose.seg} list={bulkCompose.list} currentUser={currentUser} onLogMessage={onLogMessage} pushNotif={pushNotif} onClose={()=>setBulkCompose(null)}/>}
    </div>
  );
}

function CustomerFormModal({form,setForm,onSave,onClose,title}){
  const isCorpType=(t)=>t==="corporate"||t==="corp";
  const lbl={display:"block",fontSize:"var(--text-sm)",fontWeight:600,marginBottom:4,color:"var(--c-text-2)"};
  const inp={width:"100%",border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-sm)",padding:"8px 12px",fontSize:"var(--text-base)",boxSizing:"border-box",outline:"none",background:"var(--c-surface)",color:"var(--c-text)"};
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-panel" style={{padding:28,width:520,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
        <h3 style={{margin:"0 0 20px",fontSize:"var(--text-xl)",fontWeight:800,color:"var(--c-text)"}}>{title}</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={lbl}>Loại khách</label>
            <select value={form.customerType||form.type||"personal"} onChange={e=>setForm(f=>({...f,customerType:e.target.value,type:e.target.value}))} style={inp}>
              <option value="personal">Cá nhân</option>
              <option value="corporate">Doanh nghiệp / Tổ chức</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Nguồn</label>
            <select value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))} style={inp}>
              {["Facebook","Zalo","TikTok","Giới thiệu","Website","Walk-in","Khác"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>{isCorpType(form.customerType||form.type)?"Người đại diện *":"Họ tên *"}</label>
            <input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inp}/>
          </div>
          <div>
            <label style={lbl}>SĐT *</label>
            <input value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={inp}/>
          </div>
          {isCorpType(form.customerType||form.type)&&(
            <>
              <div style={{gridColumn:"1/-1"}}>
                <label style={lbl}>Tên công ty / Tổ chức *</label>
                <input value={form.companyName||""} onChange={e=>setForm(f=>({...f,companyName:e.target.value}))} placeholder="VD: Công ty CP ABC" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Mã số thuế</label>
                <input value={form.taxCode||""} onChange={e=>setForm(f=>({...f,taxCode:e.target.value}))} placeholder="0312345678" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Tỉnh / Thành phố</label>
                <input value={form.province||""} onChange={e=>setForm(f=>({...f,province:e.target.value}))} style={inp}/>
              </div>
            </>
          )}
          <div>
            <label style={lbl}>Email</label>
            <input type="email" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={inp}/>
          </div>
          {!isCorpType(form.customerType||form.type)&&(
            <div>
              <label style={lbl}>Tỉnh / Thành phố</label>
              <input value={form.province||""} onChange={e=>setForm(f=>({...f,province:e.target.value}))} style={inp}/>
            </div>
          )}
          <div>
            <label style={lbl}>Số CCCD / CMND</label>
            <input value={form.cccd||""} onChange={e=>setForm(f=>({...f,cccd:e.target.value}))} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Ngày sinh</label>
            <input type="date" value={form.dob||""} onChange={e=>setForm(f=>({...f,dob:e.target.value}))} style={inp}/>
          </div>
        </div>
        <div style={{marginTop:12}}>
          <label style={{...lbl,marginBottom:8}}>Nhãn phân loại</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {CRM_TAGS.map(tag=>{
              const active=(form.tags||[]).includes(tag.id);
              return(
                <button key={tag.id} onClick={()=>setForm(f=>({...f,tags:active?(f.tags||[]).filter(t=>t!==tag.id):[...(f.tags||[]),tag.id]}))}
                  style={{padding:"5px 12px",borderRadius:"var(--r-pill)",border:"none",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:600,background:active?tag.bg:"var(--c-surface-2)",color:active?tag.color:"var(--c-text-3)",boxShadow:active?"inset 0 0 0 1.5px "+tag.color:"none"}}>
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{marginTop:12}}>
          <label style={lbl}>Ghi chú</label>
          <textarea value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{...inp,resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <Btn style={{flex:1,justifyContent:"center"}} onClick={onSave}>Lưu</Btn>
          <Btn variant="secondary" style={{flex:1,justifyContent:"center"}} onClick={onClose}>Hủy</Btn>
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
        <div style={{padding:"18px 24px",borderBottom:"1px solid var(--c-border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:800,fontSize:"var(--text-xl)",color:"var(--c-primary)"}}>🎂 Soạn thông điệp</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"var(--c-text-muted)"}}>✕</button>
        </div>
        <div style={{padding:"16px 24px",overflowY:"auto",flex:1}}>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {[["email","✉️ Email"],["zalo","💬 Zalo"],["sms","📱 SMS"]].map(([k,l])=>(
              <button key={k} onClick={()=>setChannel(k)} style={{flex:1,padding:"8px",borderRadius:"var(--r-sm)",border:"1.5px solid "+(channel===k?"var(--c-primary)":"var(--c-border)"),background:channel===k?"var(--c-primary-light)":"var(--c-surface)",color:channel===k?"var(--c-primary)":"var(--c-text-3)",cursor:"pointer",fontWeight:600,fontSize:"var(--text-base)"}}>{l}</button>
            ))}
          </div>
          <div style={{fontSize:"var(--text-xs)",fontWeight:700,color:"var(--c-text-muted)",letterSpacing:.5,marginBottom:6,textTransform:"uppercase"}}>Nội dung</div>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={10} style={{width:"100%",border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-sm)",padding:"10px 12px",fontSize:"var(--text-base)",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",background:"var(--c-surface)",color:"var(--c-text)"}}/>
          <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-sm)",padding:"10px 14px",marginTop:14,fontSize:"var(--text-base)"}}>
            <b>Gửi đến:</b> {customer.name} · 📞 {customer.phone}
          </div>
          <div style={{background:"var(--c-warning-bg)",borderRadius:"var(--r-sm)",padding:"10px 14px",marginTop:10,fontSize:"var(--text-sm)",color:"var(--c-warning)"}}>
            💡 <b>Gửi thủ công:</b> Dùng nút bên dưới để mở Gmail/Zalo với nội dung điền sẵn, hoặc Copy rồi paste vào ứng dụng bạn dùng. Tích hợp gửi tự động sẽ được kích hoạt sau khi deploy với Supabase + Resend.
          </div>
        </div>
        <div style={{padding:"16px 24px",borderTop:"1px solid var(--c-border)",display:"flex",gap:10}}>
          <Btn variant="secondary" onClick={()=>{navigator.clipboard?.writeText(body);}}>📋 Copy</Btn>
          <a href={links[channel]} onClick={onSend} style={{flex:1,background:"var(--c-primary)",color:"#fff",border:"none",borderRadius:"var(--r-sm)",padding:"10px",cursor:"pointer",fontWeight:700,fontSize:"var(--text-base)",textAlign:"center",textDecoration:"none"}}>Mở {channel==="email"?"Gmail":channel==="zalo"?"Zalo":"SMS"} →</a>
        </div>
      </div>
    </div>
  );
}

function BulkComposeModal({seg,list,currentUser,onLogMessage,pushNotif,onClose}){
  const [channel,setChannel]=React.useState("zalo");
  const [tplKey,setTplKey]=React.useState("winback");
  const [body,setBody]=React.useState("");
  const [sent,setSent]=React.useState(false);

  const BULK_TPLS={
    winback:{label:"Win-back",body:`Kính gửi {name},\n\nĐã lâu không gặp! Minh Việt Travel nhớ {honorific} và muốn chia sẻ chương trình đặc biệt dành riêng cho khách quen.\n\nChúng tôi có nhiều tour hấp dẫn hè này với ưu đãi lên đến 15% dành cho {honorific}.\n\nLiên hệ ngay: 0906 001 359\nTrân trọng,\nMinh Việt Travel`},
    promo:{label:"Khuyến mãi",body:`Kính gửi {name},\n\nMinh Việt Travel trân trọng gửi đến {honorific} chương trình ưu đãi hè:\n✈️ Tour Đà Nẵng 3N2Đ từ 2.990.000đ/người\n🏖️ Tour Phú Quốc 4N3Đ từ 4.500.000đ/người\n🌿 Tour Sapa 3N2Đ từ 1.990.000đ/người\n\nĐặt trước 30/06 giảm thêm 10%!\nHotline: 0906 001 359\nTrân trọng,\nMinh Việt Travel`},
    upsell:{label:"Upsell tour mới",body:`Kính gửi {name},\n\nCảm ơn {honorific} đã tin tưởng Minh Việt Travel! Chúng tôi vừa ra mắt chương trình tour mới rất phù hợp với {honorific}:\n\n🌟 Tour Nhật Bản mùa hoa anh đào 8N7Đ — Khởi hành tháng 4/2026\n🌊 Tour Đà Lạt khám phá 4N3Đ — Khởi hành thứ 6 hàng tuần\n\nDành ưu tiên đặt chỗ cho khách quen! Liên hệ: 0906 001 359\nTrân trọng,\nMinh Việt Travel`},
  };

  React.useEffect(()=>{setBody(BULK_TPLS[tplKey]?.body||"");},[tplKey]);

  const totalPhones=list.map(c=>c.phone).filter(Boolean).join(", ");
  const totalEmails=list.map(c=>c.email).filter(Boolean).join(", ");

  const handleLogAll=()=>{
    const ts=new Date().toISOString();
    list.forEach(c=>{
      onLogMessage&&onLogMessage({ts,type:channel,note:"Gửi hàng loạt: "+body.slice(0,60)+"...",by:currentUser?.name,customerId:c.id,customerName:c.name,phone:c.phone,channel,eventType:"bulk",eventLabel:"Gửi hàng loạt ("+seg.label+")",body:body.replace(/{name}/g,c.name).replace(/{honorific}/g,c.type==="corp"?"quý công ty":"anh/chị")});
    });
    pushNotif&&pushNotif("Đã ghi lịch sử "+list.length+" tin nhắn hàng loạt");
    setSent(true);
  };

  const copyContacts=()=>{
    const txt=list.map(c=>`${c.name} | ${c.phone||"—"} | ${c.email||"—"}`).join("\n");
    navigator.clipboard?.writeText(txt);
    pushNotif&&pushNotif("Đã copy "+list.length+" liên hệ");
  };

  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-panel" style={{padding:0,width:620,maxWidth:"96vw",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 24px",borderBottom:"1px solid var(--c-border)",display:"flex",justifyContent:"space-between",alignItems:"center",background:seg.bg}}>
          <div>
            <div style={{fontWeight:800,fontSize:"var(--text-xl)",color:seg.color}}>📣 Gửi tin hàng loạt — {seg.label}</div>
            <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)",marginTop:2}}>{list.length} khách hàng trong phân khúc này</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"var(--c-text-muted)"}}>✕</button>
        </div>
        <div style={{padding:"16px 24px",overflowY:"auto",flex:1}}>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {[["zalo","💬 Zalo"],["email","✉️ Email"],["sms","📱 SMS"]].map(([k,l])=>(
              <button key={k} onClick={()=>setChannel(k)} style={{flex:1,padding:"8px",borderRadius:"var(--r-sm)",border:"1.5px solid "+(channel===k?"var(--c-primary)":"var(--c-border)"),background:channel===k?"var(--c-primary-light)":"var(--c-surface)",color:channel===k?"var(--c-primary)":"var(--c-text-3)",cursor:"pointer",fontWeight:600,fontSize:"var(--text-base)"}}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {Object.entries(BULK_TPLS).map(([k,t])=>(
              <button key={k} onClick={()=>setTplKey(k)} style={{padding:"6px 14px",borderRadius:"var(--r-pill)",border:"1.5px solid "+(tplKey===k?"var(--c-primary)":"var(--c-border)"),background:tplKey===k?"var(--c-primary-light)":"var(--c-surface)",color:tplKey===k?"var(--c-primary)":"var(--c-text-3)",cursor:"pointer",fontWeight:600,fontSize:"var(--text-sm)"}}>{t.label}</button>
            ))}
          </div>
          <div style={{fontSize:"var(--text-xs)",fontWeight:700,color:"var(--c-text-muted)",letterSpacing:.5,marginBottom:6,textTransform:"uppercase"}}>Nội dung tin nhắn</div>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={9} style={{width:"100%",border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-sm)",padding:"10px 12px",fontSize:"var(--text-base)",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",background:"var(--c-surface)",color:"var(--c-text)"}}/>
          <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)",marginTop:4}}>Dùng {"{name}"} và {"{honorific}"} để cá nhân hoá. Mỗi tin sẽ thay bằng tên thực của khách.</div>

          {channel==="zalo"&&(
            <div style={{background:"var(--c-success-bg)",border:"1px solid var(--c-success-border)",borderRadius:"var(--r-sm)",padding:"10px 14px",marginTop:12,fontSize:"var(--text-sm)",color:"var(--c-success)"}}>
              <b>📱 Danh sách SĐT ({list.filter(c=>c.phone).length} số):</b><br/>
              <span style={{fontFamily:"var(--font-mono)",wordBreak:"break-all"}}>{totalPhones||"Không có số nào"}</span>
            </div>
          )}
          {channel==="email"&&(
            <div style={{background:"var(--c-primary-light)",border:"1px solid var(--c-primary-pale)",borderRadius:"var(--r-sm)",padding:"10px 14px",marginTop:12,fontSize:"var(--text-sm)",color:"var(--c-primary-hover)"}}>
              <b>✉️ Danh sách email ({list.filter(c=>c.email).length} địa chỉ):</b><br/>
              <span style={{fontFamily:"var(--font-mono)",wordBreak:"break-all"}}>{totalEmails||"Không có email nào"}</span>
            </div>
          )}

          <div style={{background:"var(--c-warning-bg)",borderRadius:"var(--r-sm)",padding:"10px 14px",marginTop:12,fontSize:"var(--text-sm)",color:"var(--c-warning)"}}>
            💡 <b>Gửi thủ công:</b> Copy danh sách liên hệ, paste vào Zalo/Gmail. Sau khi gửi xong, nhấn "Ghi lịch sử" để lưu vào hệ thống.
          </div>

          {sent&&<div style={{background:"var(--c-success-bg)",border:"1px solid var(--c-success-border)",borderRadius:"var(--r-sm)",padding:"12px 14px",marginTop:12,fontSize:"var(--text-base)",color:"var(--c-success)",fontWeight:600,textAlign:"center"}}>✅ Đã ghi lịch sử {list.length} tin nhắn!</div>}
        </div>
        <div style={{padding:"14px 24px",borderTop:"1px solid var(--c-border)",display:"flex",gap:10}}>
          <Btn variant="secondary" onClick={copyContacts}>📋 Copy liên hệ</Btn>
          <Btn style={{flex:1,justifyContent:"center",background:sent?"var(--c-border)":"var(--c-primary)",color:sent?"var(--c-text-muted)":"#fff"}} disabled={sent} onClick={handleLogAll}>{sent?"✅ Đã ghi lịch sử":"📝 Ghi lịch sử gửi tin"}</Btn>
        </div>
      </div>
    </div>
  );
}
