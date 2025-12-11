// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const sepayRoutes = require("./routes/sepay");

// const app = express();
// app.use(bodyParser.json());

// // Route Sepay
// // app.use("/sepay", sepayRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server is running at http://localhost:${PORT}`);
// });
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// socket server
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("offer", (data) => {
    socket.to(data.to).emit("offer", {
      from: socket.id,
      offer: data.offer,
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.to).emit("answer", {
      from: socket.id,
      answer: data.answer,
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.to).emit("ice-candidate", {
      from: socket.id,
      candidate: data.candidate,
    });
  });
  // 🆕 sync trạng thái mic / cam
  socket.on("media-state", ({ roomId, micOn, camOn }) => {
    socket.to(roomId).emit("peer-media-state", {
      id: socket.id,
      micOn,
      camOn,
    });
  });
  // 🆕 Một client rời khỏi phòng (bấm kết thúc)
  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit("peer-left", { id: socket.id });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

server.listen(8080, () => console.log("Server running on port 5000"));
