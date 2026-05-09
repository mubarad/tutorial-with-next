import { serve } from "https://deno.land/std@0.200.0/http/server.ts";

// آدرس VPS و پورت sing-box
const VPS_HOST = "91.107.242.231";
const VPS_PORT = 1080;

const clients = new Map<string, WebSocket>();

serve((req) => {
  const url = new URL(req.url);

  if (url.pathname !== "/ws") {
    return new Response("ok");
  }

  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("not websocket", { status: 400 });
  }

  const id = url.searchParams.get("id") ?? "default";
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = async () => {
    console.log(`[+] Client connected: ${id}`);
    clients.set(id, socket);
  };

  socket.onclose = () => {
    console.log(`[-] Client disconnected: ${id}`);
    clients.delete(id);
  };

  socket.onmessage = async (event) => {
    // همه پیام‌ها رو به VPS فوروارد می‌کنیم
    try {
      const res = await fetch(`http://${VPS_HOST}:${VPS_PORT}`, {
        method: "POST",
        body: event.data,
      });
      const text = await res.text();

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(text);
      }
    } catch (err) {
      console.error("Error forwarding to VPS:", err);
      if (socket.readyState === WebSocket.OPEN) socket.send("error");
    }
  };

  return response;
});
