import React from "react";
import { canSeeTourGhepSensitive } from "../utils/permissions.js";

const TOUR_GHEP_REGIONS = [
  "Đông Bắc Á","Đông Nam Á","Châu Âu","Châu Mỹ",
  "Châu Úc","Trung Đông","Nam Á","Nội địa",
];

function TourGhepProductForm({ initial, onSave, onCancel, suppliers, isClone=false }) {
  const empty = {
    type:"domestic", active:true,
    name:"", destination:"", region:"", duration:"",
    partnerId:"", partnerName:"", partnerCode:"",
    priceType:"fixed",
    buyPrices:  { adult:0, child:0, infant:0 },
    sellPrices: { adult:0, child:0, infant:0 },
    ageLabels:  { adult:"Người lớn", child:"Trẻ em", infant:"Em bé" },
    useSchedule:false, departures:[],
    links: { program:"", images:"", pricelist:"", other:"" },
    includes:"", excludes:"",
    visaRequired:false, visaNote:"",
    typicalSchedule:"", depositPolicy:"", cancelPolicy:"",
    notes:"",
  };
  const [form, setForm] = React.useState(initial ? {
    ...empty, ...initial,
    buyPrices:  { adult:0, child:0, infant:0, ...(initial.buyPrices  || {}) },
    sellPrices: { adult:0, child:0, infant:0, ...(initial.sellPrices || {}) },
    ageLabels:  { ...empty.ageLabels, ...(initial.ageLabels || {}) },
    departures: Array.isArray(initial.departures) ? initial.departures : [],
    links:      { program:"", images:"", pricelist:"", other:"", ...(initial.links || {}) },
  } : empty);

  const set     = (k,v) => setForm(f=>({...f,[k]:v}));
  const setLink = (k,v) => setForm(f=>({...f, links:{...f.links,[k]:v}}));
  const setBuy  = (k,v) => setForm(f=>({...f, buyPrices:{...f.buyPrices,[k]:Number(v)}}));
  const setSell = (k,v) => setForm(f=>({...f, sellPrices:{...f.sellPrices,[k]:Number(v)}}));
  const setAge  = (k,v) => setForm(f=>({...f, ageLabels:{...f.ageLabels,[k]:v}}));
  // Departures (đợt khởi hành theo lịch)
  const addDeparture = () => setForm(f=>({...f, departures:[...(f.departures||[]),
    { id:"dep-"+Date.now(), label:"", dates:"", slots:"",
      sell:{adult:0,child:0,infant:0}, buy:{adult:0,child:0,infant:0}, note:"" }]}));
  const removeDeparture = (id) => setForm(f=>({...f, departures:(f.departures||[]).filter(d=>d.id!==id)}));
  const setDep = (id,k,v) => setForm(f=>({...f, departures:(f.departures||[]).map(d=>d.id===id?{...d,[k]:v}:d)}));
  const setDepPrice = (id,grp,k,v) => setForm(f=>({...f, departures:(f.departures||[]).map(d=>d.id===id?{...d,[grp]:{...d[grp],[k]:Number(v)}}:d)}));

  const lbl = { display:"block", fontSize:12, fontWeight:600, marginBottom:4, color:"var(--c-text-2)" };
  const inp = { width:"100%", border:"0.5px solid var(--c-border)", borderRadius:8, padding:"9px 12px", fontSize:13, boxSizing:"border-box", outline:"none" };
  const th  = { padding:"9px 12px", textAlign:"left", fontSize:11, fontWeight:600, borderBottom:"0.5px solid var(--c-border)", color:"var(--c-text-2)" };
  const td  = { padding:"9px 12px", borderBottom:"0.5px solid var(--c-surface-3)" };
  const secLbl = { gridColumn:"1/-1", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:".7px", color:"var(--c-text-muted)", paddingBottom:6, borderBottom:"0.5px solid var(--c-surface-3)", marginTop:4 };

  return (
    <div style={{ background:"var(--c-surface)", borderRadius:"var(--r-lg)", padding:24, border:"1px solid var(--c-border)", marginBottom:20 }}>
      <h3 style={{ margin:"0 0 20px", fontSize:15, fontWeight:600 }}>
        {isClone ? "Nhân bản sản phẩm — chỉ sửa phần khác biệt" : initial ? "Sửa sản phẩm" : "Thêm sản phẩm tour ghép"}
      </h3>

      <div className="resp-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

        <div style={secLbl}>Thông tin cơ bản</div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Loại tour *</label>
          <div style={{ display:"flex", gap:8 }}>
            {[
              { val:"domestic",      label:"🏔 Quốc nội", color:"var(--c-success)", bg:"var(--c-success-bg)" },
              { val:"international", label:"🌍 Quốc tế",  color:"var(--c-purple)", bg:"var(--c-purple-bg)" },
            ].map(o => (
              <button key={o.val} type="button" onClick={()=>set("type",o.val)}
                style={{ flex:1, padding:"10px 0", borderRadius:8, cursor:"pointer",
                  border:`1.5px solid ${form.type===o.val?o.color:"var(--c-border)"}`,
                  background:form.type===o.val?o.bg:"#fff",
                  fontSize:13, fontWeight:600,
                  color:form.type===o.val?o.color:"var(--c-text-3)" }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Tên tour *</label>
          <input value={form.name} onChange={e=>set("name",e.target.value)}
            placeholder="VD: Nhật Bản Tokyo - Kyoto - Osaka 6N5Đ" style={inp} />
        </div>

        <div>
          <label style={lbl}>Điểm đến *</label>
          <input value={form.destination} onChange={e=>set("destination",e.target.value)}
            placeholder="VD: Nhật Bản, Đà Lạt" style={inp} />
        </div>
        <div>
          <label style={lbl}>Khu vực</label>
          <select value={form.region} onChange={e=>set("region",e.target.value)} style={inp}>
            <option value="">— Chọn khu vực —</option>
            {TOUR_GHEP_REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label style={lbl}>Thời gian</label>
          <input value={form.duration} onChange={e=>set("duration",e.target.value)}
            placeholder="VD: 6N5Đ" style={inp} />
        </div>
        <div>
          <label style={lbl}>Lịch khởi hành thường</label>
          <input value={form.typicalSchedule} onChange={e=>set("typicalSchedule",e.target.value)}
            placeholder="VD: Thứ 6 hàng tuần" style={inp} />
        </div>

        <div style={secLbl}>Đối tác cung cấp</div>

        <div>
          <label style={lbl}>Đối tác / NCC *</label>
          <select value={form.partnerId}
            onChange={e=>{
              const s=(suppliers||[]).find(x=>x.id===e.target.value);
              set("partnerId",e.target.value);
              set("partnerName",s?.name||s?.ten||e.target.options[e.target.selectedIndex]?.text||"");
            }} style={inp}>
            <option value="">— Chọn đối tác —</option>
            {(suppliers||[]).map(s=>(
              <option key={s.id} value={s.id}>{s.name||s.ten}</option>
            ))}
            <option value="__manual">— Nhập tên thủ công —</option>
          </select>
          {(form.partnerId==="__manual"||(!form.partnerId&&form.partnerName))&&(
            <input value={form.partnerName} onChange={e=>set("partnerName",e.target.value)}
              placeholder="Tên đối tác" style={{...inp,marginTop:6}}/>
          )}
        </div>
        <div>
          <label style={lbl}>Mã tour của đối tác</label>
          <input value={form.partnerCode} onChange={e=>set("partnerCode",e.target.value)}
            placeholder="VD: VTR-NB-6N" style={inp} />
        </div>

        <div style={secLbl}>Phân loại độ tuổi (tùy NCC quy định)</div>

        <div className="resp-grid-3" style={{ gridColumn:"1/-1", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <div>
            <label style={lbl}>Nhãn "Người lớn"</label>
            <input value={form.ageLabels.adult} onChange={e=>setAge("adult",e.target.value)}
              placeholder="VD: Người lớn (≥12t)" style={inp} />
          </div>
          <div>
            <label style={lbl}>Nhãn "Trẻ em"</label>
            <input value={form.ageLabels.child} onChange={e=>setAge("child",e.target.value)}
              placeholder="VD: Trẻ em 2-11 tuổi" style={inp} />
          </div>
          <div>
            <label style={lbl}>Nhãn "Em bé"</label>
            <input value={form.ageLabels.infant} onChange={e=>setAge("infant",e.target.value)}
              placeholder="VD: Em bé < 24 tháng" style={inp} />
          </div>
          <div style={{ gridColumn:"1/-1", fontSize:11, color:"var(--c-text-3)", marginTop:-4 }}>
            💡 Mỗi NCC quy định độ tuổi khác nhau — sửa nhãn cho đúng tour này. Nhãn sẽ hiển thị ở bảng giá, báo giá và hợp đồng.
          </div>
        </div>

        <div style={secLbl}>Giá tham khảo</div>

        <div style={{ gridColumn:"1/-1" }}>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {[
              { val:false, label:"Một mức giá", desc:"Tour có 1 bảng giá cố định" },
              { val:true,  label:"Theo lịch khởi hành", desc:"Giá khác nhau theo tháng / ngày đi" },
            ].map(o=>(
              <button key={String(o.val)} type="button" onClick={()=>set("useSchedule",o.val)}
                style={{ flex:1, padding:"10px 14px", borderRadius:8, cursor:"pointer",
                  border:`1.5px solid ${!!form.useSchedule===o.val?"var(--c-primary-mid)":"var(--c-border)"}`,
                  background:!!form.useSchedule===o.val?"var(--c-primary-light)":"#fff", textAlign:"left" }}>
                <div style={{ fontSize:13, fontWeight:600, color:!!form.useSchedule===o.val?"var(--c-primary-mid)":"var(--c-text-2)" }}>{o.label}</div>
                <div style={{ fontSize:11, color:"var(--c-text-3)", marginTop:2 }}>{o.desc}</div>
              </button>
            ))}
          </div>

          {!form.useSchedule ? (
          <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:0, border:"0.5px solid var(--c-border)", borderRadius:10, overflow:"hidden", fontSize:13 }}>
            <thead>
              <tr style={{ background:"var(--c-surface-2)" }}>
                <th style={th}>Loại khách</th>
                <th style={{ ...th, color:"var(--c-danger)" }}>Giá mua (NCC)</th>
                <th style={{ ...th, color:"var(--c-success)" }}>Giá bán (KH)</th>
                <th style={{ ...th, color:"var(--c-warning)" }}>Lãi / suất</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key:"adult",  label:form.ageLabels.adult },
                { key:"child",  label:form.ageLabels.child },
                { key:"infant", label:form.ageLabels.infant },
              ].map(row=>{
                const profit=(form.sellPrices[row.key]||0)-(form.buyPrices[row.key]||0);
                return (
                  <tr key={row.key}>
                    <td style={td}><strong>{row.label}</strong></td>
                    <td style={td}>
                      <input type="number" min={0}
                        value={form.buyPrices[row.key]||""}
                        onChange={e=>setBuy(row.key,e.target.value)}
                        style={{ width:"100%", padding:"7px 10px", borderRadius:6, border:"0.5px solid var(--c-danger-border)", textAlign:"right", fontSize:13, background:"var(--c-danger-bg)", boxSizing:"border-box" }}
                        placeholder="0" />
                    </td>
                    <td style={td}>
                      <input type="number" min={0}
                        value={form.sellPrices[row.key]||""}
                        onChange={e=>setSell(row.key,e.target.value)}
                        style={{ width:"100%", padding:"7px 10px", borderRadius:6, border:"0.5px solid var(--c-success-border)", textAlign:"right", fontSize:13, background:"var(--c-success-bg)", boxSizing:"border-box" }}
                        placeholder="0" />
                    </td>
                    <td style={{ ...td, fontWeight:600, textAlign:"right",
                      color:profit>0?"var(--c-warning)":profit<0?"var(--c-danger)":"var(--c-text-muted)" }}>
                      {profit>0?"+":""}{profit.toLocaleString("vi-VN")}đ
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          ) : (
          <div>
            {(form.departures||[]).length===0&&(
              <div style={{ padding:16, textAlign:"center", color:"var(--c-text-muted)", fontSize:13, border:"1px dashed var(--c-border-mid)", borderRadius:10, marginBottom:10 }}>
                Chưa có đợt khởi hành nào. Bấm "+ Thêm đợt" để khai báo theo tháng/ngày.
              </div>
            )}
            {(form.departures||[]).map((d,idx)=>(
              <div key={d.id} style={{ border:"0.5px solid var(--c-border)", borderRadius:10, padding:14, marginBottom:10, background:"#fafdff" }}>
                <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"flex-end" }}>
                  <div style={{ flex:1.2 }}>
                    <label style={lbl}>Nhãn đợt</label>
                    <input value={d.label} onChange={e=>setDep(d.id,"label",e.target.value)}
                      placeholder="VD: Tháng 7 · hoặc Quốc Khánh" style={inp} />
                  </div>
                  <div style={{ flex:2 }}>
                    <label style={lbl}>Ngày khởi hành</label>
                    <input value={d.dates} onChange={e=>setDep(d.id,"dates",e.target.value)}
                      placeholder="VD: 11, 18, 25/07/2026" style={inp} />
                  </div>
                  <div style={{ flex:.8 }}>
                    <label style={lbl}>Số chỗ</label>
                    <input value={d.slots} onChange={e=>setDep(d.id,"slots",e.target.value)}
                      placeholder="VD: 40" style={inp} />
                  </div>
                  <button type="button" onClick={()=>removeDeparture(d.id)}
                    style={{ background:"var(--c-danger-bg)", color:"var(--c-danger-mid)", border:"0.5px solid var(--c-danger-border)", borderRadius:8, padding:"9px 12px", cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>🗑 Xóa đợt</button>
                </div>
                <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:0, border:"0.5px solid var(--c-border)", borderRadius:8, overflow:"hidden", fontSize:12 }}>
                  <thead><tr style={{ background:"var(--c-surface-3)" }}>
                    <th style={{...th,fontSize:10}}>Loại khách</th>
                    <th style={{...th,fontSize:10,color:"var(--c-danger)"}}>Giá mua</th>
                    <th style={{...th,fontSize:10,color:"var(--c-success)"}}>Giá bán</th>
                  </tr></thead>
                  <tbody>
                    {[{key:"adult",label:form.ageLabels.adult},{key:"child",label:form.ageLabels.child},{key:"infant",label:form.ageLabels.infant}].map(row=>(
                      <tr key={row.key}>
                        <td style={{...td,fontWeight:600}}>{row.label}</td>
                        <td style={td}><input type="number" min={0} value={(d.buy&&d.buy[row.key])||""} onChange={e=>setDepPrice(d.id,"buy",row.key,e.target.value)}
                          style={{ width:"100%", padding:"6px 8px", borderRadius:6, border:"0.5px solid var(--c-danger-border)", textAlign:"right", fontSize:12, background:"var(--c-danger-bg)", boxSizing:"border-box" }} placeholder="0" /></td>
                        <td style={td}><input type="number" min={0} value={(d.sell&&d.sell[row.key])||""} onChange={e=>setDepPrice(d.id,"sell",row.key,e.target.value)}
                          style={{ width:"100%", padding:"6px 8px", borderRadius:6, border:"0.5px solid var(--c-success-border)", textAlign:"right", fontSize:12, background:"var(--c-success-bg)", boxSizing:"border-box" }} placeholder="0" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <input value={d.note||""} onChange={e=>setDep(d.id,"note",e.target.value)}
                  placeholder="Ghi chú đợt (vd: phụ thu lễ, bao gồm gì thêm...)" style={{ ...inp, marginTop:8, fontSize:12 }} />
              </div>
            ))}
            <button type="button" onClick={addDeparture}
              style={{ width:"100%", background:"var(--c-primary-light)", color:"var(--c-primary-mid)", border:"1px dashed var(--c-primary-pale)", borderRadius:8, padding:"10px", cursor:"pointer", fontSize:13, fontWeight:700 }}>
              + Thêm đợt khởi hành
            </button>
          </div>
          )}
        </div>

        <div style={secLbl}>Links tài liệu (Google Drive của đối tác)</div>

        <div style={{ gridColumn:"1/-1" }}>
          <div style={{ padding:"10px 14px", background:"var(--c-primary-light)", borderRadius:8, fontSize:12, color:"var(--c-primary-hover)", marginBottom:10 }}>
            💡 Paste link Google Drive của đối tác — không cần upload file lên server.
          </div>
        </div>

        {[
          { key:"program",   label:"Chương trình hành trình", placeholder:"https://drive.google.com/... (PDF/Word chương trình tour)" },
          { key:"images",    label:"Thư mục ảnh tour",        placeholder:"https://drive.google.com/... (thư mục ảnh)" },
          { key:"pricelist", label:"Bảng giá đối tác",        placeholder:"https://drive.google.com/... (Excel/PDF bảng giá NCC)" },
          { key:"other",     label:"File khác",               placeholder:"https://drive.google.com/... (điều kiện, form đăng ký...)" },
        ].map(l=>(
          <div key={l.key} style={{ gridColumn:"1/-1" }}>
            <label style={lbl}>{l.label}</label>
            <div style={{ display:"flex", gap:8 }}>
              <input value={form.links[l.key]||""}
                onChange={e=>setLink(l.key,e.target.value)}
                placeholder={l.placeholder}
                style={{ ...inp, flex:1,
                  fontFamily:form.links[l.key]?"monospace":"inherit",
                  fontSize:form.links[l.key]?11:13 }} />
              {form.links[l.key]&&(
                <a href={form.links[l.key]} target="_blank" rel="noreferrer"
                  style={{ padding:"9px 14px", borderRadius:8, background:"var(--c-primary-light)",
                    color:"var(--c-primary-mid)", fontSize:12, fontWeight:600,
                    textDecoration:"none", whiteSpace:"nowrap",
                    display:"flex", alignItems:"center", gap:4 }}>
                  ↗ Mở
                </a>
              )}
            </div>
          </div>
        ))}

        <div style={secLbl}>Dịch vụ & Chính sách</div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Bao gồm dịch vụ</label>
          <textarea value={form.includes} onChange={e=>set("includes",e.target.value)}
            rows={2} placeholder="Vé MB, KS 4★, ăn sáng, HDV tiếng Việt..."
            style={{ ...inp, resize:"vertical" }} />
        </div>
        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Không bao gồm</label>
          <textarea value={form.excludes} onChange={e=>set("excludes",e.target.value)}
            rows={2} placeholder="Visa, bữa trưa/tối, chi phí cá nhân..."
            style={{ ...inp, resize:"vertical" }} />
        </div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            <input type="checkbox" checked={form.visaRequired||false}
              onChange={e=>set("visaRequired",e.target.checked)} />
            Tour cần Visa
          </label>
          {form.visaRequired&&(
            <input value={form.visaNote||""} onChange={e=>set("visaNote",e.target.value)}
              placeholder="VD: Visa Nhật tự túc, MV hỗ trợ hồ sơ"
              style={{ ...inp, marginTop:8 }} />
          )}
        </div>

        <div>
          <label style={lbl}>Chính sách cọc với NCC</label>
          <input value={form.depositPolicy||""} onChange={e=>set("depositPolicy",e.target.value)}
            placeholder="VD: Cọc 30% khi booking" style={inp} />
        </div>
        <div>
          <label style={lbl}>Chính sách hủy</label>
          <input value={form.cancelPolicy||""} onChange={e=>set("cancelPolicy",e.target.value)}
            placeholder="VD: Hủy trước 15 ngày hoàn 80%" style={inp} />
        </div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Ghi chú nội bộ</label>
          <textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)}
            rows={2} placeholder="VD: Tour cao cấp, ưu tiên khách VIP..."
            style={{ ...inp, resize:"vertical" }} />
        </div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            <input type="checkbox" checked={form.active!==false}
              onChange={e=>set("active",e.target.checked)} />
            Đang kinh doanh (hiển thị trong danh mục)
          </label>
        </div>

      </div>

      <div style={{ display:"flex", gap:8, marginTop:24 }}>
        <button type="button" onClick={()=>{
          if(!form.name.trim()) { alert("Nhập tên tour"); return; }
          if(!form.partnerId&&!form.partnerName) { alert("Chọn hoặc nhập tên đối tác"); return; }
          const id = (initial?.id && !isClone) || (
            "TG-"+(form.type==="international"?"QT":"QN")+"-"+String(Date.now()).slice(-4)
          );
          onSave({ ...form, id, updatedAt:new Date().toISOString() });
        }}
          style={{ background:"var(--c-success)", color:"#fff", border:"none", borderRadius:8,
            padding:"10px 28px", cursor:"pointer", fontSize:13, fontWeight:600 }}>
          {isClone ? "Tạo bản sao" : initial ? "Lưu thay đổi" : "Thêm sản phẩm"}
        </button>
        <button type="button" onClick={onCancel}
          style={{ background:"var(--c-surface-3)", border:"none", borderRadius:8,
            padding:"10px 20px", cursor:"pointer", fontSize:13 }}>
          Hủy
        </button>
      </div>
    </div>
  );
}

// ── TourGhepProductCard (defined OUTSIDE TourGhepModule) ─────
function TourGhepProductCard({ product:p, onEdit, onClone, onSelect, orderCount, canSeeSecret, canEdit }) {
  const deps = Array.isArray(p.departures) ? p.departures : [];
  const hasSchedule = p.useSchedule && deps.length>0;
  const depSells = deps.map(d=>(d.sell&&d.sell.adult)||0).filter(x=>x>0);
  const depBuys  = deps.map(d=>(d.buy&&d.buy.adult)||0).filter(x=>x>0);
  const dispSell = hasSchedule ? (depSells.length?Math.min(...depSells):0) : (p.sellPrices?.adult||0);
  const dispBuy  = hasSchedule ? (depBuys.length?Math.min(...depBuys):0)  : (p.buyPrices?.adult||0);
  const profit = dispSell-dispBuy;
  const margin = dispSell>0 ? (profit/dispSell*100).toFixed(1) : 0;
  const linkBtn = { display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px",
    borderRadius:6, fontSize:11, fontWeight:500, background:"var(--c-primary-light)",
    color:"var(--c-primary-mid)", textDecoration:"none" };

  return (
    <div style={{ background:"var(--c-surface)", borderRadius:"var(--r-md)",
      border:`1px solid ${p.active?"var(--c-border)":"var(--c-surface-3)"}`,
      opacity:p.active?1:0.6, display:"flex", flexDirection:"column",
      boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>

      <div style={{ height:3, borderRadius:"12px 12px 0 0",
        background:p.type==="international"?"var(--c-purple)":"var(--c-success)" }} />

      <div style={{ padding:"14px 16px", flex:1, display:"flex", flexDirection:"column", gap:10 }}>

        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:".5px",
            textTransform:"uppercase", marginBottom:4,
            color:p.type==="international"?"var(--c-purple)":"var(--c-success)" }}>
            {p.type==="international"?"🌍 Quốc tế":"🏔 Quốc nội"}
            {p.region&&` · ${p.region}`}
          </div>
          <div style={{ fontWeight:600, fontSize:14, color:"var(--c-text)", lineHeight:1.3 }}>
            {p.name}
          </div>
          <div style={{ fontSize:12, color:"var(--c-text-3)", marginTop:2 }}>
            {p.duration}{p.typicalSchedule&&` · ${p.typicalSchedule}`}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
          background:"var(--c-surface-2)", borderRadius:8, fontSize:12 }}>
          <span style={{ fontSize:13, color:"var(--c-text-3)" }}>🏢</span>
          {canSeeSecret
            ? <span><strong>{p.partnerName||"—"}</strong>{p.partnerCode&&<span style={{ color:"var(--c-text-muted)", fontFamily:"monospace", marginLeft:6, fontSize:11 }}>{p.partnerCode}</span>}</span>
            : <span style={{ color:"var(--c-text-muted)", fontStyle:"italic" }}>Đối tác uy tín</span>
          }
        </div>

        <div className="resp-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          {canSeeSecret ? (
            <div style={{ padding:"8px 10px", background:"var(--c-danger-bg)", borderRadius:8, fontSize:11 }}>
              <div style={{ color:"var(--c-text-muted)", marginBottom:2 }}>Giá mua NL{hasSchedule&&" (từ)"}</div>
              <div style={{ fontWeight:600, color:"var(--c-danger)" }}>
                {dispBuy.toLocaleString("vi-VN")}đ
              </div>
            </div>
          ) : (
            <div style={{ padding:"8px 10px", background:"var(--c-surface-2)", borderRadius:8, fontSize:11 }}>
              <div style={{ color:"var(--c-text-muted)", marginBottom:2 }}>Giá vốn</div>
              <div style={{ fontWeight:600, color:"var(--c-text-muted)", letterSpacing:3 }}>••••••</div>
            </div>
          )}
          <div style={{ padding:"8px 10px", background:"var(--c-success-bg)", borderRadius:8, fontSize:11 }}>
            <div style={{ color:"var(--c-text-muted)", marginBottom:2 }}>Giá bán NL{hasSchedule&&" (từ)"}</div>
            <div style={{ fontWeight:600, color:"var(--c-success)" }}>
              {dispSell.toLocaleString("vi-VN")}đ
            </div>
          </div>
        </div>

        {hasSchedule&&(
          <div style={{ background:"var(--c-warning-bg)", border:"0.5px solid var(--c-warning-border)", borderRadius:8, padding:"8px 10px", fontSize:11 }}>
            <div style={{ color:"var(--c-warning)", fontWeight:700, marginBottom:4 }}>📅 Lịch khởi hành ({deps.length} đợt)</div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {deps.slice(0,4).map(d=>(
                <div key={d.id} style={{ color:"var(--c-warning)" }}>
                  <b>{d.label||"Đợt"}</b>{d.dates?`: ${d.dates}`:""}
                </div>
              ))}
              {deps.length>4&&<div style={{ color:"var(--c-warning)" }}>… +{deps.length-4} đợt khác</div>}
            </div>
          </div>
        )}

        {canSeeSecret&&(
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
            <span style={{ color:"var(--c-text-3)" }}>Lãi / suất NL</span>
            <span style={{ fontWeight:700, color: profit>0?"var(--c-warning)":"var(--c-danger)" }}>
              {profit>0?"+":""}{profit.toLocaleString("vi-VN")}đ ({margin}%)
            </span>
          </div>
        )}

        {p.visaRequired&&(
          <div style={{ fontSize:11, color:"var(--c-purple)", background:"var(--c-purple-bg)",
            borderRadius:6, padding:"4px 8px" }}>
            🛂 Visa bắt buộc{p.visaNote&&` · ${p.visaNote}`}
          </div>
        )}

        {(p.links?.program||p.links?.images||p.links?.pricelist)&&(
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {p.links?.program&&(
              <a href={p.links.program} target="_blank" rel="noreferrer" style={linkBtn}>
                📋 Chương trình
              </a>
            )}
            {p.links?.images&&(
              <a href={p.links.images} target="_blank" rel="noreferrer" style={linkBtn}>
                🖼 Ảnh tour
              </a>
            )}
            {canSeeSecret&&p.links?.pricelist&&(
              <a href={p.links.pricelist} target="_blank" rel="noreferrer"
                style={{ ...linkBtn, background:"var(--c-warning-bg)", color:"var(--c-warning)" }}>
                💰 Bảng giá NCC
              </a>
            )}
            {canSeeSecret&&p.links?.other&&(
              <a href={p.links.other} target="_blank" rel="noreferrer"
                style={{ ...linkBtn, background:"var(--c-surface-3)", color:"var(--c-text-2)" }}>
                📎 File khác
              </a>
            )}
          </div>
        )}

        {orderCount>0&&(
          <div style={{ fontSize:11, color:"var(--c-text-3)" }}>Đã bán {orderCount} đơn</div>
        )}

        {p.notes&&(
          <div style={{ fontSize:11, color:"var(--c-warning)", padding:"4px 8px",
            background:"var(--c-warning-bg)", borderRadius:6, borderLeft:"2px solid var(--c-warning-mid)" }}>
            {p.notes}
          </div>
        )}
      </div>

      <div style={{ padding:"10px 16px", borderTop:"0.5px solid var(--c-surface-3)", display:"flex", gap:8 }}>
        <button type="button" onClick={()=>onSelect(p)}
          style={{ flex:1, background:"var(--c-success)", color:"#fff", border:"none",
            borderRadius:8, padding:"8px 0", cursor:"pointer", fontSize:12, fontWeight:600 }}>
          Tạo đơn
        </button>
        {canEdit&&(
          <button type="button" onClick={()=>onClone(p)} title="Tạo bản sao tour này để sửa nhanh"
            style={{ padding:"8px 12px", background:"var(--c-success-bg)",
              border:"0.5px solid var(--c-success-border)", borderRadius:8,
              cursor:"pointer", fontSize:12, color:"var(--c-success)", fontWeight:600 }}>
            ⧉ Nhân bản
          </button>
        )}
        {canEdit&&(
          <button type="button" onClick={()=>onEdit(p)}
            style={{ padding:"8px 14px", background:"var(--c-surface-2)",
              border:"0.5px solid var(--c-border)", borderRadius:8,
              cursor:"pointer", fontSize:12, color:"var(--c-text-2)" }}>
            Sửa
          </button>
        )}
      </div>
    </div>
  );
}

// ── TourGhepModule (main) ────────────────────────────────────
export default function TourGhepModule({ tourGhepProducts=[], onUpdateTourGhepProducts,
                          orders=[], suppliers=[], onCreateOrder,
                          pushNotif, currentRole, currentUser }) {

  const [search,        setSearch]        = React.useState("");
  const [filterType,    setFilterType]    = React.useState("all");
  const [filterPartner, setFilterPartner] = React.useState("");
  const [filterPrice,   setFilterPrice]   = React.useState("");
  const [showInactive,  setShowInactive]  = React.useState(false);
  const [showForm,      setShowForm]      = React.useState(false);
  const [editProduct,   setEditProduct]   = React.useState(null);
  const [cloneMode,     setCloneMode]     = React.useState(false);

  const handleClone = (p) => {
    const { id, createdAt, createdBy, ...rest } = p;
    setEditProduct({ ...rest, name:(p.name||"")+" (bản sao)", active:true });
    setCloneMode(true);
    setShowForm(true);
    if(typeof window!=="undefined") window.scrollTo({top:0,behavior:"smooth"});
  };

  const canSeeSecret = canSeeTourGhepSensitive(currentUser);
  const canEdit      = ["manager","dieu_hanh"].includes(currentRole);

  const filtered = React.useMemo(()=>{
    return (tourGhepProducts||[]).filter(p=>{
      if(!showInactive&&!p.active) return false;
      if(search){
        const q=search.toLowerCase();
        const hay=[p.name,p.destination,p.partnerName,p.partnerCode,p.region].join(" ").toLowerCase();
        if(!hay.includes(q)) return false;
      }
      if(filterType!=="all"&&p.type!==filterType) return false;
      if(filterPartner&&p.partnerName!==filterPartner) return false;
      const price=p.sellPrices?.adult||0;
      if(filterPrice==="under5"  &&price>=5e6)              return false;
      if(filterPrice==="5to15"   &&(price<5e6||price>=15e6)) return false;
      if(filterPrice==="15to30"  &&(price<15e6||price>=30e6))return false;
      if(filterPrice==="over30"  &&price<30e6)               return false;
      return true;
    });
  },[tourGhepProducts,search,filterType,filterPartner,filterPrice,showInactive]);

  const handleSave = (product) => {
    const list = tourGhepProducts||[];
    const exists = list.find(p=>p.id===product.id);
    const updated = exists
      ? list.map(p=>p.id===product.id?product:p)
      : [...list, { ...product, createdAt:new Date().toISOString(), createdBy:currentUser?.username }];
    onUpdateTourGhepProducts(updated);
    setShowForm(false);
    setEditProduct(null);
    pushNotif&&pushNotif(exists?"Đã cập nhật sản phẩm":"Đã thêm sản phẩm "+product.name,"success");
  };

  const handleSelect = (product) => {
    if(onCreateOrder) {
      onCreateOrder({
        service:           "tour_ghep",
        tourGhepProductId: product.id,
        tourType:          product.type,
        tourName:          product.name,
        partnerName:       product.partnerName,
        partnerCode:       product.partnerCode,
        buyPriceAdult:     product.buyPrices?.adult||0,
        buyPriceChild:     product.buyPrices?.child||0,
        buyPriceInfant:    product.buyPrices?.infant||0,
        adultPrice:        product.sellPrices?.adult||0,
        childPrice:        product.sellPrices?.child||0,
        babyPrice:         product.sellPrices?.infant||0,
        visaRequired:      product.visaRequired||false,
        visaNote:          product.visaNote||"",
        includes:          product.includes||"",
        excludes:          product.excludes||"",
        cancelPolicy:      product.cancelPolicy||"",
      });
    }
  };

  const partnerList = [...new Set((tourGhepProducts||[]).map(p=>p.partnerName).filter(Boolean))].sort();

  return (
    <div style={{ padding:24 }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:500, color:"var(--c-text)" }}>Tour Ghép</h2>
          <div style={{ fontSize:13, color:"var(--c-text-3)", marginTop:3 }}>
            {(tourGhepProducts||[]).filter(p=>p.type==="international"&&p.active).length} quốc tế ·{" "}
            {(tourGhepProducts||[]).filter(p=>p.type==="domestic"&&p.active).length} quốc nội ·{" "}
            {(tourGhepProducts||[]).filter(p=>p.active).length} đang kinh doanh
          </div>
        </div>
        {canEdit&&!showForm&&(
          <button type="button" onClick={()=>{setEditProduct(null);setCloneMode(false);setShowForm(true);}}
            style={{ background:"var(--c-success)", color:"#fff", border:"none",
              borderRadius:9, padding:"9px 20px", cursor:"pointer",
              fontWeight:600, fontSize:13 }}>
            + Thêm sản phẩm
          </button>
        )}
      </div>

      {showForm&&(
        <TourGhepProductForm
          initial={editProduct}
          isClone={cloneMode}
          onSave={(prod)=>{handleSave(prod);setCloneMode(false);}}
          onCancel={()=>{setShowForm(false);setEditProduct(null);setCloneMode(false);}}
          suppliers={suppliers}
        />
      )}

      <input placeholder="Tìm tên tour, điểm đến, đối tác, mã tour..."
        value={search} onChange={e=>setSearch(e.target.value)}
        style={{ width:"100%", padding:"10px 14px", borderRadius:10,
          border:"0.5px solid var(--c-border)", fontSize:13, marginBottom:12,
          boxSizing:"border-box", outline:"none" }} />

      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {[
          {val:"all",label:"Tất cả"},
          {val:"international",label:"🌍 Quốc tế"},
          {val:"domestic",label:"🏔 Quốc nội"},
        ].map(f=>(
          <button key={f.val} type="button" onClick={()=>setFilterType(f.val)}
            style={{ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer",
              fontSize:12, fontWeight:600,
              background:filterType===f.val?"var(--c-text)":"var(--c-surface-3)",
              color:filterType===f.val?"#fff":"var(--c-text-3)" }}>
            {f.label}
          </button>
        ))}

        {partnerList.length>0&&(
          <select value={filterPartner} onChange={e=>setFilterPartner(e.target.value)}
            style={{ padding:"6px 12px", borderRadius:20, border:"0.5px solid var(--c-border)",
              fontSize:12, background:"#fff", cursor:"pointer" }}>
            <option value="">Tất cả đối tác</option>
            {partnerList.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        )}

        <select value={filterPrice} onChange={e=>setFilterPrice(e.target.value)}
          style={{ padding:"6px 12px", borderRadius:20, border:"0.5px solid var(--c-border)",
            fontSize:12, background:"#fff", cursor:"pointer" }}>
          <option value="">Mọi mức giá</option>
          <option value="under5">Dưới 5 triệu</option>
          <option value="5to15">5 – 15 triệu</option>
          <option value="15to30">15 – 30 triệu</option>
          <option value="over30">Trên 30 triệu</option>
        </select>

        <button type="button" onClick={()=>setShowInactive(!showInactive)}
          style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
            border:"0.5px solid var(--c-border)", cursor:"pointer",
            background:showInactive?"var(--c-warning-bg)":"#fff",
            color:showInactive?"var(--c-warning)":"var(--c-text-3)" }}>
          {showInactive?"Ẩn tour dừng":"Hiện tour dừng"}
        </button>
      </div>

      {filtered.length===0?(
        <div style={{ textAlign:"center", padding:48, color:"var(--c-text-muted)" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>
            {search||filterPartner||filterPrice||(!(tourGhepProducts||[]).length)
              ?"Không tìm thấy sản phẩm phù hợp"
              :"Chưa có sản phẩm tour ghép"}
          </div>
          {canEdit&&!(tourGhepProducts||[]).length&&(
            <div style={{ fontSize:13, color:"var(--c-text-3)" }}>
              Nhấn "+ Thêm sản phẩm" để bắt đầu xây dựng danh mục
            </div>
          )}
        </div>
      ):(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
          {filtered.map(p=>(
            <TourGhepProductCard
              key={p.id}
              product={p}
              onEdit={(p)=>{setEditProduct(p);setCloneMode(false);setShowForm(true);}}
              onClone={handleClone}
              onSelect={handleSelect}
              orderCount={(orders||[]).filter(o=>o.tourGhepProductId===p.id).length}
              canSeeSecret={canSeeSecret}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
