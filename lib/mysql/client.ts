import mysql from 'mysql2/promise';
import { fallbackStorage } from '../storage/fallback-storage';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pos_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create connection pool
let pool: mysql.Pool | null = null;

function createPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function getDbConnection() {
  try {
    const pool = createPool();
    return await pool.getConnection();
  } catch (error) {
    console.error('Database connection failed:', error);
    console.warn('Falling back to in-memory storage');
    
    // Return fallback storage that mimics database connection interface
    return {
      query: fallbackStorage.query.bind(fallbackStorage),
      execute: fallbackStorage.execute.bind(fallbackStorage),
      release: fallbackStorage.release.bind(fallbackStorage)
    };
  }
}

// Legacy MySQL-style connection function for compatibility
export async function getMysqlConnection() {
  try {
    const pool = createPool();
    const connection = await pool.getConnection();
    
    return {
      query: async (sql: string, params: any[] = []) => {
        try {
          const [rows] = await connection.execute(sql, params);
          return rows;
        } catch (error) {
          console.error('Query failed:', error);
          throw error;
        }
      },
      execute: async (sql: string, params: any[] = []) => {
        try {
          const [result] = await connection.execute(sql, params);
          return result;
        } catch (error) {
          console.error('Execute failed:', error);
          throw error;
        }
      },
      release: () => {
        connection.release();
      }
    };
  } catch (error) {
    console.error('Database connection failed:', error);
    console.warn('Falling back to in-memory storage');
    
    // Return fallback storage that mimics database connection interface
    return {
      query: fallbackStorage.query.bind(fallbackStorage),
      execute: fallbackStorage.execute.bind(fallbackStorage),
      release: fallbackStorage.release.bind(fallbackStorage)
    };
  }
}

export const getConnection = getMysqlConnection;

export function getMysqlClient() {
  const pool = createPool();
  return {
    query: async (sql: string, params: any[] = []) => {
      const [rows] = await pool.execute(sql, params);
      return rows;
    },
    execute: async (sql: string, params: any[] = []) => {
      const [result] = await pool.execute(sql, params);
      return result;
    }
  };
}

export async function closeDbPool() {
  try {
    if (pool) {
      console.log("Closing MySQL connection pool...");
      await pool.end();
      pool = null;
      console.log("MySQL connection pool closed.");
    }
  } catch (error) {
    console.error("Error closing MySQL connection pool:", error);
  }
}

// Helper functions for compatibility
export async function executeQuery(sql: string, params: any[] = []) {
  try {
    const pool = createPool();
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn('Database unavailable, using fallback storage');
    return await fallbackStorage.query(sql, params);
  }
}

export async function executeQuerySingle(sql: string, params: any[] = []) {
  const rows = await executeQuery(sql, params) as any[];
  return rows[0] || null;
}

export async function executeUpdate(sql: string, params: any[] = []) {
  try {
    const pool = createPool();
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.warn('Database unavailable, using fallback storage');
    return await fallbackStorage.execute(sql, params);
  }
}

export function initializeDatabase() {
  // Database initialization would be handled by MySQL setup scripts
  console.log("Database initialization - MySQL connection pool created");
}