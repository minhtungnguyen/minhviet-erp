const SERVICE_TYPES=[
  {id:"ve_may_bay",label:"Vé máy bay",icon:"✈️"},
  {id:"tour_tron_goi",label:"Tour trọn gói",icon:"🧳"},
  {id:"du_thuyen",label:"Du thuyền",icon:"🚢"},
  {id:"combo_ks_ve",label:"Combo KS+Vé",icon:"🏨"},
  {id:"ve_tham_quan",label:"Vé tham quan",icon:"🎫"},
  {id:"khach_san",label:"Khách sạn",icon:"🏠"},
];

function OrderForm({onSave,onCancel,pushNotif,defaultSale=SALE_STAFF[0],currentRole="sale",customers=[],onCreateCustomer,tourPrograms=[],initialData=null,orders=[]}){
  const [step,setStep]=React.useState(1);
  const [form,setForm]=React.useState(initialData||{
    customerName:"",customerPhone:"",customerEmail:"",customerId:"",cccd:"",cccdImg:"",
    service:"tour_tron_goi",tourName:"",departDate:"",returnDate:"",sale:defaultSale,
    adultQty:1,adultPrice:"",childQty:0,childPrice:"",babyQty:0,babyPrice:"",
    costPrice:"",depositAmount:"",note:"",source:"Facebook",passengers:[],
  });
  const [custSearch,setCustSearch]=React.useState("");
  const [showCustDrop,setShowCustDrop]=React.useState(false);
  const [errors,setErrors]=React.useState({});

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const fmtNum=(s)=>Number(String(s).replace(/[^\d]/g,""))||0;
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"đ";

  const totalPrice=fmtNum(form.adultQty)*fmtNum(form.adultPrice)+fmtNum(form.childQty)*fmtNum(form.childPrice)+fmtNum(form.babyQty)*fmtNum(form.babyPrice);
  const pax=fmtNum(form.adultQty)+fmtNum(form.childQty)+fmtNum(form.babyQty);
  const profit=totalPrice-fmtNum(form.costPrice);
  const profitPct=totalPrice?(profit/totalPrice*100):0;

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
    {label:"Ảnh CCCD",ok:!!form.cccdImg.trim()},
    {label:"Tên dịch vụ",ok:!!form.tourName.trim()},
    {label:"Ngày đi",ok:!!form.departDate},
    {label:"Email",ok:!!form.customerEmail.trim()},
    {label:"Lợi nhuận ≥ 5%",ok:profitPct>=5},
  ];
  const checklistDone=checklist.filter(c=>c.ok).length;

  const STEPS=[{n:1,label:"Thông tin khách"},{n:2,label:"Dịch vụ & Giá"},{n:3,label:"Kiểm soát"}];

  const validateStep=(s)=>{
    const e={};
    if(s===1){
      if(!form.customerName.trim()) e.customerName="Bắt buộc";
      if(!form.customerPhone.trim()) e.customerPhone="Bắt buộc";
    }
    if(s===2){
      if(!form.tourName.trim()) e.tourName="Bắt buộc";
      if(!form.departDate) e.departDate="Bắt buộc";
      if(totalPrice<=0) e.adultPrice="Nhập đơn giá";
    }
    setErrors(e); return Object.keys(e).length===0;
  };

  const goNext=()=>{ if(validateStep(step)) setStep(s=>Math.min(3,s+1)); };
  const goBack=()=>setStep(s=>Math.max(1,s-1));

  const handleSave=()=>{
    if(!validateStep(1)||!validateStep(2)) return;
    if(dupOrder&&!window.confirm("Khách này đã có đơn "+dupOrder.id+" cùng ngày khởi hành. Vẫn tạo đơn mới?")) return;
    onSave({
      ...form,
      service:SERVICE_TYPES.find(s=>s.id===form.service)?.label||form.service,
      totalPrice, pax, costPrice:fmtNum(form.costPrice),
      depositAmount:fmtNum(form.depositAmount),
      status:"pending_payment", totalPaid:0,
    });
  };

  const inputStyle=(key)=>({width:"100%",border:"1px solid "+(errors[key]?"#ef4444":"#e2e8f0"),borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box",outline:"none"});
  const labelStyle={display:"block",fontSize:11,fontWeight:700,letterSpacing:.3,marginBottom:5,color:"#64748b",textTransform:"uppercase"};

  return(
    <div style={{maxWidth:1000,margin:"0 auto"}}>
      {/* Stepper */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:24,background:"#fff",borderRadius:14,padding:"18px 24px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
        {STEPS.map((s,i)=>(
          <React.Fragment key={s.n}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:step>s.n?"#16a34a":step===s.n?"#1e3a8a":"#f1f5f9",color:step>=s.n?"#fff":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}}>
                {step>s.n?"✓":s.n}
              </div>
              <span style={{fontWeight:700,fontSize:13,color:step===s.n?"#1e293b":step>s.n?"#16a34a":"#94a3b8"}}>{s.label}</span>
            </div>
            {i<STEPS.length-1&&<div style={{width:60,height:2,background:step>s.n?"#16a34a":"#e2e8f0",margin:"0 16px"}}/>}
          </React.Fragment>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
        <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          {step===1&&(
            <div>
              <div style={{fontWeight:700,marginBottom:16,fontSize:15,color:"#1e293b"}}>👤 Thông tin khách hàng</div>
              <div style={{position:"relative",marginBottom:14}}>
                <label style={labelStyle}>Tìm khách có sẵn</label>
                <input value={custSearch} onChange={e=>{setCustSearch(e.target.value);setShowCustDrop(true);}} onFocus={()=>setShowCustDrop(true)} placeholder="Nhập tên hoặc SĐT..." style={inputStyle("search")}/>
                {showCustDrop&&filteredCust.length>0&&(
                  <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.1)",zIndex:100,maxHeight:200,overflowY:"auto"}}>
                    {filteredCust.map(c=>(
                      <div key={c.id} onClick={()=>{set("customerName",c.name);set("customerPhone",c.phone);set("customerEmail",c.email||"");set("customerId",c.id);setCustSearch(c.name);setShowCustDrop(false);}}
                        style={{padding:"10px 14px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                        <span style={{fontWeight:600}}>{c.name}</span><span style={{color:"#64748b"}}>{c.phone}</span>
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
                <div><label style={labelStyle}>Link ảnh CCCD</label><input value={form.cccdImg} onChange={e=>set("cccdImg",e.target.value)} placeholder="https://drive.google.com/..." style={inputStyle("cccdImg")}/></div>
              </div>
              {onCreateCustomer&&<button onClick={onCreateCustomer} style={{marginTop:14,background:"none",border:"1px dashed #2563eb",color:"#2563eb",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12}}>+ Tạo khách hàng mới trong CRM</button>}
            </div>
          )}

          {step===2&&(
            <div>
              <div style={{fontWeight:700,marginBottom:16,fontSize:15,color:"#1e293b"}}>🧳 Dịch vụ & Cấu trúc giá</div>
              <label style={labelStyle}>Loại dịch vụ *</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
                {SERVICE_TYPES.map(s=>(
                  <button key={s.id} onClick={()=>set("service",s.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:9,border:"1.5px solid "+(form.service===s.id?"#1e3a8a":"#e2e8f0"),background:form.service===s.id?"#eff6ff":"#fff",cursor:"pointer",fontWeight:form.service===s.id?700:500,fontSize:13,color:form.service===s.id?"#1e3a8a":"#374151"}}>
                    <span>{s.icon}</span>{s.label}
                  </button>
                ))}
              </div>
              <label style={labelStyle}>Tên dịch vụ / Tour *</label>
              <input value={form.tourName} onChange={e=>set("tourName",e.target.value)} style={{...inputStyle("tourName"),marginBottom:14}}/>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:16}}>
                <div><label style={labelStyle}>Ngày khởi hành</label><input type="date" value={form.departDate} onChange={e=>set("departDate",e.target.value)} style={inputStyle("departDate")}/></div>
                <div><label style={labelStyle}>Ngày về</label><input type="date" value={form.returnDate} onChange={e=>set("returnDate",e.target.value)} style={inputStyle("returnDate")}/></div>
                <div>
                  <label style={labelStyle}>Sale phụ trách</label>
                  <select value={form.sale} onChange={e=>set("sale",e.target.value)} style={inputStyle("sale")}>
                    {SALE_STAFF.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{background:"#f8fafc",borderRadius:10,padding:16,marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:"#374151"}}>Số lượng & Đơn giá khách</div>
                {[["Người lớn","adultQty","adultPrice"],["Trẻ em","childQty","childPrice"],["Em bé","babyQty","babyPrice"]].map(([label,qKey,pKey])=>(
                  <div key={qKey} style={{display:"grid",gridTemplateColumns:"90px 1fr 70px",gap:10,alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:13,color:"#374151"}}>{label}</span>
                    <input type="number" min={0} value={form[qKey]} onChange={e=>set(qKey,e.target.value)} style={{width:60,border:"1px solid #e2e8f0",borderRadius:7,padding:"6px 8px",fontSize:13}}/>
                    <input type="number" value={form[pKey]} onChange={e=>set(pKey,e.target.value)} placeholder="0" style={{...inputStyle(pKey),gridColumn:"span 1"}}/>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:10,borderTop:"1px solid #e2e8f0"}}>
                  <span style={{fontWeight:700,fontSize:13}}>Tổng cộng tạm tính</span>
                  <span style={{fontWeight:800,fontSize:15,color:"#1e3a8a"}}>{fmtMoney(totalPrice)}</span>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div><label style={labelStyle}>Giá vốn (NCC dự kiến)</label><input type="number" value={form.costPrice} onChange={e=>set("costPrice",e.target.value)} style={inputStyle("costPrice")}/></div>
                <div><label style={labelStyle}>Tiền cọc ban đầu</label><input type="number" value={form.depositAmount} onChange={e=>set("depositAmount",e.target.value)} style={inputStyle("depositAmount")}/></div>
              </div>
              {dupOrder&&(
                <div style={{background:"#fef9c3",borderRadius:8,padding:"10px 14px",marginTop:14,fontSize:12,color:"#92400e",fontWeight:600}}>
                  ⚠️ Khách đã có đơn {dupOrder.id} cùng ngày khởi hành
                </div>
              )}
            </div>
          )}

          {step===3&&(
            <div>
              <div style={{fontWeight:700,marginBottom:16,fontSize:15,color:"#1e293b"}}>🔍 Kiểm soát trước khi tạo đơn</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {[["Khách hàng",form.customerName],["SĐT",form.customerPhone],["Dịch vụ",SERVICE_TYPES.find(s=>s.id===form.service)?.label],["Tour",form.tourName],["Ngày đi",form.departDate||"—"],["Số khách",pax+" người"],["Nhân viên",form.sale]].map(([k,v])=>(
                  <div key={k} style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:600,marginTop:2}}>{v||"—"}</div>
                  </div>
                ))}
              </div>
              <textarea value={form.note} onChange={e=>set("note",e.target.value)} rows={3} placeholder="Ghi chú nội bộ: yêu cầu đặc biệt, dị ứng, phòng..." style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 12px",fontSize:13,boxSizing:"border-box",resize:"vertical"}}/>
              {checklistDone<checklist.length&&(
                <div style={{background:"#fef9c3",borderRadius:8,padding:"10px 14px",marginTop:14,fontSize:12,color:"#92400e",fontWeight:600}}>
                  ⚠️ Còn {checklist.length-checklistDone} tiêu chí chưa hoàn thành — xem cột bên phải
                </div>
              )}
            </div>
          )}

          <div style={{display:"flex",gap:10,marginTop:24,paddingTop:20,borderTop:"1px solid #f1f5f9"}}>
            {step>1?<button onClick={goBack} style={{background:"#f1f5f9",border:"none",borderRadius:9,padding:"11px 22px",cursor:"pointer",fontWeight:600,fontSize:13}}>← Quay lại</button>
              :<button onClick={onCancel} style={{background:"#f1f5f9",border:"none",borderRadius:9,padding:"11px 22px",cursor:"pointer",fontWeight:600,fontSize:13}}>Hủy</button>}
            <div style={{flex:1}}/>
            {step<3?<button onClick={goNext} style={{background:"#1e3a8a",color:"#fff",border:"none",borderRadius:9,padding:"11px 26px",cursor:"pointer",fontWeight:700,fontSize:13}}>Tiếp tục →</button>
              :<button onClick={handleSave} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:9,padding:"11px 26px",cursor:"pointer",fontWeight:700,fontSize:13}}>✓ Tạo đơn hàng</button>}
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:.5,marginBottom:12,textTransform:"uppercase"}}>Kiểm tra nhanh</div>
            {checklist.map(c=>(
              <div key={c.label} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",fontSize:13}}>
                <span style={{color:c.ok?"#16a34a":"#dc2626",fontWeight:800}}>{c.ok?"✓":"✗"}</span>
                <span style={{color:c.ok?"#374151":"#94a3b8"}}>{c.label}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:.5,marginBottom:8,textTransform:"uppercase"}}>Doanh thu dự kiến</div>
            <div style={{fontSize:24,fontWeight:800,color:"#1e3a8a"}}>{fmtMoney(totalPrice)}</div>
            <div style={{fontSize:12,color:"#64748b",marginTop:4}}>đồng · Lãi {profitPct.toFixed(0)}%</div>
            <div style={{background:"#f1f5f9",borderRadius:6,height:8,marginTop:10}}>
              <div style={{background:profitPct>=15?"#16a34a":profitPct>=5?"#d97706":"#dc2626",height:8,borderRadius:6,width:Math.min(100,Math.max(0,profitPct*2))+"%",transition:"width .4s"}}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
