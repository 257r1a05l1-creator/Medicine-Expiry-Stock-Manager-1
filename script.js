const KEY="medstock_data_v1";
const sample=[
 {id:1,name:"Paracetamol 500mg",batch:"PCM1026",category:"Tablet",manufacturer:"ABC Pharma",quantity:120,minimum:20,mfg:"2025-10-10",expiry:"2027-02-15",price:2.5,supplier:"City Medicals"},
 {id:2,name:"Amoxicillin 250mg",batch:"AMX2209",category:"Capsule",manufacturer:"MediCare",quantity:12,minimum:20,mfg:"2025-04-08",expiry:"2026-10-18",price:6,supplier:"HealthPlus"},
 {id:3,name:"Cough Syrup",batch:"CS7741",category:"Syrup",manufacturer:"WellLife",quantity:8,minimum:10,mfg:"2025-01-12",expiry:"2026-10-05",price:85,supplier:"Medi Suppliers"},
 {id:4,name:"Ibuprofen 400mg",batch:"IB4550",category:"Tablet",manufacturer:"Nova Labs",quantity:5,minimum:15,mfg:"2024-08-01",expiry:"2026-08-20",price:4,supplier:"City Medicals"}
];
let medicines=JSON.parse(localStorage.getItem(KEY)||"null")||sample;
let editing=false;

const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(medicines));renderAll()}
function daysUntil(date){return Math.ceil((new Date(date+"T23:59:59")-new Date())/86400000)}
function expiryStatus(m){
 const d=daysUntil(m.expiry);
 if(d<0)return "expired";
 if(d<=30)return "soon";
 return "safe";
}
function stockStatus(m){return Number(m.quantity)<=Number(m.minimum)}
function badge(status){
 const text={safe:"Safe",soon:"Expiring Soon",expired:"Expired",low:"Low Stock"};
 return `<span class="badge ${status}">${text[status]}</span>`;
}
function renderDashboard(){
 $("totalCount").textContent=medicines.length;
 $("lowCount").textContent=medicines.filter(stockStatus).length;
 $("soonCount").textContent=medicines.filter(m=>expiryStatus(m)==="soon").length;
 $("expiredCount").textContent=medicines.filter(m=>expiryStatus(m)==="expired").length;
 const rows=medicines.slice(-5).reverse();
 $("recentTable").innerHTML=rows.length?rows.map(m=>`<tr><td><span class="medicine-name">${esc(m.name)}</span></td><td>${esc(m.batch)}</td><td>${m.quantity}</td><td>${formatDate(m.expiry)}</td><td>${stockStatus(m)?badge("low"):badge("safe")}</td><td>${badge(expiryStatus(m))}</td></tr>`).join(""):`<tr><td colspan="6" class="empty">No medicines added.</td></tr>`;
}
function renderInventory(){
 const q=$("searchInput").value.toLowerCase(), f=$("statusFilter").value;
 let arr=medicines.filter(m=>{
   const match=[m.name,m.batch,m.category,m.manufacturer].join(" ").toLowerCase().includes(q);
   const es=expiryStatus(m), ls=stockStatus(m);
   const fm=f==="all"||f===es||(f==="low"&&ls);
   return match&&fm;
 });
 $("inventoryTable").innerHTML=arr.length?arr.map(m=>`<tr>
 <td><span class="medicine-name">${esc(m.name)}</span><div class="muted">${esc(m.manufacturer||"")}</div></td>
 <td>${esc(m.batch)}</td><td>${esc(m.category)}</td><td>${m.quantity}</td><td>${formatDate(m.expiry)}</td>
 <td>${badge(expiryStatus(m))} ${stockStatus(m)?badge("low"):""}</td>
 <td><button class="action-btn" onclick="editMedicine(${m.id})">Edit</button><button class="action-btn delete-btn" onclick="deleteMedicine(${m.id})">Delete</button></td>
 </tr>`).join(""):`<tr><td colspan="7" class="empty">No matching medicines.</td></tr>`;
}
function renderAlerts(){
 const exp=medicines.filter(m=>["soon","expired"].includes(expiryStatus(m)));
 const low=medicines.filter(stockStatus);
 $("alertExpiryCount").textContent=exp.length;$("alertStockCount").textContent=low.length;
 let html="";
 exp.forEach(m=>{const s=expiryStatus(m);html+=`<div class="alert-item ${s==="expired"?"danger":""}"><strong>${esc(m.name)}</strong> — ${s==="expired"?"Expired":"Expires soon"} on ${formatDate(m.expiry)} (Batch ${esc(m.batch)}).</div>`});
 low.forEach(m=>html+=`<div class="alert-item stock"><strong>${esc(m.name)}</strong> — Low stock: ${m.quantity} left, minimum is ${m.minimum}.</div>`);
 $("alertsList").innerHTML=html||`<div class="empty">✓ No alerts. Everything looks good.</div>`;
}
function renderAll(){renderDashboard();renderInventory();renderAlerts()}
function formatDate(d){if(!d)return "—";return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function showSection(id){
 document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active",s.id===id));
 document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.section===id));
 $("pageTitle").textContent={dashboard:"Dashboard",inventory:"Medicine Inventory",add:editing?"Edit Medicine":"Add Medicine",alerts:"Alerts"}[id];
 window.scrollTo({top:0,behavior:"smooth"});
}
function resetForm(){
 editing=false;$("medicineForm").reset();$("medicineId").value="";$("formTitle").textContent="Add Medicine";showSection("add");
}
function editMedicine(id){
 const m=medicines.find(x=>x.id===id);if(!m)return;
 editing=true;$("medicineId").value=m.id;
 ["name","batch","category","manufacturer","quantity","minimum","mfg","expiry","price","supplier"].forEach(k=>$(k).value=m[k]??"");
 $("formTitle").textContent="Edit Medicine";showSection("add");
}
function deleteMedicine(id){
 const m=medicines.find(x=>x.id===id);if(!m)return;
 if(confirm(`Delete ${m.name}?`)){medicines=medicines.filter(x=>x.id!==id);save();toast("Medicine deleted.");}
}
$("medicineForm").addEventListener("submit",e=>{
 e.preventDefault();
 const obj={name:$("name").value.trim(),batch:$("batch").value.trim(),category:$("category").value,manufacturer:$("manufacturer").value.trim(),quantity:Number($("quantity").value),minimum:Number($("minimum").value),mfg:$("mfg").value,expiry:$("expiry").value,price:Number($("price").value||0),supplier:$("supplier").value.trim()};
 if(editing){const id=Number($("medicineId").value);medicines=medicines.map(m=>m.id===id?{...m,...obj}:m);toast("Medicine updated.");}
 else{obj.id=Date.now();medicines.push(obj);toast("Medicine added.");}
 save();resetForm();showSection("inventory");
});
document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.section)));
$("quickAdd").onclick=resetForm;$("inventoryAdd").onclick=resetForm;$("viewInventory").onclick=()=>showSection("inventory");$("cancelEdit").onclick=resetForm;
$("searchInput").addEventListener("input",renderInventory);$("statusFilter").addEventListener("change",renderInventory);
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
renderAll();
