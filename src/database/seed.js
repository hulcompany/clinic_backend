require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runSeeds() {
  try {
    console.log('Running seeds...');
    
    // Get all seed files
    const seedsDir = path.join(__dirname, 'seeds');
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Execute each seed file
    for (const seedFile of seedFiles) {
      console.log(`Running seed: ${seedFile}`);
      const seedPath = path.join(seedsDir, seedFile);
      const seedSQL = fs.readFileSync(seedPath, 'utf8');
      
      // Execute the SQL
      await sequelize.query(seedSQL);
      console.log(`✅ Seed ${seedFile} completed successfully`);
    }
    
    console.log('All seeds completed successfully');
    
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  }
}

// Run the seeds
runSeeds();