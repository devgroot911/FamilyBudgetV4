const fs = require('fs');

const logic = `

// ============================================================
// Cross-House Transfers (Accountant Only)
// ============================================================
function fbRenderCrossHouse(container) {
  var vName = window.fbState.activeVillage;
  var houses = getVillageHouses(vName);
  var houseOptions = '<option value="">Select House...</option>';
  houses.forEach(function(h) {
    houseOptions += '<option value="'+h.house_no+'">House '+h.house_no+' ('+escapeHtml(h.mother_name)+')</option>';
  });

  var html = '<div class="panel" style="padding:20px;">' +
    '<div class="section-heading" style="margin-bottom:20px;"><div><h2 style="margin:0; font-size:18px;">Cross-House Manual Transfers</h2><small>' + vName + ' - ' + window.fbState.activeYear + '-' + window.fbState.activeMonth + '</small></div></div>' +
    '<p style="color:#666; font-size:13px; margin-bottom:20px;">Move funds between balances across different houses (or within the same house). Both houses will be updated and audited simultaneously.</p>' +
    
    '<div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:20px;">' +
      // Source
      '<div style="flex:1; min-width:250px; background:#f9f9f9; padding:15px; border-radius:6px; border:1px solid #ddd;">' +
        '<h3 style="margin:0 0 10px 0; font-size:15px; color:#c0392b;">Source (Deduct From)</h3>' +
        '<div class="field"><label>House</label><select id="xh-src-house" onchange="fbUpdateCrossHouseBalances(\\'src\\')">' + houseOptions + '</select></div>' +
        '<div class="field"><label>Balance Account</label><select id="xh-src-account" onchange="fbUpdateCrossHouseBalances(\\'src\\')">' +
          '<option value="food_balance">Food</option>' +
          '<option value="clothing_balance">Clothing</option>' +
          '<option value="household_balance">Household</option>' +
          '<option value="interest_balance">Interest</option>' +
        '</select></div>' +
        '<div style="font-size:13px; color:#555;">Current Available: <strong id="xh-src-avail">LKR 0.00</strong></div>' +
      '</div>' +
      
      // Destination
      '<div style="flex:1; min-width:250px; background:#f9f9f9; padding:15px; border-radius:6px; border:1px solid #ddd;">' +
        '<h3 style="margin:0 0 10px 0; font-size:15px; color:#27ae60;">Destination (Add To)</h3>' +
        '<div class="field"><label>House</label><select id="xh-dest-house" onchange="fbUpdateCrossHouseBalances(\\'dest\\')">' + houseOptions + '</select></div>' +
        '<div class="field"><label>Balance Account</label><select id="xh-dest-account" onchange="fbUpdateCrossHouseBalances(\\'dest\\')">' +
          '<option value="food_balance">Food</option>' +
          '<option value="clothing_balance">Clothing</option>' +
          '<option value="household_balance">Household</option>' +
          '<option value="interest_balance">Interest</option>' +
        '</select></div>' +
        '<div style="font-size:13px; color:#555;">Current Available: <strong id="xh-dest-avail">LKR 0.00</strong></div>' +
      '</div>' +
    '</div>' +
    
    '<div class="field" style="max-width:300px;"><label>Amount to Transfer (LKR)</label><input type="number" id="xh-amount" class="form-control" placeholder="0.00" min="0"></div>' +
    
    '<hr style="margin:20px 0; border:0; border-top:1px solid #eee;">' +
    '<div style="display:flex; justify-content:flex-end; align-items:center;">' +
       '<span id="xh-error" style="color:#c0392b; font-weight:bold; margin-right:15px;"></span>' +
       '<button class="primary-button" onclick="fbExecuteCrossHouseTransfer()">Execute Transfer</button>' +
    '</div>' +
  '</div>';
  
  container.innerHTML = html;
}

function _xhGetLiveHouseBalances(houseNo) {
  var vName = window.fbState.activeVillage;
  var existing = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(houseNo); }) || {};
  
  var dummyCounts = {
    food_o12: existing.food_o12||0, food_u12: existing.food_u12||0, mother_count: existing.mother_count||1,
    aunt_amount: existing.aunt_amount||0, adjustment: existing.adjustment||0, festival: existing.festival||0,
    clothing_o12: existing.clothing_o12||0, clothing_u12: existing.clothing_u12||0,
    household: existing.household||0, arrears: existing.arrears||0
  };
  
  var prevBalances = getPreviousBalances(houseNo, window.fbState.activeYear, window.fbState.activeMonth);
  if (!prevBalances) {
      prevBalances = { food: 0, clothing: 0, household: 0, interest: 0, isManual: true };
  }
  
  // Unpack existing remarks to get any previous transfers!
  var existingTransfers = [];
  var openingObj = undefined;
  if (existing.remarks) {
     try {
       var r = JSON.parse(existing.remarks);
       if (r.transfers) existingTransfers = r.transfers;
       if (r.opening) openingObj = r.opening;
     } catch(e){}
  }
  
  if (openingObj && prevBalances.isManual) {
     prevBalances.food = openingObj.food || prevBalances.food;
     prevBalances.clothing = openingObj.cloth || prevBalances.clothing;
     prevBalances.household = openingObj.hh || prevBalances.household;
     prevBalances.interest = openingObj.int || prevBalances.interest;
  }
  
  var calcs = calculateHouseBudget(dummyCounts, window.fbState.rateVariables, prevBalances);
  
  // Apply existing transfers to the base calcs
  existingTransfers.forEach(function(t) {
     if (t.indexOf("from Food") !== -1) calcs.food_balance -= t.amount || 0; // The string parsing would be hard. 
     // Wait, the previous logic stored transfers as strings! "Transferred LKR 500 from Food to Clothing".
     // But wait, the standard UI dynamically builds calcs and THEN saves. The saved JSON has \`transfers\` array of strings, but doesn't mathematically reapply them easily without parsing.
     // Actually, if it's already saved, the ending balances are in r.ending!
  });
  
  // Better approach: Just read r.ending if it exists, otherwise fall back to calcs!
  var finalBal = { food: calcs.food_balance, clothing: calcs.clothing_balance, household: calcs.household_balance, interest: calcs.interest_balance, existingRow: existing, openingObj: openingObj, existingTransfers: existingTransfers, calcs: calcs };
  
  if (existing.remarks) {
     try {
        var r = JSON.parse(existing.remarks);
        if (r.ending) {
           finalBal.food = r.ending.food;
           finalBal.clothing = r.ending.cloth;
           finalBal.household = r.ending.hh;
           finalBal.interest = r.ending.int;
        }
     } catch(e) {}
  }
  return finalBal;
}

window.fbUpdateCrossHouseBalances = function(side) {
  var hSelect = document.getElementById('xh-' + side + '-house');
  var aSelect = document.getElementById('xh-' + side + '-account');
  var availLabel = document.getElementById('xh-' + side + '-avail');
  
  var houseNo = hSelect.value;
  if (!houseNo) { availLabel.innerText = "LKR 0.00"; return; }
  
  var data = _xhGetLiveHouseBalances(houseNo);
  var acct = aSelect.value; // e.g., 'food_balance'
  var val = 0;
  if (acct === 'food_balance') val = data.food;
  if (acct === 'clothing_balance') val = data.clothing;
  if (acct === 'household_balance') val = data.household;
  if (acct === 'interest_balance') val = data.interest;
  
  availLabel.innerText = "LKR " + val.toLocaleString(undefined, {minimumFractionDigits:2});
  if (val < 0) availLabel.style.color = '#c0392b'; else availLabel.style.color = '#27ae60';
};

window.fbExecuteCrossHouseTransfer = function() {
  var sHouse = document.getElementById('xh-src-house').value;
  var sAcct = document.getElementById('xh-src-account').value;
  var dHouse = document.getElementById('xh-dest-house').value;
  var dAcct = document.getElementById('xh-dest-account').value;
  var amtRaw = document.getElementById('xh-amount').value;
  var err = document.getElementById('xh-error');
  err.innerText = '';
  
  if (!sHouse) return err.innerText = 'Select a Source House.';
  if (!dHouse) return err.innerText = 'Select a Destination House.';
  if (!amtRaw || isNaN(Number(amtRaw)) || Number(amtRaw) <= 0) return err.innerText = 'Enter a valid amount greater than 0.';
  
  var amt = Number(amtRaw);
  var srcData = _xhGetLiveHouseBalances(sHouse);
  var destData = _xhGetLiveHouseBalances(dHouse);
  
  var sVal = sAcct === 'food_balance' ? srcData.food : (sAcct === 'clothing_balance' ? srcData.clothing : (sAcct === 'household_balance' ? srcData.household : srcData.interest));
  
  if (amt > sVal) {
     if (!confirm('Warning: This transfer will push the Source House balance into the negative. Proceed anyway?')) {
        return;
     }
  }
  
  var payloadSrc = _buildXhPayload(srcData, sHouse, sAcct, -amt, "Transferred LKR " + amt + " to House " + dHouse + " (" + dAcct.split('_')[0] + ")");
  var payloadDest = _buildXhPayload(destData, dHouse, dAcct, amt, "Received LKR " + amt + " from House " + sHouse + " (" + sAcct.split('_')[0] + ")");
  
  var payloads = [];
  payloads.push(payloadSrc);
  if (sHouse !== dHouse) payloads.push(payloadDest);
  else {
     // If same house, just apply both math ops to one payload
     payloadSrc[dAcct] += amt; // Add the amount to the destination account (since it's the same payload)
     // Also update the remarks
     var r = JSON.parse(payloadSrc.remarks);
     r.ending[dAcct.replace('_balance', '').replace('clothing', 'cloth').replace('household', 'hh').replace('interest', 'int')] += amt;
     // Add second transfer log
     r.transfers.push("Received LKR " + amt + " from House " + sHouse + " (" + sAcct.split('_')[0] + ")");
     payloadSrc.remarks = JSON.stringify(r);
  }
  
  // Clean schemas
  payloads.forEach(function(clean) {
    clean.open_food = null; clean.open_cloth = null; clean.open_hh = null; clean.open_int = null;
    delete clean.id;
    delete clean.created_at;
    delete clean.food_balance;
    delete clean.clothing_balance;
    delete clean.household_balance;
    delete clean.interest_balance;
    delete clean.open_food;
    delete clean.open_cloth;
    delete clean.open_hh;
    delete clean.open_int;
  });
  
  fbAlert('Saving cross-house transfer...');
  
  supabase.from('fb_child_counts').upsert(payloads, { onConflict: 'village, year, month, house_no' }).select().then(function(res) {
     if (res.error) throw res.error;
     
     // Update UI models
     (res.data || []).forEach(function(row) {
          var idx = window.fbState.childCounts.findIndex(function(c) { return String(c.house_no) === String(row.house_no); });
          if(idx > -1) window.fbState.childCounts[idx] = row; else window.fbState.childCounts.push(row);
          var hIdx = window.fbState.historicalCounts.findIndex(function(c) { return String(c.house_no) === String(row.house_no) && c.year === row.year && c.month === row.month; });
          if(hIdx > -1) window.fbState.historicalCounts[hIdx] = row; else window.fbState.historicalCounts.push(row);
     });
     
     fbAlert('Transfer successful!');
     
     // Notifications
     if (typeof sendNotification === 'function') {
         sendNotification(window.fbState.activeVillage, "Accountant transfer of LKR " + amt + " completed for House " + sHouse);
         if (sHouse !== dHouse) sendNotification(window.fbState.activeVillage, "House " + dHouse + " received Accountant transfer of LKR " + amt);
     }
     
     document.getElementById('xh-amount').value = '';
     fbUpdateCrossHouseBalances('src');
     fbUpdateCrossHouseBalances('dest');
     
  }).catch(function(err) {
     fbAlert('Error saving transfer: ' + err.message);
  });
};

function _buildXhPayload(data, houseNo, adjustAcct, adjustAmt, logString) {
  var p = Object.assign({}, data.existingRow);
  p.village = window.fbState.activeVillage;
  p.year = window.fbState.activeYear;
  p.month = window.fbState.activeMonth;
  p.house_no = houseNo;
  var motherName = p.mother_name || (getVillageHouses(p.village).find(function(h){return h.house_no==houseNo;})||{}).mother_name;
  p.mother_name = motherName;
  
  var f = data.food, c = data.clothing, h = data.household, i = data.interest;
  if (adjustAcct === 'food_balance') f += adjustAmt;
  if (adjustAcct === 'clothing_balance') c += adjustAmt;
  if (adjustAcct === 'household_balance') h += adjustAmt;
  if (adjustAcct === 'interest_balance') i += adjustAmt;
  
  var logs = data.existingTransfers.slice();
  logs.push(logString);
  
  p.remarks = JSON.stringify({
      savings: data.calcs.savings,
      first_w: data.calcs.first_withdrawal,
      second_w: data.calcs.second_withdrawal,
      mother: motherName,
      transfers: logs,
      opening: data.openingObj,
      ending: { food: f, cloth: c, hh: h, int: i }
  });
  return p;
}

`;

fs.appendFileSync('C:\\Users\\Administrator\\Desktop\\Family budget V4\\fb_calculator.js', logic);
console.log("Appended to fb_calculator.js");
