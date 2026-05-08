const clients = new Map<string, WebSocket>();

Deno.serve((req) => {
  const url = new URL(req.url);

  if (url.pathname !== "/ws") {
    return new Response("ok");
  }

  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("not websocket", { status: 400 });
  }

  const id = url.searchParams.get("id") ?? "default";

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    clients.set(id, socket);
  };

  socket.onclose = () => {
    clients.delete(id);
  };

  socket.onmessage = (event) => {
    for (const [_, ws] of clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(event.data);
      }
    }
  };

  return response;
});
