
function CrmModule({orders,pushNotif,customers:customersProp=SEED_CUSTOMERS,onUpdateCustomers,currentUser}){

  const [customers,setCustomers]=useState(customersProp);

  const syncCustomers=(fn)=>{

  const [customers,setCustomers]=useState(customersProp);
    setCustomers(next);

    if(onUpdateCustomers) onUpdateCustomers(next);

  };

  const [subView,  setSubView]  =useState("list");

  const [selected, setSelected] =useState(null);

  const [search,   setSearch]   =useState("");

  const [filterTag,setFilterTag]=useState("all");

  const [filterType,setFilterType]=useState("all");

  const [sortBy,   setSortBy]   =useState("revenue");

  const [crmTab,   setCrmTab]   =useState("customers"); // customers|analytics|calendar



  const stats=useMemo(()=>{

    const biz=customers.filter(c=>c.type==="business");

  const stats=useMemo(()=>{
    const totalLTV=customers.reduce((s,c)=>s+c.totalRevenue,0);

    // Events next 30 days

    const allEvents=customers.flatMap(c=>(c.events||[]).filter(e=>e.yearly).map(e=>({...e,customer:c,daysLeft:nextOccurrence(e.date)})));

    const upcoming30=allEvents.filter(e=>e.daysLeft<=30).sort((a,b)=>a.daysLeft-b.daysLeft);

    return{total:customers.length,biz:biz.length,personal:customers.length-biz.length,withDebt:withDebt.length,totalLTV,upcoming30};

  },[customers,orders]);



  const filtered=useMemo(()=>{

    let list=[...customers];

    if(search.trim()){const q=search.toLowerCase();list=list.filter(c=>c.name.toLowerCase().includes(q)||(c.companyName||"").toLowerCase().includes(q)||c.phone.includes(q)||(c.email||"").toLowerCase().includes(q));}

    if(filterTag!=="all")   list=list.filter(c=>c.tags.includes(filterTag));

    if(filterType!=="all")  list=list.filter(c=>c.type===filterType);

    list.sort((a,b)=>{

      if(sortBy==="revenue") return b.totalRevenue-a.totalRevenue;

      if(sortBy==="orders")  return b.totalOrders-a.totalOrders;

      if(sortBy==="recent")  return new Date(b.lastOrderDate)-new Date(a.lastOrderDate);

      return 0;

    });

    return list;

  },[customers,search,filterTag,filterType,sortBy]);



  const handleUpdate=(updated)=>{

                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",
    setSelected(updated);

  };



  if(subView==="detail"&&selected){

    const live=customers.find(c=>c.id===selected.id)||selected;

    return <CustomerDetail c={live} orders={orders} onBack={()=>setSubView("list")} onEdit={()=>{}} pushNotif={pushNotif} onUpdate={handleUpdate} currentUser={currentUser}/>;

  }



  return(

    <div>



      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>

        {[

          {l:"Tổng khách",     v:stats.total,              c:"#1e3a8a", icon:"👥"},

          {l:"Cá nhân",        v:stats.personal,           c:"#2563eb", icon:"👤"},

          {l:"Doanh nghiệp",   v:stats.biz,                c:"#5c2eb0", icon:"🏢"},

          {l:"Tổng LTV",       v:fmtS(stats.totalLTV)+"đ", c:"#1a4d8f", icon:"💰"},

          {l:"Doanh nghiệp",   v:stats.biz,                c:"#5c2eb0", icon:"🏢"},
        ].map(({l,v,c,icon})=>(

          <Card key={l} style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:10}}>

            <span style={{fontSize:22}}>{icon}</span>

            <div>

              <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:.4,marginBottom:2}}>{l}</div>

              <div style={{fontSize:20,fontWeight:700,color:c,fontVariantNumeric:"tabular-nums"}}>{v}</div>

            </div>

          </Card>

        ))}

      </div>





      <div style={{display:"flex",gap:2,background:"#e0e7ff",borderRadius:10,padding:3,marginBottom:16}}>

        {[

          ["customers","👥 Khách hàng"],

          ["analytics","📊 Phân tích KH"],

          ["calendar", "📅 Lịch sự kiện"],

        ].map(([k,l])=>(

          <button key={k} onClick={()=>setCrmTab(k)} style={{flex:1,padding:"7px 0",borderRadius:8,

        ].map(([k,l])=>(
          <button key={k} onClick={()=>setCrmTab(k)} style={{flex:1,padding:"7px 0",borderRadius:8,
    const biz=customers.filter(c=>c.type==="business");
        ))}

      </div>





      {crmTab==="analytics"&&<CrmAnalytics customers={customers} orders={orders} onSelectCustomer={c=>{setSelected(c);setSubView("detail");}}/>}





      {crmTab==="calendar"&&(

        <Card style={{marginBottom:14,padding:"12px 16px",border:"1px solid #fbcfe8",background:"#fff9fb"}}>

          <div style={{fontSize:13,fontWeight:600,color:"#be185d",marginBottom:10}}>📅 Sự kiện trong 30 ngày tới ({stats.upcoming30.length})</div>

          <div style={{display:"flex",flexDirection:"column",gap:6}}>

            {stats.upcoming30.slice(0,5).map((e,i)=>{

              const evCfg=CRM_EVENT_TYPES[e.type]||CRM_EVENT_TYPES.custom;

              return(

                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:"#fff",borderRadius:8,border:"1px solid #fce7f3",cursor:"pointer"}}

                  onClick={()=>{setSelected(e.customer);setSubView("detail");}}>

                  <span style={{fontSize:16}}>{evCfg.icon}</span>

                  <div style={{flex:1}}>

  },[customers,search,filterTag,filterType,sortBy]);



  const handleUpdate=(updated)=>{

  { id:"LEAD-002", name:"Trần Văn Sơn",      phone:"0912345002", source:"zalo",      need:"Tour Phú Quốc 4N3Đ gia đình",   pax:5,  budget:30000000,  departDate:"2025-08", stage:"quoted",     sale:"Trần Thị Lan",   note:"Đã gửi báo giá 2 options",              createdAt:"2025-06-02T10:00:00", lostReason:"" },
    setSelected(updated);

  };



  if(subView==="detail"&&selected){

    const live=customers.find(c=>c.id===selected.id)||selected;

    return <CustomerDetail c={live} orders={orders} onBack={()=>setSubView("list")} onEdit={()=>{}} pushNotif={pushNotif} onUpdate={handleUpdate} currentUser={currentUser}/>;

  }



  return(

      )}





      {crmTab==="customers"&&(

        <div>



          <Card style={{padding:"11px 14px",marginBottom:12,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>

            <input placeholder="🔍 Tìm khách hàng, công ty, SĐT, email..."

              value={search} onChange={e=>setSearch(e.target.value)}

              style={{flex:1,minWidth:180,padding:"7px 12px",border:"1px solid #dbeafe",borderRadius:8,fontSize:13,background:"#f8faff",outline:"none"}}/>

            <div style={{display:"flex",gap:4,background:"#e0e7ff",borderRadius:8,padding:2}}>

              {[["all","Tất cả"],["personal","👤 Cá nhân"],["business","🏢 DN"]].map(([k,l])=>(

            <div style={{display:"flex",gap:4,background:"#e0e7ff",borderRadius:8,padding:2}}>
              ))}

            </div>

            <Sel value={filterTag} onChange={e=>setFilterTag(e.target.value)} style={{width:"auto",padding:"7px 10px"}}>

              <option value="all">Tất cả tag</option>

              {CRM_TAGS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}

            </Sel>

            <Sel value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{width:"auto",padding:"7px 10px"}}>

              <option value="revenue">Theo doanh thu</option>

              <option value="orders">Theo số đơn</option>

              <option value="recent">Gần nhất</option>

            </Sel>

          </Card>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:12}}>

            {filtered.map(c=><CustomerCard key={c.id} c={c} orders={orders} onView={c=>{setSelected(c);setSubView("detail");}}/>)}

          </div>

          {filtered.length===0&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:13,padding:"40px 0"}}>Không tìm thấy khách hàng</div>}

        </div>

      )}

    </div>

  );

}



// ═══════════════════════════════════════════════════════════

// TIME LIMIT UTILITIES

// ═══════════════════════════════════════════════════════════


function ApprovalsModule({ orders, expenses, onExpenseUpdate, pushNotif, currentRole, currentUser, approvalThreshold=20000000 }){

  const [view,      setView]    = useState("list"); // list | detail | create

  const [selected,  setSelected]= useState(null);

  const [filterTab, setTab]     = useState("pending"); // pending | all

  const [filterRole,setFRole]   = useState("all");



  // Stats

  const stats = useMemo(()=>{

    const pending_kt  = expenses.filter(e=>e.status==="pending_kt");

    const pending_gd  = expenses.filter(e=>e.status==="pending_gd");

    const pending_pay = expenses.filter(e=>e.status==="pending_pay");

    const paid        = expenses.filter(e=>e.status==="paid");

    const overBudget  = expenses.filter(e=>budgetPct(e)>100&&e.status!=="rejected");

    const totalPaid   = paid.reduce((s,e)=>s+e.amount,0);

    const totalPending= [...pending_kt,...pending_gd,...pending_pay].reduce((s,e)=>s+e.amount,0);

    return{pending_kt:pending_kt.length,pending_gd:pending_gd.length,pending_pay:pending_pay.length,overBudget:overBudget.length,totalPaid,totalPending};

  },[expenses]);



  const myPending = useMemo(()=>{

    if(currentRole==="accountant") return expenses.filter(e=>e.status==="pending_kt"||e.status==="pending_pay");

    if(currentRole==="manager")    return expenses.filter(e=>e.status==="pending_gd");

    return [];

  },[expenses,currentRole]);



  const displayed = useMemo(()=>{

    let list = filterTab==="pending"

      ? expenses.filter(e=>!["paid","rejected","draft"].includes(e.status))

      : [...expenses];

    return list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  },[expenses,filterTab]);



  // Handlers passed to detail

  const handleApprove=(id)=>{

    const exp=expenses.find(e=>e.id===id);

    if(!exp) return;

    const exp=expenses.find(e=>e.id===id);
    let newStatus=exp.status;

    let escalated=false;

    if(exp.status==="pending_kt"){

      newStatus = exp.amount>=approvalThreshold ? "pending_gd" : "pending_pay";

      escalated = newStatus==="pending_gd";

    } else if(exp.status==="pending_gd"){

      newStatus="pending_pay";

    }

      newStatus="pending_pay";
    onExpenseUpdate({...exp,status:newStatus,auditLog:[...exp.auditLog,logEntry]});

    pushNotif(`Đã duyệt ${id}${escalated?" — chuyển Giám đốc":""}`,escalated?"warning":"success");

    setView("list");

  };



  const handleReject=(id,note)=>{

    const exp=expenses.find(e=>e.id===id);

    if(!exp) return;

    const exp=expenses.find(e=>e.id===id);
    const logEntry={ts:new Date(NOW_ISO).toISOString(),actor,role:currentRole,action:"rejected",note};

    onExpenseUpdate({...exp,status:"rejected",auditLog:[...exp.auditLog,logEntry]});

    const logEntry={ts:new Date(NOW_ISO).toISOString(),actor,role:currentRole,action:"rejected",note};
    setView("list");

  };



  const handlePaid=(id,ref)=>{

    const exp=expenses.find(e=>e.id===id);

    if(!exp) return;

    const exp=expenses.find(e=>e.id===id);
    if(!exp) return;
    const logEntry={ts:new Date(NOW_ISO).toISOString(),actor,role:"accountant",action:"paid",note};

    onExpenseUpdate({...exp,status:"paid",auditLog:[...exp.auditLog,logEntry]});

    pushNotif(`Đã ghi nhận chuyển tiền ${id} — ${fmt(exp.amount)} đ`,"success");

    setView("list");

  };



  const handleModify=(id,newAmount,note)=>{

    const exp=expenses.find(e=>e.id===id);

    if(!exp) return;

    const exp=expenses.find(e=>e.id===id);
    const logEntry={ts:new Date(NOW_ISO).toISOString(),actor,role:currentRole,action:"modified",note,oldAmount:exp.amount,newAmount};

    onExpenseUpdate({...exp,amount:newAmount,auditLog:[...exp.auditLog,logEntry]});

    pushNotif(`Đã sửa số tiền ${id}: ${fmt(exp.amount)} → ${fmt(newAmount)} đ`,"warning");

  };



  // ── Detail view ──

  if(view==="detail"&&selected){

    const live=expenses.find(e=>e.id===selected.id)||selected;

    return <ExpenseDetail

      exp={live} orders={orders} currentRole={currentRole}

      onApprove={handleApprove} onReject={handleReject}

      onPaid={handlePaid} onModify={handleModify}

      onBack={()=>setView("list")}

    />;

  }



  // ── List view ──

  return(

    <div>



      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>

        {[

          {label:"Chờ KT Trưởng",  val:stats.pending_kt,              c:"#7a5a00", bg:"#fef9e7"},

          {label:"Chờ Giám đốc",   val:stats.pending_gd,              c:"#5c2eb0", bg:"#f3f0ff"},

          {label:"Chờ chuyển tiền",val:stats.pending_pay,             c:"#1a4d8f", bg:"#e6f1fb"},

          {label:"Tổng chờ duyệt", val:fmtS(stats.totalPending)+" đ", c:"#b0554a", bg:"#fdf0ee"},

          {label:"Chờ chuyển tiền",val:stats.pending_pay,             c:"#1a4d8f", bg:"#e6f1fb"},
        ].map(({label,val,c,bg})=>(

          <div key={label} style={{background:"#fff",borderRadius:12,border:"1px solid #e8e6df",padding:"12px 14px"}}>

            <div style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:.4,marginBottom:4}}>{label}</div>

            <div style={{fontSize:20,fontWeight:700,color:c,fontVariantNumeric:"tabular-nums"}}>{val}</div>

          </div>

        ))}

      </div>





      {myPending.length>0&&(

        <div style={{background:"#fef9e7",border:"1px solid #e8c53a",borderRadius:10,padding:"12px 16px",marginBottom:14}}>

          <div style={{fontSize:13,fontWeight:600,color:"#7a5a00",marginBottom:10}}>

            ⏳ Cần bạn xử lý ngay — {myPending.length} phiếu

          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8}}>

            {myPending.map(exp=>{

              const bl=budgetLabel(exp);

              return(

                <div key={exp.id} onClick={()=>{setSelected(exp);setView("detail");}}

                  style={{background:"#fff",borderRadius:8,border:"1px solid #e8c53a",padding:"10px 12px",cursor:"pointer"}}>

                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>

                    <span style={{fontWeight:700,fontSize:12,color:"#2563eb"}}>{exp.id}</span>

                    <SBadge status={exp.status} cfg={EXP_PIPELINE_STATUS} size="sm"/>

                  </div>

                  <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{exp.ncc}</div>

                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>

                    <span style={{fontSize:15,fontWeight:700,color:"#b0554a",fontVariantNumeric:"tabular-nums"}}>{fmt(exp.amount)} đ</span>

                    <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:20,background:bl.bg,color:bl.color}}>{bl.label}</span>

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      )}





      <div style={{display:"flex",gap:6,marginBottom:12}}>

        {[["pending","⏳ Đang xử lý"],["all","📋 Tất cả"]].map(([k,l])=>(

      <div style={{display:"flex",gap:6,marginBottom:12}}>
        ))}

      </div>



      <Card style={{padding:0,overflow:"hidden"}}>

        <div style={{overflowX:"auto"}}>

          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>

            <thead><tr style={{background:"#f0f4ff",borderBottom:"1px solid #e8e6df"}}>

              {["Mã PC","Đơn hàng","NCC / Nội dung","PNR","Số tiền","Ngân sách","Trạng thái","Tạo bởi",""].map(h=>(

                <th key={h} style={{padding:"9px 12px",textAlign:"left",fontWeight:600,color:"#555",fontSize:11,textTransform:"uppercase",letterSpacing:.3,whiteSpace:"nowrap"}}>{h}</th>

              ))}

            </tr></thead>

            <tbody>

              {displayed.length===0&&<tr><td colSpan={9} style={{padding:"32px",textAlign:"center",color:"#aaa",fontSize:13}}>Không có phiếu chi nào</td></tr>}

              {displayed.map((exp,i)=>{

                const bl=budgetLabel(exp);

              {displayed.map((exp,i)=>{
                return(

                  <tr key={exp.id}

                    style={{borderBottom:"1px solid #f0efe8",background:rowBg,cursor:"pointer"}}

                    onMouseEnter={e=>e.currentTarget.style.background="#f0f8f5"}

                    onMouseLeave={e=>e.currentTarget.style.background=rowBg}

                    onClick={()=>{setSelected(exp);setView("detail");}}>

                    <td style={{padding:"10px 12px",fontWeight:600,color:"#2563eb",whiteSpace:"nowrap"}}>{exp.id}</td>

                    <td style={{padding:"10px 12px"}}>

                      <div style={{fontWeight:500}}>{exp.orderId}</div>

                      <div style={{fontSize:11,color:"#aaa"}}>{exp.orderName}</div>

                    </td>

                    <td style={{padding:"10px 12px",maxWidth:200}}>

                      <div style={{fontWeight:500}}>{exp.ncc}</div>

                      <div style={{fontSize:11,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:190}}>{exp.note}</div>

                    </td>

                    <td style={{padding:"10px 12px"}}><span style={{fontFamily:"monospace",fontSize:12,fontWeight:600,color:"#1a4d8f"}}>{exp.pnrCode||"—"}</span></td>

                    <td style={{padding:"10px 12px",fontWeight:700,color:"#b0554a",fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap"}}>{fmt(exp.amount)} đ</td>

                    <td style={{padding:"10px 12px"}}>

                      <span style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:20,background:bl.bg,color:bl.color}}>{bl.label}</span>

                    </td>

                    <td style={{padding:"10px 12px"}}><SBadge status={exp.status} cfg={EXP_PIPELINE_STATUS} size="sm"/></td>

                    <td style={{padding:"10px 12px",fontSize:12,color:"#666"}}>{exp.createdBy}</td>

                    <td style={{padding:"10px 12px"}}><Btn size="sm" variant="outline" onClick={e=>{e.stopPropagation();setSelected(exp);setView("detail");}}>Xem →</Btn></td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

        <div style={{padding:"8px 14px",borderTop:"1px solid #f0efe8",fontSize:12,color:"#aaa"}}>{displayed.length} phiếu chi</div>

      </Card>

    </div>

  );

}



// ═══════════════════════════════════════════════════════════

// REFUND MODULE — Hoàn tiền / Hủy tour (nhập tự do)

// ═══════════════════════════════════════════════════════════



// ── Live refund calculator ────────────────────────────────


function CloseOrderModule({orders,vouchers,expenses,refunds,onCloseOrder,pushNotif,currentRole,currentUser}){

  const [selected,setSelected]=useState(null);

  const [vatInput,setVatInput]=useState({});   // orderId -> vatInvoiceNumber

  const [filterTab,setFilterTab]=useState("ready"); // ready | closed | all



  // Compute closing conditions for each order

  const orderSummaries=useMemo(()=>{

    return orders.map(o=>{

      const thuOK  =vouchers.filter(v=>v.orderId===o.id&&v.type==="thu"&&v.status==="approved").reduce((s,v)=>s+v.amount,0);

      const chiOK  =expenses.filter(e=>e.orderId===o.id&&e.status==="paid").reduce((s,e)=>s+e.amount,0);

      const refundOK=refunds.filter(r=>r.orderId===o.id&&r.status==="paid").reduce((s,r)=>s+(r.refundAmount-r.nccRecovery),0);

      const orderTotal = calcOrderTotal(o); // VAT-aware

      const cost   =o.pricing?.totalCost||0;

      const congNoKH  = orderTotal - thuOK;

      const congNoNCC =cost-chiOK;

      const actualRevenue=thuOK-refundOK;

      const actualProfit =actualRevenue-chiOK;

      const actualProfitPct=actualRevenue>0?(actualProfit/actualRevenue*100):0;

      const hasVat=!!(vatInput[o.id]);



      const cond={

        cong_no_kh:  congNoKH<=0,

        cong_no_ncc: congNoNCC<=0,

      if(p.serviceType) setSvc(p.serviceType);

      };

      const readyToClose=Object.values(cond).every(Boolean)&&!["completed","cancelled"].includes(o.status);

      const alreadyClosed=o.status==="completed";

      return{...o,thuOK,chiOK,refundOK,congNoKH,congNoNCC,actualRevenue,actualProfit,actualProfitPct,cond,readyToClose,alreadyClosed};

    });


function QuoteModule({ quotes, onUpdate, orders, tourPrograms, currentUser, pushNotif, onCreateOrder }){

  const [subView, setSubView] = useState("list"); // list | form | detail

  const [selected, setSelected] = useState(null);



  const handleSave = (q) => {

    if(selected){

  const handleSave = (q) => {
    } else {

      onUpdate([...quotes, q]);

    }

    setSelected(q); setSubView("detail");

    pushNotif(`Đã lưu bản chào giá: ${q.title}`,"success");

  };



  if(subView==="form"){

    return <QuoteForm

      initial={selected} quotes={quotes}

      tourPrograms={tourPrograms} currentUser={currentUser}

      onSave={handleSave}

      tourPrograms={tourPrograms} currentUser={currentUser}
      pushNotif={pushNotif}

    />;

  }



  if(subView==="detail"&&selected){

    const q = quotes.find(x=>x.id===selected.id)||selected;

    return <QuoteDetail

      quote={q}

      onBack={()=>setSubView("list")}

      onEdit={()=>{setSelected(q);setSubView("form");}} onCreateOrder={onCreateOrder}

      pushNotif={pushNotif}

    />;

  }



  // LIST

  const STATUS_CFG = {

    draft:  {label:"Nháp",       color:"#7a5a00",bg:"#fef9e7",icon:"📝"},

    sent:   {label:"Đã gửi KH",  color:"#2563eb",bg:"#eff6ff",icon:"📤"},

    accepted:{label:"Đã chốt",   color:"#1d6b4f",bg:"#e8f5ef",icon:"✅"},

    rejected:{label:"Không chốt",color:"#8b2a1a",bg:"#fdf0ee",icon:"❌"},

  };



  return(

    <div>

      <PageHeader

        title="Bản chào giá"

        subtitle="Tạo, quản lý và xuất bản chào giá gửi khách hàng"

        actions={<Btn onClick={()=>{setSelected(null);setSubView("form");}}>+ Tạo bản chào giá mới</Btn>}

      />



      />
        <EmptyState icon="📄" title="Chưa có bản chào giá nào" desc="Tạo bản chào giá để gửi cho khách hàng trước khi chốt đơn" action={<Btn onClick={()=>{setSelected(null);setSubView("form");}}>+ Tạo bản chào giá đầu tiên</Btn>}/>

      ):(

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>

          {[...quotes].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(q=>{

            const st = STATUS_CFG[q.status]||STATUS_CFG.draft;

            const totalItems = (q.items||[]).length;

            const totalAmt   = (q.items||[]).reduce((s,i)=>s+(i.totalPrice||0),0);

            return(

              <Card key={q.id} style={{cursor:"pointer",transition:"box-shadow .15s"}}

                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(30,58,138,.15)"}

                onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}

                onClick={()=>{setSelected(q);setSubView("detail");}}>

                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>

                  <div style={{flex:1,paddingRight:8}}>

                    <div style={{fontSize:13,fontWeight:700,color:"#1e3a8a",marginBottom:2}}>{q.title}</div>

                    <div style={{fontSize:11,color:"#64748b"}}>{q.customerName||"Chưa có KH"}</div>

                  </div>

                  <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,

                    background:st.bg,color:st.color,flexShrink:0,height:"fit-content"}}>

                    {st.icon} {st.label}

                  </span>

                </div>

                <div style={{display:"flex",gap:12,fontSize:11,color:"#64748b",marginBottom:10}}>

                  <span>📦 {totalItems} hạng mục</span>

                  <span style={{fontWeight:600,color:"#1a4d8f",fontVariantNumeric:"tabular-nums"}}>

                    {fmtS(totalAmt)}đ

                  </span>

                  <span>📅 {fmtD(q.createdAt)}</span>

                </div>

                <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>

                </div>
                </div>

                <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>

                  <Btn size="sm" variant="outline" onClick={e=>{e.stopPropagation();setSelected(q);setSubView("form");}}>✏️ Sửa</Btn>

                  <Btn size="sm" onClick={e=>{e.stopPropagation();setSelected(q);setSubView("detail");}}>Xem →</Btn>

                </div>

              </Card>

            );

          })}

        </div>

      )}

    </div>

  );

}



// ── QuoteDetail — Xem + Xuất Word/Excel ──────────────────


function TourProgramForm({ initial, onSave, onCancel, pushNotif, tourPrograms }){

  const isEdit = !!initial;

  const genId = () => `TP-${String((tourPrograms||[]).length+1).padStart(3,"0")}`;



  // ?? Basic info ?????????????????????????????????????????


function TourProgramModule({ tourPrograms, onUpdate, currentRole, pushNotif, currentUser }){

  const [subView,    setSubView]    = useState("list");

  const [selected,   setSelected]   = useState(null);

  const [paxCount,   setPaxCount]   = useState(30);

  const [season,     setSeason]     = useState("normal");

  const [margin,     setMargin]     = useState(12);



  const canEdit = currentRole==="manager"||currentRole==="dieu_hanh";



  // ── Tính giá thành theo số khách + mùa ────────────────

  function calcCost(tp, pax, seasonKey){

    const priceKey = seasonKey==="peak"?"pricePeak":seasonKey==="weekend"?"priceWeekend":"priceNormal";

    let totalCost = 0;

    (tp.costItems||[]).forEach(ci=>{

      const unitPrice = ci[priceKey]||0;

      const isPerPerson = ["food","accessory","guide","sightseeing"].includes(ci.group)||["người","suất","vé","ngày"].includes(ci.unit);

      totalCost += isPerPerson ? unitPrice*(ci.qty||1)*pax : unitPrice*(ci.qty||1);

    });

    return totalCost;

  }



  function calcSellPrice(cost, pax, marginPct, vatRate){


    const priceNoVat  = Math.round(costPerPax*(1+marginPct/100));

    const vatAmt      = Math.round(priceNoVat*vatRate/100);

    return { costPerPax, priceNoVat, vatAmt, priceWithVat:priceNoVat+vatAmt,

    const vatAmt      = Math.round(priceNoVat*vatRate/100);
  }



  // ── FORM VIEW ──────────────────────────────────────────

  if(subView==="form"){

    return <TourProgramForm

      initial={selected}

      onSave={(tp)=>{

        if(selected){

      onSave={(tp)=>{
          pushNotif(`Đã cập nhật "${tp.name}"`,"success");

        } else {

          onUpdate([...tourPrograms, tp]);

          pushNotif(`Đã tạo chương trình "${tp.name}"`,"success");

        }

        setSelected(tp); setSubView("detail");

      }}

        setSelected(tp); setSubView("detail");
      pushNotif={pushNotif}

      tourPrograms={tourPrograms}

    />;

  }



  // ── Export Word ───────────────────────────────────────

  const handleExportWord = async (tp) => {

    pushNotif("Đang tạo file Word...","warning");

    try {

      // Build HTML content rồi convert thành .doc (HTML-based Word)

      const logoUrl = "/LogoMV.png";

      const dateStr = new Date(NOW_ISO).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});



      const priceTableRows = (tp.priceOptions||[]).map(opt=>`

        <tr>

          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${opt.name}</td>

    id:"opt1",name:"Option 1",adultPrice:0,childPrice:0,babyPrice:0,vatRate:8,note:""

  }]);

  const addOption = () => setPriceOptions(prev=>[...prev,{

    id:`opt${Date.now()}`,name:`Option ${prev.length+1}`,

    adultPrice:0,childPrice:0,babyPrice:0,vatRate:8,note:""

  }]);

  const updateOption = (idx,field,val) =>

    const vRej=vouchers.find(x=>x.id===voucherId);

  const removeOption = (idx) =>

    setPriceOptions(prev=>prev.filter((_,i)=>i!==idx));



  // ?? Included / Excluded ????????????????????????????????

  const [included, setIncluded] = useState(initial?.included||[""]);

  const [excluded, setExcluded] = useState(initial?.excluded||[""]);



  // ?? Payment & Cancel policy ????????????????????????????

  const [deposit,      setDeposit]      = useState(initial?.paymentPolicy?.deposit||70);

  const [depositNote,  setDepositNote]  = useState(initial?.paymentPolicy?.depositNote||"Ð?t c?c ngay sau khi xác nh?n d?ch v?");

  const [finalNote,    setFinalNote]    = useState(initial?.paymentPolicy?.finalNote||"Thanh toán 100% ph?n c?n l?i sau khi k?t thúc tour");

  const [cancelPolicy, setCancelPolicy] = useState(initial?.cancelPolicy||[

    {before:"Trý?c 03 ngày kh?i hành",fee:50},

    {before:"Trong v?ng 48 gi? trý?c kh?i hành",fee:80},

    {before:"Trong v?ng 24 gi? ho?c ngày kh?i hành",fee:100},

  ]);

  const [paxPolicy, setPaxPolicy] = useState(initial?.paxPolicy||"");



  // ?? Step navigation ????????????????????????????????????

  const [step, setStep] = useState(1); // 1=Info 2=Itinerary 3=Cost 4=Price 5=Policy



  const STEPS = [

    {n:1,l:"Thông tin"},

    {n:2,l:"L?ch tr?nh"},

    {n:3,l:"Chi phí NCC"},

    {n:4,l:"B?ng giá"},

    {n:5,l:"Chính sách"},

  ];



  const inp = {width:"100%",padding:"8px 10px",border:"1px solid #dbeafe",borderRadius:8,

    fontSize:13,background:"#f8faff",outline:"none",color:"#1e293b",boxSizing:"border-box"};

  const textarea = {...inp,minHeight:70,resize:"vertical",lineHeight:1.5};



  const handleSave = () => {

    if(!name.trim()||!route.trim()){pushNotif("Nh?p tên và tuy?n tour","error");return;}

    const tp = {

      id: initial?.id||genId(),

      name,route,days,nights,type,theme,targetGroup,purpose,paxFrom,paxTo,status,slogan,

      itinerary:itinerary.map(d=>({...d,activities:d.activities.filter(a=>a.desc.trim())})),

      costItems,priceOptions,

      included:included.filter(s=>s.trim()),

      excluded:excluded.filter(s=>s.trim()),

      paymentPolicy:{deposit,depositNote,finalNote},

      cancelPolicy,paxPolicy,

      organizer:"Minh Vi?t Travel",

      createdBy:"dieu.hanh",

      createdAt:initial?.createdAt||new Date(NOW_ISO).toISOString(),

      updatedAt:new Date(NOW_ISO).toISOString(),

    };

    onSave(tp);

  };



  // ?? Tính giá thành realtime ????????????????????????????

  const calcLivePrice = (pax=30, marg=12) => {

    const priceKey = "priceNormal";

    let cost = 0;

    costItems.forEach(ci=>{

      const isPerPerson=["food","accessory","guide","sightseeing"].includes(ci.group)||["ngý?i","su?t","vé","ngày"].includes(ci.unit);

      cost += isPerPerson?(ci[priceKey]||0)*(ci.qty||1)*pax:(ci[priceKey]||0)*(ci.qty||1);

    });

    const cPerPax = pax>0?cost/pax:0;

    return {cost, cPerPax, sell:Math.round(cPerPax*(1+marg/100))};

  };

  const live = calcLivePrice(paxFrom, 12);



  return(

    <div style={{maxWidth:900,margin:"0 auto"}}>



      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>

        <Btn variant="outline" size="sm" onClick={onCancel}>? {isEdit?"H?y s?a":"H?y"}</Btn>

        <div>

          <div style={{fontSize:18,fontWeight:700,color:"#1e3a8a"}}>

            {isEdit?"?? Ch?nh s?a chýõng tr?nh":"?? T?o chýõng tr?nh tour m?i"}

          </div>

          {name&&<div style={{fontSize:12,color:"#64748b",marginTop:1}}>{name}</div>}

        </div>

        <div style={{marginLeft:"auto",display:"flex",gap:8}}>

          <Btn variant="outline" onClick={handleSave}>?? Lýu nháp</Btn>

          <Btn onClick={()=>{setStatus("approved");handleSave();}}>? Lýu & Duy?t</Btn>

        </div>

      </div>





      <div style={{display:"flex",gap:2,background:"#e0e7ff",borderRadius:10,padding:3,marginBottom:16}}>

        {STEPS.map(s=>(

          <button key={s.n} onClick={()=>setStep(s.n)}

            style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",

              background:step===s.n?"#fff":"transparent",

              fontWeight:step===s.n?600:400,fontSize:12,cursor:"pointer",

              color:step===s.n?"#1e3a8a":"#64748b",

              boxShadow:step===s.n?"0 1px 4px rgba(30,58,138,.12)":"none"}}>

            {s.n}. {s.l}

          </button>

        ))}

      </div>



      <Card>



        {step===1&&(

          <div>

            <div style={{fontSize:14,fontWeight:600,color:"#1e3a8a",marginBottom:16}}>?? Thông tin cõ b?n</div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>

              <div style={{gridColumn:"1/-1"}}>

                <FieldWrap label="Tên chýõng tr?nh tour *">

                  <input value={name} onChange={e=>setName(e.target.value)}

                    placeholder="VD: HÀNH TR?NH V? NGU?N & TR?I NGHI?M VÃN HÓA" style={inp}/>

                </FieldWrap>

              </div>

              <div style={{gridColumn:"1/-1"}}>

                <FieldWrap label="Tuy?n / L? tr?nh *">

                  <input value={route} onChange={e=>setRoute(e.target.value)}

  } = useSupabase();

                </FieldWrap>

              </div>

  const [bookings, setBookings] = useState(SEED_NCC_BOOKINGS);

                <input type="number" value={days} min={1} max={30}

                  onChange={e=>handleDaysChange(+e.target.value)} style={{...inp,textAlign:"center"}}/>

              </FieldWrap>

  const [outputInvoices,setOutputInvoices]=useState(SEED_OUTPUT_INVOICES);

                <input type="number" value={nights} min={0} max={30}

                  onChange={e=>setNights(+e.target.value)} style={{...inp,textAlign:"center"}}/>

              </FieldWrap>

  const [careTasks,setCareTasks]=useState(()=>{

                <Sel value={type} onChange={e=>setType(e.target.value)}>

    return(

      <div>

        <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16,flexWrap:"wrap"}}>

          <Btn variant="outline" size="sm" onClick={()=>setSubView("list")}>← Danh sách</Btn>

          <div style={{flex:1}}>

            <div style={{fontSize:18,fontWeight:700,color:"#1e3a8a"}}>{tp.name}</div>

            <div style={{fontSize:13,color:"#64748b"}}>{tp.route} · {tp.days}N{tp.nights}Đ</div>

          </div>

          <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap"}}>

            <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",

              borderRadius:20,background:stCfg.bg,border:`1px solid ${stCfg.color}30`,

              fontSize:12,fontWeight:600,color:stCfg.color}}>

              {stCfg.icon} {stCfg.label}

            </span>

            <Btn size="sm" variant="outline" onClick={()=>handleExportWord(tp)}>📄 Xuất Word</Btn>

            {canEdit&&<Btn size="sm" onClick={()=>{setSelected(tp);setSubView("form");}}>✏️ Chỉnh sửa</Btn>}

          </div>

        </div>



        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:14,alignItems:"start"}}>

          <div>



            <Card style={{marginBottom:12}}>

              <div style={{fontSize:14,fontWeight:600,color:"#1e3a8a",marginBottom:12}}>📅 Lịch trình chi tiết</div>

              {(tp.itinerary||[]).map(day=>(

                <div key={day.day} style={{marginBottom:16}}>

                  <div style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb)",color:"#fff",

                    borderRadius:8,padding:"8px 14px",marginBottom:8}}>

                    <div style={{fontSize:13,fontWeight:700}}>NGÀY {day.day}: {day.title}</div>

                    <div style={{fontSize:11,opacity:.8}}>🍽 Ăn: {day.meals}</div>

                  </div>

                  {(day.activities||[]).map((a,i)=>(

                    <div key={i} style={{display:"flex",gap:10,padding:"5px 0",

                      borderBottom:"0.5px solid #e0e7ff",alignItems:"flex-start"}}>

                      <span style={{fontSize:12,fontWeight:700,color:"#1e3a8a",

                        minWidth:48,flexShrink:0}}>{a.time}</span>

                      <span style={{fontSize:12,color:"#475569",lineHeight:1.5}}>{a.desc}</span>

                    </div>

                  ))}

                </div>

              ))}

            </Card>





            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>

              <Card>

                <div style={{fontSize:13,fontWeight:600,color:"#1d6b4f",marginBottom:8}}>✅ Bao gồm</div>

                {(tp.included||[]).map((i,idx)=>(

                  <div key={idx} style={{fontSize:12,color:"#475569",padding:"3px 0",

                    borderBottom:"0.5px solid #e0e7ff"}}>✓ {i}</div>

                  <div key={idx} style={{fontSize:12,color:"#475569",padding:"3px 0",
            </div>

            {itinerary.map((day,dayIdx)=>(

              <div key={dayIdx} style={{marginBottom:20,border:"1px solid #dbeafe",borderRadius:12,overflow:"hidden"}}>



                <div style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb)",padding:"10px 14px",

                  display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>

                  <span style={{color:"#fff",fontWeight:700,fontSize:13,flexShrink:0}}>

                    NGÀY {day.day}

                  </span>

                  <input value={day.title} onChange={e=>updateDay(dayIdx,"title",e.target.value)}



                    style={{flex:1,minWidth:200,padding:"5px 10px",borderRadius:6,border:"none",

                      background:"rgba(255,255,255,.15)",color:"#fff",fontSize:13,outline:"none",

                      "::placeholder":{color:"rgba(255,255,255,.5)"}}}/>

                  <div style={{display:"flex",alignItems:"center",gap:6}}>

        return o;

                    <select value={day.meals} onChange={e=>updateDay(dayIdx,"meals",e.target.value)}

                      style={{padding:"4px 8px",borderRadius:6,border:"none",

                        background:"rgba(255,255,255,.2)",color:"#fff",fontSize:12,outline:"none"}}>

          });

                        <option key={m} value={m} style={{color:"#1e293b"}}>{m}</option>

                      ))}

                    </select>

                  </div>

                </div>





                <div style={{padding:"10px 14px"}}>

                  {day.activities.map((act,actIdx)=>(

                    <div key={actIdx} style={{display:"grid",

                      gridTemplateColumns:"90px 1fr 32px",gap:6,marginBottom:6,alignItems:"center"}}>

                      <input value={act.time} onChange={e=>updateActivity(dayIdx,actIdx,"time",e.target.value)}

                        placeholder="07:00" style={{...inp,textAlign:"center",fontWeight:600,color:"#1e3a8a"}}/>

                      <input value={act.desc} onChange={e=>updateActivity(dayIdx,actIdx,"desc",e.target.value)}

          }

                      <button onClick={()=>removeActivity(dayIdx,actIdx)}

                        style={{background:"none",border:"none",cursor:"pointer",

                          fontSize:18,color:"#b0554a",lineHeight:1,padding:0}}>×</button>

                    </div>

                  ))}

                  <button onClick={()=>addActivity(dayIdx)}

                    style={{marginTop:4,fontSize:12,color:"#2563eb",background:"none",

                      border:"1px dashed #bfdbfe",borderRadius:6,padding:"5px 14px",

                      cursor:"pointer",width:"100%"}}>

            return [task,...tasks];

                  </button>

                </div>

              </div>

            ))}





            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:8}}>

              <div>

    // Ghi audit log tự động khi trạng thái đổi

                {included.map((item,i)=>(

                  <div key={i} style={{display:"flex",gap:6,marginBottom:5}}>

          (ORDER_STATUS[prevOrder.status]?.label||prevOrder.status)+" → "+

      finalOrder={...updated,auditLog:[...(updated.auditLog||[]),entry]};

                    <button onClick={()=>setIncluded(prev=>prev.filter((_,j)=>j!==i))}

                      style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#b0554a",padding:0}}>×</button>

                  </div>

                ))}

                <button onClick={()=>setIncluded(prev=>[...prev,""])}

                  style={{fontSize:12,color:"#1d6b4f",background:"none",border:"1px dashed #bbf7d0",

                    borderRadius:6,padding:"4px 12px",cursor:"pointer",width:"100%"}}>+ Thêm</button>

              </div>

              <div>

  const handleReject=(voucherId)=>{

                {excluded.map((item,i)=>(

                  <div key={i} style={{display:"flex",gap:6,marginBottom:5}}>

                    <input value={item} onChange={e=>setExcluded(prev=>prev.map((x,j)=>j===i?e.target.value:x))}

    // Kiểm tra trùng đơn: cùng khách + cùng ngày đi + cùng loại dịch vụ

                    <button onClick={()=>setExcluded(prev=>prev.filter((_,j)=>j!==i))}

                      style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#b0554a",padding:0}}>×</button>

                  </div>

                ))}

                <button onClick={()=>setExcluded(prev=>[...prev,""])}

                  style={{fontSize:12,color:"#b0554a",background:"none",border:"1px dashed #fecaca",

                    borderRadius:6,padding:"4px 12px",cursor:"pointer",width:"100%"}}>+ Thêm</button>

              </div>

            </div>



            <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>

      }

    // Cập nhật CRM nếu khách đã có

            </div>

          </div>

        )}





        {step===3&&(

          <div>

            <div style={{fontSize:14,fontWeight:600,color:"#1e3a8a",marginBottom:4}}>

        const thuOk = updatedVouchers

            </div>

            <div style={{fontSize:11,color:"#64748b",marginBottom:14}}>

        const newStatus = thuOk>=orderTotal?"full_paid":thuOk>0?"partial_paid":baseStatus;

            </div>





            <div style={{display:"grid",gridTemplateColumns:"120px 1fr 80px 80px 100px 100px 100px 32px",

              gap:6,marginBottom:6,paddingLeft:2}}>

      // Hoàn ngược CRM stats

                <span key={h} style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:.3}}>{h}</span>

              ))}

            </div>



            {costItems.map((ci,i)=>(

              <div key={ci.id||i} style={{display:"grid",

                gridTemplateColumns:"120px 1fr 80px 80px 100px 100px 100px 32px",

                gap:6,marginBottom:6,alignItems:"center"}}>

                <select value={ci.group} onChange={e=>updateCostItem(i,"group",e.target.value)}

                  style={{...inp,padding:"6px 6px",fontSize:11}}>

                  {COST_GROUPS.map(g=><option key={g.id} value={g.id}>{g.icon} {g.label}</option>)}

                </select>

                <input value={ci.name} onChange={e=>updateCostItem(i,"name",e.target.value)}

      status:"pending_payment", totalPaid:0, payments:[], paymentDeadline2:"",

                <input value={ci.unit} onChange={e=>updateCostItem(i,"unit",e.target.value)}

    }

                <input type="number" value={ci.qty} min={0}

                  onChange={e=>updateCostItem(i,"qty",+e.target.value)}

                  style={{...inp,padding:"6px 6px",textAlign:"center"}}/>

                {["priceNormal","priceWeekend","pricePeak"].map(pk=>(

                  <input key={pk} type="number" value={ci[pk]||0}

                    onChange={e=>updateCostItem(i,pk,+e.target.value)}

                    style={{...inp,padding:"6px 6px",textAlign:"right",

                      background:pk==="pricePeak"?"#fef9e7":pk==="priceWeekend"?"#f0fdf4":"#f8faff"}}/>

                ))}

                <button onClick={()=>removeCostItem(i)}

                  style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#b0554a"}}>×</button>

              </div>

            ))}



            <button onClick={addCostItem}

              style={{width:"100%",marginTop:6,fontSize:12,color:"#2563eb",background:"none",

                border:"1px dashed #bfdbfe",borderRadius:8,padding:"8px 0",cursor:"pointer"}}>

        return[newCust,...cs];

            </button>





            <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>

              <span style={{fontSize:11,color:"#64748b",alignSelf:"center"}}>Thêm nhanh:</span>

              {[

      pushNotif(`${updated.id}: Đã chuyển tiền ${fmt(updated.amount)} đ cho ${updated.ncc}`,"success",{role:"manager"});

      if(updated.bookingRef){

          if(b.id!==updated.bookingRef) return b;

                {group:"guide",name:"HDV",unit:"ngày",qty:1},

        };

                {group:"event",name:"Ca s?",unit:"ca s?",qty:1},

                {group:"event",name:"Backdrop",unit:"cái",qty:1},

        }));

  };

  const handleExpenseUpdate=(updated)=>{

    if(updated.status==="pending_gd"){

      sendTelegram(TG_MSG.expenseNeedsGD(updated),{event:"expense"});}

              ].map(preset=>(

                <button key={preset.name} onClick={()=>setCostItems(prev=>[...prev,{

                  id:`ci${Date.now()}`,priceNormal:0,priceWeekend:0,pricePeak:0,...preset

                }])}

                  style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:"1px solid #dbeafe",

                    background:"#eff6ff",color:"#1e3a8a",cursor:"pointer"}}>

                  + {preset.name}

                </button>

              ))}

            </div>





            {costItems.length>0&&(

              <div style={{marginTop:14,padding:"12px 14px",background:"#f0f4ff",borderRadius:10,

                border:"1px solid #bfdbfe"}}>

                <div style={{fontSize:12,fontWeight:600,color:"#1e3a8a",marginBottom:6}}>

      const cancelledOrder = orders.find(o=>o.id===updated.orderId);

                </div>

                <div style={{display:"flex",gap:16,fontSize:12}}>

          return {

            totalOrders:  Math.max(0,(c.totalOrders||0)-1),

            totalProfit:  Math.max(0,(c.totalProfit||0)-profit),

                </div>

              </div>

            )}



            <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>

          orderName:updated.orderName||updated.orderId,

          amount:netRefund,

            </div>

          </div>

        )}





        {step===4&&(

          <div>

            <div style={{fontSize:14,fontWeight:600,color:"#1e3a8a",marginBottom:4}}>

      const netRefund=updated.refundAmount-(updated.nccRecovery||0);

            </div>

            <div style={{fontSize:11,color:"#64748b",marginBottom:14}}>

            id:creditId,

            </div>



            {priceOptions.map((opt,i)=>(

              <div key={opt.id||i} style={{marginBottom:12,padding:"14px",background:"#f8faff",

                border:"1px solid #dbeafe",borderRadius:10}}>

                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>

                  <input value={opt.name} onChange={e=>updateOption(i,"name",e.target.value)}

          };

                    style={{...inp,fontWeight:600,color:"#1e3a8a",flex:1,marginRight:8}}/>

                  {priceOptions.length>1&&(

                    <button onClick={()=>removeOption(i)}

                      style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#b0554a"}}>×</button>

                  )}

                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 80px",gap:10}}>

                  {[

                    {l:"Giá ngý?i l?n (ð)",k:"adultPrice"},

                    {l:"Giá tr? em (ð)",k:"childPrice"},

                    {l:"Giá em bé (ð)",k:"babyPrice"},

                  ].map(({l,k})=>(

                    <FieldWrap key={k} label={l}>

                      <input type="number" value={opt[k]||0}

                        onChange={e=>updateOption(i,k,+e.target.value)}

                        style={{...inp,textAlign:"right",fontWeight:600}}/>

                    </FieldWrap>

                  ))}

                  <FieldWrap label="VAT %">

                    <Sel value={opt.vatRate} onChange={e=>updateOption(i,"vatRate",+e.target.value)}>

                      {[0,5,8,10].map(r=><option key={r} value={r}>{r}%</option>)}

                    </Sel>

                  </FieldWrap>

                </div>

        {view==="approvals"&&<ApprovalsModule orders={orders} expenses={expenses} onExpenseUpdate={handleExpenseUpdate} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser} approvalThreshold={approvalThreshold}/>}

                  <input value={opt.note||""} onChange={e=>updateOption(i,"note",e.target.value)}

        {view==="quotes"&&<QuoteModule quotes={quotes} onUpdate={setQuotes} orders={orders} tourPrograms={tourPrograms} currentUser={currentUser} pushNotif={pushToast} onCreateOrder={(data)=>{handleCreateOrder(data);setView("create");}}/>}

                </FieldWrap>



                {opt.adultPrice>0&&(

                  <div style={{marginTop:6,padding:"6px 10px",background:"#eff6ff",borderRadius:7,fontSize:12}}>

                    Giá NL có VAT: <strong style={{color:"#1e3a8a",fontVariantNumeric:"tabular-nums"}}>

                      {fmt(Math.round(opt.adultPrice*(1+opt.vatRate/100)))}ð

                    </strong>

                    {live.cPerPax>0&&opt.adultPrice>0&&(

                      <span style={{marginLeft:12,color:"#64748b"}}>

                        Biên l?i nhu?n: <strong style={{color:opt.adultPrice>live.cPerPax?"#1d6b4f":"#b0554a"}}>

                          {live.cPerPax>0?((opt.adultPrice-live.cPerPax)/live.cPerPax*100).toFixed(1):0}%

                        </strong>

                      </span>

                    )}

                  </div>

                )}

              </div>

            ))}



            <button onClick={addOption}

              style={{width:"100%",marginTop:4,fontSize:12,color:"#2563eb",background:"none",

                border:"1px dashed #bfdbfe",borderRadius:8,padding:"8px 0",cursor:"pointer"}}>

              + Thêm option giá

            </button>



            <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>

              <Btn variant="outline" onClick={()=>setStep(3)}>? Quay l?i</Btn>

              <Btn onClick={()=>setStep(5)}>Ti?p theo: Chính sách ?</Btn>

            </div>

          </div>

        )}





        {step===5&&(

          <div>

            <div style={{fontSize:14,fontWeight:600,color:"#1e3a8a",marginBottom:16}}>

              ?? Quy ð?nh thanh toán & hoàn h?y

            </div>



            <div style={{marginBottom:16}}>

            onNotif={()=>setShowNotif(v=>!v)}

              <div style={{display:"grid",gridTemplateColumns:"100px 1fr",gap:10,marginBottom:8}}>

          />

                  <input type="number" value={deposit} min={0} max={100}

                    onChange={e=>setDeposit(+e.target.value)} style={{...inp,textAlign:"center"}}/>

                </FieldWrap>

        {view==="closeorders"&&<CloseOrderModule orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} onCloseOrder={handleCloseOrder} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}

                  <input value={depositNote} onChange={e=>setDepositNote(e.target.value)} style={inp}/>

                </FieldWrap>

              </div>

        {view==="dashboard"&&currentRole==="accountant"&&<AccountantDashboard orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} bankAccounts={bankAccounts}/>}

                <input value={finalNote} onChange={e=>setFinalNote(e.target.value)} style={inp}/>

              </FieldWrap>

            </div>



            <div style={{marginBottom:16}}>

                slotCost:    priceOpt.costPerPax||0,

              {cancelPolicy.map((c,i)=>(

                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 100px 32px",

                  gap:8,marginBottom:6,alignItems:"center"}}>

          />}

        {view==="profile"&&<ProfilePage currentUser={currentUser} onUpdate={handleUpdateCurrentUser} onBack={()=>setView("orders")} pushNotif={pushToast}/>}

                  <div style={{display:"flex",alignItems:"center",gap:4}}>

                    <input type="number" value={c.fee} min={0} max={100}

            orders={orders} currentRole={currentRole} currentUser={currentUser} pushNotif={pushToast}

                      style={{...inp,textAlign:"center",width:"70%"}}/>

                    <span style={{fontSize:12,color:"#64748b"}}>%</span>

                  </div>

                  <button onClick={()=>setCancelPolicy(prev=>prev.filter((_,j)=>j!==i))}

                    style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#b0554a"}}>×</button>

                </div>

              ))}

              <button onClick={()=>setCancelPolicy(prev=>[...prev,{before:"",fee:0}])}

                style={{fontSize:12,color:"#7a5a00",background:"none",border:"1px dashed #e8c53a",

                  borderRadius:6,padding:"5px 14px",cursor:"pointer",width:"100%"}}>

  const NAV=[

              </button>

            </div>



            <FieldWrap label="Quy ð?nh v? s? lý?ng khách">

              <textarea value={paxPolicy} onChange={e=>setPaxPolicy(e.target.value)}

                placeholder="VD: Ch?t s? lý?ng khách chính xác trý?c 12h00 ngày trý?c kh?i hành..."

                style={textarea}/>

            </FieldWrap>



// INVOICE MODULE — Hóa đơn đầu ra + đầu vào

// ═══════════════════════════════════════════════════════════


function BankAccountModule({ bankAccounts, onUpdate, pushNotif }){

  const [showForm, setShowForm] = useState(false);

  const [editId,   setEditId]   = useState(null);



  const blank = {

    bankName:"", branch:"", accountNo:"", accountName:"",

    type:"personal", useFor:["invoice","no_invoice"],

    shortName:"", note:"", color:"#1e3a8a", active:true,

  };

  const [form, setForm] = useState(blank);

  const inp = {width:"100%",padding:"9px 12px",border:"1px solid #dbeafe",borderRadius:8,

    fontSize:13,background:"#f8faff",outline:"none",color:"#1e293b",boxSizing:"border-box"};



  const openAdd = () => { setForm(blank); setEditId(null); setShowForm(true); };



  const foVat    = Math.round(foAmount * foVatRate/100);

  const foTotal  = foAmount + foVat;

  const fiVat    = Math.round(fiAmount * fiVatRate/100);

  const fiTotal  = fiAmount + fiVat;



  const inp = {width:"100%",padding:"8px 10px",border:"1px solid #dbeafe",borderRadius:8,

    fontSize:13,background:"#f8faff",outline:"none",boxSizing:"border-box"};



  const handleSaveOutput = () => {

    if(!foInvoiceNo.trim()||!foDate||!foAmount){pushNotif("Nhập đủ: số HĐ, ngày, số tiền","error");return;}

    const order = orders.find(o=>o.id===foOrderId);

    const inv = {

      id:`HDDR-${String(outputInvoices.length+1).padStart(3,"0")}`,

      orderId:foOrderId, invoiceNo:foInvoiceNo, symbol:foSymbol,

      issueDate:foDate,

      orderId:foOrderId, invoiceNo:foInvoiceNo, symbol:foSymbol,
      issueDate:foDate,
      serviceDesc:foDesc||order?.serviceName||"",

      amountBeforeVat:foAmount, vatRate:foVatRate,

      vatAmount:foVat, totalAmount:foTotal,

      status:"issued", note:foNote, createdBy:"lien.kt",

    };

    onUpdateOutputInvoices([...outputInvoices,inv]);

    setShowForm(false);

    pushNotif(`Đã thêm HĐ đầu ra ${foInvoiceNo}`, "success");

  };



  const handleSaveInput = () => {

    if(!fiSupplier.trim()||!fiDate||!fiAmount){pushNotif("Nhập đủ: NCC, ngày, số tiền","error");return;}

    const inv = {

      id:`HDVV-${String(inputInvoices.length+1).padStart(3,"0")}`,

      voucherId:fiVoucherId, orderId:"",

      docType:fiDocType, invoiceNo:fiInvoiceNo, symbol:fiSymbol,

      issueDate:fiDate, supplierName:fiSupplier, supplierTax:fiSupTax,

      serviceDesc:fiDesc, amountBeforeVat:fiAmount,

      issueDate:fiDate, supplierName:fiSupplier, supplierTax:fiSupTax,
      serviceDesc:fiDesc, amountBeforeVat:fiAmount,
      totalAmount:fiDocType==="vat"?fiTotal:fiAmount,

      status:"received", note:fiNote, createdBy:"lien.kt",

    };

    onUpdateInputInvoices([...inputInvoices,inv]);

    setShowForm(false);

    pushNotif(`Đã thêm HĐ đầu vào từ ${fiSupplier}`,"success");

  };



  const DOC_TYPE = {

    vat:    {label:"HĐ VAT đầy đủ",   color:"#1d6b4f", bg:"#e8f5ef", icon:"🧾"},

    retail: {label:"HĐ bán lẻ / biên lai", color:"#7a5a00", bg:"#fef9e7", icon:"📄"},

    none:   {label:"Không có chứng từ", color:"#8b2a1a", bg:"#fdf0ee", icon:"❌"},

  };



  // Export CSV đầu ra

  const exportOutput = () => exportCsv(filteredOut,[

    {key:"invoiceNo",label:"Số HĐ"},{key:"symbol",label:"Ký hiệu"},

    {key:"issueDate",label:"Ngày xuất"},{key:"customerName",label:"Khách hàng"},

    {key:"customerTax",label:"MST KH"},{key:"serviceDesc",label:"Diễn giải"},

    {key:"amountBeforeVat",label:"Tiền chưa VAT"},{key:"vatRate",label:"Thuế suất %"},

    {key:"vatAmount",label:"Tiền VAT"},{key:"totalAmount",label:"Tổng tiền"},

  ],`hd_dau_ra_${filterQ.replace("/","_")}.csv`);



  // Export CSV đầu vào

  const exportInput = () => exportCsv(filteredIn,[

    {key:"invoiceNo",label:"Số HĐ"},{key:"symbol",label:"Ký hiệu"},

    {key:"docType",label:"Loại CT"},{key:"issueDate",label:"Ngày"},

    {key:"supplierName",label:"NCC"},{key:"supplierTax",label:"MST NCC"},

    {key:"serviceDesc",label:"Diễn giải"},

    {key:"amountBeforeVat",label:"Tiền chưa VAT"},{key:"vatRate",label:"Thuế suất %"},

    {key:"vatAmount",label:"Tiền VAT"},{key:"totalAmount",label:"Tổng tiền"},

    {key:"note",label:"Ghi chú"},

  ],`hd_dau_vao_${filterQ.replace("/","_")}.csv`);



  // Export tổng hợp thuế

  const exportSummary = () => {

    const rows = [

      {loai:"HĐ ĐẦU RA",so:filteredOut.length,tienChuaVat:filteredOut.reduce((s,i)=>s+i.amountBeforeVat,0),vat:vatOut,tong:totalOut},

      {loai:"HĐ ĐẦU VÀO — Có VAT (được KT)",so:filteredIn.filter(i=>i.docType==="vat").length,tienChuaVat:filteredIn.filter(i=>i.docType==="vat").reduce((s,i)=>s+i.amountBeforeVat,0),vat:vatInA,tong:totalInVat},

      {loai:"HĐ ĐẦU VÀO — Bán lẻ/biên lai",so:filteredIn.filter(i=>i.docType==="retail").length,tienChuaVat:totalInRetail,vat:0,tong:totalInRetail},

      {loai:"CHI PHÍ KHÔNG CT",so:filteredIn.filter(i=>i.docType==="none").length,tienChuaVat:totalInNone,vat:0,tong:totalInNone},

      {loai:"VAT PHẢI NỘP",so:"",tienChuaVat:"",vat:vatNoPay,tong:""},

      {loai:"CHI PHÍ KHÔNG CT",so:filteredIn.filter(i=>i.docType==="none").length,tienChuaVat:totalInNone,vat:0,tong:totalInNone},
${itineraryHtml}



<div class="section-title">III. CHI PHÍ VÀ D?CH V?</div>



<p><strong>?? B?NG BÁO GIÁ TOUR</strong></p>

<table>

  <tr>

    <th>Phýõng án</th><th>Giá ngý?i l?n</th><th>Giá tr? em</th><th>Ghi chú</th>

  </tr>

  ${priceTableRows}

</table>



<p><strong>? D?CH V? BAO G?M</strong></p>

<ul>${includedHtml}</ul>



<p><strong>? GIÁ TOUR KHÔNG BAO G?M</strong></p>

<ul>${excludedHtml}</ul>



<div class="section-title">IV. QUY Ð?NH THANH TOÁN &amp; ÐI?U KI?N HOÀN H?Y</div>

              {q}{q===getQuarter(NOW_ISO).label?" (hiện tại)":""}

            </button>

          ))}

        </div>

        <div style={{marginLeft:"auto",display:"flex",gap:8}}>

          {tab==="output"&&<Btn variant="outline" size="sm" onClick={exportOutput}>⬇ Xuất CSV đầu ra</Btn>}

          {tab==="input" &&<Btn variant="outline" size="sm" onClick={exportInput}>⬇ Xuất CSV đầu vào</Btn>}

          {tab==="summary"&&<Btn variant="outline" size="sm" onClick={exportSummary}>⬇ Xuất tổng hợp thuế</Btn>}

          <Btn size="sm" onClick={()=>{setFormType(tab==="input"?"input":"output");setShowForm(v=>!v);}}>

            + {tab==="input"?"Thêm HĐ đầu vào":"Thêm HĐ đầu ra"}

          </Btn>

        </div>

      </div>

        </div>
              setFoInvoiceNo(String(next).padStart(7,"0"));

            }

            setShowForm(v=>!v);

          }}>

            + {tab==="input"?"Thêm HĐ đầu vào":"Thêm HĐ đầu ra"}

          </Btn>

        </div>

      </div>





      <div style={{display:"flex",gap:2,background:"#e0e7ff",borderRadius:10,padding:3,marginBottom:14}}>

        {[

          ["output",`🧾 HĐ Đầu ra (${filteredOut.length})`],

          ["input", `📥 HĐ Đầu vào (${filteredIn.length})`],

          ["summary","📊 Tổng hợp thuế VAT"],

        ].map(([k,l])=>(

          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",

        ].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",
            boxShadow:tab===k?"0 1px 4px rgba(30,58,138,.12)":"none"}}>{l}</button>

        ))}

          {formType==="output"?(

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>

              <FieldWrap label="Đơn hàng liên quan">

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>
                  <option value="">-- Chọn đơn (tùy chọn) --</option>

                  {orders.filter(o=>o.invoiceType==="invoice"&&!["cancelled"].includes(o.status)).map(o=>(

                  <option value="">-- Chọn đơn (tùy chọn) --</option>
                  ))}

                </Sel>

              </FieldWrap>

              <FieldWrap label="Số hóa đơn *">

                <input value={foInvoiceNo} onChange={e=>setFoInvoiceNo(e.target.value)} placeholder="0001234" style={inp}/>

              </FieldWrap>

              <FieldWrap label="Ký hiệu HĐ">

                <input value={foSymbol} onChange={e=>setFoSymbol(e.target.value)} placeholder="1C25TAA" style={inp}/>

              </FieldWrap>

              <FieldWrap label="Ngày xuất HĐ *">

                <input type="date" value={foDate} onChange={e=>setFoDate(e.target.value)} style={inp}/>

              </FieldWrap>

              <FieldWrap label="Diễn giải hàng hóa/dịch vụ">

                <input value={foInvoiceNo} onChange={e=>setFoInvoiceNo(e.target.value)} placeholder="0001234" style={inp}/>

              </FieldWrap>

              <FieldWrap label="Ký hiệu HĐ">

                <input value={foSymbol} onChange={e=>setFoSymbol(e.target.value)} placeholder="1C25TAA" style={inp}/>

              </FieldWrap>

          </div>

          <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap"}}>

            <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",

              borderRadius:20,background:stCfg.bg,border:`1px solid ${stCfg.color}30`,

              fontSize:12,fontWeight:600,color:stCfg.color}}>

              {stCfg.icon} {stCfg.label}

            </span>

            <Btn size="sm" variant="outline" onClick={()=>handleExportWord(tp)}>?? Xu?t Word</Btn>

            {tp.status==="approved"&&onCreateOrder&&(

              <Btn size="sm" style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",fontWeight:700}}

                onClick={()=>onCreateOrder(tp)}>

                ? T?o ðõn t? CT này

              </Btn>

            )}

            {canEdit&&<Btn size="sm" onClick={()=>{setSelected(tp);setSubView("form");}}>?? Ch?nh s?a</Btn>}

          </div>

        </div>



        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:14,alignItems:"start"}}>

          <div>



            <Card style={{marginBottom:12}}>

              <div style={{fontSize:14,fontWeight:600,color:"#1e3a8a",marginBottom:12}}>?? L?ch tr?nh chi ti?t</div>

              {(tp.itinerary||[]).map(day=>(

                <div key={day.day} style={{marginBottom:16}}>

                  <div style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb)",color:"#fff",

                    borderRadius:8,padding:"8px 14px",marginBottom:8}}>

                    <div style={{fontSize:13,fontWeight:700}}>NGÀY {day.day}: {day.title}</div>

                    <div style={{fontSize:11,opacity:.8}}>?? Ãn: {day.meals}</div>

                  </div>

                  {(day.activities||[]).map((a,i)=>(

                    <div key={i} style={{display:"flex",gap:10,padding:"5px 0",

                      borderBottom:"0.5px solid #e0e7ff",alignItems:"flex-start"}}>

                      <span style={{fontSize:12,fontWeight:700,color:"#1e3a8a",

                        minWidth:48,flexShrink:0}}>{a.time}</span>

                      <span style={{fontSize:12,color:"#475569",lineHeight:1.5}}>{a.desc}</span>

                    </div>

                  ))}

                </div>


function AccountingDashboard({orders,vouchers,expenses,refunds,bankAccounts=[],onUpdateBankAccounts,

  outputInvoices=[],onUpdateOutputInvoices,inputInvoices=[],onUpdateInputInvoices,pushNotif}){

  const [tab,setTab]=useState("ledger"); // ledger | debt | ncc_debt | report | reconcile | banks



  // ── Compute ledger entries from all vouchers ──────────

  const [showForm,  setShowForm]  = useState(false);

  const [formType,  setFormType]  = useState("output"); // output | input



  // Danh sách quý có dữ liệu

  const allQuarters = useMemo(()=>{

    const qs = new Set();

    [...outputInvoices,...inputInvoices].forEach(i=>{ if(i.issueDate) qs.add(quarterOf(i.issueDate)); });

    qs.add(getQuarter(NOW_ISO).label);

    return [...qs].sort().reverse();

  },[outputInvoices,inputInvoices]);



  // Filter theo quý

  const filteredOut = outputInvoices.filter(i=>quarterOf(i.issueDate)===filterQ);

  const filteredIn  = inputInvoices .filter(i=>quarterOf(i.issueDate)===filterQ);



  // Tổng hợp thuế quý

  const vatOut   = filteredOut.reduce((s,i)=>s+i.vatAmount,0);

  const vatInA   = filteredIn.filter(i=>i.docType==="vat").reduce((s,i)=>s+i.vatAmount,0);

  const vatNoPay = Math.max(0, vatOut-vatInA);

  const totalOut = filteredOut.reduce((s,i)=>s+i.totalAmount,0);

  const totalInVat    = filteredIn.filter(i=>i.docType==="vat")   .reduce((s,i)=>s+i.totalAmount,0);

  const totalInRetail = filteredIn.filter(i=>i.docType==="retail").reduce((s,i)=>s+i.totalAmount,0);

      {tab==="output"&&(

        <Card style={{padding:0,overflow:"hidden"}}>

          <div style={{padding:"11px 16px",borderBottom:"1px solid #e0e7ff",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f8faff"}}>

            <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>🧾 Bảng kê hóa đơn đầu ra — {filterQ}</div>

            <div style={{fontSize:12,color:"#64748b"}}>{filteredOut.length} HĐ · DT: {fmtS(filteredOut.reduce((s,i)=>s+i.amountBeforeVat,0))}đ · VAT: {fmtS(vatOut)}đ</div>

          </div>

          {filteredOut.length===0

            ?<div style={{padding:"28px",textAlign:"center",color:"#94a3b8",fontSize:13}}>Chưa có hóa đơn đầu ra nào trong {filterQ}</div>

            :<div style={{overflowX:"auto"}}>

              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>

                <thead><tr style={{background:"#eef2ff"}}>

                  {["STT","Số HĐ","Ký hiệu","Ngày","Khách hàng","MST","Diễn giải","Tiền chưa VAT","VAT %","Tiền VAT","Tổng tiền"].map(h=>(

                    <th key={h} style={{padding:"8px 10px",textAlign:["Tiền chưa VAT","Tiền VAT","Tổng tiền"].includes(h)?"right":"left",

                      fontWeight:600,color:"#374151",fontSize:10,textTransform:"uppercase",letterSpacing:.3,

                      borderBottom:"1px solid #dbeafe",whiteSpace:"nowrap"}}>{h}</th>

                  ))}

                </tr></thead>

                <tbody>

                  {filteredOut.map((i,idx)=>(

                <tbody>
  const [fiDesc,      setFiDesc]      = useState("");

  const [fiAmount,    setFiAmount]    = useState(0);

  const [fiVatRate,   setFiVatRate]   = useState(8);

  const [fiNote,      setFiNote]      = useState("");



  const foVat    = Math.round(foAmount * foVatRate/100);

  const foTotal  = foAmount + foVat;

  const fiVat    = Math.round(fiAmount * fiVatRate/100);

  const fiTotal  = fiAmount + fiVat;



  const inp = {width:"100%",padding:"8px 10px",border:"1px solid #dbeafe",borderRadius:8,

    fontSize:13,background:"#f8faff",outline:"none",boxSizing:"border-box"};



  const handleSaveOutput = () => {

    if(!foInvoiceNo.trim()||!foDate||!foAmount){pushNotif("Nhập đủ: số HĐ, ngày, số tiền","error");return;}

    if(outputInvoices.some(i=>i.invoiceNo===foInvoiceNo.trim())){pushNotif(`Số HĐ ${foInvoiceNo} đã tồn tại — kiểm tra lại`,"error");return;}

    const order = orders.find(o=>o.id===foOrderId);

    const inv = {

      id:`HDDR-${String(outputInvoices.length+1).padStart(3,"0")}`,

      orderId:foOrderId, invoiceNo:foInvoiceNo, symbol:foSymbol,

      issueDate:foDate,

      orderId:foOrderId, invoiceNo:foInvoiceNo, symbol:foSymbol,
      issueDate:foDate,
      serviceDesc:foDesc||order?.serviceName||"",

      amountBeforeVat:foAmount, vatRate:foVatRate,

      vatAmount:foVat, totalAmount:foTotal,

      amountBeforeVat:foAmount, vatRate:foVatRate,
    };

      {tab==="input"&&(

        <Card style={{padding:0,overflow:"hidden"}}>

          <div style={{padding:"11px 16px",borderBottom:"1px solid #e0e7ff",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f8faff"}}>

            <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>📥 Bảng kê chứng từ đầu vào — {filterQ}</div>

            <div style={{fontSize:12,color:"#64748b"}}>{filteredIn.length} chứng từ · VAT được KT: {fmtS(vatInA)}đ</div>

          </div>



          <div style={{padding:"8px 16px",display:"flex",gap:12,borderBottom:"0.5px solid #e0e7ff",flexWrap:"wrap"}}>

            {Object.entries(DOC_TYPE).map(([k,v])=>(

              <span key={k} style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:v.bg,color:v.color,fontWeight:500}}>

                {v.icon} {v.label}

              </span>

            ))}

          </div>

          {filteredIn.length===0

          </div>
          {filteredIn.length===0
      totalAmount:fiDocType==="vat"?fiTotal:fiAmount,

      status:"received", note:fiNote, createdBy:currentUser?.name||currentUser?.id||"—",

    };

    onUpdateInputInvoices([...inputInvoices,inv]);

    setShowForm(false);

    pushNotif(`Đã thêm HĐ đầu vào từ ${fiSupplier}`,"success");

  };



  const DOC_TYPE = {

    vat:    {label:"HĐ VAT đầy đủ",   color:"#1d6b4f", bg:"#e8f5ef", icon:"🧾"},

    retail: {label:"HĐ bán lẻ / biên lai", color:"#7a5a00", bg:"#fef9e7", icon:"📄"},

    none:   {label:"Không có chứng từ", color:"#8b2a1a", bg:"#fdf0ee", icon:"❌"},

  };



  // Export CSV đầu ra

  const exportOutput = () => exportCsv(filteredOut,[

    {key:"invoiceNo",label:"Số HĐ"},{key:"symbol",label:"Ký hiệu"},

    {key:"issueDate",label:"Ngày xuất"},{key:"customerName",label:"Khách hàng"},

    {key:"customerTax",label:"MST KH"},{key:"serviceDesc",label:"Diễn giải"},

    {key:"amountBeforeVat",label:"Tiền chưa VAT"},{key:"vatRate",label:"Thuế suất %"},

                         inputInvoices, onUpdateInputInvoices, vouchers, pushNotif, currentUser }){

  const [tab,       setTab]       = useState("output"); // output | input | summary

  const [filterQ,   setFilterQ]   = useState(getQuarter(NOW_ISO).label);

  const [showForm,  setShowForm]  = useState(false);

  const [formType,  setFormType]  = useState("output"); // output | input



  // Danh sách qu? có d? li?u

  const allQuarters = useMemo(()=>{

    const qs = new Set();

    [...outputInvoices,...inputInvoices].forEach(i=>{ if(i.issueDate) qs.add(quarterOf(i.issueDate)); });

    qs.add(getQuarter(NOW_ISO).label);

    return [...qs].sort().reverse();

  },[outputInvoices,inputInvoices]);



  // Filter theo qu?

  const filteredOut = outputInvoices.filter(i=>quarterOf(i.issueDate)===filterQ);

  const filteredIn  = inputInvoices .filter(i=>quarterOf(i.issueDate)===filterQ);



  // T?ng h?p thu? qu?

  const vatOut   = filteredOut.reduce((s,i)=>s+i.vatAmount,0);

  const vatInA   = filteredIn.filter(i=>i.docType==="vat").reduce((s,i)=>s+i.vatAmount,0);

  const vatNoPay = Math.max(0, vatOut-vatInA);

  const totalOut = filteredOut.reduce((s,i)=>s+i.totalAmount,0);

  const totalInVat    = filteredIn.filter(i=>i.docType==="vat")   .reduce((s,i)=>s+i.totalAmount,0);

  const totalInRetail = filteredIn.filter(i=>i.docType==="retail").reduce((s,i)=>s+i.totalAmount,0);

  const totalInNone   = filteredIn.filter(i=>i.docType==="none")  .reduce((s,i)=>s+i.totalAmount,0);



      {tab==="invoices"&&<InvoiceModule orders={orders} vouchers={vouchers}

        outputInvoices={outputInvoices} onUpdateOutputInvoices={onUpdateOutputInvoices||((v)=>{})}

        inputInvoices={inputInvoices}   onUpdateInputInvoices={onUpdateInputInvoices||((v)=>{})}

        pushNotif={pushNotif}/>}



  const [foDesc,      setFoDesc]      = useState("");

  const [foAmount,    setFoAmount]    = useState(0);

  const [foVatRate,   setFoVatRate]   = useState(8);

  const [foNote,      setFoNote]      = useState("");

      {tab==="summary"&&(

        <div>



          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:16}}>

            {[

              {l:"VAT đầu ra (phải nộp)",       v:fmt(vatOut)+" đ",    c:"#b0554a", bg:"#fdf0ee", icon:"📤"},

              {l:"VAT đầu vào (được khấu trừ)", v:fmt(vatInA)+" đ",    c:"#1d6b4f", bg:"#e8f5ef", icon:"📥"},

              {l:"VAT phải nộp nhà nước",        v:fmt(vatNoPay)+" đ",  c:"#1e3a8a", bg:"#eff6ff", icon:"🏛"},

            ].map(({l,v,c,bg,icon})=>(

              <Card key={l} style={{padding:"16px 18px",background:bg,border:`1px solid ${c}20`}}>

                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>

                  <span style={{fontSize:22}}>{icon}</span>

                  <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:.4}}>{l}</div>

                </div>

                <div style={{fontSize:22,fontWeight:800,color:c,fontVariantNumeric:"tabular-nums"}}>{v}</div>

              </Card>

            ))}

          </div>





          <Card>

            <div style={{fontSize:14,fontWeight:600,color:"#1e293b",marginBottom:14}}>

              📊 Tổng hợp kê khai thuế VAT — {filterQ}

            </div>

            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>

              <thead><tr style={{background:"#f0f4ff"}}>

                {["Khoản mục","Số lượng","Tiền chưa VAT","Thuế suất","Tiền VAT","Ghi chú"].map(h=>(

                  <th key={h} style={{padding:"10px 14px",textAlign:["Tiền chưa VAT","Tiền VAT"].includes(h)?"right":"left",

                    fontWeight:600,color:"#374151",fontSize:11,textTransform:"uppercase",letterSpacing:.3,

                    borderBottom:"1px solid #dbeafe"}}>{h}</th>

                ))}

              </tr></thead>

              <tbody>



                <tr style={{background:"#fdf0ee"}}>

                  <td colSpan={6} style={{padding:"8px 14px",fontWeight:700,color:"#8b2a1a",fontSize:12}}>A. THUẾ VAT ĐẦU RA</td>

                </tr>

                <tr style={{borderBottom:"0.5px solid #e0e7ff"}}>

                  <td style={{padding:"9px 14px",paddingLeft:24,color:"#475569"}}>Doanh thu có hóa đơn VAT</td>

                  <td style={{padding:"9px 14px",textAlign:"center",color:"#64748b"}}>{filteredOut.length} HĐ</td>

                  <td style={{padding:"9px 14px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:500}}>{fmt(filteredOut.reduce((s,i)=>s+i.amountBeforeVat,0))} đ</td>

                  <td style={{padding:"9px 14px",textAlign:"center",color:"#64748b"}}>8%</td>

                  <td style={{padding:"9px 14px",textAlign:"right",fontWeight:700,color:"#b0554a",fontVariantNumeric:"tabular-nums"}}>{fmt(vatOut)} đ</td>

                  <td style={{padding:"9px 14px",fontSize:11,color:"#94a3b8"}}></td>

                </tr>



                <tr style={{background:"#e8f5ef",borderTop:"1px solid #dbeafe"}}>

                  <td colSpan={6} style={{padding:"8px 14px",fontWeight:700,color:"#1d6b4f",fontSize:12}}>B. THUẾ VAT ĐẦU VÀO ĐƯỢC KHẤU TRỪ</td>

                </tr>

                {[

                  {label:"HĐ VAT đầy đủ (được KT)",items:filteredIn.filter(i=>i.docType==="vat"),vatSum:vatInA,note:"Được khấu trừ 100%"},

                ].map(({label,items,vatSum,note})=>(

                  <tr key={label} style={{borderBottom:"0.5px solid #e0e7ff"}}>

                    <td style={{padding:"9px 14px",paddingLeft:24,color:"#475569"}}>{label}</td>

                    <td style={{padding:"9px 14px",textAlign:"center",color:"#64748b"}}>{items.length} CT</td>

                    <td style={{padding:"9px 14px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:500}}>{fmt(items.reduce((s,i)=>s+i.amountBeforeVat,0))} đ</td>

                    <td style={{padding:"9px 14px",textAlign:"center",color:"#64748b"}}>—</td>

                    <td style={{padding:"9px 14px",textAlign:"right",fontWeight:700,color:"#1d6b4f",fontVariantNumeric:"tabular-nums"}}>{fmt(vatSum)} đ</td>

                    <td style={{padding:"9px 14px",fontSize:11,color:"#1d6b4f"}}>{note}</td>

                  </tr>

                ))}



                <tr style={{background:"#fef9e7",borderTop:"1px solid #dbeafe"}}>

                  <td colSpan={6} style={{padding:"8px 14px",fontWeight:700,color:"#7a5a00",fontSize:12}}>C. CHI PHÍ KHÔNG ĐƯỢC KHẤU TRỪ VAT (lưu hồ sơ)</td>

                </tr>

                {[

                  {label:"HĐ bán lẻ / biên lai",items:filteredIn.filter(i=>i.docType==="retail"),note:"Không KT VAT"},

                  {label:"Không có chứng từ",items:filteredIn.filter(i=>i.docType==="none"),note:"Chi phí không CT"},

                ].map(({label,items,note})=>items.length>0&&(

                  <tr key={label} style={{borderBottom:"0.5px solid #e0e7ff"}}>

  const exportOutput = () => exportCsv(filteredOut,[

                  <tr key={label} style={{borderBottom:"0.5px solid #e0e7ff"}}>
    {key:"issueDate",label:"Ngày xu?t"},{key:"customerName",label:"Khách hàng"},

    {key:"customerTax",label:"MST KH"},{key:"serviceDesc",label:"Di?n gi?i"},

    {key:"amountBeforeVat",label:"Ti?n chýa VAT"},{key:"vatRate",label:"Thu? su?t %"},

    {key:"vatAmount",label:"Ti?n VAT"},{key:"totalAmount",label:"T?ng ti?n"},

  ],`hd_dau_ra_${filterQ.replace("/","_")}.csv`);



  // Export CSV ð?u vào

  const exportInput = () => exportCsv(filteredIn,[

    {key:"invoiceNo",label:"S? HÐ"},{key:"symbol",label:"K? hi?u"},

    {key:"docType",label:"Lo?i CT"},{key:"issueDate",label:"Ngày"},

    {key:"supplierName",label:"NCC"},{key:"supplierTax",label:"MST NCC"},

    {key:"serviceDesc",label:"Di?n gi?i"},

    {key:"amountBeforeVat",label:"Ti?n chýa VAT"},{key:"vatRate",label:"Thu? su?t %"},

    {key:"vatAmount",label:"Ti?n VAT"},{key:"totalAmount",label:"T?ng ti?n"},

    {key:"note",label:"Ghi chú"},

  ],`hd_dau_vao_${filterQ.replace("/","_")}.csv`);



  // Export t?ng h?p thu?

  const exportSummary = () => {

    const rows = [

      {loai:"MVT xu?t cho khách (ð?u ra)",so:filteredOut.length,tienChuaVat:filteredOut.reduce((s,i)=>s+i.amountBeforeVat,0),vat:vatOut,tong:totalOut},

      {loai:"NCC xu?t cho MVT — HÐ VAT (ðý?c kh?u tr?)",so:filteredIn.filter(i=>i.docType==="vat").length,tienChuaVat:filteredIn.filter(i=>i.docType==="vat").reduce((s,i)=>s+i.amountBeforeVat,0),vat:vatInA,tong:totalInVat},

      {loai:"NCC xu?t cho MVT — Bán l?/biên lai",so:filteredIn.filter(i=>i.docType==="retail").length,tienChuaVat:totalInRetail,vat:0,tong:totalInRetail},

      {loai:"CHI PHÍ KHÔNG CT",so:filteredIn.filter(i=>i.docType==="none").length,tienChuaVat:totalInNone,vat:0,tong:totalInNone},

      {loai:"VAT PH?I N?P",so:"",tienChuaVat:"",vat:vatNoPay,tong:""},

    ];

    exportCsv(rows,[

      {key:"loai",label:"Lo?i"},{key:"so",label:"S? lý?ng"},

      {key:"tienChuaVat",label:"Ti?n chýa VAT"},{key:"vat",label:"Ti?n VAT"},

      {key:"tong",label:"T?ng c?ng"},

    ],`tong_hop_thue_${filterQ.replace("/","_")}.csv`);

  };



  return(

    <div>



      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>



        <div style={{display:"flex",gap:2,background:"#e0e7ff",borderRadius:10,padding:3}}>

          {allQuarters.map(q=>(

            <button key={q} onClick={()=>setFilterQ(q)}

              style={{padding:"6px 14px",borderRadius:8,border:"none",fontSize:12,cursor:"pointer",

                background:filterQ===q?"#fff":"transparent",fontWeight:filterQ===q?600:400,

                color:filterQ===q?"#1e3a8a":"#64748b",

                boxShadow:filterQ===q?"0 1px 4px rgba(30,58,138,.12)":"none"}}>

              {q}{q===getQuarter(NOW_ISO).label?" (hi?n t?i)":""}

            </button>

          ))}

        </div>

        <div style={{marginLeft:"auto",display:"flex",gap:8}}>

          {tab==="output"&&<Btn variant="outline" size="sm" onClick={exportOutput}>? Xu?t CSV</Btn>}

          {tab==="input" &&<Btn variant="outline" size="sm" onClick={exportInput}>? Xu?t CSV</Btn>}

          {tab==="summary"&&<Btn variant="outline" size="sm" onClick={exportSummary}>? Xu?t t?ng h?p thu?</Btn>}

          <Btn size="sm" onClick={()=>{

            const type=tab==="input"?"input":"output";

            setFormType(type);

            setShowForm(v=>!v);

          }}>

            + {tab==="input"?"Ghi nh?n HÐ t? NCC":"Ghi nh?n HÐ xu?t cho khách"}

          </Btn>

        </div>

      </div>





      <div style={{display:"flex",gap:2,background:"#e0e7ff",borderRadius:10,padding:3,marginBottom:14}}>

        {[

          ["output", `?? MVT xu?t cho khách (${filteredOut.length})`],

          ["input",  `?? NCC xu?t cho MVT (${filteredIn.length})`],

          ["summary","?? T?ng h?p thu? VAT"],

        ].map(([k,l])=>(

          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",

            background:tab===k?"#fff":"transparent",fontWeight:tab===k?600:400,fontSize:12,

            cursor:"pointer",color:tab===k?"#1e3a8a":"#64748b",

            boxShadow:tab===k?"0 1px 4px rgba(30,58,138,.12)":"none"}}>{l}</button>

        ))}

      </div>





      {showForm&&(

        <Card style={{marginBottom:14,border:"1px solid #bfdbfe"}}>

          <div style={{fontSize:14,fontWeight:600,color:"#1e3a8a",marginBottom:4}}>

            {formType==="output"

              ?"?? HÐ Minh Vi?t Travel xu?t cho khách — ghi s? tham chi?u t? Viettel"

              :"?? HÐ / ch?ng t? NCC xu?t cho Minh Vi?t Travel"}

          </div>

          <div style={{fontSize:11,color:"#64748b",marginBottom:14}}>

            {formType==="output"

              ?"HÐ ði?n t? th?c xu?t trên h? th?ng Viettel. ERP ch? lýu s? tham chi?u ð? ð?i chi?u."

              :"Ghi nh?n hóa ðõn/ch?ng t? nh?n ðý?c t? nhà cung c?p d?ch v? (khách s?n, h?ng bay, NCC...)."}

          </div>



          {formType==="output"?(

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>

              <FieldWrap label="Ðõn hàng liên quan">

                <Sel value={foOrderId} onChange={e=>{setFoOrderId(e.target.value);const o=orders.find(x=>x.id===e.target.value);if(o){setFoDesc(o.serviceName||"");setFoAmount(o.pricing?.amountBeforeVat||Math.round((o.pricing?.totalRevenue||0)/1.08));}}}>

                  <option value="">-- Ch?n ðõn (tùy ch?n) --</option>

                  {orders.filter(o=>o.invoiceType==="invoice"&&!["cancelled"].includes(o.status)).map(o=>(

                    </div>

                  </div>

                </>

              )}

              <FieldWrap label="Ghi chú">

                <input value={fiNote} onChange={e=>setFiNote(e.target.value)} placeholder="Ghi chú thêm..." style={inp}/>

              </FieldWrap>

              <div style={{gridColumn:"1/-1",display:"flex",justifyContent:"flex-end",gap:8}}>

                <Btn variant="outline" onClick={()=>setShowForm(false)}>Hủy</Btn>

                <Btn onClick={handleSaveInput}>💾 Lưu chứng từ đầu vào</Btn>

              </div>

            </div>

          )}

        </Card>

      )}





      {tab==="output"&&(

        <Card style={{padding:0,overflow:"hidden"}}>

          <div style={{padding:"11px 16px",borderBottom:"1px solid #e0e7ff",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f8faff"}}>

              </FieldWrap>

          <div style={{padding:"11px 16px",borderBottom:"1px solid #e0e7ff",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f8faff"}}>
                <input type="number" value={foAmount} onChange={e=>setFoAmount(+e.target.value)} style={{...inp,textAlign:"right"}}/>

              </FieldWrap>

              <div style={{paddingBottom:14}}>

                <div style={{fontSize:11,fontWeight:600,color:"#475569",marginBottom:5,textTransform:"uppercase",letterSpacing:.4}}>Ti?n VAT / T?ng ti?n HÐ</div>

                <div style={{padding:"9px 12px",background:"#eff6ff",borderRadius:8,fontSize:13}}>

                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>

                    <span style={{color:"#64748b"}}>VAT {foVatRate}%:</span>

                    <span style={{fontWeight:600,color:"#2563eb",fontVariantNumeric:"tabular-nums"}}>{fmt(foVat)} ð</span>

                  </div>

                  <div style={{display:"flex",justifyContent:"space-between"}}>

                    <span style={{fontWeight:600}}>T?ng ti?n HÐ:</span>

                    <span style={{fontWeight:700,fontSize:15,color:"#1e3a8a",fontVariantNumeric:"tabular-nums"}}>{fmt(foTotal)} ð</span>

                  </div>

                </div>

              </div>

              <FieldWrap label="Ghi chú">

                <input value={foNote} onChange={e=>setFoNote(e.target.value)} placeholder="Ghi chú..." style={inp}/>

              </FieldWrap>

              <div style={{gridColumn:"1/-1",display:"flex",justifyContent:"flex-end",gap:8}}>

                <Btn variant="outline" onClick={()=>setShowForm(false)}>H?y</Btn>

                <Btn onClick={handleSaveOutput}>?? Lýu HÐ ð?u ra</Btn>

              </div>

            </div>

          ):(

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>

              <FieldWrap label="Lo?i ch?ng t? *">

                <Sel value={fiDocType} onChange={e=>setFiDocType(e.target.value)}>

                  <option value="vat">?? Hóa ðõn VAT ð?y ð? (ðý?c kh?u tr?)</option>

                  <option value="retail">?? HÐ bán l? / Biên lai (không KT)</option>

                  <option value="none">? Không có ch?ng t?</option>

                </Sel>

              </FieldWrap>

              <FieldWrap label="Phi?u chi liên quan">

                <Sel value={fiVoucherId} onChange={e=>setFiVoucherId(e.target.value)}>

                  <option value="">-- Ch?n phi?u chi (tùy ch?n) --</option>

                  {vouchers.filter(v=>v.type==="chi").map(v=>(

                    <option key={v.id} value={v.id}>{v.id} – {v.ncc||""} – {fmt(v.amount)}ð</option>

                  ))}

                </Sel>

              </FieldWrap>

              <FieldWrap label="Ngày HÐ / ch?ng t? *">

                <input type="date" value={fiDate} onChange={e=>setFiDate(e.target.value)} style={inp}/>

              </FieldWrap>

              <FieldWrap label="Tên nhà cung c?p *">

                <input value={fiSupplier} onChange={e=>setFiSupplier(e.target.value)} placeholder="Vietnam Airlines, KS Vinpearl..." style={inp}/>

              </FieldWrap>

              <FieldWrap label="MST nhà cung c?p">

                <input value={fiSupTax} onChange={e=>setFiSupTax(e.target.value)} placeholder="0100107518" style={inp}/>

              </FieldWrap>

  // CRM search state

  const [crmSearch, setCrmSearch] = useState("");

  const [crmOpen,   setCrmOpen]   = useState(false);

  const [crmSource, setCrmSource] = useState(null); // customer id nếu chọn từ CRM



  const [C,setC]=useState({name:"",phone:"",email:"",dob:"",address:"",province:"",cccd:"",cccdImg:null});

  const [serviceId,setSvc]=useState("tour");

  const [serviceName,setSvcName]=useState("");

  const [departDate,setDep]=useState("");

  const [returnDate,setRet]=useState("");

  const [pax,setPax]=useState({adults:1,children:0,babies:0});

  const [pricing,setPricing]=useState({

    adultPrice:0, childPrice:0, babyPrice:0,

    slotPrice:0,  slotCount:1,

    adultCost:0, childCost:0, babyCost:0,

    slotCost:0,  fixedCost:0,

  });

  const [sale,setSale]=useState(defaultSale);

  const [notes,setNotes]=useState("");

  const [draftInvoiceType,setDraftInvoiceType]=useState("no_invoice");

  const [vatRate,setVatRate]=useState(8); // VAT %: 0, 5, 8, 10



  const isTourGhep = serviceId==="tour_ghep_nd"||serviceId==="tour_ghep_qt";

  const canSeeCost = currentRole==="accountant"||currentRole==="manager";



  // Doanh thu CHƯA VAT (sale nhập giá chưa VAT)

  const totalRevenue = isTourGhep

    ? (pricing.slotPrice||0)*(pricing.slotCount||1)

    : (pax.adults*(pricing.adultPrice||0))+(pax.children*(pricing.childPrice||0))+(pax.babies*(pricing.babyPrice||0));

  const totalCost = isTourGhep

    ? (pricing.slotCost||0)*(pricing.slotCount||1)+(pricing.fixedCost||0)

    : (pax.adults*(pricing.adultCost||0))+(pax.children*(pricing.childCost||0))+(pax.babies*(pricing.babyCost||0))+(pricing.fixedCost||0);



  // Lợi nhuận = Doanh thu chưa VAT - Chi phí (VAT không phải lợi nhuận công ty)

  const profit    = totalRevenue - totalCost;

  const profitPct = totalRevenue>0 ? (profit/totalRevenue*100) : 0;



  // Tổng tiền khách trả = Doanh thu + VAT

  const vatAmount     = draftInvoiceType==="invoice" ? Math.round(totalRevenue*vatRate/100) : 0;

  const totalWithVat  = totalRevenue + vatAmount;



  const draftOrder={customer:{...C,customerId:crmSource},service:serviceId,serviceName,departDate,returnDate,pax,

    pricing:{...pricing,totalRevenue,totalCost,profit,profitPct,vatRate,vatAmount,totalWithVat},

    sale,notes,invoiceType:draftInvoiceType};

  const allErrs=validateOrder(draftOrder);

  const hardErrs=allErrs.filter(e=>e.level==="error");

  const warnings=allErrs.filter(e=>e.level==="warning");



  // CRM search results

  const crmResults = useMemo(()=>{

    if(!crmSearch.trim()||crmSearch.length<2) return [];

    const q = crmSearch.toLowerCase();

    return customers.filter(c=>

      c.name.toLowerCase().includes(q)||

      (c.companyName||"").toLowerCase().includes(q)||

      (c.phone||"").includes(q)||

      (c.email||"").toLowerCase().includes(q)

    ).slice(0,6);

  },[crmSearch,customers]);



  // Chọn KH từ CRM

  const handleSelectCrm = (c) => {

    setC({

      name:    c.name,

      phone:   c.phone||"",

      email:   c.email||"",

      dob:     c.dob||"",

      address: c.companyAddress||"",

      province:c.province||"",

      cccd:    c.cccd||"",

      cccdImg: null,

    });

    setCrmSource(c.id);

    });
    setCrmOpen(false);

    pushNotif(`Đã chọn: ${c.type==="business"?c.companyName:c.name}`,"success");

  };



  const handleCccdImg=(e)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setC(c=>({...c,cccdImg:ev.target.result}));r.readAsDataURL(f);};

  const steps=[{n:1,l:"Người đặt"},{n:2,l:"Dịch vụ & Giá"},{n:3,l:"Kiểm soát"}];

                      <td style={{padding:"8px 10px",fontWeight:600,color:"#1e3a8a"}}>{i.invoiceNo}</td>

                      <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:11,color:"#475569"}}>{i.symbol||"—"}</td>

                      <td style={{padding:"8px 10px",whiteSpace:"nowrap",color:"#475569"}}>{fmtD(i.issueDate)}</td>

                      <td style={{padding:"8px 10px",fontWeight:500}}>{i.customerName}</td>

                      <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:11,color:"#64748b"}}>{i.customerTax||"—"}</td>

                      <td style={{padding:"8px 10px",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"#475569"}}>{i.serviceDesc}</td>

                      <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:500}}>{fmt(i.amountBeforeVat)}</td>

                      <td style={{padding:"8px 10px",textAlign:"center",color:"#64748b"}}>{i.vatRate}%</td>

                      <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:"#2563eb"}}>{fmt(i.vatAmount)}</td>

                      <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,fontVariantNumeric:"tabular-nums",color:"#1e3a8a"}}>{fmt(i.totalAmount)}</td>

                    </tr>

                  ))}

                </tbody>

                <tfoot><tr style={{background:"#eef2ff",borderTop:"2px solid #bfdbfe"}}>

                  <td colSpan={7} style={{padding:"9px 10px",fontWeight:700,color:"#1e3a8a",fontSize:12}}>T?ng c?ng ({filteredOut.length} HÐ)</td>

                  <td style={{padding:"9px 10px",textAlign:"right",fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmt(filteredOut.reduce((s,i)=>s+i.amountBeforeVat,0))}</td>

                  <td/>

                  <td style={{padding:"9px 10px",textAlign:"right",fontWeight:700,color:"#2563eb",fontVariantNumeric:"tabular-nums"}}>{fmt(vatOut)}</td>

                  <td style={{padding:"9px 10px",textAlign:"right",fontWeight:800,color:"#1e3a8a",fontVariantNumeric:"tabular-nums",fontSize:13}}>{fmt(totalOut)}</td>

                </tr></tfoot>

              </table>

            </div>

          }

        </Card>

      )}





      {tab==="input"&&(

        <Card style={{padding:0,overflow:"hidden"}}>

          <div style={{padding:"11px 16px",borderBottom:"1px solid #e0e7ff",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f8faff"}}>

            <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>?? HÐ / ch?ng t? NCC xu?t cho MVT — {filterQ}</div>

            <div style={{fontSize:12,color:"#64748b"}}>{filteredIn.length} ch?ng t? · VAT ðý?c KT: {fmtS(vatInA)}ð</div>

          </div>



          <div style={{padding:"8px 16px",display:"flex",gap:12,borderBottom:"0.5px solid #e0e7ff",flexWrap:"wrap"}}>

            {Object.entries(DOC_TYPE).map(([k,v])=>(

              <span key={k} style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:v.bg,color:v.color,fontWeight:500}}>

                {v.icon} {v.label}

              </span>

            ))}

    }));



    return {khDebt,nccDebt,totalKH:khDebt.reduce((s,d)=>s+d.amount,0),totalNCC:nccDebt.reduce((s,d)=>s+d.amount,0)};

  },[orders,vouchers,expenses]);



  // ── Monthly report ────────────────────────────────────

  const monthlyReport=useMemo(()=>{

    const map={};

    ledger.filter(e=>e.status==="confirmed"&&e.date).forEach(e=>{

      const key=e.date.slice(0,7); // YYYY-MM

      if(!map[key]) map[key]={month:key,thu:0,chi:0};

      if(e.type==="thu") map[key].thu+=e.amount;

      else map[key].chi+=e.amount;

    });

    return Object.values(map).sort((a,b)=>b.month.localeCompare(a.month)).map(m=>({

    });
    }));

  },[ledger]);



  // ── Reconcile state ───────────────────────────────────

  const [bankBalance,setBankBalance]=useState("");

  const [bankDate,   setBankDate]   =useState("");

  const [bankBalance,setBankBalance]=useState("");


  const TypeDot=({type})=>{

    const cfg={thu:{c:"#2563eb",l:"Thu"},chi:{c:"#b0554a",l:"Chi"},hoan:{c:"#7a5a00",l:"Hoàn"}}[type]||{c:"#888",l:"?"};

    return <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,background:cfg.c+"18",color:cfg.c}}>{cfg.l}</span>;

  };



  return(

    <div>



      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>

        {[

          {l:"Tổng thu (xác nhận)",v:fmtS(totalThu)+" đ",       c:"#2563eb", icon:"📥"},

          {l:"Tổng chi (xác nhận)",v:fmtS(totalChi)+" đ",       c:"#b0554a", icon:"📤"},

          {l:"Tổng thu (xác nhận)",v:fmtS(totalThu)+" đ",       c:"#2563eb", icon:"📥"},
          {l:"Tổng công nợ KH+NCC",v:fmtS(debtData.totalKH+debtData.totalNCC)+" đ",c:"#7a5a00",icon:"📊"},

        ].map(({l,v,c,icon})=>(

          <Card key={l} style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>

                  ].map(({label,items,c})=>items.length>0&&(

  const ledger = useMemo(()=>{

    const entries=[];

    // Thu tiền khách (approved)

    vouchers.filter(v=>v.type==="thu"&&v.status==="approved").forEach(v=>{

      entries.push({id:v.id,date:v.date,type:"thu",amount:v.amount,

        desc:`Thu: ${v.customerName||""} — ${v.note}`,

        ref:v.orderId,method:v.method,bankAccountId:v.bankAccountId||null,status:"confirmed"});

    });

    // Chi NCC (paid)

    expenses.filter(e=>e.status==="paid").forEach(e=>{

    // Chi NCC (paid)
        desc:`Chi NCC: ${e.ncc} — ${e.note}`,

        ref:e.orderId,method:e.method||"transfer",bankAccountId:e.bankAccountId||null,status:"confirmed"});

    });

    // Hoàn tiền khách (paid)

    refunds.filter(r=>r.status==="paid").forEach(r=>{

      const net=(r.refundAmount||0)-(r.nccRecovery||0);

    refunds.filter(r=>r.status==="paid").forEach(r=>{
        desc:`Hoàn tiền: ${r.customerName} — ${r.orderName}`,

        ref:r.orderId,method:r.method||"transfer",bankAccountId:r.bankAccountId||null,status:"confirmed"});

    });

    // Chi phiếu tạm ứng pending

    vouchers.filter(v=>v.type==="chi"&&v.status==="approved").forEach(v=>{

      entries.push({id:v.id,date:v.date,type:"chi",amount:v.amount,

        desc:`Chi: ${v.ncc||""} — ${v.note}`,

        ref:v.orderId,method:v.method||"transfer",bankAccountId:v.bankAccountId||null,status:"pending"});

    });



      {tab==="banks"&&<BankAccountModule bankAccounts={bankAccounts} onUpdate={onUpdateBankAccounts||((v)=>{})} pushNotif={pushNotif}/>}

      {tab==="invoices"&&<InvoiceModule orders={orders} vouchers={vouchers}

        outputInvoices={outputInvoices} onUpdateOutputInvoices={onUpdateOutputInvoices||((v)=>{})}

        inputInvoices={inputInvoices}   onUpdateInputInvoices={onUpdateInputInvoices||((v)=>{})}

        pushNotif={pushNotif} currentUser={currentUser}/>}





      if(e.status==="confirmed"){

        if(e.type==="thu") bal+=e.amount;

        else bal-=e.amount;

      }

      return {...e,balance:bal};

    });

    return out.reverse();

  },[ledger]);



  const totalThu   =ledger.filter(e=>e.type==="thu"&&e.status==="confirmed").reduce((s,e)=>s+e.amount,0);

  const totalChi   =(ledger.filter(e=>e.type==="chi"&&e.status==="confirmed").reduce((s,e)=>s+e.amount,0))+

                    (ledger.filter(e=>e.type==="hoan"&&e.status==="confirmed").reduce((s,e)=>s+e.amount,0));

  const soDu       =totalThu-totalChi;



  // ── Debt summary ─────────────────────────────────────

  const debtData=useMemo(()=>{

    // KH debt

    const khDebt=orders.filter(o=>!["completed","cancelled"].includes(o.status)).map(o=>{

      const thuOK=vouchers.filter(v=>v.orderId===o.id&&v.type==="thu"&&v.status==="approved").reduce((s,v)=>s+v.amount,0);

    const khDebt=orders.filter(o=>!["completed","cancelled"].includes(o.status)).map(o=>{
      if(remaining<=0) return null;

      const days=Math.floor((Date.now()-new Date(o.createdAt))/86400000);

      if(remaining<=0) return null;
    }).filter(Boolean).sort((a,b)=>b.days-a.days);



    }).filter(Boolean).sort((a,b)=>b.days-a.days);



    // NCC debt (from expenses not fully paid)

    const nccDebt=expenses.filter(e=>["pending_kt","pending_gd","pending_pay"].includes(e.status)).map(e=>({

    // NCC debt (from expenses not fully paid)
  },[ledger]);



  const totalThu   =ledger.filter(e=>e.type==="thu"&&e.status==="confirmed").reduce((s,e)=>s+e.amount,0);

          {step===2&&<div>

            <div style={{fontSize:15,fontWeight:600,color:"#1e3a8a",marginBottom:16}}>🗺 Dịch vụ & Cấu trúc giá</div>





            <div style={{marginBottom:16}}>

              <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:8,textTransform:"uppercase",letterSpacing:.4}}>

                Loại đơn hàng *

              </label>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>

                {Object.entries(INVOICE_TYPES).map(([k,v])=>(

                  <button key={k} onClick={()=>setDraftInvoiceType(k)}

                {Object.entries(INVOICE_TYPES).map(([k,v])=>(
                  <button key={k} onClick={()=>setDraftInvoiceType(k)}
                      cursor:"pointer",textAlign:"left"}}>

                    <div style={{fontSize:18,marginBottom:4}}>{v.icon}</div>

                      cursor:"pointer",textAlign:"left"}}>
                    <div style={{fontSize:11,color:"#64748b",marginTop:2}}>

                      {k==="invoice"

                        ?"Dùng TK Công ty + TK cá nhân ủy quyền · Xuất HĐ VAT"

                        :"Chỉ dùng TK cá nhân ủy quyền · Không xuất HĐ"}

                    </div>

                  </button>

                ))}

              </div>

            </div>



            {/* VAT rate — chỉ hiện khi có HĐ */}

            {draftInvoiceType==="invoice"&&(

              <div style={{marginBottom:16}}>

                <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:8,textTransform:"uppercase",letterSpacing:.4}}>

                  Thuế suất VAT *

                </label>

                <div style={{display:"flex",gap:8}}>

                  {[0,5,8,10].map(r=>(

                    <button key={r} onClick={()=>setVatRate(r)}

                  {[0,5,8,10].map(r=>(
                    <button key={r} onClick={()=>setVatRate(r)}
                        cursor:"pointer",fontSize:14,fontWeight:vatRate===r?700:400,

                        color:vatRate===r?"#1e3a8a":"#64748b"}}>

                      {r}%

                    </button>

                  ))}

                </div>

                <div style={{fontSize:11,color:"#64748b",marginTop:6}}>

                  0% = Không chịu VAT · 5% = Du lịch trọn gói · 8% = Phổ thông · 10% = Đặc biệt

                </div>

              </div>

            )}

            <FieldWrap label="Loại dịch vụ" req>

              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>

            <FieldWrap label="Loại dịch vụ" req>
              </div>

            </FieldWrap>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 12px"}}>

              <div style={{gridColumn:"1/-1"}}><FieldWrap label="Tên dịch vụ / Tour" req><Inp value={serviceName} onChange={e=>setSvcName(e.target.value)} placeholder="VD: Tour Phú Quốc 3N2Đ Premium..." err={!serviceName}/></FieldWrap></div>

              <FieldWrap label="Ngày khởi hành"><Inp type="date" value={departDate} onChange={e=>setDep(e.target.value)}/></FieldWrap>

              <FieldWrap label="Ngày về"><Inp type="date" value={returnDate} onChange={e=>setRet(e.target.value)}/></FieldWrap>

              <FieldWrap label="Sale phụ trách"><Sel value={sale} onChange={e=>setSale(e.target.value)}>{SALE_STAFF.map(s=><option key={s} value={s}>{s}</option>)}</Sel></FieldWrap>

            </div>

            <div style={{background:"#f0f4ff",borderRadius:10,padding:"13px",border:"1px solid #e8e6df",marginBottom:12}}>

            </div>
                <>

                  <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:"#1e3a8a"}}>

                    {serviceId==="tour_ghep_qt"?"🌏":"🚌"} Cấu trúc giá Tour ghép — {serviceId==="tour_ghep_qt"?"Quốc tế":"Nội địa"}

                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>

                    <FieldWrap label="Giá bán / slot (đ) *">

                      <Inp type="number" value={pricing.slotPrice||0} min={0}

                        onChange={e=>setPricing(p=>({...p,slotPrice:+e.target.value}))}

                        style={{textAlign:"right",fontSize:15,fontWeight:600}} placeholder="VD: 8500000"/>

                    </FieldWrap>

                    <FieldWrap label="Số slot (khách)">

                      <Inp type="number" value={pricing.slotCount||1} min={1}

                        onChange={e=>setPricing(p=>({...p,slotCount:+e.target.value}))}

                        style={{textAlign:"center"}}/>

                    </FieldWrap>

                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>

                    {[{l:"Người lớn",k:"adults"},{l:"Trẻ em",k:"children"},{l:"Em bé",k:"babies"}].map(({l,k})=>(

                      <div key={k} style={{textAlign:"center"}}>

                        <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>{l}</div>

                        <Inp type="number" value={pax[k]} min={0} onChange={e=>setPax(p=>({...p,[k]:+e.target.value}))} style={{textAlign:"center"}}/>

                      </div>

                    ))}

                  </div>



                  {canSeeCost&&(

                    <div style={{marginTop:10,padding:"10px 12px",background:"#fef9e7",border:"1px solid #e8c53a",borderRadius:8}}>

                      <div style={{fontSize:11,fontWeight:600,color:"#7a5a00",marginBottom:8,textTransform:"uppercase",letterSpacing:.4}}>

                        🔒 Giá gốc (chỉ KT/GĐ thấy)

                      </div>

                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>

                        <FieldWrap label="Giá gốc / slot (đ)">

                          <Inp type="number" value={pricing.slotCost||0} min={0}

                            onChange={e=>setPricing(p=>({...p,slotCost:+e.target.value}))}

                            style={{textAlign:"right",background:"#fffbeb"}} placeholder="Chi phí thực/slot"/>

                        </FieldWrap>

                        <FieldWrap label="Chi phí cố định cả đoàn (đ)">

                          <Inp type="number" value={pricing.fixedCost||0} min={0}

                            onChange={e=>setPricing(p=>({...p,fixedCost:+e.target.value}))}

                            style={{textAlign:"right",background:"#fffbeb"}} placeholder="Xe, HDV, phí cố định..."/>

                        </FieldWrap>

                      </div>

                    </div>

                  )}

                </>

              ):(

                <>

                  <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:"#444"}}>💰 Giá bán cho khách</div>

                  {[{l:"Người lớn",k:"adults",pk:"adultPrice",u:"đ/NL"},{l:"Trẻ em",k:"children",pk:"childPrice",u:"đ/Trẻ"},{l:"Em bé",k:"babies",pk:"babyPrice",u:"đ/Bé"}].map(({l,k,pk,u})=>(

                    <div key={k} style={{display:"grid",gridTemplateColumns:"100px 70px 1fr auto",gap:8,alignItems:"center",marginBottom:7}}>

                      <span style={{fontSize:12,color:"#555",fontWeight:500}}>{l}</span>

                      <Inp type="number" value={pax[k]} min={0} onChange={e=>setPax(p=>({...p,[k]:+e.target.value}))} style={{textAlign:"center"}}/>

                      <Inp type="number" value={pricing[pk]||0} min={0} onChange={e=>setPricing(p=>({...p,[pk]:+e.target.value}))} placeholder="Giá bán" style={{textAlign:"right"}}/>

                      <span style={{fontSize:11,color:"#888",whiteSpace:"nowrap"}}>{u}</span>

                    </div>

                  ))}





                  {canSeeCost&&(

                    <div style={{marginTop:10,padding:"10px 12px",background:"#fef9e7",border:"1px solid #e8c53a",borderRadius:8}}>

                      <div style={{fontSize:11,fontWeight:600,color:"#7a5a00",marginBottom:8,textTransform:"uppercase",letterSpacing:.4}}>

                        🔒 Giá gốc / Chi phí (chỉ KT & GĐ thấy)

                      </div>

                      {[{l:"Giá gốc NL",k:"adultCost",u:"đ/NL"},{l:"Giá gốc Trẻ",k:"childCost",u:"đ/Trẻ"},{l:"Giá gốc Bé",k:"babyCost",u:"đ/Bé"}].map(({l,k,u})=>(

                        <div key={k} style={{display:"grid",gridTemplateColumns:"110px 1fr auto",gap:8,alignItems:"center",marginBottom:6}}>

                          <span style={{fontSize:12,color:"#7a5a00",fontWeight:500}}>{l}</span>

                          <Inp type="number" value={pricing[k]||0} min={0}

                            onChange={e=>setPricing(p=>({...p,[k]:+e.target.value}))}

                            placeholder="Chi phí gốc" style={{textAlign:"right",background:"#fffbeb"}}/>

                          <span style={{fontSize:11,color:"#888",whiteSpace:"nowrap"}}>{u}</span>

                        </div>

                      ))}

                      <div style={{display:"grid",gridTemplateColumns:"110px 1fr auto",gap:8,alignItems:"center"}}>

                        <span style={{fontSize:12,color:"#7a5a00",fontWeight:500}}>Chi phí cố định</span>

                        <Inp type="number" value={pricing.fixedCost||0} min={0}

                          onChange={e=>setPricing(p=>({...p,fixedCost:+e.target.value}))}

                          placeholder="Xe, HDV, phí khác..." style={{textAlign:"right",background:"#fffbeb"}}/>

                        <span style={{fontSize:11,color:"#888",whiteSpace:"nowrap"}}>đ/đoàn</span>

                      </div>

                    </div>

                  )}

                  {!canSeeCost&&(

                    <div style={{marginTop:8,padding:"7px 12px",background:"#f0f4ff",borderRadius:8,fontSize:11,color:"#94a3b8",display:"flex",alignItems:"center",gap:6}}>

                      🔒 Giá gốc & lợi nhuận do Kế toán/Giám đốc nhập

                    </div>

                  )}

                </>

              )}





              <div style={{borderTop:"1px solid #dbeafe",marginTop:10,paddingTop:10}}>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>

              <div style={{borderTop:"1px solid #dbeafe",marginTop:10,paddingTop:10}}>
                  <span style={{fontSize:15,fontWeight:700,color:"#1e3a8a",fontVariantNumeric:"tabular-nums"}}>{fmt(totalRevenue)} đ</span>

                </div>

                {draftInvoiceType==="invoice"&&(

                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748b",marginBottom:2}}>

                    <span>VAT {vatRate}%</span>

                    <span style={{fontVariantNumeric:"tabular-nums",color:"#5c2eb0"}}>+ {fmt(vatAmount)} đ</span>

                  </div>

                )}

                <div style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:"#f0f4ff",borderRadius:8,marginTop:4,marginBottom:6}}>

                  <span style={{fontSize:13,fontWeight:600,color:"#1e3a8a"}}>

                    {draftInvoiceType==="invoice"?"Tổng tiền KH trả (có VAT)":"Tổng tiền KH trả"}

                  </span>

                  <span style={{fontSize:16,fontWeight:800,color:"#1e3a8a",fontVariantNumeric:"tabular-nums"}}>{fmt(totalWithVat)} đ</span>

                </div>

                {canSeeCost&&totalCost>0&&(

                  <>

                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748b",marginBottom:2}}>

                      <span>Chi phí gốc (NCC)</span>

                      <span style={{fontVariantNumeric:"tabular-nums",color:"#b0554a"}}>- {fmt(totalCost)} đ</span>

                    </div>

                      <span style={{fontVariantNumeric:"tabular-nums",color:"#b0554a"}}>- {fmt(totalCost)} đ</span>
                      <div>

                        <div style={{fontSize:13,fontWeight:600,color:profitPct>=5?"#1e3a8a":"#8b2a1a"}}>Lợi nhuận dự kiến</div>

                        <div style={{fontSize:10,color:"#64748b",marginTop:1}}>= Doanh thu chưa VAT - Chi phí</div>

                      </div>

                      <div style={{textAlign:"right"}}>

                      </div>
                      <div style={{textAlign:"right"}}>
                          Biên LN: {profitPct.toFixed(1)}%{profitPct<5&&" ⚠ Thấp!"}

                        </div>

                      </div>

                    </div>

                  </>

                )}

              </div>

                )}
              </div>
        ))}

      </div>





      {tab==="banks"&&<BankAccountModule bankAccounts={bankAccounts} onUpdate={onUpdateBankAccounts||((v)=>{})} pushNotif={pushNotif}/>}

      {tab==="invoices"&&<InvoiceModule orders={orders} vouchers={vouchers}

        outputInvoices={outputInvoices} onUpdateOutputInvoices={onUpdateOutputInvoices||((v)=>{})}

        inputInvoices={inputInvoices}   onUpdateInputInvoices={onUpdateInputInvoices||((v)=>{})}

        pushNotif={pushNotif} currentUser={currentUser}/>}





      {tab==="ledger"&&(

        <Card style={{padding:0,overflow:"hidden"}}>

          <div style={{padding:"12px 16px",borderBottom:"1px solid #e0e7ff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>

            <div style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>?? S? qu? t?ng h?p</div>

            <div style={{display:"flex",alignItems:"center",gap:10}}>

              <div style={{fontSize:12,color:"#64748b"}}>{ledgerWithBalance.length} giao d?ch</div>

              <PrintBtn small label="?? In s? qu?" onClick={()=>{

                const rows=ledgerWithBalance.map(e=>`<tr>

                  <td>${fmtD(e.date)||"—"}</td>

                  <td style="font-family:monospace;font-weight:600;color:${e.type==="thu"?"#1e3a8a":"#b0554a"}">${e.id}</td>

                  <td>${{thu:"Thu",chi:"Chi",hoan:"Hoàn"}[e.type]||e.type}</td>


function OrderForm({onSave,onCancel,pushNotif,defaultSale=SALE_STAFF[0],currentRole="sale",customers=[],onCreateCustomer}){

  const [step,setStep]=useState(1);

  const [touched,setTouched]=useState({});



  // CRM search state

  const [crmSearch, setCrmSearch] = useState("");

  const [crmOpen,   setCrmOpen]   = useState(false);

  const [crmSource, setCrmSource] = useState(null); // customer id nếu chọn từ CRM



  const [C,setC]=useState({name:"",phone:"",email:"",dob:"",address:"",province:"",cccd:"",cccdImg:null});

  const [serviceId,setSvc]=useState("tour");

  const [serviceName,setSvcName]=useState("");

  const [departDate,setDep]=useState("");

  const [returnDate,setRet]=useState("");

  const [pax,setPax]=useState({adults:1,children:0,babies:0});

  const [pricing,setPricing]=useState({

    adultPrice:0, childPrice:0, babyPrice:0,

    slotPrice:0,  slotCount:1,

    adultCost:0, childCost:0, babyCost:0,

    slotCost:0,  fixedCost:0,

  });

  const [currency,setCurrency]=useState("VND");

  const [exchangeRate,setExchangeRate]=useState(1);

// ── PassengerPanel — Danh sách đoàn & CCCD ───────────────


function OrderList({orders,vouchers,onView,onCreate,currentRole,currentUser}){

  const [search,      setSearch]      = useState("");

  const [filterStatus,setFilterStatus]= useState("all");

  const [filterPrice, setFilterPrice] = useState("all");

  const [sortBy,      setSortBy]      = useState("createdAt");

  // Sale mặc định chỉ xem đơn của mình, có thể mở rộng

  const isSale = currentRole==="sale";

  const [myOnly, setMyOnly] = useState(isSale);



  const SVC_ICONS=Object.fromEntries(SERVICES.map(s=>[s.id,s.icon]));

  const filtered=useMemo(()=>{

    let list=[...orders];

    // Filter theo nhân viên

    if(myOnly&&currentUser) list=list.filter(o=>o.sale===currentUser.name);

    if(search.trim()){

      const q=search.toLowerCase();

    if(search.trim()){
    }

    if(filterStatus!=="all") list=list.filter(o=>o.status===filterStatus);

    if(filterPrice==="pending") list=list.filter(o=>!["approved"].includes(o.priceApprovalStatus||"draft_price"));

    if(filterPrice==="warning") list=list.filter(o=>{

    if(filterPrice==="pending") list=list.filter(o=>!["approved"].includes(o.priceApprovalStatus||"draft_price"));
    if(filterPrice==="warning") list=list.filter(o=>{
    });

    if(filterPrice==="no_cost") list=list.filter(o=>!o.pricing?.totalCost);

    list.sort((a,b)=>{

      if(sortBy==="createdAt") return new Date(b.createdAt)-new Date(a.createdAt);

    list.sort((a,b)=>{
      if(sortBy==="depart")    return new Date(a.departDate)-new Date(b.departDate);

      return 0;

    });

    return list;

  },[orders,search,filterStatus,filterPrice,sortBy]);



  const stats=useMemo(()=>{

    const active     = orders.filter(o=>!["completed","cancelled"].includes(o.status));

  const stats=useMemo(()=>{
    const totalPaid    = active.reduce((s,o)=>s+(vouchers.filter(v=>v.orderId===o.id&&v.type==="thu"&&v.status==="approved").reduce((s,v)=>s+v.amount,0)),0);

    const pendingPrice = active.filter(o=>!["approved"].includes(o.priceApprovalStatus||"draft_price")).length;

    const totalPaid    = active.reduce((s,o)=>s+(vouchers.filter(v=>v.orderId===o.id&&v.type==="thu"&&v.status==="approved").reduce((s,v)=>s+v.amount,0)),0);
    const pendingPrice = active.filter(o=>!["approved"].includes(o.priceApprovalStatus||"draft_price")).length;
    return{total:orders.length,active:active.length,totalRevenue,totalPaid,

      locked:orders.filter(o=>o.status==="locked"||(o.validationErrors?.length>0)).length,

      pendingPrice, noCost, lowProfit};

  },[orders,vouchers]);



  return(

    <div>

      <PageHeader

        title="Danh sách đơn hàng"

        subtitle={`${stats.total} đơn · ${stats.active} đang xử lý`}

        actions={<Btn onClick={onCreate} size="md">+ Tạo đơn mới</Btn>}

      />



      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>

        <StatCard label="TỔNG ĐƠN"           value={stats.total}                   sub={`${stats.active} đang xử lý`}                    color="var(--c-primary-mid)"/>

        <StatCard label="TỔNG DOANH THU"      value={fmtS(stats.totalRevenue)+" đ"} sub="Đơn đang hoạt động"                               color="var(--c-primary)"/>

        <StatCard label="TỔNG ĐƠN"           value={stats.total}                   sub={`${stats.active} đang xử lý`}                    color="var(--c-primary-mid)"/>
        <StatCard label="TỔNG DOANH THU"      value={fmtS(stats.totalRevenue)+" đ"} sub="Đơn đang hoạt động"                               color="var(--c-primary)"/>
        <StatCard label="LN THẤP / CẢNH BÁO" value={stats.lowProfit}               sub="Cần GĐ xem xét"                                   color={stats.lowProfit>0?"var(--c-danger)":"var(--c-text-muted)"}   onClick={()=>setFilterPrice("warning")}/>

      </div>





      {stats.locked>0&&(

        <div style={{background:"#fdf0ee",border:"1px solid #f5c0b5",borderRadius:10,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#8b2a1a"}}>

          🔒 <strong>{stats.locked} đơn bị khóa</strong> — cần bổ sung thông tin trước khi thu tiền.

        </div>

      )}

      {stats.lowProfit>0&&(currentRole==="accountant"||currentRole==="manager")&&(

        <div style={{background:"#fef9e7",border:"1px solid #e8c53a",borderRadius:10,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,color:"#7a5a00"}}>

          <span>⚠️ <strong>{stats.lowProfit} đơn</strong> có lợi nhuận thấp hơn ngưỡng tối thiểu — cần KT/GĐ kiểm tra giá gốc</span>

          <button onClick={()=>setFilterPrice("warning")} style={{fontSize:11,padding:"4px 10px",background:"#fff",border:"1px solid #e8c53a",borderRadius:6,cursor:"pointer",color:"#7a5a00",fontWeight:600}}>Xem ngay</button>

        </div>

      )}

      {stats.noCost>0&&(currentRole==="accountant"||currentRole==="manager")&&(

        <div style={{background:"#fdf0ee",border:"1px solid #f5c0b5",borderRadius:10,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,color:"#8b2a1a"}}>

          <span>📋 <strong>{stats.noCost} đơn</strong> chưa nhập giá gốc — chưa tính được lợi nhuận thực tế</span>

          <button onClick={()=>setFilterPrice("no_cost")} style={{fontSize:11,padding:"4px 10px",background:"#fff",border:"1px solid #f5c0b5",borderRadius:6,cursor:"pointer",color:"#b0554a",fontWeight:600}}>Xem ngay</button>

        </div>

      )}





      <Card style={{padding:"12px 16px",marginBottom:12,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>

        <input placeholder="🔍 Tìm đơn, khách hàng, SĐT..." value={search} onChange={e=>setSearch(e.target.value)}

          style={{flex:1,minWidth:180,padding:"8px 12px",border:"1px solid #d5d3cb",borderRadius:8,fontSize:13,background:"#f8faff",outline:"none"}}/>

        <Sel value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:"auto",padding:"8px 10px"}}>

          <option value="all">Tất cả trạng thái</option>

          {Object.entries(ORDER_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}

        </Sel>

        <Sel value={filterPrice} onChange={e=>setFilterPrice(e.target.value)} style={{width:"auto",padding:"8px 10px"}}>

          <option value="all">Tất cả giá gốc</option>

          <option value="no_cost">Chưa nhập giá gốc</option>

          <option value="pending">Chưa duyệt giá</option>

          <option value="warning">LN thấp hơn ngưỡng</option>

        </Sel>

        <Sel value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{width:"auto",padding:"8px 10px"}}>

          <option value="createdAt">Mới nhất</option>

          <option value="revenue">Doanh thu</option>

          <option value="depart">Ngày đi</option>

        </Sel>

        <button onClick={()=>setMyOnly(v=>!v)}

        </Sel>
        <button onClick={()=>setMyOnly(v=>!v)}
            fontSize:12,cursor:"pointer",fontWeight:myOnly?600:400,whiteSpace:"nowrap"}}>

          {myOnly?"👤 Của tôi":"👥 Tất cả"}

        </button>

        <Btn onClick={onCreate}>+ Tạo đơn mới</Btn>

      </Card>



      <Card style={{padding:0,overflow:"hidden"}}>

        <div style={{overflowX:"auto"}}>

          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>

            <thead><tr style={{background:"#f0f4ff",borderBottom:"1px solid #e8e6df"}}>

              {["Mã đơn","Khách hàng","Dịch vụ","Ngày đi","Doanh thu","Thanh toán","Lợi nhuận","Trạng thái","Giá gốc",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:600,color:"#555",fontSize:12,whiteSpace:"nowrap"}}>{h}</th>)}

            </tr></thead>

            <tbody>

              {filtered.length===0&&<tr><td colSpan={10} style={{padding:"32px",textAlign:"center",color:"#aaa",fontSize:13}}>Không tìm thấy đơn hàng nào</td></tr>}

              {filtered.map((order,i)=>{

                const thuOk=vouchers.filter(v=>v.orderId===order.id&&v.type==="thu"&&v.status==="approved").reduce((s,v)=>s+v.amount,0);

              {filtered.map((order,i)=>{
                const thuOk=vouchers.filter(v=>v.orderId===order.id&&v.type==="thu"&&v.status==="approved").reduce((s,v)=>s+v.amount,0);
                const priceApproval=order.priceApprovalStatus||"draft_price";

                const priceSt=PRICE_APPROVAL_STATUS[priceApproval];

                const priceApproval=order.priceApprovalStatus||"draft_price";
                const priceSt=PRICE_APPROVAL_STATUS[priceApproval];
                  : null;

                return(

                  : null;
                    onMouseEnter={e=>e.currentTarget.style.background="#f0f8f5"}

    });

                    onMouseEnter={e=>e.currentTarget.style.background="#f0f8f5"}
    list.sort((a,b)=>{

      if(sortBy==="createdAt") return new Date(b.createdAt)-new Date(a.createdAt);

      if(sortBy==="revenue")   return (b.pricing?.totalRevenue||0)-(a.pricing?.totalRevenue||0);

      if(sortBy==="depart")    return new Date(a.departDate)-new Date(b.departDate);

      return 0;

    });

    return list;

  },[orders,search,filterStatus,filterPrice,sortBy]);



  const stats=useMemo(()=>{

    const active     = orders.filter(o=>!["completed","cancelled"].includes(o.status));

    const totalRevenue = active.reduce((s,o)=>s+(o.pricing?.totalRevenue||0),0);

    const totalPaid    = active.reduce((s,o)=>s+(vouchers.filter(v=>v.orderId===o.id&&v.type==="thu"&&v.status==="approved").reduce((s,v)=>s+v.amount,0)),0);

    const pendingPrice = active.filter(o=>!["approved"].includes(o.priceApprovalStatus||"draft_price")).length;

    const noCost       = active.filter(o=>!o.pricing?.totalCost).length;

    const lowProfit    = active.filter(o=>o.pricing?.totalCost>0&&(o.pricing?.profitPct||0)<getProfitThreshold(o.service)).length;

    return{total:orders.length,active:active.length,totalRevenue,totalPaid,

      locked:orders.filter(o=>o.status==="locked"||(o.validationErrors?.length>0)).length,

      pendingPrice, noCost, lowProfit};

  },[orders,vouchers]);



  return(

    <div>

      <PageHeader

        title="Danh sách ðõn hàng"

        subtitle={`${stats.total} ðõn · ${stats.active} ðang x? l?`}

        actions={<Btn onClick={onCreate} size="md">+ T?o ðõn m?i</Btn>}

      />



      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>

        <StatCard label="T?NG ÐÕN"           value={stats.total}                   sub={`${stats.active} ðang x? l?`}                    color="var(--c-primary-mid)"/>

        <StatCard label="T?NG DOANH THU"      value={fmtS(stats.totalRevenue)+" ð"} sub="Ðõn ðang ho?t ð?ng"                               color="var(--c-primary)"/>

        <StatCard label="Ð? THU (KT DUY?T)"  value={fmtS(stats.totalPaid)+" ð"}    sub={`${stats.totalRevenue?Math.round(stats.totalPaid/stats.totalRevenue*100):0}% t?ng DT`} color="var(--c-warning)"/>

        <StatCard label="CHÝA DUY?T GIÁ"     value={stats.pendingPrice}             sub={`${stats.noCost} chýa nh?p giá g?c`}              color={stats.pendingPrice>0?"var(--c-danger)":"var(--c-text-muted)"} onClick={()=>setFilterPrice("pending")}/>

        <StatCard label="LN TH?P / C?NH BÁO" value={stats.lowProfit}               sub="C?n GÐ xem xét"                                   color={stats.lowProfit>0?"var(--c-danger)":"var(--c-text-muted)"}   onClick={()=>setFilterPrice("warning")}/>

      </div>





      {stats.locked>0&&(

        <div style={{background:"#fdf0ee",border:"1px solid #f5c0b5",borderRadius:10,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#8b2a1a"}}>

          ?? <strong>{stats.locked} ðõn b? khóa</strong> — c?n b? sung thông tin trý?c khi thu ti?n.

        </div>

      )}

      {stats.lowProfit>0&&(currentRole==="accountant"||currentRole==="cashier"||currentRole==="manager")&&(

        <div style={{background:"#fef9e7",border:"1px solid #e8c53a",borderRadius:10,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,color:"#7a5a00"}}>

          <span>?? <strong>{stats.lowProfit} ðõn</strong> có l?i nhu?n th?p hõn ngý?ng t?i thi?u — c?n KT/GÐ ki?m tra giá g?c</span>

          <button onClick={()=>setFilterPrice("warning")} style={{fontSize:11,padding:"4px 10px",background:"#fff",border:"1px solid #e8c53a",borderRadius:6,cursor:"pointer",color:"#7a5a00",fontWeight:600}}>Xem ngay</button>

        </div>

      )}

      {stats.noCost>0&&(currentRole==="accountant"||currentRole==="cashier"||currentRole==="manager")&&(

        <div style={{background:"#fdf0ee",border:"1px solid #f5c0b5",borderRadius:10,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,color:"#8b2a1a"}}>

          <span>?? <strong>{stats.noCost} ðõn</strong> chýa nh?p giá g?c — chýa tính ðý?c l?i nhu?n th?c t?</span>

          <button onClick={()=>setFilterPrice("no_cost")} style={{fontSize:11,padding:"4px 10px",background:"#fff",border:"1px solid #f5c0b5",borderRadius:6,cursor:"pointer",color:"#b0554a",fontWeight:600}}>Xem ngay</button>

        </div>

      )}




function OrderDetail({order,vouchers,expenses=[],onBack,onUpdate,onAddVoucher,onApprove,onReject,pushNotif,currentRole,bankAccounts=[],currentUser}){

  const [tab,setTab]=useState("info");

  const [showPayForm,setShowPayForm]=useState(false);

  const [payAmount,  setPayAmount]  =useState("");

  const [payMethod,  setPayMethod]  =useState("transfer");

  const [payNote,    setPayNote]    =useState("Cọc đặt cọc tour");

  const [payImg,     setPayImg]     =useState(null);

  const [payInstall, setPayInstall] =useState(1);



  const thuOk    = vouchers.filter(v=>v.orderId===order.id&&v.type==="thu"&&v.status==="approved").reduce((s,v)=>s+v.amount,0);

  const thuPending=vouchers.filter(v=>v.orderId===order.id&&v.type==="thu"&&v.status==="pending").reduce((s,v)=>s+v.amount,0);

  // Tổng tiền đúng: có VAT nếu đơn có HĐ

  const orderTotal = calcOrderTotal(order);

  const prog     = pct(thuOk,orderTotal);

  const remaining= orderTotal-thuOk;

  const pendingCount=vouchers.filter(v=>v.orderId===order.id&&v.status==="pending").length;



  const pendingCount=vouchers.filter(v=>v.orderId===order.id&&v.status==="pending").length;
  const passengers= order.passengers||[];

  const missingCccd=passengers.filter(p=>!p.cccd).length;

  const notFilled = totalPax - passengers.length;



  // Hạn thanh toán đợt 2

  const [deadline2, setDeadline2] = useState(order.paymentDeadline2||"");

  const deadline2Days = deadline2 ? Math.ceil((new Date(deadline2)-new Date(NOW_ISO))/86400000) : null;

  const deadline2Warn = deadline2Days!==null && deadline2Days<=3 && remaining>0;



  const handlePaySubmit=()=>{

    const amount=Number(payAmount);

    if(!amount||amount<=0){pushNotif("Nhập số tiền hợp lệ","error");return;}

    if(amount>remaining){pushNotif("Vượt quá số tiền còn lại ("+fmt(remaining)+" đ)","error");return;}

    const id=genVId("thu",vouchers);

    const v={

      id,type:"thu",orderId:order.id,

    const v={
      amount,method:payMethod,

      note:payNote,

      date:new Date().toISOString().slice(0,10),

      status:"pending",

      approvedBy:null,

      billImg:payImg,

      installment:payInstall,

      billImg:payImg,
    };

    onAddVoucher(v);

    setShowPayForm(false);

    setPayAmount("");setPayImg(null);

    setPayNote("Cọc đặt cọc tour");

    pushNotif("Đã ghi nhận thanh toán "+fmt(amount)+" đ — chờ kế toán duyệt","warning");

  };



  const handlePrintConfirmation=()=>{

    const tourOp=SEED_TOUR_OPS.find(op=>op.orderId===order.id)||null;

    const html=buildConfirmation(order,vouchers,tourOp);

    openPrintWindow(html);

  };



  // Gợi ý số tiền theo đợt

              <FieldWrap label="Ảnh chứng từ / Biên lai chuyển khoản">
  const depositAmt = Math.round(totalRev*0.7);

  const suggestAmounts = remaining>0?[

    {label:"Cọc 30%",  amt:Math.round(orderTotal*0.3)},

    {label:"Cọc 70%",  amt:Math.round(orderTotal*0.7)},

    {label:"Thanh toán đủ", amt:remaining},

  ].filter(s=>s.amt>0&&s.amt<=remaining):[];



  return(

    <div style={{maxWidth:1000,margin:"0 auto"}}>

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>

        <Btn variant="outline" size="sm" onClick={onBack}>← Danh sách</Btn>

        <div>

          <div style={{fontSize:20,fontWeight:700,color:"#1e3a8a"}}>{order.id}</div>

          <div style={{fontSize:12,color:"#888"}}>{order.serviceName} · Tạo {fmtDT(order.createdAt)} · Sale: {order.sale}</div>

        </div>

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>

          {pendingCount>0&&<span style={{background:"#fef9e7",color:"#7a5a00",border:"1px solid #e8c53a",borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600}}>⏳ {pendingCount} chờ duyệt</span>}

          <SBadge status={order.status} cfg={ORDER_STATUS}/>

          {/* Sale/ĐH: nút sửa đơn để mở khóa */}

          {order.status==="locked"&&(currentRole==="sale"||currentRole==="dieu_hanh")&&(

            <Btn size="sm" variant="outline" onClick={()=>onUpdate&&onUpdate({...order,status:"pending_payment",validationErrors:[]})}>

              🔓 Mở khóa & sửa

            </Btn>

          )}

          {/* KT: nút hủy đơn */}

          {(currentRole==="accountant"||currentRole==="manager")&&!["cancelled","completed"].includes(order.status)&&(

            <Btn size="sm" variant="danger" onClick={()=>{

              // Kiểm tra booking NCC còn cọc chưa thu hồi

            <Btn size="sm" variant="danger" onClick={()=>{
                ? "⚠ Kiểm tra và thu hồi cọc NCC trước khi hủy!\n\n" : "";

              if(window.confirm(nccWarning+"Xác nhận hủy đơn "+order.id+"?\nThao tác không thể hoàn tác.")){

      const user = userAccounts.find(u=>
              if(window.confirm(nccWarning+"Xác nhận hủy đơn "+order.id+"?\nThao tác không thể hoàn tác.")){
              }

            }}>❌ Hủy đơn</Btn>

          )}

          {/* Chuyển sang "Đang dịch vụ" */}

          {order.status==="full_paid"&&(currentRole==="manager"||currentRole==="dieu_hanh"||currentRole==="accountant")&&(

            <Btn size="sm" onClick={()=>onUpdate&&onUpdate({...order,status:"in_service"})}>

              🚀 Bắt đầu dịch vụ

            </Btn>

          )}

          {/* Kết thúc dịch vụ */}

          {order.status==="in_service"&&(currentRole==="manager"||currentRole==="dieu_hanh")&&(

            <Btn size="sm" onClick={()=>onUpdate&&onUpdate({...order,status:"completed",completedAt:new Date(NOW_ISO).toISOString()})}>

              ✅ Hoàn thành

            </Btn>

          )}

          {["partial_paid","full_paid","in_service","completed"].includes(order.status)

            ? <PrintBtn label="📋 In phiếu xác nhận dịch vụ" onClick={handlePrintConfirmation}/>

            : <span style={{fontSize:11,color:"rgba(255,255,255,.6)",padding:"6px 10px",

                border:"1px solid rgba(255,255,255,.2)",borderRadius:8}}>

                🔒 In phiếu sau khi khách cọc

              </span>

          }

        </div>

      </div>



      {/* ── PAYMENT SUMMARY BANNER ── */}

      {orderTotal>0&&(

        <div style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb)",borderRadius:14,padding:"16px 20px",marginBottom:14,color:"#fff"}}>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>

            <div>

              <div style={{fontSize:14,fontWeight:700}}>💳 Tình trạng thanh toán</div>

              <div style={{fontSize:10,opacity:.65,marginTop:1}}>

                {order.invoiceType==="invoice"?"Giá đã bao gồm VAT 8%":"Giá chưa có VAT (không xuất HĐ)"}

              </div>

            </div>

            {remaining>0&&!showPayForm&&(

              <Btn onClick={()=>setShowPayForm(true)}

                style={{background:"#fff",color:"#1e3a8a",border:"none",fontWeight:700,fontSize:12,padding:"7px 16px",borderRadius:8,cursor:"pointer"}}>

                + Ghi nhận thanh toán từ khách

              </Btn>

            )}

            {remaining<=0&&(

              <span style={{background:"#22c55e",color:"#fff",padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:700}}>

                ✅ Đã thu đủ

              </span>

            )}

          </div>



          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:10}}>

            {[

              {l:"Tổng tiền",  v:fmtS(orderTotal)+"đ",         sub:order.invoiceType==="invoice"?"Đã gồm VAT":"Chưa VAT"},

              {l:"Đã thu",     v:fmtS(thuOk)+"đ",               sub:prog+"% hoàn thành",  hi:prog===100},

              {l:"Tổng tiền",  v:fmtS(orderTotal)+"đ",         sub:order.invoiceType==="invoice"?"Đã gồm VAT":"Chưa VAT"},
              {l:"Đã thu",     v:fmtS(thuOk)+"đ",               sub:prog+"% hoàn thành",  hi:prog===100},
            ].map(({l,v,sub,hi,warn})=>(

              <div key={l} style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:"10px 12px"}}>

                <div style={{fontSize:10,opacity:.7,marginBottom:3,textTransform:"uppercase",letterSpacing:.4}}>{l}</div>

              <div key={l} style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:10,opacity:.7,marginTop:2}}>{sub}</div>

              </div>

            ))}

          </div>



          <div style={{height:6,background:"rgba(255,255,255,.2)",borderRadius:3,overflow:"hidden",marginBottom:8}}>

            <div style={{width:prog+"%",height:"100%",borderRadius:3,

          <div style={{height:6,background:"rgba(255,255,255,.2)",borderRadius:3,overflow:"hidden",marginBottom:8}}>
          </div>



          {/* Hạn thanh toán đợt 2 */}

          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>

            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,opacity:.8}}>

              <span>📅 Hạn thanh toán đợt 2:</span>

              <input type="date" value={deadline2}

                onChange={e=>{setDeadline2(e.target.value);onUpdate&&onUpdate({...order,paymentDeadline2:e.target.value});}}

                style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",

                  borderRadius:6,padding:"2px 8px",color:"#fff",fontSize:11,outline:"none",

                  colorScheme:"dark"}}/>

              {deadline2&&remaining>0&&(

                <span style={{fontWeight:700,

              {deadline2&&remaining>0&&(
                <span style={{fontWeight:700,
                </span>

              )}

            </div>

            <div style={{marginLeft:"auto",fontSize:10,opacity:.5}}>{prog}% đã thu · Còn {fmtS(remaining)}đ</div>

          </div>

        </div>

      )}



      {/* Deadline2 warning */}

      {deadline2Warn&&(

        <div style={{background:"#fdf0ee",border:"2px solid #e07060",borderRadius:10,padding:"10px 16px",marginBottom:12,display:"flex",gap:10,alignItems:"center",fontSize:13}}>

          <span style={{fontSize:20}}>⏰</span>

          <div>

            <strong style={{color:"#8b2a1a"}}>Sắp đến hạn thanh toán đợt 2!</strong>

            <div style={{fontSize:11,color:"#b0554a",marginTop:2}}>

              Hạn: {fmtD(deadline2)} · Còn lại: {fmtS(remaining)}đ · 

            <div style={{fontSize:11,color:"#b0554a",marginTop:2}}>
            </div>

          </div>

        </div>

      )}



      {/* ── FORM GHI NHẬN THANH TOÁN ── */}

      {showPayForm&&(

        <div style={{background:"#fff",border:"2px solid #2563eb",borderRadius:12,padding:"18px 20px",marginBottom:14,boxShadow:"0 4px 20px rgba(37,99,235,.15)"}}>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>

            <div style={{fontSize:15,fontWeight:700,color:"#1e3a8a"}}>📥 Ghi nhận thanh toán từ khách</div>

  const [userAccounts,setUserAccounts]= useState(USER_ACCOUNTS);

  const [view,setView]        =useState("dashboard");

  const [orders,setOrders]    =useState(SEED_ORDERS);

  const [vouchers,setVouchers]=useState(SEED_VOUCHERS);

  const [approvalThreshold, setApprovalThreshold] = useState(20000000); // GĐ config ngưỡng duyệt

  const [bookings, setBookings] = useState(SEED_NCC_BOOKINGS); // lifted to root

  const [deploySteps, setDeploySteps] = useState({});

  const [quotes,setQuotes]=useState([]);

  const [customers,setCustomers]=useState(SEED_CUSTOMERS);

  const [credits,setCredits]=useState(SEED_CREDITS);

  const [tourPrograms,setTourPrograms]=useState(SEED_TOUR_PROGRAMS);

  const [bankAccounts,setBankAccounts]=useState(SEED_BANK_ACCOUNTS);

  const [personalTargets,setPersonalTargets]=useState(SEED_PERSONAL_TARGETS);

  const [outputInvoices,setOutputInvoices]=useState(SEED_OUTPUT_INVOICES);

  const [inputInvoices, setInputInvoices] =useState(SEED_INPUT_INVOICES);

  const [expenses,setExpenses]=useState(SEED_EXPENSES);

  const [refunds,setRefunds]  =useState(SEED_REFUNDS);

  const [notifs,setNotifs]    =useState(SEED_NOTIFS);

  const [toasts,setToasts]    =useState([]);

  const [selected,setSelected]=useState(null);

  const [showNotif,setShowNotif]=useState(false);

  const [showSearch,setShowSearch]=useState(false);

  const [nccListGlobal,setNccListGlobal]=useState(SEED_NCC_MASTER); // for global search



  // Keyboard shortcut: Ctrl+K / Cmd+K mở search

  useEffect(()=>{

    const handler=(e)=>{

      if((e.ctrlKey||e.metaKey)&&e.key==="k"){ e.preventDefault(); setShowSearch(v=>!v); }

      if(e.key==="Escape") setShowSearch(false);

    };

    window.addEventListener("keydown",handler);

    return ()=>window.removeEventListener("keydown",handler);

  },[]);



  },[]);


  // Định nghĩa trước useEffect để tránh TDZ khi effect gọi pushToast

  const pushToast=(msg,type="success")=>{

    const id=Date.now();

    setToasts(t=>[...t,{id,msg,type}]);

    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000);

  };



  const pushNotif=(msg,type,extra={})=>{

    const id=Date.now();

    setNotifs(n=>[{id,msg,type,time:new Date().toISOString(),read:false,...extra},...n]);

    pushToast(msg,type==="payment"||type==="success"?"success":type==="expense"?"warning":"error");

  };



  useEffect(()=>{



  useEffect(()=>{

    const runDailyChecks=()=>{

      const today=new Date().toISOString().slice(0,10);

      // Auto-transition: full_paid + đã đến ngày khởi hành → in_service

      setOrders(prev=>prev.map(o=>{

        if(o.status==="full_paid"&&o.departDate&&o.departDate<=today)

          return {...o,status:"in_service"};

        return o;

      }));

      // Tour ghép T-7: dùng functional read qua setOrders để tránh stale closure

      setOrders(prev=>{

        prev.filter(o=>["tour_ghep_nd","tour_ghep_qt"].includes(o.service)&&!["cancelled","completed"].includes(o.status)&&o.departDate)

          .forEach(o=>{

            const days=Math.ceil((new Date(o.departDate)-new Date(today))/86400000);

            if(days===7) pushToast("⏰ T-7: "+o.id+" "+o.serviceName+" — Cần xác nhận DS khách với NCC hôm nay!","warning");

          });

  useEffect(()=>{

    const runDailyChecks=()=>{

      const today=new Date().toISOString().slice(0,10);

}




function ProfilePage({ currentUser, onUpdate, onBack, pushNotif }){

  const [name,     setName]     = useState(currentUser.name);

  const [phone,    setPhone]    = useState(currentUser.phone||"");

  const [email,    setEmail]    = useState(currentUser.email||"");

  const [dept,     setDept]     = useState(currentUser.dept||"Kinh doanh");

  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle||"");

  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl||null);

  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef(null);



  // Password change

  const [oldPw,    setOldPw]    = useState("");

  const [newPw,    setNewPw]    = useState("");

  const [cfmPw,    setCfmPw]    = useState("");

  const [showOld,  setShowOld]  = useState(false);

  const [showNew,  setShowNew]  = useState(false);

  const [pwSection,setPwSection]= useState(false);



  const inp = {width:"100%",padding:"9px 12px",border:"1px solid #dbeafe",borderRadius:8,fontSize:13,background:"#f8faff",outline:"none",color:"#1e293b",boxSizing:"border-box"};



  // ── Photo upload ─────────────────────────────────────

  const handlePhotoFile = (file) => {

    if(!file) return;

    if(!file.type.startsWith("image/")){pushNotif("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)","error");return;}

    if(file.size > 3*1024*1024){pushNotif("Ảnh tối đa 3MB","error");return;}

    const reader = new FileReader();

    reader.onload = (e) => { setPhotoUrl(e.target.result); pushNotif("Đã tải ảnh lên — nhấn Lưu để cập nhật","success"); };

    reader.readAsDataURL(file);

  };

    if(!amount||amount<=0){pushNotif("Nhập số tiền hợp lệ","error");return;}

    if(amount>remaining){pushNotif("Vượt quá số tiền còn lại ("+fmt(remaining)+" đ)","error");return;}

    const id=genVId("thu",vouchers);

    const v={

      id,type:"thu",orderId:order.id,

    const v={
      amount,method:payMethod,

      note:payNote,

      date:new Date().toISOString().slice(0,10),

      status:"pending",

      approvedBy:null,

      billImg:payImg,

      installment:payInstall,

      billImg:payImg,
    };

    onAddVoucher(v);

    setShowPayForm(false);

    setPayAmount("");setPayImg(null);

    setPayNote("Cọc đặt cọc tour");

    pushNotif("Đã ghi nhận thanh toán "+fmt(amount)+" đ — chờ kế toán duyệt","warning");

  };



  const handlePrintConfirmation=()=>{

    const tourOp=SEED_TOUR_OPS.find(op=>op.orderId===order.id)||null;

    const html=buildConfirmation(order,vouchers,tourOp);

    openPrintWindow(html);

  };



  // Gợi ý số tiền theo đợt


  const depositAmt = Math.round(totalRev*0.7);

  const suggestAmounts = remaining>0?[

    {label:"Cọc 30%",  amt:Math.round(orderTotal*0.3)},

    {label:"Cọc 70%",  amt:Math.round(orderTotal*0.7)},

    {label:"Thanh toán đủ", amt:remaining},

  ].filter(s=>s.amt>0&&s.amt<=remaining):[];



  return(

    <div style={{maxWidth:1000,margin:"0 auto"}}>

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>

        <Btn variant="outline" size="sm" onClick={onBack}>← Danh sách</Btn>

        <div>

          <div style={{fontSize:20,fontWeight:700,color:"#1e3a8a"}}>{order.id}</div>

          <div style={{fontSize:12,color:"#888"}}>{order.serviceName} · Tạo {fmtDT(order.createdAt)} · Sale: {order.sale}</div>

        </div>

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>

          {pendingCount>0&&<span style={{background:"#fef9e7",color:"#7a5a00",border:"1px solid #e8c53a",borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600}}>⏳ {pendingCount} chờ duyệt</span>}

          <SBadge status={order.status} cfg={ORDER_STATUS}/>

          {/* Sale/ĐH: nút sửa đơn để mở khóa */}

          {order.status==="locked"&&(currentRole==="sale"||currentRole==="dieu_hanh")&&(

            <Btn size="sm" variant="outline" onClick={()=>onUpdate&&onUpdate({...order,status:"pending_payment",validationErrors:[]})}>

              🔓 Mở khóa & sửa

            </Btn>

          )}

          {/* KT: nút hủy đơn */}

          {(currentRole==="accountant"||currentRole==="manager")&&!["cancelled","completed"].includes(order.status)&&(

            <Btn size="sm" variant="danger" onClick={()=>setConfirmDlg({

              title:"Hủy đơn "+order.id,

            <Btn size="sm" variant="danger" onClick={()=>setConfirmDlg({
              message:"Thao tác này không thể hoàn tác. Đơn sẽ chuyển sang trạng thái Đã hủy.",

              confirmLabel:"Hủy đơn",

              onConfirm:()=>{

              confirmLabel:"Hủy đơn",
              onConfirm:()=>{
              }

            })}>❌ Hủy đơn</Btn>

          )}

          {/* Chuyển sang "Đang dịch vụ" */}

          {order.status==="full_paid"&&(currentRole==="manager"||currentRole==="dieu_hanh"||currentRole==="accountant")&&(

            <Btn size="sm" onClick={()=>onUpdate&&onUpdate({...order,status:"in_service"})}>

              🚀 Bắt đầu dịch vụ

  const suggestAmounts = remaining>0?[

    {label:"Cọc 30%",  amt:Math.round(orderTotal*0.3)},

    {label:"Cọc 70%",  amt:Math.round(orderTotal*0.7)},

    {label:"Thanh toán đủ", amt:remaining},

  ].filter(s=>s.amt>0&&s.amt<=remaining):[];



  return(

    <div style={{maxWidth:1000,margin:"0 auto"}}>

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>

        <Btn variant="outline" size="sm" onClick={onBack}>← Danh sách</Btn>

        <div>

          <div style={{fontSize:20,fontWeight:700,color:"#1e3a8a"}}>{order.id}</div>

          <div style={{fontSize:12,color:"#888"}}>{order.serviceName} · Tạo {fmtDT(order.createdAt)} · Sale: {order.sale}</div>

        </div>

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>

          {pendingCount>0&&<span style={{background:"#fef9e7",color:"#7a5a00",border:"1px solid #e8c53a",borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600}}>⏳ {pendingCount} chờ duyệt</span>}

      </div>



      {/* ── PAYMENT SUMMARY BANNER ── */}


  };



  const statusCfg = PRICE_APPROVAL_STATUS[priceStatus] || PRICE_APPROVAL_STATUS.draft_price;



  // ?? View mode ??????????????????????????????????????????

  if(!editing){

    return(

      <div>



        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",

          padding:"10px 12px",background:statusCfg.bg,border:`1px solid ${statusCfg.dot}`,

          borderRadius:10,marginBottom:10}}>

          <div style={{display:"flex",alignItems:"center",gap:8}}>

            <span style={{fontSize:16}}>{statusCfg.icon}</span>

            <div>

              <div style={{fontSize:12,fontWeight:600,color:statusCfg.color}}>{statusCfg.label}</div>

              {savedCost>0&&(

                <div style={{fontSize:11,color:"#64748b",marginTop:1}}>

                  Giá g?c: {fmt(savedCost)} ð ·

                  <span style={{fontWeight:600,color:savedSt.color,marginLeft:4}}>

                    {savedSt.icon} LN {savedPct.toFixed(1)}%

                    {savedSt.level==="warning"&&` (ngý?ng t?i thi?u ${threshold}%)`}

                  </span>

                </div>

              )}

              {!savedCost&&<div style={{fontSize:11,color:"#b0554a",marginTop:1}}>? Chýa nh?p giá g?c</div>}

            </div>

          </div>



          <div style={{display:"flex",gap:6,flexShrink:0}}>

            {(currentRole==="accountant"||currentRole==="manager")&&(

              <Btn size="sm" variant="outline" onClick={()=>setEditing(true)}>

                ?? {savedCost?"S?a giá":"Nh?p giá g?c"}

              </Btn>

            )}



            {currentRole==="accountant"&&savedCost>0&&priceStatus==="draft_price"&&(

              <Btn size="sm" onClick={handleSubmitReview}>?? Tr?nh GÐ duy?t</Btn>

            )}

            {currentRole==="accountant"&&priceStatus==="returned"&&(

              <Btn size="sm" onClick={handleSubmitReview}>?? Tr?nh l?i GÐ</Btn>

            )}



            {currentRole==="manager"&&["draft_price","pending_review"].includes(priceStatus)&&savedCost>0&&!showReturn&&(

              <>

                <Btn size="sm" onClick={handleApprove}>? Duy?t giá</Btn>

                <Btn size="sm" variant="danger" onClick={()=>setShowReturn(true)}>? Tr? v?</Btn>

              </>

            )}

            {currentRole==="manager"&&priceStatus==="draft_price"&&savedCost>0&&(

              <Btn size="sm" onClick={handleApprove}>? Duy?t th?ng</Btn>

            )}

          </div>

        </div>





        {showReturn&&(

          <div style={{background:"#fdf0ee",border:"1px solid #f5c0b5",borderRadius:8,padding:"10px 12px",marginBottom:10}}>

            <div style={{fontSize:12,fontWeight:600,color:"#b0554a",marginBottom:6}}>?? L? do tr? v?</div>

            <input value={returnNote} onChange={e=>setReturnNote(e.target.value)}

              placeholder="Giá g?c không kh?p báo giá NCC, c?n ki?m tra l?i..."

              style={{width:"100%",padding:"8px 10px",border:"1px solid #f5c0b5",borderRadius:7,

                fontSize:13,background:"#fff",outline:"none",boxSizing:"border-box",marginBottom:8}}/>

            <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>

              <Btn variant="outline" size="sm" onClick={()=>{setShowReturn(false);setReturnNote("");}}>H?y</Btn>

              <Btn variant="danger" size="sm" onClick={handleReturn}>Xác nh?n tr? v?</Btn>

            </div>

          </div>

        )}





        {(order.priceHistory||[]).length>0&&(

          <div style={{marginTop:6}}>

            {[...(order.priceHistory||[])].reverse().slice(0,3).map((h,i)=>(

              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",


function UserManagementPage({ userAccounts, onUpdateAccounts, currentUser, pushNotif, personalTargets=[], onUpdateTargets, approvalThreshold=20000000, onUpdateThreshold }){

  const [subView,  setSubView]   = useState("list"); // list | form | target | settings

  const [editUser, setEditUser]  = useState(null);

  const [search,   setSearch]    = useState("");

  const [targetUser, setTargetUser] = useState(null); // user đang xem chỉ tiêu

  const photoRef = useRef(null);



  // Form state

  const [fName,     setFName]    = useState("");

  const [fUsername, setFUsername]= useState("");

  const [fPassword, setFPassword]= useState("mv2025");

  const [fRole,     setFRole]    = useState("sale");

  const [fDept,     setFDept]    = useState("Kinh doanh");

  const [fPhone,    setFPhone]   = useState("");

  const [fEmail,    setFEmail]   = useState("");

  const [fTitle,    setFTitle]   = useState("");

  const [fActive,   setFActive]  = useState(true);

  const [fPhoto,    setFPhoto]   = useState(null);

  const [showPw,    setShowPw]   = useState(false);

  const [touched,   setTouched]  = useState({});



  const canManage = currentUser.role==="manager"; // chỉ GĐ mới tạo/sửa/xóa



  const openCreate = () => {

    if(!canManage){pushNotif("Chỉ Giám đốc mới có quyền tạo tài khoản","error");return;}

    setEditUser(null);

    setFName(""); setFUsername(""); setFPassword("mv2025");

    setFRole("sale"); setFDept("Kinh doanh");

    setFPhone(""); setFEmail(""); setFTitle("");

    setFActive(true); setFPhoto(null);

    setTouched({});

    setSubView("form");

  };



  const openEdit = (u) => {

    if(!canManage){pushNotif("Chỉ Giám đốc mới có quyền sửa tài khoản","error");return;}

    setEditUser(u);

    setFName(u.name); setFUsername(u.username); setFPassword(u.password);

    setFRole(u.role); setFDept(u.dept||"Kinh doanh");

    setFPhone(u.phone||""); setFEmail(u.email||"");

    setFTitle(u.jobTitle||""); setFActive(u.active!==false);

    setFPhoto(u.photoUrl||null);

    setTouched({});

    setSubView("form");

  };



  const handlePhotoFile = (file) => {

    if(!file) return;

    if(!file.type.startsWith("image/")){pushNotif("Chỉ chấp nhận file ảnh","error");return;}

    if(file.size>3*1024*1024){pushNotif("Ảnh tối đa 3MB","error");return;}

    const reader=new FileReader();

    reader.onload=e=>setFPhoto(e.target.result);

    reader.readAsDataURL(file);

  };



  const handleSave = () => {

    setTouched({name:true,username:true});

    if(!fName.trim())    {pushNotif("Nhập họ tên","error");return;}

    if(!fUsername.trim()){pushNotif("Nhập tên đăng nhập","error");return;}

    if(!fPassword||fPassword.length<6){pushNotif("Mật khẩu phải ≥ 6 ký tự","error");return;}

    if(!fUsername.trim()){pushNotif("Nhập tên đăng nhập","error");return;}
    if(dup){pushNotif(`Tên đăng nhập "${fUsername}" đã tồn tại`,"error");return;}



    const maxId = userAccounts.reduce((max,u)=>{

      const n=parseInt((u.id||"").replace(/\D/g,""))||0;

    const maxId = userAccounts.reduce((max,u)=>{
    },0);

    const saved={

    },0);
      username: fUsername.trim().toLowerCase(),

      password: fPassword,

      name:     fName.trim(),

      role:     fRole,

      dept:     fDept,

                <div style={{fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:.4,marginBottom:10}}>

      dept:     fDept,
                </div>

                <Row label="Doanh thu" value={fmt(order.pricing?.totalRevenue)+" ð"}/>

                <Row label="Giá g?c"   value={order.pricing?.totalCost>0?fmt(order.pricing.totalCost)+" ð":"Chýa nh?p"} danger={!order.pricing?.totalCost}/>

                {order.pricing?.totalCost>0&&(

                  <div style={{marginTop:8,padding:"10px 12px",background:order.pricing.profitPct>=5?"#eff6ff":"#fdf0ee",borderRadius:8}}>

                    <div style={{fontSize:11,color:"#64748b",marginBottom:2}}>L?i nhu?n d? ki?n</div>

                    <div style={{fontSize:18,fontWeight:800,color:order.pricing.profitPct>=5?"#1e3a8a":"#b0554a",fontVariantNumeric:"tabular-nums"}}>

                      {fmt(order.pricing.profit)} ð

                    </div>

                    <div style={{fontSize:12,fontWeight:600,color:order.pricing.profitPct>=10?"#1e3a8a":order.pricing.profitPct>=5?"#7a5a00":"#b0554a"}}>

                      Biên LN: {order.pricing.profitPct?.toFixed(1)}%

                      {order.pricing.profitPct<5&&" ?"}

                    </div>

                  </div>

                )}

                {!order.pricing?.totalCost&&(

                  <div style={{fontSize:11,color:"#94a3b8",marginTop:6,fontStyle:"italic"}}>

                    Nh?p giá g?c trong ph?n chi ti?t d?ch v? ð? xem l?i nhu?n

                  </div>

                )}

              </Card>

            )}



            {(()=>{

              const custPhone=(order.customer?.phone||"").replace(/\s/g,"");

              const custName=(order.customer?.name||"").toLowerCase();

              const matchedCredits=credits.filter(c=>

                ["active","partial"].includes(c.status)&&

                c.remainingAmount>0&&

                new Date(c.expiryDate)>new Date(NOW_ISO)&&

                ((c.customerPhone||"").replace(/\s/g,"")===custPhone||

                 (c.customerName||"").toLowerCase()===custName)

              );

              const applied=order.appliedCreditId?credits.find(c=>c.id===order.appliedCreditId):null;

              if(matchedCredits.length===0&&!applied) return null;

              return(

                <Card style={{marginBottom:12,border:"2px solid #bfdbfe"}}>

                  <div style={{fontSize:11,fontWeight:600,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:.4,marginBottom:10}}>? B?o lýu vé c?a khách</div>

                  {applied?(

                    <div style={{background:"#eff6ff",borderRadius:8,padding:"10px 12px",marginBottom:8}}>

                      <div style={{fontSize:12,fontWeight:700,color:"#1e3a8a",marginBottom:4}}>? Ð? áp d?ng: {applied.id}</div>

                      <div style={{fontSize:12,color:"#475569"}}>{applied.airline} · {applied.route}</div>

                      <div style={{fontSize:13,fontWeight:700,color:"#2563eb",marginTop:4}}>{fmt(order.appliedCreditAmount||0)} ð ð? tr?</div>

                      {(currentRole==="accountant"||currentRole==="manager")&&(

                        <button onClick={()=>{

                          const old=credits.find(c=>c.id===order.appliedCreditId);

                          if(old&&onUpdateCredits){

                            onUpdateCredits(credits.map(c=>c.id===old.id?{...c,remainingAmount:c.remainingAmount+(order.appliedCreditAmount||0),usedAmount:Math.max(0,c.usedAmount-(order.appliedCreditAmount||0)),status:c.remainingAmount+(order.appliedCreditAmount||0)>=c.creditAmount?"active":"partial"}:c));

                          }

                          onUpdate&&onUpdate({...order,appliedCreditId:null,appliedCreditAmount:0});

                          pushNotif("Ð? g? b?o lýu vé","warning");

                        }} style={{marginTop:8,fontSize:11,color:"#b0554a",background:"none",border:"1px solid #fca5a5",borderRadius:6,padding:"3px 10px",cursor:"pointer"}}>

                          G? áp d?ng

                        </button>


function ReportModule({ orders, vouchers, expenses, personalTargets=[], currentRole, hdvList=[] }){

  const now = new Date();

  const [tab,   setTab]   = useState("revenue");

  const [year,  setYear]  = useState(now.getFullYear());

  const [period,setPeriod]= useState("month"); // month | quarter | year

  const [saleMo,setSaleMo]= useState(""); // "" = c? nãm



  const years = useMemo(()=>{

    const ys = new Set();

    orders.forEach(o=>{ const y=(o.createdAt||o.departDate||"").slice(0,4); if(y) ys.add(y); });

    if(!ys.size) ys.add(String(now.getFullYear()));

    return [...ys].sort().reverse();

  },[orders]);



  const fmtM = n => n>=1e9 ? (n/1e9).toFixed(1)+"T" : n>=1e6 ? (n/1e6).toFixed(1)+"tr" : n>=1e3 ? (n/1e3).toFixed(0)+"k" : String(n);



            onNotif={()=>setShowNotif(v=>!v)}

            onSearch={()=>setShowSearch(true)}

            onProfile={()=>setView("profile")}

            onLogout={()=>setShowLogoutConfirm(true)}

          />

        }

      >

        {view==="orders"&&<OrderList orders={orders} vouchers={vouchers} onView={o=>{setSelected(o);setView("detail");}} onCreate={()=>setView("create")} currentRole={currentRole} currentUser={currentUser}/>}

        {view==="create"&&<OrderForm onSave={handleCreateOrder} onCancel={()=>setView("orders")} pushNotif={pushToast} defaultSale={currentUser.name} currentRole={currentRole} customers={customers} onCreateCustomer={()=>{setView("crm");pushToast("Vào CRM tạo khách hàng mới, sau đó quay lại tạo đơn","warning");}}/>}

        {view==="detail"&&selected&&<OrderDetail order={selected} vouchers={vouchers} expenses={expenses} onBack={()=>setView("orders")} onUpdate={handleUpdateOrder} onAddVoucher={handleAddVoucher} onApprove={handleApprove} onReject={handleReject} pushNotif={pushToast} currentRole={currentRole} bankAccounts={bankAccounts} currentUser={currentUser}/>}

        {view==="crm"&&<CrmModule orders={orders} pushNotif={pushToast} customers={customers} onUpdateCustomers={setCustomers} currentUser={currentUser}/>}

        {view==="tourops"&&<TourOpsModule orders={orders} pushNotif={pushToast} currentUser={currentUser} currentRole={currentRole}/>}

        {view==="closeorders"&&<CloseOrderModule orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} onCloseOrder={handleCloseOrder} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}

        {view==="deploy"&&<DeployPanel deploySteps={deploySteps} onUpdateSteps={setDeploySteps}/>}

        {view==="ncc"&&<NCCDashboard orders={orders} vouchers={vouchers} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser} bookings={bookings} onUpdateBookings={setBookings} onCreateExpense={(exp)=>{setExpenses(p=>[exp,...p]);pushToast("Phiếu chi "+exp.id+" chờ KT duyệt","warning");}}/>}

        {view==="refunds"&&<RefundModule orders={orders} vouchers={vouchers} refunds={refunds} onRefundUpdate={handleRefundUpdate} onRefundCreate={handleRefundCreate} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}

        {view==="credits"&&<CreditModule orders={orders} pushNotif={pushToast} credits={credits} onUpdateCredits={setCredits}/>}

        {view==="approvals"&&<ApprovalsModule orders={orders} expenses={expenses} onExpenseUpdate={handleExpenseUpdate} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser} approvalThreshold={approvalThreshold}/>}

        {view==="dashboard"&&currentRole==="manager"&&<DirectorDashboard orders={orders} vouchers={vouchers} expenses={expenses} personalTargets={personalTargets} onUpdateTargets={setPersonalTargets} userAccounts={userAccounts} customers={customers}/>}

        {view==="dashboard"&&currentRole==="accountant"&&<AccountantDashboard orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} bankAccounts={bankAccounts}/>}

        {view==="dashboard"&&(currentRole==="sale"||currentRole==="dieu_hanh")&&<SaleDashboard currentUser={currentUser} orders={orders} vouchers={vouchers} personalTargets={personalTargets}/>}

        {view==="quotes"&&<QuoteModule quotes={quotes} onUpdate={setQuotes} orders={orders} tourPrograms={tourPrograms} currentUser={currentUser} pushNotif={pushToast} onCreateOrder={(data)=>{handleCreateOrder(data);setView("create");}}/>}

        {view==="tourprogram"&&<TourProgramModule tourPrograms={tourPrograms} onUpdate={setTourPrograms} currentRole={currentRole} pushNotif={pushToast} currentUser={currentUser}/>}

        {view==="accounting"&&<AccountingDashboard orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} bankAccounts={bankAccounts} onUpdateBankAccounts={setBankAccounts} outputInvoices={outputInvoices} onUpdateOutputInvoices={setOutputInvoices} inputInvoices={inputInvoices} onUpdateInputInvoices={setInputInvoices} onApprove={handleApprove} onReject={handleReject} pushNotif={pushToast}/>}

        {view==="profile"&&<ProfilePage currentUser={currentUser} onUpdate={handleUpdateCurrentUser} onBack={()=>setView("orders")} pushNotif={pushToast}/>}

        {view==="users"&&currentRole==="manager"&&<UserManagementPage userAccounts={userAccounts} onUpdateAccounts={setUserAccounts} currentUser={currentUser} pushNotif={pushToast} personalTargets={personalTargets} onUpdateTargets={setPersonalTargets} approvalThreshold={approvalThreshold} onUpdateThreshold={setApprovalThreshold}/>}

        {view==="banks"&&<BankAccountModule bankAccounts={bankAccounts} onUpdate={setBankAccounts} pushNotif={pushToast}/>}

        {view==="reports"&&<ReportModule orders={orders} vouchers={vouchers} expenses={expenses} personalTargets={personalTargets} currentRole={currentRole}/>}

      </AppShell>



      {/* Logout confirmation modal — không dùng window.confirm */}

      {showLogoutConfirm && (

        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}

          onClick={()=>setShowLogoutConfirm(false)}>

          <div style={{background:"#fff",borderRadius:16,padding:"28px 32px",maxWidth:360,width:"90%",boxShadow:"0 24px 64px rgba(0,0,0,.3)",textAlign:"center"}}

            onClick={e=>e.stopPropagation()}>

            <div style={{fontSize:36,marginBottom:12}}>🚪</div>

            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:13,color:"#64748b",marginBottom:24}}>

              Bạn sẽ thoát khỏi tài khoản <strong>{currentUser?.name}</strong>.<br/>Phiên làm việc hiện tại sẽ kết thúc.

      map[key].count++;

      map[key].revenue+=(o.pricing?.totalRevenue||0);

      map[key].profit+=(o.pricing?.profit||0);

    });

    return Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,15);

  },[orders]);



  // ?? Cash flow data ???????????????????????????

  const cashflowRows = useMemo(()=>{

    const map={};

    });

    return Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,15);

  },[orders]);



  // ── Cash flow data ───────────────────────────

  const cashflowRows = useMemo(()=>{

    const map={};

    const addRow=(dateStr,type,amount)=>{

      const d=new Date(dateStr);

  const [bookings, setBookings] = useState(SEED_NCC_BOOKINGS);

  const [deploySteps, setDeploySteps] = useState({});

  const [quotes,setQuotes]=useState([]);

  const [credits,setCredits]=useState(SEED_CREDITS);

  const [tourPrograms,setTourPrograms]=useState(SEED_TOUR_PROGRAMS);

  const [bankAccounts,setBankAccounts]=useState(SEED_BANK_ACCOUNTS);

    return Object.values(map).sort((a,b)=>a.key.localeCompare(b.key));

  },[vouchers]);



  // ── Year-over-year data ──────────────────────

  const yoyRows = useMemo(()=>{

    const thisYear=now.getFullYear();

    const lastYear=thisYear-1;

    const months=Array.from({length:12},(_,i)=>i+1);

    return months.map(m=>{

      const label=`T${m}`;

      const mStr=String(m).padStart(2,"0");

      const ordersThis=orders.filter(o=>!["cancelled"].includes(o.status)&&(o.createdAt||"").startsWith(`${thisYear}-${mStr}`));

      const ordersLast=orders.filter(o=>!["cancelled"].includes(o.status)&&(o.createdAt||"").startsWith(`${lastYear}-${mStr}`));

      const ordersThis=orders.filter(o=>!["cancelled"].includes(o.status)&&(o.createdAt||"").startsWith(`${thisYear}-${mStr}`));
      const ordersLast=orders.filter(o=>!["cancelled"].includes(o.status)&&(o.createdAt||"").startsWith(`${lastYear}-${mStr}`));
      const profitThis=ordersThis.filter(o=>o.pricing?.totalCost>0).reduce((s,o)=>s+(o.pricing?.profit||0),0);

      const profitLast=ordersLast.filter(o=>o.pricing?.totalCost>0).reduce((s,o)=>s+(o.pricing?.profit||0),0);

      const chg=revLast>0?((revThis-revLast)/revLast*100):null;

      return {label,m,revThis,revLast,profitThis,profitLast,chg,countThis:ordersThis.length,countLast:ordersLast.length};

    });

  },[orders,now]);



  // ── Print PDF ────────────────────────────────

  const printRevenue = () => {

    const rows = revRows.filter(r=>r.revenue>0||r.count>0);

    const html = `<html><head><title>Báo cáo doanh thu</title>

    <style>

      body{font-family:Arial,sans-serif;padding:24px;color:#1e293b;font-size:11pt}

      h2{color:#1e3a8a;margin:0 0 4px}

      .sub{color:#64748b;font-size:10pt;margin-bottom:20px}

      table{width:100%;border-collapse:collapse;margin-top:12px}

      th{background:#1e3a8a;color:#fff;padding:8px 10px;text-align:left;font-size:10pt}

      td{padding:7px 10px;border-bottom:1px solid #e0e7ff;font-size:10pt}

      tr:nth-child(even) td{background:#f8faff}

      .num{text-align:right}

      .kpi{display:flex;gap:16px;margin-bottom:20px}

      .kpi-card{flex:1;border:1px solid #e0e7ff;border-radius:8px;padding:12px;text-align:center}

      .kpi-v{font-size:18pt;font-weight:700;color:#1e3a8a}

      .kpi-l{font-size:9pt;color:#64748b;margin-top:4px}

      .total-row td{font-weight:700;background:#eff6ff!important;color:#1e3a8a}

      @media print{@page{size:A4 landscape;margin:15mm}}

    </style></head><body>

      @media print{@page{size:A4 landscape;margin:15mm}}
    <div class="sub">Công ty Du lịch Minh Việt — In ngày ${new Date().toLocaleDateString("vi-VN")}</div>

    <div class="kpi">

      <div class="kpi-card"><div class="kpi-v">${fmt(revTotal)}đ</div><div class="kpi-l">Tổng doanh thu</div></div>

      <div class="kpi-card"><div class="kpi-v">${fmt(profitTotal)}đ</div><div class="kpi-l">Tổng lợi nhuận</div></div>

      <div class="kpi-card"><div class="kpi-v">${profitPct}%</div><div class="kpi-l">Tỷ suất lợi nhuận</div></div>

      <div class="kpi-card"><div class="kpi-v">${countTotal}</div><div class="kpi-l">Tổng số đơn</div></div>

    </div>

    <table>

      <tr><th>Kỳ</th><th class="num">Doanh thu</th><th class="num">Chi phí</th><th class="num">Lợi nhuận</th><th class="num">Tỷ suất %</th><th class="num">Số đơn</th></tr>

    <table>
      <tr class="total-row"><td>TỔNG</td><td class="num">${fmt(revTotal)}đ</td><td class="num">${fmt(costTotal)}đ</td><td class="num">${fmt(profitTotal)}đ</td><td class="num">${profitPct}%</td><td class="num">${countTotal}</td></tr>

    </table>

    </body></html>`;

    openPrintWindow(html);

  };



  const printDebt = () => {

    const html = `<html><head><title>Công nợ khách hàng</title>

    <style>

      body{font-family:Arial,sans-serif;padding:24px;color:#1e293b;font-size:10pt}

      h2{color:#1e3a8a;margin:0 0 4px}

      .sub{color:#64748b;font-size:9pt;margin-bottom:16px}

      table{width:100%;border-collapse:collapse}

      th{background:#1e3a8a;color:#fff;padding:7px 8px;text-align:left;font-size:9pt}

      td{padding:6px 8px;border-bottom:1px solid #e0e7ff;font-size:9pt}

      tr:nth-child(even) td{background:#f8faff}

      .num{text-align:right}

      .total-row td{font-weight:700;background:#fff3cd!important;color:#92400e}

      @media print{@page{size:A4 landscape;margin:10mm}}

    </style></head><body>

    <h2>⚠️ CÔNG NỢ KHÁCH HÀNG</h2>

    <div class="sub">Công ty Du lịch Minh Việt — In ngày ${new Date().toLocaleDateString("vi-VN")} — Tổng nợ: ${fmt(debtTotal)}đ từ ${debtRows.length} đơn</div>

    <table>

      <tr><th>Mã đơn</th><th>Khách hàng</th><th>SĐT</th><th>Dịch vụ</th><th>Sale</th><th>Ngày đi</th><th class="num">Tổng thu</th><th class="num">Đã thu</th><th class="num">Còn nợ</th><th>Hạn TT</th></tr>

      ${debtRows.map(r=>`<tr><td>${r.id}</td><td>${r.customer}</td><td>${r.phone}</td><td>${r.service}</td><td>${r.sale}</td><td>${r.departDate}</td><td class="num">${fmt(r.totalRevenue)}đ</td><td class="num">${fmt(r.totalPaid)}đ</td><td class="num" style="color:#b0554a;font-weight:700">${fmt(r.debt)}đ</td><td>${r.deadline||"—"}</td></tr>`).join("")}

      <tr class="total-row"><td colspan="8">TỔNG CÔNG NỢ (${debtRows.length} đơn)</td><td class="num">${fmt(debtTotal)}đ</td><td></td></tr>

    </table></body></html>`;

                </thead>

                <tbody>

                  {routeRows.map((r,i)=>(

                <tbody>
                      <td style={{...tdL,fontWeight:500,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.route}</td>

                      <td style={{...tdR,color:"#2563eb",fontWeight:700}}>{r.count}</td>

                      <td style={tdR}>{fmtS(r.revenue)}đ</td>

                      <td style={{...tdR,color:"#2563eb",fontWeight:700}}>{r.count}</td>
                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </Card>

        </div>

      )}

    </div>

  );

}



// ═══════════════════════════════════════════════════════════

// GLOBAL SEARCH — Tìm kiếm toàn cục


function TourGhepModule({ products, onUpdate, orders, currentRole, currentUser, pushNotif, onCreateOrder }) {

  const [tab, setTab]         = useState("list"); // list | form | detail

  const [search, setSearch]   = useState("");

  const [filterSvc, setFilterSvc] = useState("all");

  const [filterStatus, setFilterStatus] = useState("all");

  const [editId, setEditId]   = useState(null);

  const [form, setForm]       = useState(EMPTY_TGP);

  const [detailId, setDetailId] = useState(null);



  const serviceOpts = [

    { value:"all",           label:"Tất cả loại" },

    { value:"tour_ghep_qt",  label:"Tour ghép quốc tế" },

    { value:"tour_ghep_nd",  label:"Tour ghép nội địa" },

  ];

  const statusOpts = [

    { value:"all",       label:"Tất cả trạng thái" },

    { value:"active",    label:"Còn chỗ" },

    { value:"soldout",   label:"Hết chỗ" },

    { value:"upcoming",  label:"Sắp mở bán" },

    { value:"expired",   label:"Đã qua" },

    { value:"cancelled", label:"Huỷ" },

  ];



  const filtered = products.filter(p => {

    if (filterSvc !== "all" && p.service !== filterSvc) return false;

    if (filterStatus !== "all" && p.status !== filterStatus) return false;

    if (search) {

      const q = search.toLowerCase();

      return p.name.toLowerCase().includes(q) ||

             (p.operatorName||"").toLowerCase().includes(q) ||

             (p.route||"").toLowerCase().includes(q);

    }

    return true;

  });



  // Stats

  const activeCount = products.filter(p => p.status === "active").length;

  const soldoutCount = products.filter(p => p.status === "soldout").length;

  const totalMargin = products.filter(p=>p.status==="active")

    .reduce((s,p) => s + (p.sellPrice - p.buyPrice), 0);



  function openNew() {

    setForm({...EMPTY_TGP});

    setEditId(null);

    setTab("form");

  }

  function openEdit(p) {

    setForm({...p});

    setEditId(p.id);

    setTab("form");

  }

  function openDetail(p) {

    setDetailId(p.id);

    setTab("detail");

  }

  function saveProduct() {

    if (!form.name.trim()) { pushNotif("Vui lòng nhập tên tour","warning"); return; }

    if (!form.departDate)  { pushNotif("Vui lòng chọn ngày đi","warning"); return; }

    if (editId) {

      onUpdate(products.map(p => p.id === editId ? {...form, id:editId} : p));

    } else {

      const newId = "TGP-" + String(products.length + 1).padStart(4,"0");

      onUpdate([{...form, id:newId, createdAt:new Date().toISOString()}, ...products]);

    }

    setTab("list");

    pushNotif(editId ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm tour ghép","success");

  }

  function deleteProduct(id) {

  }
    onUpdate(products.filter(p => p.id !== id));

    if (detailId === id) setTab("list");

  }

  function setStatus(id, status) {

    onUpdate(products.map(p => p.id === id ? {...p, status} : p));

  }



  const selected = products.find(p => p.id === detailId);



  // ── DETAIL VIEW ─────────────────────────────────────────────────────────

  if (tab === "detail" && selected) {

    const st = TGP_STATUS_LABEL[selected.status] || TGP_STATUS_LABEL.active;

    const mo = TGP_MODE_LABEL[selected.mode] || TGP_MODE_LABEL.reseller;

    const margin = selected.sellPrice - selected.buyPrice;

    const marginPct = selected.buyPrice > 0 ? ((margin/selected.buyPrice)*100).toFixed(1) : 0;

    // count pax from orders with matching tour

    const relatedOrders = orders.filter(o =>

      o.serviceName === selected.name && o.departDate === selected.departDate

    );

    const bookedPax = relatedOrders.reduce((s,o)=>{

      const pax = o.pax || {};

      return s + (pax.adults||0) + (pax.children||0);

    }, 0);

    const remaining = Math.max(0, selected.totalSlots - bookedPax);

    const capPct = selected.totalSlots > 0 ? Math.round(bookedPax/selected.totalSlots*100) : 0;



    return (

      <div>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>

          <Btn variant="ghost" onClick={()=>setTab("list")}>← Quay lại</Btn>

          <h2 style={{margin:0,fontSize:18,fontWeight:700,flex:1}}>{selected.name}</h2>

          <span style={{background:st.bg,color:st.color,borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:700}}>{st.label}</span>

  };



  const unreadCount=notifs.filter(n=>(!n.role||n.role===currentRole)&&!n.read).length;

  const pendingApprovals=expenses.filter(e=>{

    if(currentRole==="accountant") return e.status==="pending_kt"||e.status==="pending_pay";

    if(currentRole==="manager")    return e.status==="pending_gd";

    return false;

  }).length;

  const pendingRefunds=refunds.filter(r=>["pending_approve","approved"].includes(r.status)).length;



  const NAV=[

    {k:"dashboard",   l:"📊 Dashboard",  roles:["sale","accountant","manager","dieu_hanh"]},

    {k:"orders",      l:"📋 Đơn hàng",   roles:["sale","accountant","manager","dieu_hanh"]},

    {k:"crm",         l:"👥 CRM",         roles:["sale","manager","dieu_hanh"]},

    {k:"tourops",     l:"🚌 Vận hành",    roles:["sale","accountant","manager","dieu_hanh"]},

    {k:"tourprogram", l:"🗺 CT Tour",      roles:["manager","dieu_hanh"]},

    {k:"quotes",      l:"📄 Chào giá",    roles:["sale","manager","dieu_hanh"]},

    {k:"accounting",  l:"💰 Kế toán",     roles:["accountant","manager"]},

    {k:"ncc",         l:"🏢 NCC",          roles:["sale","accountant","manager","dieu_hanh"]},

    {k:"accounting",  l:"💰 Kế toán",     roles:["accountant","manager"]},
    {k:"credits",     l:"✈ Bảo lưu vé",  roles:["sale","accountant","manager"]},

    {k:"approvals",   l:"✅ Duyệt"+(pendingApprovals>0?" ("+pendingApprovals+")":""), roles:["accountant","manager"]},

    {k:"closeorders", l:"🔒 Đóng đơn",   roles:["accountant","manager"]},

    {k:"users",       l:"👤 Nhân sự",     roles:["accountant","manager"]},

    {k:"deploy",      l:"🚀 Deploy",       roles:["manager"]},

  ];



  return(

    <>

      {/* Toast stack — fixed overlay */}

                  {label:"Trẻ em",    buy:selected.buyChildPrice, sell:selected.childPrice},

                  {label:"Em bé",     buy:selected.buyBabyPrice,  sell:selected.babyPrice},

                ].map(({label,buy,sell})=>{

                  const m = (sell||0)-(buy||0);

                  return <div key={label} style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px",border:"1px solid #e2e8f0"}}>

                    <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>{label}</div>

                    <div style={{fontSize:12,color:"#64748b"}}>Vào: <b>{(buy||0).toLocaleString("vi-VN")}đ</b></div>

                    <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>Bán: {(sell||0).toLocaleString("vi-VN")}đ</div>

              <FieldWrap label="Phương tiện">

                <Inp value={f.transport} onChange={e=>set("transport",e.target.value)} placeholder="VN Airlines VN419/420"/>

              </FieldWrap>

              <FieldWrap label="Khách sạn">

                <Inp value={f.hotel} onChange={e=>set("hotel",e.target.value)} placeholder="KS 4* Seoul"/>

              </FieldWrap>

              <FieldWrap label="Thời gian">

                <Inp value={f.duration} onChange={e=>set("duration",e.target.value)} placeholder="5N4Đ"/>

              </FieldWrap>

              <FieldWrap label="Điểm nổi bật">

                <textarea value={f.highlights} onChange={e=>set("highlights",e.target.value)}

                  rows={3} placeholder="Namsan, Everland, Nami..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,resize:"vertical",boxSizing:"border-box"}}/>

              </FieldWrap>

            </Card>



      <AppShell

        sidebar={

          <Sidebar

            view={view}

            setView={(v)=>{setView(v);setSelected(null);}}

            currentRole={currentRole}

            pendingApprovals={pendingApprovals}

            pendingRefunds={pendingRefunds}

          />

        }

        topbar={

          <TopBar

            currentUser={currentUser}

            currentRole={currentRole}

            unreadCount={unreadCount}

            onNotif={()=>setShowNotif(v=>!v)}

            onSearch={()=>setShowSearch(true)}

            onProfile={()=>setView("profile")}

            onLogout={()=>setShowLogoutConfirm(true)}

              <tbody>

                {svcRows.map((r,i)=>{

                  const totalRev=svcRows.reduce((s,x)=>s+x.revenue,0);

                  const share=totalRev>0?(r.revenue/totalRev*100).toFixed(1):0;

                  return(

                    <tr key={i} style={{background:i%2===0?"#fff":"#f8faff"}}>

                      <td style={tdL}><strong>{r.label}</strong></td>

                      <td style={tdR}>{fmt(r.revenue)}ð</td>

                      <td style={{...tdR,color:"#64748b"}}>{fmt(r.cost)}ð</td>

                      <td style={{...tdR,color:"#16a34a",fontWeight:600}}>{fmt(r.profit)}ð</td>

                      <td style={{...tdR,color:r.revenue>0&&r.profit/r.revenue>=0.15?"#16a34a":"#64748b"}}>

                        {r.revenue>0?(r.profit/r.revenue*100).toFixed(1):0}%

                      </td>

                      <td style={{...tdR,color:"#1e3a8a",fontWeight:600}}>{r.count}</td>

                      <td style={tdR}>

                        <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>

                          <div style={{width:50,height:6,background:"#e0e7ff",borderRadius:3,overflow:"hidden"}}>

                            <div style={{height:"100%",width:share+"%",background:"#1e3a8a",borderRadius:3}}/>

                          </div>

                          <span style={{fontSize:11}}>{share}%</span>

                        </div>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </Card>

        </div>

      )}

    const f = form;

    const set = (k,v) => setForm(p=>({...p,[k]:v}));

    const margin = (f.sellPrice||0) - (f.buyPrice||0);

    return (

      <div>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>

          <Btn variant="ghost" onClick={()=>setTab("list")}>← Quay lại</Btn>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

          {/* Col 1 */}

          <div style={{display:"flex",flexDirection:"column",gap:12}}>

            <Card>

              <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5}}>Thông tin chung</h3>

              <FieldWrap label="Chế độ">

                <Sel value={f.mode} onChange={e=>set("mode",e.target.value)}>

                  <option value="reseller">Đại lý bán lại (mua chỗ từ đơn vị khác)</option>

                  <option value="operator">Tự tổ chức (Minh Việt Travel)</option>

                </Sel>

              </FieldWrap>

              <FieldWrap label="Loại dịch vụ">

                <Sel value={f.service} onChange={e=>set("service",e.target.value)}>

                  <option value="tour_ghep_qt">Tour ghép quốc tế</option>

                  <option value="tour_ghep_nd">Tour ghép nội địa</option>

                </Sel>

              </FieldWrap>

              <FieldWrap label="Tên tour *">

                <Inp value={f.name} onChange={e=>set("name",e.target.value)} placeholder="VD: Tour Hàn Quốc 5N4Đ Seoul-Nami"/>

              </FieldWrap>

              <FieldWrap label="Đơn vị cung cấp">

                <Inp value={f.operatorName} onChange={e=>set("operatorName",e.target.value)} placeholder="VD: Vietravel, Fiditour..."/>

              </FieldWrap>

              <FieldWrap label="Liên hệ NCC">

                <Inp value={f.operatorContact} onChange={e=>set("operatorContact",e.target.value)} placeholder="Email · SĐT"/>

              </FieldWrap>

              <FieldWrap label="Trạng thái">

                <Sel value={f.status} onChange={e=>set("status",e.target.value)}>

                  {Object.entries(TGP_STATUS_LABEL).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}

                </Sel>

              </FieldWrap>

            </Card>

            <Card>

              <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5}}>Hành trình & Dịch vụ</h3>

              <FieldWrap label="Hành trình">

                <Inp value={f.route} onChange={e=>set("route",e.target.value)} placeholder="HAN → ICN → HAN"/>

              </FieldWrap>

              <FieldWrap label="Phương tiện">

                <Inp value={f.transport} onChange={e=>set("transport",e.target.value)} placeholder="VN Airlines VN419/420"/>

              </FieldWrap>

              <FieldWrap label="Khách sạn">

              </FieldWrap>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>

                            <div style={{flex:1,height:8,background:"#e0e7ff",borderRadius:4,overflow:"hidden",minWidth:60}}>

                              <div style={{height:"100%",width:Math.min(pctVal,100)+"%",background:clr,borderRadius:4,transition:"width .4s"}}/>

                            </div>

                            <span style={{fontSize:12,fontWeight:700,color:clr,minWidth:40}}>{pctVal}%</span>

                          </div>

                        ):<span style={{fontSize:11,color:"#94a3b8"}}>Chýa có target</span>}

                      </td>

                      <td style={{...tdR,color:"#16a34a",fontWeight:600}}>{fmt(r.profit)}ð</td>

                      <td style={{...tdR,color:"#1e3a8a",fontWeight:600}}>{r.count}</td>

                    </tr>

                  );

                })}

                {saleRows.length===0&&(

                  <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"#94a3b8",fontSize:13}}>Không có d? li?u cho k? ð? ch?n</td></tr>

                )}

              </tbody>

            </table>

          </Card>

        </div>

      )}



      {/* ??? TAB: CÔNG N? KH ??? */}

      {tab==="debt"&&(

        <div>

          <Card style={{marginBottom:16}}>

            <div style={{display:"flex",gap:10,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>

              <div style={{display:"flex",gap:16}}>

                <div><span style={{fontSize:12,color:"#64748b"}}>T?ng công n?: </span><strong style={{color:"#b0554a",fontSize:15}}>{fmt(debtTotal)}ð</strong></div>

                <div><span style={{fontSize:12,color:"#64748b"}}>S? ðõn có n?: </span><strong style={{color:"#b0554a",fontSize:15}}>{debtRows.length}</strong></div>

              </div>

              <div style={{display:"flex",gap:8}}>

                <button onClick={()=>exportDebtXlsx(debtRows)}

                  style={{...inp,background:"#f0fdf4",border:"1.5px solid #86efac",color:"#166534",fontWeight:600,cursor:"pointer"}}>

                  ?? Xu?t Excel

                </button>

                <button onClick={printDebt}

                  style={{...inp,background:"#eff6ff",border:"1.5px solid #bfdbfe",color:"#1e3a8a",fontWeight:600,cursor:"pointer"}}>

                  ?? In PDF (A4 ngang)

                </button>

              </div>

            </div>

          </Card>



          {debtRows.length===0?(

            <Card><div style={{textAlign:"center",padding:40,color:"#16a34a",fontSize:15}}>? Không có công n? t?n ð?ng!</div></Card>

          ):(

            <Card style={{overflow:"auto",padding:0}}>

              <table style={{width:"100%",borderCollapse:"collapse",minWidth:860}}>

                <thead>

                  <tr>

                    <th style={colL}>M? ðõn</th>

                    <th style={colL}>Khách hàng</th>

                    <th style={colL}>SÐT</th>

                    <th style={colL}>D?ch v?</th>

                    <th style={colL}>Sale</th>

                    <th style={colH}>Ngày ði</th>

                    <th style={colH}>T?ng thu</th>

                    <th style={colH}>Ð? thu</th>

                    <th style={colH}>C?n n?</th>

                    <th style={colL}>H?n TT</th>

                  </tr>

                </thead>

                <tbody>

                  {debtRows.map((r,i)=>{

                    const isOverdue = r.deadline && r.deadline < new Date().toISOString().slice(0,10);

                    return(

                      <tr key={i} style={{background:isOverdue?"#fff5f5":i%2===0?"#fff":"#f8faff"}}>

                        <td style={{...tdL,fontWeight:600,color:"#1e3a8a"}}>{r.id}</td>

                        <td style={tdL}><strong>{r.customer}</strong></td>

                        <td style={{...tdL,fontSize:11,color:"#64748b"}}>{r.phone}</td>

                        <td style={{...tdL,fontSize:11}}>{r.service}</td>

                        <td style={{...tdL,fontSize:11}}>{r.sale}</td>

                        <td style={{...tdR,fontSize:11}}>{r.departDate||"—"}</td>

                        <td style={tdR}>{fmt(r.totalRevenue)}ð</td>

                        <td style={{...tdR,color:"#16a34a"}}>{fmt(r.totalPaid)}ð</td>

                        <td style={tdN}>{fmt(r.debt)}ð</td>

                        <td style={{...tdL,fontSize:11,color:isOverdue?"#b0554a":"#1e293b",fontWeight:isOverdue?700:400}}>

                          {r.deadline||"—"}{isOverdue&&" ??"}

                        </td>

                      </tr>

                    );

                  })}

                  <tr style={{background:"#fff3cd",fontWeight:700}}>

      {/* Header */}

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>

        <h2 style={{margin:0,fontSize:20,fontWeight:800}}>🌏 Danh mục Tour Ghép</h2>

        <div style={{flex:1}}/>

        <Btn onClick={openNew}>+ Thêm sản phẩm</Btn>

      </div>



      {/* Stats row */}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>

        {[

          {label:"Tổng sản phẩm", value:products.length, icon:"📦", color:"#6366f1"},

          {label:"Đang mở bán",   value:activeCount,     icon:"✅", color:"#22c55e"},

          {label:"Hết chỗ",       value:soldoutCount,    icon:"⛔", color:"#ef4444"},

          {label:"Lãi TB (NL)",   value:products.filter(p=>p.status==="active").length>0 ? Math.round(totalMargin/products.filter(p=>p.status==="active").length).toLocaleString("vi-VN")+"đ":"—", icon:"💰", color:"#f59e0b"},

        ].map(s=>(

          <Card key={s.label} style={{textAlign:"center"}}>

            <div style={{fontSize:22}}>{s.icon}</div>

            <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>

            <div style={{fontSize:12,color:"#64748b"}}>{s.label}</div>

          </Card>

        ))}

      </div>



      {/* Filters */}

      <Card style={{marginBottom:16}}>

        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>

          <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Tìm tên tour, NCC, hành trình..." style={{flex:1,minWidth:220}}/>

          <Sel value={filterSvc} onChange={e=>setFilterSvc(e.target.value)} style={{minWidth:180}}>

            {serviceOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}

          </Sel>

          <Sel value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{minWidth:160}}>

            {statusOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}

          </Sel>

        </div>

      </Card>



      {/* Product cards */}

      {filtered.length === 0 && (

        <div style={{textAlign:"center",padding:"60px 0",color:"#94a3b8"}}>

          <div style={{fontSize:48}}>🌏</div>

          <div style={{marginTop:8}}>Chưa có sản phẩm tour ghép</div>

          <Btn style={{marginTop:12}} onClick={openNew}>Thêm sản phẩm đầu tiên</Btn>

        </div>

      )}



      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:16}}>

        {filtered.map(p => {

          const st = TGP_STATUS_LABEL[p.status] || TGP_STATUS_LABEL.active;

          const mo = TGP_MODE_LABEL[p.mode] || TGP_MODE_LABEL.reseller;

          const margin = (p.sellPrice||0) - (p.buyPrice||0);

          const marginPct = p.buyPrice > 0 ? ((margin/p.buyPrice)*100).toFixed(1) : 0;

          // estimated booked pax from orders

          const bookedPax = orders.filter(o=>o.serviceName===p.name&&o.departDate===p.departDate)

          // estimated booked pax from orders
          const capPct = p.totalSlots > 0 ? Math.round(bookedPax/p.totalSlots*100) : 0;

          return (

            <div key={p.id} onClick={()=>openDetail(p)} style={{

              background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",

              padding:"16px",cursor:"pointer",

              boxShadow:"0 1px 4px rgba(0,0,0,.05)",

              transition:"box-shadow .15s,transform .1s",

            }}

              onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)";e.currentTarget.style.transform="translateY(-2px)";}}

              onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.05)";e.currentTarget.style.transform="none";}}>

              {/* Header */}

              <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:10}}>

                <div style={{flex:1}}>

                  <div style={{fontWeight:700,fontSize:14,lineHeight:1.3,marginBottom:4}}>{p.name}</div>

                  <div style={{fontSize:11,color:"#64748b"}}>{p.operatorName||"—"}</div>

                </div>

                <span style={{background:st.bg,color:st.color,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{st.label}</span>

              </div>

              {/* Route + date */}

              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,fontSize:12}}>

                <span style={{color:"#6366f1",fontWeight:600}}>✈ {p.route||"—"}</span>

              </div>

              <div style={{display:"flex",gap:12,fontSize:12,color:"#64748b",marginBottom:10}}>

                <span>📅 {p.departDate||"—"}</span>

                <span>⏱ {p.duration||"—"}</span>

              </div>

              {/* Pricing */}

              <div style={{display:"flex",gap:8,marginBottom:10}}>

                <div style={{flex:1,background:"#f8fafc",borderRadius:8,padding:"7px 10px",textAlign:"center"}}>

                  <div style={{fontSize:10,color:"#64748b"}}>Giá bán</div>

                  <div style={{fontWeight:700,fontSize:13,color:"#1e293b"}}>{(p.sellPrice||0).toLocaleString("vi-VN")}đ</div>

                </div>

                  <div style={{fontWeight:700,fontSize:13,color:"#1e293b"}}>{(p.sellPrice||0).toLocaleString("vi-VN")}đ</div>
                  <div style={{fontSize:10,color:"#64748b"}}>Lãi/pax</div>

                  <div style={{fontWeight:700,fontSize:13,color:margin>=0?"#16a34a":"#dc2626"}}>{margin>=0?"+":""}{margin.toLocaleString("vi-VN")}đ</div>

                </div>

                <div style={{flex:1,background:"#eff6ff",borderRadius:8,padding:"7px 10px",textAlign:"center"}}>

                  <div style={{fontSize:10,color:"#64748b"}}>Biên lợi nhuận</div>

                  <div style={{fontWeight:700,fontSize:13,color:"#2563eb"}}>{marginPct}%</div>

                </div>

              </div>

              {/* Capacity bar */}

              <div>

                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#64748b",marginBottom:4}}>

                  <span>Capacity: {bookedPax}/{p.totalSlots} chỗ</span>

                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#64748b",marginBottom:4}}>
                </div>

                <div style={{background:"#f1f5f9",borderRadius:100,height:5,overflow:"hidden"}}>

                </div>
                </div>

              </div>

              {cashflowRows.length===0

              </div>
                :<div style={{overflowX:"auto"}}>

                  <svg width="100%" viewBox={`0 0 ${Math.max(totalW,400)} ${chartH+40}`} style={{display:"block"}}>

                    {cashflowRows.map((r,i)=>{

                      const x=i*(barW*2+10)+4;

                      const bThu=Math.max(2,Math.round(r.thu/maxCF*chartH));

                      const bChi=Math.max(2,Math.round(r.chi/maxCF*chartH));

                      return(

                        <g key={r.key}>

                          <rect x={x} y={chartH-bThu} width={barW} height={bThu} fill="#1d6b4f" rx={2} opacity={.85}/>

                          <rect x={x+barW+2} y={chartH-bChi} width={barW} height={bChi} fill="#f87171" rx={2} opacity={.85}/>

                          <text x={x+barW} y={chartH+16} textAnchor="middle" fontSize={9} fill="#64748b">{r.label}</text>

                          {r.thu>0&&<text x={x+barW/2} y={chartH-bThu-3} textAnchor="middle" fontSize={8} fill="#1d6b4f" fontWeight={600}>{fmtM(r.thu)}</text>}

                          {r.chi>0&&<text x={x+barW*1.5+2} y={chartH-bChi-3} textAnchor="middle" fontSize={8} fill="#b0554a" fontWeight={600}>{fmtM(r.chi)}</text>}

                        </g>

                      );

                    })}

                  </svg>

                </div>

              }

            </Card>

            <Card>

              <div style={{fontSize:13,fontWeight:600,color:"#1e293b",marginBottom:12}}>Chi ti?t theo tháng</div>

              {cashflowRows.length===0

  );



  return (

    <div>

      {/* Header KPI */}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>

        {[

          {icon:"💝", l:"Tổng task chưa xử lý", v: callTasks.length + birthdayTasks.length, c:"#1e3a8a"},

          {icon:"📞", l:"Gọi cảm ơn",           v: callTasks.length,     c:"#2563eb"},

          {icon:"🎂", l:"Voucher sinh nhật",     v: birthdayTasks.length, c:"#9333ea"},

          {icon:"✅", l:"Đã hoàn thành",         v: doneTasks.length,     c:"#1d6b4f"},

        ].map(({icon,l,v,c})=>(

          <Card key={l} style={{padding:"13px 15px"}}>

            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>

              <span style={{fontSize:18}}>{icon}</span>

              <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:.4}}>{l}</div>

            </div>

            <div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div>

          </Card>

        ))}

      </div>



      {/* Tabs */}

      <div style={{display:"flex",gap:2,background:"#e0e7ff",borderRadius:10,padding:3,marginBottom:16,width:"fit-content"}}>

        {TABS.map(t=>(

          <button key={t.k} onClick={()=>setTab(t.k)}

            style={{padding:"7px 16px",borderRadius:8,border:"none",fontSize:13,cursor:"pointer",

          <button key={t.k} onClick={()=>setTab(t.k)}
            style={{padding:"7px 16px",borderRadius:8,border:"none",fontSize:13,cursor:"pointer",
      )}
              display:"flex",alignItems:"center",gap:6}}>

            {t.label}

              display:"flex",alignItems:"center",gap:6}}>
          </button>

        ))}

      </div>



      {/* Tab: Gọi cảm ơn */}

      {tab==="call"&&(

        <div>

      {tab==="call"&&(
            <Card style={{padding:"40px",textAlign:"center",color:"#94a3b8"}}>

              <div style={{fontSize:36,marginBottom:8}}>📞</div>

              <div style={{fontSize:14,fontWeight:600}}>Không có task gọi nào</div>

              <div style={{fontSize:12,marginTop:4}}>Task sẽ tự tạo 3 ngày sau khi tour kết thúc</div>

            </Card>

          ):(

            <div>

              <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>

                💡 Task gọi cảm ơn được tự tạo 3 ngày sau ngày về của tour. Gọi hỏi thăm, mời đánh giá và chốt đơn tiếp theo.

              </div>

              {callTasks.map(renderCallCard)}

            </div>

          )}

        </div>

      )}



      {/* Tab: Voucher sinh nhật */}

      {tab==="birthday"&&(

        <div>

                  {["Loại","Khách hàng","SĐT","Chi tiết","Người xử lý","Ngày xong","Ghi chú",""].map(h=>(

                    <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#374151",fontSize:10,textTransform:"uppercase",letterSpacing:.3,borderBottom:"1px solid #dbeafe",whiteSpace:"nowrap"}}>{h}</th>

                  ))}

                </tr></thead>

                <tbody>

                  {doneTasks.map((t,i)=>(

                <tbody>
                      <td style={{padding:"8px 10px"}}>

                        <span style={{fontSize:18}}>{t.type==="call_thank"?"📞":"🎂"}</span>

                      </td>

                      <td style={{padding:"8px 10px",fontWeight:600,color:"#1e293b"}}>{t.customerName}</td>

                      <td style={{padding:"8px 10px",color:"#2563eb"}}>{t.customerPhone}</td>

                      <td style={{padding:"8px 10px",color:"#475569",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>

                      <td style={{padding:"8px 10px",color:"#2563eb"}}>{t.customerPhone}</td>
                      </td>

                      <td style={{padding:"8px 10px",color:"#64748b"}}>{t.completedBy||"—"}</td>

                      <td style={{padding:"8px 10px",color:"#64748b",whiteSpace:"nowrap"}}>{fmtD(t.completedAt)}</td>

                      <td style={{padding:"8px 10px",color:"#64748b",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.note||"—"}</td>

                      <td style={{padding:"8px 10px"}}>

                        <button onClick={()=>deleteTask(t.id)}

                          style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:14,padding:"2px 6px"}}

                          title="Xóa khỏi lịch sử">🗑</button>

                      </td>

                    </tr>

                  ))}

              </div>

            </Card>

            <Card>

              <div style={{fontSize:13,fontWeight:600,color:"#1e293b",marginBottom:12}}>So sánh chi ti?t theo tháng</div>

              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>

                <thead>

                  <tr style={{background:"#eef2ff"}}>

                    {["Tháng",`DT ${thisYear}`,`DT ${lastYear}`,"Tãng/gi?m",`ÐH ${thisYear}`,`ÐH ${lastYear}`,"% tãng"].map(h=>(

                      <th key={h} style={{padding:"7px 10px",textAlign:h==="Tháng"?"left":"right",fontWeight:600,color:"#374151",fontSize:11,whiteSpace:"nowrap"}}>{h}</th>

                    ))}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}



