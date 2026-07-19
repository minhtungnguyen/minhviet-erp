import React from "react";
import { NumberInput } from "../components/ui.jsx";
import { SERVICE_TYPES } from "../constants/serviceTypes.js";
import { canSeeTourGhepSensitive } from "../utils/permissions.js";

export default function QuickSaleForm({onSave,onCancel,customers=[],suppliers=[],currentUser,userAccounts=[],tourGhepProducts=[]}){
  const QUICK_SERVICES = SERVICE_TYPES.filter(s=>["flight","hotel","cruise","ticket","tour_ghep"].includes(s.id));
  const [f,setF] = React.useState({
    service:"flight", customerName:"", customerPhone:"", customerId:"",
    desc:"", departDate:"", guests:1, nccId:"", nccName:"",
    sellTotal:0, costTotal:0, depositAmount:0, sale:currentUser?.name||"",
    tgpId:"", tgpDepId:"",
  });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const profit=(Number(f.sellTotal)||0)-(Number(f.costTotal)||0);
  const [nccSearch,setNccSearch]=React.useState("");

  // Lọc NCC theo loại dịch vụ đang chọn
  const SERVICE_NCC_TYPES={
    flight:["Hàng không"],
    hotel:["Khách sạn","Resort","Villa","Homestay","Farmstay","Bungalow","Nhà nghỉ","Khu sinh thái"],
    cruise:["Du thuyền ngày","Du thuyền đêm"],
    ticket:["Vé tham quan","Vé vui chơi / Giải trí"],
    tour_ghep:["Tour ghép Quốc tế","Tour ghép Nội địa","Landtour Quốc tế","Landtour Nội địa"],
  };
  const filteredSuppliers=React.useMemo(()=>{
    const want=SERVICE_NCC_TYPES[f.service]||[];
    let list=(suppliers||[]);
    const byType=list.filter(s=>{
      const lh=Array.isArray(s.loai_hinh)?s.loai_hinh:(s.loai_hinh?[s.loai_hinh]:[]);
      return lh.some(t=>want.includes(t));
    });
    let base=byType.length?byType:list; // không có NCC khớp loại → hiện tất cả để không bị kẹt
    if(nccSearch.trim()){const q=nccSearch.toLowerCase();base=base.filter(s=>((s.ten||s.name||"")).toLowerCase().includes(q));}
    return base;
  },[suppliers,f.service,nccSearch]);

  const canSeeGhepCost=canSeeTourGhepSensitive(currentUser);
  // Áp giá tour ghép theo sản phẩm + đợt + số khách
  const applyTgp=(prod,depId,guests)=>{
    if(!prod){return;}
    const g=Number(guests)||1;
    const deps=Array.isArray(prod.departures)?prod.departures:[];
    let sell=prod.sellPrices,buy=prod.buyPrices;
    if(prod.useSchedule&&deps.length){
      const d=deps.find(x=>x.id===depId)||deps[0];
      sell=d.sell;buy=d.buy;depId=d.id;
    }
    setF(p=>({...p,
      tgpId:prod.id, tgpDepId:depId||"",
      desc:prod.name||p.desc,
      nccName:prod.partnerName||p.nccName,
      guests:g,
      sellTotal:(sell?.adult||0)*g,
      costTotal:canSeeGhepCost?((buy?.adult||0)*g):0,
    }));
  };
  const selectedTgp=(tourGhepProducts||[]).find(p=>p.id===f.tgpId);

  const staffOptions = React.useMemo(()=>{
    const names = (userAccounts||[]).filter(u=>u.active!==false&&["sale","dieu_hanh","manager","pho_giam_doc"].includes(u.role)).map(u=>u.name);
    if(currentUser?.name&&!names.includes(currentUser.name)) names.unshift(currentUser.name);
    return [...new Set(names)];
  },[userAccounts,currentUser]);

  const suggestions = f.customerName.trim().length>=1 && !f.customerId
    ? (customers||[]).filter(c=>(c.name||"").toLowerCase().includes(f.customerName.toLowerCase())||(c.phone||"").includes(f.customerName)).slice(0,5)
    : [];
  const pickCustomer=(c)=>setF(p=>({...p,customerId:c.id,customerName:c.name,customerPhone:c.phone||""}));

  const DESC_PH={ flight:"VD: Vé HAN-SGN khứ hồi · VN · 05/07", hotel:"VD: KS Vinpearl Phú Quốc · 2 đêm · phòng Deluxe", cruise:"VD: Du thuyền Hạ Long 2N1Đ · cabin Deluxe", ticket:"VD: Vé Sun World Bà Nà · 2 vé" };

  const lbl={display:"block",fontSize:11,fontWeight:700,letterSpacing:.3,marginBottom:5,color:"#64748b",textTransform:"uppercase"};
  const inp={width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box",outline:"none"};

  const save=()=>{
    if(!f.customerName.trim()){alert("Nhập tên khách hàng");return;}
    if(!f.desc.trim()){alert("Nhập mô tả dịch vụ");return;}
    if(!(Number(f.sellTotal)>0)){alert("Nhập giá bán");return;}
    const label=QUICK_SERVICES.find(s=>s.id===f.service)?.label||f.service;
    onSave({
      service:f.service, serviceName:f.desc, serviceLabel:label, tourName:f.desc,
      customerName:f.customerName.trim(), customerPhone:f.customerPhone.trim(), customerId:f.customerId||null,
      adultQty:Number(f.guests)||1, pax:{adult:Number(f.guests)||1},
      totalPrice:Number(f.sellTotal)||0, costPrice:Number(f.costTotal)||0,
      depositAmount:Number(f.depositAmount)||0, sale:f.sale||currentUser?.name,
      departDate:f.departDate||null, nccId:f.nccId||null, nccName:f.nccName||null,
      status:"pending_payment", invoiceType:"no_invoice", customerType:"personal", source:"Bán nhanh",
      ...(f.service==="tour_ghep"&&f.tgpId ? {
        tourGhepProductId:f.tgpId, tourGhepProductName:selectedTgp?.name||f.desc,
        tourGhepDepartureId:f.tgpDepId||null, tourGhepDepartureLabel:(selectedTgp?.departures||[]).find(d=>d.id===f.tgpDepId)?.label||null,
      } : {}),
    });
  };

  return(
    <div style={{padding:24,maxWidth:760,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <i className="ti ti-bolt" style={{fontSize:22,color:"#2563eb"}}/>
        <h2 style={{margin:0,fontSize:20,fontWeight:700}}>Bán nhanh</h2>
        <span style={{marginLeft:"auto",fontSize:12,color:"#94a3b8"}}>1 màn hình · vé bay / khách sạn / du thuyền / vé lẻ</span>
      </div>
      <div style={{fontSize:13,color:"#64748b",marginBottom:18}}>Đơn ít khách, dịch vụ đơn giản. Tour đoàn đông vẫn dùng "Tạo đơn" 3 bước.</div>

      <div style={{background:"#fff",borderRadius:14,padding:22,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
        {/* Chọn loại dịch vụ */}
        <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
          {QUICK_SERVICES.map(s=>{
            const on=f.service===s.id;
            return <button key={s.id} type="button" onClick={()=>{setNccSearch("");setF(p=>({...p,service:s.id,nccId:"",nccName:"",tgpId:"",tgpDepId:""}));}}
              style={{flex:1,minWidth:120,padding:"10px 0",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:600,
                border:`2px solid ${on?"#2563eb":"#e2e8f0"}`,background:on?"#eff6ff":"#fff",color:on?"#1d4ed8":"#64748b"}}>
              {s.icon} {s.label}</button>;
          })}
        </div>

        {/* Khách hàng */}
        <div style={{marginBottom:14,position:"relative"}}>
          <label style={lbl}>Khách hàng (gõ tên/SĐT — gợi ý từ CRM)</label>
          <div style={{display:"flex",gap:8}}>
            <input value={f.customerName} onChange={e=>setF(p=>({...p,customerName:e.target.value,customerId:""}))} placeholder="Nguyễn Văn An" style={{...inp,flex:2}}/>
            <input value={f.customerPhone} onChange={e=>set("customerPhone",e.target.value)} placeholder="0912 345 678" style={{...inp,flex:1}}/>
          </div>
          {suggestions.length>0&&(
            <div style={{position:"absolute",zIndex:20,left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,marginTop:4,boxShadow:"0 4px 14px rgba(0,0,0,.1)",overflow:"hidden"}}>
              {suggestions.map(c=>(
                <div key={c.id} onClick={()=>pickCustomer(c)} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"0.5px solid #f1f5f9"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <b>{c.name}</b> <span style={{color:"#94a3b8"}}>· {c.phone||"—"}</span>
                </div>
              ))}
            </div>
          )}
          {f.customerId&&<div style={{fontSize:11,color:"#16a34a",marginTop:4}}>✓ Khách có sẵn trong CRM</div>}
        </div>

        {/* Chọn sản phẩm Tour ghép (chỉ khi loại = Tour ghép) */}
        {f.service==="tour_ghep"&&(
          <div style={{background:"#f0f9ff",border:"1.5px solid #7dd3fc",borderRadius:10,padding:14,marginBottom:14}}>
            <label style={{...lbl,color:"#0369a1"}}>🔗 Chọn sản phẩm Tour ghép (giá tự tính theo số khách)</label>
            <select value={f.tgpId} onChange={e=>{const prod=(tourGhepProducts||[]).find(x=>x.id===e.target.value);applyTgp(prod,"",f.guests);}} style={inp}>
              <option value="">— Chọn tour ghép —</option>
              {(tourGhepProducts||[]).filter(p=>p.active!==false).map(p=>(
                <option key={p.id} value={p.id}>{p.type==="international"?"🌍":"🏔"} {p.name} · {(p.sellPrices?.adult||0).toLocaleString("vi-VN")}đ/khách</option>
              ))}
            </select>
            {selectedTgp&&selectedTgp.useSchedule&&Array.isArray(selectedTgp.departures)&&selectedTgp.departures.length>0&&(
              <select value={f.tgpDepId} onChange={e=>applyTgp(selectedTgp,e.target.value,f.guests)} style={{...inp,marginTop:8,background:"#fff7ed",border:"1.5px solid #fed7aa"}}>
                {selectedTgp.departures.map(d=>(
                  <option key={d.id} value={d.id}>{(d.label||"Đợt")}{d.dates?` — ${d.dates}`:""}{d.sell?.adult?` · ${(d.sell.adult).toLocaleString("vi-VN")}đ/khách`:""}</option>
                ))}
              </select>
            )}
            {selectedTgp&&<div style={{fontSize:11,color:"#0369a1",marginTop:6}}>💡 Phù hợp khách mua lẻ 2-3 người. Đổi "Số khách" bên dưới, giá tự nhân lại.</div>}
          </div>
        )}

        {/* Mô tả dịch vụ */}
        <div style={{marginBottom:14}}>
          <label style={lbl}>Mô tả dịch vụ *</label>
          <input value={f.desc} onChange={e=>set("desc",e.target.value)} placeholder={DESC_PH[f.service]} style={inp}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={lbl}>Ngày khởi hành/sử dụng</label><input type="date" value={f.departDate} onChange={e=>set("departDate",e.target.value)} style={inp}/></div>
          <div><label style={lbl}>Số khách</label><input type="number" min={1} value={f.guests} onChange={e=>{const g=e.target.value; if(f.service==="tour_ghep"&&selectedTgp){applyTgp(selectedTgp,f.tgpDepId,g);}else{set("guests",g);}}} style={inp}/></div>
          <div>
            <label style={lbl}>Nhà cung cấp <span style={{color:"#94a3b8",fontWeight:400,textTransform:"none"}}>({filteredSuppliers.length})</span></label>
            <input value={nccSearch} onChange={e=>setNccSearch(e.target.value)} placeholder="Tìm NCC…" style={{...inp,marginBottom:6,fontSize:12}}/>
            <select value={f.nccId} onChange={e=>{const s=(suppliers||[]).find(x=>x.id===e.target.value);setF(p=>({...p,nccId:e.target.value,nccName:s?(s.ten||s.name||""):""}));}} style={inp}>
              <option value="">— Chọn NCC —</option>
              {filteredSuppliers.map(s=><option key={s.id} value={s.id}>{s.ten||s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Tiền */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14,alignItems:"end"}}>
          <div><label style={{...lbl,color:"#A32D2D"}}>Tổng giá vốn (NCC)</label><NumberInput value={f.costTotal} onChange={v=>set("costTotal",v)} placeholder="VD: 2.600.000" style={inp}/></div>
          <div><label style={{...lbl,color:"#0F6E56"}}>Tổng giá bán (KH) *</label><NumberInput value={f.sellTotal} onChange={v=>set("sellTotal",v)} placeholder="VD: 3.200.000" style={inp}/></div>
          <div style={{background:profit>=0?"#FAEEDA":"#fee2e2",borderRadius:8,padding:"8px 12px",textAlign:"right"}}>
            <div style={{fontSize:11,color:profit>=0?"#854F0B":"#dc2626",fontWeight:700}}>LÃI TẠM TÍNH</div>
            <div style={{fontSize:17,fontWeight:800,color:profit>=0?"#854F0B":"#dc2626"}}>{profit>=0?"+":""}{profit.toLocaleString("vi-VN")}đ</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div><label style={lbl}>Thu/cọc ngay (tùy chọn)</label><NumberInput value={f.depositAmount} onChange={v=>set("depositAmount",v)} placeholder="VD: 1.000.000" style={inp}/></div>
          <div><label style={lbl}>Phụ trách</label>
            <select value={f.sale} onChange={e=>set("sale",e.target.value)} style={inp}>
              {staffOptions.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button type="button" onClick={save} style={{flex:1,background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",cursor:"pointer",fontSize:14,fontWeight:700}}>
            ✓ Lưu đơn (1 phát xong)
          </button>
          <button type="button" onClick={onCancel} style={{padding:"12px 22px",background:"#f1f5f9",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600}}>Hủy</button>
        </div>
      </div>
    </div>
  );
}
