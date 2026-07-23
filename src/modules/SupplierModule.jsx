import React from "react";
import { NumberInput, Btn, SearchInp, PageHeader, Sel, DateInput } from "../components/ui.jsx";
import { overlayCloseHandlers } from "../utils/modalOverlay.js";

const PROVINCES = [
  "An Giang","Bà Rịa - Vũng Tàu","Bắc Giang","Bắc Kạn","Bạc Liêu",
  "Bắc Ninh","Bến Tre","Bình Định","Bình Dương","Bình Phước","Bình Thuận",
  "Cà Mau","Cần Thơ","Cao Bằng","Đà Nẵng","Đắk Lắk","Đắk Nông","Điện Biên",
  "Đồng Nai","Đồng Tháp","Gia Lai","Hà Giang","Hà Nam","Hà Nội","Hà Tĩnh",
  "Hải Dương","Hải Phòng","Hậu Giang","Hòa Bình","Hưng Yên","Khánh Hòa",
  "Kiên Giang","Kon Tum","Lai Châu","Lâm Đồng","Lạng Sơn","Lào Cai",
  "Long An","Nam Định","Nghệ An","Ninh Bình","Ninh Thuận","Phú Thọ",
  "Phú Yên","Phú Quốc","Quảng Bình","Quảng Nam","Quảng Ngãi","Quảng Ninh",
  "Quảng Trị","Sóc Trăng","Sơn La","Tây Ninh","Thái Bình","Thái Nguyên",
  "Thanh Hóa","Thừa Thiên Huế","Tiền Giang","TP. Hồ Chí Minh","Trà Vinh",
  "Tuyên Quang","Vĩnh Long","Vĩnh Phúc","Yên Bái","Quốc tế"
];

const NCC_SERVICE_TYPES = {
  // Vận chuyển
  HANG_KHONG:      "Hàng không",
  DUONG_BO:        "Đường bộ",
  DUONG_SAT:       "Đường sắt",
  DUONG_THUY:      "Đường thủy",
  TAU_CAO_TOC:     "Tàu cao tốc / Speedboat",
  // Lưu trú
  KHACH_SAN:       "Khách sạn",
  RESORT:          "Resort",
  VILLA:           "Villa",
  HOMESTAY:        "Homestay",
  FARMSTAY:        "Farmstay",
  BUNGALOW:        "Bungalow",
  NHA_NGHI:        "Nhà nghỉ",
  KHU_SINH_THAI:   "Khu sinh thái",
  // Du thuyền
  DU_THUYEN_NGAY:  "Du thuyền ngày",
  DU_THUYEN_DEM:   "Du thuyền đêm",
  // Điểm đến & Dịch vụ
  NHA_HANG:        "Nhà hàng",
  VE_THAM_QUAN:    "Vé tham quan",
  VE_VUI_CHOI:     "Vé vui chơi / Giải trí",
  HUONG_DAN_VIEN:  "Hướng dẫn viên",
  BAO_HIEM:        "Bảo hiểm",
  SPA:             "Spa & Wellness",
  VISA:            "Dịch vụ visa",
  GOLF:            "Golf",
  // Lữ hành / Land tour
  TOUR_GHEP_QT:    "Tour ghép Quốc tế",
  TOUR_GHEP_ND:    "Tour ghép Nội địa",
  LANDTOUR_QT:     "Landtour Quốc tế",
  LANDTOUR_ND:     "Landtour Nội địa",
  KHAC:            "Khác",
};

const NCC_SERVICE_GROUPS = {
  "Vận chuyển":   ["Hàng không","Đường bộ","Đường sắt","Đường thủy","Tàu cao tốc / Speedboat"],
  "Lưu trú":      ["Khách sạn","Resort","Villa","Homestay","Farmstay","Bungalow","Nhà nghỉ","Khu sinh thái"],
  "Du thuyền":    ["Du thuyền ngày","Du thuyền đêm"],
  "Ăn uống":      ["Nhà hàng"],
  "Lữ hành / Land tour": ["Tour ghép Quốc tế","Tour ghép Nội địa","Landtour Quốc tế","Landtour Nội địa"],
  "Dịch vụ":      ["Vé tham quan","Vé vui chơi / Giải trí","Hướng dẫn viên","Bảo hiểm","Spa & Wellness","Dịch vụ visa","Golf","Khác"],
};

const ALL_NCC_SERVICE_TYPES = Object.values(NCC_SERVICE_TYPES);

const BK_STATUS={pending:{bg:"var(--c-warning-bg)",c:"var(--c-warning)",label:"Chưa cọc"},deposit_paid:{bg:"var(--c-primary-light)",c:"var(--c-primary-mid)",label:"Đã cọc — chờ trả nốt"},confirmed:{bg:"var(--c-primary-light)",c:"var(--c-primary-mid)",label:"Đã xác nhận"},paid:{bg:"var(--c-success-bg)",c:"var(--c-success)",label:"Đã thanh toán đủ"},cancelled:{bg:"var(--c-danger-bg)",c:"var(--c-danger-mid)",label:"Đã hủy"}};

function StarRating({ value=0, onChange, size=18 }){
  const [hover,setHover]=React.useState(0);
  return(
    <span style={{display:"inline-flex",gap:2}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} style={{fontSize:size,cursor:onChange?"pointer":"default",color:(hover||value)>=i?"#f59e0b":"#d1d5db",transition:"color .1s"}}
          onMouseEnter={()=>onChange&&setHover(i)} onMouseLeave={()=>onChange&&setHover(0)}
          onClick={()=>onChange&&onChange(i)}>★</span>
      ))}
    </span>
  );
}

function ContractBadge({ status }){
  const MAP={co:{bg:"var(--c-success-bg)",c:"var(--c-success)",label:"Có HĐ"},chua:{bg:"var(--c-danger-bg)",c:"var(--c-danger-mid)",label:"Thiếu HĐ"},het_han:{bg:"var(--c-warning-bg)",c:"var(--c-warning)",label:"Hết hạn"}};
  const s=MAP[status]||MAP.chua;
  return <span style={{background:s.bg,color:s.c,borderRadius:"var(--r-pill)",padding:"3px 10px",fontSize:"var(--text-xs)",fontWeight:700}}>{s.label}</span>;
}

function ServiceTypeBadge({ loai }){
  const colors={"Hàng không":"#dbeafe","Khách sạn":"#fce7f3","Resort":"#fce7f3","Villa":"#fce7f3","Homestay":"#dcfce7","Farmstay":"#dcfce7","Bungalow":"#f0fdf4","Nhà nghỉ":"#f0fdf4","Khu sinh thái":"#dcfce7","Du thuyền ngày":"#ede9fe","Du thuyền đêm":"#ede9fe","Tàu cao tốc / Speedboat":"#e0f2fe","Spa & Wellness":"#fdf4ff","Nhà hàng":"#fef3c7","Vé tham quan":"#ecfdf5","Vé vui chơi / Giải trí":"#fef9c3","Đường bộ":"#fff7ed","Đường thủy":"#e0f2fe","Đường sắt":"#f3f4f6","Hướng dẫn viên":"#f0fdf4","Bảo hiểm":"#eff6ff","Dịch vụ visa":"#f5f3ff","Golf":"#f0fdf4","Khác":"#f8fafc"};
  const textColors={"Hàng không":"#1d4ed8","Khách sạn":"#9d174d","Resort":"#be185d","Villa":"#be185d","Homestay":"#15803d","Farmstay":"#166534","Bungalow":"#14532d","Nhà nghỉ":"#14532d","Khu sinh thái":"#15803d","Du thuyền ngày":"#6d28d9","Du thuyền đêm":"#6d28d9","Tàu cao tốc / Speedboat":"#0369a1","Spa & Wellness":"#7e22ce","Nhà hàng":"#92400e","Vé tham quan":"#065f46","Vé vui chơi / Giải trí":"#713f12","Đường bộ":"#9a3412","Đường thủy":"#075985","Đường sắt":"#374151","Hướng dẫn viên":"#14532d","Bảo hiểm":"#1e40af","Dịch vụ visa":"#4c1d95","Golf":"#14532d","Khác":"#475569"};
  return(
    <span style={{background:colors[loai]||"#f1f5f9",color:textColors[loai]||"#475569",fontSize:11,borderRadius:4,padding:"2px 7px",fontWeight:600,display:"inline-block"}}>{loai}</span>
  );
}

function fmtMoneyK(n){
  if(!n) return "—";
  if(n>=1000000) return (n/1000000).toFixed(n%1000000===0?0:1)+"tr";
  if(n>=1000) return Math.round(n/1000)+"k";
  return n.toLocaleString("vi-VN");
}

