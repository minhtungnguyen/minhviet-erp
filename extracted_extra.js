
function NCCDashboard({ orders, vouchers, pushNotif, currentRole, onCreateExpense, currentUser, bookings:bookingsProp=SEED_NCC_BOOKINGS, onUpdateBookings }){

  const [confirmDlg, setConfirmDlg] = useState(null); // {title,message,warning,onConfirm}

  const [subView, setSubView]   = useState("list");

  const [bookings, setBookings] = useState(bookingsProp);

  useEffect(()=>setBookings(bookingsProp),[bookingsProp]);

  const [bookings, setBookings] = useState(bookingsProp);
  const [nccList,  setNccList]  = useState(SEED_NCC_MASTER);  // ← state, có thể thêm/sửa

  const [editBk,   setEditBk]   = useState(null);

  const [detailBk, setDetailBk] = useState(null);

  const [editNcc,  setEditNcc]  = useState(null);

  const [detailNcc,setDetailNcc]= useState(null);

  const [filterStatus, setFilter] = useState("all");

            {nccList.map(n=>{

              const cat=NCC_CAT[n.cat]||NCC_CAT["khac"];

              const catLabel = n.cat==="khac"&&n.customCat ? n.customCat : cat.label;

              const activeBks=bookings.filter(b=>b.nccId===n.id&&b.status!=="cancelled");

              const totalDebt=activeBks.reduce((s,b)=>s+b.remaining,0);

              return(

                <Card key={n.id} style={{padding:"14px 16px"}}>

                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>

                    <div style={{flex:1,minWidth:0}}>

                      <div style={{fontSize:14,fontWeight:700,marginBottom:4,color:"#1e293b"}}>{n.name}</div>

                      <span style={{fontSize:11,background:cat.bg,color:cat.color,borderRadius:6,padding:"2px 8px",fontWeight:500}}>{cat.icon} {catLabel}</span>

                    </div>

                    <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:8}}>

                      <Btn size="sm" variant="outline" onClick={()=>{setEditNcc(n);setSubView("ncc_form");}}>✏️</Btn>

                      <Btn size="sm" variant="danger"  onClick={()=>handleDeleteNcc(n.id)}>🗑</Btn>

                    </div>

                  </div>

                  <div style={{fontSize:12,color:"#64748b",marginBottom:2}}>📞 {n.phone||"—"}</div>

                  <div style={{fontSize:12,color:"#64748b",marginBottom:2}}>✉️ {n.contact||"—"}</div>

                  <div style={{fontSize:12,color:"#64748b",marginBottom:2}}>🏦 {n.bank||"—"}</div>

                  {n.taxCode&&<div style={{fontSize:12,color:"#64748b",marginBottom:2}}>🧾 MST: {n.taxCode}</div>}

                  {n.address&&<div style={{fontSize:11,color:"#94a3b8",marginBottom:4}}>📍 {n.address}</div>}

                  {n.note&&<div style={{fontSize:11,color:"#7a5a00",background:"#fef9e7",borderRadius:6,padding:"4px 8px",marginBottom:4}}>{n.note}</div>}

                  {(n.contractLink||n.contractFile||n.pricePolicyLink||n.pricePolicyFile||n.imagesDriveLink||n.imagesFile)&&(

                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6,marginTop:2}}>

                      {(n.contractLink||n.contractFile)&&(

                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6,marginTop:2}}>
                          onClick={e=>e.stopPropagation()}

                          style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:20,fontSize:11,fontWeight:600,color:"#1d4ed8",textDecoration:"none"}}>

                          📄 Hợp đồng ↗

                        </a>

                      )}

                      {(n.pricePolicyLink||n.pricePolicyFile)&&(

                      )}
                          onClick={e=>e.stopPropagation()}

                          style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",background:"#f0fdf4",border:"1px solid #86efac",borderRadius:20,fontSize:11,fontWeight:600,color:"#166534",textDecoration:"none"}}>

                          💰 Bảng giá ↗

                        </a>

                      )}

                      {(n.imagesDriveLink||n.imagesFile)&&(

                      )}
                          onClick={e=>e.stopPropagation()}

                          style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",background:"#fdf4ff",border:"1px solid #e9d5ff",borderRadius:20,fontSize:11,fontWeight:600,color:"#7e22ce",textDecoration:"none"}}>

                          🖼 Ảnh SP ↗

                        </a>

                      )}

                    </div>

                  )}

                    </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,paddingTop:8,borderTop:"1px solid #e0e7ff"}}>

                    <span style={{fontSize:11,color:"#2563eb"}}>{activeBks.length} booking đang xử lý</span>

                    {totalDebt>0&&<span style={{fontSize:11,fontWeight:600,background:"#fdf0ee",color:"#b0554a",borderRadius:6,padding:"2px 8px"}}>Nợ {fmtS(totalDebt)} đ</span>}

                  </div>

                </Card>

              );

            })}



            <div onClick={()=>{setEditNcc(null);setSubView("ncc_form");}}

              style={{background:"#eff6ff",border:"2px dashed #bfdbfe",borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:160,transition:"border-color .15s"}}

              onMouseEnter={e=>e.currentTarget.style.borderColor="#2563eb"}

              onMouseLeave={e=>e.currentTarget.style.borderColor="#bfdbfe"}>

              <div style={{fontSize:28,marginBottom:8}}>🏢</div>

              <div style={{fontSize:13,fontWeight:600,color:"#2563eb"}}>+ Thêm nhà cung cấp</div>

              <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Hãng bay, KS, lữ hành...</div>

            </div>

          </div>

          <div style={{fontSize:12,color:"#94a3b8",marginTop:10,textAlign:"right"}}>{nccList.length} nhà cung cấp</div>

        </div>

      )}



      {showImportNcc&&(

        <ImportExcelModal

          mode="ncc"

          existingItems={nccList}

          pushNotif={pushNotif}

          onClose={()=>setShowImportNcc(false)}

          onImport={(newItems, dupMode)=>{

            if(dupMode==="overwrite"){

              setNccList(prev=>{

                const merged=[...prev];

              });

            }

            pushNotif(`Đã import ${newItems.length} nhà cung cấp`,"success");

          }}

        />

      )}

    </div>

  );

}



