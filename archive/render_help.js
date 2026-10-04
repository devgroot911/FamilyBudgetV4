function renderHelp() {
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director' || role.indexOf('assistant') !== -1);
  var isDirector = (role.indexOf('director') !== -1 || role.indexOf('manager') !== -1 || role.indexOf('village') !== -1);

  var html = '<div class="section-heading"><div><h2>Help & Guides</h2><small>User manual and instructions</small></div></div>';
  
  html += '<style>' +
    '.help-section { margin-bottom: 20px; border: 1px solid var(--border-color, #ddd); border-radius: 8px; overflow: hidden; background: #fff; }' +
    '.help-header { background: #f8f9fa; color: #2c3e50; padding: 15px; cursor: pointer; font-weight: bold; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid transparent; transition: background 0.2s; }' +
    '.help-header:hover { background: #eef2f5; }' +
    '.help-content { padding: 20px; display: none; background: #fff; border-top: 1px solid var(--border-color, #ddd); line-height: 1.6; color: #444; }' +
    '.help-content h4 { margin-top: 15px; margin-bottom: 5px; color: #2980b9; }' +
    '.help-content p { margin-top: 0; margin-bottom: 10px; }' +
    '.help-content ul { padding-left: 20px; margin-bottom: 15px; }' +
    '.help-content li { margin-bottom: 8px; }' +
    '.help-btn-fake { display: inline-block; padding: 2px 8px; background: #3498db; color: #fff; border-radius: 4px; font-size: 0.85em; }' +
  '</style>';

  html += '<div class="help-section">' +
            '<div class="help-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === \'block\' ? \'none\' : \'block\'">' +
               '<span>📘 1. Introduction & Basics (For All Users)</span>' +
               '<span>▼</span>' +
            '</div>' +
            '<div class="help-content">' +
               '<p>Welcome to the Family Budget App!</p>' +
               '<ul>' +
                 '<li><strong>Navigation:</strong> Use the sidebar on the left (or the bottom menu on mobile) to switch between different views like Dashboard, Expense Entry, and Reports.</li>' +
                 '<li><strong>Offline Support:</strong> This app works offline! If you lose internet, you can still add expenses. The app will sync automatically when you reconnect.</li>' +
                 '<li><strong>Profile & Settings:</strong> Click "Profile & Settings" to change your display name or update your password.</li>' +
               '</ul>' +
            '</div>' +
          '</div>';

  html += '<div class="help-section">' +
            '<div class="help-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === \'block\' ? \'none\' : \'block\'">' +
               '<span>🏠 2. Mother / YCCW Guide (House Level)</span>' +
               '<span>▼</span>' +
            '</div>' +
            '<div class="help-content">' +
               '<h4>The Dashboard</h4>' +
               '<ul>' +
                 '<li>The overview shows your Total Budget, Total Expenditure, and Available Balance.</li>' +
                 '<li>The budget charts show how much you have left in each category (Food, Household, Clothing).</li>' +
               '</ul>' +
               '<h4>Adding Expenses</h4>' +
               '<ul>' +
                 '<li>Go to the <span class="help-btn-fake">➕ Add expense</span> tab.</li>' +
                 '<li>Select the date, item name, and price. Pick the correct category from the dropdown.</li>' +
                 '<li>If you have a receipt, type the receipt number in the "Note (optional)" field.</li>' +
                 '<li>Click <strong>Save Expense</strong> to log it. Your balance will update immediately.</li>' +
               '</ul>' +
               '<h4>Deleting Mistakes</h4>' +
               '<ul>' +
                 '<li>If you make a mistake, go to the <span class="help-btn-fake">📁 Records</span> tab.</li>' +
                 '<li>Find the incorrect entry and click the red <strong>Delete</strong> button. Your balance will be refunded.</li>' +
               '</ul>' +
            '</div>' +
          '</div>';

  if (isDirector || isGlobal) {
    html += '<div class="help-section">' +
              '<div class="help-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === \'block\' ? \'none\' : \'block\'">' +
                 '<span>🏘️ 3. Village Director / Manager Guide</span>' +
                 '<span>▼</span>' +
              '</div>' +
              '<div class="help-content">' +
                 '<h4>Village Oversight</h4>' +
                 '<ul>' +
                   '<li>Use the dropdown filter on the <span class="help-btn-fake">📈 Overview</span> to see aggregated data for the whole village or select a specific house.</li>' +
                   '<li>Go to <span class="help-btn-fake">📁 Records</span> to audit expenses entered by the mothers in your village.</li>' +
                 '</ul>' +
                 '<h4>Family Budget (FB) Calculator Access</h4>' +
                 '<ul>' +
                   '<li>You can access the FB Calculator from the sidebar to process monthly budgets.</li>' +
                   '<li>You are restricted to entering and managing budget data <strong>only for the houses in your assigned village</strong>.</li>' +
                 '</ul>' +
              '</div>' +
            '</div>';
            
    html += '<div class="help-section">' +
              '<div class="help-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === \'block\' ? \'none\' : \'block\'">' +
                 '<span>🧮 4. FB Calculator Data Entry Guide (Detailed)</span>' +
                 '<span>▼</span>' +
              '</div>' +
              '<div class="help-content">' +
                 '<p>When you go to the <strong>Data Entry</strong> tab in the FB Calculator, you must enter details for each house to calculate their monthly budget and withdrawals. Here is exactly what each field means:</p>' +
                 
                 '<h4>1. Demographics & Additions (Money coming in)</h4>' +
                 '<ul>' +
                   '<li><strong>Child >12:</strong> The number of children strictly older than 12. The system automatically multiplies this by the standard Over-12 Food and Clothing rates.</li>' +
                   '<li><strong>Child <12:</strong> The number of children 12 or younger. Multiplied by the standard Under-12 rates.</li>' +
                   '<li><strong>Mothers:</strong> The number of mothers present in the house (usually 1). Used to calculate the mother\'s food allowance.</li>' +
                   '<li><strong>Aunt Amt:</strong> A specific allowance amount given for an Aunt. <em>Note: This amount bypasses the standard 5% savings deduction and is added entirely to the 1st Withdrawal.</em></li>' +
                   '<li><strong>Special Allowances / Adjustments:</strong> Any extra money allocated to the house for special circumstances. Like the Aunt Amount, this bypasses the 5% savings and goes straight to the 1st Withdrawal.</li>' +
                   '<li><strong>Interest:</strong> Any bank interest earned on the house\'s accounts this month. This amount is directly added to their <em>Interest Balance</em>.</li>' +
                 '</ul>' +
                 
                 '<h4>2. Withdrawals & Charges (Money going out)</h4>' +
                 '<p>These fields tell the system exactly how much physical cash is being requested from the bank for specific categories.</p>' +
                 '<ul>' +
                   '<li><strong>Actual Clothing:</strong> The exact amount of cash requested for clothing this month. This will be deducted from the house\'s available <em>Clothing Balance</em>.</li>' +
                   '<li><strong>Actual Household:</strong> The exact amount of cash requested for household items (cleaning supplies, hygiene, etc.). This is deducted from the <em>Household Balance</em>.</li>' +
                   '<li><strong>Bank Charges:</strong> Any bank fees, cheque book fees, or arrears incurred. This is deducted strictly from the <em>Interest Balance</em>.</li>' +
                 '</ul>' +
                 
                 '<h4>Reviewing & Saving</h4>' +
                 '<ul>' +
                   '<li>After filling out the fields, the right side of the screen will show a live preview of the final balances.</li>' +
                   '<li>Click the blue <strong>Review & Save</strong> button. If any balances (like clothing or household) go negative, you will be prompted to cover the negative amount using funds from another account (like the Food or Interest balance).</li>' +
                   '<li>Confirm the final summary to lock the math into the database.</li>' +
                 '</ul>' +
              '</div>' +
            '</div>';
  }

  if (isGlobal) {
    html += '<div class="help-section">' +
              '<div class="help-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === \'block\' ? \'none\' : \'block\'">' +
                 '<span>⚙️ 5. Administrator / Accountant Guide</span>' +
                 '<span>▼</span>' +
              '</div>' +
              '<div class="help-content">' +
                 '<h4>National FB Calculator Access</h4>' +
                 '<ul>' +
                   '<li>National users can select <strong>All Villages</strong> or drill down into any specific village.</li>' +
                   '<li>Use the <span class="help-btn-fake">Transfers</span> tab to perform Cross-House or Cross-Account transfers. These will automatically log a receipt in the target accounts.</li>' +
                   '<li>Click <span class="help-btn-fake">Global Rates</span> in the sidebar to change the standard rates (e.g. 6300 for Child >12). Changes here affect all future budget calculations.</li>' +
                 '</ul>' +
                 '<h4>Manage Users</h4>' +
                 '<ul>' +
                   '<li>Go to <span class="help-btn-fake">👥 Manage Users</span> to create new accounts.</li>' +
                   '<li>You can assign users to specific villages and houses. If they forget their password, you can reset it here.</li>' +
                 '</ul>' +
              '</div>' +
            '</div>';
  }

  document.querySelector('#view-help').innerHTML = html;
}
