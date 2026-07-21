import React from "react";
import PassengerPanel from "./PassengerPanel.jsx";
import FinancePanel from "./FinancePanel.jsx";
import { isBanGiamDoc } from "../utils/permissions.js";
import { getProfitStatus } from "../utils/profit.js";
import { ORDER_STATUS } from "../constants/statuses.js";
import { NEXT_STATUSES } from "../utils/orderStatus.js";
import { calcOrderFinancials } from "../utils/orderFinancials.js";
import { calcPaymentStages } from "../utils/paymentStages.js";
import {
  buildContractAirline, buildContractTour, buildCostStatement,
  buildPaymentRequest, buildLiquidation,
  buildRefundVoucher, buildPassengerList, buildServiceVoucher, buildContractCombo,
  downloadAsWord,
} from "../print/index.jsx";
import { openPrintWindow, buildConfirmation } from "../print/legacy.jsx";

export default function OrderDetail({order,vouchers,expenses=[],refunds=[],onBack,onUpdate,onDelete,onAddVoucher,onApprove,onReject,pushNotif,currentRole,bankAccounts=[],currentUser,hdvList=[],credits=[],onUpdateCredits,bookings=[],customers=[],suppliers=[],onAddSupplier,tasks=[],onViewTasks,onQuickAddTask}){
  const [showDeleteConfirm,setShowDeleteConfirm]=React.useState(false);
  const [activeTab,setActiveTab]=React.useState("info");
  const [showStatusMenu,setShowStatusMenu]=React.useState(false);

  const {totalPaid,totalChi,debt,profit,profitPct,nccDebt}=calcOrderFinancials(order,vouchers,bookings);
  const {depositAmt}=calcPaymentStages(order,vouchers);
  const profitStatus=getProfitStatus(profitPct,order?.service);
  const passengerCount=(order?.passengers||[]).length;
  const orderCustomerIds=new Set(customers.filter(c=>c.id===order?.customerId||(c.phone&&c.phone===order?.customerPhone)||c.name?.trim().toLowerCase()===order?.customerName?.trim().toLowerCase()).map(c=>c.id));
  const myTasks=tasks.filter(t=>t.orderId===order?.id||(t.customerId&&orderCustomerIds.has(t.customerId)));
  const missingCccdCount=(order?.passengers||[]).filter(p=>p.type!=="baby"&&!p.cccd).length;

  const changeStatus=(status)=>{
    if(status==="confirmed"&&missingCccdCount>0){
      if(!window.confirm("Còn "+missingCccdCount+" khách thiếu CCCD. Vẫn xác nhận đơn?")) return;
    }
    if(status==="in_progress"&&totalPaid<depositAmt){
      if(!window.confirm("Khách mới đóng "+fmtMoney(totalPaid)+" / "+fmtMoney(depositAmt)+" tiền cọc. Vẫn bàn giao cho điều hành?")) return;
    }
    onUpdate&&onUpdate({...order,status});
    setShowStatusMenu(false);
    pushNotif&&pushNotif("Cập nhật trạng thái: "+ORDER_STATUS[status]?.label);
  };

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const fmtDate=(s)=>s?new Date(s).toLocaleDateString("vi-VN"):"—";

  const tabs=["info","passengers","finance","audit"];
  const totalPaxCount = typeof order?.pax==="object"
    ? (order.pax.adults||0)+(order.pax.child10||0)+(order.pax.child5||0)+(order.pax.child2||0)+(order.pax.infant||0)||(order.adultQty||1)
    : (order?.adultQty||order?.pax||1);
  const tabLabel={"info":"📋 Thông tin","passengers":"🪪 Hành khách ("+passengerCount+"/"+totalPaxCount+")","finance":"💰 Thu chi","audit":"📜 Lịch sử"};

  return(
    <div style={{padding:24,maxWidth:960,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"var(--c-text-3)"}}>←</button>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"var(--c-text-2)"}}>{order?.id}</h2>
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowStatusMenu(v=>!v)} style={{background:ORDER_STATUS[order?.status]?.bg||"var(--c-border)",color:ORDER_STATUS[order?.status]?.color||"var(--c-text-2)",border:"none",borderRadius:20,padding:"5px 14px",cursor:"pointer",fontWeight:700,fontSize:12}}>
                {ORDER_STATUS[order?.status]?.label||order?.status} ▾
              </button>
              {showStatusMenu&&(NEXT_STATUSES[order?.status]||[]).length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,background:"var(--c-surface)",border:"1px solid var(--c-border)",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,.12)",zIndex:100,marginTop:4,minWidth:160}}>
                  {(NEXT_STATUSES[order?.status]||[]).map(s=>(
                    <div key={s} onClick={()=>changeStatus(s)} style={{padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:600,color:ORDER_STATUS[s]?.color||"var(--c-text-2)"}}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--c-surface-2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                      → {ORDER_STATUS[s]?.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {missingCccdCount>0&&(
              <span style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700}}>⚠️ Thiếu {missingCccdCount} CCCD</span>
            )}
          </div>
          <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:2}}>Tạo: {fmtDate(order?.createdAt)} · NV: {order?.sale}</div>
        </div>
        {/* Nút xóa đơn — Ban Giám đốc (Giám đốc/Phó Giám đốc) */}
        {isBanGiamDoc(currentRole)&&onDelete&&(
          <button onClick={()=>setShowDeleteConfirm(true)} style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",border:"1px solid var(--c-danger-border)",borderRadius:9,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
            <i className="ti ti-trash" style={{fontSize:16}}/> Xóa đơn
          </button>
        )}
      </div>

      {/* Modal xác nhận xóa */}
      {showDeleteConfirm&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowDeleteConfirm(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"var(--c-surface)",borderRadius:16,padding:28,width:420,maxWidth:"90vw",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
            <div style={{fontSize:18,fontWeight:800,color:"var(--c-text)",marginBottom:8}}>Xóa đơn {order?.id}?</div>
            <div style={{fontSize:14,color:"var(--c-text-3)",marginBottom:8,lineHeight:1.6}}>
              Đơn của <strong>{order?.customerName}</strong> — {order?.tourName||order?.serviceName}<br/>
              Giá trị: <strong style={{color:"var(--c-danger-mid)"}}>{fmtMoney(order?.totalPrice)}</strong>
            </div>
            <div style={{fontSize:13,color:"var(--c-danger-mid)",background:"var(--c-danger-bg)",borderRadius:8,padding:"10px 14px",marginBottom:20,fontWeight:600}}>
              ⚠️ Hành động này KHÔNG thể hoàn tác. Đơn sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowDeleteConfirm(false)} style={{flex:1,padding:"11px",border:"1.5px solid var(--c-border)",borderRadius:10,background:"var(--c-surface)",fontWeight:600,fontSize:14,cursor:"pointer",color:"var(--c-text-3)"}}>Hủy</button>
              <button onClick={()=>{setShowDeleteConfirm(false);onDelete(order);}} style={{flex:1,padding:"11px",border:"none",borderRadius:10,background:"var(--c-danger-mid)",color:"var(--c-text-inverse)",fontWeight:700,fontSize:14,cursor:"pointer"}}>Xóa vĩnh viễn</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI bar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20}}>
        {[["Doanh thu",fmtMoney(order?.totalPrice),"var(--c-primary-mid)"],["Đã thu (duyệt)",fmtMoney(totalPaid),"var(--c-success-mid)"],["Công nợ KH",fmtMoney(debt),debt>0?"var(--c-danger-mid)":"var(--c-success-mid)"],["Công nợ NCC",fmtMoney(nccDebt),nccDebt>0?"var(--c-danger-mid)":"var(--c-success-mid)"],["Lợi nhuận",fmtMoney(profit),profit>0?"var(--c-purple)":"var(--c-danger-mid)"]].map(([label,val,color])=>(
          <div key={label} style={{background:"var(--c-surface)",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontSize:11,color:"var(--c-text-3)",fontWeight:600}}>{label}</div>
            <div style={{fontSize:17,fontWeight:800,color,marginTop:4}}>{val}</div>
          </div>
        ))}
        <div style={{background:profitStatus.bg,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontSize:11,color:profitStatus.color,fontWeight:600}}>Tỷ suất LN {profitStatus.icon}</div>
          <div style={{fontSize:17,fontWeight:800,color:profitStatus.color,marginTop:4}}>{profitPct.toFixed(1)}% · {profitStatus.label}</div>
        </div>
      </div>

      {/* Quick links bar */}
      {(()=>{
        const qlBtn=(bg,color)=>({display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:500,background:bg,color,border:"none",cursor:"pointer"});
        const orderBookings=(bookings||[]).filter(b=>b.orderId===order?.id&&b.status!=="cancelled");
        const orderExpenses=(expenses||[]).filter(e=>e.orderId===order?.id);
        const pendingExp=orderExpenses.filter(e=>["pending_kt","pending_gd","pending_pay"].includes(e.status));
        return(
          <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"10px 0",borderBottom:"0.5px solid var(--c-border)",marginBottom:16}}>
            {order?.customerPhone&&(()=>{
              const c=(customers||[]).find(x=>x.phone===order.customerPhone||x.sdt===order.customerPhone);
              return(<button onClick={()=>c?pushNotif?.("Xem hồ sơ KH trong CRM","info"):pushNotif?.("Khách hàng chưa có hồ sơ trong CRM","warn")} style={qlBtn("var(--c-primary-light)","var(--c-primary-mid)")}><i className="ti ti-user" style={{fontSize:14}}/>Hồ sơ KH</button>);
            })()}
            {orderBookings.length===0
              ?<button onClick={()=>pushNotif?.("Chưa có booking NCC — vào module NCC để tạo","warn")} style={qlBtn("var(--c-danger-bg)","var(--c-danger)")}><i className="ti ti-building-off" style={{fontSize:14}}/>Chưa booking NCC</button>
              :<span style={{...qlBtn("var(--c-success-bg)","var(--c-success)"),cursor:"default"}}><i className="ti ti-building-check" style={{fontSize:14}}/>{orderBookings.length} NCC đã booking</span>
            }
            {order?.hdvId
              ?<span style={{...qlBtn("var(--c-purple-bg)","var(--c-purple)"),cursor:"default"}}><i className="ti ti-user-check" style={{fontSize:14}}/>HDV: {order.hdvName||(hdvList||[]).find(h=>h.id===order.hdvId)?.name||order.hdvId}</span>
              :<span style={{...qlBtn("var(--c-surface-2)","var(--c-text-muted)"),cursor:"default"}}><i className="ti ti-user-off" style={{fontSize:14}}/>Chưa có HDV</span>
            }
            {pendingExp.length>0&&<span style={{...qlBtn("var(--c-warning-bg)","var(--c-warning)"),cursor:"default"}}><i className="ti ti-clock" style={{fontSize:14}}/>{pendingExp.length} phiếu chi chờ duyệt</span>}
            {pendingExp.length===0&&orderExpenses.length>0&&<span style={{...qlBtn("var(--c-success-bg)","var(--c-success)"),cursor:"default"}}><i className="ti ti-check" style={{fontSize:14}}/>{orderExpenses.length} phiếu chi đã xử lý</span>}
          </div>
        );
      })()}

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:"2px solid var(--c-border)",paddingBottom:0}}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)} style={{padding:"10px 18px",border:"none",background:"none",cursor:"pointer",fontWeight:600,fontSize:13,color:activeTab===t?"var(--c-primary-mid)":"var(--c-text-3)",borderBottom:activeTab===t?"2px solid var(--c-primary-mid)":"2px solid transparent",marginBottom:-2,transition:"all .15s"}}>
            {tabLabel[t]}
          </button>
        ))}
      </div>

      {/* INFO TAB */}
      {activeTab==="info"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{background:"var(--c-surface)",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontWeight:700,marginBottom:14,fontSize:14,color:"var(--c-text-2)"}}>👤 Khách hàng</div>
            {[["Họ tên",order?.customerName||order?.customer],["SĐT",order?.customerPhone],["Email",order?.customerEmail||"—"],["Nguồn",order?.source||"—"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--c-border)",fontSize:13}}>
                <span style={{color:"var(--c-text-3)"}}>{k}</span><span style={{fontWeight:600}}>{v||"—"}</span>
              </div>
            ))}
          </div>
          {(()=>{
            const svc=(order?.service||order?.serviceType||"").toLowerCase();
            const isAirline=svc.includes("ve_may_bay")||svc.includes("may_bay");
            const isCruise=svc.includes("cruise")||svc.includes("thuyen");
            const isCombo=svc.includes("hotel_flight")||svc.includes("combo");
            const isHotel=!isCombo&&(svc.includes("hotel")||svc.includes("khach_san"));
            // pax có thể là số hoặc object {adults,children,babies}
            const paxStr=typeof order?.pax==="object"&&order?.pax!==null
              ? [order.pax.adults&&`${order.pax.adults} NL`,order.pax.children&&`${order.pax.children} TE`,order.pax.babies&&`${order.pax.babies} Em bé`].filter(Boolean).join(" · ")||"—"
              : (order?.pax||"—");
            const nights=(order?.departDate&&order?.returnDate)
              ? Math.round((new Date(order.returnDate)-new Date(order.departDate))/(86400000))
              : null;

            let icon,title,rows;
            if(isAirline){
              icon="✈️"; title="Chi tiết vé máy bay";
              rows=[
                ["Hành trình",   order?.serviceName||order?.tourName||"—"],
                ["Ngày đi",      fmtDate(order?.departDate)],
                ["Ngày về",      fmtDate(order?.returnDate)],
                ["Số khách",     paxStr],
                ["Hạng vé",      order?.seatClass||"—"],
                ["Mã PNR",       order?.pnrCode||order?.pnr||"—"],
                ["Hành lý ký gửi",order?.baggage||"—"],
              ];
            } else if(isCruise){
              icon="🛳️"; title="Chi tiết du thuyền";
              rows=[
                ["Du thuyền",    order?.serviceName||"—"],
                ["Hành trình",   order?.route||"—"],
                ["Ngày đi",      fmtDate(order?.departDate)],
                ["Ngày về",      fmtDate(order?.returnDate)],
                nights?["Số đêm",`${nights} đêm`]:null,
                ["Số khách",     paxStr],
                ["Loại cabin",   order?.cabinType||"—"],
              ].filter(Boolean);
            } else if(isCombo){
              icon="🌏"; title="Chi tiết combo";
              rows=[
                ["Dịch vụ",      order?.serviceName||"—"],
                ["Ngày đi",      fmtDate(order?.departDate)],
                ["Ngày về",      fmtDate(order?.returnDate)],
                nights?["Số đêm",`${nights} đêm`]:null,
                ["Số khách",     paxStr],
                ["Điểm đến",     order?.destination||"—"],
                ["Khách sạn",    order?.hotelName||"—"],
              ].filter(Boolean);
            } else if(isHotel){
              icon="🏨"; title="Chi tiết khách sạn";
              rows=[
                ["Khách sạn",    order?.serviceName||"—"],
                ["Check-in",     fmtDate(order?.departDate)],
                ["Check-out",    fmtDate(order?.returnDate)],
                nights?["Số đêm",`${nights} đêm`]:null,
                ["Số khách",     paxStr],
                ["Loại phòng",   order?.roomType||"—"],
                ["Số phòng",     order?.roomCount||"—"],
              ].filter(Boolean);
            } else {
              // Tour trọn gói (mặc định)
              icon="🗺️"; title="Chi tiết tour";
              rows=[
                ["Tour",         order?.tourName||order?.serviceName||"—"],
                ["Ngày đi",      fmtDate(order?.departDate)],
                ["Ngày về",      fmtDate(order?.returnDate)],
                nights?["Số đêm",`${nights} đêm`]:null,
                ["Số khách",     paxStr],
                ["HDV",          order?.hdvName||"Chưa phân công"],
              ].filter(Boolean);
            }
            const muted="var(--c-text-muted)";
            return(
              <div style={{background:"var(--c-surface)",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:700,marginBottom:14,fontSize:14,color:"var(--c-text-2)"}}>{icon} {title}</div>
                {rows.map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--c-border)",fontSize:13}}>
                    <span style={{color:"var(--c-text-3)"}}>{k}</span>
                    <span style={{fontWeight:600,color:v==="—"||v==="Chưa phân công"?muted:"var(--c-text-2)"}}>{v}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          {order?.note&&(
            <div style={{gridColumn:"1/-1",background:"var(--c-warning-bg)",borderRadius:12,padding:16,border:"1px solid var(--c-warning-border)"}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--c-warning)",marginBottom:4}}>📝 GHI CHÚ</div>
              <div style={{fontSize:13,color:"var(--c-warning)"}}>{order.note}</div>
            </div>
          )}
          {/* ── TÀI LIỆU IN ── */}
          {(()=>{
            // ── Tính toán số tiền theo từng giai đoạn ──────────
            const {totalPaid,totalPrice,depositAmt,remainingAmt,overpayAmt,finalPayAmt}=calcPaymentStages(order,vouchers);
            const refundRecord  = (refunds||[]).find(r=>r.orderId===order?.id);

            // Tên file
            const fid = order?.orderNo||order?.id||"";
            const isTour = ["tour","tour_package","tour_ghep"].includes(order?.service)||
                           (order?.tourName||order?.serviceName||"").toLowerCase().includes("tour");

            // Params dùng chung
            const baseOrder = {
              ...order,
              pricing:{ ...order?.pricing, totalRevenue: totalPrice },
              customer:{ name:order?.customerName, phone:order?.customerPhone, email:order?.customerEmail },
            };

            const DocBtn = ({label, bg, color, border, onClick, onWord, wordFile}) => (
              <div style={{display:"inline-flex",alignItems:"stretch",borderRadius:8,overflow:"hidden",border:`1px solid ${border}`}}>
                <button onClick={onClick} style={{padding:"8px 12px",background:bg,color,border:"none",borderRight:`1px solid ${border}`,cursor:"pointer",fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>
                  {label} &nbsp;🖨
                </button>
                <button onClick={onWord} style={{padding:"8px 10px",background:bg,color,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,opacity:.8}}>
                  📝 Word
                </button>
              </div>
            );

            return (
              <div style={{gridColumn:"1/-1",background:"var(--c-surface)",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:700,marginBottom:4,fontSize:14,color:"var(--c-text-2)"}}>🖨️ Tài liệu & In ấn</div>

                {/* Tóm tắt số tiền theo giai đoạn */}
                <div style={{display:"flex",gap:10,marginBottom:14,padding:"10px 14px",background:"var(--c-surface-2)",borderRadius:10,fontSize:12,flexWrap:"wrap"}}>
                  {[
                    {label:"Giá trị đơn",   val:totalPrice,   color:"var(--c-primary-mid)"},
                    {label:"Tiền cọc",       val:depositAmt,   color:"var(--c-warning-mid)"},
                    {label:"Còn lại đợt 2",  val:finalPayAmt,  color:"var(--c-purple)"},
                    {label:"Đã thu thực tế", val:totalPaid,    color:"var(--c-success-mid)"},
                    {label:"Còn phải thu",   val:remainingAmt, color:remainingAmt>0?"var(--c-danger-mid)":"var(--c-success-mid)"},
                    ...(overpayAmt>0?[{label:"Thu thừa (cần hoàn)", val:overpayAmt, color:"var(--c-purple)"}]:[]),
                  ].map(k=>(
                    <div key={k.label} style={{textAlign:"center",minWidth:90}}>
                      <div style={{fontSize:10,color:"var(--c-text-muted)",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>{k.label}</div>
                      <div style={{fontSize:13,fontWeight:700,color:k.color}}>{(k.val||0).toLocaleString("vi-VN")}đ</div>
                    </div>
                  ))}
                </div>

                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>

                  {/* 1. Phiếu xác nhận — luôn hiển thị */}
                  <DocBtn label="📋 Phiếu xác nhận dịch vụ" bg="#eff6ff" color="#1e3a8a" border="#bfdbfe"
                    onClick={()=>openPrintWindow(buildConfirmation(order,vouchers,null))}
                    onWord={()=>downloadAsWord(buildConfirmation(order,vouchers,null),"Phieu-xac-nhan-"+fid)}/>

                  {/* 2. Hợp đồng — chọn đúng loại */}
                  {isTour ? (
                    <DocBtn label="📝 Hợp đồng tour" bg="#f0fdf4" color="#15803d" border="#bbf7d0"
                      onClick={()=>openPrintWindow(buildContractTour({order:baseOrder,issuerName:currentUser?.name}))}
                      onWord={()=>downloadAsWord(buildContractTour({order:baseOrder,issuerName:currentUser?.name}),"HopDong-Tour-"+fid)}/>
                  ):(
                    <DocBtn label="📝 Hợp đồng dịch vụ" bg="#f0fdf4" color="#15803d" border="#bbf7d0"
                      onClick={()=>openPrintWindow(buildContractAirline({order:baseOrder,issuerName:currentUser?.name}))}
                      onWord={()=>downloadAsWord(buildContractAirline({order:baseOrder,issuerName:currentUser?.name}),"HopDong-DichVu-"+fid)}/>
                  )}

                  {/* 3. Yêu cầu TT đặt cọc — dùng đúng số tiền cọc từ đơn */}
                  <DocBtn label={`💳 YCTT đặt cọc (${depositAmt.toLocaleString("vi-VN")}đ)`}
                    bg="#fef9c3" color="#92400e" border="#fde68a"
                    onClick={()=>openPrintWindow(buildPaymentRequest({order:baseOrder,stage:"deposit",requestAmount:depositAmt,issuerName:currentUser?.name}))}
                    onWord={()=>downloadAsWord(buildPaymentRequest({order:baseOrder,stage:"deposit",requestAmount:depositAmt,issuerName:currentUser?.name}),"YCTT-DatCoc-"+fid)}/>

                  {/* 4. Yêu cầu TT đợt 2 — hiển thị khi còn tiền phải thu */}
                  {remainingAmt>0&&(
                    <DocBtn label={`💳 YCTT còn lại (${remainingAmt.toLocaleString("vi-VN")}đ)`}
                      bg="#fff7ed" color="#9a3412" border="#fed7aa"
                      onClick={()=>openPrintWindow(buildPaymentRequest({order:baseOrder,stage:"final",requestAmount:remainingAmt,issuerName:currentUser?.name}))}
                      onWord={()=>downloadAsWord(buildPaymentRequest({order:baseOrder,stage:"final",requestAmount:remainingAmt,issuerName:currentUser?.name}),"YCTT-ConLai-"+fid)}/>
                  )}

                  {/* 5. Bảng kê chi phí — nội bộ */}
                  <DocBtn label="🧾 Bảng kê chi phí" bg="#faf5ff" color="var(--c-purple)" border="#e9d5ff"
                    onClick={()=>openPrintWindow(buildCostStatement({order:baseOrder,items:expenses.filter(e=>e.orderId===order?.id),issuerName:currentUser?.name}))}
                    onWord={()=>downloadAsWord(buildCostStatement({order:baseOrder,items:expenses.filter(e=>e.orderId===order?.id),issuerName:currentUser?.name}),"BangKe-ChiPhi-"+fid)}/>

                  {/* 6. Biên bản thanh lý — dùng số tiền đã thu thực tế */}
                  <DocBtn label="📃 Biên bản thanh lý HĐ" bg="#fff1f2" color="#be123c" border="#fecdd3"
                    onClick={()=>openPrintWindow(buildLiquidation({order:baseOrder,totalPaid,issuerName:currentUser?.name}))}
                    onWord={()=>downloadAsWord(buildLiquidation({order:baseOrder,totalPaid,issuerName:currentUser?.name}),"BienBan-ThanhLy-"+fid)}/>

                  {/* 9. Danh sách hành khách */}
                  <DocBtn label="👥 Danh sách hành khách" bg="#f0fdf4" color="#166534" border="#bbf7d0"
                    onClick={()=>openPrintWindow(buildPassengerList({order,passengers:order?.passengers||[],issuerName:currentUser?.name}))}
                    onWord={()=>downloadAsWord(buildPassengerList({order,passengers:order?.passengers||[],issuerName:currentUser?.name}),"DanhSach-HanhKhach-"+fid)}/>

                  {/* 10. Voucher dịch vụ NCC */}
                  {(()=>{
                    const bk=(bookings||[]).find(b=>b.orderId===order?.id&&b.status!=="cancelled");
                    const sup=bk?.supplierId?(suppliers||[]).find(s=>s.id===bk.supplierId):null;
                    const svcType=order?.service==="hotel"?"hotel":order?.service==="flight"?"flight":order?.service==="cruise"?"cruise":"other";
                    const vParams={order,booking:bk||{},supplier:sup||{},serviceType:svcType,issuerName:currentUser?.name,paxCount:order?.adultQty||1};
                    return(
                      <DocBtn label="🎫 Voucher dịch vụ NCC" bg="#ecfdf5" color="#065f46" border="#6ee7b7"
                        onClick={()=>openPrintWindow(buildServiceVoucher(vParams))}
                        onWord={()=>downloadAsWord(buildServiceVoucher(vParams),"Voucher-DichVu-"+fid)}/>
                    );
                  })()}

                  {/* 11. Hợp đồng tổng hợp Combo */}
                  {order?.service==="combo"&&(
                    <DocBtn label="📦 HĐ tổng hợp (Combo)" bg="#faf5ff" color="#6d28d9" border="#ddd6fe"
                      onClick={()=>openPrintWindow(buildContractCombo({order:baseOrder,issuerName:currentUser?.name}))}
                      onWord={()=>downloadAsWord(buildContractCombo({order:baseOrder,issuerName:currentUser?.name}),"HopDong-Combo-"+fid)}/>
                  )}

                  {/* 7. Phiếu hoàn trả — chỉ hiện khi thu thừa hoặc có refund record */}
                  {(overpayAmt>0||refundRecord)&&(()=>{
                    const params={
                      order, issuerName:currentUser?.name,
                      customerName:order?.customerName, customerPhone:order?.customerPhone,
                      totalPaid,
                      refundAmount: refundRecord?.refundAmount || overpayAmt,
                      deductAmount: refundRecord?.feeAmount || 0,
                      deductReason: refundRecord?.policyNote || "",
                      refundReason: refundRecord?.reasonNote || (overpayAmt>0?"Khách chuyển khoản thừa":"Hoàn tiền theo yêu cầu"),
                      refundMethod: refundRecord?.method || "transfer",
                      refundType:   refundRecord ? (order?.status==="cancelled"?"cancel":"partial") : "overpay",
                      note: refundRecord?.note || "",
                    };
                    return(
                      <DocBtn label={`💜 Phiếu hoàn trả (${(params.refundAmount||0).toLocaleString("vi-VN")}đ)`}
                        bg="#f5f3ff" color="var(--c-purple)" border="#c4b5fd"
                        onClick={()=>openPrintWindow(buildRefundVoucher(params))}
                        onWord={()=>downloadAsWord(buildRefundVoucher(params),"PhieuHoanTra-"+fid)}/>
                    );
                  })()}

                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab==="info"&&(myTasks.length>0||onQuickAddTask)&&(
        <div style={{background:"var(--c-surface)",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:14,color:"var(--c-text-2)"}}>✅ Công việc liên quan ({myTasks.length})</div>
            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              {onQuickAddTask&&<button onClick={()=>onQuickAddTask({orderId:order?.id,customerId:[...orderCustomerIds][0]||""})} style={{background:"none",border:"none",color:"var(--c-primary-mid)",cursor:"pointer",fontSize:13,fontWeight:600}}>+ Thêm việc khác</button>}
              {onViewTasks&&myTasks.length>0&&<button onClick={onViewTasks} style={{background:"none",border:"none",color:"var(--c-primary-mid)",cursor:"pointer",fontSize:13,fontWeight:600}}>Xem tất cả →</button>}
            </div>
          </div>
          {myTasks.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:"10px 0",fontSize:13}}>Chưa có việc nào cho đơn này</div>}
          {myTasks.map(t=>(
            <div key={t.id} onClick={onViewTasks} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 4px",borderBottom:"1px solid var(--c-border)",cursor:onViewTasks?"pointer":"default",borderRadius:6}}
              onMouseEnter={e=>{if(onViewTasks)e.currentTarget.style.background="var(--c-surface-2)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
              <span style={{fontWeight:600,fontSize:13}}>{t.title}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:"var(--c-text-3)"}}>{t.assignee||"Chưa giao"}</span>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:t.status==="done"?"var(--c-success-bg)":t.status==="in_progress"?"var(--c-primary-light)":"var(--c-surface-2)",color:t.status==="done"?"var(--c-success-mid)":t.status==="in_progress"?"var(--c-primary-mid)":"var(--c-text-3)"}}>
                  {({new:"Mới",in_progress:"Đang làm",pending_review:"Chờ duyệt hoàn thành",done:"Hoàn thành"})[t.status]||t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PASSENGERS TAB */}
      {activeTab==="passengers"&&(
        <PassengerPanel order={order} onUpdate={onUpdate} pushNotif={pushNotif} customers={customers}/>
      )}

      {/* FINANCE TAB */}
      {activeTab==="finance"&&(
        <FinancePanel order={order} vouchers={vouchers} onAddVoucher={onAddVoucher} onApprove={onApprove} onReject={onReject} pushNotif={pushNotif} currentRole={currentRole} currentUser={currentUser} bankAccounts={bankAccounts} expenses={expenses} suppliers={suppliers} onAddSupplier={onAddSupplier}/>
      )}

      {/* AUDIT TAB */}
      {activeTab==="audit"&&(
        <div style={{background:"var(--c-surface)",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:14}}>Lịch sử thao tác</div>
          {(order?.auditLog||[]).length===0&&<div style={{color:"var(--c-text-muted)",textAlign:"center",padding:32}}>Chưa có lịch sử</div>}
          {(order?.auditLog||[]).map((log,i)=>(
            <div key={i} style={{padding:"10px 0",borderBottom:"1px solid var(--c-border)",fontSize:13}}>
              <span style={{color:"var(--c-text-3)"}}>{new Date(log.ts||log.time||0).toLocaleString("vi-VN")}</span>
              <span style={{marginLeft:12,fontWeight:600}}>{log.by||log.user}</span>
              <span style={{marginLeft:8,color:"var(--c-text-2)"}}>{log.action||log.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
