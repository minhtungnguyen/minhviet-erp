/**
 * Wiring vào Express app:
 *
 *   import ordersRoomsRouter from "./api/rooms/saveRoomState.router";
 *   app.use("/api", ordersRoomsRouter);
 *
 * Endpoint:  POST /api/orders/:orderId/rooms/save-state
 *
 * Body mẫu:
 * {
 *   "room_allocations": [
 *     {
 *       "booking_room_id": "room-abc-123",
 *       "guests": ["passenger-id-1", "passenger-id-2"],
 *       "surcharges": [
 *         { "label": "View biển", "cost_price": 200000, "selling_price": 300000 }
 *       ]
 *     }
 *   ]
 * }
 */
import { Router } from "express";
import { handleSaveRoomState } from "./saveRoomState.handler";

// import { requireRole } from "../middleware/auth"; // bỏ comment khi có auth

const router = Router();

router.post(
  "/orders/:orderId/rooms/save-state",
  // requireRole("dieu_hanh", "manager"),
  handleSaveRoomState
);

export default router;
