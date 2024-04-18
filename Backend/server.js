const http = require("http");
const app = require("./app");

app.set("port", process.env.PORT || 4000);
const server = http.createServer(app);

server.listen(process.env.PORT || 4000);

// export PATH="/Users/Elyesa1/.npm-global/bin:$PATH"
