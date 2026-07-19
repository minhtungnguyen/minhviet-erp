import React from "react";
import { NumberInput, Btn } from "../components/ui.jsx";
import { SERVICE_TYPES } from "../constants/serviceTypes.js";

const SALE_STAFF = ["Nguyễn Thị Hoa","Trần Văn Nam","Lê Thị Mai","Phạm Quốc Hùng","Đỗ Thị Lan"];

// Parse chuỗi số có dấu chấm phân cách về số nguyên
const parseNum = (s) => parseInt(String(s).replace(/\./g,"").replace(/[^\d]/g,""),10)||0;

const COMBO_COMPONENTS_DEFAULT = {
  flight:    { enabled:false, priceAdult:"", label:"Vé máy bay",   icon:"✈️" },
  tour_ghep: { enabled:false, priceAdult:"", label:"Tour ghép",    icon:"🔗" },
  cruise:    { enabled:false, priceAdult:"", label:"Du thuyền",    icon:"🚢" },
  hotel:     { enabled:false, priceAdult:"", label:"Khách sạn",    icon:"🏨" },
  ticket:    { enabled:false, priceAdult:"", label:"Vé tham quan", icon:"🎡" },
};

const COMBO_SHORT_NAMES = {
  flight:"Máy bay", tour_ghep:"Tour ghép", cruise:"Du thuyền",
  hotel:"Khách sạn", ticket:"Vé tham quan",
};

