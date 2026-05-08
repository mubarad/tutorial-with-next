const clients = new Map<string, WebSocket>();

Deno.serve((req) => {
  const url = new URL(req.url);

  if (url.pathname !== "/ws") {
    return new Response("ok");
  }

  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("not websocket", { status: 400 });
  }

  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("missing id", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    clients.set(id, socket);
  };

  socket.onclose = () => {
    clients.delete(id);
  };

  socket.onmessage = (event) => {
    const target = clients.get(id);

    if (target && target.readyState === WebSocket.OPEN) {
      target.send(event.data);
    }
  };

  return response;
});
