import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const dbHost = Deno.env.get("DB_HOST") || "localhost";
const dbPort = parseInt(Deno.env.get("DB_PORT") || "3306", 10);
const dbUser = Deno.env.get("DB_USER") || "root";
const dbPassword = Deno.env.get("DB_PASSWORD") || "";
const dbName = Deno.env.get("DB_NAME") || "chat_app";

const client = await new Client().connect({
  hostname: dbHost,
  port: dbPort,
  username: dbUser,
  password: dbPassword,
  db: dbName,
});

export default client;