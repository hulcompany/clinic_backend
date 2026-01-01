#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script runs all SQL migration files in the correct order to set up
 * or update the database schema.
 */

const fs = require('fs').promises;
const path = require('path');
const { sequelize } = require('../config/database');

// Migration files in order of execution
const migrationFiles = [
  '01-create-users-table.sql',
  '02-create-refresh-tokens-table.sql',
  '03-create-blacklisted-tokens-table.sql',
  '06-create-otp-table.sql',
  '07-create-admins-table.sql',
  '08-create-consultations-table.sql',
  '09-create-chats-table.sql',
  '10-create-messages-table.sql',
  '11-create-sessions-table.sql',
  '12-create-services-table.sql',
  '13-create-contact-us-table.sql',
  '14-create-reviews-table.sql',
  '15-create-availability-table.sql',
  '18-create-medical-records-table.sql',
  '19-rename-medical-attachment-to-medical-attachments.sql',
  '20-create-blog-table.sql',
  '21-create-notifications-table.sql',
  '22-create-landing-images-table.sql',
  '23-add-telegram-chat-id-to-users-and-admins-table.sql
];

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Authenticate connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Run each migration file
    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, 'migrations', file);
      
      try {
        // Check if file exists
        await fs.access(filePath);
        
        // Read the SQL file
        const sql = await fs.readFile(filePath, 'utf8');
        
        // Split SQL into separate statements if needed
        const statements = sql.split(/;\s*(?=\n|$)/).filter(stmt => stmt.trim() !== '');
        
        for (const statement of statements) {
          const trimmedStmt = statement.trim();
          if (trimmedStmt) {
            try {
              await sequelize.query(trimmedStmt);
            } catch (stmtError) {
              // If it's the index creation that fails because it already exists, continue
              if (stmtError.message && stmtError.message.includes('already exists') && trimmedStmt.toLowerCase().includes('create index')) {
                console.warn(`⚠ Index already exists in migration ${file}. Continuing...`);
              } else {
                throw stmtError;
              }
            }
          }
        }
        console.log(`✓ Migration ${file} completed successfully.`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.warn(`⚠ Migration file ${file} not found. Skipping.`);
        } else if (error.message && error.message.includes('already exists')) {
          console.warn(`⚠ Table already exists for migration ${file}. Continuing...`);
        } else if (error.message && error.message.includes('Duplicate column name')) {
          console.warn(`⚠ Column already exists for migration ${file}. Continuing...`);
        } else if (error.message && error.message.includes('Duplicate foreign key')) {
          console.warn(`⚠ Foreign key already exists for migration ${file}. Continuing...`);
        } else {
          console.error(`✗ Error running migration ${file}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration process failed:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };


//npx sequelize-cli db:migrate --name xxx

