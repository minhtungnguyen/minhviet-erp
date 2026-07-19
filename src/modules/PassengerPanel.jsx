import React from "react";
import { parsePassengersFromFile, downloadPassengerTemplate, exportPassengersToExcel } from "../utils/importExcel.js";

export default function PassengerPanel({order,onUpdate,pushNotif,customers=[]}){
  const EMPTY={name:"",dob:"",cccd:"",cccdImg:"",phone:"",type:"adult",gender:"",nationality:"Việt Nam",note:"",heightGroup:""};
  const TYPE_LABEL={adult:"Người lớn",child_10plus:"Trẻ em 10–18t",child_5to10:"Trẻ em 5–10t",child_2to5:"Trẻ em 2–5t",infant:"Em bé <2t"};
  const TYPE_COLOR={adult:"#185FA5",child_10plus:"#0F6E56",child_5to10:"#854F0B",child_2to5:"#534AB7",infant:"#A32D2D"};
  const TYPE_BG={adult:"#E6F1FB",child_10plus:"#E1F5EE",child_5to10:"#FAEEDA",child_2to5:"#EEE9FF",infant:"#FCEBEB"};
  const CCCD_REQUIRED=["adult","child_10plus"];
  const CCCD_WARN=["child_5to10"];
  const HEIGHT_OPTS=[["","— Không áp dụng"],["under1m","Dưới 1m"],["1to1.4m","1m – 1,4m"],["over1.4m","Trên 1,4m"]];

  const passengers=order?.passengers||[];
  const [panel,setPanel]=React.useState("list"); // "list"|"add"|"import"
  const [editIdx,setEditIdx]=React.useState(null);
  const [form,setForm]=React.useState({...EMPTY});
  const [custSearch,setCustSearch]=React.useState("");
  const [custOpen,setCustOpen]=React.useState(false);
  const [importRows,setImportRows]=React.useState(null); // null | parsed[]
  const [importErr,setImportErr]=React.useState("");
  const [lightbox,setLightbox]=React.useState(null); // base64 or URL to show fullscreen

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const fmtDate=(s)=>s?new Date(s).toLocaleDateString("vi-VN"):"—";

  const suggestType=(dob)=>{
    if(!dob||!order?.departDate) return null;
    const y=(new Date(order.departDate)-new Date(dob))/(365.25*864e5);
    if(y>=18) return "adult";
    if(y>=10) return "child_10plus";
    if(y>=5) return "child_5to10";
    if(y>=2) return "child_2to5";
    return "infant";
  };

  const missingCccdReq=passengers.filter(p=>CCCD_REQUIRED.includes(p.type)&&!p.cccd).length;
  const missingCccdWarn=passengers.filter(p=>CCCD_WARN.includes(p.type)&&!p.cccd).length;
  const missingDob=passengers.filter(p=>!p.dob).length;
  const adults=passengers.filter(p=>p.type==="adult").length;
  const children=passengers.filter(p=>["child_10plus","child_5to10","child_2to5"].includes(p.type)).length;
  const babies=passengers.filter(p=>p.type==="infant").length;

  const custResults=custSearch.trim().length>=1
    ? customers.filter(c=>{
        const q=custSearch.toLowerCase();
        return (c.name||"").toLowerCase().includes(q)||(c.phone||"").includes(q)||(c.cccd||"").includes(q);
      }).slice(0,8)
    : [];

  const fillFromCustomer=(c)=>{
    setForm(f=>({...f,
      name: c.name||f.name,
      phone: c.phone||f.phone,
      cccd: c.cccd||f.cccd,
      dob: c.dob||f.dob,
      gender: c.gender||f.gender,
      nationality: c.nationality||f.nationality||"Việt Nam",
    }));
    setCustSearch("");
    setCustOpen(false);
  };

  const openAdd=()=>{setEditIdx(null);setForm({...EMPTY});setCustSearch("");setCustOpen(false);setPanel("add");};
  const openEdit=(i)=>{setEditIdx(i);setForm({...EMPTY,...passengers[i]});setCustSearch("");setCustOpen(false);setPanel("add");};
  const openFromCustomer=()=>{
    setEditIdx(null);
    setForm({...EMPTY,
      name: order?.customerName||"",
      phone: order?.customerPhone||"",
      cccd: order?.customerCccd||"",
      dob: order?.customerDob||"",
      type: "adult",
    });
    setPanel("add");
  };
  const cancelForm=()=>{setPanel("list");setEditIdx(null);};

  const save=()=>{
    if(!form.name.trim()) return pushNotif&&pushNotif("Nhập họ tên hành khách","error");
    if(CCCD_REQUIRED.includes(form.type)&&!form.cccd.trim()&&!window.confirm("Hành khách "+form.name+" chưa có CCCD/Hộ chiếu — vẫn lưu?")) return;
    const list=[...passengers];
    if(editIdx!==null) list[editIdx]={...form};
    else list.push({...form});
    onUpdate&&onUpdate({...order,passengers:list});
    pushNotif&&pushNotif(editIdx!==null?"Đã cập nhật hành khách":"Đã thêm hành khách");
    setPanel("list");setEditIdx(null);
  };

  const remove=(i)=>{
    if(!window.confirm("Xóa hành khách "+passengers[i].name+"?")) return;
    onUpdate&&onUpdate({...order,passengers:passengers.filter((_,j)=>j!==i)});
    pushNotif&&pushNotif("Đã xóa");
  };

  // CCCD image upload → base64
  const handleCccdUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(file.size>5*1024*1024) return pushNotif&&pushNotif("File tối đa 5MB","error");
    const reader=new FileReader();
    reader.onload=(ev)=>set("cccdImg",ev.target.result);
    reader.readAsDataURL(file);
  };

  // Excel import
  const handleImportFile=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    setImportErr("");
    parsePassengersFromFile(file).then(rows=>{
      setImportRows(rows);
    }).catch(err=>setImportErr("Không đọc được file: "+err.message));
  };

  const confirmImport=()=>{
    if(!importRows) return;
    const valid=importRows.filter(r=>!r._errors?.length).map(({_row,_errors,...r})=>({...EMPTY,...r}));
    if(!valid.length) return pushNotif&&pushNotif("Không có hàng hợp lệ","error");
    onUpdate&&onUpdate({...order,passengers:[...passengers,...valid]});
    pushNotif&&pushNotif("Đã import "+valid.length+" hành khách");
    setImportRows(null);setPanel("list");
  };

  const inp={width:"100%",border:"1px solid #e2e8f0",borderRadius:7,padding:"7px 10px",fontSize:13,boxSizing:"border-box"};

  return(
    <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>

      {/* ── LIGHTBOX ── */}
      {lightbox&&(
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <img src={lightbox} alt="CCCD" style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:8,boxShadow:"0 8px 40px rgba(0,0,0,.5)"}}/>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:20,right:28,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
      )}

      {/* ── HEADER BAR ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:"#1e293b"}}>🪪 Danh sách hành khách ({passengers.length}/{typeof order?.pax==="object"?(order.adultQty||1):( order?.pax||"?")})</div>
          {passengers.length>0&&<div style={{fontSize:12,color:"#64748b",marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
            <span>{adults} NL · {children} TE · {babies} EB</span>
            {missingDob>0&&<span style={{color:"#854F0B",fontWeight:600}}>· {missingDob} thiếu ngày sinh</span>}
            {missingCccdReq>0&&<span style={{color:"#A32D2D",fontWeight:600}}>· {missingCccdReq} thiếu CCCD</span>}
            {missingCccdWarn>0&&<span style={{color:"#854F0B",fontWeight:600}}>· {missingCccdWarn} nên có CCCD</span>}
          </div>}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={openAdd} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ Thêm khách</button>
          {order?.customerName&&<button onClick={openFromCustomer} style={{background:"#f0f9ff",color:"#0369a1",border:"1px solid #bae6fd",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}} title="Điền sẵn từ thông tin người mua">👤 Từ thông tin KH</button>}
          <button onClick={()=>{setPanel("import");setImportRows(null);setImportErr("");}} style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>📥 Import Excel</button>
          <button onClick={downloadPassengerTemplate} style={{background:"#f8fafc",color:"#475569",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>⬇ Tải mẫu Excel</button>
          {passengers.length>0&&<button onClick={()=>exportPassengersToExcel(passengers,order)} style={{background:"#faf5ff",color:"#7c3aed",border:"1px solid #e9d5ff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>📊 Xuất Excel</button>}
        </div>
      </div>

      {(missingCccdReq>0||missingCccdWarn>0||missingDob>0)&&panel==="list"&&(
        <div style={{background:"#fef9c3",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#92400e",fontWeight:600,display:"flex",flexDirection:"column",gap:2}}>
          {missingCccdReq>0&&<span>⚠️ {missingCccdReq} hành khách (NL/TE≥10t) chưa có CCCD/hộ chiếu — bắt buộc bổ sung</span>}
          {missingCccdWarn>0&&<span>📋 {missingCccdWarn} trẻ em 5–10t chưa có CCCD — nên bổ sung (nếu đã làm)</span>}
          {missingDob>0&&<span>📅 {missingDob} hành khách chưa có ngày sinh</span>}
        </div>
      )}

      {/* ── FORM THÊM / SỬA ── */}
      {panel==="add"&&(
        <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #e2e8f0"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:"#1e293b"}}>{editIdx!==null?"✏️ Sửa thông tin hành khách":"➕ Thêm hành khách mới"}</div>
          <div style={{position:"relative",marginBottom:14,paddingBottom:14,borderBottom:"1px dashed #e2e8f0"}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>
              Tìm hành khách từ danh sách khách hàng
              <span style={{fontWeight:400,color:"#94a3b8",marginLeft:4}}>(gõ tên, SĐT hoặc CCCD)</span>
            </label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#0369a1",pointerEvents:"none"}}>🔍</span>
              <input
                value={custSearch}
                onChange={e=>{setCustSearch(e.target.value);setCustOpen(true);}}
                onFocus={()=>setCustOpen(true)}
                onBlur={()=>setTimeout(()=>setCustOpen(false),200)}
                placeholder="VD: Nguyễn Minh Tùng / 0906001359 / 031085..."
                style={{...inp,paddingLeft:30,background:"#f0f9ff",borderColor:"#bae6fd"}}
              />
            </div>
            {custOpen&&custSearch.trim().length>=1&&(
              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #bae6fd",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.12)",zIndex:200,maxHeight:240,overflowY:"auto",marginTop:2}}>
                {custResults.length>0?(
                  custResults.map(c=>(
                    <div key={c.id} onMouseDown={()=>fillFromCustomer(c)}
                      style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
                      onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:"#1e293b"}}>{c.name}</div>
                        <div style={{fontSize:11,color:"#64748b",marginTop:1}}>{[c.phone,c.cccd,c.dob?new Date(c.dob).toLocaleDateString("vi-VN"):""].filter(Boolean).join(" · ")}</div>
                      </div>
                      <span style={{fontSize:11,color:"#0369a1",background:"#e0f2fe",borderRadius:4,padding:"3px 8px",flexShrink:0,marginLeft:8}}>Chọn →</span>
                    </div>
                  ))
                ):(
                  <div style={{padding:"14px 16px",fontSize:12,color:"#94a3b8",display:"flex",flexDirection:"column",gap:4}}>
                    <span>Không tìm thấy trong danh sách khách hàng</span>
                    <span style={{color:"#64748b"}}>Điền thông tin thủ công bên dưới để thêm hành khách mới</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div style={{gridColumn:"1/3"}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Họ và tên *</label>
              <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Nguyễn Văn An" style={inp}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Ngày sinh</label>
              <input type="date" value={form.dob} onChange={e=>{
                set("dob",e.target.value);
                const suggested=suggestType(e.target.value);
                if(suggested&&suggested!==form.type) set("type",suggested);
              }} style={inp}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Loại khách (theo tuổi)</label>
              <select value={form.type} onChange={e=>set("type",e.target.value)} style={inp}>
                <option value="adult">Người lớn (≥18t)</option>
                <option value="child_10plus">Trẻ em 10–18t</option>
                <option value="child_5to10">Trẻ em 5–10t</option>
                <option value="child_2to5">Trẻ em 2–5t</option>
                <option value="infant">Em bé dưới 2t</option>
              </select>
              {form.dob&&suggestType(form.dob)&&suggestType(form.dob)!==form.type&&(
                <div style={{fontSize:10,color:"#854F0B",marginTop:2}}>
                  ⚠️ Theo ngày sinh nên là <b>{TYPE_LABEL[suggestType(form.dob)]}</b>
                  <button onMouseDown={()=>set("type",suggestType(form.dob))} style={{marginLeft:4,fontSize:10,color:"#185FA5",background:"none",border:"none",cursor:"pointer",padding:0,textDecoration:"underline"}}>Áp dụng</button>
                </div>
              )}
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Giới tính</label>
              <select value={form.gender} onChange={e=>set("gender",e.target.value)} style={inp}>
                <option value="">-- Chọn --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Quốc tịch</label>
              <input value={form.nationality} onChange={e=>set("nationality",e.target.value)} placeholder="Việt Nam" style={inp}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Nhóm chiều cao <span style={{fontWeight:400,color:"#94a3b8"}}>(khu vui chơi)</span></label>
              <select value={form.heightGroup||""} onChange={e=>set("heightGroup",e.target.value)} style={inp}>
                {HEIGHT_OPTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>SĐT</label>
              <input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="09xx..." style={inp}/>
            </div>
            <div style={{gridColumn:"1/3"}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Số CCCD / CMND / Hộ chiếu{form.type!=="baby"?" *":""}</label>
              <input value={form.cccd} onChange={e=>set("cccd",e.target.value)} placeholder={form.type==="baby"?"Không bắt buộc":"Nhập số CCCD 12 số hoặc số HC"} style={{...inp,borderColor:form.type!=="baby"&&!form.cccd?"#fca5a5":"#e2e8f0"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Ảnh CCCD / Hộ chiếu</label>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <label style={{display:"inline-flex",alignItems:"center",gap:4,padding:"6px 10px",background:"#eff6ff",color:"#1e3a8a",border:"1px solid #bfdbfe",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,flexShrink:0}}>
                  📎 Upload
                  <input type="file" accept="image/*,.pdf" onChange={handleCccdUpload} style={{display:"none"}}/>
                </label>
                {form.cccdImg&&(form.cccdImg.startsWith("data:")?(
                  <img src={form.cccdImg} alt="CCCD" onClick={()=>setLightbox(form.cccdImg)} style={{height:32,borderRadius:4,cursor:"zoom-in",border:"1px solid #e2e8f0"}}/>
                ):(
                  <a href={form.cccdImg} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#2563eb",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100}}>🔗 Xem ảnh</a>
                ))}
                {form.cccdImg&&<button onClick={()=>set("cccdImg","")} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:11}}>✕</button>}
              </div>
              <div style={{marginTop:4}}>
                <input value={form.cccdImg&&!form.cccdImg.startsWith("data:")?form.cccdImg:""} onChange={e=>set("cccdImg",e.target.value)} placeholder="hoặc dán link Google Drive..." style={{...inp,fontSize:11,padding:"5px 8px"}}/>
              </div>
            </div>
          </div>
          <div style={{marginTop:10}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Ghi chú (ăn chay, dị ứng, yêu cầu đặc biệt...)</label>
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="VD: Ăn chay, dị ứng hải sản, cần xe lăn..." style={inp}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={save} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:7,padding:"8px 20px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ Lưu</button>
            <button onClick={cancelForm} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:7,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      {/* ── IMPORT EXCEL ── */}
      {panel==="import"&&(
        <div style={{background:"#f0fdf4",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #bbf7d0"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"#15803d"}}>📥 Import danh sách hành khách từ Excel</div>
          <div style={{fontSize:12,color:"#166534",marginBottom:10}}>File Excel cần có các cột: <b>Họ tên, Loại, Ngày sinh, CCCD, SĐT, Giới tính, Ghi chú</b>.<br/>
            Loại chấp nhận: "Người lớn" / "Trẻ em" / "Em bé". Ngày sinh định dạng DD/MM/YYYY.
          </div>
          {!importRows?(
            <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",background:"#15803d",color:"#fff",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>
              📂 Chọn file Excel (.xlsx, .xls)
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} style={{display:"none"}}/>
            </label>
          ):(
            <div>
              <div style={{fontWeight:600,fontSize:13,marginBottom:8,color:"#15803d"}}>{importRows.length} dòng đọc được — {importRows.filter(r=>!r._errors?.length).length} hợp lệ · {importRows.filter(r=>r._errors?.length>0).length} lỗi</div>
              <div style={{overflowX:"auto",marginBottom:12}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"#dcfce7"}}>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>Họ tên</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>Loại</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>Ngày sinh</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>CCCD</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>SĐT</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>Trạng thái</th>
                  </tr></thead>
                  <tbody>
                    {importRows.map((r,i)=>(
                      <tr key={i} style={{background:r._errors?.length?"#fef2f2":"#fff",borderBottom:"1px solid #e2e8f0"}}>
                        <td style={{padding:"6px 8px"}}>{r.name||<span style={{color:"#dc2626"}}>—</span>}</td>
                        <td style={{padding:"6px 8px"}}>{TYPE_LABEL[r.type]||r.type}</td>
                        <td style={{padding:"6px 8px"}}>{r.dob?new Date(r.dob).toLocaleDateString("vi-VN"):"—"}</td>
                        <td style={{padding:"6px 8px",fontFamily:"monospace"}}>{r.cccd||"—"}</td>
                        <td style={{padding:"6px 8px"}}>{r.phone||"—"}</td>
                        <td style={{padding:"6px 8px"}}>
                          {r._errors?.length>0?(
                            <span style={{color:"#dc2626",fontSize:11}}>⚠️ {r._errors.join(", ")}</span>
                          ):(
                            <span style={{color:"#16a34a",fontWeight:600}}>✓ OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={confirmImport} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:7,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ Import {importRows.filter(r=>!r._errors?.length).length} hành khách</button>
                <button onClick={()=>{setImportRows(null);}} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:7,padding:"8px 14px",cursor:"pointer",fontSize:13}}>Chọn lại</button>
                <button onClick={()=>{setPanel("list");setImportRows(null);}} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:7,padding:"8px 14px",cursor:"pointer",fontSize:13}}>Hủy</button>
              </div>
            </div>
          )}
          {importErr&&<div style={{color:"#dc2626",fontSize:12,marginTop:8}}>{importErr}</div>}
        </div>
      )}

      {/* ── DANH SÁCH HÀNH KHÁCH ── */}
      {passengers.length===0?(
        <div style={{textAlign:"center",padding:"32px 0",color:"#94a3b8"}}>
          <div style={{fontSize:32,marginBottom:8}}>🧳</div>
          <div style={{fontSize:13}}>Chưa có hành khách nào — nhập tay hoặc import từ Excel</div>
        </div>
      ):(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3,width:28}}>#</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Họ và tên</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Loại</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Ngày sinh</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>CCCD / HC</th>
                <th style={{padding:"8px 10px",textAlign:"center",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Ảnh</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>SĐT</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Ghi chú</th>
                <th style={{padding:"8px 10px",textAlign:"right",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {passengers.map((p,i)=>(
                <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:editIdx===i&&panel==="add"?"#eff6ff":CCCD_REQUIRED.includes(p.type)&&!p.cccd?"#fef2f2":"#fff"}}>
                  <td style={{padding:"10px 10px",color:"#94a3b8",fontSize:12}}>{i+1}</td>
                  <td style={{padding:"10px 10px"}}>
                    <div style={{fontWeight:700,color:"#1e293b"}}>{p.name}</div>
                    {p.gender&&<div style={{fontSize:11,color:"#64748b"}}>{p.gender} · {p.nationality||"VN"}</div>}
                  </td>
                  <td style={{padding:"10px 10px"}}>
                    <span style={{display:"inline-block",background:TYPE_BG[p.type]||"#f1f5f9",color:TYPE_COLOR[p.type]||"#475569",borderRadius:12,padding:"2px 8px",fontSize:11,fontWeight:700}}>{TYPE_LABEL[p.type]||p.type}</span>
                  </td>
                  <td style={{padding:"10px 10px",color:"#475569",fontSize:12}}>{p.dob?fmtDate(p.dob):"—"}</td>
                  <td style={{padding:"10px 10px"}}>
                    {["child_2to5","infant"].includes(p.type)?(
                      <span style={{fontSize:11,color:"#94a3b8"}}>Không bắt buộc</span>
                    ):p.cccd?(
                      <span style={{fontFamily:"monospace",fontSize:12,color:"#1e293b",fontWeight:600}}>{p.cccd}</span>
                    ):CCCD_WARN.includes(p.type)?(
                      <span style={{color:"#854F0B",fontSize:11,fontWeight:600}}>📋 Nên bổ sung</span>
                    ):(
                      <span style={{color:"#A32D2D",fontSize:11,fontWeight:700}}>⚠️ Chưa có</span>
                    )}
                  </td>
                  <td style={{padding:"10px 10px",textAlign:"center"}}>
                    {p.cccdImg?(
                      p.cccdImg.startsWith("data:")?(
                        <img src={p.cccdImg} alt="CCCD" onClick={()=>setLightbox(p.cccdImg)} style={{width:36,height:26,objectFit:"cover",borderRadius:4,cursor:"zoom-in",border:"1px solid #e2e8f0"}}/>
                      ):(
                        <a href={p.cccdImg} target="_blank" rel="noreferrer" title="Xem ảnh CCCD" style={{color:"#2563eb",fontSize:16}}>🖼</a>
                      )
                    ):(
                      <label style={{cursor:"pointer",fontSize:16,opacity:.35}} title="Upload ảnh CCCD">
                        📎
                        <input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{
                          const file=e.target.files?.[0];
                          if(!file) return;
                          if(file.size>5*1024*1024) return pushNotif&&pushNotif("File tối đa 5MB","error");
                          const reader=new FileReader();
                          reader.onload=(ev)=>{
                            const list=[...passengers];
                            list[i]={...list[i],cccdImg:ev.target.result};
                            onUpdate&&onUpdate({...order,passengers:list});
                          };
                          reader.readAsDataURL(file);
                        }}/>
                      </label>
                    )}
                  </td>
                  <td style={{padding:"10px 10px",color:"#475569",fontSize:12}}>{p.phone||"—"}</td>
                  <td style={{padding:"10px 10px",color:"#64748b",fontSize:12,maxWidth:120}}><span title={p.note} style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{p.note||"—"}</span></td>
                  <td style={{padding:"10px 10px",textAlign:"right"}}>
                    <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                      <button onClick={()=>openEdit(i)} style={{background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:5,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600}}>Sửa</button>
                      <button onClick={()=>remove(i)} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:5,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600}}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUMMARY FOOTER ── */}
      {passengers.length>0&&(
        <div style={{marginTop:12,padding:"10px 12px",background:"#f8fafc",borderRadius:8,display:"flex",gap:20,fontSize:12,color:"#64748b",flexWrap:"wrap"}}>
          <span>Tổng: <b style={{color:"#1e293b"}}>{passengers.length}</b> khách</span>
          {adults>0&&<span>Người lớn: <b style={{color:"#2563eb"}}>{adults}</b></span>}
          {children>0&&<span>Trẻ em: <b style={{color:"#d97706"}}>{children}</b></span>}
          {babies>0&&<span>Em bé: <b style={{color:"#7c3aed"}}>{babies}</b></span>}
          {missingCccdReq>0&&<span style={{color:"#dc2626",fontWeight:700}}>⚠️ {missingCccdReq} thiếu CCCD</span>}
          {missingCccdReq===0&&passengers.filter(p=>p.type!=="baby"&&p.type!=="infant").length>0&&<span style={{color:"#16a34a",fontWeight:700}}>✓ Đủ CCCD</span>}
        </div>
      )}
    </div>
  );
}
