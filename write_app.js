const fs = require('fs');
const lines = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');

const minimalApp = `export default function App(){
  const [currentUser, setCurrentUser] = React.useState(null);
  const [view, setView] = React.useState("dashboard");
  const [orders, setOrders] = React.useState(SEED_ORDERS);
  const [vouchers, setVouchers] = React.useState(SEED_VOUCHERS);
  const [expenses, setExpenses] = React.useState(SEED_EXPENSES);
  const [refunds, setRefunds] = React.useState(SEED_REFUNDS);
  const [customers, setCustomers] = React.useState(SEED_CUSTOMERS);
  const [userAccounts, setUserAccounts] = React.useState(USER_ACCOUNTS);
  const [quotes, setQuotes] = React.useState([]);
  const [tourPrograms, setTourPrograms] = React.useState(SEED_TOUR_PROGRAMS);
  const [bankAccounts, setBankAccounts] = React.useState(SEED_BANK_ACCOUNTS);
  const [personalTargets, setPersonalTargets] = React.useState(SEED_PERSONAL_TARGETS);
  const [outputInvoices, setOutputInvoices] = React.useState(SEED_OUTPUT_INVOICES);
  const [inputInvoices, setInputInvoices] = React.useState(SEED_INPUT_INVOICES);
  const [bookings, setBookings] = React.useState(SEED_NCC_BOOKINGS);
  const [credits, setCredits] = React.useState(SEED_CREDITS);
  const [notifs, setNotifs] = React.useState([]);
  const [nccListGlobal, setNccListGlobal] = React.useState(SEED_NCC_MASTER);
  const [hdvList, setHdvList] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [careTasks, setCareTasks] = React.useState([]);
  const [msgHistory, setMsgHistory] = React.useState([]);
  const [approvalThreshold, setApprovalThreshold] = React.useState(20000000);
  const [showNotif, setShowNotif] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);

  const currentRole = currentUser?.role || "sale";

  const pushToast = (msg, type="success") => {
    const id = Date.now();
    setToasts(t => [...t, {id, msg, type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const pushNotif = (msg, type, extra={}) => {
    const id = Date.now();
    setNotifs(n => [{id, msg, type, time: new Date().toISOString(), read: false, ...extra}, ...n]);
    pushToast(msg, type === "success" ? "success" : "error");
  };

  if(!currentUser){
    return <LoginPage onLogin={u => setCurrentUser(u)} userAccounts={userAccounts}/>;
  }

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      <Sidebar
        currentRole={currentRole}
        view={view}
        onNav={v => setView(v)}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        notifs={notifs}
        onNotif={() => setShowNotif(v => !v)}
        onSearch={() => setShowSearch(true)}
      >
        {view==="orders" && <OrderList orders={orders} vouchers={vouchers} onView={o=>{setSelected(o);setView("detail");}} onCreate={()=>setView("create")} currentRole={currentRole} currentUser={currentUser}/>}
        {view==="create" && <OrderForm onSave={d=>{const newId="DH"+Date.now();setOrders(p=>[{...d,id:newId,createdAt:new Date().toISOString(),status:"pending_payment",totalPaid:0},...p]);setView("orders");pushNotif("Da tao don "+newId,"success");}} onCancel={()=>setView("orders")} pushNotif={pushToast} defaultSale={currentUser.name} currentRole={currentRole} customers={customers} onCreateCustomer={()=>setView("crm")}/>}
        {view==="detail"&&selected && <OrderDetail order={selected} vouchers={vouchers} expenses={expenses} onBack={()=>setView("orders")} onUpdate={o=>setOrders(ps=>ps.map(x=>x.id===o.id?o:x))} onAddVoucher={v=>setVouchers(p=>[...p,v])} onApprove={id=>setVouchers(vs=>vs.map(v=>v.id===id?{...v,status:"approved"}:v))} onReject={id=>setVouchers(vs=>vs.map(v=>v.id===id?{...v,status:"rejected"}:v))} pushNotif={pushToast} currentRole={currentRole} bankAccounts={bankAccounts} currentUser={currentUser}/>}
        {view==="dashboard" && <div style={{padding:24}}><h2>Dashboard - {currentUser.name}</h2><p>Chao mung ban den voi Minh Viet ERP. He thong dang duoc phuc hoi.</p></div>}
        {view==="crm" && <CrmModule orders={orders} pushNotif={pushNotif} customers={customers} onUpdateCustomers={setCustomers} currentUser={currentUser} msgHistory={msgHistory} onLogMessage={m=>setMsgHistory(h=>[...h,m])} onCreateOrderFromLead={()=>setView("create")}/>}
        {view==="ncc" && <NCCDashboard orders={orders} vouchers={vouchers} pushNotif={pushNotif} currentRole={currentRole} onCreateExpense={e=>setExpenses(p=>[...p,e])} currentUser={currentUser} bookings={bookings} onUpdateBookings={setBookings}/>}
        {view==="quote" && <QuoteModule quotes={quotes} onUpdate={setQuotes} orders={orders} tourPrograms={tourPrograms} currentUser={currentUser} pushNotif={pushNotif} onCreateOrder={()=>setView("create")}/>}
        {view==="invoice" && <InvoiceModule orders={orders} outputInvoices={outputInvoices} onUpdateOutputInvoices={setOutputInvoices} inputInvoices={inputInvoices} onUpdateInputInvoices={setInputInvoices} vouchers={vouchers} pushNotif={pushNotif} currentUser={currentUser}/>}
        {view==="report" && <ReportModule orders={orders} vouchers={vouchers} expenses={expenses} personalTargets={personalTargets} currentRole={currentRole}/>}
        {view==="approvals" && <ApprovalsModule orders={orders} expenses={expenses} onExpenseUpdate={e=>setExpenses(es=>es.map(x=>x.id===e.id?e:x))} pushNotif={pushNotif} currentRole={currentRole} currentUser={currentUser} approvalThreshold={approvalThreshold}/>}
        {view==="users" && <UserManagementPage userAccounts={userAccounts} onUpdateAccounts={setUserAccounts} currentUser={currentUser} pushNotif={pushNotif} personalTargets={personalTargets} onUpdateTargets={setPersonalTargets} approvalThreshold={approvalThreshold} onUpdateThreshold={setApprovalThreshold}/>}
        {view==="profile" && <ProfilePage currentUser={currentUser} onUpdate={setCurrentUser} onBack={()=>setView("dashboard")} pushNotif={pushNotif}/>}
        {view==="tour" && <TourProgramModule tourPrograms={tourPrograms} onUpdate={setTourPrograms} currentRole={currentRole} pushNotif={pushNotif} currentUser={currentUser}/>}
        {view==="accounting" && <AccountingDashboard orders={orders} vouchers={vouchers} expenses={expenses} personalTargets={personalTargets} onUpdateTargets={setPersonalTargets} userAccounts={userAccounts} customers={customers}/>}
        {view==="close" && <CloseOrderModule orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} onCloseOrder={o=>setOrders(ps=>ps.map(x=>x.id===o.id?o:x))} pushNotif={pushNotif} currentRole={currentRole} currentUser={currentUser}/>}
        {view==="refund" && <CreditModule orders={orders} pushNotif={pushNotif} credits={credits} onUpdateCredits={setCredits}/>}
        {view==="tourghep" && <TourGhepModule products={products} onUpdate={setProducts} orders={orders} currentRole={currentRole} currentUser={currentUser} pushNotif={pushNotif} onCreateOrder={()=>setView("create")}/>}
        {view==="aftersale" && <AfterSaleModule careTasks={careTasks} onUpdateTasks={setCareTasks} orders={orders} customers={customers} currentUser={currentUser} currentRole={currentRole} pushNotif={pushNotif}/>}
        {view==="hdv" && <HDVModule hdvList={hdvList} onUpdate={setHdvList} pushNotif={pushNotif} orders={orders}/>}
      </Sidebar>
      {toasts.map(t => (
        <div key={t.id} style={{position:"fixed",bottom:24,right:24,background:t.type==="error"?"#ef4444":"#22c55e",color:"#fff",padding:"12px 20px",borderRadius:8,zIndex:9999,boxShadow:"0 4px 16px rgba(0,0,0,.2)"}}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}`;

// Find App function start
let appStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^export default function App\(\)/.test(lines[i])) { appStart = i; break; }
}
console.log('App starts at line:', appStart + 1);
lines.splice(appStart, lines.length - appStart, ...minimalApp.split('\n'));
console.log('Lines after:', lines.length);
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', lines.join('\n'), 'utf8');