// ═══════════════════════════════════════════════════════════

// APPROVALS MODULE — Phê duyệt chi đa cấp

// ═══════════════════════════════════════════════════════════
          createdAt: new Date().toISOString(),

          attachments:[],

          bookingRef: bk.id,

          auditLog:[{

            ts:new Date().toISOString(),

          auditLog:[{
            role:currentRole||"dieu_hanh",

            action:"created",

            note:"Tự động từ booking NCC "+bk.id+" — cọc "+fmt(bk.deposit)+"đ"

          }],

        };

        onCreateExpense(exp);

        pushNotif("Đã tạo phiếu chi "+expId+" — "+fmt(bk.deposit)+"đ chờ KT duyệt","warning");

      }

    }

    setEditBk(null); setSubView("list");

  };



  const handleCancelBk = (id) => {


    setSubView("list");

  const handleAddPayment = (bkId, pay) => {

    syncBookings(bs=>bs.map(b=>{

      if(b.id!==bkId) return b;

      const newPaid=b.payments.reduce((s,p)=>s+p.amount,0)+pay.amount;

      const newRemaining=b.totalNet-newPaid;

      return{...b,payments:[...b.payments,pay],remaining:newRemaining,

      const newRemaining=b.totalNet-newPaid;
    }));

  };



  // Routing

  if(subView==="ncc_form"){

    return <NCCProviderForm nccList={nccList} onSave={handleSaveNcc}

      onCancel={()=>{setEditNcc(null);setSubView("list");setNccTab("providers");}}

      editNcc={editNcc} pushNotif={pushNotif}/>;

  }

  if(subView==="form"){

    return <NCCBookingForm orders={orders} bookings={bookings} nccList={nccList}

      onSave={handleSaveBk} onCancel={()=>{setEditBk(null);setSubView("list");}}

      editBk={editBk} pushNotif={pushNotif} currentUser={currentUser}/>;

  }

  if(subView==="detail"&&detailBk){

    const liveBk=bookings.find(b=>b.id===detailBk.id)||detailBk;

    return <NCCBookingDetail bk={liveBk} orders={orders} vouchers={vouchers} nccList={nccList}

      onBack={()=>setSubView("list")} onEdit={(b)=>{setEditBk(b);setSubView("form");}}

    const congNoNCC = totalNet - totalPaid;

    const criticalBks = active.filter(b=>b.timeLimit&&useTimeLimitState(b.timeLimit).critical&&!useTimeLimitState(b.timeLimit).expired);

    const expiredBks  = active.filter(b=>b.timeLimit&&useTimeLimitState(b.timeLimit).expired);

    return { total:active.length, totalNet, totalPaid, congNoNCC, critical:criticalBks.length, expired:expiredBks.length, nccCount:nccList.length };

  }, [bookings, nccList]);



  // PNR duplicate check (global search)

  const pnrDup = pnrSearch.trim()

    ? checkPnrDuplicate(pnrSearch, bookings)

    : null;



  const filtered = useMemo(()=>{

    let list = [...bookings];

    if(filterStatus!=="all") list=list.filter(b=>b.status===filterStatus);

    if(filterCat!=="all")    list=list.filter(b=>b.serviceType===filterCat);

    if(search.trim()){

      const q=search.toLowerCase();

      list=list.filter(b=>

        b.id.toLowerCase().includes(q)||

        b.nccName.toLowerCase().includes(q)||

        b.pnrCode.toLowerCase().includes(q)||

        b.serviceName.toLowerCase().includes(q)||

        b.orderId.toLowerCase().includes(q)

      );

    }

    list.sort((a,b)=>{

      const ta=a.timeLimit?new Date(a.timeLimit).getTime():Infinity;

      const tb=b.timeLimit?new Date(b.timeLimit).getTime():Infinity;

      return ta-tb;

    });

    return list;

  },[bookings,filterStatus,filterCat,search]);



  // NCC CRUD handlers

  const handleSaveNcc=(ncc)=>{

          onClose={()=>setShowImportNcc(false)}

          onImport={(newItems, dupMode)=>{

            if(dupMode==="overwrite"){

              setNccList(prev=>{

                const merged=[...prev];

                newItems.forEach(ni=>{

                const merged=[...prev];
                  if(idx>=0) merged[idx]={...merged[idx],...ni};

                  else merged.push(ni);

                });

                return merged;

              });

            } else {

              setNccList(prev=>{

            } else {
              setNccList(prev=>{
              });

            }

            pushNotif(`Đã import ${newItems.length} nhà cung cấp`,"success");

          }}

        />

      )}

      {confirmDlg&&<ConfirmModal {...confirmDlg} onCancel={()=>setConfirmDlg(null)}/>}

    </div>

  );

}



