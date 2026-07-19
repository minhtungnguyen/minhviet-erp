import React from "react";

export default function OrderList({orders,vouchers,onView,onCreate,onQuickSale,currentRole,currentUser}){
  const [search,setSearch]=React.useState("");
  const [filterStatus,setFilterStatus]=React.useState("all");
  const [sortBy,setSortBy]=React.useState("newest");

  const STATUS_LABEL={pending_payment:"Chờ thanh toán",partial_paid:"Đã cọc",full_paid:"Đã thu đủ",confirmed:"Đã xác nhận",in_progress:"Đang chạy",closed:"Đã đóng",cancelled:"Đã hủy"};
  const STATUS_COLOR={pending_payment:{bg:"#fef9c3",color:"#92400e"},partial_paid:{bg:"#eff6ff",color:"#2563eb"},full_paid:{bg:"#dcfce7",color:"#166534"},confirmed:{bg:"#dbeafe",color:"#1d4ed8"},in_progress:{bg:"#dcfce7",color:"#15803d"},closed:{bg:"#f1f5f9",color:"#475569"},cancelled:{bg:"#fee2e2",color:"#dc2626"}};

  const myOrders=React.useMemo(()=>{
    let list=[...orders];
    if(currentRole==="sale") list=list.filter(o=>o.sale===currentUser?.name);
    if(search.trim()){const q=search.toLowerCase();list=list.filter(o=>o.id?.toLowerCase().includes(q)||o.customerName?.toLowerCase().includes(q)||o.customerPhone?.includes(q)||o.tourName?.toLowerCase().includes(q));}
    if(filterStatus!=="all") list=list.filter(o=>o.status===filterStatus);
    if(sortBy==="newest") list.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    else if(sortBy==="depart") list.sort((a,b)=>new Date(a.departDate||0)-new Date(b.departDate||0));
    else if(sortBy==="value") list.sort((a,b)=>(b.totalPrice||0)-(a.totalPrice||0));
    return list;
  },[orders,search,filterStatus,sortBy,currentRole,currentUser]);

  const summary=React.useMemo(()=>{
    const base=currentRole==="sale"?orders.filter(o=>o.sale===currentUser?.name):orders;
    return {
      total:base.length,
      pending:base.filter(o=>o.status==="pending_payment").length,
      active:base.filter(o=>["confirmed","in_progress"].includes(o.status)).length,
      revenue:base.filter(o=>o.status==="closed").reduce((s,o)=>s+(o.totalPrice||0),0),
    };
  },[orders,currentRole,currentUser]);

  const fmtM=(n)=>{const a=Math.abs(n||0),s=(n||0)<0?"-":"";if(a>=1e9)return s+(a/1e9).toFixed(1)+"tỷ";return s+Math.round(a).toLocaleString("vi-VN")+"đ";};
  const debt=(o)=>(o.totalPrice||o.pricing?.totalRevenue||0)-(o.totalPaid||0);

  return(
    <div style={{padding:24}}>
      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[["Tổng đơn",summary.total,"#2563eb"],["Chờ thu",summary.pending,"#d97706"],["Đang chạy",summary.active,"#16a34a"],["Doanh thu",fmtM(summary.revenue)+"₫","#7c3aed"]].map(([label,val,color])=>(
          <div key={label} style={{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontSize:12,color:"#64748b",fontWeight:600}}>{label}</div>
            <div style={{fontSize:22,fontWeight:800,color,marginTop:4}}>{val}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm mã đơn, tên khách, SĐT, tour..."
            style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:9,padding:"9px 12px 9px 32px",fontSize:13,boxSizing:"border-box"}}/>
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:9,padding:"9px 12px",fontSize:13,background:"#fff"}}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:9,padding:"9px 12px",fontSize:13,background:"#fff"}}>
          <option value="newest">Mới nhất</option>
          <option value="depart">Ngày đi gần nhất</option>
          <option value="value">Giá trị cao nhất</option>
        </select>
        {onQuickSale&&<button onClick={onQuickSale} style={{background:"#fff",color:"#2563eb",border:"2px solid #2563eb",borderRadius:9,padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>
          ⚡ Bán nhanh
        </button>}
        <button onClick={onCreate} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 18px",cursor:"pointer",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>
          + Tạo đơn
        </button>
      </div>

      {/* Table */}
      <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,.07)",overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#f8fafc"}}>
              {["Mã đơn","Khách hàng","Tour / Dịch vụ","Ngày đi","Pax","Giá bán","Còn nợ","Trạng thái",""].map(h=>(
                <th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:12,fontWeight:700,color:"#64748b",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myOrders.length===0&&(
              <tr><td colSpan={9} style={{textAlign:"center",color:"#94a3b8",padding:48,fontSize:14}}>
                {search||filterStatus!=="all"?"Không có đơn nào khớp điều kiện lọc":"Chưa có đơn hàng nào"}
              </td></tr>
            )}
            {myOrders.map(o=>{
              const sc=STATUS_COLOR[o.status]||{bg:"#f1f5f9",color:"#475569"};
              const d=debt(o);
              return(
                <tr key={o.id} style={{borderTop:"1px solid #f1f5f9",cursor:"pointer",transition:"background .1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e=>e.currentTarget.style.background=""}
                  onClick={()=>onView(o)}>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{fontWeight:700,fontSize:13,color:"#2563eb"}}>{o.id}</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{o.sale}</div>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{fontWeight:600,fontSize:13}}>{o.customerName||(o.customer?.name)||"—"}</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{o.customerPhone||(o.customer?.phone)||""}</div>
                  </td>
                  <td style={{padding:"12px 14px",fontSize:13,maxWidth:180}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.serviceName||o.tourName||o.service||"—"}</div>
                  </td>
                  <td style={{padding:"12px 14px",fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>{o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"—"}</td>
                  <td style={{padding:"12px 14px",fontSize:13,textAlign:"center"}}>{typeof o.pax==="number"?o.pax:(o.adultQty||0)+(o.child10Qty||0)+(o.child5Qty||0)+(o.child2Qty||0)+(o.infantQty||0)||(o.pax?.adults||0)+(o.pax?.children||0)+(o.pax?.babies||0)||1}</td>
                  <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:"#1e293b",whiteSpace:"nowrap"}}>{(o.totalPrice||o.pricing?.totalRevenue||0).toLocaleString("vi-VN")}₫</td>
                  <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:d>0?"#dc2626":"#16a34a",whiteSpace:"nowrap"}}>{d>0?d.toLocaleString("vi-VN")+"₫":"✓"}</td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{background:sc.bg,color:sc.color,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>
                      {STATUS_LABEL[o.status]||o.status}
                    </span>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <button onClick={e=>{e.stopPropagation();onView(o);}} style={{background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>Xem →</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{textAlign:"right",fontSize:12,color:"#94a3b8",marginTop:8}}>{myOrders.length} đơn</div>
    </div>
  );
}
