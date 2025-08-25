import mysql from "mysql2/promise"

// Create a connection pool
export const dbPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Function to get a connection from the pool
export async function getDbConnection() {
  return dbPool.getConnection()
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
