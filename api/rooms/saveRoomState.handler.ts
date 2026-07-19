import { Request, Response, NextFunction } from "express";
import {
  SaveRoomStatePayload,
  RoomAllocation,
  Surcharge,
} from "./saveRoomState.types";
import {
  saveRoomState,
  NotFoundError,
  ConflictError,
} from "./saveRoomState.service";

// ─── Custom error ─────────────────────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────
//
// Schema thực dùng text PK (không phải UUID), nên không cần regex UUID.
// Chỉ cần đảm bảo là string không rỗng.

function requireId(val: unknown, path: string): string {
  if (typeof val !== "string" || !val.trim()) {
    throw new ValidationError(`${path}: bắt buộc và phải là chuỗi không rỗng`);
  }
  return val.trim();
}

function validateSurcharge(sc: unknown, path: string): Surcharge {
  if (!sc || typeof sc !== "object") {
    throw new ValidationError(`${path}: phải là object`);
  }
  const s = sc as Record<string, unknown>;

  if (typeof s.cost_price !== "number" || !Number.isFinite(s.cost_price) || s.cost_price < 0) {
    throw new ValidationError(`${path}.cost_price: phải là số không âm`);
  }
  if (typeof s.selling_price !== "number" || !Number.isFinite(s.selling_price) || s.selling_price < 0) {
    throw new ValidationError(`${path}.selling_price: phải là số không âm`);
  }

  return {
    label:
      typeof s.label === "string" && s.label.trim()
        ? s.label.trim().slice(0, 200)
        : undefined,
    cost_price:    s.cost_price,
    selling_price: s.selling_price,
  };
}

function validateRoomAllocation(alloc: unknown, index: number): RoomAllocation {
  if (!alloc || typeof alloc !== "object") {
    throw new ValidationError(`room_allocations[${index}]: phải là object`);
  }
  const a = alloc as Record<string, unknown>;

  const booking_room_id = requireId(
    a.booking_room_id,
    `room_allocations[${index}].booking_room_id`
  );

  if (!Array.isArray(a.guests)) {
    throw new ValidationError(`room_allocations[${index}].guests: phải là mảng`);
  }
  const guests = a.guests.map((g, gi) =>
    requireId(g, `room_allocations[${index}].guests[${gi}]`)
  );

  if (!Array.isArray(a.surcharges)) {
    throw new ValidationError(`room_allocations[${index}].surcharges: phải là mảng`);
  }
  const surcharges = a.surcharges.map((sc, si) =>
    validateSurcharge(sc, `room_allocations[${index}].surcharges[${si}]`)
  );

  return { booking_room_id, guests, surcharges };
}

function validatePayload(body: unknown, paramOrderId?: string): SaveRoomStatePayload {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body không hợp lệ");
  }
  const b = body as Record<string, unknown>;

  // Ưu tiên order_id từ route param, fallback sang body
  const raw_order_id = paramOrderId ?? b.order_id;
  const order_id = requireId(raw_order_id, "order_id");

  if (!Array.isArray(b.room_allocations) || b.room_allocations.length === 0) {
    throw new ValidationError("room_allocations: phải là mảng không rỗng");
  }
  if (b.room_allocations.length > 200) {
    throw new ValidationError("room_allocations: tối đa 200 phòng mỗi request");
  }

  const room_allocations = b.room_allocations.map((a, i) =>
    validateRoomAllocation(a, i)
  );

  // Chặn booking_room_id trùng nhau trong cùng payload
  const ids = room_allocations.map((a) => a.booking_room_id);
  if (new Set(ids).size !== ids.length) {
    throw new ValidationError("room_allocations: booking_room_id bị trùng lặp");
  }

  return { order_id, room_allocations };
}

// ─── Express route handler ───────────────────────────────────────────────────
//
// Đăng ký route:
//   POST /api/orders/:orderId/rooms/save-state
//
// Gọi từ frontend khi điều hành viên kéo thả xong hoặc lưu phụ thu.

export async function handleSaveRoomState(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload = validatePayload(req.body, req.params.orderId);
    const data    = await saveRoomState(payload);
    res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof ConflictError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    // PostgreSQL lock timeout: code 55P03 = lock_not_available (từ FOR UPDATE NOWAIT)
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === "55P03") {
      res.status(409).json({
        success: false,
        error: "Đơn hàng đang được cập nhật bởi người dùng khác, vui lòng thử lại.",
      });
      return;
    }
    next(err);
  }
}
