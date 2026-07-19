// ══════════════════════════════════════════════════════════════
// SEED DATA & CONSTANTS — placed above SupplierModule
// ══════════════════════════════════════════════════════════════

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
  HANG_KHONG:    "Hàng không",
  DUONG_BO:      "Đường bộ",
  DUONG_SAT:     "Đường sắt",
  DUONG_THUY:    "Đường thủy",
  KHACH_SAN:     "Khách sạn",
  VILLA:         "Villa",
  HOMESTAY:      "Homestay",
  BUNGALOW:      "Bungalow",
  NHA_NGHI:      "Nhà nghỉ",
  DU_THUYEN_NGAY:"Du thuyền ngày",
  DU_THUYEN_DEM: "Du thuyền đêm",
  NHA_HANG:      "Nhà hàng",
  VE_THAM_QUAN:  "Vé tham quan",
  HUONG_DAN_VIEN:"Hướng dẫn viên",
  BAO_HIEM:      "Bảo hiểm",
  SPA:           "Spa & Wellness",
  KHAC:          "Khác",
};

const NCC_SERVICE_GROUPS = {
  "Vận chuyển":   ["Hàng không","Đường bộ","Đường sắt","Đường thủy"],
  "Lưu trú":      ["Khách sạn","Villa","Homestay","Bungalow","Nhà nghỉ"],
  "Du thuyền":    ["Du thuyền ngày","Du thuyền đêm"],
  "Ăn uống":      ["Nhà hàng"],
  "Dịch vụ khác": ["Vé tham quan","Hướng dẫn viên","Bảo hiểm","Spa & Wellness","Khác"],
};

const ALL_NCC_SERVICE_TYPES = Object.values(NCC_SERVICE_TYPES);