// ═══════════════════════════════════════════════════════════

        const exp={

          id: expId,

          orderId: bk.orderId,

          orderName: orders.find(o=>o.id===bk.orderId)?.serviceName||bk.orderId,

          ncc: bk.nccName,

          nccBank: bk.ncc?.bank||"",

          pnrCode: bk.pnrCode||"",

          amount: bk.deposit,

          method: "transfer",

          note: "C?c booking "+bk.id+" — "+bk.nccName+" (t? t?o t? booking NCC)",

          budgetLine: bk.totalNet||0,

          status: "pending_kt",

          createdBy: currentUser?.name||"ÐH",

          createdAt: new Date().toISOString(),

          attachments:[],

          bookingRef: bk.id,

          auditLog:[{

            ts:new Date().toISOString(),

            actor:currentUser?.name||"ÐH",

            role:currentRole||"dieu_hanh",

            action:"created",

            note:"T? ð?ng t? booking NCC "+bk.id+" — c?c "+fmt(bk.deposit)+"ð"

          }],

        };

        onCreateExpense(exp);

        pushNotif("Ð? t?o phi?u chi "+expId+" — "+fmt(bk.deposit)+"ð ch? KT duy?t","warning");

      }

    }

    setEditBk(null); setSubView("list");

  };



  const handleCancelBk = (id) => {

    syncBookings(bs=>bs.map(b=>b.id===id?{...b,status:"cancelled"}:b));

    setSubView("list");

  };

                return [...prev,...newItems.filter(ni=>!existingNames.has(ni.name?.toLowerCase()))];

              });

            }

            pushNotif(`Đã import ${newItems.length} nhà cung cấp`,"success");

          }}

        />

      )}

    </div>

  );

}



// ═══════════════════════════════════════════════════════════

// APPROVALS MODULE — Phê duyệt chi đa cấp

