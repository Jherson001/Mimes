import mysql from "mysql2/promise";

function buildPoolConfig() {
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || "";

  if (databaseUrl.startsWith("mysql://")) {
    const parsed = new URL(databaseUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, "") || "defaultdb",
      waitForConnections: true,
      connectionLimit: 10,
      ssl: { rejectUnauthorized: false },
    };
  }

  const host = process.env.DB_HOST || "localhost";
  const useSsl =
    process.env.DB_SSL === "true" ||
    process.env.DB_SSL === "1" ||
    host.includes("aivencloud.com");

  return {
    host,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "mimes_db",
    waitForConnections: true,
    connectionLimit: 10,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

export const pool = mysql.createPool(buildPoolConfig());