export default function OrderForm({onSave,onCancel,pushNotif,defaultSale=SALE_STAFF[0],currentRole="sale",customers=[],onCreateCustomer,tourPrograms=[],tourGhepProducts=[],initialData=null,orders=[],currentUser=null,userAccounts=[]}){
  const [step,setStep]=React.useState(1);
  // Danh sách nhân viên phụ trách — gồm sale, điều hành + người đang đăng nhập
  const staffOptions = React.useMemo(()=>{
    const fromUsers = (userAccounts||[])
      .filter(u=>u.active!==false && ["sale","dieu_hanh","manager"].includes(u.role))
      .map(u=>u.name);
    const merged = [...new Set([currentUser?.name, ...fromUsers, ...SALE_STAFF].filter(Boolean))];
    return merged;
  },[userAccounts,currentUser]);
  const [form,setForm]=React.useState(initialData||{
    invoiceType:"no_invoice",customerType:"personal",
    customerName:"",customerPhone:"",customerEmail:"",customerProvince:"",customerId:"",
    cccd:"",cccdImg:"",companyName:"",taxCode:"",companyAddress:"",
    service:"tour_package",tourName:"",departDate:"",returnDate:"",sale:defaultSale,
    adultQty:1,adultPrice:"",child10Qty:0,child10Price:"",child5Qty:0,child5Price:"",child2Qty:0,child2Price:"",infantQty:0,infantPrice:"",
    costPrice:"",depositAmount:"",note:"",source:"Facebook",passengers:[],
    comboComponents:{...COMBO_COMPONENTS_DEFAULT},comboDiscount:"",comboName:"",
    tourGhepProductId:"",tourGhepProductName:"",
  });
  const [custSearch,setCustSearch]=React.useState("");
  const [showCustDrop,setShowCustDrop]=React.useState(false);
  const [errors,setErrors]=React.useState({});

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const fmtNum=(s)=>Number(String(s).replace(/[^\d]/g,""))||0;
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"đ";

  const isCombo = form.service === "combo";
  const isTourGhep = form.service === "tour_ghep";

  // Combo: sum of enabled components × adult qty, minus discount
  const comboEnabledItems = Object.entries(form.comboComponents||{}).filter(([,c])=>c.enabled);
  const comboRaw = comboEnabledItems.reduce((s,[,c])=>s+fmtNum(c.priceAdult)*fmtNum(form.adultQty),0);
  const comboTotal = Math.max(0, comboRaw - fmtNum(form.comboDiscount||0));

  // Auto-name combo from enabled components
  const autoComboName = comboEnabledItems.length >= 2
    ? "Combo " + comboEnabledItems.map(([k])=>COMBO_SHORT_NAMES[k]||k).join(" + ")
    : "";

  const setComboComp = (compKey, field, value) =>
    setForm(f=>({...f, comboComponents:{...f.comboComponents,[compKey]:{...f.comboComponents[compKey],[field]:value}}}));

  const totalPrice = isCombo
    ? comboTotal
    : fmtNum(form.adultQty)*fmtNum(form.adultPrice)+fmtNum(form.child10Qty)*fmtNum(form.child10Price)+fmtNum(form.child5Qty)*fmtNum(form.child5Price)+fmtNum(form.child2Qty)*fmtNum(form.child2Price)+fmtNum(form.infantQty)*fmtNum(form.infantPrice);
  const pax=fmtNum(form.adultQty)+fmtNum(form.child10Qty)+fmtNum(form.child5Qty)+fmtNum(form.child2Qty)+fmtNum(form.infantQty);
  const profit=totalPrice-fmtNum(form.costPrice);
  const profitPct=totalPrice?(profit/totalPrice*100):0;

  const canViewGhepCost = currentUser?.canViewTourGhep === true;

  const filteredCust=React.useMemo(()=>{
    if(!custSearch.trim()) return [];
    const q=custSearch.toLowerCase();
    return customers.filter(c=>c.name?.toLowerCase().includes(q)||c.phone?.includes(q)).slice(0,6);
  },[customers,custSearch]);

  const dupOrder=React.useMemo(()=>{
    if(!form.customerPhone||!form.departDate) return null;
    return orders.find(o=>o.customerPhone===form.customerPhone&&o.departDate===form.departDate&&!["cancelled"].includes(o.status));
  },[form.customerPhone,form.departDate,orders]);

  // ── Checklist tiêu chí (KIỂM TRA NHANH) ──────────────────
  const checklist=[
    {label:"Họ tên",ok:!!form.customerName.trim()},
    {label:"SĐT",ok:!!form.customerPhone.trim()},
    {label:"CCCD",ok:!!form.cccd.trim()},
    {label:"Tên dịch vụ",ok:!!form.tourName.trim()},
    {label:"Ngày đi",ok:!!form.departDate},
    {label:"Email",ok:!!form.customerEmail.trim()},
    {label:"Lợi nhuận ≥ 5%",ok:profitPct>=5},
    {label:"Loại hóa đơn",ok:!!form.invoiceType},
    {label:"MST (DN có HĐ)",ok:!(form.invoiceType==="invoice"&&form.customerType==="corporate")||!!form.taxCode.trim()},
  ];
  const checklistDone=checklist.filter(c=>c.ok).length;

  const STEPS=[{n:1,label:"Thông tin khách"},{n:2,label:"Dịch vụ & Giá"},{n:3,label:"Kiểm soát"}];

  const validateStep=(s)=>{
    const e={};
    if(s===1){
      if(!form.customerName.trim()) e.customerName="Bắt buộc";
      if(!form.customerPhone.trim()) e.customerPhone="Bắt buộc";
      if(form.invoiceType==="invoice"&&form.customerType==="corporate"){
        if(!form.companyName.trim()) e.companyName="Bắt buộc khi xuất HĐ doanh nghiệp";
        if(!form.taxCode.trim()) e.taxCode="Bắt buộc khi xuất HĐ doanh nghiệp";
      }
    }
    if(s===2){
      if(isCombo){
        if(!(form.comboName.trim()||autoComboName)) e.tourName="Bắt buộc";
      } else {
        if(!form.tourName.trim()) e.tourName="Bắt buộc";
      }
      if(!form.departDate) e.departDate="Bắt buộc";
      if(isCombo){
        const enabled=Object.values(form.comboComponents||{}).filter(c=>c.enabled);
        if(enabled.length<2) e.combo="Chọn ít nhất 2 thành phần Combo";
        else if(enabled.some(c=>!(fmtNum(c.priceAdult)>0))) e.combo="Nhập giá cho mỗi thành phần đã chọn";
        else if(fmtNum(form.comboDiscount||0)<0) e.combo="Chiết khấu không được âm";
      } else {
        if(totalPrice<=0) e.adultPrice="Nhập ít nhất 1 đơn giá và số lượng";
      }
    }
    setErrors(e); return Object.keys(e).length===0;
  };

  const goNext=()=>{ if(validateStep(step)) setStep(s=>Math.min(3,s+1)); };
  const goBack=()=>setStep(s=>Math.max(1,s-1));

  const handleSave=()=>{
    if(!validateStep(1)||!validateStep(2)) return;
    if(dupOrder&&!window.confirm("Khách này đã có đơn "+dupOrder.id+" cùng ngày khởi hành. Vẫn tạo đơn mới?")) return;
    // Auto-upsert khách vào CRM — check trùng SĐT trước
    if(onCreateCustomer&&form.customerPhone.trim()){
      const existingCustomer=customers?.find(c=>c.phone===form.customerPhone.trim()||c.sdt===form.customerPhone.trim());
      if(existingCustomer){
        onCreateCustomer({...existingCustomer,
          email:existingCustomer.email||form.customerEmail||"",
          cccd:existingCustomer.cccd||form.cccd||"",
          province:existingCustomer.province||form.customerProvince||"",
          totalOrders:(existingCustomer.totalOrders||0)+1,
          lastOrderDate:new Date().toISOString().slice(0,10),
        });
      } else if(!form.customerId){
        onCreateCustomer({
          id:"KH-"+Date.now(),
          type:"personal",
          customerType:form.customerType||"personal",
          invoiceType:form.invoiceType||"no_invoice",
          name:form.customerName,
          phone:form.customerPhone,
          email:form.customerEmail||"",
          province:form.customerProvince||"",
          cccd:form.cccd||"",
          companyName:form.companyName||"",
          taxCode:form.taxCode||"",
          source:form.source||"Khác",
          tags:[],notes:"",
          totalOrders:1,totalRevenue:0,totalProfit:0,
          firstOrderDate:new Date().toISOString().slice(0,10),
          lastOrderDate:new Date().toISOString().slice(0,10),
          createdAt:new Date().toISOString(),
        });
      }
    }
    const svcLabel = SERVICE_TYPES.find(s=>s.id===form.service)?.label||form.service;
    const resolvedName = isCombo ? (form.comboName.trim()||autoComboName||"Combo") : form.tourName;
    onSave({
      ...form,
      service: form.service,
      serviceName: resolvedName,
      serviceLabel: isCombo ? `[Combo] ${(form.comboName.trim()||autoComboName||"Combo").replace(/^Combo\s*/,"").trim()||resolvedName}` : svcLabel,
      tourName: resolvedName,
      totalPrice, pax, costPrice:fmtNum(form.costPrice),
      depositAmount:fmtNum(form.depositAmount),
      status:"pending_payment", totalPaid:0,
      invoiceType:form.invoiceType,
      customerType:form.customerType,
      companyName:form.companyName,
      taxCode:form.taxCode,
      companyAddress:form.companyAddress,
      ...(isCombo ? {
        comboComponents: form.comboComponents,
        comboDiscount: fmtNum(form.comboDiscount||0),
        comboName: form.comboName.trim()||autoComboName,
        comboRaw, comboTotal,
      } : {}),
      ...(isTourGhep ? {
        tourGhepProductId: form.tourGhepProductId,
        tourGhepProductName: form.tourGhepProductName,
      } : {}),
    });
  };

  const inputStyle=(key)=>({width:"100%",border:"1.5px solid "+(errors[key]?"var(--c-danger-border)":"var(--c-border-mid)"),borderRadius:"var(--r-sm)",padding:"9px 12px",fontSize:"var(--text-base)",boxSizing:"border-box",outline:"none",background:"var(--c-surface)",color:"var(--c-text)"});
  const labelStyle={display:"block",fontSize:"var(--text-xs)",fontWeight:700,letterSpacing:.3,marginBottom:5,color:"var(--c-text-3)",textTransform:"uppercase"};

  return(
    <div style={{maxWidth:1000,margin:"0 auto"}}>
      {/* Stepper */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:24,background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:"18px 24px",boxShadow:"var(--sh-sm)"}}>
        {STEPS.map((s,i)=>(
          <React.Fragment key={s.n}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:step>s.n?"var(--c-success-mid)":step===s.n?"var(--c-primary)":"var(--c-surface-2)",color:step>=s.n?"#fff":"var(--c-text-muted)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"var(--text-base)"}}>
                {step>s.n?"✓":s.n}
              </div>
              <span style={{fontWeight:700,fontSize:"var(--text-base)",color:step===s.n?"var(--c-text-2)":step>s.n?"var(--c-success-mid)":"var(--c-text-muted)"}}>{s.label}</span>
            </div>
            {i<STEPS.length-1&&<div style={{width:60,height:2,background:step>s.n?"var(--c-success-mid)":"var(--c-border)",margin:"0 16px"}}/>}
          </React.Fragment>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
        <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:24,boxShadow:"var(--sh-sm)"}}>
          {step===1&&(
            <div>
              {/* BƯỚC 0: Hóa đơn VAT */}
              <div style={{marginBottom:20}}>
                <label style={labelStyle}>Khách có lấy hóa đơn VAT không? *</label>
                <div style={{display:"flex",gap:10,marginTop:6}}>
                  {[
                    {val:"no_invoice",label:"Không lấy hóa đơn",desc:"TK thu: VCB Thùy Anh",color:"var(--c-success)",bg:"var(--c-success-bg)"},
                    {val:"invoice",label:"Có lấy hóa đơn VAT",desc:"TK thu: HDBank Công ty",color:"var(--c-primary-mid)",bg:"var(--c-primary-light)"},
                  ].map(opt=>(
                    <button key={opt.val} type="button" onClick={()=>set("invoiceType",opt.val)} style={{flex:1,padding:"12px 16px",borderRadius:"var(--r-md)",cursor:"pointer",border:"1.5px solid "+(form.invoiceType===opt.val?opt.color:"var(--c-border)"),background:form.invoiceType===opt.val?opt.bg:"var(--c-surface)",textAlign:"left"}}>
                      <div style={{fontWeight:600,fontSize:"var(--text-base)",color:form.invoiceType===opt.val?opt.color:"var(--c-text-2)"}}>{opt.label}</div>
                      <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)",marginTop:3}}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Loại khách — chỉ hiện khi có HĐ */}
              {form.invoiceType==="invoice"&&(
                <div style={{marginBottom:16}}>
                  <label style={labelStyle}>Loại khách hàng</label>
                  <div style={{display:"flex",gap:8,marginTop:6}}>
                    {[
                      {val:"personal",label:"Cá nhân",icon:"👤"},
                      {val:"corporate",label:"Doanh nghiệp / Tổ chức",icon:"🏢"},
                    ].map(opt=>(
                      <button key={opt.val} type="button" onClick={()=>set("customerType",opt.val)} style={{flex:1,padding:"10px 14px",borderRadius:"var(--r-sm)",cursor:"pointer",border:"1.5px solid "+(form.customerType===opt.val?"var(--c-purple)":"var(--c-border)"),background:form.customerType===opt.val?"var(--c-purple-bg)":"var(--c-surface)",display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:16}}>{opt.icon}</span>
                        <span style={{fontSize:"var(--text-base)",fontWeight:600,color:form.customerType===opt.val?"var(--c-purple)":"var(--c-text-2)"}}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{fontWeight:700,marginBottom:16,fontSize:"var(--text-lg)",color:"var(--c-text-2)"}}>👤 Thông tin khách hàng</div>
              <div style={{position:"relative",marginBottom:14}}>
                <label style={labelStyle}>Tìm khách có sẵn</label>
                <input value={custSearch} onChange={e=>{setCustSearch(e.target.value);setShowCustDrop(true);}} onFocus={()=>setShowCustDrop(true)} placeholder="Nhập tên hoặc SĐT..." style={inputStyle("search")}/>
                {showCustDrop&&filteredCust.length>0&&(
                  <div style={{position:"absolute",top:"100%",left:0,right:0,background:"var(--c-surface)",border:"1px solid var(--c-border)",borderRadius:"var(--r-sm)",boxShadow:"var(--sh-md)",zIndex:100,maxHeight:200,overflowY:"auto"}}>
                    {filteredCust.map(c=>(
                      <div key={c.id} onClick={()=>{set("customerName",c.name);set("customerPhone",c.phone);set("customerEmail",c.email||"");set("customerId",c.id);setCustSearch(c.name);setShowCustDrop(false);}}
                        style={{padding:"10px 14px",cursor:"pointer",fontSize:"var(--text-base)",borderBottom:"1px solid var(--c-border)",display:"flex",justifyContent:"space-between"}}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--c-surface-2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                        <span style={{fontWeight:600}}>{c.name}</span><span style={{color:"var(--c-text-3)"}}>{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div><label style={labelStyle}>Họ tên *</label><input value={form.customerName} onChange={e=>set("customerName",e.target.value)} style={inputStyle("customerName")}/></div>
                <div><label style={labelStyle}>SĐT *</label><input value={form.customerPhone} onChange={e=>set("customerPhone",e.target.value)} style={inputStyle("customerPhone")}/></div>
                <div><label style={labelStyle}>Email</label><input value={form.customerEmail} onChange={e=>set("customerEmail",e.target.value)} style={inputStyle("customerEmail")}/></div>
                <div>
                  <label style={labelStyle}>Nguồn</label>
                  <select value={form.source} onChange={e=>set("source",e.target.value)} style={inputStyle("source")}>
                    {["Facebook","Zalo","TikTok","Giới thiệu","Website","Khác"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Số CCCD/CMND</label><input value={form.cccd} onChange={e=>set("cccd",e.target.value)} style={inputStyle("cccd")}/></div>
                <div>
                  <label style={labelStyle}>Ảnh CCCD / Hộ chiếu <span style={{fontWeight:400,color:"var(--c-text-muted)"}}>(tùy chọn)</span></label>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:form.cccdImg?"6px":0}}>
                    <label style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 12px",background:"var(--c-primary-light)",color:"var(--c-primary-hover)",border:"1px solid var(--c-primary-pale)",borderRadius:"var(--r-sm)",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:600,flexShrink:0}}>
                      📎 Tải ảnh lên
                      <input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{
                        const file=e.target.files?.[0];
                        if(!file) return;
                        if(file.size>5*1024*1024){alert("File tối đa 5MB");return;}
                        const reader=new FileReader();
                        reader.onload=(ev)=>set("cccdImg",ev.target.result);
                        reader.readAsDataURL(file);
                      }}/>
                    </label>
                    {form.cccdImg&&(
                      form.cccdImg.startsWith("data:")?(
                        <img src={form.cccdImg} alt="CCCD" onClick={()=>window.open(form.cccdImg)} style={{height:34,borderRadius:5,cursor:"zoom-in",border:"1px solid var(--c-border)",objectFit:"cover"}}/>
                      ):(
                        <a href={form.cccdImg} target="_blank" rel="noreferrer" style={{fontSize:"var(--text-sm)",color:"var(--c-primary-mid)"}}>🔗 Xem ảnh</a>
                      )
                    )}
                    {form.cccdImg&&<button type="button" onClick={()=>set("cccdImg","")} style={{background:"none",border:"none",color:"var(--c-danger-mid)",cursor:"pointer",fontSize:"var(--text-sm)",padding:0}}>✕</button>}
                  </div>
                  {!form.cccdImg&&<input value={form.cccdImg} onChange={e=>set("cccdImg",e.target.value)} placeholder="hoặc dán link Google Drive..." style={{...inputStyle("cccdImg"),fontSize:"var(--text-xs)",padding:"5px 10px",marginTop:4}}/>}
                </div>
              </div>
              {/* Fields doanh nghiệp — chỉ hiện khi có HĐ + corporate */}
              {form.invoiceType==="invoice"&&form.customerType==="corporate"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14,paddingTop:14,borderTop:"1px solid var(--c-border)"}}>
                  <div style={{gridColumn:"1/-1"}}>
                    <div style={{fontSize:"var(--text-sm)",color:"var(--c-purple)",fontWeight:700,marginBottom:10}}>Thông tin xuất hóa đơn</div>
                  </div>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={labelStyle}>Tên công ty / Tổ chức *</label>
                    <input value={form.companyName} onChange={e=>set("companyName",e.target.value)} placeholder="VD: Công ty CP ABC" style={inputStyle("companyName")}/>
                    {errors.companyName&&<span style={{color:"var(--c-danger-mid)",fontSize:"var(--text-xs)"}}>{errors.companyName}</span>}
                  </div>
                  <div>
                    <label style={labelStyle}>Mã số thuế *</label>
                    <input value={form.taxCode} onChange={e=>set("taxCode",e.target.value)} placeholder="VD: 0312345678" style={inputStyle("taxCode")}/>
                    {errors.taxCode&&<span style={{color:"var(--c-danger-mid)",fontSize:"var(--text-xs)"}}>{errors.taxCode}</span>}
                  </div>
                  <div>
                    <label style={labelStyle}>Tỉnh / Thành phố</label>
                    <input value={form.customerProvince} onChange={e=>set("customerProvince",e.target.value)} style={inputStyle("customerProvince")}/>
                  </div>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={labelStyle}>Địa chỉ xuất hóa đơn</label>
                    <input value={form.companyAddress} onChange={e=>set("companyAddress",e.target.value)} placeholder="Địa chỉ đăng ký kinh doanh" style={inputStyle("companyAddress")}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {step===2&&(
            <div>
              <div style={{fontWeight:700,marginBottom:16,fontSize:"var(--text-lg)",color:"var(--c-text-2)"}}>🧳 Dịch vụ & Cấu trúc giá</div>

              {/* 7 nút loại dịch vụ */}
              <label style={labelStyle}>Loại dịch vụ *</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
                {SERVICE_TYPES.map(s=>(
                  <button key={s.id} onClick={()=>{set("service",s.id);if(s.id!=="combo")set("comboComponents",{...COMBO_COMPONENTS_DEFAULT});}} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 12px",borderRadius:"var(--r-md)",border:"1.5px solid "+(form.service===s.id?(s.id==="combo"?"var(--c-purple)":"var(--c-primary)"):"var(--c-border)"),background:form.service===s.id?(s.id==="combo"?"var(--c-purple-bg)":"var(--c-primary-light)"):"var(--c-surface)",cursor:"pointer",fontWeight:form.service===s.id?700:500,fontSize:"var(--text-base)",color:form.service===s.id?(s.id==="combo"?"var(--c-purple)":"var(--c-primary)"):"var(--c-text-2)",transition:"all .15s"}}>
                    <span>{s.icon}</span>{s.label}
                  </button>
                ))}
              </div>

              {/* ── PANEL COMBO ĐỘNG ── */}
              {isCombo&&(
                <div style={{background:"var(--c-purple-bg)",border:"1.5px solid var(--c-purple-border)",borderRadius:"var(--r-md)",padding:18,marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:"var(--text-base)",color:"var(--c-purple)",marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
                    📦 Thành phần Combo
                    {errors.combo&&<span style={{marginLeft:8,color:"var(--c-danger-mid)",fontWeight:600,fontSize:"var(--text-sm)"}}>⚠ {errors.combo}</span>}
                  </div>
                  {Object.entries(form.comboComponents||{}).map(([key,comp])=>(
                    <div key={key} style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:12,alignItems:"center",marginBottom:10,padding:"10px 12px",background:comp.enabled?"var(--c-surface)":"var(--c-purple-bg)",borderRadius:"var(--r-sm)",border:"1px solid "+(comp.enabled?"var(--c-purple-border)":"transparent"),transition:"all .15s"}}>
                      <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",minWidth:140}}>
                        <input type="checkbox" checked={comp.enabled} onChange={e=>setComboComp(key,"enabled",e.target.checked)} style={{width:16,height:16,accentColor:"var(--c-purple)",cursor:"pointer"}}/>
                        <span style={{fontSize:"var(--text-base)",fontWeight:comp.enabled?600:400,color:comp.enabled?"var(--c-text-2)":"var(--c-text-muted)"}}>{comp.icon} {comp.label}</span>
                      </label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)",whiteSpace:"nowrap"}}>Giá NL:</span>
                        <NumberInput value={comp.priceAdult||0} onChange={v=>setComboComp(key,"priceAdult",v)} placeholder="Giá NL" disabled={!comp.enabled} style={{flex:1,border:"1px solid "+(comp.enabled?"var(--c-purple-border)":"var(--c-border)"),borderRadius:"var(--r-sm)",padding:"6px 10px",fontSize:"var(--text-base)",background:comp.enabled?"var(--c-surface)":"var(--c-surface-2)",color:comp.enabled?"var(--c-text-2)":"var(--c-text-muted)"}}/>
                      </div>
                      {comp.enabled&&fmtNum(comp.priceAdult)>0&&(
                        <span style={{fontSize:"var(--text-xs)",color:"var(--c-purple)",fontWeight:600,whiteSpace:"nowrap"}}>{fmtMoney(fmtNum(comp.priceAdult)*fmtNum(form.adultQty))}</span>
                      )}
                      {(!comp.enabled||!fmtNum(comp.priceAdult))&&<span/>}
                    </div>
                  ))}
                  <div style={{borderTop:"1px dashed var(--c-purple-border)",paddingTop:12,marginTop:4}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"center",marginBottom:8}}>
                      <label style={{fontSize:"var(--text-base)",color:"var(--c-text-2)"}}>Chiết khấu Combo (₫)</label>
                      <input type="number" min={0} value={form.comboDiscount} onChange={e=>set("comboDiscount",Math.max(0,Number(e.target.value)))} placeholder="0" style={{width:140,border:"1px solid var(--c-purple-border)",borderRadius:"var(--r-sm)",padding:"6px 10px",fontSize:"var(--text-base)",textAlign:"right"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--c-purple-bg)",borderRadius:"var(--r-sm)",padding:"10px 14px"}}>
                      <span style={{fontWeight:700,fontSize:"var(--text-base)",color:"var(--c-purple)"}}>Tổng Combo (NL × {fmtNum(form.adultQty)} khách):</span>
                      <span style={{fontWeight:800,fontSize:"var(--text-lg)",color:"var(--c-purple)"}}>{fmtMoney(comboTotal)}</span>
                    </div>
                  </div>
                  <div style={{marginTop:12}}>
                    <label style={labelStyle}>Tên Combo (tự động sinh — có thể sửa)</label>
                    <input value={form.comboName||autoComboName} onChange={e=>set("comboName",e.target.value)} placeholder={autoComboName||"Combo …"} style={inputStyle("comboName")}/>
                  </div>
                </div>
              )}

              {/* ── TOUR GHÉP: chọn từ danh mục ── */}
              {isTourGhep&&(()=>{
                const [ghepSearch, setGhepSearch] = [form._ghepSearch||"", v=>set("_ghepSearch",v)];
                const activeProducts = tourGhepProducts.filter(p=>p.active!==false);
                const filteredProducts = ghepSearch.trim()
                  ? activeProducts.filter(p=>(p.name||"").toLowerCase().includes(ghepSearch.toLowerCase())||(p.destination||"").toLowerCase().includes(ghepSearch.toLowerCase())||(p.partnerName||"").toLowerCase().includes(ghepSearch.toLowerCase()))
                  : activeProducts;
                const selectedProduct = tourGhepProducts.find(p=>p.id===form.tourGhepProductId);

                const applyPrices = (sell,buy) => {
                  set("adultPrice", sell?.adult||"");
                  set("child10Price", sell?.child||sell?.child10||"");
                  set("child5Price", sell?.child5||"");
                  set("infantPrice", sell?.infant||"");
                  if(canViewGhepCost) set("costPrice", buy?.adult||"");
                };
                const selectProduct = (p) => {
                  set("tourGhepProductId", p.id);
                  set("tourGhepProductName", p.name);
                  set("tourName", p.name);
                  const deps = Array.isArray(p.departures)?p.departures:[];
                  if(p.useSchedule && deps.length){
                    const d0 = deps[0];
                    set("tourGhepDepartureId", d0.id);
                    set("tourGhepDepartureLabel", d0.label||"");
                    applyPrices(d0.sell, d0.buy);
                  } else {
                    set("tourGhepDepartureId","");
                    set("tourGhepDepartureLabel","");
                    applyPrices(p.sellPrices, p.buyPrices);
                  }
                  set("_ghepSearch","");
                };
                const selectDeparture = (depId) => {
                  const p = selectedProduct; if(!p) return;
                  const d = (p.departures||[]).find(x=>x.id===depId);
                  if(!d) return;
                  set("tourGhepDepartureId", d.id);
                  set("tourGhepDepartureLabel", d.label||"");
                  applyPrices(d.sell, d.buy);
                };

                return(
                  <div style={{background:"var(--c-info-bg)",border:"2px solid var(--c-info-border)",borderRadius:"var(--r-lg)",padding:16,marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <span style={{fontSize:18}}>🔗</span>
                      <div style={{fontWeight:700,fontSize:"var(--text-md)",color:"var(--c-info)"}}>Chọn sản phẩm Tour ghép</div>
                      {activeProducts.length===0&&<span style={{fontSize:"var(--text-sm)",color:"var(--c-danger-mid)",fontWeight:600}}>⚠ Chưa có sản phẩm — Admin cần nhập trong module Tour ghép trước</span>}
                      {activeProducts.length>0&&<span style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)"}}>{activeProducts.length} sản phẩm</span>}
                    </div>

                    {/* Sản phẩm đã chọn */}
                    {selectedProduct&&(
                      <div style={{background:"var(--c-surface)",borderRadius:"var(--r-md)",padding:14,marginBottom:12,border:"2px solid var(--c-info)",position:"relative"}}>
                        <div style={{position:"absolute",top:10,right:10}}>
                          <button onClick={()=>{set("tourGhepProductId","");set("tourGhepProductName","");set("tourName","");}} style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",border:"none",borderRadius:"var(--r-xs)",padding:"3px 8px",fontSize:"var(--text-xs)",cursor:"pointer",fontWeight:600}}>✕ Bỏ chọn</button>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <span style={{background:"var(--c-info)",color:"#fff",borderRadius:"var(--r-xs)",padding:"2px 8px",fontSize:"var(--text-xs)",fontWeight:700}}>✓ Đã chọn</span>
                          <span style={{fontWeight:800,fontSize:"var(--text-lg)",color:"var(--c-info)"}}>{selectedProduct.name}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,fontSize:"var(--text-sm)"}}>
                          <div><span style={{color:"var(--c-text-3)"}}>Điểm đến:</span><br/><b>{selectedProduct.destination||"—"}</b></div>
                          <div><span style={{color:"var(--c-text-3)"}}>Đối tác/NCC:</span><br/><b>{selectedProduct.partnerName||"—"}</b></div>
                          <div><span style={{color:"var(--c-text-3)"}}>Thời gian:</span><br/><b>{selectedProduct.duration||"—"}</b></div>
                          <div><span style={{color:"var(--c-text-3)"}}>Giá bán NL:</span><br/><b style={{color:"var(--c-primary-mid)"}}>{(selectedProduct.sellPrices?.adult||0).toLocaleString("vi-VN")}₫</b></div>
                          {canViewGhepCost&&<div><span style={{color:"var(--c-text-3)"}}>Giá mua NCC:</span><br/><b style={{color:"var(--c-danger-mid)"}}>{(selectedProduct.buyPrices?.adult||0).toLocaleString("vi-VN")}₫</b></div>}
                          {canViewGhepCost&&<div><span style={{color:"var(--c-text-3)"}}>Biên LN NL:</span><br/><b style={{color:"var(--c-success-mid)"}}>{selectedProduct.sellPrices?.adult&&selectedProduct.buyPrices?.adult?Math.round((selectedProduct.sellPrices.adult-selectedProduct.buyPrices.adult)/selectedProduct.sellPrices.adult*100)+"%" :"—"}</b></div>}
                        </div>
                        {selectedProduct.useSchedule&&Array.isArray(selectedProduct.departures)&&selectedProduct.departures.length>0&&(
                          <div style={{marginTop:12,paddingTop:12,borderTop:"1px dashed var(--c-border-mid)"}}>
                            <div style={{fontSize:"var(--text-sm)",fontWeight:700,color:"var(--c-warning)",marginBottom:6}}>📅 Chọn đợt khởi hành (giá tự điền theo đợt)</div>
                            <select value={form.tourGhepDepartureId||""} onChange={e=>selectDeparture(e.target.value)}
                              style={{width:"100%",border:"1.5px solid var(--c-warning-border)",borderRadius:"var(--r-md)",padding:"9px 12px",fontSize:"var(--text-base)",background:"var(--c-warning-bg)",outline:"none",boxSizing:"border-box"}}>
                              {selectedProduct.departures.map(d=>(
                                <option key={d.id} value={d.id}>
                                  {(d.label||"Đợt")}{d.dates?` — ${d.dates}`:""}{d.sell?.adult?` · ${(d.sell.adult).toLocaleString("vi-VN")}đ/NL`:""}
                                </option>
                              ))}
                            </select>
                            <div style={{fontSize:"var(--text-xs)",color:"var(--c-warning)",marginTop:5}}>Nhớ chọn đúng ngày khởi hành ở ô "Ngày khởi hành" bên dưới cho khớp đợt.</div>
                          </div>
                        )}
                        {!canViewGhepCost&&<div style={{marginTop:8,fontSize:"var(--text-xs)",color:"var(--c-text-muted)"}}>💡 Giá mua NCC chỉ hiển thị với người có quyền xem Tour ghép</div>}
                      </div>
                    )}

                    {/* Search + danh sách */}
                    {activeProducts.length>0&&(
                      <>
                        <div style={{position:"relative",marginBottom:10}}>
                          <i className="ti ti-search" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--c-text-muted)",fontSize:15}}/>
                          <input value={ghepSearch} onChange={e=>setGhepSearch(e.target.value)}
                            placeholder="Tìm theo tên tour, điểm đến, đối tác..."
                            style={{width:"100%",border:"1.5px solid var(--c-info-border)",borderRadius:"var(--r-md)",padding:"9px 12px 9px 34px",fontSize:"var(--text-base)",outline:"none",background:"var(--c-surface)",boxSizing:"border-box"}}/>
                        </div>
                        {!selectedProduct&&(
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:240,overflowY:"auto"}}>
                            {filteredProducts.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",color:"var(--c-text-muted)",padding:16,fontSize:"var(--text-base)"}}>Không tìm thấy sản phẩm</div>}
                            {filteredProducts.map(p=>(
                              <div key={p.id} onClick={()=>selectProduct(p)}
                                style={{background:"var(--c-surface)",borderRadius:"var(--r-md)",padding:12,cursor:"pointer",border:"1.5px solid var(--c-border)",transition:"all .15s"}}
                                onMouseEnter={e=>{e.currentTarget.style.border="1.5px solid var(--c-info)";e.currentTarget.style.background="var(--c-info-bg)";}}
                                onMouseLeave={e=>{e.currentTarget.style.border="1.5px solid var(--c-border)";e.currentTarget.style.background="var(--c-surface)";}}>
                                <div style={{fontWeight:700,fontSize:"var(--text-base)",color:"var(--c-info)",marginBottom:4}}>{p.name}</div>
                                <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)",marginBottom:6}}>{p.destination||""}{p.duration?` · ${p.duration}`:""}{p.partnerName?` · ${p.partnerName}`:""}</div>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <span style={{fontSize:"var(--text-base)",fontWeight:700,color:"var(--c-primary-mid)"}}>{(p.sellPrices?.adult||0).toLocaleString("vi-VN")}₫/NL</span>
                                  <span style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",borderRadius:"var(--r-pill)",fontSize:"var(--text-2xs)",padding:"2px 6px",fontWeight:600}}>{p.type==="international"?"🌍 QT":"🏔 NĐ"}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Tên dịch vụ */}
              <label style={labelStyle}>{isCombo?"Tên Combo (đã tự sinh ở trên)":"Tên dịch vụ / Tour"} *</label>
              <input value={isCombo?(form.comboName||autoComboName):form.tourName} onChange={e=>isCombo?set("comboName",e.target.value):set("tourName",e.target.value)} placeholder={isCombo?(autoComboName||"Nhập tên combo…"):"Nhập tên dịch vụ / tour…"} style={{...inputStyle("tourName"),marginBottom:14}}/>
              {errors.tourName&&<div style={{color:"var(--c-danger-mid)",fontSize:"var(--text-xs)",marginTop:-10,marginBottom:10}}>{errors.tourName}</div>}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:16}}>
                <div>
                  <label style={labelStyle}>Ngày khởi hành *</label>
                  <input type="date" value={form.departDate} onChange={e=>set("departDate",e.target.value)} style={inputStyle("departDate")}/>
                  {errors.departDate&&<div style={{color:"var(--c-danger-mid)",fontSize:"var(--text-xs)",marginTop:3}}>{errors.departDate}</div>}
                </div>
                <div><label style={labelStyle}>Ngày về</label><input type="date" value={form.returnDate} onChange={e=>set("returnDate",e.target.value)} style={inputStyle("returnDate")}/></div>
                <div>
                  <label style={labelStyle}>Nhân viên phụ trách</label>
                  <select value={form.sale} onChange={e=>set("sale",e.target.value)} style={inputStyle("sale")}>
                    {staffOptions.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Số lượng & đơn giá — ẩn input đơn giá khi là Combo (đã có panel combo) */}
              <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-md)",padding:16,marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:"var(--text-base)",marginBottom:12,color:"var(--c-text-2)"}}>
                  {isCombo?"Số lượng khách":"Số lượng & Đơn giá khách"}
                </div>
                {[["Người lớn (≥18t)","adultQty","adultPrice"],["Trẻ em 10–18t","child10Qty","child10Price"],["Trẻ em 5–10t","child5Qty","child5Price"],["Trẻ em 2–5t","child2Qty","child2Price"],["Em bé <2t","infantQty","infantPrice"]].map(([label,qKey,pKey])=>(
                  <div key={qKey} style={{display:"grid",gridTemplateColumns:"140px 80px"+(isCombo?"":" 1fr"),gap:10,alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:"var(--text-base)",color:"var(--c-text-2)"}}>{label}</span>
                    <input type="number" min={0} value={form[qKey]} onChange={e=>set(qKey,e.target.value)} style={{border:"1px solid var(--c-border)",borderRadius:"var(--r-sm)",padding:"6px 8px",fontSize:"var(--text-base)",width:"100%"}}/>
                    {!isCombo&&<NumberInput value={fmtNum(form[pKey])?parseNum(fmtNum(form[pKey])):0} onChange={v=>set(pKey,v)} placeholder="Đơn giá (VD: 1.500.000)" style={{...inputStyle(pKey)}}/>}
                  </div>
                ))}
                {errors.adultPrice&&!isCombo&&<div style={{color:"var(--c-danger-mid)",fontSize:"var(--text-xs)",marginTop:4}}>{errors.adultPrice}</div>}
                <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:10,borderTop:"1px solid var(--c-border)"}}>
                  <span style={{fontWeight:700,fontSize:"var(--text-base)"}}>{isCombo?"Tổng Combo":"Tổng cộng tạm tính"}</span>
                  <span style={{fontWeight:800,fontSize:"var(--text-lg)",color:isCombo?"var(--c-purple)":"var(--c-primary)"}}>{fmtMoney(totalPrice)}</span>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div>
                  <label style={labelStyle}>Giá vốn (NCC dự kiến){isTourGhep&&!canViewGhepCost&&<span style={{color:"var(--c-danger-mid)",fontWeight:400}}> — ẩn</span>}</label>
                  {(!isTourGhep||canViewGhepCost)
                    ? <NumberInput value={form.costPrice||0} onChange={v=>set("costPrice",v)} placeholder="VD: 1.200.000" style={{...inputStyle("costPrice")}}/>
                    : <div style={{padding:"9px 12px",background:"var(--c-surface-2)",borderRadius:"var(--r-sm)",fontSize:"var(--text-base)",color:"var(--c-text-muted)"}}>Bạn không có quyền xem giá vốn tour ghép</div>
                  }
                </div>
                <div><label style={labelStyle}>Tiền cọc ban đầu</label><NumberInput value={form.depositAmount||0} onChange={v=>set("depositAmount",v)} placeholder="VD: 500.000" style={{...inputStyle("depositAmount")}}/></div>
              </div>
              {dupOrder&&(
                <div style={{background:"var(--c-warning-bg)",borderRadius:"var(--r-sm)",padding:"10px 14px",marginTop:14,fontSize:"var(--text-sm)",color:"var(--c-warning)",fontWeight:600}}>
                  ⚠️ Khách đã có đơn {dupOrder.id} cùng ngày khởi hành
                </div>
              )}
            </div>
          )}

          {step===3&&(
            <div>
              <div style={{fontWeight:700,marginBottom:16,fontSize:"var(--text-lg)",color:"var(--c-text-2)"}}>🔍 Kiểm soát trước khi tạo đơn</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {[
                  ["Khách hàng",form.customerName],
                  ["SĐT",form.customerPhone],
                  ["Loại dịch vụ",SERVICE_TYPES.find(s=>s.id===form.service)?.label],
                  ["Tên",isCombo?(form.comboName||autoComboName||"—"):form.tourName],
                  ["Ngày đi",form.departDate||"—"],
                  ["Số khách",pax+" người"],
                  ["Tổng tiền",(totalPrice||0).toLocaleString("vi-VN")+"đ"],
                  ["Nhân viên",form.sale],
                ].map(([k,v])=>(
                  <div key={k} style={{background:"var(--c-surface-2)",borderRadius:"var(--r-sm)",padding:"10px 12px"}}>
                    <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)"}}>{k}</div>
                    <div style={{fontSize:"var(--text-base)",fontWeight:600,marginTop:2}}>{v||"—"}</div>
                  </div>
                ))}
              </div>

              {/* Combo breakdown */}
              {isCombo&&comboEnabledItems.length>0&&(
                <div style={{background:"var(--c-purple-bg)",border:"1px solid var(--c-purple-border)",borderRadius:"var(--r-md)",padding:14,marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:"var(--text-sm)",color:"var(--c-purple)",marginBottom:10}}>📦 Chi tiết Combo</div>
                  {comboEnabledItems.map(([key,comp])=>(
                    <div key={key} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--c-purple-border)",fontSize:"var(--text-base)"}}>
                      <span style={{color:"var(--c-text-2)"}}>{comp.icon} {comp.label}</span>
                      <span style={{fontWeight:600,color:"var(--c-purple)"}}>{fmtMoney(fmtNum(comp.priceAdult)*fmtNum(form.adultQty))}</span>
                    </div>
                  ))}
                  {fmtNum(form.comboDiscount||0)>0&&(
                    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:"var(--text-base)",color:"var(--c-danger-mid)"}}>
                      <span>Chiết khấu</span>
                      <span>−{fmtMoney(fmtNum(form.comboDiscount||0))}</span>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,marginTop:4,borderTop:"1px solid var(--c-purple-border)",fontWeight:800,fontSize:"var(--text-md)",color:"var(--c-purple)"}}>
                    <span>Tổng Combo</span>
                    <span>{fmtMoney(comboTotal)}</span>
                  </div>
                </div>
              )}

              <textarea value={form.note} onChange={e=>set("note",e.target.value)} rows={3} placeholder="Ghi chú nội bộ: yêu cầu đặc biệt, dị ứng, phòng..." style={{width:"100%",border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-sm)",padding:"10px 12px",fontSize:"var(--text-base)",boxSizing:"border-box",resize:"vertical",background:"var(--c-surface)",color:"var(--c-text)"}}/>
              {checklistDone<checklist.length&&(
                <div style={{background:"var(--c-warning-bg)",borderRadius:"var(--r-sm)",padding:"10px 14px",marginTop:14,fontSize:"var(--text-sm)",color:"var(--c-warning)",fontWeight:600}}>
                  ⚠️ Còn {checklist.length-checklistDone} tiêu chí chưa hoàn thành — xem cột bên phải
                </div>
              )}
            </div>
          )}

          <div style={{display:"flex",gap:10,marginTop:24,paddingTop:20,borderTop:"1px solid var(--c-border)"}}>
            {step>1?<Btn variant="secondary" onClick={goBack}>← Quay lại</Btn>
              :<Btn variant="secondary" onClick={onCancel}>Hủy</Btn>}
            <div style={{flex:1}}/>
            {step<3?<Btn size="lg" onClick={goNext}>Tiếp tục →</Btn>
              :<Btn size="lg" variant="success" style={{background:"var(--c-success-mid)",color:"#fff",border:"none"}} onClick={handleSave}>✓ Tạo đơn hàng</Btn>}
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:18,boxShadow:"var(--sh-sm)",marginBottom:14}}>
            <div style={{fontSize:"var(--text-xs)",fontWeight:700,color:"var(--c-text-muted)",letterSpacing:.5,marginBottom:12,textTransform:"uppercase"}}>Kiểm tra nhanh</div>
            {checklist.map(c=>(
              <div key={c.label} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",fontSize:"var(--text-base)"}}>
                <span style={{color:c.ok?"var(--c-success-mid)":"var(--c-danger-mid)",fontWeight:800}}>{c.ok?"✓":"✗"}</span>
                <span style={{color:c.ok?"var(--c-text-2)":"var(--c-text-muted)"}}>{c.label}</span>
              </div>
            ))}
          </div>
          <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:18,boxShadow:"var(--sh-sm)",marginBottom:14}}>
            <div style={{fontSize:"var(--text-xs)",fontWeight:700,color:"var(--c-text-muted)",letterSpacing:.5,marginBottom:8,textTransform:"uppercase"}}>Doanh thu dự kiến</div>
            <div style={{fontSize:"var(--text-3xl)",fontWeight:800,color:isCombo?"var(--c-purple)":"var(--c-primary)"}}>{fmtMoney(totalPrice)}</div>
            <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)",marginTop:4}}>đồng · Lãi {profitPct.toFixed(0)}%</div>
            <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-xs)",height:8,marginTop:10}}>
              <div style={{background:profitPct>=15?"var(--c-success-mid)":profitPct>=5?"var(--c-warning-mid)":"var(--c-danger-mid)",height:8,borderRadius:"var(--r-xs)",width:Math.min(100,Math.max(0,profitPct*2))+"%",transition:"width .4s"}}/>
            </div>
          </div>
          {/* Combo mini-summary in sidebar */}
          {isCombo&&comboEnabledItems.length>0&&(
            <div style={{background:"var(--c-purple-bg)",border:"1px solid var(--c-purple-border)",borderRadius:"var(--r-md)",padding:14}}>
              <div style={{fontSize:"var(--text-xs)",fontWeight:700,color:"var(--c-purple)",letterSpacing:.5,marginBottom:10,textTransform:"uppercase"}}>Thành phần Combo</div>
              {comboEnabledItems.map(([key,comp])=>(
                <div key={key} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:"var(--text-sm)"}}>
                  <span style={{color:"var(--c-text-2)"}}>{comp.icon} {comp.label}</span>
                  <span style={{fontWeight:600,color:"var(--c-purple)"}}>{fmtMoney(fmtNum(comp.priceAdult))}<span style={{fontSize:"var(--text-2xs)",color:"var(--c-text-muted)"}}>/NL</span></span>
                </div>
              ))}
              {fmtNum(form.comboDiscount||0)>0&&(
                <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:"var(--text-sm)",color:"var(--c-danger-mid)"}}>
                  <span>CK</span><span>−{fmtMoney(fmtNum(form.comboDiscount||0))}</span>
                </div>
              )}
              <div style={{borderTop:"1px solid var(--c-purple-border)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:"var(--text-base)",color:"var(--c-purple)"}}>
                <span>Tổng × {fmtNum(form.adultQty)} NL</span>
                <span>{fmtMoney(comboTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
