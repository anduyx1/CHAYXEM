import Database from 'better-sqlite3';
import path from 'path';

// SQLite database configuration
const dbPath = path.join(process.cwd(), 'data', 'pos_system.db');

let db: Database.Database | null = null;

// Initialize SQLite database
export function initializeDatabase() {
  try {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);
    
    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    
    console.log('SQLite database initialized successfully');
    return db;
  } catch (error) {
    console.error('SQLite database initialization failed:', error);
    throw new Error(`SQLite database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get database connection
export function getDbConnection() {
  if (!db) {
    db = initializeDatabase();
  }
  return db;
}

export const getSqliteClient = getDbConnection;

// Close database connection
export function closeDatabase() {
  if (db) {
    try {
      db.close();
      db = null;
      console.log('SQLite database connection closed');
    } catch (error) {
      console.error('Error closing SQLite database:', error);
    }
  }
}

// Execute query with parameters
export function executeQuery(sql: string, params: any[] = []) {
  const database = getDbConnection();
  try {
    const stmt = database.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

// Execute single query
export function executeQuerySingle(sql: string, params: any[] = []) {
  const database = getDbConnection();
  try {
    const stmt = database.prepare(sql);
    return stmt.get(...params);
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

// Execute insert/update/delete
export function executeUpdate(sql: string, params: any[] = []) {
  const database = getDbConnection();
  try {
    const stmt = database.prepare(sql);
    return stmt.run(...params);
  } catch (error) {
    console.error('Update execution failed:', error);
    throw error;
  }
}