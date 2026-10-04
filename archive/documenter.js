const fs = require('fs');

const comments = {
    // fb_calculator.js
    "fbState": "GLOBAL STATE OBJECT: Stores all cached data (houses, child counts, rates) to minimize database calls and allow offline/instant calculations.",
    "getPreviousBalances": "Retrieves the ending financial balances from the previous month for a given house. If no previous month exists, it flags it as 'manual' so the user can enter starting balances.",
    "calculateHouseBudget": "CORE MATH ENGINE: Takes raw counts (demographics) and applies financial rates to calculate the exact allocated budget and ending balances for Food, Clothing, Household, and Interest.",
    "getVillageHouses": "Filters the list of all houses to only show those belonging to the currently selected village. If a Mother is logged in, it strictly filters the list to ONLY show the house she is assigned to.",
    "fbUpdateLiveBalances": "Called every time a user types in a data entry field. It instantly recalculates the `calculateHouseBudget` math and updates the green/red balances on the screen.",
    "loadFbData": "Master initialization function for the FB Calculator. Called when the user switches to the FB Calculator tab. Sets up the UI, default dates, and triggers data loading.",
    "loadVillageData": "Connects to Supabase to download all houses and historical budget records for the currently selected village.",
    "fbRenderEntry": "UI GENERATOR: Builds the HTML for the main Data Entry form where Mothers/Admins enter their monthly child counts and withdrawals.",
    "fbReviewAndSave": "Called when the user clicks 'Review & Save'. It recalculates the final math one last time, builds a save payload, and shows a confirmation modal to the user.",
    "fbValidateAndCalculateBulk": "EXCEL PARSER: Reads an uploaded Excel file, validates that all houses in the village are present, checks for number formatting, and calculates the math for every house at once.",
    "fbRenderCrossHouse": "UI GENERATOR (Admin Only): Builds the interface allowing accountants to move funds (transfer) between two different houses, or between different accounts within the same house.",
    
    // app.js
    "init": "APP ENTRY POINT: Runs when the page loads. Checks for an active session, restores offline data from localStorage, and decides which screen to show.",
    "fetchCloudData": "CLOUD SYNC: Connects to the Supabase database to download all users, profiles, items, and expenses. Keeps the app up-to-date.",
    "render": "MASTER UI CONTROLLER: Based on the `activeView` state (Dashboard, Expenses, Users, etc.), this clears the screen and calls the appropriate sub-render function.",
    "renderExpenses": "Builds the 'Add Expense' interface. Enforces policies such as blocking Mothers who are not assigned to a house.",
    "renderUsers": "Builds the 'Manage Users' interface for Admins. Displays the active users table and the form to create/edit accounts and assign houses."
};

function injectComments(filename) {
    if (!fs.existsSync(filename)) return;
    let content = fs.readFileSync(filename, 'utf8');
    let lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Find functions or major object declarations
        let match = line.match(/^(?:window\.)?([a-zA-Z0-9_]+)\s*=\s*(?:function|{)/) || 
                    line.match(/^function\s+([a-zA-Z0-9_]+)\s*\(/);
                    
        if (match) {
            let funcName = match[1];
            if (comments[funcName]) {
                // Check if comment already exists above
                if (i > 0 && lines[i-1].includes('// -->')) continue;
                if (i > 0 && lines[i-1].includes('**')) continue;
                
                // Inject beautiful block comment
                let block = `\n/**\n * ------------------------------------------------------------------\n * ${comments[funcName].match(/.{1,65}(\s|$)/g).join('\n * ')} * ------------------------------------------------------------------\n */`;
                lines[i] = block + '\n' + line;
                modified = true;
            }
        }
    }
    
    // Add file headers
    if (!content.includes('FILE OVERVIEW')) {
        let header = '';
        if (filename === 'app.js') {
            header = `/**
 * ============================================================================
 * APP.JS - CORE APPLICATION LOGIC & ROUTING
 * ============================================================================
 * FILE OVERVIEW:
 * This is the heart of the web app. It controls User Authentication, the 
 * Navigation Menu, General Expenses tracking, and Administrative settings.
 * 
 * It relies on a global \`state\` object to cache data locally, ensuring the app 
 * remains fast and can operate even with intermittent internet connections.
 * ============================================================================
 */\n\n`;
        } else if (filename === 'fb_calculator.js') {
            header = `/**
 * ============================================================================
 * FB_CALCULATOR.JS - FAMILY BUDGET ENGINE
 * ============================================================================
 * FILE OVERVIEW:
 * This standalone module handles the complex financial tracking for Houses.
 * It manages monthly allowances for Food, Clothing, Household, and Interest.
 * 
 * Security Note: Logic inside \`getVillageHouses\` strictly limits what normal 
 * "Mothers" can see, protecting data privacy across the village.
 * ============================================================================
 */\n\n`;
        }
        lines.unshift(header);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filename, lines.join('\n'));
        console.log(`Documented ${filename}`);
    }
}

injectComments('app.js');
injectComments('fb_calculator.js');
