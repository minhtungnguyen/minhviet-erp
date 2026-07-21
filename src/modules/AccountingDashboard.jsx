import React from "react";
import { NumberInput } from "../components/ui.jsx";
import { downloadCSV } from "../utils/csv.js";

export default function AccountingDashboard({orders=[],vouchers=[],expenses=[],refunds=[],bankAccounts=[],onUpdateBankAccounts,
  outputInvoices=[],onUpdateOutputInvoices,inputInvoices=[],onUpdateInputInvoices,suppliers=[],pushNotif}){
  const [tab,setTab]=React.useState("overview");
  const [period,setPeriod]=React.useState("month");
  const [invTab,setInvTab]=React.useState("output");
  const [showForm,setShowForm]=React.useState(false);
  const [form,setForm]=React.useState({orderId:"",invoiceNo:"",taxCode:"",companyName:"",amount:"",vatRate:10,date:new Date().toISOString().slice(0,10)});

  const now=new Date();
  const fmtMoney=(n)=>(Math.round(n||0)).toLocaleString("vi-VN")+"₫";
  const fmtM=(n)=>{const a=Math.abs(n||0),s=(n||0)<0?"-":"";if(a>=1e9)return s+(a/1e9).toFixed(1)+" tỷ";return s+Math.round(a).toLocaleString("vi-VN")+"₫";};
  const fmtDate=d=>d?new Date(d).toLocaleDateString("vi-VN"):"—";
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const inPeriod=(d)=>{
    if(!d) return false; const x=new Date(d);
    if(period==="all") return true;
    if(period==="month") return x.getMonth()===now.getMonth()&&x.getFullYear()===now.getFullYear();
    if(period==="quarter"){const q=Math.floor(now.getMonth()/3);return Math.floor(x.getMonth()/3)===q&&x.getFullYear()===now.getFullYear();}
    if(period==="year") return x.getFullYear()===now.getFullYear();
    return true;
  };

  // ── Số liệu tài chính ──
  const apprThu=(vouchers||[]).filter(v=>v.type==="thu"&&["approved","confirmed"].includes(v.status));
  const apprChi=(vouchers||[]).filter(v=>v.type==="chi"&&["approved","confirmed"].includes(v.status));
  const paidExp=(expenses||[]).filter(e=>e.status==="paid");
  const thuKy=apprThu.filter(v=>inPeriod(v.date||v.createdAt)).reduce((s,v)=>s+(v.amount||0),0);
  const chiKy=apprChi.filter(v=>inPeriod(v.date||v.createdAt)).reduce((s,v)=>s+(v.amount||0),0)+paidExp.filter(e=>inPeriod(e.createdAt)).reduce((s,e)=>s+(e.amount||0),0);
  const tonQuy=apprThu.reduce((s,v)=>s+(v.amount||0),0)-apprChi.reduce((s,v)=>s+(v.amount||0),0)-paidExp.reduce((s,e)=>s+(e.amount||0),0);
  const doanhThu=orders.filter(o=>o.status==="closed"&&inPeriod(o.closedAt||o.departDate)).reduce((s,o)=>s+(o.totalPrice||0),0);

  // Công nợ phải thu (đơn chưa đóng còn nợ)
  const phaiThu=orders.filter(o=>!["closed","cancelled"].includes(o.status)).map(o=>({...o,debt:Math.max(0,(o.totalPrice||0)-(o.totalPaid||0))})).filter(o=>o.debt>0).sort((a,b)=>new Date(a.departDate||0)-new Date(b.departDate||0));
  const totalPhaiThu=phaiThu.reduce((s,o)=>s+o.debt,0);
  // Công nợ phải trả (NCC cong_no + phiếu chi/expense chờ)
  const pendingChi=(vouchers||[]).filter(v=>v.type==="chi"&&v.status==="pending");
  const pendingExp=(expenses||[]).filter(e=>["pending_kt","pending_gd","pending_pay"].includes(e.status));
  const nccDebt=(suppliers||[]).filter(s=>(s.cong_no||0)>0);
  const totalPhaiTra=pendingChi.reduce((s,v)=>s+(v.amount||0),0)+pendingExp.reduce((s,e)=>s+(e.amount||0),0)+nccDebt.reduce((s,n)=>s+(n.cong_no||0),0);

  // VAT
  const outVat=outputInvoices.filter(i=>inPeriod(i.date)).reduce((s,i)=>s+(i.vatAmount||0),0);
  const inVat=inputInvoices.filter(i=>inPeriod(i.date)).reduce((s,i)=>s+(i.vatAmount||0),0);
  const vatPhaiNop=outVat-inVat;

  // Sổ thu chi — gộp thu+chi theo thời gian, tính số dư lũy kế
  const cashbook=React.useMemo(()=>{
    const rows=[
      ...apprThu.map(v=>({date:v.date||v.createdAt,type:"thu",desc:v.note||(v.customerName?("Thu "+v.customerName):"Phiếu thu"),ref:v.id,amount:v.amount||0})),
      ...apprChi.map(v=>({date:v.date||v.createdAt,type:"chi",desc:v.note||(v.ncc?("Chi "+v.ncc):"Phiếu chi"),ref:v.id,amount:v.amount||0})),
      ...paidExp.map(e=>({date:e.createdAt,type:"chi",desc:e.note||(e.ncc?("Chi NCC "+e.ncc):"Chi phí"),ref:e.id,amount:e.amount||0})),
    ].filter(r=>inPeriod(r.date)).sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));
    let bal=0;
    return rows.map(r=>{bal+=r.type==="thu"?r.amount:-r.amount;return{...r,balance:bal};});
  },[vouchers,expenses,period]);

  const saveInv=()=>{
    if(!form.invoiceNo||!form.amount) return pushNotif&&pushNotif("Nhập số hóa đơn và số tiền","error");
    const inv={...form,id:(invTab==="output"?"HD":"HDV")+Date.now(),amount:Number(form.amount),vatAmount:Math.round(Number(form.amount)*Number(form.vatRate)/100),createdAt:new Date().toISOString()};
    if(invTab==="output") onUpdateOutputInvoices([inv,...outputInvoices]);
    else onUpdateInputInvoices([inv,...inputInvoices]);
    pushNotif&&pushNotif("Đã ghi nhận hóa đơn "+form.invoiceNo);
    setShowForm(false); setForm({orderId:"",invoiceNo:"",taxCode:"",companyName:"",amount:"",vatRate:10,date:new Date().toISOString().slice(0,10)});
  };
  const invList=invTab==="output"?outputInvoices:inputInvoices;

  const card={background:"var(--c-surface)",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,.07)"};
  const TABS=[
    {k:"overview",label:"Tổng quan",icon:"ti-chart-pie"},
    {k:"cashbook",label:"Sổ thu chi",icon:"ti-book"},
    {k:"receivable",label:"Phải thu",icon:"ti-arrow-down-circle"},
    {k:"payable",label:"Phải trả",icon:"ti-arrow-up-circle"},
    {k:"vat",label:"Hóa đơn VAT",icon:"ti-receipt-tax"},
    {k:"bank",label:"Quỹ & NH",icon:"ti-building-bank"},
  ];

  return(
    <div style={{padding:24,background:"var(--c-surface-3)",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:12}}>
        <h2 style={{margin:0,fontSize:22,fontWeight:800,color:"var(--c-text)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,var(--c-teal),#0b5c56)",display:"flex",alignItems:"center",justifyContent:"center"}}><i className="ti ti-calculator" style={{fontSize:22,color:"#fff"}}/></div>
          Kế toán
        </h2>
        <div style={{display:"flex",gap:6}}>
          {[["month","Tháng"],["quarter","Quý"],["year","Năm"],["all","Tất cả"]].map(([k,l])=>(
            <button key={k} onClick={()=>setPeriod(k)} style={{padding:"7px 14px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:period===k?"var(--c-teal)":"#fff",color:period===k?"#fff":"var(--c-text-3)",boxShadow:period===k?"0 2px 8px rgba(8,145,178,.3)":"0 1px 4px rgba(0,0,0,.06)"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,background:"var(--c-surface)",borderRadius:14,padding:6,marginBottom:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",flexWrap:"wrap"}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"9px 16px",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:6,background:tab===t.k?"linear-gradient(135deg,var(--c-teal),#0b5c56)":"transparent",color:tab===t.k?"#fff":"var(--c-text-3)"}}>
            <i className={`ti ${t.icon}`} style={{fontSize:16}}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── TỔNG QUAN ── */}
      {tab==="overview"&&(<>
        <div className="resp-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
          {[
            {label:"Tổng thu kỳ này",val:fmtM(thuKy),bg:"linear-gradient(135deg,var(--c-success-mid),#047857)",icon:"ti-arrow-down-circle"},
            {label:"Tổng chi kỳ này",val:fmtM(chiKy),bg:"linear-gradient(135deg,var(--c-danger-mid),var(--c-danger))",icon:"ti-arrow-up-circle"},
            {label:"Tồn quỹ (Thu−Chi)",val:fmtM(tonQuy),bg:tonQuy>=0?"linear-gradient(135deg,var(--c-primary-mid),#1d4ed8)":"linear-gradient(135deg,var(--c-danger-mid),var(--c-danger))",icon:"ti-wallet"},
          ].map(k=>(
            <div key={k.label} style={{background:k.bg,borderRadius:14,padding:"18px 20px",boxShadow:"0 4px 14px rgba(0,0,0,.13)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:14,top:12,fontSize:30,opacity:.2}}><i className={`ti ${k.icon}`}/></div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.75)",fontWeight:600,marginBottom:6}}>{k.label}</div>
              <div style={{fontSize:24,fontWeight:800,color:"#fff"}}>{k.val}</div>
            </div>
          ))}
        </div>
        <div className="resp-grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
          {[
            {label:"Doanh thu (đơn đóng)",val:fmtM(doanhThu),color:"var(--c-primary-mid)",onClick:null},
            {label:"Công nợ phải thu",val:fmtM(totalPhaiThu),color:"var(--c-warning-mid)",onClick:()=>setTab("receivable"),sub:`${phaiThu.length} đơn`},
            {label:"Công nợ phải trả",val:fmtM(totalPhaiTra),color:"var(--c-danger-mid)",onClick:()=>setTab("payable"),sub:`${pendingChi.length+pendingExp.length+nccDebt.length} khoản`},
            {label:"VAT phải nộp",val:fmtM(vatPhaiNop),color:vatPhaiNop>=0?"var(--c-purple)":"var(--c-success-mid)",onClick:()=>setTab("vat")},
          ].map(k=>(
            <div key={k.label} onClick={k.onClick} style={{...card,padding:"14px 16px",cursor:k.onClick?"pointer":"default"}}>
              <div style={{fontSize:12,color:"var(--c-text-3)",fontWeight:600}}>{k.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:k.color,marginTop:4}}>{k.val}</div>
              {k.sub&&<div style={{fontSize:11,color:"var(--c-text-muted)",marginTop:2}}>{k.sub}</div>}
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:"var(--c-text)"}}>Cân đối nhanh</div>
          {[
            ["Doanh thu ghi nhận",doanhThu,"var(--c-primary-mid)"],
            ["Đã thực thu",apprThu.reduce((s,v)=>s+(v.amount||0),0),"var(--c-success-mid)"],
            ["Đã thực chi",apprChi.reduce((s,v)=>s+(v.amount||0),0)+paidExp.reduce((s,e)=>s+(e.amount||0),0),"var(--c-danger-mid)"],
            ["Lợi nhuận gộp ước tính",doanhThu-(apprChi.reduce((s,v)=>s+(v.amount||0),0)+paidExp.reduce((s,e)=>s+(e.amount||0),0)),"var(--c-purple)"],
          ].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--c-surface-2)"}}>
              <span style={{fontSize:13,color:"var(--c-text-2)"}}>{l}</span>
              <span style={{fontSize:15,fontWeight:700,color:c}}>{fmtMoney(v)}</span>
            </div>
          ))}
        </div>
      </>)}

      {/* ── SỔ THU CHI ── */}
      {tab==="cashbook"&&(
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:15,color:"var(--c-text)"}}>Sổ thu chi — {cashbook.length} giao dịch</div>
            <button onClick={()=>downloadCSV(cashbook.map(r=>({Ngày:r.date?new Date(r.date).toLocaleDateString("vi-VN"):"",Diễn_giải:r.desc,Mã_CT:r.ref,Loại:r.type==="thu"?"Thu":"Chi",Số_tiền:r.amount,Số_dư:r.balance})),"so-thu-chi.csv")} style={{background:"var(--c-success-mid)",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>📊 Xuất CSV</button>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"var(--c-surface-2)"}}>
                {["Ngày","Diễn giải","Mã CT","Thu","Chi","Số dư"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:h==="Thu"||h==="Chi"||h==="Số dư"?"right":"left",fontSize:11,fontWeight:700,color:"var(--c-text-3)",textTransform:"uppercase",borderBottom:"1px solid var(--c-surface-3)"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {cashbook.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--c-text-muted)"}}>Chưa có giao dịch trong kỳ</td></tr>}
                {cashbook.map((r,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid var(--c-surface-2)"}}>
                    <td style={{padding:"9px 12px",color:"var(--c-text-3)"}}>{fmtDate(r.date)}</td>
                    <td style={{padding:"9px 12px",fontWeight:500}}>{r.desc}</td>
                    <td style={{padding:"9px 12px",color:"var(--c-text-muted)",fontSize:12}}>{r.ref}</td>
                    <td style={{padding:"9px 12px",textAlign:"right",color:"var(--c-success-mid)",fontWeight:600}}>{r.type==="thu"?fmtMoney(r.amount):""}</td>
                    <td style={{padding:"9px 12px",textAlign:"right",color:"var(--c-danger-mid)",fontWeight:600}}>{r.type==="chi"?fmtMoney(r.amount):""}</td>
                    <td style={{padding:"9px 12px",textAlign:"right",fontWeight:700,color:r.balance>=0?"var(--c-text)":"var(--c-danger-mid)"}}>{fmtMoney(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PHẢI THU ── */}
      {tab==="receivable"&&(
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:15,color:"var(--c-text)"}}>Công nợ phải thu</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>downloadCSV(phaiThu.map(o=>({Mã_đơn:o.id,Khách_hàng:o.customerName||"",SĐT:o.customerPhone||"",Ngày_đi:o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"",Giá_trị:o.totalPrice||0,Đã_thu:o.totalPaid||0,Còn_nợ:o.debt})),"cong-no-phai-thu.csv")} style={{background:"var(--c-warning-mid)",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>📊 Xuất CSV</button>
              <div style={{fontSize:15,fontWeight:800,color:"var(--c-warning-mid)"}}>{fmtMoney(totalPhaiThu)}</div>
            </div>
          </div>
          {phaiThu.length===0?<div style={{textAlign:"center",color:"var(--c-success-mid)",padding:24,fontWeight:600}}>✓ Không có công nợ phải thu</div>:
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"var(--c-surface-2)"}}>{["Đơn","Khách hàng","Ngày đi","Giá trị","Đã thu","Còn nợ"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:["Giá trị","Đã thu","Còn nợ"].includes(h)?"right":"left",fontSize:11,fontWeight:700,color:"var(--c-text-3)",textTransform:"uppercase",borderBottom:"1px solid var(--c-surface-3)"}}>{h}</th>)}</tr></thead>
            <tbody>{phaiThu.map(o=>{const dl=o.departDate?Math.ceil((new Date(o.departDate)-now)/86400000):null;const hot=dl!==null&&dl<=7;return(
              <tr key={o.id} style={{borderBottom:"1px solid var(--c-surface-2)",background:hot?"var(--c-warning-bg)":"#fff"}}>
                <td style={{padding:"9px 12px",fontWeight:600,color:"var(--c-primary-mid)"}}>{o.id}</td>
                <td style={{padding:"9px 12px"}}>{o.customerName||"—"}</td>
                <td style={{padding:"9px 12px",color:hot?"var(--c-danger-mid)":"var(--c-text-3)",fontWeight:hot?700:400}}>{fmtDate(o.departDate)}{hot&&dl>=0&&` (${dl}n)`}</td>
                <td style={{padding:"9px 12px",textAlign:"right"}}>{fmtMoney(o.totalPrice)}</td>
                <td style={{padding:"9px 12px",textAlign:"right",color:"var(--c-success-mid)"}}>{fmtMoney(o.totalPaid)}</td>
                <td style={{padding:"9px 12px",textAlign:"right",fontWeight:700,color:"var(--c-warning-mid)"}}>{fmtMoney(o.debt)}</td>
              </tr>);})}</tbody>
          </table></div>}
        </div>
      )}

      {/* ── PHẢI TRẢ ── */}
      {tab==="payable"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:15,color:"var(--c-text)"}}>Phiếu chi / chi phí chờ thanh toán</div>
              <div style={{fontSize:15,fontWeight:800,color:"var(--c-danger-mid)"}}>{fmtMoney(pendingChi.reduce((s,v)=>s+(v.amount||0),0)+pendingExp.reduce((s,e)=>s+(e.amount||0),0))}</div>
            </div>
            {[...pendingChi.map(v=>({id:v.id,ncc:v.ncc,amount:v.amount,note:v.note,kind:"Phiếu chi"})),...pendingExp.map(e=>({id:e.id,ncc:e.ncc,amount:e.amount,note:e.note,kind:"Chi phí"}))].length===0
              ?<div style={{textAlign:"center",color:"var(--c-success-mid)",padding:20,fontWeight:600}}>✓ Không có khoản chờ thanh toán</div>
              :[...pendingChi.map(v=>({id:v.id,ncc:v.ncc,amount:v.amount,note:v.note,kind:"Phiếu chi"})),...pendingExp.map(e=>({id:e.id,ncc:e.ncc,amount:e.amount,note:e.note,kind:"Chi phí"}))].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--c-surface-2)"}}>
                  <div><div style={{fontSize:13,fontWeight:600}}>{r.ncc||r.note||r.id}</div><div style={{fontSize:11,color:"var(--c-text-muted)"}}>{r.kind} · {r.id}</div></div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--c-danger-mid)"}}>{fmtMoney(r.amount)}</div>
                </div>
              ))}
          </div>
          {nccDebt.length>0&&(
            <div style={card}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:"var(--c-text)"}}>Công nợ nhà cung cấp</div>
              {nccDebt.map(n=>(
                <div key={n.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--c-surface-2)"}}>
                  <span style={{fontSize:13,fontWeight:600}}>{n.ten||n.name}</span>
                  <span style={{fontSize:15,fontWeight:700,color:"var(--c-danger-mid)"}}>{fmtMoney(n.cong_no)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HÓA ĐƠN VAT ── */}
      {tab==="vat"&&(<>
        <div className="resp-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
          {[["VAT đầu ra",outVat,"var(--c-success-mid)"],["VAT đầu vào",inVat,"var(--c-primary-mid)"],["VAT phải nộp",vatPhaiNop,vatPhaiNop>=0?"var(--c-purple)":"var(--c-success-mid)"]].map(([l,v,c])=>(
            <div key={l} style={{...card,padding:"14px 16px"}}><div style={{fontSize:12,color:"var(--c-text-3)",fontWeight:600}}>{l}</div><div style={{fontSize:18,fontWeight:800,color:c,marginTop:4}}>{fmtMoney(v)}</div></div>
          ))}
        </div>
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:4,background:"var(--c-surface-3)",borderRadius:10,padding:4}}>
              {[["output","Đầu ra (bán)"],["input","Đầu vào (mua)"]].map(([k,l])=>(
                <button key={k} onClick={()=>setInvTab(k)} style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:invTab===k?"#fff":"transparent",color:invTab===k?"var(--c-text)":"var(--c-text-3)",boxShadow:invTab===k?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{l}</button>
              ))}
            </div>
            <button onClick={()=>setShowForm(true)} style={{background:"var(--c-primary-mid)",color:"#fff",border:"none",borderRadius:9,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Ghi hóa đơn</button>
          </div>
          {showForm&&(
            <div style={{background:"var(--c-surface-2)",borderRadius:12,padding:16,marginBottom:16,border:"1px solid var(--c-border)"}}>
              <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {invTab==="output"&&(
                  <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>Đơn hàng</label>
                  <select value={form.orderId} onChange={e=>set("orderId",e.target.value)} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13}}>
                    <option value="">-- Chọn đơn --</option>{orders.map(o=><option key={o.id} value={o.id}>{o.id} - {o.customerName||"—"}</option>)}
                  </select></div>
                )}
                {[["Số hóa đơn *","invoiceNo"],["Mã số thuế","taxCode"],["Tên công ty/khách","companyName"]].map(([label,key])=>(
                  <div key={key}><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>{label}</label>
                  <input value={form[key]||""} onChange={e=>set(key,e.target.value)} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/></div>
                ))}
                <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>Số tiền trước VAT (₫) *</label>
                <NumberInput value={form.amount||0} onChange={v=>set("amount",v)} placeholder="VD: 5.000.000" style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/></div>
                <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>Thuế VAT (%)</label>
                <select value={form.vatRate} onChange={e=>set("vatRate",e.target.value)} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13}}><option value={0}>0%</option><option value={5}>5%</option><option value={8}>8%</option><option value={10}>10%</option></select></div>
                <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>Ngày xuất</label>
                <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/></div>
              </div>
              {form.amount>0&&<div style={{marginTop:10,fontSize:13,color:"var(--c-text-3)"}}>Tổng cộng (gồm VAT): <b style={{color:"var(--c-text)"}}>{fmtMoney(Number(form.amount)*(1+Number(form.vatRate)/100))}</b></div>}
              <div style={{display:"flex",gap:8,marginTop:14}}>
                <button onClick={saveInv} style={{background:"var(--c-success-mid)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700}}>Lưu</button>
                <button onClick={()=>setShowForm(false)} style={{background:"var(--c-text-3)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600}}>Hủy</button>
              </div>
            </div>
          )}
          {invList.length===0?<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:32}}>Chưa có hóa đơn nào</div>:
            invList.map(inv=>(
              <div key={inv.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--c-surface-2)"}}>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{inv.invoiceNo} {inv.orderId&&"· "+inv.orderId}</div><div style={{fontSize:12,color:"var(--c-text-3)",marginTop:2}}>{inv.companyName||"—"} {inv.taxCode?"· MST: "+inv.taxCode:""} · {fmtDate(inv.date)}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:15,color:"var(--c-text)"}}>{fmtMoney(inv.amount)}</div><div style={{fontSize:12,color:"var(--c-warning-mid)"}}>VAT {inv.vatRate}%: {fmtMoney(inv.vatAmount)}</div></div>
              </div>
            ))}
        </div>
      </>)}

      {/* ── QUỸ & NGÂN HÀNG ── */}
      {tab==="bank"&&(
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:15,color:"var(--c-text)"}}>Tài khoản & tồn quỹ</div>
            <div style={{fontSize:15,fontWeight:800,color:"var(--c-primary-mid)"}}>{fmtMoney(tonQuy)}</div>
          </div>
          <div style={{padding:"12px 16px",background:"var(--c-primary-light)",borderRadius:10,marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:13,fontWeight:600,color:"var(--c-primary)"}}>💰 Tồn quỹ tổng (Thu − Chi toàn bộ)</span>
            <span style={{fontSize:16,fontWeight:800,color:tonQuy>=0?"var(--c-primary-mid)":"var(--c-danger-mid)"}}>{fmtMoney(tonQuy)}</span>
          </div>
          {(bankAccounts||[]).length===0?<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:20,fontSize:13}}>Chưa khai báo tài khoản ngân hàng</div>:
            bankAccounts.map(b=>(
              <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--c-surface-2)"}}>
                <div><div style={{fontSize:13,fontWeight:600}}>{b.bankName||b.name||"—"}</div><div style={{fontSize:11,color:"var(--c-text-muted)",fontFamily:"monospace"}}>{b.accountNo||b.so_tk||""} · {b.accountName||b.chu_tk||""}</div></div>
                <div style={{fontSize:15,fontWeight:700,color:"var(--c-text)"}}>{b.balance!=null?fmtMoney(b.balance):"—"}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
