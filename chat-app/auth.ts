import { Context } from "https://deno.land/x/oak/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";
import client from "./db.ts"; // asumsi client MySQL kamu sudah dikonfigurasi di sini

export async function registerHandler(ctx: Context) {
  try {
    const body = await ctx.request.body.formData();
    const username = body.get("username");
    const password = body.get("password");

    if (!username || !password) {
      ctx.response.status = 400;
      ctx.response.body = { status: "error", message: "Username and password required" };
      return;
    }

    const [existingUser] = await client.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );

    if (existingUser) {
      ctx.response.status = 409;
      ctx.response.body = { status: "error", message: "Username already exists" };
      return;
    }

    const hashedPassword = await bcrypt.hash(password);

    await client.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
    );

    ctx.response.body = { status: "success", message: "Registration successful. Please login." };

  } catch (e) {
    console.error("Register error:", e);
    ctx.response.status = 500;
    ctx.response.body = { status: "error", message: "Internal Server Error" };
  }
}

export async function loginHandler(ctx: Context) {
  try {
    const body = await ctx.request.body.formData();
    const username = body.get("username");
    const password = body.get("password");

    if (!username || !password) {
      ctx.response.status = 400;
      ctx.response.body = { status: "error", message: "Username and password required" };
      return;
    }

    const result = await client.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (result.length === 0) {
      ctx.response.status = 401;
      ctx.response.body = { status: "error", message: "Invalid username or password" };
      return;
    }

    const user = result[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      ctx.response.status = 401;
      ctx.response.body = { status: "error", message: "Invalid username or password" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { status: "success", message: "Login successful" };
  
  } catch (e) {
    console.error("Login error:", e);
    ctx.response.status = 500;
    ctx.response.body = { status: "error", message: "Internal Server Error" };
  }
}
