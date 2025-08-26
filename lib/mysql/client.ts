import mysql from "mysql2/promise"

// Database connection configuration with fallback handling
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'pos_system',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
}

// Create a connection pool
export const dbPool = mysql.createPool(dbConfig)

// Function to get a connection from the pool
export async function getDbConnection() {
  try {
    const connection = await dbPool.getConnection()
    return connection
  } catch (error) {
    console.error('Database connection failed:', error)
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const getConnection = getDbConnection

export function getMysqlClient() {
  return dbPool
}

// Manual cleanup function (can be called when needed)
export async function closeDbPool() {
  try {
    console.log("Closing MySQL connection pool...")
    await dbPool.end()
    console.log("MySQL connection pool closed.")
  } catch (error) {
    console.error("Error closing MySQL pool:", error)
  }
}
