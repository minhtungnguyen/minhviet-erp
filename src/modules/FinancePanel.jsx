import React from "react";
import { NumberInput } from "../components/ui.jsx";
import { downloadAsWord } from "../print/index.jsx";
import { openPrintWindow, buildPhieuThu, buildPhieuChi } from "../print/legacy.jsx";
import { calcPaymentTimeline } from "../utils/paymentTimeline.js";
import { calcVoucherTotals } from "../utils/orderFinancials.js";
import { isBanGiamDoc } from "../utils/permissions.js";

function PaymentTimeline({order,vouchers}){
  const {addonTotal,grandTotal,totalPaid,remaining,paidPct}=calcPaymentTimeline(order,vouchers);
  return(
    <div style={{padding:"14px 16px",background:"var(--c-surface-2)",borderRadius:10,marginBottom:16,border:"1px solid var(--c-border)"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
        <span style={{fontWeight:600}}>Tiến độ thanh toán</span>
        <span style={{color:paidPct>=100?"var(--c-success-mid)":"var(--c-warning-mid)",fontWeight:700}}>{paidPct}%</span>
      </div>
      <div style={{background:"var(--c-border)",borderRadius:4,height:8,marginBottom:10}}>
        <div style={{width:paidPct+"%",height:8,borderRadius:4,background:paidPct>=100?"var(--c-success-mid)":"var(--c-primary-mid)",transition:"width .4s"}}/>
      </div>
      <div className="resp-grid-3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[["Tổng đơn",grandTotal,"var(--c-text-2)"],["Đã thu",totalPaid,"var(--c-success-mid)"],["Còn lại",remaining,remaining>0?"var(--c-danger-mid)":"var(--c-success-mid)"]].map(([label,val,color])=>(
          <div key={label} style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:"var(--c-text-3)"}}>{label}</div>
            <div style={{fontWeight:700,fontSize:13,color}}>{(val||0).toLocaleString("vi-VN")} ₫</div>
          </div>
        ))}
      </div>
      {remaining>0&&order.paymentDeadline&&new Date(order.paymentDeadline)<new Date()&&(
        <div style={{marginTop:8,padding:"6px 10px",background:"var(--c-danger-bg)",borderRadius:6,fontSize:12,color:"var(--c-danger-mid)",fontWeight:600}}>
          ⚠ Quá hạn thanh toán: {new Date(order.paymentDeadline).toLocaleDateString("vi-VN")}
        </div>
      )}
    </div>
  );
}

