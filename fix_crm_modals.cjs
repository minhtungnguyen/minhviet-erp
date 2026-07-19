const fs = require('fs');
const lines = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');

const modals = `
      {showCreateCust&&(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.55)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
          onClick={()=>setShowCreateCust(false)}>
          <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:560,boxShadow:'0 24px 60px rgba(0,0,0,.3)',overflow:'hidden'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:'14px 20px',background:'linear-gradient(135deg,#1e3a8a,#2563eb)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>Tao khach hang moi</div>
              <button onClick={()=>setShowCreateCust(false)} style={{background:'rgba(255,255,255,.15)',border:'none',color:'#fff',fontSize:20,cursor:'pointer',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center'}}>x</button>
            </div>
            <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:12,maxHeight:'70vh',overflowY:'auto'}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:6}}>Loai khach hang</div>
                <div style={{display:'flex',gap:8}}>
                  {[['personal','Ca nhan'],['business','Doanh nghiep']].map(([v,l])=>(
                    <button key={v} onClick={()=>setNewCustForm(f=>({...f,type:v}))}
                      style={{flex:1,padding:'8px',borderRadius:8,
                        background:newCustForm.type===v?'#eff6ff':'#fff',color:newCustForm.type===v?'#1e3a8a':'#64748b',
                        border:'2px solid '+(newCustForm.type===v?'#2563eb':'#e0e7ff'),
                        fontWeight:newCustForm.type===v?700:400,fontSize:13,cursor:'pointer'}}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:4}}>Ho ten *</div>
                  <input value={newCustForm.name} onChange={e=>setNewCustForm(f=>({...f,name:e.target.value}))}
                    placeholder='Nguyen Van A' style={{width:'100%',padding:'8px 10px',border:'1px solid #dbeafe',borderRadius:8,fontSize:13,boxSizing:'border-box',outline:'none'}}/>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:4}}>So dien thoai *</div>
                  <input value={newCustForm.phone} onChange={e=>setNewCustForm(f=>({...f,phone:e.target.value}))}
                    placeholder='0912345678' style={{width:'100%',padding:'8px 10px',border:'1px solid #dbeafe',borderRadius:8,fontSize:13,boxSizing:'border-box',outline:'none'}}/>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:4}}>Email</div>
                  <input value={newCustForm.email} onChange={e=>setNewCustForm(f=>({...f,email:e.target.value}))}
                    placeholder='email@gmail.com' style={{width:'100%',padding:'8px 10px',border:'1px solid #dbeafe',borderRadius:8,fontSize:13,boxSizing:'border-box',outline:'none'}}/>
                </div>
                {newCustForm.type==='personal'?(
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:4}}>Ngay sinh</div>
                    <input type='date' value={newCustForm.dob} onChange={e=>setNewCustForm(f=>({...f,dob:e.target.value}))}
                      style={{width:'100%',padding:'8px 10px',border:'1px solid #dbeafe',borderRadius:8,fontSize:13,boxSizing:'border-box',outline:'none'}}/>
                  </div>
                ):(
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:4}}>Ten cong ty</div>
                    <input value={newCustForm.companyName} onChange={e=>setNewCustForm(f=>({...f,companyName:e.target.value}))}
                      placeholder='Cong ty ABC' style={{width:'100%',padding:'8px 10px',border:'1px solid #dbeafe',borderRadius:8,fontSize:13,boxSizing:'border-box',outline:'none'}}/>
                  </div>
                )}
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:4}}>Nguon khach</div>
                  <Sel value={newCustForm.source} onChange={e=>setNewCustForm(f=>({...f,source:e.target.value}))} style={{width:'100%',padding:'8px 10px',fontSize:13}}>
                    <option value=''>-- Chon nguon --</option>
                    {['Nguoi than gioi thieu','Mang xa hoi','Website','Zalo','Khac'].map(s=><option key={s} value={s}>{s}</option>)}
                  </Sel>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:4}}>Ghi chu</div>
                  <input value={newCustForm.notes} onChange={e=>setNewCustForm(f=>({...f,notes:e.target.value}))}
                    placeholder='Ghi chu them...' style={{width:'100%',padding:'8px 10px',border:'1px solid #dbeafe',borderRadius:8,fontSize:13,boxSizing:'border-box',outline:'none'}}/>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,paddingTop:8,borderTop:'1px solid #e0e7ff'}}>
                <Btn variant='outline' onClick={()=>setShowCreateCust(false)}>Huy</Btn>
                <Btn onClick={()=>{
                  if(!newCustForm.name.trim()||!newCustForm.phone.trim()){pushNotif('Can nhap ten va SDT','error');return;}
                  const nc={...newCustForm,id:genId(),createdAt:NOW_ISO,totalRevenue:0,totalPaid:0,events:[],tags:[]};
                  syncCustomers(cs=>[...cs,nc]);
                  pushNotif('Da tao khach hang: '+nc.name,'success');
                  setShowCreateCust(false);
                  setNewCustForm({type:'personal',name:'',phone:'',email:'',dob:'',companyName:'',province:'',source:'',assignedSale:'',notes:''});
                  setSelected(nc); setSubView('detail');
                }}>Luu khach hang</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportCrm&&(
        <ImportExcelModal
          mode="customer"
          existingItems={customers}
          pushNotif={pushNotif}
          onClose={()=>setShowImportCrm(false)}
          onImport={(newItems, dupMode)=>{
            syncCustomers(cs=>{
              if(dupMode==="overwrite"){
                const merged=[...cs];
                newItems.forEach(ni=>{
                  const idx=merged.findIndex(x=>x.phone===ni.phone);
                  if(idx>=0) merged[idx]={...merged[idx],...ni};
                  else merged.push(ni);
                });
                return merged;
              }
              const existing=new Set(cs.map(x=>x.phone));
              return [...cs, ...newItems.filter(ni=>!existing.has(ni.phone))];
            });
            pushNotif('Da import '+newItems.length+' khach hang vao CRM',"success");
          }}
        />
      )}`;

// Insert before line 3382 (index 3381) which is `    </div>` (CrmModule closing)
const insertIdx = 3381;
const newLines = [...lines.slice(0, insertIdx), modals, ...lines.slice(insertIdx)];
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', newLines.join('\n'), 'utf8');
console.log('After insert. Lines:', newLines.length);

// Now remove the orphaned blocks. After inserting ~100 lines at 3381,
// old lines 3451-3573 are now at ~3451+100=3551 to 3573+100=3673
// But they start with the orphaned showCreateCust block.
// Let's re-read to find them
const lines2 = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
for (let i=3540; i<3700; i++) {
  if (lines2[i] && lines2[i].includes('showCreateCust&&')) {
    console.log('orphaned showCreateCust at line:', i+1);
  }
}
