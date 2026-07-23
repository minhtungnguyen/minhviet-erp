import React from "react";
import { overlayCloseHandlers } from "../utils/modalOverlay.js";
import { DateInput } from "../components/ui.jsx";

export default function HDVModule({ hdvList=[], onUpdate, orders=[], pushNotif, currentRole }) {
  const EMPTY={name:'',phone:'',speciality:'',lang:[],available:true,cardNo:'',cardType:'domestic',cardExpiry:'',cccd:'',cccdDate:'',cccdPlace:'Cục Cảnh sát QLHCVTTXH',cccdImg:null,cardImg:null,taxCode:'',photo:null,facebook:'',zalo:'',email:'',dob:'',address:'',dailyRate:0,type:'freelance',notes:'',ratings:[]};
  const [showForm,setShowForm]=React.useState(false);
  const [editHdv,setEditHdv]=React.useState(null);
  const [filterLang,setFilterLang]=React.useState("all");
  const [filterArea,setFilterArea]=React.useState("all");
  const [search,setSearch]=React.useState("");
  const [form,setForm]=React.useState(EMPTY);
  const [contractHdv,setContractHdv]=React.useState(null);
  const [cf,setCf]=React.useState({tourName:'',startDate:'',endDate:'',days:1,dailyRate:0,mealAllowance:0,accommodation:0,transport:0,notes:''});
  const [addRatingHdv,setAddRatingHdv]=React.useState(null);
  const [ratingForm,setRatingForm]=React.useState({score:5,note:'',tourName:''});

  const LANG_LABEL={vi:"Tiếng Việt",en:"English",fr:"Français",zh:"中文",ko:"한국어",ja:"日本語"};
  const CARD_TYPE_OPTS=[["domestic","Quốc nội"],["international","Quốc tế"]];
  const HDV_TYPE_OPTS=[["freelance","Freelance"],["partner","Cộng tác viên"],["fulltime","Toàn thời gian"]];
  const allLangs=[...new Set(hdvList.flatMap(h=>h.lang||[]))];
  const inp={width:'100%',border:'1px solid var(--c-border)',borderRadius:8,padding:'9px 12px',fontSize:13,boxSizing:'border-box'};
  const lbl={display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"var(--c-text-2)"};
  const canEdit=currentRole==='manager'||currentRole==='dieu_hanh';

  const expiringHdvs=React.useMemo(()=>{
    const now=new Date(); const soon=new Date(now); soon.setDate(soon.getDate()+30);
    return hdvList.filter(h=>{
      if(!h.cardExpiry) return false;
      const exp=new Date(h.cardExpiry);
      return exp<=soon;
    }).map(h=>({...h,_daysLeft:Math.round((new Date(h.cardExpiry)-now)/86400000)}));
  },[hdvList]);

  const avgRating=(h)=>{
    const r=h.ratings||[]; if(!r.length) return null;
    return (r.reduce((s,x)=>s+x.score,0)/r.length).toFixed(1);
  };
  const starStr=(avg)=>avg==null?"":("★").repeat(Math.round(avg))+("☆").repeat(5-Math.round(avg));

  const addRating=()=>{
    if(!addRatingHdv) return;
    const r={score:ratingForm.score,note:ratingForm.note,tourName:ratingForm.tourName,by:currentRole,date:new Date().toISOString().slice(0,10)};
    onUpdate(hdvList.map(h=>h.id===addRatingHdv.id?{...h,ratings:[...(h.ratings||[]),r]}:h));
    pushNotif&&pushNotif("Đã lưu đánh giá cho "+addRatingHdv.name);
    setAddRatingHdv(null); setRatingForm({score:5,note:'',tourName:''});
  };

  const activeAssignments=React.useMemo(()=>{
    const m={};
    orders.filter(o=>["confirmed","in_progress"].includes(o.status)&&o.hdvId).forEach(o=>{
      if(!m[o.hdvId]) m[o.hdvId]=[];
      m[o.hdvId].push(o);
    });
    return m;
  },[orders]);

  React.useEffect(()=>{
    if(cf.startDate&&cf.endDate){
      const d=Math.max(1,Math.round((new Date(cf.endDate)-new Date(cf.startDate))/86400000)+1);
      setCf(f=>({...f,days:d}));
    }
  },[cf.startDate,cf.endDate]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const setCfField=(k,v)=>setCf(f=>({...f,[k]:v}));
  const toggleLang=(l)=>set('lang',(form.lang||[]).includes(l)?form.lang.filter(x=>x!==l):[...(form.lang||[]),l]);
  const handleImg=(field,e)=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>set(field,ev.target.result);
    reader.readAsDataURL(file);
  };

  const save=()=>{
    if(!form.name.trim()) return pushNotif('Nhập tên HDV','error');
    if(editHdv){
      onUpdate(hdvList.map(h=>h.id===editHdv.id?{...h,...form}:h));
      pushNotif('Đã cập nhật HDV');
    } else {
      onUpdate([...hdvList,{...form,id:'HDV'+Date.now()}]);
      pushNotif('Đã thêm HDV mới');
    }
    setShowForm(false); setForm(EMPTY); setEditHdv(null);
  };

  const toggleAvailable=(h)=>{
    onUpdate(hdvList.map(x=>x.id===h.id?{...x,available:!x.available}:x));
    pushNotif&&pushNotif(h.available?"Đã chuyển "+h.name+" sang Bận":"Đã chuyển "+h.name+" sang Rảnh");
  };

  const deleteHdv=(h)=>{
    const assignments=activeAssignments[h.id]||[];
    if(assignments.length>0) return pushNotif&&pushNotif("Không thể xóa — "+h.name+" đang phụ trách "+assignments.length+" tour. Hãy phân công lại trước.","error");
    if(!window.confirm("Xóa HDV "+h.name+"? Hành động này không thể hoàn tác.")) return;
    onUpdate(hdvList.filter(x=>x.id!==h.id));
    pushNotif&&pushNotif("Đã xóa HDV "+h.name);
  };

  const openEdit=(h)=>{setEditHdv(h);setForm({...EMPTY,...h});setShowForm(true);};
  const openContract=(h)=>{
    setCf({tourName:'',groupName:'',route:'',startDate:'',endDate:'',paxCount:0,vehicle:'Ô tô',totalFee:h.dailyRate||0,paymentMethod:'chuyển khoản / tiền mặt',notes:''});
    setContractHdv(h);
  };

  const printContract=()=>{
    if(!contractHdv) return;
    const h=contractHdv;
    const now=new Date();
    const dd=String(now.getDate()).padStart(2,'0');
    const mm=String(now.getMonth()+1).padStart(2,'0');
    const yyyy=now.getFullYear();
    const contractNo=`${dd}${mm}/HĐ-HDV/${yyyy}`;
    const dateStr=`ngày ${dd} tháng ${mm} năm ${yyyy}`;
    const fmtDate=d=>d?new Date(d).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}):'..............';
    const cardTypeLabel=h.cardType==='international'?'Quốc Tế':'Nội Địa';
    const html=`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>HĐ HDV - ${h.name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Times New Roman',Times,serif;font-size:13pt;line-height:1.8;color:#000;background:#fff}
.page{max-width:800px;margin:0 auto;padding:36px 48px}
.header-table{width:100%;border-collapse:collapse;margin-bottom:8px}
.header-table td{vertical-align:top;font-size:12pt}
.col-left{width:48%;text-align:center;font-weight:bold;text-transform:uppercase;font-size:12pt}
.col-right{width:52%;text-align:center}
.col-right .title{font-weight:bold;font-size:13pt}
.col-right .subtitle{font-size:12pt}
.divider{text-align:center;font-size:11pt;margin-top:2px}
h1{text-align:center;font-size:15pt;text-transform:uppercase;font-weight:bold;margin:18px 0 2px;letter-spacing:1px}
h2{text-align:center;font-size:13pt;font-weight:normal;margin-bottom:14px}
.legal-basis{margin:10px 0 14px;font-size:12pt}
.legal-basis p{margin:3px 0}
.party-label{font-weight:bold;text-transform:uppercase;margin-bottom:4px}
.party-block{margin:10px 0;font-size:12.5pt}
.party-block p{margin:2px 0}
.article{margin:12px 0}
.article-title{font-weight:bold;text-decoration:underline}
.article-body{margin:4px 0 4px 16px}
.article-body p{margin:3px 0}
.sign-row{display:flex;justify-content:space-between;margin-top:48px;text-align:center}
.sign-col{width:46%}
.sign-name{margin-top:64px;font-weight:bold}
.note-box{border:1px solid #999;padding:8px 14px;margin:12px 0;font-size:12pt}
@media print{.no-print{display:none}body{-webkit-print-color-adjust:exact}}
</style></head>
<body><div class="page">

<table class="header-table"><tr>
  <td class="col-left">CÔNG TY CỔ PHẦN THƯƠNG MẠI<br/>VÀ DỊCH VỤ DU LỊCH MINH VIỆT<br/><span style="border-top:1px solid #000;display:inline-block;margin-top:4px;padding-top:2px;font-size:11pt;font-weight:normal">------------------</span></td>
  <td style="width:4%"></td>
  <td class="col-right">
    <div class="title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
    <div class="subtitle">Độc lập - Tự do - Hạnh phúc</div>
    <div class="divider">------o0o------</div>
  </td>
</tr></table>

<h1>Hợp đồng thuê hướng dẫn viên du lịch</h1>
<h2>Số: ${contractNo}</h2>

<div class="legal-basis">
<p>- Căn cứ theo Luật dân sự số 33/2005/QH khoá 11 của nước Cộng Hoà XHCN Việt Nam ban hành ngày 14/06/2005 có hiệu lực từ ngày 01/01/2006</p>
<p>- Căn cứ Luật Du lịch số 09/2017/QH14 ngày 19/6/2017;</p>
<p>- Căn cứ nhu cầu công việc và năng lực chuyên môn của hai bên;</p>
</div>

<p>Hôm nay, ${dateStr} tại Hải Phòng, chúng tôi gồm:</p>

<div class="party-block">
<p class="party-label">Bên A: Bên thuê (Đơn vị tổ chức tour)</p>
<p>Tên đơn vị: <strong>CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ DU LỊCH MINH VIỆT</strong></p>
<p>Địa chỉ: Số 60/384 Lạch Tray, phường Lạch Tray, quận Ngô Quyền, thành phố Hải Phòng</p>
<p>Mã số thuế: <strong>0201320592</strong></p>
<p>Đại diện: (Ông) <strong>NGUYỄN MINH TÙNG</strong> &nbsp;&nbsp;&nbsp; Chức vụ: Giám đốc</p>
<p>Điện thoại: 0906001359</p>
<p>Số TK: 2037.040.7777.7777 tại ngân hàng: TMCP Phát triển thành phố Hồ Chí Minh - PGD Hải Đăng</p>
<p>Giấy phép Kinh doanh Dịch vụ lữ hành Nội Địa số GP: 31-0062/2022/SDL-GP LHND</p>
</div>

<div class="party-block">
<p class="party-label">Bên B: Bên được thuê (Hướng dẫn viên)</p>
<p>Họ và tên: <strong>${h.name||'...........................'}</strong></p>
<p>Năm sinh: ${h.dob?new Date(h.dob).toLocaleDateString('vi-VN'):'...........................'}</p>
<p>Số CCCD: <strong>${h.cccd||'...........................'}</strong> cấp ngày ${h.cccdDate?new Date(h.cccdDate).toLocaleDateString('vi-VN'):'...............'} tại ${h.cccdPlace||'Cục Cảnh sát QLHCVTTXH'}</p>
<p>Địa chỉ: ${h.address||'...........................................................................................'}</p>
<p>Điện thoại: ${h.phone||'...........................'}</p>
<p>Số thẻ HDV ${cardTypeLabel}: <strong>${h.cardNo||'...........................'}</strong> có giá trị đến ${h.cardExpiry?fmtDate(h.cardExpiry):'...............'}</p>
</div>

<div class="article">
<p class="article-title">Điều 1. Nội dung hợp đồng</p>
<p style="margin:6px 0 4px">Bên B đồng ý nhận công việc hướng dẫn viên du lịch theo tour của Bên A như sau:</p>
<div class="article-body">
<p>. Tên tour: <strong>${cf.tourName||'...........................................................................................'}</strong></p>
<p>. Nội dung tour: Được đính kèm theo hợp đồng này</p>
<p>. Đoàn khách: <strong>${cf.groupName||'...........................................................................................'}</strong></p>
<p>. Thời gian tour: từ ngày ${fmtDate(cf.startDate)} đến ngày ${fmtDate(cf.endDate)}</p>
<p>. Tuyến điểm: ${cf.route||'...........................................................................................'}</p>
<p>. Số lượng khách: <strong>${cf.paxCount||'......'}</strong> người (Theo danh sách đính kèm)</p>
<p>. Phương tiện di chuyển: ${cf.vehicle||'Ô tô'}</p>
</div>
</div>

<div class="article">
<p class="article-title">Điều 2. Trách nhiệm của Bên B</p>
<div class="article-body">
<p>. Thực hiện đầy đủ nghĩa vụ hướng dẫn, thuyết minh, chăm sóc đoàn theo đúng chương trình.</p>
<p>. Tuân thủ pháp luật, nội quy của Bên A và các quy định về nghề hướng dẫn viên.</p>
<p>. Bảo mật thông tin tour, khách hàng và không tự ý thay đổi lịch trình nếu không có sự đồng ý của Bên A.</p>
<p>. Báo cáo tình hình tour khi kết thúc.</p>
</div>
</div>

<div class="article">
<p class="article-title">Điều 3. Trách nhiệm của Bên A</p>
<div class="article-body">
<p>. Cung cấp đầy đủ thông tin tour, giấy tờ, tài liệu, công văn hoặc các công cụ, dụng cụ phục vụ đoàn (nếu có), cũng như phương tiện cần thiết khác để Bên B thực hiện công việc theo đúng yêu cầu.</p>
<p>. Chi trả đầy đủ thù lao và chi phí liên quan đến công việc theo điều khoản hợp đồng.</p>
</div>
</div>

<div class="article">
<p class="article-title">Điều 4. Thù lao và thanh toán</p>
<div class="article-body">
<p>. Tổng Mức thù lao: <strong>${Number(cf.totalFee||0).toLocaleString('vi-VN')} đồng/tour</strong> (Đã bao gồm toàn bộ tiền công hướng dẫn, công tác phí, chi phí ăn ở, đi lại trong tour. Bên A không chịu thêm bất kỳ khoản phát sinh nào ngoài mức thù lao này).</p>
<p>. Hình thức thanh toán: ${cf.paymentMethod||'chuyển khoản / tiền mặt'}</p>
<p>. Thời điểm thanh toán: sau khi kết thúc tour và nhận đủ biên bản nghiệm thu.</p>
</div>
</div>

<div class="article">
<p class="article-title">Điều 5. Điều khoản chung</p>
<div class="article-body">
<p>. Hợp đồng có hiệu lực từ ngày ký đến khi hai bên hoàn thành nghĩa vụ.</p>
<p>. Hai bên cam kết thực hiện đúng nội dung. Mọi sửa đổi phải lập thành văn bản.</p>
<p>. Hợp đồng lập thành 02 bản, mỗi bên giữ 01 bản có giá trị pháp lý như nhau.</p>
</div>
</div>

${cf.notes?`<div class="note-box"><strong>Ghi chú:</strong> ${cf.notes}</div>`:''}

<div class="sign-row">
  <div class="sign-col"><strong>ĐẠI DIỆN BÊN A</strong><br/><em>(Ký, ghi rõ họ tên, đóng dấu)</em><div class="sign-name">NGUYỄN MINH TÙNG</div></div>
  <div class="sign-col"><strong>ĐẠI DIỆN BÊN B</strong><br/><em>(Ký, ghi rõ họ tên)</em><div class="sign-name">${h.name}</div></div>
</div>

<div class="no-print" style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px dashed #ccc">
  <button onclick="window.print()" style="padding:10px 32px;font-size:14px;cursor:pointer;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:700">🖨 In hợp đồng</button>
</div>
</div></body></html>`;
    const w=window.open('','_blank'); w.document.write(html); w.document.close(); w.focus();
    setContractHdv(null);
  };

  const allAreas=[...new Set(hdvList.map(h=>h.speciality).map(s=>(s||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));

  const filtered=hdvList
    .filter(h=>filterLang==="all"||(h.lang||[]).includes(filterLang))
    .filter(h=>filterArea==="all"||(h.speciality||'').trim()===filterArea)
    .filter(h=>{
      if(!search.trim()) return true;
      const q=search.trim().toLowerCase();
      return (h.name||'').toLowerCase().includes(q)||(h.phone||'').includes(q)||(h.cardNo||'').toLowerCase().includes(q)||(h.speciality||'').toLowerCase().includes(q);
    })
    .sort((a,b)=>(a.name||'').localeCompare(b.name||'','vi'));

  return (
    <div style={{padding:24}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Hướng dẫn viên ({hdvList.length})</h2>
          <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:2}}>{hdvList.filter(h=>h.available).length} đang rảnh · {hdvList.filter(h=>!h.available).length} đang bận</div>
        </div>
        {canEdit&&<button onClick={()=>{setEditHdv(null);setForm(EMPTY);setShowForm(true)}} style={{background:'var(--c-primary-mid)',color:'var(--c-text-inverse)',border:'none',borderRadius:9,padding:'9px 18px',cursor:'pointer',fontWeight:700,fontSize:14}}>+ Thêm HDV</button>}
      </div>

      {/* Expiry warning banner */}
      {expiringHdvs.length>0&&(
        <div style={{background:"var(--c-danger-bg)",border:"1px solid var(--c-danger-border)",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{fontSize:20,flexShrink:0}}>🚨</div>
          <div>
            <div style={{fontWeight:700,color:"var(--c-danger-mid)",fontSize:14,marginBottom:4}}>Thẻ HDV sắp hết hạn — cần gia hạn ngay!</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {expiringHdvs.map(h=>(
                <span key={h.id} style={{background:"var(--c-danger-bg)",color:"var(--c-danger)",borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:600}}>
                  {h.name} — {h._daysLeft<=0?"ĐÃ HẾT HẠN":h._daysLeft+" ngày nữa"} ({new Date(h.cardExpiry).toLocaleDateString("vi-VN")})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add form */}
      {showForm&&(
        <div style={{background:'var(--c-surface)',borderRadius:14,padding:24,marginBottom:20,boxShadow:'0 1px 6px rgba(0,0,0,.07)'}}>
          <h3 style={{marginTop:0,marginBottom:16}}>{editHdv?'Sửa HDV':'Thêm HDV mới'}</h3>
          <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>Họ tên *</label><input value={form.name} onChange={e=>set('name',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>SĐT</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Số thẻ HDV</label><input value={form.cardNo||''} onChange={e=>set('cardNo',e.target.value)} placeholder="VD: 0123456789" style={inp}/></div>
            <div><label style={lbl}>Loại thẻ</label>
              <select value={form.cardType||'domestic'} onChange={e=>set('cardType',e.target.value)} style={inp}>
                {CARD_TYPE_OPTS.map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Ngày hết hạn thẻ</label><DateInput value={form.cardExpiry||''} onChange={v=>set('cardExpiry',v)} style={inp}/></div>
            <div><label style={lbl}>Số CCCD</label><input value={form.cccd||''} onChange={e=>set('cccd',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Ngày cấp CCCD</label><DateInput value={form.cccdDate||''} onChange={v=>set('cccdDate',v)} style={inp}/></div>
            <div><label style={lbl}>Nơi cấp CCCD</label><input value={form.cccdPlace||''} onChange={e=>set('cccdPlace',e.target.value)} placeholder="Cục Cảnh sát QLHCVTTXH" style={inp}/></div>
            <div><label style={lbl}>Mã số thuế cá nhân (MST)</label><input value={form.taxCode||''} onChange={e=>set('taxCode',e.target.value)} placeholder="VD: 8012345678" style={inp}/></div>
            <div><label style={lbl}>Ngày sinh</label><DateInput value={form.dob||''} onChange={v=>set('dob',v)} style={inp}/></div>
            <div style={{gridColumn:"1/-1"}}><label style={lbl}>Địa chỉ thường trú</label><input value={form.address||''} onChange={e=>set('address',e.target.value)} placeholder="VD: Thôn Trà Lâm, Thuận Thành, Bắc Ninh" style={inp}/></div>
            <div><label style={lbl}>Email</label><input value={form.email||''} onChange={e=>set('email',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Loại hợp tác</label>
              <select value={form.type||'freelance'} onChange={e=>set('type',e.target.value)} style={inp}>
                {HDV_TYPE_OPTS.map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Mức thù lao / ngày (đ)</label><input type="number" value={form.dailyRate||0} onChange={e=>set('dailyRate',Number(e.target.value))} style={inp}/></div>
            <div><label style={lbl}>Chuyên môn / vùng tour</label><input value={form.speciality||''} onChange={e=>set('speciality',e.target.value)} placeholder="VD: Miền Nam, Phú Quốc" style={inp}/></div>
            <div><label style={lbl}>Facebook (URL hoặc tên)</label><input value={form.facebook||''} onChange={e=>set('facebook',e.target.value)} placeholder="facebook.com/ten" style={inp}/></div>
            <div><label style={lbl}>Zalo (SĐT Zalo)</label><input value={form.zalo||''} onChange={e=>set('zalo',e.target.value)} placeholder="SĐT đăng ký Zalo" style={inp}/></div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={lbl}>Ngôn ngữ</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(LANG_LABEL).map(([k,v])=>(
                  <button key={k} onClick={()=>toggleLang(k)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:(form.lang||[]).includes(k)?"var(--c-primary-mid)":"var(--c-surface-3)",color:(form.lang||[]).includes(k)?"var(--c-text-inverse)":"var(--c-text-3)"}}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Ảnh đại diện</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {form.photo&&<img src={form.photo} alt="" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--c-border)"}}/>}
                <label style={{padding:"7px 14px",background:"var(--c-surface-3)",border:"1px dashed var(--c-border-mid)",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {form.photo?"Đổi ảnh":"📷 Tải ảnh lên"}<input type="file" accept="image/*" onChange={e=>handleImg('photo',e)} style={{display:"none"}}/>
                </label>
                {form.photo&&<button onClick={()=>set('photo',null)} style={{border:"none",background:"none",cursor:"pointer",color:"var(--c-danger-mid)",fontSize:12}}>Xóa</button>}
              </div>
            </div>
            <div>
              <label style={lbl}>Ảnh CCCD</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {form.cccdImg&&<img src={form.cccdImg} alt="" style={{width:80,height:50,borderRadius:6,objectFit:"cover",border:"2px solid var(--c-border)"}}/>}
                <label style={{padding:"7px 14px",background:"var(--c-surface-3)",border:"1px dashed var(--c-border-mid)",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {form.cccdImg?"Đổi CCCD":"📄 Tải CCCD lên"}<input type="file" accept="image/*" onChange={e=>handleImg('cccdImg',e)} style={{display:"none"}}/>
                </label>
                {form.cccdImg&&<button onClick={()=>set('cccdImg',null)} style={{border:"none",background:"none",cursor:"pointer",color:"var(--c-danger-mid)",fontSize:12}}>Xóa</button>}
              </div>
            </div>
            <div>
              <label style={lbl}>Ảnh Thẻ HDV</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {form.cardImg&&<img src={form.cardImg} alt="" style={{width:80,height:50,borderRadius:6,objectFit:"cover",border:"2px solid var(--c-border)"}}/>}
                <label style={{padding:"7px 14px",background:"var(--c-surface-3)",border:"1px dashed var(--c-border-mid)",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {form.cardImg?"Đổi thẻ HDV":"🪪 Tải thẻ HDV lên"}<input type="file" accept="image/*" onChange={e=>handleImg('cardImg',e)} style={{display:"none"}}/>
                </label>
                {form.cardImg&&<button onClick={()=>set('cardImg',null)} style={{border:"none",background:"none",cursor:"pointer",color:"var(--c-danger-mid)",fontSize:12}}>Xóa</button>}
              </div>
            </div>
            <div style={{gridColumn:"1/-1"}}><label style={lbl}>Ghi chú nội bộ</label><textarea rows={2} value={form.notes||''} onChange={e=>set('notes',e.target.value)} style={{...inp,resize:"vertical"}}/></div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button onClick={save} style={{background:'var(--c-success-mid)',color:'var(--c-text-inverse)',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:700}}>Lưu</button>
            <button onClick={()=>{setShowForm(false);setEditHdv(null);}} style={{background:'var(--c-text-3)',color:'var(--c-text-inverse)',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      {/* Contract modal */}
      {contractHdv&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} {...overlayCloseHandlers(()=>setContractHdv(null))}>
          <div style={{background:"var(--c-surface)",borderRadius:16,padding:28,width:"min(660px,95vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,.22)"}}>
            <h3 style={{marginTop:0,marginBottom:4}}>📄 Tạo hợp đồng — {contractHdv.name}</h3>
            <div style={{fontSize:12,color:"var(--c-text-3)",marginBottom:16}}>Điền thông tin tour rồi bấm Xuất HĐ để mở trang in</div>
            <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Tên tour / chương trình *</label>
                <input value={cf.tourName} onChange={e=>setCfField('tourName',e.target.value)} placeholder="VD: HÀNH TRÌNH HẢI PHÒNG - MAI CHÂU 2N1Đ" style={inp}/>
              </div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Đoàn khách (tên công ty / nhóm)</label>
                <input value={cf.groupName||''} onChange={e=>setCfField('groupName',e.target.value)} placeholder="VD: Công ty CP Đông Dương Logistics" style={inp}/>
              </div>
              <div><label style={lbl}>Ngày bắt đầu</label><DateInput value={cf.startDate} onChange={v=>setCfField('startDate',v)} style={inp}/></div>
              <div><label style={lbl}>Ngày kết thúc</label><DateInput value={cf.endDate} onChange={v=>setCfField('endDate',v)} style={inp}/></div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Tuyến điểm</label>
                <input value={cf.route||''} onChange={e=>setCfField('route',e.target.value)} placeholder="VD: Hải Phòng - Hòa Bình - Mai Châu - Hải Phòng" style={inp}/>
              </div>
              <div><label style={lbl}>Số lượng khách</label><input type="number" min={0} value={cf.paxCount||0} onChange={e=>setCfField('paxCount',Number(e.target.value))} style={inp}/></div>
              <div><label style={lbl}>Phương tiện</label>
                <select value={cf.vehicle||'Ô tô'} onChange={e=>setCfField('vehicle',e.target.value)} style={inp}>
                  {["Ô tô","Xe máy","Tàu hỏa","Máy bay","Tàu thuyền","Khác"].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Tổng thù lao ALL-IN (đ) *</label><input type="number" min={0} value={cf.totalFee||0} onChange={e=>setCfField('totalFee',Number(e.target.value))} style={inp}/></div>
              <div><label style={lbl}>Hình thức thanh toán</label>
                <select value={cf.paymentMethod||'chuyển khoản / tiền mặt'} onChange={e=>setCfField('paymentMethod',e.target.value)} style={inp}>
                  {["chuyển khoản / tiền mặt","chuyển khoản","tiền mặt"].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Ghi chú bổ sung</label><textarea rows={2} value={cf.notes} onChange={e=>setCfField('notes',e.target.value)} style={{...inp,resize:"vertical"}}/></div>
            </div>
            <div style={{background:"var(--c-success-bg)",border:"1px solid var(--c-success-border)",borderRadius:10,padding:"12px 16px",marginTop:12}}>
              <div style={{fontWeight:700,color:"var(--c-success)",fontSize:16}}>
                Thù lao hợp đồng: {Number(cf.totalFee||0).toLocaleString("vi-VN")}đ
              </div>
              <div style={{fontSize:12,color:"var(--c-text-3)",marginTop:2}}>All-in — bao gồm công hướng dẫn, ăn ở, đi lại trong tour</div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={printContract} style={{background:'var(--c-primary-mid)',color:'var(--c-text-inverse)',border:'none',borderRadius:8,padding:'10px 22px',cursor:'pointer',fontWeight:700,fontSize:14}}>🖨 Xuất &amp; In HĐ</button>
              <button onClick={()=>setContractHdv(null)} style={{background:'var(--c-text-3)',color:'var(--c-text-inverse)',border:'none',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontWeight:600}}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Rating modal */}
      {addRatingHdv&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} {...overlayCloseHandlers(()=>setAddRatingHdv(null))}>
          <div style={{background:"var(--c-surface)",borderRadius:16,padding:28,width:"min(460px,95vw)",boxShadow:"0 8px 40px rgba(0,0,0,.22)"}}>
            <h3 style={{marginTop:0,marginBottom:4}}>⭐ Chấm điểm — {addRatingHdv.name}</h3>
            {(addRatingHdv.ratings||[]).length>0&&<div style={{fontSize:12,color:"var(--c-text-3)",marginBottom:16}}>Trung bình hiện tại: {avgRating(addRatingHdv)} ★ ({(addRatingHdv.ratings||[]).length} lần)</div>}
            <div style={{marginBottom:12}}><label style={lbl}>Tour / chuyến đi</label><input value={ratingForm.tourName} onChange={e=>setRatingForm(f=>({...f,tourName:e.target.value}))} placeholder="VD: Tour Phú Quốc 3N2Đ" style={inp}/></div>
            <div style={{marginBottom:12}}>
              <label style={lbl}>Điểm đánh giá</label>
              <div style={{display:"flex",gap:6,marginTop:4}}>
                {[1,2,3,4,5].map(s=>(
                  <button key={s} onClick={()=>setRatingForm(f=>({...f,score:s}))} style={{width:44,height:44,borderRadius:8,border:"none",cursor:"pointer",fontSize:20,background:ratingForm.score>=s?"var(--c-warning-mid)":"var(--c-surface-3)",transition:"all .15s"}}>★</button>
                ))}
                <span style={{alignSelf:"center",marginLeft:6,fontWeight:700,fontSize:16,color:"var(--c-warning)"}}>{ratingForm.score}/5</span>
              </div>
              <div style={{fontSize:11,color:"var(--c-text-muted)",marginTop:4}}>{["","⚠ Không phù hợp","↓ Cần cải thiện","↗ Đạt yêu cầu","✓ Tốt","★ Xuất sắc — tour cao cấp"][ratingForm.score]}</div>
            </div>
            <div style={{marginBottom:16}}><label style={lbl}>Nhận xét</label><textarea rows={2} value={ratingForm.note} onChange={e=>setRatingForm(f=>({...f,note:e.target.value}))} placeholder="VD: Dẫn đoàn chuyên nghiệp, khách hài lòng..." style={{...inp,resize:"vertical"}}/></div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={addRating} style={{flex:1,background:'var(--c-warning-mid)',color:'var(--c-text-inverse)',border:'none',borderRadius:8,padding:'9px 0',cursor:'pointer',fontWeight:700,fontSize:14}}>Lưu đánh giá</button>
              <button onClick={()=>setAddRatingHdv(null)} style={{background:'var(--c-text-3)',color:'var(--c-text-inverse)',border:'none',borderRadius:8,padding:'9px 16px',cursor:'pointer',fontWeight:600}}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Search box */}
      <div style={{position:"relative",marginBottom:14}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--c-text-muted)",fontSize:14}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên, SĐT, số thẻ HDV hoặc khu vực..." style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:10,padding:"10px 12px 10px 36px",fontSize:13,boxSizing:"border-box"}}/>
      </div>

      {/* Area filter */}
      {allAreas.length>0&&(
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,color:"var(--c-text-muted)",fontWeight:700,letterSpacing:.4,marginRight:2}}>KHU VỰC</span>
          <button onClick={()=>setFilterArea("all")} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterArea==="all"?"var(--c-primary-mid)":"var(--c-surface-3)",color:filterArea==="all"?"var(--c-text-inverse)":"var(--c-text-3)"}}>Tất cả</button>
          {allAreas.map(a=>(
            <button key={a} onClick={()=>setFilterArea(a)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterArea===a?"var(--c-primary-mid)":"var(--c-surface-3)",color:filterArea===a?"var(--c-text-inverse)":"var(--c-text-3)"}}>{a}</button>
          ))}
        </div>
      )}

      {/* Language filter */}
      {allLangs.length>0&&(
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,color:"var(--c-text-muted)",fontWeight:700,letterSpacing:.4,marginRight:2}}>NGÔN NGỮ</span>
          <button onClick={()=>setFilterLang("all")} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterLang==="all"?"var(--c-text-2)":"var(--c-surface-3)",color:filterLang==="all"?"var(--c-text-inverse)":"var(--c-text-3)"}}>Tất cả</button>
          {allLangs.map(l=>(
            <button key={l} onClick={()=>setFilterLang(l)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterLang===l?"var(--c-text-2)":"var(--c-surface-3)",color:filterLang===l?"var(--c-text-inverse)":"var(--c-text-3)"}}>{LANG_LABEL[l]||l}</button>
          ))}
        </div>
      )}

      {(search.trim()||filterArea!=="all"||filterLang!=="all")&&(
        <div style={{fontSize:12,color:"var(--c-text-3)",marginBottom:12,marginTop:-4}}>Tìm thấy {filtered.length}/{hdvList.length} HDV</div>
      )}

      {/* Cards */}
      <div style={{display:'grid',gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {filtered.length===0&&<div style={{textAlign:'center',color:'var(--c-text-muted)',padding:40,gridColumn:"1/-1"}}>Chưa có HDV nào</div>}
        {filtered.map(h=>{
          const assignments=activeAssignments[h.id]||[];
          const initials=(h.name||"?").split(" ").slice(-2).map(w=>w[0]).join("").toUpperCase();
          const HTYPE={freelance:"Freelance",partner:"Cộng tác viên",fulltime:"Toàn thời gian"};
          const expiryInfo=expiringHdvs.find(x=>x.id===h.id);
          const isExpiring=!!expiryInfo;
          const avg=avgRating(h);
          return(
            <div key={h.id} style={{background:'var(--c-surface)',borderRadius:14,padding:18,boxShadow:'0 1px 5px rgba(0,0,0,.08)',display:"flex",flexDirection:"column",gap:0,border:isExpiring?"2px solid var(--c-danger-border)":"2px solid transparent"}}>
              {/* Avatar + name row */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                {h.photo
                  ?<img src={h.photo} alt="" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",border:h.available?"2px solid var(--c-success-border)":"2px solid var(--c-danger-border)",flexShrink:0}}/>
                  :<div style={{width:52,height:52,borderRadius:"50%",background:h.available?"var(--c-primary-pale)":"var(--c-danger-bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800,color:h.available?"var(--c-primary)":"var(--c-danger-mid)",flexShrink:0}}>{initials}</div>
                }
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:4}}>{h.name}</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    <span onClick={()=>canEdit&&toggleAvailable(h)} style={{background:h.available?"var(--c-success-bg)":"var(--c-danger-bg)",color:h.available?"var(--c-success)":"var(--c-danger-mid)",borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:700,cursor:canEdit?"pointer":"default",whiteSpace:"nowrap"}}>{h.available?"● Rảnh":"● Bận"}</span>
                    {h.cardType&&<span style={{background:h.cardType==="international"?"var(--c-warning-bg)":"var(--c-primary-light)",color:h.cardType==="international"?"var(--c-warning)":"var(--c-primary)",borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:700}}>{h.cardType==="international"?"🌍 Quốc tế":"🏠 Quốc nội"}</span>}
                    {h.type&&<span style={{background:"var(--c-purple-bg)",color:"var(--c-purple)",borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:600}}>{HTYPE[h.type]||h.type}</span>}
                  </div>
                </div>
              </div>
              {/* Info */}
              <div style={{fontSize:12,color:'var(--c-text-2)',display:"flex",flexDirection:"column",gap:3,marginBottom:8}}>
                {h.phone&&<div>📞 {h.phone}</div>}
                {h.email&&<div>✉ {h.email}</div>}
                {h.cardNo&&<div>🪪 Thẻ HDV: <strong>{h.cardNo}</strong>{h.cardExpiry&&<span style={{marginLeft:6,color:isExpiring?"var(--c-danger-mid)":"var(--c-text-3)",fontWeight:isExpiring?700:400}}>· HH: {new Date(h.cardExpiry).toLocaleDateString("vi-VN")}{isExpiring&&<span style={{marginLeft:4,background:"var(--c-danger-bg)",color:"var(--c-danger)",borderRadius:4,padding:"0 5px"}}>{expiryInfo._daysLeft<=0?"ĐÃ HẾT HẠN":expiryInfo._daysLeft+"ngày"}</span>}</span>}</div>}
                {h.cccd&&<div>🆔 CCCD: {h.cccd}</div>}
                {h.taxCode&&<div>🧾 MST: {h.taxCode}</div>}
                {h.dob&&<div>🎂 {new Date(h.dob).toLocaleDateString("vi-VN")}</div>}
                {h.speciality&&<div>🗺 {h.speciality}</div>}
                {h.dailyRate>0&&<div>💰 {Number(h.dailyRate).toLocaleString("vi-VN")}đ/ngày</div>}
                {avg!=null&&<div style={{color:"var(--c-warning)",fontWeight:600}}>⭐ {avg}/5 &nbsp;<span style={{letterSpacing:-1,color:"var(--c-warning-mid)"}}>{starStr(avg)}</span>&nbsp;<span style={{color:"var(--c-text-muted)",fontWeight:400}}>({(h.ratings||[]).length} lần)</span></div>}
              </div>
              {/* Social */}
              {(h.facebook||h.zalo)&&(
                <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  {h.facebook&&<a href={h.facebook.startsWith('http')?h.facebook:'https://'+h.facebook} target="_blank" rel="noopener noreferrer" style={{fontSize:11,background:"var(--c-primary-light)",color:"var(--c-primary)",borderRadius:6,padding:"3px 10px",textDecoration:"none",fontWeight:600}}>📘 Facebook</a>}
                  {h.zalo&&<span style={{fontSize:11,background:"var(--c-success-bg)",color:"var(--c-success)",borderRadius:6,padding:"3px 10px",fontWeight:600}}>💬 Zalo: {h.zalo}</span>}
                </div>
              )}
              {/* CCCD / Thẻ HDV preview */}
              {(h.cccdImg||h.cardImg)&&(
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  {h.cccdImg&&<div style={{flex:1,minWidth:0}}>
                    <img src={h.cccdImg} alt="CCCD" style={{width:"100%",height:60,objectFit:"cover",borderRadius:6,border:"1px solid var(--c-border)"}}/>
                    <div style={{fontSize:10,color:"var(--c-text-muted)",textAlign:"center",marginTop:2}}>CCCD</div>
                  </div>}
                  {h.cardImg&&<div style={{flex:1,minWidth:0}}>
                    <img src={h.cardImg} alt="Thẻ HDV" style={{width:"100%",height:60,objectFit:"cover",borderRadius:6,border:"1px solid var(--c-border)"}}/>
                    <div style={{fontSize:10,color:"var(--c-text-muted)",textAlign:"center",marginTop:2}}>Thẻ HDV</div>
                  </div>}
                </div>
              )}
              {/* Languages */}
              {(h.lang||[]).length>0&&(
                <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
                  {h.lang.map(l=><span key={l} style={{fontSize:10,background:"var(--c-primary-light)",color:"var(--c-primary)",borderRadius:5,padding:"2px 7px",fontWeight:600}}>{LANG_LABEL[l]||l}</span>)}
                </div>
              )}
              {/* Assignments */}
              {assignments.length>0&&(
                <div style={{marginBottom:10,paddingTop:8,borderTop:"1px solid var(--c-surface-3)"}}>
                  <div style={{fontSize:11,color:"var(--c-text-muted)",fontWeight:700,marginBottom:4,letterSpacing:.5}}>ĐANG PHỤ TRÁCH</div>
                  {assignments.map(o=>(
                    <div key={o.id} style={{fontSize:12,color:"var(--c-text-2)"}}>• {o.id} — {o.serviceName||o.tourName||o.service} ({o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"—"})</div>
                  ))}
                </div>
              )}
              {/* Actions */}
              {canEdit&&(
                <div style={{display:"flex",gap:6,marginTop:"auto",paddingTop:10,borderTop:"1px solid var(--c-surface-3)"}}>
                  <button onClick={()=>openEdit(h)} style={{flex:1,background:'var(--c-surface-2)',border:'1px solid var(--c-border)',borderRadius:7,padding:'7px 0',cursor:'pointer',fontSize:12,fontWeight:600}}>✏ Sửa</button>
                  <button onClick={()=>openContract(h)} style={{flex:1,background:'var(--c-primary-light)',color:'var(--c-primary-mid)',border:'1px solid var(--c-primary-pale)',borderRadius:7,padding:'7px 0',cursor:'pointer',fontSize:12,fontWeight:700}}>📄 Tạo HĐ</button>
                  <button onClick={()=>{setAddRatingHdv(h);setRatingForm({score:5,note:'',tourName:''});}} style={{flex:1,background:'var(--c-warning-bg)',color:'var(--c-warning)',border:'1px solid var(--c-warning-border)',borderRadius:7,padding:'7px 0',cursor:'pointer',fontSize:12,fontWeight:700}}>⭐ Chấm</button>
                  {currentRole==='manager'&&<button onClick={()=>deleteHdv(h)} title="Xóa HDV" style={{flexShrink:0,background:'var(--c-danger-bg)',color:'var(--c-danger-mid)',border:'1px solid var(--c-danger-border)',borderRadius:7,padding:'7px 10px',cursor:'pointer',fontSize:12,fontWeight:700}}>🗑</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
