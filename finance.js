export const currencies = {TWD:'台幣',JPY:'日圓',KRW:'韓元',USD:'美元',EUR:'歐元',GBP:'英鎊',AUD:'澳幣'};
export const roundMoney = n => Math.round((Number(n)+Number.EPSILON)*100)/100;
export const isCredit = a => !!a && (a.type === 'credit' || (!a.type && (a.id === 'credit' || a.name.includes('信用卡'))));
export const balanceOf = (a, entries) => roundMoney(entries.reduce((sum,e)=>sum+(e.account===a.id?(e.type==='income'?e.amount:-e.amount):0)+(e.type==='transfer'&&e.to===a.id?e.amount:0),Number(a.opening)||0));
export function dateAt(year,month,day){const d=new Date(year,month,Math.min(day,new Date(year,month+1,0).getDate()),12);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function cardStatement(card,entries,month,today){
 if(!card.closingDay||!card.dueDay)return null;
 const y=Number(month.slice(0,4)),m=Number(month.slice(5))-1,due=dateAt(y,m,card.dueDay);
 let closing=dateAt(y,m,card.closingDay);if(closing>=due)closing=dateAt(y,m-1,card.closingDay);
 const cy=Number(closing.slice(0,4)),cm=Number(closing.slice(5))-1,previous=dateAt(cy,cm-1,card.closingDay);
 // All repayments/refunds through today reduce already-billed debt first (FIFO).
 const charges=entries.filter(e=>e.account===card.id&&e.type!=='income'&&e.date<=closing).reduce((sum,e)=>sum+e.amount,0);
 const credits=entries.filter(e=>e.date<=today&&((e.account===card.id&&e.type==='income')||(e.type==='transfer'&&e.to===card.id))).reduce((sum,e)=>sum+e.amount,0);
 const outstanding=roundMoney(Math.max(0,-(Number(card.opening)||0)+charges-credits));
 return {due,closing,previous,outstanding,closed:today>=closing,overdue:today>due&&outstanding>0};
}
export function tripTotals(trip){const totals={};for(const r of trip.records||[])totals[r.account]=roundMoney((totals[r.account]||0)+roundMoney(r.amount*r.rate));return totals}
export function settlementPlan(trip,amounts,date,accounts){
 if(!trip.records?.length)throw Error('旅程沒有支出紀錄');
 if(date<trip.end)throw Error('入帳日期不能早於旅程結束日期');
 const expected=Object.keys(tripTotals(trip)).sort(),actual=Object.keys(amounts).sort();
 if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error('付款來源已變更，請重新開啟結算畫面');
 return expected.map(id=>{const amount=Number(amounts[id]);if(!accounts.some(a=>a.id===id))throw Error('付款帳戶已不存在');if(!Number.isFinite(amount)||amount<0||amount>999999999)throw Error('請輸入有效的台幣金額');return {kind:'entries',id:`trip-${trip.id}-${id}`,value:{id:`trip-${trip.id}-${id}`,type:'expense',amount:roundMoney(amount),date,account:id,to:'',category:'trip-expense',note:`旅遊結算｜${trip.name}`,tripId:trip.id,created:trip.created}}});
}
