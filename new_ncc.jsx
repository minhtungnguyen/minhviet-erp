function NCCDashboard({ orders, vouchers, pushNotif, currentRole, onCreateExpense, currentUser, bookings:bookingsProp=SEED_NCC_BOOKINGS, onUpdateBookings }){
  const [bookings,setBookings]=React.useState(bookingsProp||[]);
  const [nccList,setNccList]=React.useState(SEED_NCC_MASTER||[]);
  const [tab,setTab]=React.useState("ncc");
  const [groupFilter,setGroupFilter]=React.useState("all");
  const [showBkForm,setShowBkForm]=React.useState(false);
  const [showNccForm,setShowNccForm]=React.useState(false);
  const [editNcc,setEditNcc]=React.useState(null);
  const [selectedNcc,setSelectedNcc]=React.useState(null);
  const [bkForm,setBkForm]=React.useState({orderId:"",nccId:"",service:"",amount:"",pnrCode:"",note:"",dueDate:""});
  const [nccForm,setNccForm]=React.useState({name:"",cat:"khac",customCat:"",contact:"",phone:"",bank:"",taxCode:"",address:"",note:"",contractUrl:"",contractExpiry:"",pricePolicyUrl:"",imagesUrl:""});

  const syncBookings=(list)=>{setBookings(list);onUpdateBookings&&onUpdateBookings(list);};
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const setBk=(k,v)=>setBkForm(f=>({...f,[k]:v}));
  const setN=(k,v)=>setNccForm(f=>({...f,[k]:v}));

  const BK_STATUS={pending:{bg:"#fef9c3",c:"#92400e",label:"Chờ xác nhận"},confirmed:{bg:"#dbeafe",c:"#1d4ed8",label:"Đã xác nhận"},paid:{bg:"#dcfce7",c:"#15803d",label:"Đã thanh toán"},cancelled:{bg:"#fee2e2",c:"#dc2626",label:"Đã hủy"}};

  // ── Nhóm NCC theo danh mục ──────────────────────────────
  const groups=React.useMemo(()=>{
    const order=["Vận chuyển","Lưu trú","Điểm đến","Dịch vụ","Đại lý","Khác"];
    const m={};
    nccList.forEach(n=>{
      const cat=NCC_CAT[n.cat]||NCC_CAT.khac;
      const g=cat.group||"Khác";
      if(!m[g]) m[g]=[];
      m[g].push(n);
    });
    return order.filter(g=>m[g]).map(g=>({group:g,items:m[g]}));
  },[nccList]);

  const visibleGroups=groupFilter==="all"?groups:groups.filter(g=>g.group===groupFilter);

  const debtByNcc=(nccId)=>bookings.filter(b=>b.nccId===nccId&&b.status!=="cancelled"&&b.status!=="paid").reduce((s,b)=>s+(b.amount||0),0);
  const totalDebtAll=nccList.reduce((s,n)=>s+debtByNcc(n.id),0);

  const saveBooking=()=>{
    if(!bkForm.orderId||!bkForm.nccId||!bkForm.amount) return pushNotif&&pushNotif("Chọn đơn, NCC và nhập số tiền","error");
    const ncc=nccList.find(n=>n.id===bkForm.nccId);
    if(bkForm.pnrCode){
      const dup=bookings.find(b=>b.pnrCode===bkForm.pnrCode&&b.status!=="cancelled");
      if(dup) return pushNotif&&pushNotif("Mã PNR "+bkForm.pnrCode+" đã được dùng ở booking "+dup.id,"error");
    }
    const bk={...bkForm,id:"BK"+Date.now(),amount:Number(bkForm.amount),status:"pending",nccName:ncc?.name||bkForm.nccId,createdBy:currentUser?.name,createdAt:new Date().toISOString()};
    syncBookings([bk,...bookings]);
    if(onCreateExpense){
      const exp={id:"EXP"+Date.now(),orderId:bkForm.orderId,type:"chi",amount:Number(bkForm.amount),note:"NCC: "+(ncc?.name||"")+" - "+bkForm.service,status:"pending",method:"bank",createdBy:currentUser?.name,createdAt:new Date().toISOString(),nccName:ncc?.name||""};
      onCreateExpense(exp);
    }
    pushNotif&&pushNotif("Đã tạo booking "+bk.id+" — chờ kế toán duyệt chi");
    setShowBkForm(false); setBkForm({orderId:"",nccId:"",service:"",amount:"",pnrCode:"",note:"",dueDate:""});
  };

  const changeBkStatus=(id,status)=>{
    syncBookings(bookings.map(b=>b.id===id?{...b,status}:b));
    pushNotif&&pushNotif("Booking "+id+" → "+(BK_STATUS[status]?.label||status));
  };

  const saveNcc=()=>{
    if(!nccForm.name.trim()) return pushNotif&&pushNotif("Nhập tên NCC","error");
    if(editNcc){
      const updated={...editNcc,...nccForm};
      setNccList(nccList.map(n=>n.id===editNcc.id?updated:n));
      if(selectedNcc?.id===editNcc.id) setSelectedNcc(updated);
      pushNotif&&pushNotif("Đã cập nhật NCC "+nccForm.name);
    } else {
      setNccList([{...nccForm,id:"NCC"+Date.now()},...nccList]);
      pushNotif&&pushNotif("Đã thêm NCC mới: "+nccForm.name);
    }
    setShowNccForm(false); setEditNcc(null);
    setNccForm({name:"",cat:"khac",customCat:"",contact:"",phone:"",bank:"",taxCode:"",address:"",note:"",contractUrl:"",contractExpiry:"",pricePolicyUrl:"",imagesUrl:""});
  };

  const openNccForm=(n)=>{
    setEditNcc(n);
    setNccForm(n?{name:n.name||"",cat:n.cat||"khac",customCat:n.customCat||"",contact:n.contact||"",phone:n.phone||"",bank:n.bank||"",taxCode:n.taxCode||"",address:n.address||"",note:n.note||"",contractUrl:n.contractUrl||"",contractExpiry:n.contractExpiry||"",pricePolicyUrl:n.pricePolicyUrl||"",imagesUrl:n.imagesUrl||""}:{name:"",cat:"khac",customCat:"",contact:"",phone:"",bank:"",taxCode:"",address:"",note:"",contractUrl:"",contractExpiry:"",pricePolicyUrl:"",imagesUrl:""});
    setShowNccForm(true);
  };

  const fieldStyle={width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"};
  const labelStyle={display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"};

  // ── DETAIL VIEW (1 NCC cụ thể) ───────────────────────────
  if(selectedNcc){
    const cat=NCC_CAT[selectedNcc.cat]||NCC_CAT.khac;
    const catLabel=selectedNcc.cat==="khac"&&selectedNcc.customCat?selectedNcc.customCat:cat.label;
    const nccBookings=bookings.filter(b=>b.nccId===selectedNcc.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    const debt=debtByNcc(selectedNcc.id);
    const expired=selectedNcc.contractExpiry&&new Date(selectedNcc.contractExpiry)<new Date();
    return(
      <div style={{padding:24,maxWidth:760,margin:"0 auto"}}>
        <button onClick={()=>setSelectedNcc(null)} style={{background:"none",border:"none",color:"#2563eb",cursor:"pointer",fontSize:14,marginBottom:16}}>← Danh sách NCC</button>
        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <h2 style={{margin:0,fontSize:19,fontWeight:800}}>{selectedNcc.name}</h2>
                <span style={{background:cat.bg,color:cat.color,borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:600}}>{cat.icon} {catLabel}</span>
              </div>
              <div style={{fontSize:13,color:"#64748b"}}>📞 {selectedNcc.phone||"—"} · ✉️ {selectedNcc.contact||"—"}</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:2}}>🏦 {selectedNcc.bank||"—"} {selectedNcc.taxCode?"· MST: "+selectedNcc.taxCode:""}</div>
              {selectedNcc.address&&<div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>📍 {selectedNcc.address}</div>}
            </div>
            <button onClick={()=>openNccForm(selectedNcc)} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:600}}>✏️ Sửa hồ sơ</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginTop:18}}>
            <div style={{background:"#f8fafc",borderRadius:10,padding:14}}>
              <div style={{fontSize:11,color:"#64748b"}}>Công nợ hiện tại</div>
              <div style={{fontSize:18,fontWeight:800,color:debt>0?"#dc2626":"#16a34a",marginTop:2}}>{fmtMoney(debt)}</div>
            </div>
            <div style={{background:"#f8fafc",borderRadius:10,padding:14}}>
              <div style={{fontSize:11,color:"#64748b"}}>Tổng booking</div>
              <div style={{fontSize:18,fontWeight:800,color:"#1e293b",marginTop:2}}>{nccBookings.length}</div>
            </div>
          </div>

          {(selectedNcc.contractUrl||selectedNcc.pricePolicyUrl||selectedNcc.imagesUrl)&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:14}}>
              {selectedNcc.contractUrl&&<a href={selectedNcc.contractUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:20,fontSize:12,fontWeight:600,color:"#1d4ed8",textDecoration:"none"}}>📄 Hợp đồng ↗</a>}
              {selectedNcc.pricePolicyUrl&&<a href={selectedNcc.pricePolicyUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",background:"#f0fdf4",border:"1px solid #86efac",borderRadius:20,fontSize:12,fontWeight:600,color:"#166534",textDecoration:"none"}}>💰 Bảng giá ↗</a>}
              {selectedNcc.imagesUrl&&<a href={selectedNcc.imagesUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",background:"#fdf4ff",border:"1px solid #e9d5ff",borderRadius:20,fontSize:12,fontWeight:600,color:"#7e22ce",textDecoration:"none"}}>🖼 Ảnh SP ↗</a>}
            </div>
          )}
          {expired&&<div style={{background:"#fee2e2",borderRadius:8,padding:"8px 12px",marginTop:12,fontSize:12,color:"#dc2626",fontWeight:600}}>⚠️ Hợp đồng đã hết hạn ({new Date(selectedNcc.contractExpiry).toLocaleDateString("vi-VN")}) — cần gia hạn</div>}
          {selectedNcc.note&&<div style={{fontSize:12,color:"#7a5a00",background:"#fef9e7",borderRadius:8,padding:"8px 12px",marginTop:12}}>{selectedNcc.note}</div>}
        </div>

        <div style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:12}}>Lịch sử booking với NCC này</div>
          {nccBookings.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:24,fontSize:13}}>Chưa có booking nào</div>}
          {nccBookings.map(bk=>{
            const sc=BK_STATUS[bk.status]||BK_STATUS.pending;
            return(
              <div key={bk.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{bk.id} · {bk.orderId}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>{bk.service||"—"} {bk.pnrCode?"· PNR: "+bk.pnrCode:""} {bk.dueDate?"· "+new Date(bk.dueDate).toLocaleDateString("vi-VN"):""}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,color:"#1e293b"}}>{fmtMoney(bk.amount)}</div>
                  {currentRole!=="sale"&&bk.status!=="paid"&&bk.status!=="cancelled"?(
                    <select value={bk.status} onChange={e=>changeBkStatus(bk.id,e.target.value)} style={{fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"2px 6px",marginTop:3}}>
                      <option value="pending">Chờ xác nhận</option><option value="confirmed">Đã xác nhận</option><option value="paid">Đã thanh toán</option><option value="cancelled">Hủy</option>
                    </select>
                  ):(
                    <span style={{fontSize:11,background:sc.bg,color:sc.c,borderRadius:6,padding:"2px 8px",fontWeight:600}}>{sc.label}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Nhà cung cấp (NCC)</h2>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{nccList.length} NCC · Tổng công nợ: <b style={{color:totalDebtAll>0?"#dc2626":"#16a34a"}}>{fmtMoney(totalDebtAll)}</b></div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>openNccForm(null)} style={{background:"#fff",border:"1px solid #2563eb",color:"#2563eb",borderRadius:9,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Thêm NCC</button>
          <button onClick={()=>setShowBkForm(true)} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Tạo booking</button>
        </div>
      </div>

      <div style={{display:"flex",gap:4,marginBottom:16,background:"#f1f5f9",borderRadius:10,padding:4,width:"fit-content",flexWrap:"wrap"}}>
        {[["ncc","Danh sách NCC"],["bookings","Booking ("+bookings.length+")"]].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:tab===k?"#fff":"transparent",color:tab===k?"#1e293b":"#64748b",boxShadow:tab===k?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{label}</button>
        ))}
      </div>

      {showBkForm&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <h3 style={{margin:"0 0 16px"}}>Tạo booking NCC mới</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={labelStyle}>Đơn hàng *</label>
              <select value={bkForm.orderId} onChange={e=>setBk("orderId",e.target.value)} style={fieldStyle}>
                <option value="">-- Chọn đơn --</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.id} - {o.customerName||o.customer}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>NCC *</label>
              <select value={bkForm.nccId} onChange={e=>setBk("nccId",e.target.value)} style={fieldStyle}>
                <option value="">-- Chọn NCC --</option>
                {groups.map(g=>(
                  <optgroup key={g.group} label={g.group}>
                    {g.items.map(n=>{const c=NCC_CAT[n.cat]||NCC_CAT.khac;return <option key={n.id} value={n.id}>{c.icon} {n.name}</option>;})}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Dịch vụ</label>
              <input value={bkForm.service} onChange={e=>setBk("service",e.target.value)} placeholder="Khách sạn, xe, vé..." style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Mã PNR / Booking ref</label>
              <input value={bkForm.pnrCode} onChange={e=>setBk("pnrCode",e.target.value)} placeholder="VN-2025-ABC123" style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Số tiền * (₫)</label>
              <input type="number" value={bkForm.amount} onChange={e=>setBk("amount",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Hạn thanh toán</label>
              <input type="date" value={bkForm.dueDate} onChange={e=>setBk("dueDate",e.target.value)} style={fieldStyle}/>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <label style={labelStyle}>Ghi chú</label>
            <input value={bkForm.note} onChange={e=>setBk("note",e.target.value)} style={fieldStyle}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={saveBooking} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700}}>Ghi nhận</button>
            <button onClick={()=>setShowBkForm(false)} style={{background:"#6b7280",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      {showNccForm&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <h3 style={{margin:"0 0 16px"}}>{editNcc?"Sửa NCC":"Thêm NCC mới"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={labelStyle}>Tên NCC *</label>
              <input value={nccForm.name} onChange={e=>setN("name",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Danh mục</label>
              <select value={nccForm.cat} onChange={e=>setN("cat",e.target.value)} style={fieldStyle}>
                {["Vận chuyển","Lưu trú","Điểm đến","Dịch vụ","Đại lý","Khác"].map(g=>(
                  <optgroup key={g} label={g}>
                    {Object.entries(NCC_CAT).filter(([,v])=>v.group===g).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            {nccForm.cat==="khac"&&(
              <div>
                <label style={labelStyle}>Tên danh mục tự định nghĩa</label>
                <input value={nccForm.customCat} onChange={e=>setN("customCat",e.target.value)} style={fieldStyle}/>
              </div>
            )}
            <div>
              <label style={labelStyle}>Email liên hệ</label>
              <input value={nccForm.contact} onChange={e=>setN("contact",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>SĐT</label>
              <input value={nccForm.phone} onChange={e=>setN("phone",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Số TK nhận thanh toán</label>
              <input value={nccForm.bank} onChange={e=>setN("bank",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Mã số thuế</label>
              <input value={nccForm.taxCode} onChange={e=>setN("taxCode",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Địa chỉ</label>
              <input value={nccForm.address} onChange={e=>setN("address",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Link hợp đồng</label>
              <input value={nccForm.contractUrl} onChange={e=>setN("contractUrl",e.target.value)} placeholder="https://drive.google.com/..." style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Ngày hết hạn HĐ</label>
              <input type="date" value={nccForm.contractExpiry} onChange={e=>setN("contractExpiry",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Link bảng giá</label>
              <input value={nccForm.pricePolicyUrl} onChange={e=>setN("pricePolicyUrl",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Link ảnh sản phẩm</label>
              <input value={nccForm.imagesUrl} onChange={e=>setN("imagesUrl",e.target.value)} style={fieldStyle}/>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <label style={labelStyle}>Ghi chú</label>
            <input value={nccForm.note} onChange={e=>setN("note",e.target.value)} style={fieldStyle}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={saveNcc} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700}}>Lưu</button>
            <button onClick={()=>{setShowNccForm(false);setEditNcc(null);}} style={{background:"#6b7280",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      {tab==="ncc"&&(
        <>
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            <button onClick={()=>setGroupFilter("all")} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:groupFilter==="all"?"#1e293b":"#f1f5f9",color:groupFilter==="all"?"#fff":"#64748b"}}>Tất cả</button>
            {groups.map(g=>(
              <button key={g.group} onClick={()=>setGroupFilter(g.group)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:groupFilter===g.group?"#1e293b":"#f1f5f9",color:groupFilter===g.group?"#fff":"#64748b"}}>{g.group} ({g.items.length})</button>
            ))}
          </div>
          {visibleGroups.map(g=>(
            <div key={g.group} style={{marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>{g.group}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
                {g.items.map(n=>{
                  const cat=NCC_CAT[n.cat]||NCC_CAT.khac;
                  const catLabel=n.cat==="khac"&&n.customCat?n.customCat:cat.label;
                  const debt=debtByNcc(n.id);
                  return(
                    <div key={n.id} onClick={()=>setSelectedNcc(n)} style={{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.07)",cursor:"pointer",transition:"box-shadow .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)"}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                        <div style={{fontWeight:700,fontSize:14}}>{n.name}</div>
                        {n.contractUrl?<span style={{fontSize:10,background:"#dcfce7",color:"#15803d",borderRadius:5,padding:"1px 6px",fontWeight:600,whiteSpace:"nowrap"}}>📄 Có HĐ</span>:<span style={{fontSize:10,background:"#fee2e2",color:"#dc2626",borderRadius:5,padding:"1px 6px",fontWeight:600,whiteSpace:"nowrap"}}>Thiếu HĐ</span>}
                      </div>
                      <span style={{fontSize:11,background:cat.bg,color:cat.color,borderRadius:6,padding:"2px 8px",fontWeight:500}}>{cat.icon} {catLabel}</span>
                      <div style={{fontSize:12,color:"#64748b",marginTop:8}}>📞 {n.phone||"—"}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,paddingTop:8,borderTop:"1px solid #f1f5f9"}}>
                        <span style={{fontSize:11,color:"#94a3b8"}}>Công nợ</span>
                        <span style={{fontWeight:700,fontSize:13,color:debt>0?"#dc2626":"#16a34a"}}>{fmtMoney(debt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {tab==="bookings"&&(
        <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,.07)",overflow:"hidden"}}>
          {bookings.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48}}>Chưa có booking nào</div>}
          {bookings.map(bk=>{
            const sc=BK_STATUS[bk.status]||BK_STATUS.pending;
            return(
              <div key={bk.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{bk.id} — {bk.nccName||"—"}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{bk.orderId} · {bk.service||""} {bk.pnrCode?"· PNR: "+bk.pnrCode:""} {bk.dueDate?"· "+new Date(bk.dueDate).toLocaleDateString("vi-VN"):""}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:800,color:"#dc2626",fontSize:15}}>{fmtMoney(bk.amount)}</div>
                  {currentRole!=="sale"&&bk.status!=="paid"&&bk.status!=="cancelled"?(
                    <select value={bk.status} onChange={e=>changeBkStatus(bk.id,e.target.value)} style={{fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"2px 6px",marginTop:3}}>
                      <option value="pending">Chờ xác nhận</option><option value="confirmed">Đã xác nhận</option><option value="paid">Đã thanh toán</option><option value="cancelled">Hủy</option>
                    </select>
                  ):(
                    <span style={{fontSize:11,background:sc.bg,color:sc.c,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{sc.label}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
