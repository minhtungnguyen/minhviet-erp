import React from "react";
import { ORDER_STATUS } from "../constants/statuses.js";
import { StatCard, SearchInp, Sel, Btn, SBadge, PageHeader, EmptyState } from "../components/ui.jsx";

export default function OrderList({orders,vouchers,onView,onCreate,onQuickSale,currentRole,currentUser}){
  const [search,setSearch]=React.useState("");
  const [filterStatus,setFilterStatus]=React.useState("all");
  const [sortBy,setSortBy]=React.useState("newest");

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

  const th = { padding:"11px 14px", textAlign:"left", fontSize:"var(--text-xs)", fontWeight:700, color:"var(--c-text-3)", textTransform:"uppercase", letterSpacing:"0.4px", whiteSpace:"nowrap", borderBottom:"1px solid var(--c-border)" };
  const td = { padding:"12px 14px", borderBottom:"1px solid var(--c-border)", fontSize:"var(--text-base)" };

  return(
    <div style={{padding:"var(--sp-6)"}}>
      <PageHeader
        title="Đơn hàng"
        subtitle={`${summary.total} đơn ${currentRole==="sale"?"của bạn":"trong hệ thống"}`}
        actions={<>
          {onQuickSale&&<Btn variant="secondary" onClick={onQuickSale}><i className="ti ti-bolt" style={{fontSize:14}}/> Bán nhanh</Btn>}
          <Btn onClick={onCreate}><i className="ti ti-plus" style={{fontSize:14}}/> Tạo đơn</Btn>
        </>}
      />

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"var(--sp-3)",marginBottom:"var(--sp-5)"}}>
        <StatCard label="Tổng đơn"   value={summary.total}         icon={<i className="ti ti-file-text"/>}       color="var(--c-primary-mid)"/>
        <StatCard label="Chờ thu"    value={summary.pending}       icon={<i className="ti ti-clock"/>}           color="var(--c-warning-mid)"/>
        <StatCard label="Đang chạy"  value={summary.active}        icon={<i className="ti ti-route"/>}           color="var(--c-success-mid)"/>
        <StatCard label="Doanh thu"  value={fmtM(summary.revenue)+"₫"} icon={<i className="ti ti-report-money"/>} color="var(--c-accent)"/>
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",gap:"var(--sp-2)",marginBottom:"var(--sp-4)",flexWrap:"wrap"}}>
        <SearchInp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm mã đơn, tên khách, SĐT, tour..." style={{flex:1,minWidth:220}}/>
        <Sel value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:180}}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </Sel>
        <Sel value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{width:180}}>
          <option value="newest">Mới nhất</option>
          <option value="depart">Ngày đi gần nhất</option>
          <option value="value">Giá trị cao nhất</option>
        </Sel>
      </div>

      {/* Table */}
      <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",border:"1px solid var(--c-border)",boxShadow:"var(--sh-xs)",overflow:"hidden"}}>
        {myOrders.length===0 ? (
          <EmptyState icon="🧳" title={search||filterStatus!=="all"?"Không có đơn nào khớp điều kiện lọc":"Chưa có đơn hàng nào"}
            desc={!(search||filterStatus!=="all")?"Bấm \"Tạo đơn\" để bắt đầu đơn hàng đầu tiên.":undefined}/>
        ) : (
        <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"var(--c-surface-2)"}}>
              {["Mã đơn","Khách hàng","Tour / Dịch vụ","Ngày đi","Pax","Giá bán","Còn nợ","Trạng thái",""].map(h=>(
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myOrders.map(o=>{
              const d=debt(o);
              return(
                <tr key={o.id} style={{cursor:"pointer",transition:"background var(--t-fast)"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--c-primary-xpale)"}
                  onMouseLeave={e=>e.currentTarget.style.background=""}
                  onClick={()=>onView(o)}>
                  <td style={td}>
                    <div style={{fontWeight:700,fontSize:"var(--text-base)",color:"var(--c-primary-mid)"}}>{o.id}</div>
                    <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)"}}>{o.sale}</div>
                  </td>
                  <td style={td}>
                    <div style={{fontWeight:600}}>{o.customerName||(o.customer?.name)||"—"}</div>
                    <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)"}}>{o.customerPhone||(o.customer?.phone)||""}</div>
                  </td>
                  <td style={{...td,maxWidth:180}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.serviceName||o.tourName||o.service||"—"}</div>
                  </td>
                  <td style={{...td,color:"var(--c-text-3)",whiteSpace:"nowrap"}}>{o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"—"}</td>
                  <td style={{...td,textAlign:"center"}}>{typeof o.pax==="number"?o.pax:(o.adultQty||0)+(o.child10Qty||0)+(o.child5Qty||0)+(o.child2Qty||0)+(o.infantQty||0)||(o.pax?.adults||0)+(o.pax?.children||0)+(o.pax?.babies||0)||1}</td>
                  <td style={{...td,fontWeight:700,color:"var(--c-text)",whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"}}>{(o.totalPrice||o.pricing?.totalRevenue||0).toLocaleString("vi-VN")}₫</td>
                  <td style={{...td,fontWeight:700,color:d>0?"var(--c-danger-mid)":"var(--c-success-mid)",whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"}}>{d>0?d.toLocaleString("vi-VN")+"₫":"✓"}</td>
                  <td style={td}>
                    <SBadge status={o.status} cfg={ORDER_STATUS}/>
                  </td>
                  <td style={td}>
                    <Btn size="xs" variant="secondary" onClick={e=>{e.stopPropagation();onView(o);}}>Xem →</Btn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        )}
      </div>
      <div style={{textAlign:"right",fontSize:"var(--text-xs)",color:"var(--c-text-muted)",marginTop:"var(--sp-2)"}}>{myOrders.length} đơn</div>
    </div>
  );
}
