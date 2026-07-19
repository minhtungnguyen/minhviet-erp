function DirectorDashboard({ orders=[], vouchers=[], expenses=[], personalTargets=[], userAccounts=[], customers=[], setView, bankAccounts=[], bookings=[] }){
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"đ";
  const now=new Date();
  const thisMonth=(d)=>{ if(!d) return false; const x=new Date(d); return x.getMonth()===now.getMonth()&&x.getFullYear()===now.getFullYear(); };
  const lastMonthDate=new Date(now.getFullYear(),now.getMonth()-1,1);
  const lastMonth=(d)=>{ if(!d) return false; const x=new Date(d); return x.getMonth()===lastMonthDate.getMonth()&&x.getFullYear()===lastMonthDate.getFullYear(); };

  const closedThisMonth=orders.filter(o=>o.status==="closed"&&thisMonth(o.closedAt||o.departDate));
  const closedLastMonth=orders.filter(o=>o.status==="closed"&&lastMonth(o.closedAt||o.departDate));
  const revenueThisMonth=closedThisMonth.reduce((s,o)=>s+(o.totalPrice||0),0);
  const revenueLastMonth=closedLastMonth.reduce((s,o)=>s+(o.totalPrice||0),0);

  const chiThisMonth=vouchers.filter(v=>v.type==="chi"&&["approved","confirmed"].includes(v.status)&&thisMonth(v.date||v.createdAt)).reduce((s,v)=>s+(v.amount||0),0);
  const expThisMonth=expenses.filter(e=>e.status==="approved"&&thisMonth(e.createdAt)).reduce((s,e)=>s+(e.amount||0),0);
  const profitThisMonth=revenueThisMonth-chiThisMonth-expThisMonth;
  const profitMarginPct=revenueThisMonth?(profitThisMonth/revenueThisMonth*100):0;

  const paidThisMonth=vouchers.filter(v=>v.type==="thu"&&["approved","confirmed"].includes(v.status)&&thisMonth(v.date||v.createdAt)).reduce((s,v)=>s+(v.amount||0),0);
  const paidPctOfRevenue=revenueThisMonth?(paidThisMonth/revenueThisMonth*100):0;

  const totalDebtKH=orders.filter(o=>o.status!=="closed"&&o.status!=="cancelled").reduce((s,o)=>s+Math.max(0,(o.totalPrice||0)-(o.totalPaid||0)),0);
  const bankBalance=bankAccounts.reduce((s,a)=>s+(a.balance||0),0);

  const newCustomersThisMonth=customers.filter(c=>thisMonth(c.createdAt||c.firstOrderDate)).length;
  const noContact3Months=customers.filter(c=>{
    const last=(c.interactions||[]).map(i=>new Date(i.ts)).sort((a,b)=>b-a)[0]||(c.lastOrderDate?new Date(c.lastOrderDate):null);
    if(!last) return false;
    return (now-last)/86400000>90;
  }).length;
  const upcomingDepartures=orders.filter(o=>["confirmed","in_progress"].includes(o.status)&&o.departDate&&(new Date(o.departDate)-now)/86400000<=7&&(new Date(o.departDate)-now)/86400000>=0).length;
  const cancelledThisMonth=orders.filter(o=>o.status==="cancelled"&&thisMonth(o.cancelledAt||o.createdAt)).length;
  const cancelRate=orders.length?Math.round(cancelledThisMonth/orders.length*100):0;
  const nccDebt=(bookings||[]).filter(b=>b.status!=="cancelled"&&b.status!=="paid").reduce((s,b)=>s+(b.amount||0),0);

  const bySaleThis={},bySaleLast={};
  closedThisMonth.forEach(o=>{const s=o.service||o.tourName||"Khác";bySaleThis[s]=(bySaleThis[s]||0)+(o.totalPrice||0);});
  closedLastMonth.forEach(o=>{const s=o.service||o.tourName||"Khác";bySaleLast[s]=(bySaleLast[s]||0)+(o.totalPrice||0);});
  const allServices=[...new Set([...Object.keys(bySaleThis),...Object.keys(bySaleLast)])];
  const maxServiceVal=Math.max(...allServices.map(s=>Math.max(bySaleThis[s]||0,bySaleLast[s]||0)),1);

  const debtBuckets=[
    {label:"Dưới 5tr",min:0,max:5e6,color:"#16a34a"},
    {label:"5-20tr",min:5e6,max:20e6,color:"#d97706"},
    {label:"Trên 20tr",min:20e6,max:Infinity,color:"#dc2626"},
  ];
  const debtByOrder=orders.filter(o=>o.status!=="closed"&&o.status!=="cancelled").map(o=>Math.max(0,(o.totalPrice||0)-(o.totalPaid||0))).filter(d=>d>0);
  const debtBucketCounts=debtBuckets.map(b=>({...b,count:debtByOrder.filter(d=>d>=b.min&&d<b.max).length}));
  const maxBucket=Math.max(...debtBucketCounts.map(b=>b.count),1);

  const KPI1=[
    {label:"DOANH THU THÁNG",icon:"💰",val:fmtMoney(revenueThisMonth),sub:"Tháng trước: "+fmtMoney(revenueLastMonth),color:"#2563eb"},
    {label:"LỢI NHUẬN THÁNG",icon:"📈",val:fmtMoney(profitThisMonth),sub:"Biên: "+profitMarginPct.toFixed(1)+"%",color:profitThisMonth>=0?"#16a34a":"#dc2626"},
    {label:"BIÊN LN TB",icon:"📊",val:profitMarginPct.toFixed(1)+"%",sub:closedThisMonth.length+" đơn tháng này",color:"#7c3aed"},
    {label:"ĐÃ THU THÁNG",icon:"✅",val:fmtMoney(paidThisMonth),sub:paidPctOfRevenue.toFixed(0)+"% doanh thu",color:"#16a34a"},
    {label:"TỔNG CÔNG NỢ KH",icon:"💵",val:fmtMoney(totalDebtKH),sub:debtByOrder.length+" đơn",color:totalDebtKH>0?"#dc2626":"#16a34a"},
    {label:"SỐ DƯ TK (HT)",icon:"🏦",val:fmtMoney(bankBalance),sub:"Hệ thống tính",color:"#0891b2"},
  ];
  const KPI2=[
    {label:"KHÁCH MỚI THÁNG NÀY",icon:"🆕",val:newCustomersThisMonth,sub:"Tạo lần đầu",color:"#16a34a",onClick:()=>setView&&setView("crm")},
    {label:"KHÔNG HĐ >3 THÁNG",icon:"🥱",val:noContact3Months,sub:"Cần chăm sóc lại",color:"#d97706",onClick:()=>setView&&setView("crm")},
    {label:"ĐƠN SẮP KHỞI HÀNH",icon:"✈️",val:upcomingDepartures,sub:"Trong 7 ngày tới",color:"#2563eb",onClick:()=>setView&&setView("tourops")},
    {label:"ĐƠN HỦY THÁNG NÀY",icon:"❌",val:cancelledThisMonth,sub:"Tỷ lệ: "+cancelRate+"%",color:cancelledThisMonth>0?"#dc2626":"#16a34a"},
    {label:"CÔNG TY NỢ NCC",icon:"🏢",val:fmtMoney(nccDebt),sub:"Phiếu chi chờ duyệt",color:nccDebt>0?"#dc2626":"#16a34a",onClick:()=>setView&&setView("ncc")},
  ];

  return (
    <div style={{padding:24}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>Dashboard Giám đốc</h2>
      <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Tổng quan hoạt động kinh doanh · {String(now.getMonth()+1).padStart(2,"0")}/{now.getFullYear()}</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:14}}>
        {KPI1.map(k=>(
          <div key={k.label} style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontSize:11,color:"#64748b",fontWeight:700,letterSpacing:.3}}>{k.label} {k.icon}</div>
            <div style={{fontSize:17,fontWeight:800,color:k.color,marginTop:8}}>{k.val}</div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:24}}>
        {KPI2.map(k=>(
          <div key={k.label} onClick={k.onClick} style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.07)",cursor:k.onClick?"pointer":"default"}}>
            <div style={{fontSize:11,color:"#64748b",fontWeight:700,letterSpacing:.3}}>{k.label} {k.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.color,marginTop:8}}>{k.val}</div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:6,fontSize:14}}>📊 Doanh thu theo dịch vụ</div>
          <div style={{display:"flex",gap:14,marginBottom:14,fontSize:11}}>
            <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:9,height:9,borderRadius:2,background:"#1e3a8a",display:"inline-block"}}/>Tháng này</span>
            <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:9,height:9,borderRadius:2,background:"#cbd5e1",display:"inline-block"}}/>Tháng trước</span>
          </div>
          {allServices.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:20,fontSize:13}}>Chưa có dữ liệu</div>}
          {allServices.slice(0,6).map(s=>(
            <div key={s} style={{marginBottom:10}}>
              <div style={{fontSize:12,marginBottom:3,color:"#374151",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s}</div>
              <div style={{display:"flex",gap:3,alignItems:"center"}}>
                <div style={{flex:1,background:"#f1f5f9",borderRadius:4,height:8}}><div style={{background:"#1e3a8a",height:8,borderRadius:4,width:((bySaleThis[s]||0)/maxServiceVal*100)+"%"}}/></div>
                <div style={{flex:1,background:"#f1f5f9",borderRadius:4,height:8}}><div style={{background:"#cbd5e1",height:8,borderRadius:4,width:((bySaleLast[s]||0)/maxServiceVal*100)+"%"}}/></div>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>💸 Công nợ KH theo mức độ</div>
          {debtByOrder.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:20,fontSize:13}}>✅ Không có công nợ nào</div>}
          {debtByOrder.length>0&&debtBucketCounts.map(b=>(
            <div key={b.label} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:600,color:"#374151"}}>{b.label}</span>
                <span style={{fontSize:12,fontWeight:700,color:b.color}}>{b.count} đơn</span>
              </div>
              <div style={{background:"#f1f5f9",borderRadius:4,height:8}}><div style={{background:b.color,height:8,borderRadius:4,width:(b.count/maxBucket*100)+"%"}}/></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
