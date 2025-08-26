import { getDbConnection, executeQuery, executeQuerySingle, executeUpdate, initializeDatabase } from '../sqlite/client'

// Initialize SQLite database on module load
let isInitialized = false;

export async function getDbConnection() {
  if (!isInitialized) {
    initializeDatabase();
    isInitialized = true;
  }
  return getDbConnection();
}

// Legacy MySQL-style connection function for compatibility
export async function getMysqlConnection() {
  try {
    if (!isInitialized) {
      initializeDatabase();
      isInitialized = true;
    }
    return {
      query: (sql: string, params: any[] = []) => {
        if (sql.toLowerCase().includes('select')) {
          return executeQuery(sql, params);
        } else {
          return executeUpdate(sql, params);
        }
      },
      execute: (sql: string, params: any[] = []) => {
        return executeUpdate(sql, params);
      },
      release: () => {
        // No-op for SQLite
      }
    };
  } catch (error) {
    console.error('Database connection failed:', error)
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const getConnection = getMysqlConnection

export function getMysqlClient() {
  return {
    query: executeQuery,
    execute: executeUpdate
  };
}

export async function closeDbPool() {
  try {
    console.log("Closing SQLite database...")
    // SQLite cleanup handled by sqlite client
    console.log("SQLite database closed.")
  } catch (error) {
    console.error("Error closing SQLite database:", error)
  }
}
