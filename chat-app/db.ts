import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const client = await new Client().connect({
  hostname: "localhost",
  username: "root", // default user di XAMPP
  db: "chat_app",
  password: "", // default-nya kosong di XAMPP (kecuali kamu ubah)
});

export default client;
