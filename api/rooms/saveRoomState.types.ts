// ─── Payload gửi lên từ frontend ────────────────────────────────────────────

export interface Surcharge {
  label?: string;        // "View biển", "Giường phụ"...
  cost_price: number;    // Giá vốn (₫)
  selling_price: number; // Giá bán (₫)
}

export interface RoomAllocation {
  booking_room_id: string;   // text PK trong bảng booking_rooms
  guests: string[];           // mảng booking_passenger_id (text PK trong booking_passengers)
  surcharges: Surcharge[];    // phụ thu nhập tay cho phòng này
}

export interface SaveRoomStatePayload {
  order_id: string;            // text PK trong bảng orders
  room_allocations: RoomAllocation[];
}

// ─── Kết quả trả về frontend ─────────────────────────────────────────────────

export interface SaveRoomStateResult {
  order_id: string;
  total_room_cost: number;    // tổng giá vốn (phòng gốc + phụ thu)
  total_room_selling: number; // tổng giá bán
  rooms: RoomSnapshot[];
  updated_at: string;         // ISO 8601
}

export interface RoomSnapshot {
  booking_room_id: string;
  room_name: string;
  base_cost_price: number;
  base_selling_price: number;
  guests: string[];           // booking_passenger_id[]
  surcharges: Surcharge[];
  room_cost_total: number;    // base + surcharges
  room_selling_total: number;
}

// ─── Internal DB rows ────────────────────────────────────────────────────────

export interface BookingRoomRow {
  id: string;
  room_name: string;
  base_cost_price: string;   // pg trả về numeric dưới dạng string
  base_selling_price: string;
}

export interface RecalcRow {
  total_room_cost: string;
  total_room_selling: string;
}
