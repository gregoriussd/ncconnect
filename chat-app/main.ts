import { Application, Router, send } from "@oak/oak";
import ChatServer from "./ChatServer.ts";
import { registerHandler, loginHandler } from "./auth.ts";

const app = new Application();
const port = 8080;
const router = new Router();
const server = new ChatServer();

router
  .post("/register", registerHandler)
  .post("/login", loginHandler)
  .get("/start_web_socket", (ctx) => server.handleConnection(ctx));

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx, next) => {
  const path = ctx.request.url.pathname;

  if (path.startsWith("/public")) {
    await send(ctx, path, {
      root: Deno.cwd(),
    });
  } else {
    await next();
  }
});

app.use(async (context) => {
  await context.send({
    root: Deno.cwd(),
    index: "public/index.html",
  });
});

console.log(`Listening at http://localhost:${port}`);
await app.listen({ hostname: "0.0.0.0", port });
