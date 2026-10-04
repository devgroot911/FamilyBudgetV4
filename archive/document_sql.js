const fs = require('fs');
const path = require('path');

const headers = {
    "fb_migration.sql": `-- ============================================================================
-- DATABASE SETUP: FAMILY BUDGET TABLES (fb_migration.sql)
-- ============================================================================
-- OVERVIEW:
-- This script contains the foundational schema for the Family Budget feature.
-- It creates the \`fb_child_counts\` table (the primary ledger for expenses) 
-- and the \`fb_rates\` table (which holds the financial configuration rules).
-- 
-- USAGE: Run this once when setting up a fresh Supabase database.
-- ============================================================================\n\n`,

    "fb_seed.sql": `-- ============================================================================
-- DATABASE SETUP: DEFAULT RATES (fb_seed.sql)
-- ============================================================================
-- OVERVIEW:
-- This script injects the initial default financial rates into the \`fb_rates\` 
-- table (e.g., how much to allocate for a child under 12, bank charges, etc.).
-- 
-- USAGE: Run this after \`fb_migration.sql\` to populate the settings panel.
-- ============================================================================\n\n`,

    "migrate_houses.sql": `-- ============================================================================
-- ARCHITECTURE UPDATE: DECOUPLING HOUSES (migrate_houses.sql)
-- ============================================================================
-- OVERVIEW:
-- Historically, houses were just a text field attached to a Mother's profile.
-- This script restructures the database by creating a dedicated \`fb_houses\` 
-- table, making "Houses" independent entities. This ensures that if a mother 
-- leaves or is reassigned, the house's financial history remains intact.
-- ============================================================================\n\n`,

    "single_mother_policy.sql": `-- ============================================================================
-- SECURITY POLICY: SINGLE MOTHER CONSTRAINT (single_mother_policy.sql)
-- ============================================================================
-- OVERVIEW:
-- This script enforces a strict business rule: A mother can only be assigned 
-- to ONE house at a time across the entire system.
-- 
-- MECHANISM: 
-- It cleans up any existing duplicate assignments and applies a UNIQUE 
-- constraint on the \`assigned_mother_username\` column in \`fb_houses\`.
-- ============================================================================\n\n`,

    "sync_users_houses.sql": `-- ============================================================================
-- DATA INTEGRITY: USERS & HOUSES SYNC (sync_users_houses.sql)
-- ============================================================================
-- OVERVIEW:
-- Because the system has both a \`users\` table (for logins/profiles) and an 
-- \`fb_houses\` table (for budget tracking), this script creates an automated 
-- Database Trigger to keep them perfectly synchronized.
-- 
-- MECHANISM:
-- Whenever an Admin changes a house's assigned mother in \`fb_houses\`, this 
-- trigger automatically updates the \`users\` table so the Active Users UI 
-- displays the correct information, preventing "ghost" assignments.
-- ============================================================================\n\n`
};

for (const [filename, header] of Object.entries(headers)) {
    const filePath = path.join('database', filename);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('OVERVIEW:')) {
            fs.writeFileSync(filePath, header + content);
            console.log('Documented ' + filename);
        }
    }
}
