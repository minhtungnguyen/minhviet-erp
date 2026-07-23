import React from "react";
import { parsePassengersFromFile, downloadPassengerTemplate, exportPassengersToExcel } from "../utils/importExcel.js";
import { Btn, DateInput } from "../components/ui.jsx";

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

  const inp={width:"100%",border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-sm)",padding:"7px 10px",fontSize:"var(--text-base)",boxSizing:"border-box",background:"var(--c-surface)",color:"var(--c-text)"};

  return(
    <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:20,boxShadow:"var(--sh-sm)"}}>

      {/* ── LIGHTBOX ── */}
      {lightbox&&(
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <img src={lightbox} alt="CCCD" style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:"var(--r-md)",boxShadow:"var(--sh-xl)"}}/>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:20,right:28,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
      )}

      {/* ── HEADER BAR ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontWeight:800,fontSize:"var(--text-lg)",color:"var(--c-text-2)"}}>🪪 Danh sách hành khách ({passengers.length}/{typeof order?.pax==="object"?(order.adultQty||1):( order?.pax||"?")})</div>
          {passengers.length>0&&<div style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)",marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
            <span>{adults} NL · {children} TE · {babies} EB</span>
            {missingDob>0&&<span style={{color:"var(--c-warning)",fontWeight:600}}>· {missingDob} thiếu ngày sinh</span>}
            {missingCccdReq>0&&<span style={{color:"var(--c-danger)",fontWeight:600}}>· {missingCccdReq} thiếu CCCD</span>}
            {missingCccdWarn>0&&<span style={{color:"var(--c-warning)",fontWeight:600}}>· {missingCccdWarn} nên có CCCD</span>}
          </div>}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Btn size="sm" onClick={openAdd}>+ Thêm khách</Btn>
          {order?.customerName&&<Btn size="sm" style={{background:"var(--c-info-bg)",color:"var(--c-info)",border:"1px solid var(--c-info-border)"}} onClick={openFromCustomer} title="Điền sẵn từ thông tin người mua">👤 Từ thông tin KH</Btn>}
          <Btn size="sm" variant="success" style={{background:"var(--c-success-bg)",color:"var(--c-success)",border:"1px solid var(--c-success-border)"}} onClick={()=>{setPanel("import");setImportRows(null);setImportErr("");}}>📥 Import Excel</Btn>
          <Btn size="sm" variant="secondary" onClick={downloadPassengerTemplate}>⬇ Tải mẫu Excel</Btn>
          {passengers.length>0&&<Btn size="sm" style={{background:"var(--c-purple-bg)",color:"var(--c-purple)",border:"1px solid var(--c-purple-border)"}} onClick={()=>exportPassengersToExcel(passengers,order)}>📊 Xuất Excel</Btn>}
        </div>
      </div>

      {(missingCccdReq>0||missingCccdWarn>0||missingDob>0)&&panel==="list"&&(
        <div style={{background:"var(--c-warning-bg)",borderRadius:"var(--r-sm)",padding:"8px 12px",marginBottom:12,fontSize:"var(--text-sm)",color:"var(--c-warning)",fontWeight:600,display:"flex",flexDirection:"column",gap:2}}>
          {missingCccdReq>0&&<span>⚠️ {missingCccdReq} hành khách (NL/TE≥10t) chưa có CCCD/hộ chiếu — bắt buộc bổ sung</span>}
          {missingCccdWarn>0&&<span>📋 {missingCccdWarn} trẻ em 5–10t chưa có CCCD — nên bổ sung (nếu đã làm)</span>}
          {missingDob>0&&<span>📅 {missingDob} hành khách chưa có ngày sinh</span>}
        </div>
      )}

      {/* ── FORM THÊM / SỬA ── */}
      {panel==="add"&&(
        <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-md)",padding:16,marginBottom:16,border:"1px solid var(--c-border)"}}>
          <div style={{fontWeight:700,fontSize:"var(--text-base)",marginBottom:12,color:"var(--c-text-2)"}}>{editIdx!==null?"✏️ Sửa thông tin hành khách":"➕ Thêm hành khách mới"}</div>
          <div style={{position:"relative",marginBottom:14,paddingBottom:14,borderBottom:"1px dashed var(--c-border)"}}>
            <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>
              Tìm hành khách từ danh sách khách hàng
              <span style={{fontWeight:400,color:"var(--c-text-muted)",marginLeft:4}}>(gõ tên, SĐT hoặc CCCD)</span>
            </label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:"var(--text-base)",color:"var(--c-info)",pointerEvents:"none"}}>🔍</span>
              <input
                value={custSearch}
                onChange={e=>{setCustSearch(e.target.value);setCustOpen(true);}}
                onFocus={()=>setCustOpen(true)}
                onBlur={()=>setTimeout(()=>setCustOpen(false),200)}
                placeholder="VD: Nguyễn Minh Tùng / 0906001359 / 031085..."
                style={{...inp,paddingLeft:30,background:"var(--c-info-bg)",borderColor:"var(--c-info-border)"}}
              />
            </div>
            {custOpen&&custSearch.trim().length>=1&&(
              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"var(--c-surface)",border:"1px solid var(--c-info-border)",borderRadius:"var(--r-sm)",boxShadow:"var(--sh-md)",zIndex:200,maxHeight:240,overflowY:"auto",marginTop:2}}>
                {custResults.length>0?(
                  custResults.map(c=>(
                    <div key={c.id} onMouseDown={()=>fillFromCustomer(c)}
                      style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid var(--c-border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--c-info-bg)"}
                      onMouseLeave={e=>e.currentTarget.style.background="var(--c-surface)"}>
                      <div>
                        <div style={{fontWeight:600,fontSize:"var(--text-base)",color:"var(--c-text-2)"}}>{c.name}</div>
                        <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)",marginTop:1}}>{[c.phone,c.cccd,c.dob?new Date(c.dob).toLocaleDateString("vi-VN"):""].filter(Boolean).join(" · ")}</div>
                      </div>
                      <span style={{fontSize:"var(--text-xs)",color:"var(--c-info)",background:"var(--c-info-border)",borderRadius:4,padding:"3px 8px",flexShrink:0,marginLeft:8}}>Chọn →</span>
                    </div>
                  ))
                ):(
                  <div style={{padding:"14px 16px",fontSize:"var(--text-sm)",color:"var(--c-text-muted)",display:"flex",flexDirection:"column",gap:4}}>
                    <span>Không tìm thấy trong danh sách khách hàng</span>
                    <span style={{color:"var(--c-text-3)"}}>Điền thông tin thủ công bên dưới để thêm hành khách mới</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="resp-grid-3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div style={{gridColumn:"1/3"}}>
              <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>Họ và tên *</label>
              <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Nguyễn Văn An" style={inp}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>Ngày sinh</label>
              <DateInput value={form.dob} onChange={v=>{
                set("dob",v);
                const suggested=suggestType(v);
                if(suggested&&suggested!==form.type) set("type",suggested);
              }} style={inp}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>Loại khách (theo tuổi)</label>
              <select value={form.type} onChange={e=>set("type",e.target.value)} style={inp}>
                <option value="adult">Người lớn (≥18t)</option>
                <option value="child_10plus">Trẻ em 10–18t</option>
                <option value="child_5to10">Trẻ em 5–10t</option>
                <option value="child_2to5">Trẻ em 2–5t</option>
                <option value="infant">Em bé dưới 2t</option>
              </select>
              {form.dob&&suggestType(form.dob)&&suggestType(form.dob)!==form.type&&(
                <div style={{fontSize:10,color:"var(--c-warning)",marginTop:2}}>
                  ⚠️ Theo ngày sinh nên là <b>{TYPE_LABEL[suggestType(form.dob)]}</b>
                  <button onMouseDown={()=>set("type",suggestType(form.dob))} style={{marginLeft:4,fontSize:10,color:"var(--c-primary-mid)",background:"none",border:"none",cursor:"pointer",padding:0,textDecoration:"underline"}}>Áp dụng</button>
                </div>
              )}
            </div>
            <div>
              <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>Giới tính</label>
              <select value={form.gender} onChange={e=>set("gender",e.target.value)} style={inp}>
                <option value="">-- Chọn --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>Quốc tịch</label>
              <input value={form.nationality} onChange={e=>set("nationality",e.target.value)} placeholder="Việt Nam" style={inp}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>Nhóm chiều cao <span style={{fontWeight:400,color:"var(--c-text-muted)"}}>(khu vui chơi)</span></label>
              <select value={form.heightGroup||""} onChange={e=>set("heightGroup",e.target.value)} style={inp}>
                {HEIGHT_OPTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>SĐT</label>
              <input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="09xx..." style={inp}/>
            </div>
            <div style={{gridColumn:"1/3"}}>
              <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>Số CCCD / CMND / Hộ chiếu{form.type!=="baby"?" *":""}</label>
              <input value={form.cccd} onChange={e=>set("cccd",e.target.value)} placeholder={form.type==="baby"?"Không bắt buộc":"Nhập số CCCD 12 số hoặc số HC"} style={{...inp,borderColor:form.type!=="baby"&&!form.cccd?"var(--c-danger-border)":"var(--c-border-mid)"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>Ảnh CCCD / Hộ chiếu</label>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <label style={{display:"inline-flex",alignItems:"center",gap:4,padding:"6px 10px",background:"var(--c-primary-light)",color:"var(--c-primary)",border:"1px solid var(--c-primary-pale)",borderRadius:"var(--r-sm)",cursor:"pointer",fontSize:"var(--text-xs)",fontWeight:600,flexShrink:0}}>
                  📎 Upload
                  <input type="file" accept="image/*,.pdf" onChange={handleCccdUpload} style={{display:"none"}}/>
                </label>
                {form.cccdImg&&(form.cccdImg.startsWith("data:")?(
                  <img src={form.cccdImg} alt="CCCD" onClick={()=>setLightbox(form.cccdImg)} style={{height:32,borderRadius:4,cursor:"zoom-in",border:"1px solid var(--c-border)"}}/>
                ):(
                  <a href={form.cccdImg} target="_blank" rel="noreferrer" style={{fontSize:"var(--text-xs)",color:"var(--c-primary-mid)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100}}>🔗 Xem ảnh</a>
                ))}
                {form.cccdImg&&<button onClick={()=>set("cccdImg","")} style={{background:"none",border:"none",color:"var(--c-danger-mid)",cursor:"pointer",fontSize:"var(--text-xs)"}}>✕</button>}
              </div>
              <div style={{marginTop:4}}>
                <input value={form.cccdImg&&!form.cccdImg.startsWith("data:")?form.cccdImg:""} onChange={e=>set("cccdImg",e.target.value)} placeholder="hoặc dán link Google Drive..." style={{...inp,fontSize:"var(--text-xs)",padding:"5px 8px"}}/>
              </div>
            </div>
          </div>
          <div style={{marginTop:10}}>
            <label style={{display:"block",fontSize:"var(--text-xs)",fontWeight:600,marginBottom:3,color:"var(--c-text-2)"}}>Ghi chú (ăn chay, dị ứng, yêu cầu đặc biệt...)</label>
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="VD: Ăn chay, dị ứng hải sản, cần xe lăn..." style={inp}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <Btn variant="success" style={{background:"var(--c-success-mid)",color:"#fff",border:"none"}} onClick={save}>✓ Lưu</Btn>
            <Btn variant="secondary" onClick={cancelForm}>Hủy</Btn>
          </div>
        </div>
      )}

      {/* ── IMPORT EXCEL ── */}
      {panel==="import"&&(
        <div style={{background:"var(--c-success-bg)",borderRadius:"var(--r-md)",padding:16,marginBottom:16,border:"1px solid var(--c-success-border)"}}>
          <div style={{fontWeight:700,fontSize:"var(--text-base)",marginBottom:8,color:"var(--c-success)"}}>📥 Import danh sách hành khách từ Excel</div>
          <div style={{fontSize:"var(--text-sm)",color:"var(--c-success)",marginBottom:10}}>File Excel cần có các cột: <b>Họ tên, Loại, Ngày sinh, CCCD, SĐT, Giới tính, Ghi chú</b>.<br/>
            Loại chấp nhận: "Người lớn" / "Trẻ em" / "Em bé". Ngày sinh định dạng DD/MM/YYYY.
          </div>
          {!importRows?(
            <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",background:"var(--c-success)",color:"#fff",borderRadius:"var(--r-sm)",cursor:"pointer",fontWeight:600,fontSize:"var(--text-base)"}}>
              📂 Chọn file Excel (.xlsx, .xls)
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} style={{display:"none"}}/>
            </label>
          ):(
            <div>
              <div style={{fontWeight:600,fontSize:"var(--text-base)",marginBottom:8,color:"var(--c-success)"}}>{importRows.length} dòng đọc được — {importRows.filter(r=>!r._errors?.length).length} hợp lệ · {importRows.filter(r=>r._errors?.length>0).length} lỗi</div>
              <div style={{overflowX:"auto",marginBottom:12}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"var(--text-sm)"}}>
                  <thead><tr style={{background:"var(--c-success-border)"}}>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid var(--c-success-border)"}}>Họ tên</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid var(--c-success-border)"}}>Loại</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid var(--c-success-border)"}}>Ngày sinh</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid var(--c-success-border)"}}>CCCD</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid var(--c-success-border)"}}>SĐT</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid var(--c-success-border)"}}>Trạng thái</th>
                  </tr></thead>
                  <tbody>
                    {importRows.map((r,i)=>(
                      <tr key={i} style={{background:r._errors?.length?"var(--c-danger-bg)":"var(--c-surface)",borderBottom:"1px solid var(--c-border)"}}>
                        <td style={{padding:"6px 8px"}}>{r.name||<span style={{color:"var(--c-danger-mid)"}}>—</span>}</td>
                        <td style={{padding:"6px 8px"}}>{TYPE_LABEL[r.type]||r.type}</td>
                        <td style={{padding:"6px 8px"}}>{r.dob?new Date(r.dob).toLocaleDateString("vi-VN"):"—"}</td>
                        <td style={{padding:"6px 8px",fontFamily:"var(--font-mono)"}}>{r.cccd||"—"}</td>
                        <td style={{padding:"6px 8px"}}>{r.phone||"—"}</td>
                        <td style={{padding:"6px 8px"}}>
                          {r._errors?.length>0?(
                            <span style={{color:"var(--c-danger-mid)",fontSize:"var(--text-xs)"}}>⚠️ {r._errors.join(", ")}</span>
                          ):(
                            <span style={{color:"var(--c-success-mid)",fontWeight:600}}>✓ OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="success" style={{background:"var(--c-success-mid)",color:"#fff",border:"none"}} onClick={confirmImport}>✓ Import {importRows.filter(r=>!r._errors?.length).length} hành khách</Btn>
                <Btn variant="secondary" onClick={()=>{setImportRows(null);}}>Chọn lại</Btn>
                <Btn variant="secondary" onClick={()=>{setPanel("list");setImportRows(null);}}>Hủy</Btn>
              </div>
            </div>
          )}
          {importErr&&<div style={{color:"var(--c-danger-mid)",fontSize:"var(--text-sm)",marginTop:8}}>{importErr}</div>}
        </div>
      )}

      {/* ── DANH SÁCH HÀNH KHÁCH ── */}
      {passengers.length===0?(
        <div style={{textAlign:"center",padding:"32px 0",color:"var(--c-text-muted)"}}>
          <div style={{fontSize:32,marginBottom:8}}>🧳</div>
          <div style={{fontSize:"var(--text-base)"}}>Chưa có hành khách nào — nhập tay hoặc import từ Excel</div>
        </div>
      ):(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"var(--text-base)"}}>
            <thead>
              <tr style={{background:"var(--c-surface-2)",borderBottom:"2px solid var(--c-border)"}}>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"var(--c-text-3)",fontSize:"var(--text-xs)",textTransform:"uppercase",letterSpacing:.3,width:28}}>#</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"var(--c-text-3)",fontSize:"var(--text-xs)",textTransform:"uppercase",letterSpacing:.3}}>Họ và tên</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"var(--c-text-3)",fontSize:"var(--text-xs)",textTransform:"uppercase",letterSpacing:.3}}>Loại</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"var(--c-text-3)",fontSize:"var(--text-xs)",textTransform:"uppercase",letterSpacing:.3}}>Ngày sinh</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"var(--c-text-3)",fontSize:"var(--text-xs)",textTransform:"uppercase",letterSpacing:.3}}>CCCD / HC</th>
                <th style={{padding:"8px 10px",textAlign:"center",fontWeight:600,color:"var(--c-text-3)",fontSize:"var(--text-xs)",textTransform:"uppercase",letterSpacing:.3}}>Ảnh</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"var(--c-text-3)",fontSize:"var(--text-xs)",textTransform:"uppercase",letterSpacing:.3}}>SĐT</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"var(--c-text-3)",fontSize:"var(--text-xs)",textTransform:"uppercase",letterSpacing:.3}}>Ghi chú</th>
                <th style={{padding:"8px 10px",textAlign:"right",fontWeight:600,color:"var(--c-text-3)",fontSize:"var(--text-xs)",textTransform:"uppercase",letterSpacing:.3}}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {passengers.map((p,i)=>(
                <tr key={i} style={{borderBottom:"1px solid var(--c-border)",background:editIdx===i&&panel==="add"?"var(--c-primary-light)":CCCD_REQUIRED.includes(p.type)&&!p.cccd?"var(--c-danger-bg)":"var(--c-surface)"}}>
                  <td style={{padding:"10px 10px",color:"var(--c-text-muted)",fontSize:"var(--text-sm)"}}>{i+1}</td>
                  <td style={{padding:"10px 10px"}}>
                    <div style={{fontWeight:700,color:"var(--c-text-2)"}}>{p.name}</div>
                    {p.gender&&<div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>{p.gender} · {p.nationality||"VN"}</div>}
                  </td>
                  <td style={{padding:"10px 10px"}}>
                    <span style={{display:"inline-block",background:TYPE_BG[p.type]||"var(--c-surface-2)",color:TYPE_COLOR[p.type]||"var(--c-text-2)",borderRadius:12,padding:"2px 8px",fontSize:"var(--text-xs)",fontWeight:700}}>{TYPE_LABEL[p.type]||p.type}</span>
                  </td>
                  <td style={{padding:"10px 10px",color:"var(--c-text-2)",fontSize:"var(--text-sm)"}}>{p.dob?fmtDate(p.dob):"—"}</td>
                  <td style={{padding:"10px 10px"}}>
                    {["child_2to5","infant"].includes(p.type)?(
                      <span style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)"}}>Không bắt buộc</span>
                    ):p.cccd?(
                      <span style={{fontFamily:"var(--font-mono)",fontSize:"var(--text-sm)",color:"var(--c-text-2)",fontWeight:600}}>{p.cccd}</span>
                    ):CCCD_WARN.includes(p.type)?(
                      <span style={{color:"var(--c-warning)",fontSize:"var(--text-xs)",fontWeight:600}}>📋 Nên bổ sung</span>
                    ):(
                      <span style={{color:"var(--c-danger)",fontSize:"var(--text-xs)",fontWeight:700}}>⚠️ Chưa có</span>
                    )}
                  </td>
                  <td style={{padding:"10px 10px",textAlign:"center"}}>
                    {p.cccdImg?(
                      p.cccdImg.startsWith("data:")?(
                        <img src={p.cccdImg} alt="CCCD" onClick={()=>setLightbox(p.cccdImg)} style={{width:36,height:26,objectFit:"cover",borderRadius:4,cursor:"zoom-in",border:"1px solid var(--c-border)"}}/>
                      ):(
                        <a href={p.cccdImg} target="_blank" rel="noreferrer" title="Xem ảnh CCCD" style={{color:"var(--c-primary-mid)",fontSize:16}}>🖼</a>
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
                  <td style={{padding:"10px 10px",color:"var(--c-text-2)",fontSize:"var(--text-sm)"}}>{p.phone||"—"}</td>
                  <td style={{padding:"10px 10px",color:"var(--c-text-3)",fontSize:"var(--text-sm)",maxWidth:120}}><span title={p.note} style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{p.note||"—"}</span></td>
                  <td style={{padding:"10px 10px",textAlign:"right"}}>
                    <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                      <Btn size="xs" variant="secondary" style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",border:"none"}} onClick={()=>openEdit(i)}>Sửa</Btn>
                      <Btn size="xs" variant="danger" style={{border:"none"}} onClick={()=>remove(i)}>Xóa</Btn>
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
        <div style={{marginTop:12,padding:"10px 12px",background:"var(--c-surface-2)",borderRadius:"var(--r-sm)",display:"flex",gap:20,fontSize:"var(--text-sm)",color:"var(--c-text-3)",flexWrap:"wrap"}}>
          <span>Tổng: <b style={{color:"var(--c-text-2)"}}>{passengers.length}</b> khách</span>
          {adults>0&&<span>Người lớn: <b style={{color:"var(--c-primary-mid)"}}>{adults}</b></span>}
          {children>0&&<span>Trẻ em: <b style={{color:"var(--c-warning-mid)"}}>{children}</b></span>}
          {babies>0&&<span>Em bé: <b style={{color:"var(--c-purple)"}}>{babies}</b></span>}
          {missingCccdReq>0&&<span style={{color:"var(--c-danger-mid)",fontWeight:700}}>⚠️ {missingCccdReq} thiếu CCCD</span>}
          {missingCccdReq===0&&passengers.filter(p=>p.type!=="baby"&&p.type!=="infant").length>0&&<span style={{color:"var(--c-success-mid)",fontWeight:700}}>✓ Đủ CCCD</span>}
        </div>
      )}
    </div>
  );
}
