import { Server as SocketIOServer } from "socket.io";

let io;

export function initSocket(httpServer) {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || true,
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        socket.on("join-room", (room) => {
            if (!room || typeof room !== "string") return;
            socket.join(room);
        });
    });

    return io;
}

export function getIO() {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }
    return io;
}