const SEED_SUPPLIERS = [
  {
    id:"ncc-001", ma_ncc:"NCC-001", ten:"Vietnam Airlines",
    loai_hinh:["Hàng không"],
    khu_vuc_hoat_dong:["Hà Nội","TP. Hồ Chí Minh","Đà Nẵng","Phú Quốc"],
    sdt:"1900 1100", email:"agency@vietnamairlines.com", nguoi_lien_he:"Phòng đại lý",
    tai_khoan_ngan_hang:{ ngan_hang:"Vietcombank", so_tk:"0011001234567", chu_tk:"TỔNG CÔNG TY HÀNG KHÔNG VN" },
    cong_no:0, trang_thai_hop_dong:"chua", nguoi_phu_trach:"", danh_gia_noi_bo:4, ghi_chu_uu_tien:"",
    dich_vu:[{
      id:"sv-001-1", loai:"Hàng không", ten_dich_vu:"Vietnam Airlines — Nội địa",
      khu_vuc:{ tinh_thanh:["Hà Nội","TP. Hồ Chí Minh","Đà Nẵng","Phú Quốc"], vung_mien:"Bắc", loai:"Nội địa" },
      phan_khuc:"Mid-range",
      gia_tham_khao:{ tu:800000, den:3500000, don_vi:"người", ghi_chu:"Chưa bao gồm thuế phí" },
      mua_cao_diem:"Tết, Hè (tháng 6–8), 30/4–1/5",
      chinh_sach_huy:"Hoàn vé trước 24h, phí 10–30% tùy hạng vé",
      dieu_kien_booking:"Xuất vé trong 24h sau khi giữ chỗ",
      active:true,
      meta:{ hang_bay:"Vietnam Airlines", duong_bay:"Tất cả nội địa", hang_ve:["Economy","Business"] }
    }],
    created_at:"2024-01-01T00:00:00Z", updated_at:"2024-01-01T00:00:00Z",
  },
  {
    id:"ncc-002", ma_ncc:"NCC-002", ten:"Vietjet Air",
    loai_hinh:["Hàng không"],
    khu_vuc_hoat_dong:["Hà Nội","TP. Hồ Chí Minh","Đà Nẵng"],
    sdt:"1900 1886", email:"b2b@vietjetair.com", nguoi_lien_he:"Phòng B2B",
    tai_khoan_ngan_hang:{ ngan_hang:"Techcombank", so_tk:"19034567891011", chu_tk:"CÔNG TY CP HÀNG KHÔNG VIETJET" },
    cong_no:0, trang_thai_hop_dong:"chua", nguoi_phu_trach:"", danh_gia_noi_bo:3, ghi_chu_uu_tien:"",
    dich_vu:[{
      id:"sv-002-1", loai:"Hàng không", ten_dich_vu:"Vietjet Air — Nội địa",
      khu_vuc:{ tinh_thanh:["Hà Nội","TP. Hồ Chí Minh","Đà Nẵng"], vung_mien:"Bắc", loai:"Nội địa" },
      phan_khuc:"Budget",
      gia_tham_khao:{ tu:299000, den:1500000, don_vi:"người", ghi_chu:"Giá flash sale đến giá thông thường" },
      mua_cao_diem:"Tết, Hè",
      chinh_sach_huy:"Không hoàn vé, chỉ đổi tên/ngày có phí",
      dieu_kien_booking:"Thanh toán ngay khi booking",
      active:true,
      meta:{ hang_bay:"Vietjet Air", duong_bay:"Tất cả nội địa", hang_ve:["Economy","SkyBoss"] }
    }],
    created_at:"2024-01-01T00:00:00Z", updated_at:"2024-01-01T00:00:00Z",
  },
  {
    id:"ncc-005", ma_ncc:"NCC-005", ten:"KS Vinpearl Phú Quốc",
    loai_hinh:["Lưu trú","Spa & Wellness","Vé tham quan"],
    khu_vuc_hoat_dong:["Phú Quốc"],
    sdt:"0297 3599 999", email:"b2b.pq@vinpearl.com", nguoi_lien_he:"Ms. Lan — Sales Manager",
    tai_khoan_ngan_hang:{ ngan_hang:"BIDV", so_tk:"31410000123456", chu_tk:"CÔNG TY CP VINPEARL" },
    cong_no:0, trang_thai_hop_dong:"co", nguoi_phu_trach:"", danh_gia_noi_bo:5,
    ghi_chu_uu_tien:"Ưu tiên dùng cho tour cao cấp Phú Quốc. Liên hệ Ms. Lan trước 3 ngày.",
    dich_vu:[
      {
        id:"sv-005-1", loai:"Khách sạn", ten_dich_vu:"Vinpearl Resort & Spa Phú Quốc",
        khu_vuc:{ tinh_thanh:["Phú Quốc"], vung_mien:"Nam", loai:"Nội địa" },
        phan_khuc:"Cao cấp",
        gia_tham_khao:{ tu:2500000, den:8000000, don_vi:"đêm", ghi_chu:"Tùy loại phòng, chưa bao gồm ăn sáng" },
        mua_cao_diem:"Tháng 11 – tháng 4",
        chinh_sach_huy:"Hủy trước 7 ngày miễn phí, sau đó mất 1 đêm",
        dieu_kien_booking:"Đặt cọc 30% trong 24h",
        active:true,
        meta:{ hang_sao:5, loai_phong:["Deluxe","Premier","Suite","Villa"], so_phong:750, extra_bed:true, an_sang:false, tien_ich:["Hồ bơi","Spa","Gym","Bãi biển riêng","Nhà hàng"] }
      },
      {
        id:"sv-005-2", loai:"Spa & Wellness", ten_dich_vu:"Vinpearl Spa Phú Quốc",
        khu_vuc:{ tinh_thanh:["Phú Quốc"], vung_mien:"Nam", loai:"Nội địa" },
        phan_khuc:"Cao cấp",
        gia_tham_khao:{ tu:500000, den:2000000, don_vi:"người", ghi_chu:"Tùy gói dịch vụ" },
        mua_cao_diem:"", chinh_sach_huy:"Hủy trước 4h miễn phí", dieu_kien_booking:"Đặt lịch trước 1 ngày",
        active:true, meta:{}
      },
      {
        id:"sv-005-3", loai:"Vé tham quan", ten_dich_vu:"Vinpearl Safari & Vinpearl Land",
        khu_vuc:{ tinh_thanh:["Phú Quốc"], vung_mien:"Nam", loai:"Nội địa" },
        phan_khuc:"Mid-range",
        gia_tham_khao:{ tu:350000, den:900000, don_vi:"người", ghi_chu:"Người lớn/trẻ em có giá khác nhau" },
        mua_cao_diem:"Tết, Hè", chinh_sach_huy:"Không hoàn vé đã xuất", dieu_kien_booking:"Đặt trước ít nhất 1 ngày cho đoàn",
        active:true, meta:{}
      }
    ],
    created_at:"2024-01-01T00:00:00Z", updated_at:"2024-01-01T00:00:00Z",
  },
  {
    id:"ncc-008", ma_ncc:"NCC-008", ten:"Du thuyền Paradise Elegance",
    loai_hinh:["Du thuyền đêm"],
    khu_vuc_hoat_dong:["Quảng Ninh"],
    sdt:"0203 3648 888", email:"booking@paradise-cruises.vn", nguoi_lien_he:"Mr. Đức — Reservation",
    tai_khoan_ngan_hang:{ ngan_hang:"Vietcombank", so_tk:"0021009876543", chu_tk:"CÔNG TY CP DU THUYỀN PARADISE" },
    cong_no:0, trang_thai_hop_dong:"co", nguoi_phu_trach:"", danh_gia_noi_bo:4,
    ghi_chu_uu_tien:"Hạ Long — ưu tiên cho tour cao cấp. Cần xác nhận sớm mùa cao điểm.",
    dich_vu:[{
      id:"sv-008-1", loai:"Du thuyền đêm", ten_dich_vu:"Paradise Elegance — Hạ Long 2N1Đ",
      khu_vuc:{ tinh_thanh:["Quảng Ninh"], vung_mien:"Bắc", loai:"Nội địa" },
      phan_khuc:"Cao cấp",
      gia_tham_khao:{ tu:3800000, den:7500000, don_vi:"người", ghi_chu:"Đã bao gồm ăn uống và tham quan" },
      mua_cao_diem:"Tháng 3–5, Tháng 9–11",
      chinh_sach_huy:"Hủy trước 30 ngày hoàn 80%, trước 15 ngày hoàn 50%",
      dieu_kien_booking:"Đặt cọc 50% khi xác nhận",
      active:true,
      meta:{ ten_thuyen:"Paradise Elegance", hang_thuyen:"Paradise Cruises", hanh_trinh:"Hạ Long – Hang Sửng Sốt – Làng chài Cửa Vạn", loai_cabin:["Deluxe Ocean View","Suite","Premium Suite"], so_cabin:22, dich_vu_kem:["Kayak","Đạp xe","Nấu ăn","Tắm hang động"] }
    }],
    created_at:"2024-01-01T00:00:00Z", updated_at:"2024-01-01T00:00:00Z",
  },
];

