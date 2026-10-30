import test from 'node:test';
import assert from 'node:assert/strict';
import {accountOrder,orderedAccounts} from './account-order.js';
const accounts=[{id:'cash',name:'現金',opening:100},{id:'bank',name:'銀行',opening:200},{id:'card',name:'信用卡',opening:-50}];
test('saved order applies identically to accounts and filtered payment menus',()=>{
 const sorted=orderedAccounts(accounts,['card','cash','bank']);
 assert.deepEqual(sorted.map(a=>a.id),['card','cash','bank']);
 assert.deepEqual(sorted.filter(a=>a.id!=='card').map(a=>a.id),['cash','bank']);
 assert.equal(sorted[0].opening,-50);assert.deepEqual(accounts.map(a=>a.id),['cash','bank','card']);
});
test('old accounts retain order, new accounts append, deleted IDs and duplicates are ignored',()=>{
 assert.deepEqual(accountOrder(accounts),['cash','bank','card']);
 assert.deepEqual(accountOrder(accounts,['card','missing','card']),['card','cash','bank']);
 assert.deepEqual(accountOrder([...accounts,{id:'new'}],['card','cash','bank']),['card','cash','bank','new']);
 assert.deepEqual(accountOrder(accounts.filter(a=>a.id!=='bank'),['bank','card','cash']),['card','cash']);
 assert.deepEqual(accountOrder(accounts,null),['cash','bank','card']);
});
