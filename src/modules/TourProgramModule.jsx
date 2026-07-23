import React from "react";
import { ItineraryEditor, BulletListEditor } from "../components/ItineraryEditor.jsx";
import { NumberInput } from "../components/ui.jsx";

const lbl = { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--c-text-2)" };
const inp = { width: "100%", border: "1px solid var(--c-border)", borderRadius: 8, padding: "9px 12px", fontSize: 13, boxSizing: "border-box" };

function TourProgramForm({ initial, onSave, onCancel, pushNotif }){
  const [form,setForm]=React.useState(initial||{
    name:"",route:"",days:2,nights:1,type:"standard",targetGroup:"",organizer:"Minh Việt Travel",
    highlights:"",note:"",itinerary:[],included:[],excluded:[],priceOptions:[],
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{
    if(!form.name.trim()) return pushNotif&&pushNotif("Nhập tên chương trình","error");
    const prog={...form,id:initial?.id||"TP-"+Date.now(),days:Number(form.days)||2,nights:Number(form.nights)||1};
    onSave(prog);
  };
  const updatePriceOpt=(idx,patch)=>set("priceOptions",(form.priceOptions||[]).map((o,i)=>i===idx?{...o,...patch}:o));
  const addPriceOpt=()=>set("priceOptions",[...(form.priceOptions||[]),{id:"opt"+Date.now(),name:"",adultPrice:0,childPrice:0,babyPrice:0,vatRate:0,note:""}]);
  const removePriceOpt=(idx)=>set("priceOptions",(form.priceOptions||[]).filter((_,i)=>i!==idx));

  return(
    <div style={{background:"var(--c-surface)",borderRadius:14,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
      <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:800}}>{initial?"Sửa chương trình":"Thêm chương trình mới"}</h3>
      <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {[["Tên chương trình *","name"],["Lộ trình","route"],["Nhóm đối tượng","targetGroup"],["Đơn vị tổ chức","organizer"]].map(([label,key])=>(
          <div key={key}>
            <label style={lbl}>{label}</label>
            <input value={form[key]||""} onChange={e=>set(key,e.target.value)} style={inp}/>
          </div>
        ))}
        <div>
          <label style={lbl}>Số ngày</label>
          <input type="number" min={1} value={form.days} onChange={e=>set("days",e.target.value)} style={inp}/>
        </div>
        <div>
          <label style={lbl}>Số đêm</label>
          <input type="number" min={0} value={form.nights} onChange={e=>set("nights",e.target.value)} style={inp}/>
        </div>
        <div>
          <label style={lbl}>Loại tour</label>
          <select value={form.type} onChange={e=>set("type",e.target.value)} style={inp}>
            {["standard","mice_teambuilding","incentive","luxury","family","ghep"].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={{marginTop:12}}>
        <label style={lbl}>Điểm nổi bật</label>
        <textarea value={form.highlights||""} onChange={e=>set("highlights",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
      </div>

      <div style={{marginTop:18,paddingTop:18,borderTop:"1px solid var(--c-border)"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:10,color:"var(--c-text-2)"}}>🗓️ Lịch trình theo ngày</div>
        <ItineraryEditor itinerary={form.itinerary||[]} onChange={v=>set("itinerary",v)}/>
      </div>

      <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginTop:18,paddingTop:18,borderTop:"1px solid var(--c-border)"}}>
        <div>
          <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"var(--c-success-mid)"}}>✅ Bao gồm</div>
          <BulletListEditor items={form.included||[]} onChange={v=>set("included",v)} placeholder="VD: Xe đưa đón đời mới"/>
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"var(--c-danger-mid)"}}>❌ Không bao gồm</div>
          <BulletListEditor items={form.excluded||[]} onChange={v=>set("excluded",v)} placeholder="VD: Chi phí cá nhân"/>
        </div>
      </div>

      <div style={{marginTop:18,paddingTop:18,borderTop:"1px solid var(--c-border)"}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:10,color:"var(--c-text-2)"}}>💰 Phương án giá tham khảo</div>
        {(form.priceOptions||[]).map((opt,idx)=>(
          <div key={opt.id||idx} style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr auto",gap:8,alignItems:"end",marginBottom:8,padding:"10px",background:"var(--c-surface-2)",borderRadius:8}}>
            <div><label style={{...lbl,fontSize:11}}>Tên phương án</label><input value={opt.name||""} onChange={e=>updatePriceOpt(idx,{name:e.target.value})} placeholder="VD: Option 1 — Tiết kiệm" style={inp}/></div>
            <div><label style={{...lbl,fontSize:11}}>Giá NL</label><NumberInput value={opt.adultPrice||0} onChange={v=>updatePriceOpt(idx,{adultPrice:v})} style={inp}/></div>
            <div><label style={{...lbl,fontSize:11}}>Giá TE</label><NumberInput value={opt.childPrice||0} onChange={v=>updatePriceOpt(idx,{childPrice:v})} style={inp}/></div>
            <div><label style={{...lbl,fontSize:11}}>Giá em bé</label><NumberInput value={opt.babyPrice||0} onChange={v=>updatePriceOpt(idx,{babyPrice:v})} style={inp}/></div>
            <button type="button" onClick={()=>removePriceOpt(idx)} style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",border:"none",borderRadius:7,width:32,height:32,cursor:"pointer"}}>✕</button>
          </div>
        ))}
        <button type="button" onClick={addPriceOpt} style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:700,width:"100%"}}>+ Thêm phương án giá</button>
      </div>

      <div style={{marginTop:18}}>
        <label style={lbl}>Ghi chú</label>
        <textarea value={form.note||""} onChange={e=>set("note",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
      </div>
      <div style={{display:"flex",gap:10,marginTop:18}}>
        <button onClick={save} style={{flex:2,background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700}}>Lưu</button>
        <button onClick={onCancel} style={{flex:1,background:"var(--c-surface-3)",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:600}}>Hủy</button>
      </div>
    </div>
  );
}