export default function FinancePanel({order,vouchers,onAddVoucher,onApprove,onReject,onUpdate,pushNotif,currentRole,currentUser,bankAccounts=[],expenses=[],suppliers=[],onAddSupplier}){
  const [showQuickNcc,setShowQuickNcc]=React.useState(false);
  const [quickNccName,setQuickNccName]=React.useState("");
  const [tab,setTab]=React.useState("thu");
  const [showForm,setShowForm]=React.useState(false);
  const [showAddonForm,setShowAddonForm]=React.useState(false);
  const [vForm,setVForm]=React.useState({type:"thu",purpose:"deposit",amount:"",method:"cash",note:"",bankId:"",date:new Date().toISOString().slice(0,10),billImg:"",nccId:"",nccName:""});
  const [billLightbox,setBillLightbox]=React.useState(null);
  const handleBillUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(file.size>5*1024*1024) return pushNotif&&pushNotif("Ảnh tối đa 5MB","error");
    const reader=new FileReader();
    reader.onload=(ev)=>setVForm(f=>({...f,billImg:ev.target.result}));
    reader.readAsDataURL(file);
  };
  const [addonForm,setAddonForm]=React.useState({name:"",category:"other",unitPrice:0,qty:1,unit:"người",totalPrice:0,note:""});

  const orderVouchers=(vouchers||[]).filter(v=>v.orderId===order?.id);
  const thuList=orderVouchers.filter(v=>v.type==="thu");
  const chiList=orderVouchers.filter(v=>v.type==="chi");
  const {totalPaid:totalThu,totalChi}=calcVoucherTotals(vouchers,order?.id);

  const saveVoucher=()=>{
    if(!vForm.amount||Number(vForm.amount)<=0) return pushNotif&&pushNotif("Nhập số tiền","error");
    if(vForm.type==="chi"&&!vForm.nccId&&!vForm.nccName) return pushNotif&&pushNotif("Chọn nhà cung cấp nhận tiền","error");
    const prefix=vForm.type==="thu"?"PT":"PC";
    const newV={
      id:prefix+"-"+new Date().getFullYear()+"-"+String(Date.now()).slice(-4),
      orderId:order?.id,type:vForm.type,purpose:vForm.purpose||"deposit",
      amount:Number(vForm.amount),method:vForm.method,note:vForm.note,date:vForm.date,
      billImg:vForm.billImg||"",
      ncc:vForm.nccName||"", nccId:vForm.nccId||"",
      customerName:vForm.type==="thu"?(order?.customerName||""):"",
      status:"pending",createdBy:currentUser?.name,createdAt:new Date().toISOString()
    };
    onAddVoucher&&onAddVoucher(newV);
    pushNotif&&pushNotif("Đã tạo phiếu - chờ duyệt","success");
    setShowForm(false);
    setVForm({type:"thu",purpose:"deposit",amount:"",method:"cash",note:"",bankId:"",date:new Date().toISOString().slice(0,10),billImg:"",nccId:"",nccName:""});
  };
  const createQuickNcc=()=>{
    if(!quickNccName.trim()) return pushNotif&&pushNotif("Nhập tên NCC","error");
    const id="ncc-"+Date.now();
    const newNcc={id,ma_ncc:"NCC-"+String(Date.now()).slice(-4),ten:quickNccName.trim(),loai_hinh:[],khu_vuc_hoat_dong:[],sdt:"",email:"",nguoi_lien_he:"",ma_so_thue:"",dia_chi:"",tai_khoan_ngan_hang:{ngan_hang:"",so_tk:"",chu_tk:""},cong_no:0,trang_thai_hop_dong:"chua",danh_gia_noi_bo:3,dich_vu:[]};
    onAddSupplier&&onAddSupplier(newNcc);
    setVForm(f=>({...f,nccId:id,nccName:newNcc.ten}));
    setQuickNccName(""); setShowQuickNcc(false);
    pushNotif&&pushNotif("Đã tạo NCC: "+newNcc.ten,"success");
  };

  const saveAddon=()=>{
    if(!addonForm.name||addonForm.totalPrice<=0) return pushNotif&&pushNotif("Nhập tên và giá dịch vụ bổ sung","error");
    const newItem={
      id:"ADD-"+Date.now(),orderId:order.id,...addonForm,
      addedBy:currentUser?.name,addedAt:new Date().toISOString(),voucherId:null
    };
    onUpdate&&onUpdate({
      ...order,
      additionalItems:[...(order.additionalItems||[]),newItem],
      auditLog:[...(order.auditLog||[]),{ts:new Date().toISOString(),by:currentUser?.name,action:"Thêm dịch vụ bổ sung: "+newItem.name+" — "+newItem.totalPrice.toLocaleString("vi-VN")+" ₫"}],
    });
    setShowAddonForm(false);
    setAddonForm({name:"",category:"other",unitPrice:0,qty:1,unit:"người",totalPrice:0,note:""});
    pushNotif&&pushNotif("Đã thêm dịch vụ bổ sung","success");
  };

  const createAddonVoucher=(item)=>{
    const newV={
      id:"PT-"+new Date().getFullYear()+"-"+String(Date.now()).slice(-4),
      orderId:order.id,type:"thu",purpose:"addon",
      amount:item.totalPrice,method:"bank",
      note:"Thu bổ sung: "+item.name,
      date:new Date().toISOString().slice(0,10),
      status:"pending",createdBy:currentUser?.name,createdAt:new Date().toISOString()
    };
    onAddVoucher&&onAddVoucher(newV);
    onUpdate&&onUpdate({
      ...order,
      additionalItems:(order.additionalItems||[]).map(i=>i.id===item.id?{...i,voucherId:newV.id}:i),
    });
    pushNotif&&pushNotif("Đã tạo "+newV.id+" — chờ kế toán duyệt","success");
  };

  const statusBadge=(s)=>{
    const map={pending:{bg:"var(--c-warning-bg)",color:"var(--c-warning)",label:"Chờ duyệt"},approved:{bg:"var(--c-success-bg)",color:"var(--c-success-mid)",label:"Đã duyệt"},rejected:{bg:"var(--c-danger-bg)",color:"var(--c-danger-mid)",label:"Từ chối"},confirmed:{bg:"var(--c-primary-pale)",color:"var(--c-primary-mid)",label:"Đã xác nhận"}};
    const c=map[s]||{bg:"var(--c-surface-3)",color:"var(--c-text-3)",label:s};
    return <span style={{fontSize:11,borderRadius:6,padding:"2px 8px",background:c.bg,color:c.color,fontWeight:600}}>{c.label}</span>;
  };

  const PURPOSE_LABEL={deposit:"Đặt cọc",final_payment:"TT còn lại",addon:"Bổ sung",other:"Khác"};
  const inp11={width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"7px 10px",fontSize:13,boxSizing:"border-box"};

  const addonTotal=(order.additionalItems||[]).reduce((s,i)=>s+(i.totalPrice||0),0);

  return(
    <div style={{marginTop:16}}>
      <PaymentTimeline order={order} vouchers={vouchers}/>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16,borderBottom:"2px solid var(--c-border)",paddingBottom:8}}>
        {[["thu","Phiếu thu"],["chi","Phiếu chi"],["addon","Dịch vụ bổ sung"]].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"6px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,background:tab===k?"var(--c-primary-mid)":"transparent",color:tab===k?"var(--c-text-inverse)":"var(--c-text-3)",display:"flex",alignItems:"center",gap:4}}>
            {label}
            {k==="addon"&&(order.additionalItems||[]).length>0&&<span style={{background:"var(--c-danger-mid)",color:"var(--c-text-inverse)",borderRadius:999,fontSize:10,padding:"1px 5px"}}>{(order.additionalItems||[]).length}</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        <div style={{fontSize:13,color:"var(--c-text-3)"}}>Thu: <b style={{color:"var(--c-success-mid)"}}>{totalThu.toLocaleString("vi-VN")}₫</b> | Chi: <b style={{color:"var(--c-danger-mid)"}}>{totalChi.toLocaleString("vi-VN")}₫</b></div>
      </div>

      {/* TAB: Phiếu thu / Phiếu chi */}
      {(tab==="thu"||tab==="chi")&&(
        <>
          {/* Phiếu thu: sale/điều hành/GĐ (+KT,thủ quỹ) — sau khi cấp dịch vụ xong | Phiếu chi: GĐ/kế toán/thủ quỹ — đã thanh toán NCC */}
          {((tab==="thu"&&["sale","dieu_hanh","manager","accountant","cashier"].includes(currentRole))
            ||(tab==="chi"&&["manager","accountant","cashier"].includes(currentRole)))&&(
            <button onClick={()=>{
              // Khi bấm nút, đặt cứng type theo tab đang ở
              setVForm(f=>({...f, type:tab, purpose:tab==="thu"?"deposit":"ncc_payment"}));
              setShowForm(true);
            }} style={{marginBottom:12,background:tab==="thu"?"var(--c-primary-mid)":"var(--c-danger-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13}}>
              + Tạo phiếu {tab==="thu"?"thu":"chi"}
            </button>
          )}
          {showForm&&(
            <div style={{background:"var(--c-surface-2)",borderRadius:12,padding:16,marginBottom:16,border:"1px solid var(--c-border)"}}>
              <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {/* Loại phiếu — cứng theo tab đang chọn, không cho đổi */}
                <div style={{gridColumn:"1/-1"}}>
                  <div style={{
                    padding:"10px 14px",borderRadius:8,fontWeight:700,fontSize:14,
                    background:vForm.type==="thu"?"var(--c-primary-light)":"var(--c-danger-bg)",
                    color:vForm.type==="thu"?"var(--c-primary)":"var(--c-danger)",
                    border:`1.5px solid ${vForm.type==="thu"?"var(--c-primary-pale)":"var(--c-danger-border)"}`,
                    display:"flex",alignItems:"center",gap:8
                  }}>
                    <i className={`ti ${vForm.type==="thu"?"ti-arrow-down-circle":"ti-arrow-up-circle"}`} style={{fontSize:18}}/>
                    {vForm.type==="thu"?"Phiếu thu — Ghi nhận tiền khách hàng thanh toán":"Phiếu chi — Ghi nhận chi phí / thanh toán NCC"}
                  </div>
                </div>
                {/* Thu: hiện tên KH | Chi: chọn NCC nhận tiền */}
                {vForm.type==="thu"&&order?.customerName&&(
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Khách hàng đóng góp doanh thu</label>
                    <div style={{padding:"9px 12px",background:"var(--c-primary-light)",borderRadius:8,fontSize:13,fontWeight:600,color:"var(--c-primary)"}}>👤 {order.customerName}{order.customerPhone?` · ${order.customerPhone}`:""}</div>
                  </div>
                )}
                {vForm.type==="chi"&&(
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Nhà cung cấp nhận tiền * <span style={{fontWeight:400,color:"var(--c-text-muted)"}}>(ghi nhận chi phí cho NCC)</span></label>
                    {showQuickNcc?(
                      <div style={{display:"flex",gap:6}}>
                        <input value={quickNccName} onChange={e=>setQuickNccName(e.target.value)} placeholder="Tên NCC mới..." autoFocus style={{...inp11,flex:1}}/>
                        <button onClick={createQuickNcc} style={{background:"var(--c-success-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"0 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>Tạo</button>
                        <button onClick={()=>{setShowQuickNcc(false);setQuickNccName("");}} style={{background:"var(--c-surface-3)",color:"var(--c-text-3)",border:"none",borderRadius:8,padding:"0 12px",cursor:"pointer",fontSize:13}}>Hủy</button>
                      </div>
                    ):(
                      <div style={{display:"flex",gap:6}}>
                        <select value={vForm.nccId} onChange={e=>{const s=suppliers.find(x=>x.id===e.target.value);setVForm(f=>({...f,nccId:e.target.value,nccName:s?.ten||""}));}} style={{...inp11,flex:1}}>
                          <option value="">-- Chọn nhà cung cấp --</option>
                          {suppliers.map(s=><option key={s.id} value={s.id}>{s.ten}{s.loai_hinh?.length?` (${s.loai_hinh[0]})`:""}</option>)}
                        </select>
                        <button onClick={()=>setShowQuickNcc(true)} style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",border:"1px solid var(--c-primary-pale)",borderRadius:8,padding:"0 14px",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>+ NCC mới</button>
                      </div>
                    )}
                  </div>
                )}
                {/* Mục đích — phân theo loại thu/chi */}
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>
                    {vForm.type==="thu"?"Mục đích thu":"Mục đích chi"}
                  </label>
                  <select value={vForm.purpose} onChange={e=>setVForm(f=>({...f,purpose:e.target.value}))} style={inp11}>
                    {vForm.type==="thu" ? (<>
                      <option value="deposit">Đặt cọc (một phần)</option>
                      <option value="full_payment">Thanh toán đủ 100%</option>
                      <option value="final_payment">Thanh toán phần còn lại</option>
                      <option value="addon">Dịch vụ bổ sung</option>
                      <option value="other">Khác</option>
                    </>) : (<>
                      <option value="ncc_payment">Thanh toán NCC</option>
                      <option value="hdv_fee">Thù lao HDV</option>
                      <option value="transport">Vận chuyển</option>
                      <option value="refund">Hoàn tiền KH</option>
                      <option value="other">Khác</option>
                    </>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Số tiền (₫)</label>
                  <NumberInput
                    value={vForm.amount||0}
                    onChange={v=>setVForm(f=>({...f,amount:v}))}
                    placeholder="VD: 1.500.000"
                    style={inp11}
                  />
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Hình thức</label>
                  <select value={vForm.method} onChange={e=>setVForm(f=>({...f,method:e.target.value}))} style={inp11}>
                    <option value="cash">Tiền mặt</option><option value="bank">Chuyển khoản</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Ngày</label>
                  <input type="date" value={vForm.date} onChange={e=>setVForm(f=>({...f,date:e.target.value}))} style={inp11}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Ghi chú</label>
                  <input value={vForm.note} onChange={e=>setVForm(f=>({...f,note:e.target.value}))} style={inp11}/>
                </div>
                {/* Upload ảnh bill / biên lai */}
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:6}}>
                    {vForm.type==="thu"?"📸 Ảnh bill nhận tiền":"📸 Ảnh bill chuyển tiền"} <span style={{fontWeight:400,color:"var(--c-text-muted)"}}>(biên lai CK / phiếu thu tiền mặt)</span>
                  </label>
                  {vForm.billImg?(
                    <div style={{display:"flex",alignItems:"center",gap:12,background:"var(--c-success-bg)",border:"1px solid var(--c-success-border)",borderRadius:10,padding:10}}>
                      <img src={vForm.billImg} alt="bill" onClick={()=>setBillLightbox(vForm.billImg)} style={{width:64,height:64,objectFit:"cover",borderRadius:8,cursor:"zoom-in",border:"1px solid var(--c-border)"}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--c-success)"}}>✓ Đã đính kèm ảnh bill</div>
                        <div style={{fontSize:11,color:"var(--c-text-3)",marginTop:2}}>Bấm ảnh để xem to</div>
                      </div>
                      <button onClick={()=>setVForm(f=>({...f,billImg:""}))} style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",border:"none",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>✕ Xóa</button>
                    </div>
                  ):(
                    <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,border:"2px dashed var(--c-border-mid)",borderRadius:10,padding:"16px",cursor:"pointer",background:"var(--c-surface-2)",color:"var(--c-text-3)",fontSize:13,fontWeight:600}}>
                      📎 Bấm để tải ảnh bill (tối đa 5MB)
                      <input type="file" accept="image/*" onChange={handleBillUpload} style={{display:"none"}}/>
                    </label>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={saveVoucher} style={{background:"var(--c-success-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:13}}>Lưu</button>
                <button onClick={()=>setShowForm(false)} style={{background:"var(--c-text-3)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:13}}>Hủy</button>
              </div>
            </div>
          )}
          {/* Lightbox xem ảnh bill */}
          {billLightbox&&(
            <div onClick={()=>setBillLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
              <img src={billLightbox} alt="bill" style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:8}}/>
              <button onClick={()=>setBillLightbox(null)} style={{position:"absolute",top:20,right:28,background:"rgba(255,255,255,.15)",border:"none",color:"var(--c-text-inverse)",borderRadius:"50%",width:36,height:36,fontSize:20,cursor:"pointer"}}>×</button>
            </div>
          )}
          {(tab==="thu"?thuList:chiList).length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:24,fontSize:13}}>Chưa có phiếu nào</div>}
          {(tab==="thu"?thuList:chiList).map(v=>(
            <div key={v.id} style={{background:"var(--c-surface)",borderRadius:10,padding:14,marginBottom:8,border:"1px solid var(--c-border)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              {v.billImg&&<img src={v.billImg} alt="bill" onClick={()=>setBillLightbox(v.billImg)} style={{width:44,height:44,objectFit:"cover",borderRadius:8,cursor:"zoom-in",border:"1px solid var(--c-border)",flexShrink:0}} title="Xem ảnh bill"/>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14}}>{v.id} — {v.method==="cash"?"Tiền mặt":"CK"}{v.billImg&&<span style={{marginLeft:6,fontSize:11,color:"var(--c-success)"}}>📎 Có bill</span>}</div>
                <div style={{fontSize:12,color:"var(--c-text-3)"}}>{v.date}{v.note&&" · "+v.note}</div>
                {v.purpose&&<span style={{fontSize:11,background:"var(--c-surface-3)",color:"var(--c-text-2)",borderRadius:4,padding:"1px 6px",display:"inline-block",marginTop:2}}>{PURPOSE_LABEL[v.purpose]||v.purpose}</span>}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:700,fontSize:15,color:v.type==="thu"?"var(--c-success-mid)":"var(--c-danger-mid)"}}>{(v.amount||0).toLocaleString("vi-VN")}₫</div>
                <div style={{marginTop:4,display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  {statusBadge(v.status)}
                  <div style={{display:"inline-flex",alignItems:"stretch",borderRadius:6,overflow:"hidden",border:"1px solid var(--c-primary-pale)"}}>
                    <button onClick={()=>openPrintWindow(v.type==="thu"?buildPhieuThu(v,order):buildPhieuChi(v,order))} style={{padding:"2px 8px",fontSize:11,fontWeight:600,background:"var(--c-primary-light)",color:"var(--c-primary)",border:"none",borderRight:"1px solid var(--c-primary-pale)",cursor:"pointer"}}>🖨 PDF</button>
                    <button onClick={()=>downloadAsWord(v.type==="thu"?buildPhieuThu(v,order):buildPhieuChi(v,order),(v.type==="thu"?"PhieuThu":"PhieuChi")+"-"+(v.id||""))} style={{padding:"2px 8px",fontSize:11,fontWeight:600,background:"var(--c-primary-pale)",color:"var(--c-primary)",border:"none",cursor:"pointer"}}>📝 Word</button>
                  </div>
                </div>
                {v.status==="pending"&&(currentRole==="accountant"||isBanGiamDoc(currentRole))&&(
                  <div style={{display:"flex",gap:6,marginTop:6}}>
                    <button onClick={()=>onApprove&&onApprove(v.id)} style={{background:"var(--c-success-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>Duyệt</button>
                    <button onClick={()=>onReject&&onReject(v.id)} style={{background:"var(--c-danger-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>Từ chối</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* TAB: Dịch vụ bổ sung */}
      {tab==="addon"&&(
        <div>
          <div style={{padding:"10px 14px",background:"var(--c-warning-bg)",borderRadius:8,marginBottom:12,fontSize:13}}>
            Dịch vụ gốc: <strong>{(order.totalPrice||0).toLocaleString("vi-VN")} ₫</strong>
            {(order.additionalItems||[]).length>0&&(
              <>&nbsp;+ Bổ sung: <strong style={{color:"var(--c-warning-mid)"}}>{addonTotal.toLocaleString("vi-VN")} ₫</strong>
              &nbsp;= Tổng mới: <strong style={{color:"var(--c-success)"}}>{((order.totalPrice||0)+addonTotal).toLocaleString("vi-VN")} ₫</strong></>
            )}
          </div>
          {(currentRole==="cashier"||currentRole==="accountant"||isBanGiamDoc(currentRole))&&(
            <button onClick={()=>setShowAddonForm(true)} style={{marginBottom:12,background:"var(--c-warning-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13}}>+ Thêm dịch vụ bổ sung</button>
          )}
          {showAddonForm&&(
            <div style={{background:"var(--c-warning-bg)",borderRadius:12,padding:16,marginBottom:16,border:"1px solid var(--c-warning-border)"}}>
              <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Tên dịch vụ bổ sung *</label>
                  <input value={addonForm.name} onChange={e=>setAddonForm(f=>({...f,name:e.target.value}))} placeholder="VD: Nâng phòng Superior lên Deluxe" style={inp11}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Đơn giá (₫)</label>
                  <NumberInput value={addonForm.unitPrice||0} onChange={v=>setAddonForm(f=>({...f,unitPrice:v,totalPrice:v*(f.qty||1)}))} placeholder="VD: 500.000" style={inp11}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Số lượng</label>
                  <input type="number" min={1} value={addonForm.qty} onChange={e=>setAddonForm(f=>({...f,qty:Number(e.target.value)||1,totalPrice:(f.unitPrice||0)*(Number(e.target.value)||1)}))} style={inp11}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Đơn vị</label>
                  <select value={addonForm.unit} onChange={e=>setAddonForm(f=>({...f,unit:e.target.value}))} style={inp11}>
                    <option value="người">người</option><option value="đêm">đêm</option><option value="lần">lần</option><option value="vé">vé</option><option value="suất">suất</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Thành tiền</label>
                  <div style={{padding:"8px 10px",background:"var(--c-surface-3)",borderRadius:8,fontWeight:700,fontSize:13}}>{(addonForm.totalPrice||0).toLocaleString("vi-VN")} ₫</div>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Ghi chú</label>
                  <input value={addonForm.note} onChange={e=>setAddonForm(f=>({...f,note:e.target.value}))} style={inp11}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <button onClick={saveAddon} style={{background:"var(--c-warning-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontWeight:600,fontSize:13}}>Lưu bổ sung</button>
                <button onClick={()=>setShowAddonForm(false)} style={{background:"var(--c-surface-3)",border:"none",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:13}}>Hủy</button>
              </div>
            </div>
          )}
          {(order.additionalItems||[]).length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:24,fontSize:13}}>Chưa có dịch vụ bổ sung</div>}
          {(order.additionalItems||[]).map(item=>(
            <div key={item.id} style={{background:"var(--c-surface)",borderRadius:10,padding:14,marginBottom:8,border:"1px solid var(--c-warning-border)",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14}}>{item.name}</div>
                <div style={{fontSize:12,color:"var(--c-text-3)",marginTop:2}}>
                  {(item.unitPrice||0).toLocaleString("vi-VN")} ₫ × {item.qty} {item.unit}
                  {item.note&&" · "+item.note}
                </div>
                <div style={{fontSize:11,color:"var(--c-text-muted)",marginTop:2}}>Thêm bởi {item.addedBy} · {item.addedAt?new Date(item.addedAt).toLocaleDateString("vi-VN"):""}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:700,fontSize:15,color:"var(--c-warning-mid)"}}>+{(item.totalPrice||0).toLocaleString("vi-VN")} ₫</div>
                {!item.voucherId?(
                  <button onClick={()=>createAddonVoucher(item)} style={{marginTop:6,background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>Tạo phiếu thu</button>
                ):(
                  <span style={{fontSize:11,color:"var(--c-success-mid)",display:"block",marginTop:4}}>✓ {item.voucherId}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