// ══════════════════════════════════════════════════════════════
// HELPER SUB-COMPONENTS (defined outside SupplierModule)
// ══════════════════════════════════════════════════════════════

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
  const MAP={co:{bg:"#dcfce7",c:"#15803d",label:"Có HĐ"},chua:{bg:"#fee2e2",c:"#dc2626",label:"Thiếu HĐ"},het_han:{bg:"#fef9c3",c:"#92400e",label:"Hết hạn"}};
  const s=MAP[status]||MAP.chua;
  return <span style={{background:s.bg,color:s.c,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{s.label}</span>;
}

function ServiceTypeBadge({ loai }){
  const colors={"Hàng không":"#dbeafe","Khách sạn":"#fce7f3","Du thuyền đêm":"#ede9fe","Du thuyền ngày":"#ede9fe","Spa & Wellness":"#fdf4ff","Nhà hàng":"#fef3c7","Vé tham quan":"#ecfdf5","Đường bộ":"#fff7ed","Hướng dẫn viên":"#f0fdf4"};
  const textColors={"Hàng không":"#1d4ed8","Khách sạn":"#9d174d","Du thuyền đêm":"#6d28d9","Du thuyền ngày":"#6d28d9","Spa & Wellness":"#7e22ce","Nhà hàng":"#92400e","Vé tham quan":"#065f46","Đường bộ":"#9a3412","Hướng dẫn viên":"#14532d"};
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label><div style={lbl}>Tên thuyền</div><input value={meta.ten_thuyen||""} onChange={e=>upd("ten_thuyen",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Hãng thuyền</div><input value={meta.hang_thuyen||""} onChange={e=>upd("hang_thuyen",e.target.value)} style={inp}/></label>
      <label style={{gridColumn:"1/-1"}}><div style={lbl}>Hành trình</div><input value={meta.hanh_trinh||""} onChange={e=>upd("hanh_trinh",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Số cabin</div><input type="number" value={meta.so_cabin||""} onChange={e=>upd("so_cabin",+e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Loại cabin (phẩy phân cách)</div><input value={(meta.loai_cabin||[]).join(",")} onChange={e=>upd("loai_cabin",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
      <label style={{gridColumn:"1/-1"}}><div style={lbl}>Dịch vụ kèm (phẩy phân cách)</div><input value={(meta.dich_vu_kem||[]).join(",")} onChange={e=>upd("dich_vu_kem",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
    </div>
  );

  if(["Nhà hàng"].includes(loai)) return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label><div style={lbl}>Loại ẩm thực</div><input value={meta.loai_am_thuc||""} onChange={e=>upd("loai_am_thuc",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Sức chứa (khách)</div><input type="number" value={meta.suc_chua_khach||""} onChange={e=>upd("suc_chua_khach",+e.target.value)} style={inp}/></label>
      <label style={{gridColumn:"1/-1"}}><div style={lbl}>Menu set (phẩy phân cách)</div><input value={(meta.menu_set||[]).join(",")} onChange={e=>upd("menu_set",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
    </div>
  );

  if(["Hướng dẫn viên"].includes(loai)) return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label><div style={lbl}>Ngôn ngữ (phẩy phân cách)</div><input value={(meta.ngon_ngu||[]).join(",")} onChange={e=>upd("ngon_ngu",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
      <label><div style={lbl}>Cấp chứng chỉ</div><input value={meta.cap_chung_chi||""} onChange={e=>upd("cap_chung_chi",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Kinh nghiệm (năm)</div><input type="number" value={meta.kinh_nghiem_nam||""} onChange={e=>upd("kinh_nghiem_nam",+e.target.value)} style={inp}/></label>
    </div>
  );

  return null;
}

const lbl={fontSize:12,color:"#64748b",marginBottom:3,fontWeight:600};
const inp={width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"};

function ServiceEntryForm({ entry, onSave, onCancel }){
  const blank={id:"sv-"+Date.now(),loai:"Hàng không",ten_dich_vu:"",khu_vuc:{tinh_thanh:[],vung_mien:"Bắc",loai:"Nội địa"},phan_khuc:"Mid-range",gia_tham_khao:{tu:0,den:0,don_vi:"người",ghi_chu:""},mua_cao_diem:"",chinh_sach_huy:"",dieu_kien_booking:"",active:true,meta:{}};
  const [form,setForm]=React.useState(entry||blank);
  const [provinceSearch,setProvinceSearch]=React.useState("");

  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const updKv=(k,sub,v)=>setForm(f=>({...f,[k]:{...f[k],[sub]:v}}));
  const updGia=(sub,v)=>updKv("gia_tham_khao",sub,sub==="tu"||sub==="den"?Number(v):v);
  const togProv=(p)=>{
    const cur=form.khu_vuc.tinh_thanh||[];
    updKv("khu_vuc","tinh_thanh",cur.includes(p)?cur.filter(x=>x!==p):[...cur,p]);
  };

  const filtProv=PROVINCES.filter(p=>!provinceSearch||p.toLowerCase().includes(provinceSearch.toLowerCase()));

  return(
    <div style={{background:"#f8fafc",borderRadius:12,padding:16,border:"1px solid #e2e8f0",marginTop:8}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
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
          <div style={{display:"flex",flexWrap:"wrap",gap:4,maxHeight:120,overflowY:"auto",background:"#fff",borderRadius:8,border:"1px solid #e2e8f0",padding:8}}>
            {filtProv.map(p=>{
              const sel=(form.khu_vuc.tinh_thanh||[]).includes(p);
              return(
                <button key={p} onClick={()=>togProv(p)} style={{padding:"3px 10px",borderRadius:20,border:"1px solid",fontSize:12,cursor:"pointer",fontWeight:600,background:sel?"#2563eb":"transparent",color:sel?"#fff":"#64748b",borderColor:sel?"#2563eb":"#e2e8f0"}}>
                  {p}
                </button>
              );
            })}
          </div>
          {(form.khu_vuc.tinh_thanh||[]).length>0&&<div style={{fontSize:11,color:"#2563eb",marginTop:4}}>Đã chọn: {form.khu_vuc.tinh_thanh.join(", ")}</div>}
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
        <div style={{marginTop:12,padding:12,background:"#fff",borderRadius:8,border:"1px solid #e2e8f0"}}>
          <div style={{fontSize:12,color:"#2563eb",fontWeight:700,marginBottom:8}}>Chi tiết theo loại — {form.loai}</div>
          <ServiceMetaFields loai={form.loai} meta={form.meta||{}} onChange={m=>upd("meta",m)}/>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"8px 20px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",cursor:"pointer",fontWeight:600,fontSize:13}}>Hủy</button>
        <button onClick={()=>onSave(form)} style={{padding:"8px 20px",borderRadius:8,border:"none",background:"#2563eb",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>Lưu dịch vụ</button>
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

  const fmtM=(n)=>n>=1000000?(n/1000000).toFixed(1)+"tr":Math.round(n/1000)+"k";

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:560,boxShadow:"0 20px 60px rgba(0,0,0,.3)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🔍</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Tìm NCC: nhập tên, loại dịch vụ, tỉnh thành, phân khúc, 3 sao..."
            style={{flex:1,border:"none",outline:"none",fontSize:15,fontFamily:"inherit"}}/>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:20}}>✕</button>
        </div>
        <div style={{maxHeight:420,overflowY:"auto"}}>
          {scored.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:32}}>Không tìm thấy NCC phù hợp</div>}
          {scored.map(({s})=>{
            const activeSvs=s.dich_vu.filter(d=>d.active);
            return(
              <div key={s.id} style={{padding:"14px 16px",borderBottom:"1px solid #f8fafc",cursor:"pointer",transition:"background .1s"}}
                onMouseEnter={ev=>ev.currentTarget.style.background="#f8fafc"}
                onMouseLeave={ev=>ev.currentTarget.style.background=""}
                onClick={()=>onSelect(s)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:14}}>{s.ten}</span>
                  <ContractBadge status={s.trang_thai_hop_dong}/>
                </div>
                {activeSvs.slice(0,3).map(d=>(
                  <div key={d.id} style={{display:"flex",gap:8,alignItems:"center",marginTop:3}}>
                    <ServiceTypeBadge loai={d.loai}/>
                    {d.meta?.hang_sao>0&&<StarRating value={d.meta.hang_sao} size={12}/>}
                    <span style={{fontSize:12,color:"#64748b"}}>{d.phan_khuc} · {(d.khu_vuc.tinh_thanh||[]).slice(0,3).join(", ")}</span>
                    <span style={{fontSize:12,color:"#16a34a",marginLeft:"auto",fontWeight:700}}>
                      {d.gia_tham_khao.tu>0&&fmtM(d.gia_tham_khao.tu)+"–"+fmtM(d.gia_tham_khao.den)+"/"+d.gia_tham_khao.don_vi}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{padding:"8px 16px",background:"#f8fafc",fontSize:11,color:"#94a3b8",textAlign:"center"}}>Nhấn Enter để chọn · Esc để đóng · Ctrl+K để mở</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUPPLIER MODULE (replaces NCCDashboard)
// ══════════════════════════════════════════════════════════════

function SupplierModule({ suppliers=[], onAddSupplier, onUpdateSupplier, onDeleteSupplier, orders=[], vouchers=[], expenses=[], pushNotif, currentRole, currentUser, bookings:bookingsProp=[], onUpdateBookings, onCreateExpense }){
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
  const [bookings,setBookings]=React.useState(bookingsProp||[]);

  // Booking state (preserved from old NCCDashboard)
  const [showBkForm,setShowBkForm]=React.useState(false);
  const [bkForm,setBkForm]=React.useState({orderId:"",supplierId:"",service:"",amount:"",pnrCode:"",note:"",dueDate:"",timeLimit:""});
  const BK_STATUS={pending:{bg:"#fef9c3",c:"#92400e",label:"Chờ xác nhận"},confirmed:{bg:"#dbeafe",c:"#1d4ed8",label:"Đã xác nhận"},paid:{bg:"#dcfce7",c:"#15803d",label:"Đã thanh toán"},cancelled:{bg:"#fee2e2",c:"#dc2626",label:"Đã hủy"}};

  const syncBookings=(list)=>{setBookings(list);onUpdateBookings&&onUpdateBookings(list);};

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
        const groupTypes=NCC_SERVICE_GROUPS[filterGroup]||[];
        if(!activeDv.some(d=>groupTypes.includes(d.loai))) return false;
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
    const hasActive=bookings.some(b=>b.supplierId===s.id&&!["cancelled","paid"].includes(b.status));
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

  // ── Booking save ──
  const saveBooking=()=>{
    if(!bkForm.orderId||!bkForm.supplierId||!bkForm.amount) return pushNotif&&pushNotif("Chọn đơn, NCC và nhập số tiền","error");
    const sup=suppliers.find(s=>s.id===bkForm.supplierId);
    const bk={...bkForm,id:"BK"+Date.now(),amount:Number(bkForm.amount),status:"pending",nccName:sup?.ten||bkForm.supplierId,createdBy:currentUser?.name,createdAt:new Date().toISOString()};
    syncBookings([bk,...bookings]);
    if(onCreateExpense){
      onCreateExpense({id:"EXP"+Date.now(),orderId:bkForm.orderId,type:"chi",amount:Number(bkForm.amount),note:"NCC: "+(sup?.ten||"")+" - "+bkForm.service,status:"pending_kt",method:"transfer",createdBy:currentUser?.name,createdAt:new Date().toISOString(),nccName:sup?.ten||""});
    }
    setBkForm({orderId:"",supplierId:"",service:"",amount:"",pnrCode:"",note:"",dueDate:"",timeLimit:""});
    setShowBkForm(false);
    pushNotif&&pushNotif("Đã tạo booking "+bk.id,"success");
  };

  const updateBkStatus=(id,status)=>syncBookings(bookings.map(b=>b.id===id?{...b,status}:b));

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  const showLuuTruFilter=filterGroup==="all"||filterGroup==="Lưu trú";

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      {showQuickFind&&<QuickFindModal suppliers={suppliers} onClose={()=>setShowQuickFind(false)} onSelect={s=>{setSelected(s);setShowQuickFind(false);setTab("suppliers");}}/>}

      {/* Header */}
      <div style={{padding:"16px 24px",borderBottom:"1px solid #f1f5f9",background:"#fff",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:900}}>Nhà cung cấp (NCC)</h2>
          <div style={{fontSize:12,color:"#64748b",marginTop:1}}>{suppliers.length} NCC · Tổng công nợ: <strong style={{color:totalDebt>0?"#dc2626":"#16a34a"}}>{fmtMoney(totalDebt)}</strong></div>
        </div>
        <div style={{flex:1}}/>
        <button onClick={()=>setShowQuickFind(true)} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,color:"#475569",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
          🔍 Tìm nhanh <kbd style={{background:"#e2e8f0",borderRadius:4,padding:"1px 5px",fontSize:11}}>Ctrl+K</kbd>
        </button>
        <button onClick={()=>{setShowAdd(true);setSelected(null);setEditMode(false);setForm(blankNcc());setEditingSv(null);}} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Thêm NCC</button>
        <button onClick={()=>setShowBkForm(true)} style={{background:"#7c3aed",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Tạo booking</button>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,padding:"10px 24px 0",background:"#fff",borderBottom:"1px solid #f1f5f9"}}>
        {[["suppliers","Danh sách NCC",suppliers.length],["bookings","Booking",bookings.length]].map(([k,label,cnt])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 18px",borderRadius:"8px 8px 0 0",border:"1px solid",borderBottom:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:tab===k?"#fff":"#f8fafc",borderColor:tab===k?"#e2e8f0":"transparent",color:tab===k?"#1e293b":"#64748b",marginBottom:tab===k?-1:0}}>
            {label} {cnt>0&&<span style={{background:"#e2e8f0",color:"#475569",borderRadius:20,padding:"0 6px",fontSize:11,marginLeft:4}}>{cnt}</span>}
          </button>
        ))}
      </div>

      {/* ══ SUPPLIERS TAB ══ */}
      {tab==="suppliers"&&(
        <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>

          {/* Left panel — search + list */}
          <div style={{width:360,flexShrink:0,borderRight:"1px solid #f1f5f9",display:"flex",flexDirection:"column",background:"#fafafa"}}>
            {/* Search */}
            <div style={{padding:"12px 12px 0"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Tìm tên, mã, SĐT, người LH..."
                style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",background:"#fff"}}/>
            </div>

            {/* Filters */}
            <div style={{padding:"10px 12px",borderBottom:"1px solid #f1f5f9",display:"flex",flexDirection:"column",gap:6}}>
              {/* Group filter */}
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {["all",...Object.keys(NCC_SERVICE_GROUPS)].map(g=>(
                  <button key={g} onClick={()=>setFilterGroup(g)} style={{padding:"3px 10px",borderRadius:20,border:"1px solid",fontSize:11,cursor:"pointer",fontWeight:600,background:filterGroup===g?"#1e293b":"transparent",color:filterGroup===g?"#fff":"#64748b",borderColor:filterGroup===g?"#1e293b":"#e2e8f0"}}>
                    {g==="all"?"Tất cả":g}
                  </button>
                ))}
              </div>
              {/* Row 2 */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <select value={filterProv} onChange={e=>setFilterProv(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"#fff",color:"#475569"}}>
                  <option value="">Khu vực (tất cả)</option>
                  {PROVINCES.map(p=><option key={p}>{p}</option>)}
                </select>
                <select value={filterPhanKhuc} onChange={e=>setFilterPhanKhuc(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"#fff",color:"#475569"}}>
                  <option value="all">Phân khúc</option>
                  {["Budget","Mid-range","Cao cấp"].map(v=><option key={v}>{v}</option>)}
                </select>
                <select value={filterHD} onChange={e=>setFilterHD(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"#fff",color:"#475569"}}>
                  <option value="all">Hợp đồng</option>
                  <option value="co">Có HĐ</option>
                  <option value="chua">Thiếu HĐ</option>
                  <option value="het_han">Hết hạn</option>
                </select>
                {showLuuTruFilter&&(
                  <select value={filterSao} onChange={e=>setFilterSao(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"#fff",color:"#475569"}}>
                    <option value="all">Hạng sao</option>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}★</option>)}
                  </select>
                )}
              </div>
              <div style={{fontSize:11,color:"#94a3b8"}}>{filteredSuppliers.length} kết quả</div>
            </div>

            {/* List */}
            <div style={{flex:1,overflowY:"auto"}}>
              {filteredSuppliers.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48}}>Không tìm thấy NCC</div>}
              {filteredSuppliers.map(s=>{
                const isActive=selected?.id===s.id;
                const activeDv=s.dich_vu.filter(d=>d.active);
                const maxSao=Math.max(0,...activeDv.map(d=>d.meta?.hang_sao||0));
                return(
                  <div key={s.id} onClick={()=>{setSelected(s);setEditMode(false);setShowAdd(false);setEditingSv(null);}}
                    style={{padding:"12px 14px",borderBottom:"1px solid #f1f5f9",cursor:"pointer",background:isActive?"#eff6ff":"#fff",borderLeft:isActive?"3px solid #2563eb":"3px solid transparent",transition:"all .1s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                      <div style={{fontWeight:700,fontSize:14,color:"#0f172a",lineHeight:1.2}}>{s.ten}</div>
                      <ContractBadge status={s.trang_thai_hop_dong}/>
                    </div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:5}}>
                      {(s.loai_hinh||[]).map(l=><ServiceTypeBadge key={l} loai={l}/>)}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748b"}}>
                      <span>📞 {s.sdt||"—"} · 📍 {(s.khu_vuc_hoat_dong||[]).slice(0,2).join(", ")}{s.khu_vuc_hoat_dong?.length>2?" …":""}</span>
                      {maxSao>0&&<StarRating value={maxSao} size={13}/>}
                    </div>
                    {s.cong_no>0&&<div style={{fontSize:11,color:"#dc2626",fontWeight:700,marginTop:2}}>Công nợ: {fmtMoney(s.cong_no)}</div>}
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
              : <SupplierDetail supplier={selected} onEdit={()=>setEditMode(true)} onDelete={()=>deleteNcc(selected)} fmtMoney={fmtMoney} expenses={expenses}/>
            )}

            {/* Empty state */}
            {!selected&&!showAdd&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"#94a3b8",gap:12}}>
                <div style={{fontSize:48}}>🏢</div>
                <div style={{fontSize:16,fontWeight:600}}>Chọn NCC từ danh sách bên trái</div>
                <div style={{fontSize:13}}>hoặc nhấn <strong>+ Thêm NCC</strong> để tạo mới</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ BOOKINGS TAB ══ */}
      {tab==="bookings"&&(
        <div style={{flex:1,overflowY:"auto",padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{margin:0,fontSize:16,fontWeight:800}}>Booking NCC</h3>
            <button onClick={()=>setShowBkForm(v=>!v)} style={{background:"#7c3aed",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Tạo booking</button>
          </div>
          {showBkForm&&(
            <div style={{background:"#f8fafc",borderRadius:12,padding:20,marginBottom:20,border:"1px solid #e2e8f0"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <label>
                  <div style={lbl}>Đơn hàng *</div>
                  <select value={bkForm.orderId} onChange={e=>setBkForm(f=>({...f,orderId:e.target.value}))} style={inp}>
                    <option value="">— Chọn đơn —</option>
                    {orders.map(o=><option key={o.id} value={o.id}>{o.id} – {o.customerName}</option>)}
                  </select>
                </label>
                <label>
                  <div style={lbl}>NCC *</div>
                  <select value={bkForm.supplierId} onChange={e=>setBkForm(f=>({...f,supplierId:e.target.value}))} style={inp}>
                    <option value="">— Chọn NCC —</option>
                    {suppliers.map(s=><option key={s.id} value={s.id}>{s.ten}</option>)}
                  </select>
                </label>
                <label>
                  <div style={lbl}>Dịch vụ</div>
                  <input value={bkForm.service} onChange={e=>setBkForm(f=>({...f,service:e.target.value}))} placeholder="VD: Vé máy bay HAN-DAD" style={inp}/>
                </label>
                <label>
                  <div style={lbl}>Số tiền *</div>
                  <input type="number" value={bkForm.amount} onChange={e=>setBkForm(f=>({...f,amount:e.target.value}))} style={inp}/>
                </label>
                <label>
                  <div style={lbl}>Mã PNR/Booking</div>
                  <input value={bkForm.pnrCode} onChange={e=>setBkForm(f=>({...f,pnrCode:e.target.value}))} style={inp}/>
                </label>
                <label>
                  <div style={lbl}>Time Limit</div>
                  <input type="datetime-local" value={bkForm.timeLimit} onChange={e=>setBkForm(f=>({...f,timeLimit:e.target.value}))} style={inp}/>
                </label>
                <label style={{gridColumn:"1/-1"}}>
                  <div style={lbl}>Ghi chú</div>
                  <input value={bkForm.note} onChange={e=>setBkForm(f=>({...f,note:e.target.value}))} style={inp}/>
                </label>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button onClick={()=>setShowBkForm(false)} style={{padding:"8px 20px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontWeight:600,fontSize:13}}>Hủy</button>
                <button onClick={saveBooking} style={{padding:"8px 20px",borderRadius:8,border:"none",background:"#7c3aed",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>Lưu booking</button>
              </div>
            </div>
          )}
          <div style={{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,.07)",overflow:"hidden"}}>
            {bookings.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48}}>Chưa có booking nào</div>}
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              {bookings.length>0&&<thead><tr style={{background:"#f8fafc"}}>{["Mã","NCC / Dịch vụ","Đơn hàng","Số tiền","PNR","Time Limit","Trạng thái",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:700,color:"#475569",fontSize:12,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>}
              <tbody>
                {bookings.map(b=>{
                  const bs=BK_STATUS[b.status]||BK_STATUS.pending;
                  const tl=b.timeLimit?new Date(b.timeLimit):null;
                  const tlExpired=tl&&tl<new Date();
                  return(
                    <tr key={b.id} style={{borderTop:"1px solid #f8fafc"}}>
                      <td style={{padding:"10px 12px",fontWeight:700}}>{b.id}</td>
                      <td style={{padding:"10px 12px"}}><div style={{fontWeight:600}}>{b.nccName||"—"}</div><div style={{fontSize:11,color:"#64748b"}}>{b.service||""}</div></td>
                      <td style={{padding:"10px 12px"}}>{b.orderId||"—"}</td>
                      <td style={{padding:"10px 12px",fontWeight:700,color:"#dc2626"}}>{(b.amount||0).toLocaleString("vi-VN")}₫</td>
                      <td style={{padding:"10px 12px",fontSize:12}}>{b.pnrCode||"—"}</td>
                      <td style={{padding:"10px 12px",fontSize:12,color:tlExpired?"#dc2626":"#16a34a"}}>{tl?tl.toLocaleDateString("vi-VN"):"—"}</td>
                      <td style={{padding:"10px 12px"}}><span style={{background:bs.bg,color:bs.c,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700}}>{bs.label}</span></td>
                      <td style={{padding:"10px 12px"}}>
                        {b.status==="pending"&&<select value={b.status} onChange={e=>updateBkStatus(b.id,e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"3px 6px",fontSize:11,fontFamily:"inherit"}}>
                          <option value="pending">Cập nhật</option>
                          <option value="confirmed">Xác nhận</option>
                          <option value="paid">Đã thanh toán</option>
                          <option value="cancelled">Hủy</option>
                        </select>}
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
function SupplierDetail({ supplier:s, onEdit, onDelete, fmtMoney, expenses=[] }){
  const nccExpenses=expenses.filter(e=>e.nccName===s.ten||e.nha_cung_cap_id===s.id);
  const totalChi=nccExpenses.filter(e=>e.type==="chi"&&e.status==="paid").reduce((sum,e)=>sum+(e.amount||0),0);

  return(
    <div style={{maxWidth:680}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,letterSpacing:1}}>{s.ma_ncc}</div>
          <h2 style={{margin:"2px 0 4px",fontSize:22,fontWeight:900}}>{s.ten}</h2>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <ContractBadge status={s.trang_thai_hop_dong}/>
            {(s.loai_hinh||[]).map(l=><ServiceTypeBadge key={l} loai={l}/>)}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onEdit} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>✏ Sửa</button>
          <button onClick={onDelete} style={{background:"#fff",color:"#dc2626",border:"1px solid #dc2626",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontWeight:700,fontSize:13}}>🗑</button>
        </div>
      </div>

      {/* Star rating */}
      <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
        <StarRating value={s.danh_gia_noi_bo||0} size={20}/>
        <span style={{fontSize:13,color:"#64748b"}}>Đánh giá nội bộ</span>
      </div>

      {s.ghi_chu_uu_tien&&<div style={{background:"#fef9c3",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#92400e",marginBottom:16}}>⭐ {s.ghi_chu_uu_tien}</div>}

      {/* Info grid */}
      <div style={{background:"#f8fafc",borderRadius:12,overflow:"hidden",marginBottom:16}}>
        {[["Người liên hệ",s.nguoi_lien_he||"—"],["SĐT",s.sdt||"—"],["Email",s.email||"—"],["Khu vực",(s.khu_vuc_hoat_dong||[]).join(", ")||"—"],["Phụ trách",s.nguoi_phu_trach||"—"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
            <span style={{color:"#64748b"}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>

      {/* Bank */}
      <div style={{background:"#f0f9ff",borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:13}}>
        <div style={{fontWeight:700,color:"#1e3a5f",marginBottom:6}}>🏦 Tài khoản ngân hàng</div>
        <div style={{color:"#334155"}}>{s.tai_khoan_ngan_hang?.ngan_hang||"—"} · {s.tai_khoan_ngan_hang?.so_tk||"—"} · {s.tai_khoan_ngan_hang?.chu_tk||"—"}</div>
      </div>

      {/* Debt */}
      <div style={{background:totalChi>0?"#fef2f2":"#f0fdf4",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:13}}>
        <div style={{fontWeight:700,color:totalChi>0?"#991b1b":"#14532d",marginBottom:4}}>💳 Công nợ</div>
        <div style={{fontSize:18,fontWeight:900,color:totalChi>0?"#dc2626":"#16a34a"}}>{fmtMoney(s.cong_no||0)}</div>
        <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>Tổng đã chi (paid): {fmtMoney(totalChi)}</div>
      </div>

      {/* Services */}
      <div>
        <div style={{fontSize:13,fontWeight:800,color:"#1e293b",marginBottom:10}}>Danh mục dịch vụ ({s.dich_vu.length})</div>
        {s.dich_vu.length===0&&<div style={{color:"#94a3b8",fontSize:13}}>Chưa có dịch vụ nào</div>}
        {s.dich_vu.map(d=>{
          const gia=d.gia_tham_khao;
          return(
            <div key={d.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,marginBottom:10,overflow:"hidden",opacity:d.active?1:.55}}>
              <div style={{padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                <ServiceTypeBadge loai={d.loai}/>
                {d.meta?.hang_sao>0&&<StarRating value={d.meta.hang_sao} size={14}/>}
                <span style={{flex:1,fontWeight:700,fontSize:13}}>{d.ten_dich_vu}</span>
                <span style={{fontSize:12,color:"#64748b"}}>{d.phan_khuc}</span>
                {gia.tu>0&&<span style={{fontSize:12,color:"#16a34a",fontWeight:700}}>{fmtMoneyK(gia.tu)}–{fmtMoneyK(gia.den)}/{gia.don_vi}</span>}
                {!d.active&&<span style={{fontSize:11,color:"#94a3b8",background:"#f1f5f9",borderRadius:4,padding:"1px 6px"}}>Ẩn</span>}
              </div>
              {(d.chinh_sach_huy||d.dieu_kien_booking||d.ghi_chu_uu_tien)&&(
                <div style={{borderTop:"1px solid #f1f5f9",padding:"8px 14px",fontSize:12,color:"#64748b",display:"grid",gap:4}}>
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
        <h3 style={{margin:0,fontSize:18,fontWeight:900}}>{isNew?"Thêm NCC mới":"Chỉnh sửa NCC"}</h3>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onCancel} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontWeight:600,fontSize:13}}>Hủy</button>
          <button onClick={onSave} style={{padding:"8px 22px",borderRadius:8,border:"none",background:"#16a34a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>💾 Lưu NCC</button>
        </div>
      </div>

      {/* Section 1 — Thông tin chung */}
      <SectionCard title="1. Thông tin chung">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <label><div style={lbl}>Mã NCC</div><input value={form.ma_ncc||""} onChange={e=>updF("ma_ncc",e.target.value)} style={inp}/></label>
          <label style={{gridColumn:"1/-1"}}><div style={lbl}>Tên NCC *</div><input value={form.ten||""} onChange={e=>updF("ten",e.target.value)} placeholder="VD: Vietnam Airlines" style={inp}/></label>
          <label><div style={lbl}>Người liên hệ</div><input value={form.nguoi_lien_he||""} onChange={e=>updF("nguoi_lien_he",e.target.value)} style={inp}/></label>
          <label><div style={lbl}>SĐT *</div><input value={form.sdt||""} onChange={e=>updF("sdt",e.target.value)} style={inp}/></label>
          <label style={{gridColumn:"1/-1"}}><div style={lbl}>Email</div><input value={form.email||""} onChange={e=>updF("email",e.target.value)} style={inp}/></label>
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
        </div>
      </SectionCard>

      {/* Section 2 — Ngân hàng */}
      <SectionCard title="2. Tài khoản ngân hàng">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
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
            <div key={d.id} style={{border:"1px solid #e2e8f0",borderRadius:10,marginBottom:8,overflow:"hidden"}}>
              <div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 12px",background:"#f8fafc",cursor:"pointer",opacity:d.active?1:.6}} onClick={()=>togSvExpand(d.id)}>
                <span style={{fontSize:13}}>{expandedSv[d.id]?"▼":"▶"}</span>
                <ServiceTypeBadge loai={d.loai}/>
                <span style={{flex:1,fontWeight:700,fontSize:13}}>{d.ten_dich_vu||"(chưa đặt tên)"}</span>
                <span style={{fontSize:12,color:"#64748b"}}>{d.phan_khuc} · {d.khu_vuc?.loai}</span>
                {d.gia_tham_khao?.tu>0&&<span style={{fontSize:12,color:"#16a34a",fontWeight:700}}>{fmtMoneyK(d.gia_tham_khao.tu)}/{d.gia_tham_khao.don_vi}</span>}
                <button onClick={e=>{e.stopPropagation();setEditingSv(isEditing?null:d.id);}} style={{background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>Sửa</button>
                <button onClick={e=>{e.stopPropagation();deleteSv(d.id);}} style={{background:"#fff",color:"#dc2626",border:"1px solid #fca5a5",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:12}}>🗑</button>
              </div>
              {(isEditing)&&<ServiceEntryForm entry={d} onSave={saveSv} onCancel={()=>setEditingSv(null)}/>}
            </div>
          );
        })}
        {editingSv==="new"&&<ServiceEntryForm entry={null} onSave={sv=>{saveSv(sv);setEditingSv(null);}} onCancel={()=>setEditingSv(null)}/>}
        {editingSv!=="new"&&(
          <button onClick={()=>setEditingSv("new")} style={{marginTop:8,background:"#eff6ff",color:"#2563eb",border:"1px dashed #93c5fd",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontSize:13,fontWeight:700,width:"100%"}}>+ Thêm dịch vụ</button>
        )}
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, children }){
  const [open,setOpen]=React.useState(true);
  return(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,marginBottom:14,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"#f8fafc",cursor:"pointer",borderBottom:open?"1px solid #e2e8f0":"none"}} onClick={()=>setOpen(v=>!v)}>
        <span style={{fontWeight:700,fontSize:14,color:"#1e293b"}}>{title}</span>
        <span style={{color:"#94a3b8",fontSize:13}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{padding:16}}>{children}</div>}
    </div>
  );
}