// ═══════════════════════════════════════════════════════════



      editNcc={editNcc} pushNotif={pushNotif}/>;

  }

  if(subView==="form"){

    return <NCCBookingForm orders={orders} bookings={bookings} nccList={nccList}

      onSave={handleSaveBk} onCancel={()=>{setEditBk(null);setSubView("list");}}

      editBk={editBk} pushNotif={pushNotif} currentUser={currentUser}/>;

  }

  if(subView==="detail"&&detailBk){

    const liveBk=bookings.find(b=>b.id===detailBk.id)||detailBk;

    return <NCCBookingDetail bk={liveBk} orders={orders} vouchers={vouchers} nccList={nccList}

      onBack={()=>setSubView("list")} onEdit={(b)=>{setEditBk(b);setSubView("form");}}

      onCancel={handleCancelBk} onAddPayment={handleAddPayment} pushNotif={pushNotif}/>;

  }





    setSelected(q); setSubView("detail");

  return(

    <div>

      <PageHeader

      onSave={handleSave}

      pushNotif={pushNotif}

        actions={

          nccTab==="bookings"

    return <QuoteDetail

      onBack={()=>setSubView("list")}

        }

                            </div>

                            <span style={{fontSize:11,color:"#94a3b8"}}>{pct(paid,bk.totalNet)}%</span>

                          </div>

                          <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>Còn: {fmt(bk.remaining)} đ</div>

                        </td>

                        <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}>

                        </td>
                        <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}>
      </div>





      {filtered.filter(b=>{const t=b.timeLimit&&useTimeLimitState(b.timeLimit);return t&&(t.critical||t.expired);}).slice(0,3).map(b=>{

        const t=useTimeLimitState(b.timeLimit);

        return(

            <div style={{padding:"8px 14px",borderTop:"1px solid #e0e7ff",fontSize:12,color:"#94a3b8"}}>{filtered.length}/{bookings.filter(b=>b.status!=="cancelled").length} booking đang hoạt động</div>

          </Card>

        </>

      )}





      {nccTab==="providers"&&(

        <div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>

            {nccList.map(n=>{

              const cat=NCC_CAT[n.cat]||NCC_CAT["khac"];

              const catLabel = n.cat==="khac"&&n.customCat ? n.customCat : cat.label;

              const activeBks=bookings.filter(b=>b.nccId===n.id&&b.status!=="cancelled");

              const totalDebt=activeBks.reduce((s,b)=>s+b.remaining,0);

              const hasDocs = n.contractLink||n.contractFile||n.pricePolicyLink||n.pricePolicyFile||n.imagesDriveLink||n.imagesFile||(n.contracts||[]).length>0;

              return(

                <div key={n.id} onClick={()=>setDetailNcc(n)}

                  style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:"14px 16px",

                    cursor:"pointer",transition:"box-shadow .15s,transform .1s",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}

                  onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)";e.currentTarget.style.transform="translateY(-2px)";}}

                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.05)";e.currentTarget.style.transform="none";}}>

                  {/* Header */}

                  <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>

                    <div style={{width:40,height:40,borderRadius:10,background:cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>

                      {cat.icon}

                    </div>

                    <div style={{flex:1,minWidth:0}}>

                      <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.name}</div>

                      <span style={{fontSize:11,background:cat.bg,color:cat.color,borderRadius:20,padding:"2px 9px",fontWeight:600}}>{catLabel}</span>

                    </div>

                  </div>

                  {/* Key info */}

                  <div style={{fontSize:12,color:"#64748b",marginBottom:2}}>📞 {n.phone||"—"}</div>

                  <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>✉️ {n.contact||"—"}</div>

                  {/* Doc badges */}

                  {hasDocs&&(

                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>

                      {(n.contractLink||n.contractFile)&&<span style={{background:"#eff6ff",color:"#1d4ed8",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:600}}>📄 HĐ</span>}

                      {(n.pricePolicyLink||n.pricePolicyFile)&&<span style={{background:"#f0fdf4",color:"#166534",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:600}}>💰 Giá</span>}

                      {(n.imagesDriveLink||n.imagesFile)&&<span style={{background:"#fdf4ff",color:"#7e22ce",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:600}}>🖼 Ảnh</span>}

                      {(n.contracts||[]).length>0&&<span style={{background:"#f0fdf4",color:"#166534",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:600}}>📎 {n.contracts.length} file scan</span>}

                    </div>

                  )}

                  {/* Footer */}

                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,borderTop:"1px solid #f1f5f9"}}>

                    <span style={{fontSize:11,color:"#2563eb"}}>{activeBks.length} booking</span>

                    {totalDebt>0

                      ? <span style={{fontSize:11,fontWeight:700,background:"#fdf0ee",color:"#b0554a",borderRadius:6,padding:"2px 8px"}}>Nợ {fmtS(totalDebt)}đ</span>

                      : <span style={{fontSize:10,color:"#94a3b8"}}>Xem chi tiết →</span>

                    }

                  </div>

                </div>

              );

            })}



            <div onClick={()=>{setEditNcc(null);setSubView("ncc_form");}}

              style={{background:"#eff6ff",border:"2px dashed #bfdbfe",borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:160,transition:"border-color .15s"}}

              onMouseEnter={e=>e.currentTarget.style.borderColor="#2563eb"}

              onMouseLeave={e=>e.currentTarget.style.borderColor="#bfdbfe"}>

              <div style={{fontSize:28,marginBottom:8}}>🏢</div>

              <div style={{fontSize:13,fontWeight:600,color:"#2563eb"}}>+ Thêm nhà cung cấp</div>

              <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Hãng bay, KS, lữ hành...</div>

            </div>

          </div>

          <div style={{fontSize:12,color:"#94a3b8",marginTop:10,textAlign:"right"}}>{nccList.length} nhà cung cấp</div>

        </div>

      )}



      {/* ── NCC Detail Drawer ─────────────────────────────── */}

      {detailNcc&&(()=>{

        const n=detailNcc;

        const cat=NCC_CAT[n.cat]||NCC_CAT["khac"];

        const n=detailNcc;
        const activeBks=bookings.filter(b=>b.nccId===n.id&&b.status!=="cancelled");

        const totalDebt=activeBks.reduce((s,b)=>s+b.remaining,0);

        const activeBks=bookings.filter(b=>b.nccId===n.id&&b.status!=="cancelled");
          <a href={href} target="_blank" rel="noreferrer"

            style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",

              background:bg,border:`1px solid ${border}`,borderRadius:8,

              fontSize:12,fontWeight:600,color,textDecoration:"none"}}>

            {label} ↗

          </a>

        ):null;

        return(

          <>

            {/* backdrop */}

            <div onClick={()=>setDetailNcc(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:300}}/>

            {/* drawer */}

            <div style={{position:"fixed",top:0,right:0,width:480,maxWidth:"95vw",height:"100vh",

              background:"#fff",zIndex:301,overflowY:"auto",boxShadow:"-4px 0 30px rgba(0,0,0,.15)",

                        onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"}

                        onMouseLeave={e=>e.currentTarget.style.background=rowBg}

                        onClick={()=>{setDetailBk(bk);setSubView("detail");}}>

                        <td style={{padding:"10px 12px",fontWeight:600,color:"#2563eb"}}>{bk.id}</td>

  const vatAmt   = (q.items||[]).reduce((s,i)=>s+(i.vatAmount||0),0);

                        <td style={{padding:"10px 12px",maxWidth:200}}>

                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>

                            <span style={{fontSize:12,background:cat.bg,color:cat.color,borderRadius:6,padding:"1px 6px"}}>{cat.icon}</span>

                            <span style={{fontWeight:500}}>{bk.nccName}</span>

                          </div>

                          <div style={{fontSize:11,color:"#94a3b8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:200}}>{bk.serviceName}</div>

                        </td>

                        <td style={{padding:"10px 12px"}}><span style={{fontFamily:"monospace",fontSize:12,fontWeight:600,color:"#1a4d8f"}}>{bk.pnrCode}</span></td>

                        <td style={{padding:"10px 12px",fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap",fontWeight:600}}>{fmt(bk.totalNet)} ð</td>

                        <td style={{padding:"10px 12px",minWidth:110}}>

                          <div style={{display:"flex",alignItems:"center",gap:5}}>

                            <div style={{flex:1,height:5,background:"#dbeafe",borderRadius:3,overflow:"hidden"}}>

                              <div style={{width:`${pct(paid,bk.totalNet)}%`,height:"100%",background:paid>=bk.totalNet?"#2563eb":"#b0554a",borderRadius:3}}/>

                            </div>

                            <span style={{fontSize:11,color:"#94a3b8"}}>{pct(paid,bk.totalNet)}%</span>

                          </div>

</style></head><body>

                        </td>

                        <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}>

  <div class="co-info">✉ ${COMPANY_INFO.email}</div>

                        </td>

                        <td style={{padding:"10px 12px"}}><SBadge status={bk.status} cfg={BK_STATUS} size="sm"/></td>

                        <td style={{padding:"10px 12px"}}><Btn size="sm" variant="outline" onClick={e=>{e.stopPropagation();setDetailBk(bk);setSubView("detail");}}>Xem ?</Btn></td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

    <th style="width:30px;text-align:center">STT</th>

          </Card>

        </>

      )}





      {nccTab==="providers"&&(

        <div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>

            {nccList.map(n=>{

              const cat=NCC_CAT[n.cat]||NCC_CAT["khac"];

              const catLabel = n.cat==="khac"&&n.customCat ? n.customCat : cat.label;

              const activeBks=bookings.filter(b=>b.nccId===n.id&&b.status!=="cancelled");

              const totalDebt=activeBks.reduce((s,b)=>s+(b.totalNet-(b.payments||[]).reduce((a,p)=>a+p.amount,0)),0);

              const hasDocs = n.contractLink||n.contractFile||n.pricePolicyLink||n.pricePolicyFile||n.imagesDriveLink||n.imagesFile||(n.contracts||[]).length>0;

              return(

                <div key={n.id} onClick={()=>setDetailNcc(n)}

                  style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:"14px 16px",

                    cursor:"pointer",transition:"box-shadow .15s,transform .1s",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}

                  onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)";e.currentTarget.style.transform="translateY(-2px)";}}

                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.05)";e.currentTarget.style.transform="none";}}>

                  {/* Header */}

                  <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>

                    <div style={{width:40,height:40,borderRadius:10,background:cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>

                      {cat.icon}

                    </div>

                    <div style={{flex:1,minWidth:0}}>

                      <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.name}</div>

                      <span style={{fontSize:11,background:cat.bg,color:cat.color,borderRadius:20,padding:"2px 9px",fontWeight:600}}>{catLabel}</span>

                    </div>

                  </div>

                  {/* Key info */}

    draft:  {label:"Nháp",       color:"#7a5a00",bg:"#fef9e7",icon:"📝"},

    accepted:{label:"Đã chốt",   color:"#1d6b4f",bg:"#e8f5ef",icon:"✅"},

                  {/* Doc badges */}

                  {hasDocs&&(

                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>

        subtitle="Tạo, quản lý và xuất bản chào giá gửi khách hàng"

      />

      {quotes.length===0?(

      ):(

                    </div>

                  )}

                  {/* Footer */}

                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,borderTop:"1px solid #f1f5f9"}}>

                    <span style={{fontSize:11,color:"#2563eb"}}>{activeBks.length} booking</span>

                    {totalDebt>0

                    <div style={{fontSize:11,color:"#64748b"}}>{q.customerName||"Chưa có KH"}</div>

                  <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,

                    }

                  </div>

                </div>

              );

            })}



            <div onClick={()=>{setEditNcc(null);setSubView("ncc_form");}}

              style={{background:"#eff6ff",border:"2px dashed #bfdbfe",borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:160,transition:"border-color .15s"}}

              onMouseEnter={e=>e.currentTarget.style.borderColor="#2563eb"}

              onMouseLeave={e=>e.currentTarget.style.borderColor="#bfdbfe"}>

        </div>

    </div>

}

            </div>

          </div>



        </div>

      )}



        <td style="padding:7px 10px;border:1px solid #ddd;text-align:center">${item.unit||""}</td>

      {detailNcc&&(()=>{

        const n=detailNcc;

        const cat=NCC_CAT[n.cat]||NCC_CAT["khac"];

          <Btn variant="outline" size="sm" onClick={exportExcel}>📊 Xuất Excel</Btn>

        const activeBks=bookings.filter(b=>b.nccId===n.id&&b.status!=="cancelled");

        const totalDebt=activeBks.reduce((s,b)=>s+(b.totalNet-(b.payments||[]).reduce((a,p)=>a+p.amount,0)),0);

        const DocLink=({href,label,bg,color,border})=>href?(

                    {activeBks.slice(0,5).map(bk=>(

                      <div key={bk.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#f8fafc",borderRadius:8,marginBottom:4,fontSize:12}}>

                        <span style={{fontWeight:600,color:"#2563eb"}}>{bk.id}</span>

                        <span style={{flex:1,color:"#64748b"}}>{bk.serviceName||bk.nccName}</span>

                        {bk.remaining>0&&<span style={{fontWeight:700,color:"#b0554a"}}>Nợ {fmtS(bk.remaining)}đ</span>}

                      </div>

                    ))}

                    {totalDebt>0&&(

          <>

            {/* backdrop */}

            <div onClick={()=>setDetailNcc(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:300}}/>

            {/* drawer */}

            <div style={{position:"fixed",top:0,right:0,width:480,maxWidth:"95vw",height:"100vh",

              background:"#fff",zIndex:301,overflowY:"auto",boxShadow:"-4px 0 30px rgba(0,0,0,.15)",

              display:"flex",flexDirection:"column"}}>

      {nccTab==="congno"&&(()=>{

        const debtMap={};

        bookings.filter(b=>b.status!=="cancelled").forEach(b=>{

          const paid=b.payments.reduce((s,p)=>s+p.amount,0);

          const debt=b.totalNet-paid;

          if(!debtMap[b.nccName]) debtMap[b.nccName]={name:b.nccName,totalNet:0,totalPaid:0,debt:0,bookingCount:0,overdue:[],upcoming:[]};

          debtMap[b.nccName].totalNet+=b.totalNet;

          debtMap[b.nccName].totalPaid+=paid;

          debtMap[b.nccName].debt+=debt;

          debtMap[b.nccName].bookingCount++;

          if(debt>0&&b.paymentDeadline){

            const daysLeft=Math.ceil((new Date(b.paymentDeadline)-new Date(NOW_ISO))/86400000);

            if(daysLeft<0) debtMap[b.nccName].overdue.push({id:b.id,debt,deadline:b.paymentDeadline,daysLeft});

            else if(daysLeft<=7) debtMap[b.nccName].upcoming.push({id:b.id,debt,deadline:b.paymentDeadline,daysLeft});

          }

        });

        const rows=Object.values(debtMap).filter(r=>r.debt>0).sort((a,b)=>b.debt-a.debt);

        const totalDebt=rows.reduce((s,r)=>s+r.debt,0);

        const overdueCount=rows.reduce((s,r)=>s+r.overdue.length,0);

        const upcomingCount=rows.reduce((s,r)=>s+r.upcoming.length,0);


function FinancePanel({order,vouchers,onAddVoucher,onApprove,onReject,pushNotif,currentRole,currentUser,bankAccounts=[],expenses=[]}){

  const [tab,setTab]=useState("thu");

  const [showForm,setShowForm]=useState(false);

  const [formType,setFormType]=useState("thu");

  const [fAmount,setFAmount]=useState("");

  const [fMethod,setFMethod]=useState("transfer");

  const [fBankId,setFBankId]=useState("");

  const [fNote,setFNote]=useState("");

  const [fBillImg,setFBillImg]=useState(null);

  const [fNcc,setFNcc]=useState(NCC_LIST[0]);

  const [fPnr,setFPnr]=useState("");

  const [fInstall,setFInstall]=useState(1);



  const thu = vouchers.filter(v=>v.orderId===order.id&&v.type==="thu");

  const chi = vouchers.filter(v=>v.orderId===order.id&&v.type==="chi");

  const totalThu   = thu.filter(v=>v.status==="approved").reduce((s,v)=>s+v.amount,0);

  // Merge: chi NCC qua cả 2 luồng (phiếu chi + expenses)

  const chiVoucher = chi.filter(v=>v.status==="approved").reduce((s,v)=>s+v.amount,0);

  const chiExpense = expenses.filter(e=>e.orderId===order.id&&e.status==="paid").reduce((s,e)=>s+e.amount,0);

  const totalChi   = chiVoucher + chiExpense;

  // Tính công nợ đúng theo VAT

  const orderTotal = calcOrderTotal(order);

  const congNoKH   = orderTotal - totalThu;

  const orderTotal = calcOrderTotal(order);


  // TK ngân hàng theo quy tắc: có HĐ → TK001+TK002, không HĐ → chỉ TK002

  const availableBanks = bankAccounts.filter(a=>{

    if(!a.active) return false;

    if(order.invoiceType==="invoice") return true; // cả 2 TK

    if(!a.active) return false;
  });



  const handleBill=(e)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setFBillImg(ev.target.result);r.readAsDataURL(f);};



  const handleSubmit=()=>{

    const amount=Number(fAmount);

    if(!amount||amount<=0){pushNotif("Số tiền không hợp lệ","error");return;}

    if(formType==="thu"&&amount>congNoKH){pushNotif(`Vượt công nợ KH còn lại (${fmt(congNoKH)} đ)`,"error");return;}

    const id=genVId(formType,vouchers);

    const v={
      id,type:formType,orderId:order.id,
      amount,method:fMethod,note:fNote,
      date:new Date().toISOString().slice(0,10),
      status:"pending",approvedBy:null,billImg:fBillImg,
      ...(formType==="thu"?{installment:fInstall}:{ncc:fNcc,pnrCode:fPnr}),
    };

    onAddVoucher(v);

    setShowForm(false);setFAmount("");setFBillImg(null);setFNote("");setFPnr("");

    pushNotif(`Đã tạo ${id} — chờ kế toán xác nhận`,"warning");

  };



  const VoucherCard = ({v}) => {

    const sc=VOUCHER_STATUS[v.status];

    const canApprove=(currentRole==="accountant"||currentRole==="manager")&&v.status==="pending";

    return(

      <div style={{background:v.status==="pending"?"#fffef5":"#fff",border:`1px solid ${v.status==="pending"?"#e8c53a40":"#e0e7ff"}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}>

        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>

          <div>

            <span style={{fontSize:12,fontWeight:700,color:v.type==="thu"?"#2563eb":"#b0554a",fontVariantNumeric:"tabular-nums"}}>{v.id}</span>

            <span style={{marginLeft:8,fontSize:12,color:"#888"}}>{fmtD(v.date)} · {METHODS.find(m=>m.v===v.method)?.l||v.method}</span>

          </div>

          <div style={{display:"flex",alignItems:"center",gap:8}}>

                    setAddingEvent(false);setNewEvDate("");setNewEvLabel("");

          <div style={{display:"flex",alignItems:"center",gap:8}}>
                  }}>Lýu</Btn>

                </div>

              </div>

            )}



              upcomingEvents.map(e=>{

                const evCfg=CRM_EVENT_TYPES[e.type]||CRM_EVENT_TYPES.custom;

                const urgent=e.daysLeft<=14;

                return(

                  <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:"1px solid #e0e7ff"}}>

                    <div style={{width:34,height:34,borderRadius:"50%",background:evCfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{evCfg.icon}</div>

                    <div style={{flex:1}}>

                      <div style={{fontSize:13,fontWeight:500,color:"#1e293b"}}>{e.label}</div>

                  {filtered.length===0&&<tr><td colSpan={9} style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:13}}>Không có booking nào</td></tr>}

                    </div>

                    <div style={{textAlign:"right"}}>

                      <div style={{fontSize:12,fontWeight:600,color:e.daysLeft===0?"#be185d":urgent?"#7a5a00":"#2563eb"}}>

    if(stepId==="sale") return true;

                      </div>

                    </div>

                    <Btn size="sm" variant="outline" onClick={()=>setComposing(e)}>??</Btn>

                  </div>

                );

              })

            )}

          </Card>



          <Card style={{marginBottom:12}}>

            <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>?? L?ch s? ðõn hàng ({cOrders.length})</div>

            <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>📋 Lịch sử đơn hàng ({cOrders.length})</div>

            {cOrders.length===0?<div style={{textAlign:"center",color:"#94a3b8",fontSize:13,padding:"16px 0"}}>Chưa có đơn nào</div>:(

              cOrders.map(o=>{

                const paid=o.totalPaid||0; const rev=o.pricing?.totalRevenue||0;

                return(

                  <div key={o.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:"1px solid #e0e7ff"}}>

                    <div style={{flex:1}}>

                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>

                        <span style={{fontWeight:600,fontSize:12,color:"#2563eb"}}>{o.id}</span>

                        <SBadge status={o.status} cfg={ORDER_STATUS} size="sm"/>

                      </div>

                      <div style={{fontSize:12,color:"#475569"}}>{o.serviceName}</div>

                      <div style={{fontSize:11,color:"#94a3b8"}}>{fmtD(o.departDate)} · {o.sale}</div>

                    </div>

                    <div style={{textAlign:"right",minWidth:100}}>

                      <div style={{fontSize:13,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmt(rev)} đ</div>

                      <div style={{height:4,background:"#dbeafe",borderRadius:2,overflow:"hidden",marginTop:4}}>

                      <div style={{fontSize:13,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmt(rev)} đ</div>
