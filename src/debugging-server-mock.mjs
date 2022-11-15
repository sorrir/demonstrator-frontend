import { WebSocketServer } from "ws";

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

console.log("starting mock server");
const wss = new WebSocketServer({ port: 3001 });
console.log(wss.address());

const state = {
  components: [
    {
      name: "user",
      ports: ["out"],
      state: {fsm: "WAITING" },
      events: ["out.OPEN"],
    },
    { name: "barrier", ports: ["in"], state: {fsm:"CLOSED"}, events: [] },
  ],
  connections: [{ source: ["user", "out"], target: ["barrier", "in"] }],
};

wss.on("connection", function connection(ws) {
  ws.on("message", function message(data) {
    console.log("received: %s", data);
  });

  ws.send(JSON.stringify(state));

  (async () => {
    await sleep(1000);
    state.components[0].events = [];
    state.components[1].events = state.components[0].events;
    ws.send(JSON.stringify(state));
    await sleep(1000);
    state.components[0].state = {fsm:"DRIVING"};
    state.components[1].state = {fsm:"OPEN"};
    ws.send(JSON.stringify(state));
  })();
});