function ServiceMetaFields({ loai, meta={}, onChange }){
  const upd=(k,v)=>onChange({...meta,[k]:v});
  const tog=(arr=[],v)=>arr.includes(v)?arr.filter(x=>x!==v):[...arr,v];

  if(["Hàng không"].includes(loai)) return(
    <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Hãng bay</div>
        <input value={meta.hang_bay||""} onChange={e=>upd("hang_bay",e.target.value)} style={inp}/>
      </label>
      <label style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Đường bay</div>
        <input value={meta.duong_bay||""} onChange={e=>upd("duong_bay",e.target.value)} style={inp}/>
      </label>
      <div style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Hạng vé</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
          {["Economy","Business","First","SkyBoss"].map(v=>(
            <label key={v} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,cursor:"pointer"}}>
              <input type="checkbox" checked={(meta.hang_ve||[]).includes(v)} onChange={()=>upd("hang_ve",tog(meta.hang_ve,v))}/>
              {v}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  if(["Khách sạn","Villa","Homestay","Bungalow","Nhà nghỉ"].includes(loai)) return(
    <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Hạng sao</div>
        <StarRating value={meta.hang_sao||0} onChange={v=>upd("hang_sao",v)} size={22}/>
      </div>
      <label>
        <div style={lbl}>Số phòng</div>
        <input type="number" value={meta.so_phong||""} onChange={e=>upd("so_phong",+e.target.value)} style={inp}/>
      </label>
      <div style={{display:"flex",gap:16,alignItems:"center",paddingTop:18}}>
        <label style={{display:"flex",gap:4,alignItems:"center",fontSize:13,cursor:"pointer"}}>
          <input type="checkbox" checked={!!meta.extra_bed} onChange={e=>upd("extra_bed",e.target.checked)}/> Extra bed
        </label>
        <label style={{display:"flex",gap:4,alignItems:"center",fontSize:13,cursor:"pointer"}}>
          <input type="checkbox" checked={!!meta.an_sang} onChange={e=>upd("an_sang",e.target.checked)}/> Ăn sáng
        </label>
      </div>
      <label style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Loại phòng (cách nhau bởi dấu phẩy)</div>
        <input value={(meta.loai_phong||[]).join(",")} onChange={e=>upd("loai_phong",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/>
      </label>
      <label style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Tiện ích (cách nhau bởi dấu phẩy)</div>
        <input value={(meta.tien_ich||[]).join(",")} onChange={e=>upd("tien_ich",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/>
      </label>
    </div>
  );

  if(["Du thuyền ngày","Du thuyền đêm"].includes(loai)) return(
    <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label><div style={lbl}>Tên thuyền</div><input value={meta.ten_thuyen||""} onChange={e=>upd("ten_thuyen",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Hãng thuyền</div><input value={meta.hang_thuyen||""} onChange={e=>upd("hang_thuyen",e.target.value)} style={inp}/></label>
      <label style={{gridColumn:"1/-1"}}><div style={lbl}>Hành trình</div><input value={meta.hanh_trinh||""} onChange={e=>upd("hanh_trinh",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Số cabin</div><input type="number" value={meta.so_cabin||""} onChange={e=>upd("so_cabin",+e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Loại cabin (phẩy phân cách)</div><input value={(meta.loai_cabin||[]).join(",")} onChange={e=>upd("loai_cabin",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
      <label style={{gridColumn:"1/-1"}}><div style={lbl}>Dịch vụ kèm (phẩy phân cách)</div><input value={(meta.dich_vu_kem||[]).join(",")} onChange={e=>upd("dich_vu_kem",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
    </div>
  );

  if(["Nhà hàng"].includes(loai)) return(
    <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label><div style={lbl}>Loại ẩm thực</div><input value={meta.loai_am_thuc||""} onChange={e=>upd("loai_am_thuc",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Sức chứa (khách)</div><input type="number" value={meta.suc_chua_khach||""} onChange={e=>upd("suc_chua_khach",+e.target.value)} style={inp}/></label>
      <label style={{gridColumn:"1/-1"}}><div style={lbl}>Menu set (phẩy phân cách)</div><input value={(meta.menu_set||[]).join(",")} onChange={e=>upd("menu_set",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
    </div>
  );

  if(["Hướng dẫn viên"].includes(loai)) return(
    <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label><div style={lbl}>Ngôn ngữ (phẩy phân cách)</div><input value={(meta.ngon_ngu||[]).join(",")} onChange={e=>upd("ngon_ngu",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
      <label><div style={lbl}>Cấp chứng chỉ</div><input value={meta.cap_chung_chi||""} onChange={e=>upd("cap_chung_chi",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Kinh nghiệm (năm)</div><input type="number" value={meta.kinh_nghiem_nam||""} onChange={e=>upd("kinh_nghiem_nam",+e.target.value)} style={inp}/></label>
    </div>
  );

  return null;
}

const lbl={fontSize:"var(--text-xs)",color:"var(--c-text-3)",marginBottom:3,fontWeight:600};
const inp={width:"100%",border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-sm)",padding:"8px 10px",fontSize:"var(--text-base)",fontFamily:"inherit",boxSizing:"border-box",outline:"none",background:"var(--c-surface)",color:"var(--c-text)"};

function ServiceEntryForm({ entry, onSave, onCancel }){
  const blank={id:"sv-"+Date.now(),loai:"Hàng không",ten_dich_vu:"",khu_vuc:{tinh_thanh:[],vung_mien:"Bắc",loai:"Nội địa"},phan_khuc:"Mid-range",gia_tham_khao:{tu:0,den:0,don_vi:"người",ghi_chu:""},bang_gia_theo_mua:[],mua_cao_diem:"",chinh_sach_huy:"",dieu_kien_booking:"",active:true,meta:{}};
  const [form,setForm]=React.useState(entry||blank);
  const [provinceSearch,setProvinceSearch]=React.useState("");

  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const updKv=(k,sub,v)=>setForm(f=>({...f,[k]:{...f[k],[sub]:v}}));
  const updGia=(sub,v)=>updKv("gia_tham_khao",sub,sub==="tu"||sub==="den"?Number(v):v);
  const togProv=(p)=>{
    const cur=form.khu_vuc.tinh_thanh||[];
    updKv("khu_vuc","tinh_thanh",cur.includes(p)?cur.filter(x=>x!==p):[...cur,p]);
  };

  const addGiaMua=()=>upd("bang_gia_theo_mua",[...(form.bang_gia_theo_mua||[]),{id:"gm-"+Date.now(),ten_giai_doan:"",tu_ngay:"",den_ngay:"",tu:0,den:0,ghi_chu:""}]);
  const updGiaMua=(id,k,v)=>upd("bang_gia_theo_mua",(form.bang_gia_theo_mua||[]).map(g=>g.id===id?{...g,[k]:(k==="tu"||k==="den")?Number(v):v}:g));
  const delGiaMua=(id)=>upd("bang_gia_theo_mua",(form.bang_gia_theo_mua||[]).filter(g=>g.id!==id));

  const filtProv=PROVINCES.filter(p=>!provinceSearch||p.toLowerCase().includes(provinceSearch.toLowerCase()));

  return(
    <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-lg)",padding:16,border:"1px solid var(--c-border)",marginTop:8}}>
      <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <label style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Loại dịch vụ *</div>
          <select value={form.loai} onChange={e=>{upd("loai",e.target.value);upd("meta",{});}} style={{...inp}}>
            {ALL_NCC_SERVICE_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </label>
        <label style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Tên dịch vụ cụ thể *</div>
          <input value={form.ten_dich_vu} onChange={e=>upd("ten_dich_vu",e.target.value)} placeholder="VD: Vietnam Airlines HAN–DAD" style={inp}/>
        </label>
        <label>
          <div style={lbl}>Vùng miền</div>
          <select value={form.khu_vuc.vung_mien} onChange={e=>updKv("khu_vuc","vung_mien",e.target.value)} style={inp}>
            {["Bắc","Trung","Nam","Quốc tế"].map(v=><option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          <div style={lbl}>Nội địa / Quốc tế</div>
          <select value={form.khu_vuc.loai} onChange={e=>updKv("khu_vuc","loai",e.target.value)} style={inp}>
            <option>Nội địa</option><option>Quốc tế</option>
          </select>
        </label>

        <div style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Tỉnh/thành hoạt động</div>
          <input value={provinceSearch} onChange={e=>setProvinceSearch(e.target.value)} placeholder="Tìm tỉnh/thành..." style={{...inp,marginBottom:6}}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,maxHeight:120,overflowY:"auto",background:"var(--c-surface)",borderRadius:"var(--r-md)",border:"1px solid var(--c-border)",padding:8}}>
            {filtProv.map(p=>{
              const sel=(form.khu_vuc.tinh_thanh||[]).includes(p);
              return(
                <button key={p} onClick={()=>togProv(p)} style={{padding:"3px 10px",borderRadius:"var(--r-pill)",border:"1px solid",fontSize:"var(--text-sm)",cursor:"pointer",fontWeight:600,background:sel?"var(--c-primary-mid)":"transparent",color:sel?"#fff":"var(--c-text-3)",borderColor:sel?"var(--c-primary-mid)":"var(--c-border)"}}>
                  {p}
                </button>
              );
            })}
          </div>
          {(form.khu_vuc.tinh_thanh||[]).length>0&&<div style={{fontSize:"var(--text-xs)",color:"var(--c-primary-mid)",marginTop:4}}>Đã chọn: {form.khu_vuc.tinh_thanh.join(", ")}</div>}
        </div>

        <label>
          <div style={lbl}>Phân khúc</div>
          <select value={form.phan_khuc} onChange={e=>upd("phan_khuc",e.target.value)} style={inp}>
            {["Budget","Mid-range","Cao cấp"].map(v=><option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          <div style={lbl}>Đơn vị giá</div>
          <select value={form.gia_tham_khao.don_vi} onChange={e=>updGia("don_vi",e.target.value)} style={inp}>
            {["người","đêm","chuyến","cabin","xe","vé","gói"].map(v=><option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          <div style={lbl}>Giá từ (VNĐ)</div>
          <input type="number" value={form.gia_tham_khao.tu||""} onChange={e=>updGia("tu",e.target.value)} style={inp}/>
        </label>
        <label>
          <div style={lbl}>Giá đến (VNĐ)</div>
          <input type="number" value={form.gia_tham_khao.den||""} onChange={e=>updGia("den",e.target.value)} style={inp}/>
        </label>
        <label style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Ghi chú giá</div>
          <input value={form.gia_tham_khao.ghi_chu||""} onChange={e=>updGia("ghi_chu",e.target.value)} style={inp}/>
        </label>
      </div>

      {/* Bảng giá theo mùa (ngày thường / lễ Tết / cao điểm...) */}
      <div style={{marginTop:12,padding:12,background:"var(--c-surface)",borderRadius:"var(--r-md)",border:"1px solid var(--c-border)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:"var(--text-sm)",color:"var(--c-primary-mid)",fontWeight:700}}>Bảng giá theo mùa (tùy chọn)</div>
          <button type="button" onClick={addGiaMua} style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",border:"1px dashed var(--c-primary-pale)",borderRadius:"var(--r-sm)",padding:"4px 12px",cursor:"pointer",fontSize:"var(--text-xs)",fontWeight:700}}>+ Thêm giai đoạn</button>
        </div>
        <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)",marginBottom:(form.bang_gia_theo_mua||[]).length?8:0}}>
          Giá gốc phía trên áp dụng ngày thường. Thêm giai đoạn riêng nếu có giá khác cho lễ Tết / mùa cao điểm.
        </div>
        {(form.bang_gia_theo_mua||[]).map(g=>(
          <div key={g.id} style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr 1fr 1fr auto",gap:8,alignItems:"end",marginBottom:8,padding:"8px",background:"var(--c-surface-2)",borderRadius:"var(--r-sm)"}}>
            <label><div style={lbl}>Tên giai đoạn</div><input value={g.ten_giai_doan} onChange={e=>updGiaMua(g.id,"ten_giai_doan",e.target.value)} placeholder="VD: Tết Nguyên Đán" style={inp}/></label>
            <label><div style={lbl}>Từ ngày</div><DateInput value={g.tu_ngay} onChange={v=>updGiaMua(g.id,"tu_ngay",v)} style={inp}/></label>
            <label><div style={lbl}>Đến ngày</div><DateInput value={g.den_ngay} onChange={v=>updGiaMua(g.id,"den_ngay",v)} style={inp}/></label>
            <label><div style={lbl}>Giá từ</div><input type="number" value={g.tu||""} onChange={e=>updGiaMua(g.id,"tu",e.target.value)} style={inp}/></label>
            <label><div style={lbl}>Giá đến</div><input type="number" value={g.den||""} onChange={e=>updGiaMua(g.id,"den",e.target.value)} style={inp}/></label>
            <button type="button" onClick={()=>delGiaMua(g.id)} style={{background:"var(--c-surface)",color:"var(--c-danger-mid)",border:"1px solid var(--c-danger-border)",borderRadius:"var(--r-xs)",padding:"8px 10px",cursor:"pointer",fontSize:"var(--text-sm)"}}>🗑</button>
          </div>
        ))}
      </div>

      <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
        <label>
          <div style={lbl}>Mùa cao điểm</div>
          <input value={form.mua_cao_diem||""} onChange={e=>upd("mua_cao_diem",e.target.value)} style={inp}/>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:8,paddingTop:18}}>
          <input type="checkbox" checked={form.active} onChange={e=>upd("active",e.target.checked)}/>
          <span style={{fontSize:13,fontWeight:600}}>Đang hoạt động</span>
        </label>
        <label style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Chính sách hủy</div>
          <textarea value={form.chinh_sach_huy||""} onChange={e=>upd("chinh_sach_huy",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
        </label>
        <label style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Điều kiện booking</div>
          <textarea value={form.dieu_kien_booking||""} onChange={e=>upd("dieu_kien_booking",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
        </label>
      </div>

      {/* Dynamic meta fields */}
      {["Hàng không","Khách sạn","Villa","Homestay","Bungalow","Nhà nghỉ","Du thuyền ngày","Du thuyền đêm","Nhà hàng","Hướng dẫn viên"].includes(form.loai)&&(
        <div style={{marginTop:12,padding:12,background:"var(--c-surface)",borderRadius:"var(--r-md)",border:"1px solid var(--c-border)"}}>
          <div style={{fontSize:"var(--text-sm)",color:"var(--c-primary-mid)",fontWeight:700,marginBottom:8}}>Chi tiết theo loại — {form.loai}</div>
          <ServiceMetaFields loai={form.loai} meta={form.meta||{}} onChange={m=>upd("meta",m)}/>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onCancel}>Hủy</Btn>
        <Btn onClick={()=>onSave(form)}>Lưu dịch vụ</Btn>
      </div>
    </div>
  );
}

function QuickFindModal({ suppliers, onClose, onSelect }){
  const [q,setQ]=React.useState("");
  const ref=React.useRef(null);
  React.useEffect(()=>{ ref.current?.focus(); },[]);

  const scored=React.useMemo(()=>{
    if(!q.trim()) return suppliers.slice(0,8).map(s=>({s,matches:[]}));
    const lq=q.toLowerCase();
    const results=[];
    suppliers.forEach(sup=>{
      const matches=[];
      let score=0;
      if(sup.ten.toLowerCase().includes(lq)){score+=10;matches.push("name");}
      sup.dich_vu.filter(d=>d.active).forEach(d=>{
        if(d.loai.toLowerCase().includes(lq)){score+=5;matches.push("loai");}
        if((d.khu_vuc.tinh_thanh||[]).some(p=>p.toLowerCase().includes(lq))){score+=4;matches.push("kv");}
        if(d.phan_khuc.toLowerCase().includes(lq)){score+=3;matches.push("phk");}
        if(d.ten_dich_vu.toLowerCase().includes(lq)){score+=3;matches.push("tdv");}
        if(d.meta?.hang_sao){
          const starMatch=lq.match(/(\d)\s*sao/);
          if(starMatch&&+starMatch[1]===d.meta.hang_sao){score+=6;matches.push("star");}
        }
        Object.entries(NCC_SERVICE_GROUPS).forEach(([group,types])=>{
          if(group.toLowerCase().includes(lq)&&types.includes(d.loai)){score+=4;matches.push("group");}
        });
      });
      if(score>0) results.push({s:sup,score,matches});
    });
    return results.sort((a,b)=>b.score-a.score).slice(0,8);
  },[q,suppliers]);

  const fmtM=(n)=>{const a=Math.abs(n||0),s=(n||0)<0?"-":"";if(a>=1e9)return s+(a/1e9).toFixed(1)+"tỷ";return s+Math.round(a).toLocaleString("vi-VN")+"đ";};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80}} {...overlayCloseHandlers(onClose)}>
      <div style={{background:"var(--c-surface)",borderRadius:"var(--r-xl)",width:"100%",maxWidth:560,boxShadow:"var(--sh-modal)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid var(--c-border)",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🔍</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Tìm NCC: nhập tên, loại dịch vụ, tỉnh thành, phân khúc, 3 sao..."
            style={{flex:1,border:"none",outline:"none",fontSize:"var(--text-lg)",fontFamily:"inherit",background:"transparent",color:"var(--c-text)"}}/>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--c-text-muted)",fontSize:20}}>✕</button>
        </div>
        <div style={{maxHeight:420,overflowY:"auto"}}>
          {scored.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:32}}>Không tìm thấy NCC phù hợp</div>}
          {scored.map(({s})=>{
            const activeSvs=s.dich_vu.filter(d=>d.active);
            return(
              <div key={s.id} style={{padding:"14px 16px",borderBottom:"1px solid var(--c-border)",cursor:"pointer",transition:"background var(--t-fast)"}}
                onMouseEnter={ev=>ev.currentTarget.style.background="var(--c-surface-2)"}
                onMouseLeave={ev=>ev.currentTarget.style.background=""}
                onClick={()=>onSelect(s)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:"var(--text-md)",color:"var(--c-text)"}}>{s.ten}</span>
                  <ContractBadge status={s.trang_thai_hop_dong}/>
                </div>
                {activeSvs.slice(0,3).map(d=>(
                  <div key={d.id} style={{display:"flex",gap:8,alignItems:"center",marginTop:3}}>
                    <ServiceTypeBadge loai={d.loai}/>
                    {d.meta?.hang_sao>0&&<StarRating value={d.meta.hang_sao} size={12}/>}
                    <span style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)"}}>{d.phan_khuc} · {(d.khu_vuc.tinh_thanh||[]).slice(0,3).join(", ")}</span>
                    <span style={{fontSize:"var(--text-sm)",color:"var(--c-success-mid)",marginLeft:"auto",fontWeight:700}}>
                      {d.gia_tham_khao.tu>0&&fmtM(d.gia_tham_khao.tu)+"–"+fmtM(d.gia_tham_khao.den)+"/"+d.gia_tham_khao.don_vi}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{padding:"8px 16px",background:"var(--c-surface-2)",fontSize:"var(--text-xs)",color:"var(--c-text-muted)",textAlign:"center"}}>Nhấn Enter để chọn · Esc để đóng · Ctrl+K để mở</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUPPLIER MODULE (replaces NCCDashboard)
// ══════════════════════════════════════════════════════════════

export default function SupplierModule({ suppliers=[], onAddSupplier, onUpdateSupplier, onDeleteSupplier, orders=[], vouchers=[], expenses=[], pushNotif, currentRole, currentUser, bookings:bookingsProp=[], onSaveBooking, onCreateExpense, prefillOrderId, onPrefillConsumed }){
  // --- State ---
  const [tab,setTab]=React.useState("suppliers");
  const [search,setSearch]=React.useState("");
  const [filterGroup,setFilterGroup]=React.useState("all");
  const [filterProv,setFilterProv]=React.useState("");
  const [filterPhanKhuc,setFilterPhanKhuc]=React.useState("all");
  const [filterSao,setFilterSao]=React.useState("all");
  const [filterHD,setFilterHD]=React.useState("all");
  const [selected,setSelected]=React.useState(null);
  const [editMode,setEditMode]=React.useState(false);
  const [showAdd,setShowAdd]=React.useState(false);
  const [editingSv,setEditingSv]=React.useState(null); // null | "new" | serviceEntry id
  const [expandedSv,setExpandedSv]=React.useState({});
  const [showQuickFind,setShowQuickFind]=React.useState(false);
  const bookings=bookingsProp||[];

  // Booking state — 1 đơn hàng (đặc biệt Tour trọn gói) thường cần NHIỀU booking,
  // mỗi booking là 1 NCC phụ trách 1 hạng mục riêng (khách sạn, xe, du thuyền...),
  // nên KHÔNG tự điền tên/tiền của cả đơn vào 1 booking — mỗi booking tự khai báo
  // dịch vụ + tổng tiền + tiền cọc riêng của chính nó.
  const [showBkForm,setShowBkForm]=React.useState(false);
  const blankBkForm=()=>({orderId:"",nccId:"",nccName:"",serviceType:"",serviceName:"",totalNet:"",deposit:"",pnrCode:"",timeLimit:"",note:""});
  const [bkForm,setBkForm]=React.useState(blankBkForm());

  // Mở sẵn form tạo booking cho đúng đơn khi được điều hướng tới từ
  // "Chưa booking NCC" ở Chi tiết đơn hàng — chỉ điền sẵn đơn hàng, KHÔNG điền
  // sẵn tên dịch vụ/số tiền vì đơn có thể cần nhiều booking khác nhau.
  React.useEffect(()=>{
    if(!prefillOrderId) return;
    const o=orders.find(x=>x.id===prefillOrderId);
    setTab("bookings");
    setShowBkForm(true);
    setBkForm(f=>({...blankBkForm(), orderId:prefillOrderId}));
    if(!o) pushNotif&&pushNotif("Không tìm thấy đơn "+prefillOrderId,"error");
    onPrefillConsumed&&onPrefillConsumed();
  },[prefillOrderId]);

  React.useEffect(()=>{
    const handler=(e)=>{if((e.ctrlKey||e.metaKey)&&e.key==="k"){e.preventDefault();setShowQuickFind(v=>!v);}if(e.key==="Escape")setShowQuickFind(false);};
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";

  // ── Form state for add/edit NCC ──
  const blankNcc=()=>({
    ma_ncc:"NCC-"+(String(suppliers.length+1).padStart(3,"0")),
    ten:"",loai_hinh:[],khu_vuc_hoat_dong:[],
    sdt:"",email:"",nguoi_lien_he:"",
    ma_so_thue:"",dia_chi:"",hop_dong_file:"",hop_dong_ten:"",
    tai_khoan_ngan_hang:{ngan_hang:"",so_tk:"",chu_tk:""},
    cong_no:0,trang_thai_hop_dong:"chua",nguoi_phu_trach:"",
    danh_gia_noi_bo:3,ghi_chu_uu_tien:"",dich_vu:[],
  });
  const [form,setForm]=React.useState(blankNcc());
  const updF=(k,v)=>setForm(f=>({...f,[k]:v}));
  const updBank=(k,v)=>setForm(f=>({...f,tai_khoan_ngan_hang:{...f.tai_khoan_ngan_hang,[k]:v}}));

  // Load selected into form when editing
  React.useEffect(()=>{
    if(selected&&editMode) setForm({...selected});
  },[selected,editMode]);

  // ── Filter logic ──
  const filteredSuppliers=React.useMemo(()=>{
    const lq=search.toLowerCase();
    return suppliers.filter(s=>{
      if(lq&&!s.ten.toLowerCase().includes(lq)&&!s.ma_ncc.toLowerCase().includes(lq)&&!(s.nguoi_lien_he||"").toLowerCase().includes(lq)&&!(s.sdt||"").includes(lq)) return false;
      if(filterHD!=="all"&&s.trang_thai_hop_dong!==filterHD) return false;

      const activeDv=s.dich_vu.filter(d=>d.active);
      if(filterGroup!=="all"){
        // filterGroup có thể là tên loai_hinh cụ thể (vd "Hàng không") hoặc nhóm (vd "Vận chuyển")
        const groupTypes=NCC_SERVICE_GROUPS[filterGroup]||[filterGroup];
        const matchLoaiHinh=(s.loai_hinh||[]).some(l=>groupTypes.includes(l)||l===filterGroup);
        const matchDvLoai=activeDv.some(d=>groupTypes.includes(d.loai)||d.loai===filterGroup);
        if(!matchLoaiHinh&&!matchDvLoai) return false;
      }
      if(filterProv){
        const dvMatch=activeDv.some(d=>(d.khu_vuc.tinh_thanh||[]).includes(filterProv));
        const nccMatch=(s.khu_vuc_hoat_dong||[]).includes(filterProv);
        if(!dvMatch&&!nccMatch) return false;
      }
      if(filterPhanKhuc!=="all"){
        if(!activeDv.some(d=>d.phan_khuc===filterPhanKhuc)) return false;
      }
      if(filterSao!=="all"){
        const sao=+filterSao;
        if(!activeDv.some(d=>d.meta?.hang_sao===sao)) return false;
      }
      return true;
    });
  },[suppliers,search,filterGroup,filterProv,filterPhanKhuc,filterSao,filterHD]);

  const totalDebt=suppliers.reduce((s,n)=>s+(n.cong_no||0),0);

  // ── Save NCC ──
  const saveNcc=()=>{
    if(!form.ten.trim()) return pushNotif&&pushNotif("Nhập tên NCC","error");
    const kv=[...new Set(form.dich_vu.flatMap(d=>d.khu_vuc?.tinh_thanh||[]))];
    const loaiHinh=[...new Set(form.dich_vu.map(d=>d.loai))];
    const ncc={...form,khu_vuc_hoat_dong:kv.length?kv:form.khu_vuc_hoat_dong,loai_hinh:loaiHinh.length?loaiHinh:form.loai_hinh};
    if(selected&&editMode){ onUpdateSupplier&&onUpdateSupplier(selected.id,ncc);setSelected({...selected,...ncc,updated_at:new Date().toISOString()}); }
    else { onAddSupplier&&onAddSupplier(ncc); }
    setEditMode(false); setShowAdd(false); setEditingSv(null);
    pushNotif&&pushNotif(editMode?"Đã cập nhật NCC "+ncc.ten:"Đã thêm NCC "+ncc.ten,"success");
  };

  const deleteNcc=(s)=>{
    if(s.cong_no>0) return pushNotif&&pushNotif("Không thể xóa: còn công nợ "+fmtMoney(s.cong_no),"error");
    const hasActive=bookings.some(b=>b.nccId===s.id&&!["cancelled","paid"].includes(b.status));
    if(hasActive) return pushNotif&&pushNotif("Không thể xóa: còn booking đang active","error");
    onDeleteSupplier&&onDeleteSupplier(s.id);
    if(selected?.id===s.id){setSelected(null);setEditMode(false);}
    pushNotif&&pushNotif("Đã xóa NCC "+s.ten,"success");
  };

  // ── Service entry helpers ──
  const saveSv=(sv)=>{
    const existing=form.dich_vu.find(d=>d.id===sv.id);
    const updated=existing?form.dich_vu.map(d=>d.id===sv.id?sv:d):[...form.dich_vu,sv];
    setForm(f=>({...f,dich_vu:updated}));
    setEditingSv(null);
  };
  const deleteSv=(id)=>setForm(f=>({...f,dich_vu:f.dich_vu.filter(d=>d.id!==id)}));
  const togSvExpand=(id)=>setExpandedSv(p=>({...p,[id]:!p[id]}));

  // ── Booking save — 1 booking = 1 NCC phụ trách 1 hạng mục của đơn.
  // Tạo booking chỉ phát sinh phiếu chi cho phần CỌC (không phải toàn bộ totalNet),
  // khớp cách trả tiền NCC ngoài thực tế: cọc giữ chỗ trước, trả nốt phần còn lại sau.
  const saveBooking=()=>{
    const nccId=bkForm.nccId;
    const sup=suppliers.find(s=>s.id===nccId);
    const totalNet=Number(bkForm.totalNet)||0;
    const deposit=Number(bkForm.deposit)||0;
    const bk={
      id:"BK"+String(Date.now()).slice(-4),
      orderId:bkForm.orderId,
      nccId,
      nccName:bkForm.nccName||sup?.name||sup?.ten||nccId,
      serviceType:bkForm.serviceType,
      serviceName:bkForm.serviceName,
      totalNet, deposit, remaining:Math.max(0,totalNet-deposit), depositPaid:false,
      pnrCode:bkForm.pnrCode,
      timeLimit:bkForm.timeLimit,
      note:bkForm.note,
      status:"pending",
      payments:[],
      createdBy:currentUser?.name||"",
      createdAt:new Date().toISOString(),
    };
    onSaveBooking&&onSaveBooking(bk);
    if(onCreateExpense&&deposit>0){
      onCreateExpense({id:"EXP"+Date.now(),orderId:bkForm.orderId,type:"chi",amount:deposit,paymentType:"deposit",note:"Cọc NCC: "+(bk.nccName)+" - "+bk.serviceName,status:"pending_kt",method:"transfer",createdBy:currentUser?.name,createdAt:new Date().toISOString(),nccName:bk.nccName,nccId,bookingId:bk.id});
    }
    setBkForm(blankBkForm());
    setShowBkForm(false);
    pushNotif&&pushNotif("Đã tạo booking "+bk.id+(deposit>0?" — phiếu chi cọc đã gửi kế toán duyệt":""),"success");
  };

  const updateBkStatus=(id,status)=>{const b=bookings.find(x=>x.id===id);if(b)onSaveBooking&&onSaveBooking({...b,status});};

  // Thanh toán phần còn lại (sau khi đã cọc) — tạo phiếu chi riêng cho đúng phần remaining
  const payRemaining=(b)=>{
    if(!(b.remaining>0)) return;
    if(onCreateExpense){
      onCreateExpense({id:"EXP"+Date.now(),orderId:b.orderId,type:"chi",amount:b.remaining,paymentType:"remaining",note:"Trả nốt NCC: "+(b.nccName)+" - "+b.serviceName,status:"pending_kt",method:"transfer",createdBy:currentUser?.name,createdAt:new Date().toISOString(),nccName:b.nccName,nccId:b.nccId,bookingId:b.id});
    }
    pushNotif&&pushNotif("Đã gửi phiếu chi phần còn lại của "+b.id+" cho kế toán duyệt","success");
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  const showLuuTruFilter=filterGroup==="all"||filterGroup==="Lưu trú";

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      {showQuickFind&&<QuickFindModal suppliers={suppliers} onClose={()=>setShowQuickFind(false)} onSelect={s=>{setSelected(s);setShowQuickFind(false);setTab("suppliers");}}/>}

      {/* Header */}
      <div style={{padding:"var(--sp-4) var(--sp-6)",borderBottom:"1px solid var(--c-border)",background:"var(--c-surface)",display:"flex",alignItems:"center",gap:"var(--sp-3)",flexWrap:"wrap"}}>
        <div>
          <h2 style={{margin:0,fontSize:"var(--text-2xl)",fontWeight:"var(--fw-black)",color:"var(--c-text)"}}>Nhà cung cấp (NCC)</h2>
          <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)",marginTop:1}}>{suppliers.length} NCC · Tổng công nợ: <strong style={{color:totalDebt>0?"var(--c-danger-mid)":"var(--c-success-mid)"}}>{fmtMoney(totalDebt)}</strong></div>
        </div>
        <div style={{flex:1}}/>
        <Btn variant="secondary" onClick={()=>setShowQuickFind(true)}>
          🔍 Tìm nhanh <kbd style={{background:"var(--c-border)",borderRadius:"var(--r-xs)",padding:"1px 5px",fontSize:"var(--text-xs)"}}>Ctrl+K</kbd>
        </Btn>
        <Btn onClick={()=>{setShowAdd(true);setSelected(null);setEditMode(false);setForm(blankNcc());setEditingSv(null);}}>+ Thêm NCC</Btn>
        <Btn style={{background:"var(--c-purple)"}} onClick={()=>{setTab("bookings");setShowBkForm(true);}}>+ Tạo booking</Btn>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,padding:"var(--sp-2-5) var(--sp-6) 0",background:"var(--c-surface)",borderBottom:"1px solid var(--c-border)"}}>
        {[["suppliers","Danh sách NCC",suppliers.length],["bookings","Booking",bookings.length]].map(([k,label,cnt])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 18px",borderRadius:"var(--r-md) var(--r-md) 0 0",border:"1px solid",borderBottom:"none",cursor:"pointer",fontWeight:600,fontSize:"var(--text-base)",background:tab===k?"var(--c-surface)":"var(--c-surface-2)",borderColor:tab===k?"var(--c-border)":"transparent",color:tab===k?"var(--c-text)":"var(--c-text-3)",marginBottom:tab===k?-1:0}}>
            {label} {cnt>0&&<span style={{background:"var(--c-border)",color:"var(--c-text-2)",borderRadius:"var(--r-pill)",padding:"0 6px",fontSize:"var(--text-xs)",marginLeft:4}}>{cnt}</span>}
          </button>
        ))}
      </div>

      {/* ══ SUPPLIERS TAB ══ */}
      {tab==="suppliers"&&(
        <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>

          {/* Left panel — search + list — thu nhỏ khi có NCC được chọn */}
          <div style={{width:selected||showAdd?"340px":"100%",minWidth:selected||showAdd?"280px":"100%",flexShrink:0,borderRight:selected||showAdd?"1px solid var(--c-border)":"none",display:"flex",flexDirection:"column",background:"var(--c-bg)",transition:"width .3s ease"}}>
            {/* Search */}
            <div style={{padding:"12px 12px 0"}}>
              <SearchInp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm tên, mã, SĐT, người LH..." style={{borderRadius:"var(--r-sm)"}}/>
            </div>

            {/* Filters */}
            <div style={{padding:"10px 12px",borderBottom:"1px solid var(--c-border)",display:"flex",flexDirection:"column",gap:6}}>
              {/* Tab lĩnh vực — mỗi loai_hinh = 1 tab riêng, không nhóm */}
              {(()=>{
                // Lấy tất cả loai_hinh unique theo đúng thứ tự trong NCC_SERVICE_TYPES
                const orderedTypes = Object.values(NCC_SERVICE_TYPES);
                const allLoaiHinh = orderedTypes.filter(t=>
                  (suppliers||[]).some(s=>(s.loai_hinh||[]).includes(t))
                );
                // Màu theo loại — cố ý dùng nhiều hue riêng biệt để phân biệt ~25 loại dịch vụ, không map vào token chung
                const TAG_COLOR = {
                  "Hàng không":"#1d4ed8","Đường bộ":"#9a3412","Đường sắt":"#374151","Đường thủy":"#075985","Tàu cao tốc / Speedboat":"#0369a1",
                  "Khách sạn":"#9d174d","Resort":"#be185d","Villa":"#be185d","Homestay":"#15803d","Farmstay":"#166534","Bungalow":"#14532d","Nhà nghỉ":"#14532d","Khu sinh thái":"#15803d",
                  "Du thuyền ngày":"#6d28d9","Du thuyền đêm":"#4c1d95",
                  "Nhà hàng":"#92400e","Vé tham quan":"#065f46","Vé vui chơi / Giải trí":"#713f12",
                  "Hướng dẫn viên":"#14532d","Bảo hiểm":"#1e40af","Spa & Wellness":"#7e22ce","Dịch vụ visa":"#4c1d95","Golf":"#166534","Khác":"#475569",
                };
                return(
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    <button onClick={()=>setFilterGroup("all")}
                      style={{padding:"5px 14px",borderRadius:"var(--r-pill)",border:"1.5px solid",fontSize:"var(--text-sm)",cursor:"pointer",fontWeight:700,
                        background:filterGroup==="all"?"var(--c-text)":"transparent",
                        color:filterGroup==="all"?"#fff":"var(--c-text-3)",
                        borderColor:filterGroup==="all"?"var(--c-text)":"var(--c-border)"}}>
                      Tất cả · {(suppliers||[]).length}
                    </button>
                    {allLoaiHinh.map(lh=>{
                      const isActive=filterGroup===lh;
                      const count=(suppliers||[]).filter(s=>(s.loai_hinh||[]).includes(lh)).length;
                      const c=TAG_COLOR[lh]||"#475569";
                      return(
                        <button key={lh} onClick={()=>setFilterGroup(isActive?"all":lh)}
                          style={{padding:"5px 12px",borderRadius:"var(--r-pill)",border:`1.5px solid ${isActive?c:c+"55"}`,fontSize:"var(--text-sm)",cursor:"pointer",fontWeight:600,
                            background:isActive?c:"transparent",
                            color:isActive?"#fff":c,
                            display:"flex",alignItems:"center",gap:5,transition:"all .15s"}}>
                          <span>{lh}</span>
                          <span style={{background:isActive?"rgba(255,255,255,.3)":"rgba(0,0,0,.1)",borderRadius:"var(--r-pill)",padding:"1px 6px",fontSize:"var(--text-2xs)",fontWeight:700}}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {/* Row 2 */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <select value={filterProv} onChange={e=>setFilterProv(e.target.value)} style={{border:"1px solid var(--c-border)",borderRadius:"var(--r-xs)",padding:"4px 8px",fontSize:"var(--text-sm)",fontFamily:"inherit",background:"var(--c-surface)",color:"var(--c-text-2)"}}>
                  <option value="">Khu vực (tất cả)</option>
                  {PROVINCES.map(p=><option key={p}>{p}</option>)}
                </select>
                <select value={filterPhanKhuc} onChange={e=>setFilterPhanKhuc(e.target.value)} style={{border:"1px solid var(--c-border)",borderRadius:"var(--r-xs)",padding:"4px 8px",fontSize:"var(--text-sm)",fontFamily:"inherit",background:"var(--c-surface)",color:"var(--c-text-2)"}}>
                  <option value="all">Phân khúc</option>
                  {["Budget","Mid-range","Cao cấp"].map(v=><option key={v}>{v}</option>)}
                </select>
                <select value={filterHD} onChange={e=>setFilterHD(e.target.value)} style={{border:"1px solid var(--c-border)",borderRadius:"var(--r-xs)",padding:"4px 8px",fontSize:"var(--text-sm)",fontFamily:"inherit",background:"var(--c-surface)",color:"var(--c-text-2)"}}>
                  <option value="all">Hợp đồng</option>
                  <option value="co">Có HĐ</option>
                  <option value="chua">Thiếu HĐ</option>
                  <option value="het_han">Hết hạn</option>
                </select>
                {showLuuTruFilter&&(
                  <select value={filterSao} onChange={e=>setFilterSao(e.target.value)} style={{border:"1px solid var(--c-border)",borderRadius:"var(--r-xs)",padding:"4px 8px",fontSize:"var(--text-sm)",fontFamily:"inherit",background:"var(--c-surface)",color:"var(--c-text-2)"}}>
                    <option value="all">Hạng sao</option>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}★</option>)}
                  </select>
                )}
              </div>
              <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)"}}>{filteredSuppliers.length} kết quả</div>
            </div>

            {/* List — dạng card grid khi chưa chọn NCC, dạng list khi đã chọn */}
            <div style={{flex:1,overflowY:"auto",padding:selected||showAdd?"0":"16px"}}>
              {filteredSuppliers.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:48,fontSize:"var(--text-md)"}}>🏢<br/>Không tìm thấy NCC nào</div>}

              {/* Card grid — full width khi chưa chọn */}
              {!(selected||showAdd)&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
                  {filteredSuppliers.map(s=>{
                    const activeDv=(s.dich_vu||[]).filter(d=>d.active);
                    const maxSao=Math.max(0,...activeDv.map(d=>d.meta?.hang_sao||0));
                    const hdColor={co:"var(--c-success-mid)",chua:"var(--c-danger-mid)",het_han:"var(--c-warning-mid)"}[s.trang_thai_hop_dong]||"var(--c-text-muted)";
                    const hdBg={co:"var(--c-success-bg)",chua:"var(--c-danger-bg)",het_han:"var(--c-warning-bg)"}[s.trang_thai_hop_dong]||"var(--c-surface-2)";
                    return(
                      <div key={s.id} onClick={()=>{setSelected(s);setEditMode(false);setShowAdd(false);setEditingSv(null);}}
                        style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:18,cursor:"pointer",boxShadow:"var(--sh-sm)",border:"1.5px solid var(--c-border)",transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.boxShadow="var(--sh-md)";e.currentTarget.style.borderColor="var(--c-primary-pale)";}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow="var(--sh-sm)";e.currentTarget.style.borderColor="var(--c-border)";}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div style={{fontWeight:800,fontSize:"var(--text-lg)",color:"var(--c-text)",flex:1,paddingRight:8}}>{s.ten}</div>
                          <span style={{background:hdBg,color:hdColor,borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"3px 10px",flexShrink:0}}>
                            {s.trang_thai_hop_dong==="co"?"✓ Có HĐ":s.trang_thai_hop_dong==="het_han"?"⚠ Hết hạn":"Thiếu HĐ"}
                          </span>
                        </div>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                          {(s.loai_hinh||[]).map(l=><ServiceTypeBadge key={l} loai={l}/>)}
                        </div>
                        <div style={{fontSize:"var(--text-base)",color:"var(--c-text-3)",lineHeight:1.8}}>
                          {s.sdt&&<div>📞 {s.sdt}</div>}
                          {s.nguoi_lien_he&&<div>👤 {s.nguoi_lien_he}</div>}
                          {(s.khu_vuc_hoat_dong||[]).length>0&&<div>📍 {s.khu_vuc_hoat_dong.slice(0,3).join(" · ")}</div>}
                        </div>
                        {maxSao>0&&<div style={{marginTop:8}}><StarRating value={maxSao} size={14}/></div>}
                        {s.cong_no>0&&(
                          <div style={{marginTop:10,padding:"6px 10px",background:"var(--c-danger-bg)",borderRadius:"var(--r-sm)",fontSize:"var(--text-sm)",color:"var(--c-danger-mid)",fontWeight:700}}>
                            💳 Công nợ: {fmtMoney(s.cong_no)}
                          </div>
                        )}
                        {activeDv.length>0&&(
                          <div style={{marginTop:8,fontSize:"var(--text-xs)",color:"var(--c-text-muted)"}}>{activeDv.length} dịch vụ đang cung cấp</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List dạng row khi đã chọn NCC (sidebar nhỏ) */}
              {(selected||showAdd)&&filteredSuppliers.map(s=>{
                const isActive=selected?.id===s.id;
                return(
                  <div key={s.id} onClick={()=>{setSelected(s);setEditMode(false);setShowAdd(false);setEditingSv(null);}}
                    style={{padding:"11px 14px",borderBottom:"1px solid var(--c-border)",cursor:"pointer",background:isActive?"var(--c-primary-light)":"var(--c-surface)",borderLeft:isActive?"3px solid var(--c-primary-mid)":"3px solid transparent",transition:"all .1s"}}>
                    <div style={{fontWeight:700,fontSize:"var(--text-base)",color:"var(--c-text)",marginBottom:3}}>{s.ten}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>
                      {(s.loai_hinh||[]).slice(0,2).map(l=><ServiceTypeBadge key={l} loai={l}/>)}
                    </div>
                    <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>{s.sdt||"—"}</div>
                    {s.cong_no>0&&<div style={{fontSize:"var(--text-xs)",color:"var(--c-danger-mid)",fontWeight:600,marginTop:2}}>Nợ: {fmtMoney(s.cong_no)}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel — detail / form */}
          <div style={{flex:1,overflowY:"auto",padding:24}}>
            {/* Add new NCC form */}
            {showAdd&&!selected&&(
              <SupplierForm form={form} updF={updF} updBank={updBank} editingSv={editingSv} setEditingSv={setEditingSv} expandedSv={expandedSv} togSvExpand={togSvExpand} saveSv={saveSv} deleteSv={deleteSv} onSave={saveNcc} onCancel={()=>setShowAdd(false)} isNew={true}/>
            )}

            {/* Selected NCC detail */}
            {selected&&!showAdd&&(
              editMode
              ? <SupplierForm form={form} updF={updF} updBank={updBank} editingSv={editingSv} setEditingSv={setEditingSv} expandedSv={expandedSv} togSvExpand={togSvExpand} saveSv={saveSv} deleteSv={deleteSv} onSave={saveNcc} onCancel={()=>setEditMode(false)} isNew={false}/>
              : <SupplierDetail supplier={selected} onEdit={()=>setEditMode(true)} onDelete={()=>deleteNcc(selected)} fmtMoney={fmtMoney} expenses={expenses} bookings={bookings} orders={orders}/>
            )}

            {/* Empty state */}
            {!selected&&!showAdd&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--c-text-muted)",gap:12}}>
                <div style={{fontSize:48}}>🏢</div>
                <div style={{fontSize:"var(--text-xl)",fontWeight:600}}>Chọn NCC từ danh sách bên trái</div>
                <div style={{fontSize:"var(--text-base)"}}>hoặc nhấn <strong>+ Thêm NCC</strong> để tạo mới</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ BOOKINGS TAB ══ */}
      {tab==="bookings"&&(
        <div style={{flex:1,overflowY:"auto",padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{margin:0,fontSize:"var(--text-md)",fontWeight:800,color:"var(--c-text)"}}>Booking NCC</h3>
            <Btn style={{background:"var(--c-purple)"}} onClick={()=>setShowBkForm(v=>!v)}>+ Tạo booking</Btn>
          </div>
          {showBkForm&&(()=>{
            const selectedOrder=orders.find(o=>o.id===bkForm.orderId);
            const selectedNCC=(suppliers||[]).find(s=>s.id===bkForm.nccId);
            const orderBookings=bookings.filter(b=>b.orderId===bkForm.orderId&&b.status!=="cancelled");
            const bookedSoFar=orderBookings.reduce((s,b)=>s+(b.totalNet||0),0);
            const estimatedCost=selectedOrder?(selectedOrder.costPrice||selectedOrder.pricing?.costPrice||0):0;
            const totalNetNum=Number(bkForm.totalNet)||0;
            const depositNum=Number(bkForm.deposit)||0;
            const remainingNum=Math.max(0,totalNetNum-depositNum);
            return (
              <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:24,marginBottom:20,border:"1px solid var(--c-border)",boxShadow:"var(--sh-sm)"}}>
                <div style={{fontWeight:600,fontSize:"var(--text-lg)",marginBottom:4,color:"var(--c-text-2)"}}>Tạo booking NCC mới</div>
                <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)",marginBottom:20}}>1 đơn (đặc biệt Tour trọn gói) thường cần nhiều booking — mỗi NCC (khách sạn, xe, du thuyền...) tạo 1 booking riêng, lặp lại "+ Tạo booking" cho từng NCC.</div>

                {/* Bước 1: Chọn đơn hàng */}
                <div style={{marginBottom:16}}>
                  <label style={lbl}>Chọn đơn hàng *<span style={{fontSize:"var(--text-xs)",fontWeight:400,color:"var(--c-text-3)",marginLeft:6}}>(chọn đơn để xem thông tin và gắn booking)</span></label>
                  <select value={bkForm.orderId||""} onChange={e=>setBkForm(f=>({...blankBkForm(),orderId:e.target.value}))} style={{...inp,fontSize:"var(--text-base)"}}>
                    <option value="">— Chọn đơn hàng —</option>
                    {orders.filter(o=>!["closed","cancelled"].includes(o.status)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(o=>(
                      <option key={o.id} value={o.id}>{o.id} · {o.customerName} · {o.tourName||o.service} · {o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"Chưa có ngày"}</option>
                    ))}
                  </select>
                </div>

                {/* Panel thông tin đơn + tiến độ booking so với giá vốn dự kiến */}
                {selectedOrder&&(
                  <div style={{padding:"14px 16px",borderRadius:"var(--r-md)",marginBottom:16,background:"var(--c-success-bg)",border:"1px solid var(--c-success-border)"}}>
                    <div style={{fontSize:"var(--text-xs)",fontWeight:600,textTransform:"uppercase",letterSpacing:".6px",color:"var(--c-success)",marginBottom:10}}>Thông tin đơn hàng</div>
                    <div className="resp-grid-3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {[
                        {label:"Khách hàng",val:selectedOrder.customerName},
                        {label:"SĐT",val:selectedOrder.customerPhone||"—"},
                        {label:"Dịch vụ",val:selectedOrder.tourName||selectedOrder.serviceName||selectedOrder.service},
                        {label:"Ngày khởi hành",val:selectedOrder.departDate?new Date(selectedOrder.departDate).toLocaleDateString("vi-VN"):"—"},
                        {label:"Ngày về",val:selectedOrder.returnDate?new Date(selectedOrder.returnDate).toLocaleDateString("vi-VN"):"—"},
                        {label:"Sale phụ trách",val:selectedOrder.sale||"—"},
                      ].map(item=>(
                        <div key={item.label}>
                          <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)",marginBottom:2}}>{item.label}</div>
                          <div style={{fontSize:"var(--text-base)",fontWeight:500,color:item.color||"var(--c-text-2)"}}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                    {selectedOrder.note&&<div style={{marginTop:8,fontSize:"var(--text-sm)",color:"var(--c-warning)",padding:"6px 10px",background:"var(--c-warning-bg)",borderRadius:"var(--r-sm)",borderLeft:"2px solid var(--c-warning-border)"}}>Ghi chú: {selectedOrder.note}</div>}
                    <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--c-success-border)",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      <div><div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>Giá vốn dự kiến</div><div style={{fontWeight:700}}>{estimatedCost.toLocaleString("vi-VN")}đ</div></div>
                      <div><div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>Đã booking ({orderBookings.length} NCC)</div><div style={{fontWeight:700,color:"var(--c-primary-mid)"}}>{bookedSoFar.toLocaleString("vi-VN")}đ</div></div>
                      <div><div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>Còn lại chưa book</div><div style={{fontWeight:700,color:estimatedCost-bookedSoFar>0?"var(--c-danger-mid)":"var(--c-success-mid)"}}>{Math.max(0,estimatedCost-bookedSoFar).toLocaleString("vi-VN")}đ</div></div>
                    </div>
                  </div>
                )}

                {/* Bước 2: Chọn NCC + loại dịch vụ */}
                <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  <div>
                    <label style={lbl}>Nhà cung cấp (NCC) *<span style={{fontSize:"var(--text-xs)",fontWeight:400,color:"var(--c-text-3)",marginLeft:6}}>(NCC phụ trách hạng mục này)</span></label>
                    <select value={bkForm.nccId||""} onChange={e=>{const s=(suppliers||[]).find(x=>x.id===e.target.value);setBkForm(f=>({...f,nccId:e.target.value,nccName:s?.name||s?.ten||"",serviceType:f.serviceType||(s?.loai_hinh||[])[0]||""}));}} style={{...inp,fontSize:"var(--text-base)"}}>
                      <option value="">— Chọn NCC —</option>
                      {(suppliers||[]).map(s=><option key={s.id} value={s.id}>{s.name||s.ten}{s.phone||s.sdt?` · ${s.phone||s.sdt}`:""}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Loại dịch vụ NCC cung cấp</label>
                    <select value={bkForm.serviceType||""} onChange={e=>setBkForm(f=>({...f,serviceType:e.target.value}))} style={{...inp,fontSize:"var(--text-base)"}}>
                      <option value="">— Chọn loại dịch vụ —</option>
                      {Object.entries(NCC_SERVICE_GROUPS).map(([grp,types])=>(
                        <optgroup key={grp} label={grp}>
                          {types.map(t=><option key={t} value={t}>{t}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Panel thông tin NCC */}
                {selectedNCC&&(
                  <div style={{padding:"12px 16px",borderRadius:"var(--r-md)",marginBottom:16,background:"var(--c-surface-2)",border:"1px solid var(--c-border)"}}>
                    <div style={{fontSize:"var(--text-xs)",fontWeight:600,textTransform:"uppercase",letterSpacing:".6px",color:"var(--c-warning)",marginBottom:8}}>Thông tin NCC</div>
                    <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:"var(--text-base)"}}>
                      <div><span style={{color:"var(--c-text-3)",fontSize:"var(--text-xs)"}}>Tên: </span><strong>{selectedNCC.name||selectedNCC.ten}</strong></div>
                      <div><span style={{color:"var(--c-text-3)",fontSize:"var(--text-xs)"}}>SĐT: </span><a href={`tel:${selectedNCC.phone||selectedNCC.sdt}`} style={{color:"var(--c-primary-mid)",textDecoration:"none",fontWeight:500}}>{selectedNCC.phone||selectedNCC.sdt||"—"}</a></div>
                      {(selectedNCC.bank||selectedNCC.taiKhoanNganHang)&&(
                        <div style={{gridColumn:"1/-1"}}><span style={{color:"var(--c-text-3)",fontSize:"var(--text-xs)"}}>TK Ngân hàng: </span><span style={{fontFamily:"var(--font-mono)",fontWeight:500,fontSize:"var(--text-sm)"}}>{selectedNCC.bank||(selectedNCC.taiKhoanNganHang?`${selectedNCC.taiKhoanNganHang.nganHang} - ${selectedNCC.taiKhoanNganHang.soTk} - ${selectedNCC.taiKhoanNganHang.chuTk}`:"—")}</span></div>
                      )}
                      {(selectedNCC.nguoiLienHe||selectedNCC.contact)&&<div><span style={{color:"var(--c-text-3)",fontSize:"var(--text-xs)"}}>Người LH: </span><span>{selectedNCC.nguoiLienHe||selectedNCC.contact}</span></div>}
                    </div>
                  </div>
                )}

                {/* Bước 3: Chi tiết booking — hạng mục cụ thể + tổng tiền + cọc/còn lại */}
                <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={lbl}>Tên dịch vụ cụ thể *<span style={{fontSize:"var(--text-xs)",fontWeight:400,color:"var(--c-text-3)",marginLeft:6}}>(hạng mục riêng của NCC này, không phải tên cả tour)</span></label>
                    <input value={bkForm.serviceName||""} onChange={e=>setBkForm(f=>({...f,serviceName:e.target.value}))} placeholder="VD: Phòng Superior × 2 đêm, Xe 45 chỗ HN-Cát Bà khứ hồi..." style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>Tổng tiền dịch vụ (NCC) *</label>
                    <NumberInput value={bkForm.totalNet||0} onChange={v=>setBkForm(f=>({...f,totalNet:v}))} placeholder="VD: 15.000.000" style={{...inp,textAlign:"right"}}/>
                  </div>
                  <div>
                    <label style={lbl}>Tiền cọc{totalNetNum>0&&(
                      <span style={{marginLeft:8}}>
                        {[30,50,100].map(pct=>(
                          <button key={pct} type="button" onClick={()=>setBkForm(f=>({...f,deposit:Math.round(totalNetNum*pct/100)}))} style={{fontSize:"var(--text-xs)",color:"var(--c-primary-mid)",background:"none",border:"none",cursor:"pointer",textDecoration:"underline",marginRight:6}}>{pct}%</button>
                        ))}
                      </span>
                    )}</label>
                    <NumberInput value={bkForm.deposit||0} onChange={v=>setBkForm(f=>({...f,deposit:v}))} placeholder="VD: 4.500.000" style={{...inp,textAlign:"right"}}/>
                  </div>
                  <div style={{gridColumn:"1/-1",padding:"8px 12px",background:"var(--c-surface-2)",borderRadius:"var(--r-sm)",display:"flex",justifyContent:"space-between",fontSize:"var(--text-sm)"}}>
                    <span style={{color:"var(--c-text-3)"}}>Còn lại (trả nốt sau)</span>
                    <strong style={{color:remainingNum>0?"var(--c-warning)":"var(--c-success)"}}>{remainingNum.toLocaleString("vi-VN")}đ</strong>
                  </div>
                  <div>
                    <label style={lbl}>Mã PNR / Booking code</label>
                    <input value={bkForm.pnrCode||""} onChange={e=>setBkForm(f=>({...f,pnrCode:e.target.value}))} placeholder="VD: VN-ABC123, VPQ-2025-001" style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>Time Limit<span style={{fontSize:"var(--text-xs)",fontWeight:400,color:"var(--c-text-3)",marginLeft:4}}>(hạn giữ chỗ với NCC)</span></label>
                    <input type="datetime-local" value={bkForm.timeLimit||""} onChange={e=>setBkForm(f=>({...f,timeLimit:e.target.value}))} style={inp}/>
                  </div>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={lbl}>Ghi chú</label>
                    <textarea value={bkForm.note||""} onChange={e=>setBkForm(f=>({...f,note:e.target.value}))} rows={2} placeholder="VD: Phòng nhìn ra biển, tầng cao · Yêu cầu ăn chay..." style={{...inp,resize:"vertical",minHeight:48}}/>
                  </div>
                </div>

                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <Btn variant="secondary" onClick={()=>{setShowBkForm(false);setBkForm(blankBkForm());}}>Hủy</Btn>
                  <Btn style={{background:"var(--c-purple)"}} onClick={()=>{if(!bkForm.orderId)return pushNotif?.("Chọn đơn hàng","error");if(!bkForm.nccId)return pushNotif?.("Chọn NCC","error");if(!bkForm.serviceName?.trim())return pushNotif?.("Nhập tên dịch vụ cụ thể","error");if(!(totalNetNum>0))return pushNotif?.("Nhập tổng tiền dịch vụ","error");saveBooking();}}>Lưu booking</Btn>
                </div>
              </div>
            );
          })()}
          <div style={{background:"var(--c-surface)",borderRadius:"var(--r-md)",boxShadow:"var(--sh-xs)",border:"1px solid var(--c-border)",overflow:"hidden"}}>
            {bookings.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:48}}>Chưa có booking nào</div>}
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"var(--text-base)"}}>
              {bookings.length>0&&<thead><tr style={{background:"var(--c-surface-2)"}}>{["Mã","NCC / Dịch vụ","Đơn hàng","Tổng tiền","Cọc","Còn lại","PNR","Trạng thái",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:700,color:"var(--c-text-2)",fontSize:"var(--text-sm)",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>}
              <tbody>
                {bookings.map(b=>{
                  const bs=BK_STATUS[b.status]||BK_STATUS.pending;
                  const tl=b.timeLimit?new Date(b.timeLimit):null;
                  const tlExpired=tl&&tl<new Date();
                  return(
                    <tr key={b.id} style={{borderTop:"1px solid var(--c-border)"}}>
                      <td style={{padding:"10px 12px",fontWeight:700}}>{b.id}</td>
                      <td style={{padding:"10px 12px"}}><div style={{fontWeight:600}}>{b.nccName||"—"}</div><div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)"}}>{b.serviceType?b.serviceType+" · ":""}{b.serviceName||b.service||""}</div></td>
                      <td style={{padding:"10px 12px"}}>{b.orderId||"—"}</td>
                      <td style={{padding:"10px 12px",fontWeight:700}}>{(b.totalNet||b.amount||0).toLocaleString("vi-VN")}₫</td>
                      <td style={{padding:"10px 12px",fontSize:"var(--text-sm)",color:b.depositPaid?"var(--c-success-mid)":"var(--c-text-3)"}}>{(b.deposit||0).toLocaleString("vi-VN")}₫{b.depositPaid?" ✓":""}</td>
                      <td style={{padding:"10px 12px",fontSize:"var(--text-sm)",fontWeight:(b.remaining||0)>0?700:400,color:(b.remaining||0)>0?"var(--c-warning)":"var(--c-text-3)"}}>{(b.remaining||0).toLocaleString("vi-VN")}₫</td>
                      <td style={{padding:"10px 12px",fontSize:"var(--text-sm)"}}>{b.pnrCode||"—"}</td>
                      <td style={{padding:"10px 12px"}}><span style={{background:bs.bg,color:bs.c,borderRadius:"var(--r-pill)",padding:"2px 8px",fontSize:"var(--text-xs)",fontWeight:700,whiteSpace:"nowrap"}}>{bs.label}</span></td>
                      <td style={{padding:"10px 12px"}}>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          {b.depositPaid&&(b.remaining||0)>0&&<Btn size="xs" style={{background:"var(--c-primary-mid)"}} onClick={()=>payRemaining(b)}>Thanh toán còn lại</Btn>}
                          {b.status!=="cancelled"&&b.status!=="paid"&&<select value={b.status} onChange={e=>updateBkStatus(b.id,e.target.value)} style={{border:"1px solid var(--c-border)",borderRadius:"var(--r-xs)",padding:"3px 6px",fontSize:"var(--text-xs)",fontFamily:"inherit"}}>
                            <option value={b.status}>Cập nhật</option>
                            {b.status!=="pending"&&<option value="pending">Chưa cọc</option>}
                            <option value="cancelled">Hủy</option>
                          </select>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SupplierDetail — view-only panel ───────────────────────
function SupplierDetail({ supplier:s, onEdit, onDelete, fmtMoney, expenses=[], bookings=[], orders=[] }){
  const nccExpenses=expenses.filter(e=>e.nccName===s.ten||e.nha_cung_cap_id===s.id);
  const totalChi=nccExpenses.filter(e=>e.type==="chi"&&e.status==="paid").reduce((sum,e)=>sum+(e.amount||0),0);
  const nccBookings=bookings.filter(b=>b.supplierId===s.id||b.nccId===s.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  return(
    <div style={{maxWidth:680}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)",fontWeight:700,letterSpacing:1}}>{s.ma_ncc}</div>
          <h2 style={{margin:"2px 0 4px",fontSize:"var(--text-3xl)",fontWeight:"var(--fw-black)",color:"var(--c-text)"}}>{s.ten}</h2>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <ContractBadge status={s.trang_thai_hop_dong}/>
            {(s.loai_hinh||[]).map(l=><ServiceTypeBadge key={l} loai={l}/>)}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={onEdit}>✏ Sửa</Btn>
          <Btn variant="danger" onClick={onDelete}>🗑</Btn>
        </div>
      </div>

      {/* Star rating */}
      <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
        <StarRating value={s.danh_gia_noi_bo||0} size={20}/>
        <span style={{fontSize:"var(--text-base)",color:"var(--c-text-3)"}}>Đánh giá nội bộ</span>
      </div>

      {s.ghi_chu_uu_tien&&<div style={{background:"var(--c-warning-bg)",borderRadius:"var(--r-md)",padding:"10px 14px",fontSize:"var(--text-base)",color:"var(--c-warning)",marginBottom:16}}>⭐ {s.ghi_chu_uu_tien}</div>}

      {/* Info grid */}
      <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-lg)",overflow:"hidden",marginBottom:16}}>
        {[["Người liên hệ",s.nguoi_lien_he||"—"],["SĐT",s.sdt||"—"],["Email",s.email||"—"],["Khu vực",(s.khu_vuc_hoat_dong||[]).join(", ")||"—"],["Phụ trách",s.nguoi_phu_trach||"—"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid var(--c-border)",fontSize:"var(--text-base)"}}>
            <span style={{color:"var(--c-text-3)"}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>

      {/* Bank */}
      <div style={{background:"var(--c-primary-light)",borderRadius:"var(--r-md)",padding:"12px 14px",marginBottom:16,fontSize:"var(--text-base)"}}>
        <div style={{fontWeight:700,color:"var(--c-primary)",marginBottom:6}}>🏦 Tài khoản ngân hàng</div>
        <div style={{color:"var(--c-text-2)"}}>{s.tai_khoan_ngan_hang?.ngan_hang||"—"} · {s.tai_khoan_ngan_hang?.so_tk||"—"} · {s.tai_khoan_ngan_hang?.chu_tk||"—"}</div>
      </div>

      {/* Debt */}
      <div style={{background:totalChi>0?"var(--c-danger-bg)":"var(--c-success-bg)",borderRadius:"var(--r-md)",padding:"12px 14px",marginBottom:20,fontSize:"var(--text-base)"}}>
        <div style={{fontWeight:700,color:totalChi>0?"var(--c-danger)":"var(--c-success)",marginBottom:4}}>💳 Công nợ</div>
        <div style={{fontSize:"var(--text-xl)",fontWeight:900,color:totalChi>0?"var(--c-danger-mid)":"var(--c-success-mid)"}}>{fmtMoney(s.cong_no||0)}</div>
        <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)",marginTop:2}}>Tổng đã chi (paid): {fmtMoney(totalChi)}</div>
      </div>

      {/* Lịch sử booking */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:"var(--text-base)",fontWeight:800,color:"var(--c-text-2)",marginBottom:10}}>Lịch sử booking ({nccBookings.length})</div>
        {nccBookings.length===0&&<div style={{color:"var(--c-text-muted)",fontSize:"var(--text-base)"}}>Chưa từng booking với NCC này</div>}
        {nccBookings.length>0&&(
          <div style={{background:"var(--c-surface)",border:"1px solid var(--c-border)",borderRadius:"var(--r-md)",overflow:"hidden"}}>
            {nccBookings.map((b,i)=>{
              const bs=BK_STATUS[b.status]||BK_STATUS.pending;
              const o=orders.find(x=>x.id===b.orderId);
              return(
                <div key={b.id} style={{padding:"10px 14px",borderTop:i>0?"1px solid var(--c-border)":"none",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontWeight:700,fontSize:"var(--text-base)"}}>{b.serviceName||b.service||"—"}</div>
                    <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-3)",marginTop:2}}>
                      {b.id} · {b.orderId||"—"}{o?.customerName?" · "+o.customerName:""}{b.pnrCode?" · PNR "+b.pnrCode:""} · {b.createdAt?new Date(b.createdAt).toLocaleDateString("vi-VN"):"—"}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:700,color:"var(--c-danger-mid)"}}>{fmtMoney(b.totalNet||b.amount)}</div>
                    <span style={{background:bs.bg,color:bs.c,borderRadius:"var(--r-pill)",padding:"2px 8px",fontSize:"var(--text-xs)",fontWeight:700}}>{bs.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Services */}
      <div>
        <div style={{fontSize:"var(--text-base)",fontWeight:800,color:"var(--c-text-2)",marginBottom:10}}>Danh mục dịch vụ ({s.dich_vu.length})</div>
        {s.dich_vu.length===0&&<div style={{color:"var(--c-text-muted)",fontSize:"var(--text-base)"}}>Chưa có dịch vụ nào</div>}
        {s.dich_vu.map(d=>{
          const gia=d.gia_tham_khao;
          return(
            <div key={d.id} style={{background:"var(--c-surface)",border:"1px solid var(--c-border)",borderRadius:"var(--r-md)",marginBottom:10,overflow:"hidden",opacity:d.active?1:.55}}>
              <div style={{padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                <ServiceTypeBadge loai={d.loai}/>
                {d.meta?.hang_sao>0&&<StarRating value={d.meta.hang_sao} size={14}/>}
                <span style={{flex:1,fontWeight:700,fontSize:"var(--text-base)"}}>{d.ten_dich_vu}</span>
                <span style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)"}}>{d.phan_khuc}</span>
                {gia.tu>0&&<span style={{fontSize:"var(--text-sm)",color:"var(--c-success-mid)",fontWeight:700}}>{fmtMoneyK(gia.tu)}–{fmtMoneyK(gia.den)}/{gia.don_vi}</span>}
                {!d.active&&<span style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)",background:"var(--c-surface-2)",borderRadius:"var(--r-xs)",padding:"1px 6px"}}>Ẩn</span>}
              </div>
              {(d.bang_gia_theo_mua||[]).length>0&&(
                <div style={{borderTop:"1px solid var(--c-border)",padding:"8px 14px",fontSize:"var(--text-sm)"}}>
                  <div style={{fontWeight:700,color:"var(--c-text-3)",marginBottom:4}}>📆 Giá theo mùa</div>
                  {d.bang_gia_theo_mua.map(g=>(
                    <div key={g.id} style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}>
                      <span>{g.ten_giai_doan||"(chưa đặt tên)"}{(g.tu_ngay||g.den_ngay)&&<span style={{color:"var(--c-text-muted)"}}> ({g.tu_ngay?new Date(g.tu_ngay).toLocaleDateString("vi-VN"):"?"} – {g.den_ngay?new Date(g.den_ngay).toLocaleDateString("vi-VN"):"?"})</span>}</span>
                      <span style={{color:"var(--c-success-mid)",fontWeight:700}}>{fmtMoneyK(g.tu)}–{fmtMoneyK(g.den)}</span>
                    </div>
                  ))}
                </div>
              )}
              {(d.chinh_sach_huy||d.dieu_kien_booking||d.ghi_chu_uu_tien)&&(
                <div style={{borderTop:"1px solid var(--c-border)",padding:"8px 14px",fontSize:"var(--text-sm)",color:"var(--c-text-3)",display:"grid",gap:4}}>
                  {d.chinh_sach_huy&&<div>📋 Hủy: {d.chinh_sach_huy}</div>}
                  {d.dieu_kien_booking&&<div>🔖 Booking: {d.dieu_kien_booking}</div>}
                  {d.mua_cao_diem&&<div>📅 Cao điểm: {d.mua_cao_diem}</div>}
                  {(d.gia_tham_khao?.ghi_chu)&&<div>💬 {d.gia_tham_khao.ghi_chu}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SupplierForm — add/edit form ───────────────────────────
function SupplierForm({ form, updF, updBank, editingSv, setEditingSv, expandedSv, togSvExpand, saveSv, deleteSv, onSave, onCancel, isNew }){
  return(
    <div style={{maxWidth:680}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{margin:0,fontSize:"var(--text-xl)",fontWeight:"var(--fw-black)",color:"var(--c-text)"}}>{isNew?"Thêm NCC mới":"Chỉnh sửa NCC"}</h3>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="secondary" onClick={onCancel}>Hủy</Btn>
          <Btn variant="success" style={{background:"var(--c-success-mid)",color:"#fff",border:"none"}} onClick={onSave}>💾 Lưu NCC</Btn>
        </div>
      </div>

      {/* Section 1 — Thông tin chung */}
      <SectionCard title="1. Thông tin chung">
        <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <label><div style={lbl}>Mã NCC</div><input value={form.ma_ncc||""} onChange={e=>updF("ma_ncc",e.target.value)} style={inp}/></label>
          <label style={{gridColumn:"1/-1"}}><div style={lbl}>Tên NCC *</div><input value={form.ten||""} onChange={e=>updF("ten",e.target.value)} placeholder="VD: Vietnam Airlines" style={inp}/></label>
          <label><div style={lbl}>Người liên hệ</div><input value={form.nguoi_lien_he||""} onChange={e=>updF("nguoi_lien_he",e.target.value)} style={inp}/></label>
          <label><div style={lbl}>SĐT *</div><input value={form.sdt||""} onChange={e=>updF("sdt",e.target.value)} style={inp}/></label>
          <label><div style={lbl}>Email</div><input value={form.email||""} onChange={e=>updF("email",e.target.value)} style={inp}/></label>
          <label><div style={lbl}>Mã số thuế</div><input value={form.ma_so_thue||""} onChange={e=>updF("ma_so_thue",e.target.value)} placeholder="VD: 0312345678" style={inp}/></label>
          <label style={{gridColumn:"1/-1"}}><div style={lbl}>Địa chỉ</div><input value={form.dia_chi||""} onChange={e=>updF("dia_chi",e.target.value)} placeholder="Địa chỉ đăng ký kinh doanh" style={inp}/></label>
          <label style={{gridColumn:"1/-1"}}><div style={lbl}>Ghi chú ưu tiên</div><textarea value={form.ghi_chu_uu_tien||""} onChange={e=>updF("ghi_chu_uu_tien",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/></label>
          <div>
            <div style={lbl}>Đánh giá nội bộ</div>
            <StarRating value={form.danh_gia_noi_bo||0} onChange={v=>updF("danh_gia_noi_bo",v)} size={22}/>
          </div>
          <label>
            <div style={lbl}>Trạng thái hợp đồng</div>
            <select value={form.trang_thai_hop_dong||"chua"} onChange={e=>updF("trang_thai_hop_dong",e.target.value)} style={inp}>
              <option value="co">Có HĐ</option>
              <option value="chua">Thiếu HĐ</option>
              <option value="het_han">Hết hạn</option>
            </select>
          </label>
          {/* Upload hợp đồng ký kết */}
          <div style={{gridColumn:"1/-1"}}>
            <div style={lbl}>Hợp đồng ký kết (PDF/ảnh)</div>
            {form.hop_dong_file?(
              <div style={{display:"flex",alignItems:"center",gap:10,background:"var(--c-success-bg)",border:"1px solid var(--c-success-border)",borderRadius:"var(--r-md)",padding:"10px 14px"}}>
                <span style={{fontSize:22}}>📄</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"var(--text-base)",fontWeight:600,color:"var(--c-success)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{form.hop_dong_ten||"Hợp đồng đã tải"}</div>
                  <a href={form.hop_dong_file} target="_blank" rel="noreferrer" style={{fontSize:"var(--text-xs)",color:"var(--c-primary-mid)"}}>Xem / Tải về</a>
                </div>
                <button type="button" onClick={()=>{updF("hop_dong_file","");updF("hop_dong_ten","");}} style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",border:"none",borderRadius:"var(--r-sm)",padding:"6px 12px",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:600}}>✕ Xóa</button>
              </div>
            ):(
              <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,border:"2px dashed var(--c-border-mid)",borderRadius:"var(--r-md)",padding:"14px",cursor:"pointer",background:"var(--c-surface-2)",color:"var(--c-text-3)",fontSize:"var(--text-base)",fontWeight:600}}>
                📎 Tải lên hợp đồng (PDF hoặc ảnh, tối đa 8MB)
                <input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{
                  const file=e.target.files?.[0];
                  if(!file) return;
                  if(file.size>8*1024*1024){alert("File tối đa 8MB");return;}
                  const reader=new FileReader();
                  reader.onload=(ev)=>{updF("hop_dong_file",ev.target.result);updF("hop_dong_ten",file.name);};
                  reader.readAsDataURL(file);
                }}/>
              </label>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Section 2 — Ngân hàng */}
      <SectionCard title="2. Tài khoản ngân hàng">
        <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <label><div style={lbl}>Ngân hàng</div><input value={form.tai_khoan_ngan_hang?.ngan_hang||""} onChange={e=>updBank("ngan_hang",e.target.value)} style={inp}/></label>
          <label><div style={lbl}>Số tài khoản</div><input value={form.tai_khoan_ngan_hang?.so_tk||""} onChange={e=>updBank("so_tk",e.target.value)} style={inp}/></label>
          <label style={{gridColumn:"1/-1"}}><div style={lbl}>Chủ tài khoản</div><input value={form.tai_khoan_ngan_hang?.chu_tk||""} onChange={e=>updBank("chu_tk",e.target.value)} style={inp}/></label>
        </div>
      </SectionCard>

      {/* Section 3 — Dịch vụ */}
      <SectionCard title={`3. Danh mục dịch vụ (${(form.dich_vu||[]).length})`}>
        {(form.dich_vu||[]).map(d=>{
          const isEditing=editingSv===d.id;
          return(
            <div key={d.id} style={{border:"1px solid var(--c-border)",borderRadius:"var(--r-md)",marginBottom:8,overflow:"hidden"}}>
              <div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 12px",background:"var(--c-surface-2)",cursor:"pointer",opacity:d.active?1:.6}} onClick={()=>togSvExpand(d.id)}>
                <span style={{fontSize:"var(--text-base)"}}>{expandedSv[d.id]?"▼":"▶"}</span>
                <ServiceTypeBadge loai={d.loai}/>
                <span style={{flex:1,fontWeight:700,fontSize:"var(--text-base)"}}>{d.ten_dich_vu||"(chưa đặt tên)"}</span>
                <span style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)"}}>{d.phan_khuc} · {d.khu_vuc?.loai}</span>
                {d.gia_tham_khao?.tu>0&&<span style={{fontSize:"var(--text-sm)",color:"var(--c-success-mid)",fontWeight:700}}>{fmtMoneyK(d.gia_tham_khao.tu)}/{d.gia_tham_khao.don_vi}</span>}
                {(d.bang_gia_theo_mua||[]).length>0&&<span title="Có giá theo mùa" style={{fontSize:"var(--text-xs)",color:"var(--c-purple)",background:"var(--c-purple-bg)",borderRadius:"var(--r-xs)",padding:"1px 6px"}}>📆 {d.bang_gia_theo_mua.length} mùa</span>}
                <button onClick={e=>{e.stopPropagation();setEditingSv(isEditing?null:d.id);}} style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",border:"none",borderRadius:"var(--r-xs)",padding:"3px 10px",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:700}}>Sửa</button>
                <button onClick={e=>{e.stopPropagation();deleteSv(d.id);}} style={{background:"var(--c-surface)",color:"var(--c-danger-mid)",border:"1px solid var(--c-danger-border)",borderRadius:"var(--r-xs)",padding:"3px 8px",cursor:"pointer",fontSize:"var(--text-sm)"}}>🗑</button>
              </div>
              {(isEditing)&&<ServiceEntryForm entry={d} onSave={saveSv} onCancel={()=>setEditingSv(null)}/>}
            </div>
          );
        })}
        {editingSv==="new"&&<ServiceEntryForm entry={null} onSave={sv=>{saveSv(sv);setEditingSv(null);}} onCancel={()=>setEditingSv(null)}/>}
        {editingSv!=="new"&&(
          <button onClick={()=>setEditingSv("new")} style={{marginTop:8,background:"var(--c-primary-light)",color:"var(--c-primary-mid)",border:"1px dashed var(--c-primary-pale)",borderRadius:"var(--r-sm)",padding:"9px 16px",cursor:"pointer",fontSize:"var(--text-base)",fontWeight:700,width:"100%"}}>+ Thêm dịch vụ</button>
        )}
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, children }){
  const [open,setOpen]=React.useState(true);
  return(
    <div style={{background:"var(--c-surface)",border:"1px solid var(--c-border)",borderRadius:"var(--r-lg)",marginBottom:14,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"var(--c-surface-2)",cursor:"pointer",borderBottom:open?"1px solid var(--c-border)":"none"}} onClick={()=>setOpen(v=>!v)}>
        <span style={{fontWeight:700,fontSize:"var(--text-md)",color:"var(--c-text-2)"}}>{title}</span>
        <span style={{color:"var(--c-text-muted)",fontSize:"var(--text-base)"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{padding:16}}>{children}</div>}
    </div>
  );
}