export default function TourProgramModule({ tourPrograms, onUpdate, currentRole, pushNotif, currentUser }){
  const [search,setSearch]=React.useState("");
  const [showForm,setShowForm]=React.useState(false);
  const [editProg,setEditProg]=React.useState(null);
  const [detail,setDetail]=React.useState(null);

  const canEdit=currentRole==="manager"||currentRole==="dieu_hanh";
  const filtered=(tourPrograms||[]).filter(t=>{
    const q=search.toLowerCase();
    return !q||t.name?.toLowerCase().includes(q)||t.route?.toLowerCase().includes(q);
  });

  const saveProg=(prog)=>{
    if(editProg) onUpdate((tourPrograms||[]).map(t=>t.id===prog.id?prog:t));
    else onUpdate([prog,...(tourPrograms||[])]);
    pushNotif&&pushNotif(editProg?"Đã cập nhật chương trình":"Đã thêm chương trình");
    setShowForm(false); setEditProg(null);
  };

  const deleteProg=(id)=>{
    if(!window.confirm("Xóa chương trình này?")) return;
    onUpdate((tourPrograms||[]).filter(t=>t.id!==id));
    pushNotif&&pushNotif("Đã xóa");
  };

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"đ";

  if(detail) return(
    <div style={{padding:24,maxWidth:800,margin:"0 auto"}}>
      <button onClick={()=>setDetail(null)} style={{background:"none",border:"none",color:"var(--c-primary-mid)",cursor:"pointer",fontSize:14,marginBottom:16}}>← Danh sách</button>
      <div style={{background:"var(--c-surface)",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.08)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"var(--c-purple)",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{detail.type}</div>
            <h2 style={{margin:0,fontSize:18,fontWeight:800}}>{detail.name}</h2>
            <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:4}}>📍 {detail.route} · {detail.days}N{detail.nights}Đ · {detail.targetGroup}</div>
          </div>
          {canEdit&&<button onClick={()=>{setEditProg(detail);setShowForm(true);setDetail(null);}} style={{background:"var(--c-surface-3)",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>✏️ Sửa</button>}
        </div>
        {detail.highlights&&(
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:"var(--c-text-2)"}}>✨ Điểm nổi bật</div>
            <div style={{fontSize:13,color:"var(--c-text-2)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{detail.highlights}</div>
          </div>
        )}

        {(detail.itinerary||[]).length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:"var(--c-text-2)"}}>🗓️ Lịch trình</div>
            {detail.itinerary.map((d,i)=>(
              <div key={i} style={{display:"flex",gap:12,marginBottom:12}}>
                <div style={{width:32,height:32,background:"var(--c-primary-mid)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700,flexShrink:0}}>{d.day}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--c-text)"}}>{d.title}{d.meals?" · "+d.meals:""}</div>
                  <div style={{fontSize:12,color:"var(--c-text-3)",marginTop:2,lineHeight:1.6}}>
                    {(d.activities||[]).map((a,j)=><div key={j}>{a.time&&<strong>{a.time} </strong>}{a.desc}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {((detail.included||[]).length>0||(detail.excluded||[]).length>0)&&(
          <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
            {(detail.included||[]).length>0&&(
              <div>
                <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:"var(--c-success-mid)"}}>✅ Bao gồm</div>
                <div style={{fontSize:13,color:"var(--c-text-2)",lineHeight:1.9}}>{detail.included.map((x,i)=><div key={i}>• {x}</div>)}</div>
              </div>
            )}
            {(detail.excluded||[]).length>0&&(
              <div>
                <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:"var(--c-danger-mid)"}}>❌ Không bao gồm</div>
                <div style={{fontSize:13,color:"var(--c-text-2)",lineHeight:1.9}}>{detail.excluded.map((x,i)=><div key={i}>• {x}</div>)}</div>
              </div>
            )}
          </div>
        )}

        {(detail.priceOptions||[]).length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"var(--c-text-2)"}}>💰 Phương án giá</div>
            <div style={{background:"var(--c-surface-2)",borderRadius:10,overflow:"hidden"}}>
              {detail.priceOptions.map((o,i)=>(
                <div key={o.id||i} style={{padding:"10px 14px",borderTop:i>0?"1px solid var(--c-border)":"none",display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontWeight:600,fontSize:13}}>{o.name}</span>
                  <span style={{fontSize:13,color:"var(--c-primary-mid)",fontWeight:700}}>NL {fmtMoney(o.adultPrice)}{o.childPrice?" · TE "+fmtMoney(o.childPrice):""}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {detail.note&&(
          <div style={{marginBottom:6}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:"var(--c-text-2)"}}>📝 Ghi chú</div>
            <div style={{fontSize:13,color:"var(--c-text-2)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{detail.note}</div>
          </div>
        )}
      </div>
    </div>
  );

  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Chương trình Tour</h2>
          <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:2}}>{(tourPrograms||[]).length} chương trình</div>
        </div>
        {canEdit&&!showForm&&<button onClick={()=>{setEditProg(null);setShowForm(true);}} style={{background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:9,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:14}}>+ Thêm chương trình</button>}
      </div>
      {showForm&&<div style={{marginBottom:20}}><TourProgramForm initial={editProg} onSave={saveProg} onCancel={()=>{setShowForm(false);setEditProg(null);}} pushNotif={pushNotif}/></div>}
      <div style={{position:"relative",marginBottom:16}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--c-text-muted)"}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm tên chương trình, lộ trình..." style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:10,padding:"10px 12px 10px 32px",fontSize:13,boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {filtered.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:48,gridColumn:"1/-1"}}>Chưa có chương trình nào</div>}
        {filtered.map(t=>(
          <div key={t.id} style={{background:"var(--c-surface)",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",cursor:"pointer",transition:"box-shadow .15s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,.07)"}
            onClick={()=>setDetail(t)}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--c-purple)",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{t.type}</div>
            <div style={{fontWeight:800,fontSize:15,marginBottom:4,color:"var(--c-text-2)"}}>{t.name}</div>
            <div style={{fontSize:12,color:"var(--c-text-3)"}}>📍 {t.route||"—"}</div>
            <div style={{fontSize:12,color:"var(--c-text-3)",marginTop:2}}>🕐 {t.days}N{t.nights}Đ · {t.targetGroup||"Tất cả"}</div>
            {(t.itinerary||[]).length>0&&<div style={{fontSize:11,color:"var(--c-primary-mid)",marginTop:4,fontWeight:600}}>🗓️ Đã có lịch trình {t.itinerary.length} ngày</div>}
            {(t.priceOptions||[]).length>0&&<div style={{fontSize:11,color:"var(--c-success-mid)",marginTop:2,fontWeight:600}}>💰 Từ {(Math.min(...t.priceOptions.map(o=>o.adultPrice||Infinity))||0).toLocaleString("vi-VN")}đ/NL</div>}
            {canEdit&&<div style={{display:"flex",gap:6,marginTop:12}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>{setEditProg(t);setShowForm(true);}} style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",border:"none",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Sửa</button>
              <button onClick={()=>deleteProg(t.id)} style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",border:"none",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Xóa</button>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}
