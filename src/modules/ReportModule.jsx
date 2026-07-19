import React from "react";
import { downloadCSV } from "../utils/csv.js";

export default function ReportModule({ orders, vouchers, expenses, personalTargets=[], currentRole, hdvList=[], customers=[], userAccounts=[], bookings=[] }){
  const [tab,setTab]=React.useState("overview");
  const [period,setPeriod]=React.useState("month");
  const [customFrom,setCustomFrom]=React.useState("");
  const [customTo,setCustomTo]=React.useState("");

  const now = new Date();
  const thisMonthStr = `${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;

  const fmtM=(n)=>{const a=Math.abs(n||0),s=(n||0)<0?"-":"";if(a>=1e9)return s+(a/1e9).toFixed(1)+"tỷ";return s+Math.round(a).toLocaleString("vi-VN")+"đ";};
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const fmtDate=d=>d?new Date(d).toLocaleDateString("vi-VN"):"—";
  const pct=(a,b)=>b>0?Math.round(a/b*100):0;

  const filterByPeriod=React.useCallback((dateStr)=>{
    if(!dateStr) return false;
    const d=new Date(dateStr);
    if(period==="custom") return customFrom&&customTo?d>=new Date(customFrom)&&d<=new Date(customTo):true;
    if(period==="month") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    if(period==="quarter"){const q=Math.floor(now.getMonth()/3);return Math.floor(d.getMonth()/3)===q&&d.getFullYear()===now.getFullYear();}
    if(period==="year") return d.getFullYear()===now.getFullYear();
    return true;
  },[period,customFrom,customTo]);

  const filterPrev=React.useCallback((dateStr)=>{
    if(!dateStr) return false;
    const d=new Date(dateStr);
    if(period==="month"){const pm=new Date(now.getFullYear(),now.getMonth()-1,1);return d.getMonth()===pm.getMonth()&&d.getFullYear()===pm.getFullYear();}
    if(period==="quarter"){const q=Math.floor(now.getMonth()/3)-1;const py=q<0?now.getFullYear()-1:now.getFullYear();const pq=(q+4)%4;return Math.floor(d.getMonth()/3)===pq&&d.getFullYear()===py;}
    if(period==="year") return d.getFullYear()===now.getFullYear()-1;
    return false;
  },[period]);

  // ── Dữ liệu kỳ này ──────────────────────────────────────
  const closedOrders = orders.filter(o=>o.status==="closed"&&filterByPeriod(o.closedAt||o.departDate));
  const allOrders    = orders.filter(o=>filterByPeriod(o.createdAt));
  const cancelledOrders = allOrders.filter(o=>o.status==="cancelled");
  const approvedVouchers=(vouchers||[]).filter(v=>["approved","confirmed"].includes(v.status)&&filterByPeriod(v.date||v.createdAt));
  const totalRevenue = closedOrders.reduce((s,o)=>s+(o.totalPrice||0),0);
  const totalPaid    = approvedVouchers.filter(v=>v.type==="thu").reduce((s,v)=>s+(v.amount||0),0);
  const totalChi     = approvedVouchers.filter(v=>v.type==="chi").reduce((s,v)=>s+(v.amount||0),0);
  const totalExpPaid = (expenses||[]).filter(e=>e.status==="paid"&&filterByPeriod(e.createdAt)).reduce((s,e)=>s+(e.amount||0),0);
  const totalCost    = totalChi + totalExpPaid;
  const profit       = totalRevenue - totalCost;
  const margin       = totalRevenue>0?profit/totalRevenue*100:0;
  const avgOrderVal  = closedOrders.length>0?totalRevenue/closedOrders.length:0;

  // ── So sánh kỳ trước ─────────────────────────────────────
  const prevRevenue = orders.filter(o=>o.status==="closed"&&filterPrev(o.closedAt||o.departDate)).reduce((s,o)=>s+(o.totalPrice||0),0);
  const revGrowth   = prevRevenue>0?((totalRevenue-prevRevenue)/prevRevenue*100):(totalRevenue>0?100:0);
  const prevOrders  = orders.filter(o=>filterPrev(o.createdAt)).length;
  const orderGrowth = prevOrders>0?((allOrders.length-prevOrders)/prevOrders*100):(allOrders.length>0?100:0);

  // ── 12 tháng trend ───────────────────────────────────────
  const monthlyTrend=React.useMemo(()=>{
    const months=[];
    for(let i=11;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      months.push({label:"T"+(d.getMonth()+1),y:d.getFullYear(),m:d.getMonth(),revenue:0,cost:0,orders:0});
    }
    orders.filter(o=>o.status==="closed").forEach(o=>{
      const dt=o.closedAt||o.departDate; if(!dt) return;
      const d=new Date(dt);
      const slot=months.find(mo=>mo.y===d.getFullYear()&&mo.m===d.getMonth());
      if(slot){slot.revenue+=(o.totalPrice||0);slot.orders++;}
    });
    return months;
  },[orders]);
  const maxTrend=Math.max(...monthlyTrend.map(m=>m.revenue),1);

  // ── Doanh thu theo Sale ───────────────────────────────────
  const saleStats=React.useMemo(()=>{
    const map={};
    closedOrders.forEach(o=>{
      const s=o.sale||"Khác";
      if(!map[s]) map[s]={name:s,revenue:0,orders:0,profit:0,avgVal:0};
      map[s].revenue+=(o.totalPrice||0);
      map[s].orders++;
    });
    return Object.values(map).map(s=>({...s,avgVal:s.orders>0?s.revenue/s.orders:0}))
      .sort((a,b)=>b.revenue-a.revenue);
  },[closedOrders]);
  const maxSaleRev = saleStats[0]?.revenue||1;

  // ── KPI — mọi nhân viên có target hoặc role sale ─────────
  const kpiStats=React.useMemo(()=>{
    return (userAccounts||[]).filter(u=>u.active!==false&&(
      u.role==="sale"||
      (personalTargets||[]).some(t=>(t.name===u.name||t.username===u.username)&&t.month===thisMonthStr&&t.target>0)
    )).map(u=>{
      const target=(personalTargets||[]).find(t=>(t.name===u.name||t.username===u.username)&&t.month===thisMonthStr);
      const rev=closedOrders.filter(o=>o.sale===u.name).reduce((s,o)=>s+(o.totalPrice||0),0);
      const cnt=closedOrders.filter(o=>o.sale===u.name).length;
      const tgt=target?.target||0;
      return{name:u.name,role:u.role,revenue:rev,orders:cnt,target:tgt,pct:tgt>0?Math.min(150,Math.round(rev/tgt*100)):0};
    }).sort((a,b)=>b.pct-a.pct);
  },[closedOrders,userAccounts,personalTargets,thisMonthStr]);

  // ── Theo dịch vụ ─────────────────────────────────────────
  const SVC_LABEL={flight:"Vé máy bay",tour_package:"Tour trọn gói",tour_ghep:"Tour ghép",cruise:"Du thuyền",hotel:"Khách sạn",ticket:"Vé tham quan",combo:"Combo"};
  const serviceStats=React.useMemo(()=>{
    const map={};
    closedOrders.forEach(o=>{
      const k=SVC_LABEL[o.service]||o.service||"Khác";
      if(!map[k]) map[k]={name:k,revenue:0,orders:0};
      map[k].revenue+=(o.totalPrice||0); map[k].orders++;
    });
    return Object.values(map).sort((a,b)=>b.revenue-a.revenue);
  },[closedOrders]);
  const maxSvcRev=serviceStats[0]?.revenue||1;

  // ── Top KH ───────────────────────────────────────────────
  const topCustomers=React.useMemo(()=>{
    const map={};
    closedOrders.forEach(o=>{
      const k=o.customerPhone||o.customerName||"?";
      if(!map[k]) map[k]={name:o.customerName||"—",phone:o.customerPhone||"",revenue:0,orders:0};
      map[k].revenue+=(o.totalPrice||0); map[k].orders++;
    });
    return Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,10);
  },[closedOrders]);

  // ── Công nợ KH ───────────────────────────────────────────
  const debtOrders=orders.filter(o=>!["closed","cancelled"].includes(o.status)).map(o=>({
    ...o, debt:Math.max(0,(o.totalPrice||0)-(o.totalPaid||0))
  })).filter(o=>o.debt>0).sort((a,b)=>b.debt-a.debt);
  const totalDebt=debtOrders.reduce((s,o)=>s+o.debt,0);

  // ── Cash flow 6 tháng ────────────────────────────────────
  const cashFlow=React.useMemo(()=>{
    const months=[];
    for(let i=5;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      months.push({label:"T"+(d.getMonth()+1),y:d.getFullYear(),m:d.getMonth(),thu:0,chi:0});
    }
    (vouchers||[]).filter(v=>["approved","confirmed"].includes(v.status)).forEach(v=>{
      const dt=v.date||v.createdAt; if(!dt) return;
      const d=new Date(dt);
      const slot=months.find(mo=>mo.y===d.getFullYear()&&mo.m===d.getMonth());
      if(slot){if(v.type==="thu") slot.thu+=(v.amount||0);else slot.chi+=(v.amount||0);}
    });
    return months;
  },[vouchers]);
  const maxCF=Math.max(...cashFlow.map(m=>Math.max(m.thu,m.chi)),1);

  // ── Funnel đơn hàng ──────────────────────────────────────
  const funnelTotal=allOrders.length||1;
  const funnel=[
    {label:"Tổng tạo",count:allOrders.length,color:"#2563eb",bg:"#eff6ff"},
    {label:"Đã xác nhận",count:allOrders.filter(o=>["confirmed","in_progress","closed"].includes(o.status)).length,color:"#7c3aed",bg:"#f5f3ff"},
    {label:"Đang chạy",count:allOrders.filter(o=>o.status==="in_progress").length,color:"#d97706",bg:"#fffbeb"},
    {label:"Đã đóng",count:closedOrders.length,color:"#059669",bg:"#ecfdf5"},
    {label:"Hủy",count:cancelledOrders.length,color:"#dc2626",bg:"#fef2f2"},
  ];

  // ── Style helpers ─────────────────────────────────────────
  const card={background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:"0 2px 10px rgba(0,0,0,.07)"};
  const secTitle={fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:14,display:"flex",alignItems:"center",gap:8};
  const Bar=({val,max,color,height=8})=>(
    <div style={{background:"#f1f5f9",borderRadius:99,height,overflow:"hidden"}}>
      <div style={{background:color,height:"100%",borderRadius:99,width:pct(val,max)+"%",transition:"width .5s"}}/>
    </div>
  );

  const TABS=[
    {k:"overview",label:"Tổng quan",icon:"ti-chart-bar"},
    {k:"sales",label:"Nhân viên",icon:"ti-users"},
    {k:"service",label:"Dịch vụ",icon:"ti-package"},
    {k:"customer",label:"Khách hàng",icon:"ti-user-heart"},
    {k:"cashflow",label:"Thu chi",icon:"ti-cash"},
  ];

  return(
    <div style={{padding:24,background:"#f1f5f9",minHeight:"100vh"}}>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#0f172a",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#7c3aed,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className="ti ti-chart-bar" style={{fontSize:22,color:"#fff"}}/>
            </div>
            Báo cáo & Phân tích
          </h2>
          <div style={{fontSize:13,color:"#64748b",marginTop:4,marginLeft:50}}>Dữ liệu kinh doanh · {period==="month"?"Tháng này":period==="quarter"?"Quý này":period==="year"?"Năm nay":period==="custom"?"Tùy chỉnh":"Tất cả"}</div>
        </div>
        {/* Period selector */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["month","Tháng"],["quarter","Quý"],["year","Năm"],["all","Tất cả"],["custom","Tùy chỉnh"]].map(([k,l])=>(
            <button key={k} onClick={()=>setPeriod(k)}
              style={{padding:"8px 16px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:period===k?"linear-gradient(135deg,#7c3aed,#6d28d9)":"#fff",color:period===k?"#fff":"#64748b",boxShadow:period===k?"0 2px 8px rgba(124,58,237,.3)":"0 1px 4px rgba(0,0,0,.06)"}}>
              {l}
            </button>
          ))}
          {period==="custom"&&(
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} style={{border:"1.5px solid #e2e8f0",borderRadius:9,padding:"7px 10px",fontSize:13,outline:"none"}}/>
              <span style={{color:"#94a3b8"}}>→</span>
              <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} style={{border:"1.5px solid #e2e8f0",borderRadius:9,padding:"7px 10px",fontSize:13,outline:"none"}}/>
            </div>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Doanh thu",val:fmtM(totalRevenue)+"₫",sub:period!=="all"?`${revGrowth>=0?"▲":"▼"} ${Math.abs(revGrowth).toFixed(0)}% vs kỳ trước`:closedOrders.length+" đơn đã đóng",subColor:revGrowth>=0?"#059669":"#dc2626",bg:"linear-gradient(135deg,#2563eb,#1d4ed8)",icon:"ti-trending-up"},
          {label:"Lợi nhuận",val:fmtM(profit)+"₫",sub:`Biên: ${margin.toFixed(1)}%`,subColor:"rgba(255,255,255,.7)",bg:profit>=0?"linear-gradient(135deg,#059669,#047857)":"linear-gradient(135deg,#dc2626,#b91c1c)",icon:"ti-chart-pie"},
          {label:"Đơn hàng",val:allOrders.length+" đơn",sub:period!=="all"?`${orderGrowth>=0?"▲":"▼"} ${Math.abs(orderGrowth).toFixed(0)}% vs kỳ trước`:`Chốt: ${closedOrders.length}`,subColor:"rgba(255,255,255,.7)",bg:"linear-gradient(135deg,#7c3aed,#5b21b6)",icon:"ti-file-text"},
          {label:"GT trung bình",val:fmtM(avgOrderVal)+"₫",sub:`${closedOrders.length} đơn đã đóng`,subColor:"rgba(255,255,255,.7)",bg:"linear-gradient(135deg,#d97706,#b45309)",icon:"ti-coin"},
        ].map(k=>(
          <div key={k.label} style={{background:k.bg,borderRadius:14,padding:"18px 22px",boxShadow:"0 4px 14px rgba(0,0,0,.13)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:16,top:14,fontSize:30,opacity:.2}}><i className={`ti ${k.icon}`}/></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.75)",fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>{k.label}</div>
            <div style={{fontSize:24,fontWeight:800,color:"#fff",lineHeight:1,marginBottom:4}}>{k.val}</div>
            <div style={{fontSize:12,color:k.subColor||"rgba(255,255,255,.65)",fontWeight:500}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:4,background:"#fff",borderRadius:14,padding:6,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",width:"fit-content"}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            style={{padding:"10px 18px",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:6,background:tab===t.k?"linear-gradient(135deg,#7c3aed,#6d28d9)":"transparent",color:tab===t.k?"#fff":"#64748b",transition:"all .15s"}}>
            <i className={`ti ${t.icon}`} style={{fontSize:16}}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: TỔNG QUAN ── */}
      {tab==="overview"&&(
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)",gap:16,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* Trend 12 tháng */}
            <div style={card}>
              <div style={secTitle}><i className="ti ti-chart-line" style={{color:"#7c3aed",fontSize:18}}/>Xu hướng doanh thu 12 tháng</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120}}>
                {monthlyTrend.map((mo,i)=>{
                  const h=Math.max(4,Math.round((mo.revenue/maxTrend)*100));
                  const isLast=i===monthlyTrend.length-1;
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      {mo.revenue>0&&<div style={{fontSize:9,color:isLast?"#7c3aed":"#94a3b8",fontWeight:700}}>{fmtM(mo.revenue)}</div>}
                      <div style={{width:"80%",height:h,borderRadius:"4px 4px 0 0",background:isLast?"linear-gradient(180deg,#7c3aed,#5b21b6)":"linear-gradient(180deg,#c4b5fd,#a78bfa)",transition:"height .4s"}}/>
                      <div style={{fontSize:10,color:isLast?"#7c3aed":"#94a3b8",fontWeight:isLast?700:400}}>{mo.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Funnel đơn hàng */}
            <div style={card}>
              <div style={secTitle}><i className="ti ti-filter" style={{color:"#2563eb",fontSize:18}}/>Phễu đơn hàng</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {funnel.map(f=>(
                  <div key={f.label}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>{f.label}</span>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:13,fontWeight:700,color:f.color}}>{f.count} đơn</span>
                        <span style={{fontSize:11,background:f.bg,color:f.color,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{pct(f.count,funnelTotal)}%</span>
                      </div>
                    </div>
                    <Bar val={f.count} max={funnelTotal} color={f.color} height={8}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash flow */}
            <div style={card}>
              <div style={secTitle}><i className="ti ti-arrows-exchange" style={{color:"#059669",fontSize:18}}/>Dòng tiền 6 tháng</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100,marginBottom:8}}>
                {cashFlow.map((mo,i)=>(
                  <div key={i} style={{flex:1,display:"flex",alignItems:"flex-end",gap:2,height:"100%"}}>
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:"100%",height:Math.max(3,Math.round(mo.thu/maxCF*90)),background:"linear-gradient(180deg,#059669,#047857)",borderRadius:"3px 3px 0 0"}}/>
                    </div>
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:"100%",height:Math.max(3,Math.round(mo.chi/maxCF*90)),background:"linear-gradient(180deg,#dc2626,#b91c1c)",borderRadius:"3px 3px 0 0"}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:4,justifyContent:"space-between",marginBottom:8}}>
                {cashFlow.map((mo,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:10,color:"#94a3b8",fontWeight:600}}>{mo.label}</div>)}
              </div>
              <div style={{display:"flex",gap:16,fontSize:12,color:"#64748b"}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#059669",display:"inline-block"}}/>Thu vào</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#dc2626",display:"inline-block"}}/>Chi ra</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Công nợ */}
            <div style={card}>
              <div style={secTitle}><i className="ti ti-credit-card" style={{color:"#dc2626",fontSize:18}}/>Công nợ KH ({debtOrders.length})</div>
              <div style={{fontSize:20,fontWeight:800,color:"#dc2626",marginBottom:4}}>{fmtMoney(totalDebt)}</div>
              <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>Tổng công nợ chưa thu</div>
              {debtOrders.slice(0,6).map((o,i)=>(
                <div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<Math.min(5,debtOrders.length-1)?"1px solid #f8fafc":"none"}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.customerName||"—"}</div>
                    <div style={{fontSize:11,color:"#64748b"}}>{o.id}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:"#dc2626",flexShrink:0,marginLeft:8}}>{fmtM(o.debt)}₫</div>
                </div>
              ))}
              {debtOrders.length===0&&<div style={{textAlign:"center",padding:"16px 0",color:"#059669",fontWeight:600,fontSize:13}}>✓ Không có công nợ</div>}
            </div>

            {/* Tỷ lệ dịch vụ */}
            <div style={card}>
              <div style={secTitle}><i className="ti ti-chart-donut" style={{color:"#d97706",fontSize:18}}/>Cơ cấu dịch vụ</div>
              {serviceStats.slice(0,5).map((s,i)=>(
                <div key={s.name} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600,color:"#374151"}}>{s.name}</span>
                    <span style={{fontSize:12,color:"#64748b"}}>{pct(s.revenue,totalRevenue||1)}%</span>
                  </div>
                  <Bar val={s.revenue} max={maxSvcRev} color={["#2563eb","#7c3aed","#059669","#d97706","#dc2626"][i]} height={6}/>
                </div>
              ))}
              {serviceStats.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:16,fontSize:13}}>Không có dữ liệu</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: NHÂN VIÊN ── */}
      {tab==="sales"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* Ranking doanh thu */}
          <div style={card}>
            <div style={secTitle}><i className="ti ti-trophy" style={{color:"#d97706",fontSize:18}}/>Ranking doanh thu</div>
            {saleStats.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:32}}>Không có dữ liệu</div>}
            {saleStats.map((s,i)=>(
              <div key={s.name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<saleStats.length-1?"1px solid #f8fafc":"none"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#92400e":"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:i<3?"#fff":"#64748b",flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{s.name}</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{s.orders} đơn · GT TB: {fmtM(s.avgVal)}₫</div>
                  <div style={{marginTop:6}}>
                    <Bar val={s.revenue} max={maxSaleRev} color={i===0?"#f59e0b":i===1?"#7c3aed":"#2563eb"} height={6}/>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:800,fontSize:15,color:"#2563eb"}}>{fmtM(s.revenue)}₫</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{pct(s.revenue,totalRevenue||1)}% tổng</div>
                </div>
              </div>
            ))}
          </div>
          {/* KPI tháng này */}
          <div style={card}>
            <div style={secTitle}><i className="ti ti-target" style={{color:"#059669",fontSize:18}}/>KPI tháng {thisMonthStr}</div>
            {kpiStats.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:32}}>Chưa có dữ liệu KPI</div>}
            {kpiStats.map((u,i)=>(
              <div key={u.name} style={{padding:"12px 0",borderBottom:i<kpiStats.length-1?"1px solid #f8fafc":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{u.name}</div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:1}}>{fmtM(u.revenue)}₫ / {fmtM(u.target)||"Chưa set"}₫</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:800,fontSize:18,color:u.pct>=100?"#059669":u.pct>=70?"#d97706":"#dc2626"}}>{u.pct}%</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>{u.orders} đơn</div>
                  </div>
                </div>
                <div style={{background:"#f1f5f9",borderRadius:99,height:8,overflow:"hidden"}}>
                  <div style={{width:Math.min(100,u.pct)+"%",height:8,borderRadius:99,background:u.pct>=100?"linear-gradient(90deg,#059669,#34d399)":u.pct>=70?"linear-gradient(90deg,#d97706,#fbbf24)":"linear-gradient(90deg,#dc2626,#f87171)",transition:"width .5s"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: DỊCH VỤ ── */}
      {tab==="service"&&(
        <div style={card}>
          <div style={secTitle}><i className="ti ti-package" style={{color:"#2563eb",fontSize:18}}/>Phân tích theo loại dịch vụ</div>
          {serviceStats.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48}}>Không có dữ liệu</div>}
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"#f8fafc"}}>
                {["Dịch vụ","Số đơn","Doanh thu","Tỷ trọng","Biểu đồ"].map(h=>(
                  <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid #f1f5f9"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serviceStats.map((s,i)=>(
                <tr key={s.name} style={{borderBottom:"1px solid #f8fafc"}}>
                  <td style={{padding:"12px 14px",fontWeight:700,fontSize:14,color:"#0f172a"}}>{s.name}</td>
                  <td style={{padding:"12px 14px",fontSize:13,color:"#374151"}}>{s.orders} đơn</td>
                  <td style={{padding:"12px 14px",fontWeight:700,fontSize:14,color:"#2563eb"}}>{fmtMoney(s.revenue)}</td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{background:"#eff6ff",color:"#2563eb",borderRadius:99,fontSize:12,padding:"3px 10px",fontWeight:700}}>{pct(s.revenue,totalRevenue||1)}%</span>
                  </td>
                  <td style={{padding:"12px 14px",width:"30%"}}>
                    <Bar val={s.revenue} max={maxSvcRev} color={["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#ec4899"][i%7]} height={8}/>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:"#f0f4ff"}}>
                <td style={{padding:"12px 14px",fontWeight:700,fontSize:14,color:"#1e40af"}}>Tổng cộng</td>
                <td style={{padding:"12px 14px",fontWeight:700,color:"#1e40af"}}>{closedOrders.length} đơn</td>
                <td style={{padding:"12px 14px",fontWeight:800,fontSize:15,color:"#1e40af"}}>{fmtMoney(totalRevenue)}</td>
                <td style={{padding:"12px 14px",fontWeight:700,color:"#1e40af"}}>100%</td>
                <td/>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── TAB: KHÁCH HÀNG ── */}
      {tab==="customer"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={card}>
            <div style={secTitle}><i className="ti ti-crown" style={{color:"#d97706",fontSize:18}}/>Top 10 khách hàng</div>
            {topCustomers.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:32}}>Không có dữ liệu</div>}
            {topCustomers.map((c,i)=>(
              <div key={c.phone||c.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<topCustomers.length-1?"1px solid #f8fafc":"none"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#92400e":"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:i<3?"#fff":"#64748b",flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{c.phone} · {c.orders} đơn</div>
                </div>
                <div style={{fontWeight:800,fontSize:14,color:"#d97706",flexShrink:0}}>{fmtM(c.revenue)}₫</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={secTitle}><i className="ti ti-users" style={{color:"#2563eb",fontSize:18}}/>Thống kê khách hàng</div>
            {[
              {label:"Tổng KH trong hệ thống",val:customers.length,color:"#2563eb"},
              {label:"KH tạo kỳ này",val:customers.filter(c=>filterByPeriod(c.createdAt||c.firstOrderDate)).length,color:"#059669"},
              {label:"KH có đơn kỳ này",val:new Set(allOrders.map(o=>o.customerPhone||o.customerName).filter(Boolean)).size,color:"#7c3aed"},
              {label:"KH mua lại (≥2 đơn)",val:Object.values(Object.fromEntries(orders.map(o=>[o.customerPhone||o.customerName,[]]))).filter(a=>a.length>=2).length||topCustomers.filter(c=>c.orders>=2).length,color:"#d97706"},
              {label:"Giá trị đơn TB",val:fmtMoney(avgOrderVal),color:"#0891b2",isString:true},
              {label:"Tỷ lệ chốt đơn",val:pct(closedOrders.length,allOrders.length||1)+"%",color:"#059669",isString:true},
            ].map(k=>(
              <div key={k.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #f8fafc"}}>
                <span style={{fontSize:13,color:"#374151",fontWeight:500}}>{k.label}</span>
                <span style={{fontSize:16,fontWeight:800,color:k.color}}>{k.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: THU CHI ── */}
      {tab==="cashflow"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={card}>
            <div style={secTitle}><i className="ti ti-receipt" style={{color:"#059669",fontSize:18}}/>Tổng hợp thu chi</div>
            {[
              {label:"Tổng thu (phiếu thu duyệt)",val:totalPaid,color:"#059669",icon:"ti-arrow-down-circle"},
              {label:"Tổng chi (phiếu chi + NCC)",val:totalCost,color:"#dc2626",icon:"ti-arrow-up-circle"},
              {label:"Thực thu thuần",val:totalPaid-totalCost,color:totalPaid-totalCost>=0?"#2563eb":"#dc2626",icon:"ti-equal"},
              {label:"Doanh thu (đơn đã đóng)",val:totalRevenue,color:"#7c3aed",icon:"ti-chart-bar"},
              {label:"Lợi nhuận ước tính",val:profit,color:profit>=0?"#059669":"#dc2626",icon:"ti-trending-up"},
            ].map(k=>(
              <div key={k.label} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #f8fafc"}}>
                <div style={{width:36,height:36,borderRadius:10,background:k.color+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <i className={`ti ${k.icon}`} style={{fontSize:18,color:k.color}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:"#64748b",fontWeight:600}}>{k.label}</div>
                  <div style={{fontSize:18,fontWeight:800,color:k.color,marginTop:2}}>{fmtMoney(k.val)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{...secTitle,margin:0}}><i className="ti ti-list-details" style={{color:"#7c3aed",fontSize:18}}/>Chi tiết phiếu thu kỳ này</div>
              <button onClick={()=>downloadCSV(approvedVouchers.filter(v=>v.type==="thu").map(v=>({Mã_phiếu:v.id,Khách_hàng:v.customerName||"",Đơn_hàng:v.orderId||"",Ngày:v.date?new Date(v.date).toLocaleDateString("vi-VN"):"",Số_tiền:v.amount||0,Hình_thức:v.method==="cash"?"Tiền mặt":"Chuyển khoản",Ghi_chú:v.note||""})),"phieu-thu-ky-nay.csv")} style={{background:"#7c3aed",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>📊 Xuất CSV</button>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"#f8fafc"}}>
                  {["Mã phiếu","Khách hàng","Số tiền","Trạng thái"].map(h=>(
                    <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",borderBottom:"1px solid #f1f5f9"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvedVouchers.filter(v=>v.type==="thu").slice(0,10).map((v,i)=>(
                  <tr key={v.id} style={{borderBottom:"1px solid #f8fafc",background:i%2===0?"#fff":"#fafafa"}}>
                    <td style={{padding:"8px 12px",fontWeight:600,color:"#2563eb"}}>{v.id}</td>
                    <td style={{padding:"8px 12px",color:"#374151"}}>{v.customerName||"—"}</td>
                    <td style={{padding:"8px 12px",fontWeight:700,color:"#059669"}}>{fmtMoney(v.amount)}</td>
                    <td style={{padding:"8px 12px"}}><span style={{background:"#ecfdf5",color:"#059669",borderRadius:99,fontSize:11,padding:"2px 8px",fontWeight:600}}>✓ Duyệt</span></td>
                  </tr>
                ))}
                {approvedVouchers.filter(v=>v.type==="thu").length===0&&(
                  <tr><td colSpan={4} style={{textAlign:"center",padding:"24px",color:"#94a3b8"}}>Không có phiếu thu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
