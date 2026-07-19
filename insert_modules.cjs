const fs = require('fs');

const appJsx = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8');
const extracted = fs.readFileSync('C:/minhviet-erp/extracted_modules.js', 'utf8');
const extractedExtra = fs.readFileSync('C:/minhviet-erp/extracted_extra.js', 'utf8');

const stubs = `
function HDVModule({ hdvList=[], onUpdate, orders=[], pushNotif, currentRole }) {
  const [showForm, setShowForm] = React.useState(false);
  const [editHdv, setEditHdv] = React.useState(null);
  const [form, setForm] = React.useState({ name:'', phone:'', email:'', note:'' });
  const save = () => {
    if (!form.name.trim()) return pushNotif('Nhap ten HDV','error');
    if (editHdv) {
      onUpdate(hdvList.map(h=>h.id===editHdv.id?{...h,...form}:h));
    } else {
      onUpdate([...hdvList, {...form, id:'HDV'+Date.now(), active:true}]);
    }
    pushNotif('Da luu HDV');
    setShowForm(false); setForm({name:'',phone:'',email:'',note:''});
  };
  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={{margin:0}}>Huong dan vien ({hdvList.length})</h2>
        {(currentRole==='manager'||currentRole==='dieu_hanh') &&
          <button onClick={()=>{setEditHdv(null);setForm({name:'',phone:'',email:'',note:''});setShowForm(true)}}
            style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer'}}>
            + Them HDV
          </button>}
      </div>
      {showForm && (
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,.1)'}}>
          <h3 style={{marginTop:0}}>{editHdv?'Sua HDV':'Them HDV moi'}</h3>
          {[['Ho ten *','name'],['SDT','phone'],['Email','email'],['Ghi chu','note']].map(([label,key])=>(
            <div key={key} style={{marginBottom:12}}>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>{label}</label>
              <input value={form[key]||''} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',fontSize:14,boxSizing:'border-box'}}/>
            </div>
          ))}
          <div style={{display:'flex',gap:8}}>
            <button onClick={save} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Luu</button>
            <button onClick={()=>setShowForm(false)} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Huy</button>
          </div>
        </div>
      )}
      <div style={{display:'grid',gap:12}}>
        {hdvList.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Chua co HDV nao</div>}
        {hdvList.map(h=>(
          <div key={h.id} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>{h.name}</div>
              <div style={{fontSize:13,color:'#64748b'}}>{h.phone} {h.email ? '- ' + h.email : ''}</div>
            </div>
            {(currentRole==='manager'||currentRole==='dieu_hanh') &&
              <button onClick={()=>{setEditHdv(h);setForm({name:h.name,phone:h.phone||'',email:h.email||'',note:h.note||''});setShowForm(true)}}
                style={{background:'#f1f5f9',border:'none',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:13}}>
                Sua
              </button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AfterSaleModule({ careTasks=[], onUpdateTasks, orders=[], customers=[], currentUser, currentRole, pushNotif }) {
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ orderId:'', type:'call', note:'', dueDate:'' });
  const myTasks = currentRole==='manager' ? careTasks : careTasks.filter(t=>t.assignee===currentUser?.name);
  const save = () => {
    if (!form.orderId) return pushNotif('Chon don hang','error');
    onUpdateTasks([...careTasks, {...form, id:'CARE'+Date.now(), done:false, assignee:currentUser?.name, createdAt:new Date().toISOString()}]);
    pushNotif('Da tao task cham soc');
    setShowForm(false);
    setForm({orderId:'',type:'call',note:'',dueDate:''});
  };
  const toggle = (id) => onUpdateTasks(careTasks.map(t=>t.id===id?{...t,done:!t.done}:t));
  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={{margin:0}}>Cham soc sau ban ({myTasks.filter(t=>!t.done).length} chua xong)</h2>
        <button onClick={()=>setShowForm(true)} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer'}}>+ Tao task</button>
      </div>
      {showForm && (
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,.1)'}}>
          <h3 style={{marginTop:0}}>Task cham soc moi</h3>
          <div style={{marginBottom:12}}>
            <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Don hang</label>
            <select value={form.orderId} onChange={e=>setForm(f=>({...f,orderId:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',fontSize:14}}>
              <option value=''>-- Chon don --</option>
              {orders.map(o=><option key={o.id} value={o.id}>{o.id} - {o.customerName||o.customer}</option>)}
            </select>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Loai</label>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',fontSize:14}}>
              <option value='call'>Goi dien</option>
              <option value='review'>Xin review</option>
              <option value='birthday'>Sinh nhat</option>
              <option value='other'>Khac</option>
            </select>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Ghi chu</label>
            <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={2} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',fontSize:14,boxSizing:'border-box'}}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Ngay hen</label>
            <input type='date' value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} style={{border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',fontSize:14}}/>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={save} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Luu</button>
            <button onClick={()=>setShowForm(false)} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Huy</button>
          </div>
        </div>
      )}
      <div style={{display:'grid',gap:8}}>
        {myTasks.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Khong co task nao</div>}
        {myTasks.map(t=>(
          <div key={t.id} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',display:'flex',gap:12,alignItems:'flex-start'}}>
            <input type='checkbox' checked={!!t.done} onChange={()=>toggle(t.id)} style={{marginTop:3,width:16,height:16,cursor:'pointer'}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600}}>{t.orderId} - {t.type}</div>
              {t.note && <div style={{fontSize:13,color:'#64748b',marginTop:2}}>{t.note}</div>}
              <div style={{fontSize:12,color:'#94a3b8',marginTop:4}}>Hen: {t.dueDate||'—'} - {t.assignee}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TourOpsModule({ orders=[], pushNotif, currentUser, currentRole, hdvList=[] }) {
  const activeOrders = orders.filter(o=>['confirmed','in_progress'].includes(o.status));
  return (
    <div style={{padding:24}}>
      <h2 style={{marginBottom:20}}>Dieu hanh Tour ({activeOrders.length} don dang chay)</h2>
      <div style={{display:'grid',gap:12}}>
        {activeOrders.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Khong co tour nao dang chay</div>}
        {activeOrders.map(o=>(
          <div key={o.id} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>{o.id} - {o.tourName||o.service}</div>
                <div style={{fontSize:13,color:'#64748b',marginTop:4}}>Khach: {o.customerName||o.customer} - Pax: {o.pax||1}</div>
                <div style={{fontSize:13,color:'#64748b'}}>Khoi hanh: {o.departDate||'—'} - HDV: {o.hdvName||'Chua phan cong'}</div>
              </div>
              <span style={{background:o.status==='in_progress'?'#dcfce7':'#fef9c3',color:o.status==='in_progress'?'#16a34a':'#ca8a04',borderRadius:6,padding:'4px 10px',fontSize:12,fontWeight:600}}>
                {o.status==='in_progress'?'Dang chay':'Da xac nhan'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RefundModule({ orders=[], vouchers=[], refunds=[], onRefundUpdate, onRefundCreate, pushNotif, currentRole, currentUser }) {
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ orderId:'', amount:'', reason:'', method:'cash' });
  const save = () => {
    if (!form.orderId||!form.amount) return pushNotif('Dien du thong tin','error');
    const rec = {...form, id:'RF'+Date.now(), amount:Number(form.amount), status:'pending', createdAt:new Date().toISOString(), createdBy:currentUser?.name};
    onRefundCreate(rec);
    pushNotif('Tao phieu hoan tien thanh cong');
    setShowForm(false);
    setForm({orderId:'',amount:'',reason:'',method:'cash'});
  };
  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={{margin:0}}>Hoan tien / Refund ({refunds.length})</h2>
        {(currentRole==='manager'||currentRole==='accountant'||currentRole==='cashier') &&
          <button onClick={()=>setShowForm(true)} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer'}}>+ Tao phieu hoan</button>}
      </div>
      {showForm && (
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,.1)'}}>
          <h3 style={{marginTop:0}}>Phieu hoan tien moi</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Don hang</label>
              <select value={form.orderId} onChange={e=>setForm(f=>({...f,orderId:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px'}}>
                <option value=''>-- Chon don --</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.id}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>So tien hoan (d)</label>
              <input type='number' value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Hinh thuc</label>
              <select value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px'}}>
                <option value='cash'>Tien mat</option>
                <option value='bank'>Chuyen khoan</option>
              </select>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Ly do</label>
              <input value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={save} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Luu</button>
            <button onClick={()=>setShowForm(false)} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Huy</button>
          </div>
        </div>
      )}
      <div style={{display:'grid',gap:8}}>
        {refunds.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Khong co phieu hoan nao</div>}
        {refunds.map(r=>(
          <div key={r.id} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700}}>{r.id} - {r.orderId}</div>
              <div style={{fontSize:13,color:'#64748b'}}>{r.reason} - {r.method==='cash'?'Tien mat':'CK'}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:700,color:'#dc2626'}}>{(r.amount||0).toLocaleString('vi')}d</div>
              <span style={{fontSize:12,background:r.status==='approved'?'#dcfce7':r.status==='rejected'?'#fee2e2':'#fef9c3',color:r.status==='approved'?'#16a34a':r.status==='rejected'?'#dc2626':'#ca8a04',borderRadius:6,padding:'2px 8px'}}>
                {r.status==='approved'?'Da duyet':r.status==='rejected'?'Tu choi':'Cho duyet'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreditModule({ orders=[], pushNotif, credits=[], onUpdateCredits }) {
  const totalCredit = credits.reduce((s,c)=>s+(c.amount||0),0);
  const usedCredit = credits.filter(c=>c.used).reduce((s,c)=>s+(c.amount||0),0);
  return (
    <div style={{padding:24}}>
      <h2 style={{marginBottom:20}}>Tin dung / Credit</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {[['Tong credit','#2563eb',totalCredit],['Da dung','#dc2626',usedCredit],['Con lai','#16a34a',totalCredit-usedCredit]].map(([label,color,val])=>(
          <div key={label} style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,.07)'}}>
            <div style={{fontSize:13,color:'#64748b'}}>{label}</div>
            <div style={{fontSize:22,fontWeight:700,color}}>{val.toLocaleString('vi')}d</div>
          </div>
        ))}
      </div>
      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,.07)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f8fafc'}}>{['ID','Don','So tien','Trang thai'].map(h=><th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:13,fontWeight:600,color:'#64748b'}}>{h}</th>)}</tr></thead>
          <tbody>
            {credits.length===0 && <tr><td colSpan={4} style={{textAlign:'center',color:'#9ca3af',padding:32}}>Khong co credit nao</td></tr>}
            {credits.map(c=>(
              <tr key={c.id} style={{borderTop:'1px solid #f1f5f9'}}>
                <td style={{padding:'12px 16px',fontWeight:600,fontSize:13}}>{c.id}</td>
                <td style={{padding:'12px 16px',fontSize:13}}>{c.orderId||'—'}</td>
                <td style={{padding:'12px 16px',fontWeight:700,color:'#2563eb'}}>{(c.amount||0).toLocaleString('vi')}d</td>
                <td style={{padding:'12px 16px'}}><span style={{fontSize:12,background:c.used?'#fee2e2':'#dcfce7',color:c.used?'#dc2626':'#16a34a',borderRadius:6,padding:'2px 8px'}}>{c.used?'Da dung':'Con han'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeployPanel({ deploySteps=[], onUpdateSteps }) {
  const done = deploySteps.filter(s=>s.done).length;
  return (
    <div style={{padding:24}}>
      <h2 style={{marginBottom:8}}>Tien do trien khai he thong</h2>
      <div style={{fontSize:14,color:'#64748b',marginBottom:20}}>Hoan thanh {done}/{deploySteps.length} buoc</div>
      <div style={{background:'#e2e8f0',borderRadius:8,height:8,marginBottom:24}}>
        <div style={{background:'#2563eb',height:8,borderRadius:8,width:deploySteps.length?((done/deploySteps.length)*100)+'%':'0'}}/>
      </div>
      <div style={{display:'grid',gap:8}}>
        {deploySteps.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Chua co buoc nao</div>}
        {deploySteps.map((s,i)=>(
          <div key={i} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',display:'flex',gap:12,alignItems:'center'}}>
            <input type='checkbox' checked={!!s.done} onChange={()=>onUpdateSteps(deploySteps.map((x,j)=>j===i?{...x,done:!x.done}:x))} style={{width:18,height:18,cursor:'pointer'}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,color:s.done?'#94a3b8':'#1e293b'}}>{s.label||s.name}</div>
              {s.note && <div style={{fontSize:13,color:'#64748b'}}>{s.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

const marker = '\nexport default function App(){';
const idx = appJsx.indexOf(marker);
if (idx < 0) { console.error('Cannot find App function'); process.exit(1); }

const before = appJsx.slice(0, idx);
const after = appJsx.slice(idx);

const newContent = before + '\n' + extracted + '\n' + extractedExtra + '\n' + stubs + after;
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', newContent, 'utf8');
console.log('Written! Lines:', newContent.split('\n').length);
