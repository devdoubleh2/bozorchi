import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import authService from "../services/auth";
import { prisma } from "./prisma";

interface SocketData {
    userId: string;
    organizationId: string;
    storeId?: string;
}

// Extend Socket type to include our custom data
interface CustomSocket extends Socket {
    data: SocketData;
}

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env["CORS_ORIGIN"] ? process.env["CORS_ORIGIN"].split(",") : "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
        pingTimeout: 60000,
    });

    // Authentication Middleware
    io.use(async (socket, next) => {
        try {

            const headers = socket.handshake.headers;
            let token = headers["authorization"] ? headers["authorization"].split(" ")[1] : null;

            if (!token && socket.handshake.auth && socket.handshake.auth["token"]) {
                const authStr = socket.handshake.auth["token"] as string;
                // Handle "Bearer <token>" or just "<token>"
                token = authStr.startsWith("Bearer ") ? authStr.split(" ")[1] : authStr;
            }

            if (!token) {
                return next(new Error("Authentication error: Token required"));
            }

            // Verify Token
            const decoded = authService.verifyToken(token);

            // Fetch User & Membership to determine Store/Org context
            const membership = await prisma.userOrganization.findUnique({
                where: { user_id: decoded.userId },
                select: { organization_id: true, store_id: true },
            });

            if (!membership) {
                return next(new Error("Authentication error: No organization membership"));
            }

            // Attach data to socket
            (socket as CustomSocket).data = {
                userId: decoded.userId,
                organizationId: membership.organization_id,
                storeId: membership.store_id || undefined,
            };

            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket: CustomSocket) => {
        console.log(`🔌 Client connected: ${socket.data.userId}`);

        // Join Organization Room
        const orgRoom = `org_${socket.data.organizationId}`;
        socket.join(orgRoom);
        console.log(`   Detailed: Joined ${orgRoom}`);

        // Join Store Room (if assigned to a store)
        if (socket.data.storeId) {
            const storeRoom = `store_${socket.data.storeId}`;
            socket.join(storeRoom);
            console.log(`   Detailed: Joined ${storeRoom}`);
        }

        // Join User Room (for private notifications)
        const userRoom = `user_${socket.data.userId}`;
        socket.join(userRoom);

        socket.on("disconnect", () => {
            console.log(`🔌 Client disconnected: ${socket.data.userId}`);
        });
    });


    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

// ==================== Event Types ====================

export interface InventoryUpdateEvent {
    type: "stock_changed";
    storeId: string;
    productVariationId: string;
    previousStock: number;
    newStock: number;
    changeAmount: number;
    reason: "sale" | "order" | "return" | "adjustment" | "transfer" | "import";
    timestamp: Date;
}

// ==================== Event Emitters ====================

/**
 * Emit inventory update to store room (for POS clients and owners)
 */
export const emitInventoryUpdate = (event: InventoryUpdateEvent) => {
    try {
        const socketIO = getIO();
        const storeRoom = `store_${event.storeId}`;
        socketIO.to(storeRoom).emit("inventory:update", event);
    } catch (error) {
        console.error("Failed to emit inventory update:", error);
    }
};

/**
 * Batch emit multiple inventory updates (for bulk operations)
 */
export const emitBatchInventoryUpdates = (events: InventoryUpdateEvent[]) => {
    try {
        const socketIO = getIO();

        // Group by store
        const byStore = events.reduce((acc, event) => {
            const room = `store_${event.storeId}`;
            if (!acc[room]) acc[room] = [];
            acc[room].push(event);
            return acc;
        }, {} as Record<string, InventoryUpdateEvent[]>);

        // Emit batch to each store
        for (const [room, storeEvents] of Object.entries(byStore)) {
            socketIO.to(room).emit("inventory:batch_update", storeEvents);
        }
    } catch (error) {
        console.error("Failed to emit batch inventory updates:", error);
    }
};

