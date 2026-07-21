import React from "react";
import { NumberInput } from "../components/ui.jsx";
import { calcQuoteTotal, calcDepositAmount, daysLeft } from "../utils/quoteCalc.js";
import { overlayCloseHandlers } from "../utils/modalOverlay.js";

export default function QuoteModule({ quotes, onUpdate, orders, tourPrograms, currentUser, pushNotif, onCreateOrder }){
  const BLANK_FORM={
    customerName:"",customerPhone:"",customerEmail:"",
    service:"tour",tourName:"",tourProgramId:"",
    departDate:"",returnDate:"",
    pax:{adults:1,children:0,babies:0},
    pricing:{adultPrice:0,childPrice:0,babyPrice:0,totalPrice:0},
    includes:"",excludes:"",cancelPolicy:"",
    validUntil:"",depositPct:30,paymentDeadline:"",
    note:"",sale:currentUser?.name||""
  };
  const [subView,setSubView]=React.useState("list");
  const [form,setForm]=React.useState(BLANK_FORM);
  const [reviseModal,setReviseModal]=React.useState(null);
  const [revisePrice,setRevisePrice]=React.useState("");
  const [reviseNote,setReviseNote]=React.useState("");

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const lbl={display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"};
  const inp={width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"};

  const calcTotal=(f)=>calcQuoteTotal(f.pax,f.pricing);

  const setPax=(k,v)=>setForm(f=>({...f,pax:{...f.pax,[k]:Number(v)||0}}));
  const setPrice=(k,v)=>{
    setForm(f=>{
      const p={...f.pricing,[k]:Number(v)||0};
      p.totalPrice=(f.pax.adults*(k==="adultPrice"?Number(v)||0:p.adultPrice))+
                   (f.pax.children*(k==="childPrice"?Number(v)||0:p.childPrice))+
                   (f.pax.babies*(k==="babyPrice"?Number(v)||0:p.babyPrice));
      return {...f,pricing:p};
    });
  };

  // Auto-expire on mount
  React.useEffect(()=>{
    const today=new Date().toISOString().slice(0,10);
    const hasExpired=(quotes||[]).some(q=>q.validUntil&&q.validUntil<today&&["draft","sent","negotiating"].includes(q.status));
    if(hasExpired){
      onUpdate&&onUpdate((quotes||[]).map(q=>
        q.validUntil&&q.validUntil<today&&["draft","sent","negotiating"].includes(q.status)
          ?{...q,status:"expired"}:q
      ));
    }
  },[]);

  const saveQuote=()=>{
    if(!form.customerName) return pushNotif&&pushNotif("Nhập tên khách","error");
    if(!form.tourName)     return pushNotif&&pushNotif("Nhập tên dịch vụ","error");
    if(!form.validUntil)   return pushNotif&&pushNotif("Nhập hạn hiệu lực báo giá","error");
    if(form.pricing.totalPrice<=0) return pushNotif&&pushNotif("Nhập giá dịch vụ","error");
    const newId="BG"+new Date().getFullYear()+"-"+String(Date.now()).slice(-4);
    const q={
      ...form,
      id:newId,version:1,status:"draft",
      depositAmount:calcDepositAmount(form.pricing.totalPrice,form.depositPct),
      versions:[],
      createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
      createdBy:currentUser?.name,convertedOrderId:null
    };
    onUpdate&&onUpdate([q,...(quotes||[])]);
    pushNotif&&pushNotif("Đã tạo báo giá "+newId);
    setForm({...BLANK_FORM,sale:currentUser?.name||""});
    setSubView("list");
  };

  const sendQuote=(q)=>{
    onUpdate&&onUpdate((quotes||[]).map(x=>x.id===q.id?{...x,status:"sent",sentAt:new Date().toISOString(),updatedAt:new Date().toISOString()}:x));
    pushNotif&&pushNotif("Đã gửi báo giá "+q.id);
  };

  const reviseAndResend=()=>{
    const q=reviseModal;
    if(!revisePrice||Number(revisePrice)<=0) return pushNotif&&pushNotif("Nhập giá mới","error");
    const updated={
      ...q,
      version:q.version+1,
      pricing:{...q.pricing,totalPrice:Number(revisePrice)},
      depositAmount:calcDepositAmount(Number(revisePrice),q.depositPct),
      status:"sent",
      sentAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
      versions:[...(q.versions||[]),{version:q.version,totalPrice:q.pricing?.totalPrice||q.totalPrice,sentAt:q.sentAt,note:reviseNote||"Phiên bản "+q.version}],
    };
    onUpdate&&onUpdate((quotes||[]).map(x=>x.id===q.id?updated:x));
    pushNotif&&pushNotif("Đã gửi lại báo giá "+q.id+" v"+updated.version);
    setReviseModal(null);setRevisePrice("");setReviseNote("");
  };

  const convertToOrder=(q)=>{
    const totalPrc=q.pricing?.totalPrice||q.totalPrice||0;
    const orderData={
      customerId:q.customerId,
      customerName:q.customerName,customerPhone:q.customerPhone,customerEmail:q.customerEmail,
      service:q.service,tourName:q.tourName,tourProgramId:q.tourProgramId,
      departDate:q.departDate,returnDate:q.returnDate,
      paxAdults:q.pax?.adults||q.pax||1,paxChildren:q.pax?.children||0,paxBabies:q.pax?.babies||0,
      pax:(q.pax?.adults||1)+(q.pax?.children||0)+(q.pax?.babies||0),
      adultPrice:q.pricing?.adultPrice||0,childPrice:q.pricing?.childPrice||0,babyPrice:q.pricing?.babyPrice||0,
      totalPrice:totalPrc,
      depositAmount:q.depositAmount||calcDepositAmount(totalPrc,q.depositPct||30),
      paymentDeadline:q.paymentDeadline,
      includes:q.includes,excludes:q.excludes,cancelPolicy:q.cancelPolicy,
      note:q.note,
      source:"Báo giá "+q.id,quoteId:q.id,
      sale:q.sale||currentUser?.name,
      status:"pending_payment",totalPaid:0,
      additionalItems:[],paymentSchedule:[],
    };
    onCreateOrder&&onCreateOrder(orderData);
    onUpdate&&onUpdate((quotes||[]).map(x=>x.id===q.id?{...x,status:"converted",convertedOrderId:null,updatedAt:new Date().toISOString()}:x));
    pushNotif&&pushNotif("Đã tạo đơn hàng từ báo giá "+q.id,"success");
  };

  const STATUS={draft:{bg:"var(--c-surface-3)",c:"var(--c-text-2)",label:"Nháp"},sent:{bg:"var(--c-primary-pale)",c:"var(--c-primary)",label:"Đã gửi"},negotiating:{bg:"var(--c-warning-bg)",c:"var(--c-warning)",label:"Đang thương lượng"},converted:{bg:"var(--c-success-bg)",c:"var(--c-success)",label:"Đã chốt"},expired:{bg:"var(--c-danger-bg)",c:"var(--c-danger-mid)",label:"Hết hạn"},lost:{bg:"var(--c-danger-bg)",c:"var(--c-danger)",label:"Mất"}};
  const SERVICE_LABEL={tour:"Tour trọn gói",cruise:"Du thuyền",ve_may_bay:"Vé máy bay",hotel_flight:"Combo KS+Vé",hotel:"Khách sạn",ve:"Vé tham quan"};

  if(subView==="new") return(
    <div style={{padding:24,maxWidth:720,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={()=>setSubView("list")} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"var(--c-text-3)"}}>←</button>
        <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Tạo báo giá mới</h2>
      </div>
      <div style={{background:"var(--c-surface)",borderRadius:14,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
        <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* Thông tin khách */}
          <div><label style={lbl}>Tên khách *</label><input value={form.customerName} onChange={e=>setForm(f=>({...f,customerName:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>SĐT</label><input value={form.customerPhone} onChange={e=>setForm(f=>({...f,customerPhone:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Email</label><input value={form.customerEmail} onChange={e=>setForm(f=>({...f,customerEmail:e.target.value}))} style={inp}/></div>

          {/* Loại dịch vụ */}
          <div><label style={lbl}>Loại dịch vụ *</label>
            <select value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))} style={inp}>
              <option value="tour">Tour trọn gói</option>
              <option value="cruise">Du thuyền</option>
              <option value="ve_may_bay">Vé máy bay</option>
              <option value="hotel_flight">Combo KS + Vé</option>
              <option value="hotel">Khách sạn</option>
              <option value="ve">Vé tham quan / Vui chơi</option>
            </select>
          </div>

          {/* Chọn tour program */}
          <div>
            <label style={lbl}>Chương trình có sẵn</label>
            <select value={form.tourProgramId} onChange={e=>{const t=(tourPrograms||[]).find(x=>x.id===e.target.value);setForm(f=>({...f,tourProgramId:e.target.value,tourName:t?t.name:f.tourName}));}} style={inp}>
              <option value="">-- Chọn hoặc nhập tay --</option>
              {(tourPrograms||[]).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Tên dịch vụ / Tour *</label><input value={form.tourName} onChange={e=>setForm(f=>({...f,tourName:e.target.value}))} style={inp}/></div>

          {/* Ngày */}
          <div><label style={lbl}>Ngày khởi hành</label><input type="date" value={form.departDate} onChange={e=>setForm(f=>({...f,departDate:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Ngày về</label><input type="date" value={form.returnDate} onChange={e=>setForm(f=>({...f,returnDate:e.target.value}))} style={inp}/></div>

          {/* Số khách */}
          <div><label style={lbl}>Người lớn</label><input type="number" min={0} value={form.pax.adults} onChange={e=>{setPax("adults",e.target.value);setForm(f=>{const p={...f.pricing};p.totalPrice=calcTotal({...f,pax:{...f.pax,adults:Number(e.target.value)||0}});return{...f,pax:{...f.pax,adults:Number(e.target.value)||0},pricing:p};})}} style={inp}/></div>
          <div><label style={lbl}>Trẻ em</label><input type="number" min={0} value={form.pax.children} onChange={e=>{setForm(f=>{const p={...f.pricing};const pax2={...f.pax,children:Number(e.target.value)||0};p.totalPrice=calcTotal({...f,pax:pax2});return{...f,pax:pax2,pricing:p};})}} style={inp}/></div>
          <div><label style={lbl}>Em bé</label><input type="number" min={0} value={form.pax.babies} onChange={e=>{setForm(f=>{const p={...f.pricing};const pax2={...f.pax,babies:Number(e.target.value)||0};p.totalPrice=calcTotal({...f,pax:pax2});return{...f,pax:pax2,pricing:p};})}} style={inp}/></div>
        </div>

        {/* Giá theo loại khách */}
        <div style={{marginTop:14,padding:"14px 16px",background:"var(--c-surface-2)",borderRadius:10,border:"1px solid var(--c-border)"}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--c-text-2)",marginBottom:10}}>Giá dịch vụ (₫/người)</div>
          <div className="resp-grid-3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div><label style={{...lbl,fontSize:11}}>Người lớn</label><NumberInput value={form.pricing.adultPrice||0} onChange={v=>setPrice("adultPrice",v)} placeholder="VD: 1.500.000" style={inp}/></div>
            <div><label style={{...lbl,fontSize:11}}>Trẻ em</label><NumberInput value={form.pricing.childPrice||0} onChange={v=>setPrice("childPrice",v)} placeholder="VD: 1.000.000" style={inp}/></div>
            <div><label style={{...lbl,fontSize:11}}>Em bé</label><NumberInput value={form.pricing.babyPrice||0} onChange={v=>setPrice("babyPrice",v)} placeholder="VD: 300.000" style={inp}/></div>
          </div>
          <div style={{marginTop:10,padding:"10px 14px",background:"var(--c-primary-light)",borderRadius:8,fontSize:13}}>
            Tổng báo giá: <strong>{form.pricing.totalPrice.toLocaleString("vi-VN")} ₫</strong>
            &nbsp;·&nbsp; Cọc {form.depositPct}%: <strong>{calcDepositAmount(form.pricing.totalPrice,form.depositPct).toLocaleString("vi-VN")} ₫</strong>
          </div>
        </div>

        <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
          {/* Điều kiện */}
          <div style={{gridColumn:"1/-1"}}><label style={lbl}>Bao gồm dịch vụ</label><textarea rows={2} value={form.includes} onChange={e=>setForm(f=>({...f,includes:e.target.value}))} placeholder="Ăn sáng, xe đưa đón, HDV, bảo hiểm..." style={{...inp,resize:"vertical"}}/></div>
          <div style={{gridColumn:"1/-1"}}><label style={lbl}>Không bao gồm</label><textarea rows={2} value={form.excludes} onChange={e=>setForm(f=>({...f,excludes:e.target.value}))} placeholder="Vé máy bay, visa, chi phí cá nhân..." style={{...inp,resize:"vertical"}}/></div>

          {/* Thời hạn & cọc */}
          <div>
            <label style={lbl}>Hiệu lực đến ngày * <span style={{color:"var(--c-danger-mid)"}}>(bắt buộc)</span></label>
            <input type="date" value={form.validUntil} onChange={e=>setForm(f=>({...f,validUntil:e.target.value}))} min={new Date().toISOString().slice(0,10)} style={inp}/>
          </div>
          <div>
            <label style={lbl}>% Đặt cọc</label>
            <input type="number" min={0} max={100} value={form.depositPct} onChange={e=>setForm(f=>({...f,depositPct:Number(e.target.value)||0}))} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Hạn thanh toán còn lại</label>
            <input type="date" value={form.paymentDeadline} onChange={e=>setForm(f=>({...f,paymentDeadline:e.target.value}))} style={inp}/>
          </div>

          {/* Ghi chú */}
          <div style={{gridColumn:"1/-1"}}><label style={lbl}>Ghi chú</label><textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={2} style={{...inp,resize:"vertical"}}/></div>
        </div>

        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={saveQuote} style={{flex:2,background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700,fontSize:14}}>Tạo báo giá</button>
          <button onClick={()=>setSubView("list")} style={{flex:1,background:"var(--c-surface-3)",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:600}}>Hủy</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Báo giá</h2>
          <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:2}}>{(quotes||[]).length} báo giá · {(quotes||[]).filter(q=>q.status==="sent").length} đang chờ phản hồi</div>
        </div>
        <button onClick={()=>setSubView("new")} style={{background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:9,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:14}}>+ Tạo báo giá</button>
      </div>
      <div style={{background:"var(--c-surface)",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,.07)",overflow:"hidden"}}>
        {(!quotes||quotes.length===0)&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:48}}>Chưa có báo giá nào</div>}
        {(quotes||[]).map(q=>{
          const sc=STATUS[q.status]||STATUS.draft;
          const totalPrc=q.pricing?.totalPrice||q.totalPrice||0;
          const days=daysLeft(q.validUntil);
          return(
            <div key={q.id} style={{padding:"14px 16px",borderBottom:"1px solid var(--c-surface-2)"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>{q.id} — {q.customerName}</div>
                  <div style={{fontSize:12,color:"var(--c-text-3)",marginTop:2}}>
                    {SERVICE_LABEL[q.service]||q.service||"Tour"} · {q.tourName}
                    {q.pax?.adults!=null?` · ${q.pax.adults}NL${q.pax.children?"+"+q.pax.children+"TE":""}`:q.pax?` · ${q.pax} khách`:""}
                    {q.departDate?" · "+new Date(q.departDate).toLocaleDateString("vi-VN"):""}
                  </div>
                  {q.versions?.length>0&&<div style={{fontSize:11,color:"var(--c-text-muted)",marginTop:2}}>v{q.version} · {q.versions.length} lần sửa giá</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:700,color:"var(--c-primary-mid)",fontSize:14}}>{fmtMoney(totalPrc)}</div>
                  <span style={{fontSize:11,background:sc.bg,color:sc.c,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{sc.label}</span>
                  {days!==null&&q.status!=="converted"&&q.status!=="expired"&&q.status!=="lost"&&(
                    <div style={{fontSize:11,fontWeight:600,marginTop:3,color:days<=1?"var(--c-danger-mid)":days<=3?"var(--c-warning-mid)":"var(--c-success-mid)"}}>
                      {days<=0?"Hết hạn hôm nay":"Còn "+days+" ngày"}
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:6,marginTop:10}}>
                {q.status==="draft"&&<button onClick={()=>sendQuote(q)} style={{background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Gửi KH</button>}
                {(q.status==="draft"||q.status==="sent"||q.status==="negotiating")&&<button onClick={()=>convertToOrder(q)} style={{background:"var(--c-success-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Chốt đơn</button>}
                {(q.status==="sent"||q.status==="negotiating")&&<button onClick={()=>{setReviseModal(q);setRevisePrice(String(totalPrc));}} style={{background:"var(--c-warning-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Sửa giá & Gửi lại</button>}
                {(q.status==="draft"||q.status==="sent"||q.status==="negotiating")&&<button onClick={()=>onUpdate&&onUpdate((quotes||[]).map(x=>x.id===q.id?{...x,status:"lost",updatedAt:new Date().toISOString()}:x))} style={{background:"none",color:"var(--c-danger)",border:"1px solid var(--c-danger-border)",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Mất đơn</button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal sửa giá & gửi lại */}
      {reviseModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000}} {...overlayCloseHandlers(()=>setReviseModal(null))}>
          <div style={{background:"var(--c-surface)",borderRadius:14,padding:24,width:400,maxWidth:"95vw",boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
            <div style={{fontWeight:800,fontSize:16,marginBottom:16}}>Sửa giá & Gửi lại — {reviseModal.id}</div>
            <div style={{marginBottom:12}}>
              <label style={lbl}>Giá mới (₫)</label>
              <input type="number" value={revisePrice} onChange={e=>setRevisePrice(e.target.value)} style={inp} autoFocus/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>Ghi chú lý do sửa giá</label>
              <input value={reviseNote} onChange={e=>setReviseNote(e.target.value)} placeholder="VD: Giảm 5% theo yêu cầu KH" style={inp}/>
            </div>
            {reviseModal.versions?.length>0&&(
              <div style={{background:"var(--c-surface-2)",borderRadius:8,padding:10,marginBottom:14,fontSize:12}}>
                <div style={{fontWeight:600,color:"var(--c-text-2)",marginBottom:6}}>Lịch sử giá:</div>
                {reviseModal.versions.map((v,i)=><div key={i} style={{color:"var(--c-text-3)",marginBottom:2}}>v{v.version}: {(v.totalPrice||0).toLocaleString("vi-VN")}₫ — {v.note}</div>)}
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <button onClick={reviseAndResend} style={{flex:1,background:"var(--c-warning-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontWeight:700}}>Gửi lại</button>
              <button onClick={()=>setReviseModal(null)} style={{flex:1,background:"var(--c-surface-3)",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontWeight:600}}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
