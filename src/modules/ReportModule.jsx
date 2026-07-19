import React from "react";
import { downloadCSV } from "../utils/csv.js";
import { Btn } from "../components/ui.jsx";

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
    {label:"Tổng tạo",count:allOrders.length,color:"var(--c-primary-mid)",bg:"var(--c-primary-light)"},
    {label:"Đã xác nhận",count:allOrders.filter(o=>["confirmed","in_progress","closed"].includes(o.status)).length,color:"var(--c-purple)",bg:"var(--c-purple-bg)"},
    {label:"Đang chạy",count:allOrders.filter(o=>o.status==="in_progress").length,color:"var(--c-warning-mid)",bg:"var(--c-warning-bg)"},
    {label:"Đã đóng",count:closedOrders.length,color:"var(--c-success-mid)",bg:"var(--c-success-bg)"},
    {label:"Hủy",count:cancelledOrders.length,color:"var(--c-danger-mid)",bg:"var(--c-danger-bg)"},
  ];

  // ── Style helpers ─────────────────────────────────────────
  const card={background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:"18px 20px",boxShadow:"var(--sh-sm)"};
  const secTitle={fontWeight:700,fontSize:"var(--text-lg)",color:"var(--c-text)",marginBottom:14,display:"flex",alignItems:"center",gap:8};
  const Bar=({val,max,color,height=8})=>(
    <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-pill)",height,overflow:"hidden"}}>
      <div style={{background:color,height:"100%",borderRadius:"var(--r-pill)",width:pct(val,max)+"%",transition:"width .5s"}}/>
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
    <div style={{padding:24,background:"var(--c-bg)",minHeight:"100vh"}}>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:"var(--text-2xl)",fontWeight:800,color:"var(--c-text)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:"var(--r-md)",background:"linear-gradient(135deg,var(--c-purple),#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className="ti ti-chart-bar" style={{fontSize:22,color:"#fff"}}/>
            </div>
            Báo cáo & Phân tích
          </h2>
          <div style={{fontSize:"var(--text-base)",color:"var(--c-text-3)",marginTop:4,marginLeft:50}}>Dữ liệu kinh doanh · {period==="month"?"Tháng này":period==="quarter"?"Quý này":period==="year"?"Năm nay":period==="custom"?"Tùy chỉnh":"Tất cả"}</div>
        </div>
        {/* Period selector */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["month","Tháng"],["quarter","Quý"],["year","Năm"],["all","Tất cả"],["custom","Tùy chỉnh"]].map(([k,l])=>(
            <button key={k} onClick={()=>setPeriod(k)}
              style={{padding:"8px 16px",borderRadius:"var(--r-md)",border:"none",cursor:"pointer",fontWeight:600,fontSize:"var(--text-base)",background:period===k?"linear-gradient(135deg,var(--c-purple),#6d28d9)":"var(--c-surface)",color:period===k?"#fff":"var(--c-text-3)",boxShadow:period===k?"0 2px 8px rgba(124,58,237,.3)":"var(--sh-xs)"}}>
              {l}
            </button>
          ))}
          {period==="custom"&&(
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} style={{border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-md)",padding:"7px 10px",fontSize:"var(--text-base)",outline:"none"}}/>
              <span style={{color:"var(--c-text-muted)"}}>→</span>
              <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} style={{border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-md)",padding:"7px 10px",fontSize:"var(--text-base)",outline:"none"}}/>
            </div>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Doanh thu",val:fmtM(totalRevenue)+"₫",sub:period!=="all"?`${revGrowth>=0?"▲":"▼"} ${Math.abs(revGrowth).toFixed(0)}% vs kỳ trước`:closedOrders.length+" đơn đã đóng",subColor:revGrowth>=0?"#a7f3d0":"#fecaca",bg:"linear-gradient(135deg,var(--c-primary-mid),var(--c-primary-hover))",icon:"ti-trending-up"},
          {label:"Lợi nhuận",val:fmtM(profit)+"₫",sub:`Biên: ${margin.toFixed(1)}%`,subColor:"rgba(255,255,255,.7)",bg:profit>=0?"linear-gradient(135deg,var(--c-success-mid),#047857)":"linear-gradient(135deg,var(--c-danger-mid),#b91c1c)",icon:"ti-chart-pie"},
          {label:"Đơn hàng",val:allOrders.length+" đơn",sub:period!=="all"?`${orderGrowth>=0?"▲":"▼"} ${Math.abs(orderGrowth).toFixed(0)}% vs kỳ trước`:`Chốt: ${closedOrders.length}`,subColor:"rgba(255,255,255,.7)",bg:"linear-gradient(135deg,var(--c-purple),#5b21b6)",icon:"ti-file-text"},
          {label:"GT trung bình",val:fmtM(avgOrderVal)+"₫",sub:`${closedOrders.length} đơn đã đóng`,subColor:"rgba(255,255,255,.7)",bg:"linear-gradient(135deg,var(--c-warning-mid),#b45309)",icon:"ti-coin"},
        ].map(k=>(
          <div key={k.label} style={{background:k.bg,borderRadius:"var(--r-lg)",padding:"18px 22px",boxShadow:"var(--sh-md)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:16,top:14,fontSize:30,opacity:.2}}><i className={`ti ${k.icon}`}/></div>
            <div style={{fontSize:"var(--text-sm)",color:"rgba(255,255,255,.75)",fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>{k.label}</div>
            <div style={{fontSize:"var(--text-2xl)",fontWeight:800,color:"#fff",lineHeight:1,marginBottom:4}}>{k.val}</div>
            <div style={{fontSize:"var(--text-sm)",color:k.subColor||"rgba(255,255,255,.65)",fontWeight:500}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:4,background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:6,marginBottom:20,boxShadow:"var(--sh-sm)",width:"fit-content"}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            style={{padding:"10px 18px",border:"none",borderRadius:"var(--r-md)",cursor:"pointer",fontWeight:600,fontSize:"var(--text-base)",display:"flex",alignItems:"center",gap:6,background:tab===t.k?"linear-gradient(135deg,var(--c-purple),#6d28d9)":"transparent",color:tab===t.k?"#fff":"var(--c-text-3)",transition:"all .15s"}}>
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
              <div style={secTitle}><i className="ti ti-chart-line" style={{color:"var(--c-purple)",fontSize:18}}/>Xu hướng doanh thu 12 tháng</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120}}>
                {monthlyTrend.map((mo,i)=>{
                  const h=Math.max(4,Math.round((mo.revenue/maxTrend)*100));
                  const isLast=i===monthlyTrend.length-1;
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      {mo.revenue>0&&<div style={{fontSize:9,color:isLast?"var(--c-purple)":"var(--c-text-muted)",fontWeight:700}}>{fmtM(mo.revenue)}</div>}
                      <div style={{width:"80%",height:h,borderRadius:"4px 4px 0 0",background:isLast?"linear-gradient(180deg,var(--c-purple),#5b21b6)":"linear-gradient(180deg,var(--c-purple-border),#a78bfa)",transition:"height .4s"}}/>
                      <div style={{fontSize:10,color:isLast?"var(--c-purple)":"var(--c-text-muted)",fontWeight:isLast?700:400}}>{mo.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Funnel đơn hàng */}
            <div style={card}>
              <div style={secTitle}><i className="ti ti-filter" style={{color:"var(--c-primary-mid)",fontSize:18}}/>Phễu đơn hàng</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {funnel.map(f=>(
                  <div key={f.label}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:"var(--text-base)",fontWeight:600,color:"var(--c-text-2)"}}>{f.label}</span>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:"var(--text-base)",fontWeight:700,color:f.color}}>{f.count} đơn</span>
                        <span style={{fontSize:"var(--text-xs)",background:f.bg,color:f.color,padding:"2px 8px",borderRadius:"var(--r-pill)",fontWeight:600}}>{pct(f.count,funnelTotal)}%</span>
                      </div>
                    </div>
                    <Bar val={f.count} max={funnelTotal} color={f.color} height={8}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash flow */}
            <div style={card}>
              <div style={secTitle}><i className="ti ti-arrows-exchange" style={{color:"var(--c-success-mid)",fontSize:18}}/>Dòng tiền 6 tháng</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100,marginBottom:8}}>
                {cashFlow.map((mo,i)=>(
                  <div key={i} style={{flex:1,display:"flex",alignItems:"flex-end",gap:2,height:"100%"}}>
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:"100%",height:Math.max(3,Math.round(mo.thu/maxCF*90)),background:"linear-gradient(180deg,var(--c-success-mid),#047857)",borderRadius:"3px 3px 0 0"}}/>
                    </div>
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:"100%",height:Math.max(3,Math.round(mo.chi/maxCF*90)),background:"linear-gradient(180deg,var(--c-danger-mid),#b91c1c)",borderRadius:"3px 3px 0 0"}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:4,justifyContent:"space-between",marginBottom:8}}>
                {cashFlow.map((mo,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:10,color:"var(--c-text-muted)",fontWeight:600}}>{mo.label}</div>)}
              </div>
              <div style={{display:"flex",gap:16,fontSize:"var(--text-sm)",color:"var(--c-text-3)"}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"var(--c-success-mid)",display:"inline-block"}}/>Thu vào</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"var(--c-danger-mid)",display:"inline-block"}}/>Chi ra</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Công nợ */}
            <div style={card}>
              <div style={secTitle}><i className="ti ti-credit-card" style={{color:"var(--c-danger-mid)",fontSize:18}}/>Công nợ KH ({debtOrders.length})</div>
              <div style={{fontSize:"var(--text-xl)",fontWeight:800,color:"var(--c-danger-mid)",marginBottom:4}}>{fmtMoney(totalDebt)}</div>
              <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)",marginBottom:14}}>Tổng công nợ chưa thu</div>
              {debtOrders.slice(0,6).map((o,i)=>(
                <div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<Math.min(5,debtOrders.length-1)?"1px solid var(--c-border)":"none"}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:"var(--text-base)",fontWeight:600,color:"var(--c-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.customerName||"—"}</div>
                    <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>{o.id}</div>
                  </div>
                  <div style={{fontSize:"var(--text-base)",fontWeight:700,color:"var(--c-danger-mid)",flexShrink:0,marginLeft:8}}>{fmtM(o.debt)}₫</div>
                </div>
              ))}
              {debtOrders.length===0&&<div style={{textAlign:"center",padding:"16px 0",color:"var(--c-success-mid)",fontWeight:600,fontSize:"var(--text-base)"}}>✓ Không có công nợ</div>}
            </div>

            {/* Tỷ lệ dịch vụ */}
            <div style={card}>
              <div style={secTitle}><i className="ti ti-chart-donut" style={{color:"var(--c-warning-mid)",fontSize:18}}/>Cơ cấu dịch vụ</div>
              {serviceStats.slice(0,5).map((s,i)=>(
                <div key={s.name} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:"var(--text-sm)",fontWeight:600,color:"var(--c-text-2)"}}>{s.name}</span>
                    <span style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)"}}>{pct(s.revenue,totalRevenue||1)}%</span>
                  </div>
                  <Bar val={s.revenue} max={maxSvcRev} color={["var(--c-primary-mid)","var(--c-purple)","var(--c-success-mid)","var(--c-warning-mid)","var(--c-danger-mid)"][i]} height={6}/>
                </div>
              ))}
              {serviceStats.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:16,fontSize:"var(--text-base)"}}>Không có dữ liệu</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: NHÂN VIÊN ── */}
      {tab==="sales"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* Ranking doanh thu */}
          <div style={card}>
            <div style={secTitle}><i className="ti ti-trophy" style={{color:"var(--c-warning-mid)",fontSize:18}}/>Ranking doanh thu</div>
            {saleStats.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:32}}>Không có dữ liệu</div>}
            {saleStats.map((s,i)=>(
              <div key={s.name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<saleStats.length-1?"1px solid var(--c-border)":"none"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:i===0?"#f59e0b":i===1?"var(--c-text-muted)":i===2?"var(--c-warning)":"var(--c-border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"var(--text-base)",fontWeight:800,color:i<3?"#fff":"var(--c-text-3)",flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:"var(--text-md)",color:"var(--c-text)"}}>{s.name}</div>
                  <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)",marginTop:2}}>{s.orders} đơn · GT TB: {fmtM(s.avgVal)}₫</div>
                  <div style={{marginTop:6}}>
                    <Bar val={s.revenue} max={maxSaleRev} color={i===0?"#f59e0b":i===1?"var(--c-purple)":"var(--c-primary-mid)"} height={6}/>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:800,fontSize:"var(--text-lg)",color:"var(--c-primary-mid)"}}>{fmtM(s.revenue)}₫</div>
                  <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>{pct(s.revenue,totalRevenue||1)}% tổng</div>
                </div>
              </div>
            ))}
          </div>
          {/* KPI tháng này */}
          <div style={card}>
            <div style={secTitle}><i className="ti ti-target" style={{color:"var(--c-success-mid)",fontSize:18}}/>KPI tháng {thisMonthStr}</div>
            {kpiStats.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:32}}>Chưa có dữ liệu KPI</div>}
            {kpiStats.map((u,i)=>(
              <div key={u.name} style={{padding:"12px 0",borderBottom:i<kpiStats.length-1?"1px solid var(--c-border)":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:"var(--text-md)",color:"var(--c-text)"}}>{u.name}</div>
                    <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)",marginTop:1}}>{fmtM(u.revenue)}₫ / {fmtM(u.target)||"Chưa set"}₫</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:800,fontSize:"var(--text-xl)",color:u.pct>=100?"var(--c-success-mid)":u.pct>=70?"var(--c-warning-mid)":"var(--c-danger-mid)"}}>{u.pct}%</div>
                    <div style={{fontSize:10,color:"var(--c-text-muted)"}}>{u.orders} đơn</div>
                  </div>
                </div>
                <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-pill)",height:8,overflow:"hidden"}}>
                  <div style={{width:Math.min(100,u.pct)+"%",height:8,borderRadius:"var(--r-pill)",background:u.pct>=100?"linear-gradient(90deg,var(--c-success-mid),#34d399)":u.pct>=70?"linear-gradient(90deg,var(--c-warning-mid),#fbbf24)":"linear-gradient(90deg,var(--c-danger-mid),#f87171)",transition:"width .5s"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: DỊCH VỤ ── */}
      {tab==="service"&&(
        <div style={card}>
          <div style={secTitle}><i className="ti ti-package" style={{color:"var(--c-primary-mid)",fontSize:18}}/>Phân tích theo loại dịch vụ</div>
          {serviceStats.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:48}}>Không có dữ liệu</div>}
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"var(--c-surface-2)"}}>
                {["Dịch vụ","Số đơn","Doanh thu","Tỷ trọng","Biểu đồ"].map(h=>(
                  <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:"var(--text-sm)",fontWeight:700,color:"var(--c-text-3)",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid var(--c-border)"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serviceStats.map((s,i)=>(
                <tr key={s.name} style={{borderBottom:"1px solid var(--c-border)"}}>
                  <td style={{padding:"12px 14px",fontWeight:700,fontSize:"var(--text-md)",color:"var(--c-text)"}}>{s.name}</td>
                  <td style={{padding:"12px 14px",fontSize:"var(--text-base)",color:"var(--c-text-2)"}}>{s.orders} đơn</td>
                  <td style={{padding:"12px 14px",fontWeight:700,fontSize:"var(--text-md)",color:"var(--c-primary-mid)"}}>{fmtMoney(s.revenue)}</td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",borderRadius:"var(--r-pill)",fontSize:"var(--text-sm)",padding:"3px 10px",fontWeight:700}}>{pct(s.revenue,totalRevenue||1)}%</span>
                  </td>
                  <td style={{padding:"12px 14px",width:"30%"}}>
                    <Bar val={s.revenue} max={maxSvcRev} color={["var(--c-primary-mid)","var(--c-purple)","var(--c-success-mid)","var(--c-warning-mid)","var(--c-danger-mid)","var(--c-info)","#ec4899"][i%7]} height={8}/>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:"var(--c-primary-light)"}}>
                <td style={{padding:"12px 14px",fontWeight:700,fontSize:"var(--text-md)",color:"var(--c-primary-hover)"}}>Tổng cộng</td>
                <td style={{padding:"12px 14px",fontWeight:700,color:"var(--c-primary-hover)"}}>{closedOrders.length} đơn</td>
                <td style={{padding:"12px 14px",fontWeight:800,fontSize:"var(--text-lg)",color:"var(--c-primary-hover)"}}>{fmtMoney(totalRevenue)}</td>
                <td style={{padding:"12px 14px",fontWeight:700,color:"var(--c-primary-hover)"}}>100%</td>
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
            <div style={secTitle}><i className="ti ti-crown" style={{color:"var(--c-warning-mid)",fontSize:18}}/>Top 10 khách hàng</div>
            {topCustomers.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:32}}>Không có dữ liệu</div>}
            {topCustomers.map((c,i)=>(
              <div key={c.phone||c.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<topCustomers.length-1?"1px solid var(--c-border)":"none"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:i===0?"#f59e0b":i===1?"var(--c-text-muted)":i===2?"var(--c-warning)":"var(--c-border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"var(--text-sm)",fontWeight:800,color:i<3?"#fff":"var(--c-text-3)",flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:"var(--text-sm)",color:"var(--c-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                  <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>{c.phone} · {c.orders} đơn</div>
                </div>
                <div style={{fontWeight:800,fontSize:"var(--text-md)",color:"var(--c-warning-mid)",flexShrink:0}}>{fmtM(c.revenue)}₫</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={secTitle}><i className="ti ti-users" style={{color:"var(--c-primary-mid)",fontSize:18}}/>Thống kê khách hàng</div>
            {[
              {label:"Tổng KH trong hệ thống",val:customers.length,color:"var(--c-primary-mid)"},
              {label:"KH tạo kỳ này",val:customers.filter(c=>filterByPeriod(c.createdAt||c.firstOrderDate)).length,color:"var(--c-success-mid)"},
              {label:"KH có đơn kỳ này",val:new Set(allOrders.map(o=>o.customerPhone||o.customerName).filter(Boolean)).size,color:"var(--c-purple)"},
              {label:"KH mua lại (≥2 đơn)",val:Object.values(Object.fromEntries(orders.map(o=>[o.customerPhone||o.customerName,[]]))).filter(a=>a.length>=2).length||topCustomers.filter(c=>c.orders>=2).length,color:"var(--c-warning-mid)"},
              {label:"Giá trị đơn TB",val:fmtMoney(avgOrderVal),color:"var(--c-info)",isString:true},
              {label:"Tỷ lệ chốt đơn",val:pct(closedOrders.length,allOrders.length||1)+"%",color:"var(--c-success-mid)",isString:true},
            ].map(k=>(
              <div key={k.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--c-border)"}}>
                <span style={{fontSize:"var(--text-base)",color:"var(--c-text-2)",fontWeight:500}}>{k.label}</span>
                <span style={{fontSize:"var(--text-lg)",fontWeight:800,color:k.color}}>{k.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: THU CHI ── */}
      {tab==="cashflow"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={card}>
            <div style={secTitle}><i className="ti ti-receipt" style={{color:"var(--c-success-mid)",fontSize:18}}/>Tổng hợp thu chi</div>
            {[
              {label:"Tổng thu (phiếu thu duyệt)",val:totalPaid,color:"var(--c-success-mid)",icon:"ti-arrow-down-circle"},
              {label:"Tổng chi (phiếu chi + NCC)",val:totalCost,color:"var(--c-danger-mid)",icon:"ti-arrow-up-circle"},
              {label:"Thực thu thuần",val:totalPaid-totalCost,color:totalPaid-totalCost>=0?"var(--c-primary-mid)":"var(--c-danger-mid)",icon:"ti-equal"},
              {label:"Doanh thu (đơn đã đóng)",val:totalRevenue,color:"var(--c-purple)",icon:"ti-chart-bar"},
              {label:"Lợi nhuận ước tính",val:profit,color:profit>=0?"var(--c-success-mid)":"var(--c-danger-mid)",icon:"ti-trending-up"},
            ].map(k=>(
              <div key={k.label} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--c-border)"}}>
                <div style={{width:36,height:36,borderRadius:"var(--r-md)",background:k.color+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <i className={`ti ${k.icon}`} style={{fontSize:18,color:k.color}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)",fontWeight:600}}>{k.label}</div>
                  <div style={{fontSize:"var(--text-xl)",fontWeight:800,color:k.color,marginTop:2}}>{fmtMoney(k.val)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{...secTitle,margin:0}}><i className="ti ti-list-details" style={{color:"var(--c-purple)",fontSize:18}}/>Chi tiết phiếu thu kỳ này</div>
              <Btn size="sm" style={{background:"var(--c-purple)"}} onClick={()=>downloadCSV(approvedVouchers.filter(v=>v.type==="thu").map(v=>({Mã_phiếu:v.id,Khách_hàng:v.customerName||"",Đơn_hàng:v.orderId||"",Ngày:v.date?new Date(v.date).toLocaleDateString("vi-VN"):"",Số_tiền:v.amount||0,Hình_thức:v.method==="cash"?"Tiền mặt":"Chuyển khoản",Ghi_chú:v.note||""})),"phieu-thu-ky-nay.csv")}>📊 Xuất CSV</Btn>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"var(--text-base)"}}>
              <thead>
                <tr style={{background:"var(--c-surface-2)"}}>
                  {["Mã phiếu","Khách hàng","Số tiền","Trạng thái"].map(h=>(
                    <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:"var(--text-xs)",fontWeight:700,color:"var(--c-text-3)",textTransform:"uppercase",borderBottom:"1px solid var(--c-border)"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvedVouchers.filter(v=>v.type==="thu").slice(0,10).map((v,i)=>(
                  <tr key={v.id} style={{borderBottom:"1px solid var(--c-border)",background:i%2===0?"var(--c-surface)":"var(--c-bg)"}}>
                    <td style={{padding:"8px 12px",fontWeight:600,color:"var(--c-primary-mid)"}}>{v.id}</td>
                    <td style={{padding:"8px 12px",color:"var(--c-text-2)"}}>{v.customerName||"—"}</td>
                    <td style={{padding:"8px 12px",fontWeight:700,color:"var(--c-success-mid)"}}>{fmtMoney(v.amount)}</td>
                    <td style={{padding:"8px 12px"}}><span style={{background:"var(--c-success-bg)",color:"var(--c-success-mid)",borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",padding:"2px 8px",fontWeight:600}}>✓ Duyệt</span></td>
                  </tr>
                ))}
                {approvedVouchers.filter(v=>v.type==="thu").length===0&&(
                  <tr><td colSpan={4} style={{textAlign:"center",padding:"24px",color:"var(--c-text-muted)"}}>Không có phiếu thu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
