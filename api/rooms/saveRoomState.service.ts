import { Pool, PoolClient } from "pg";
import {
  SaveRoomStatePayload,
  SaveRoomStateResult,
  RoomSnapshot,
  Surcharge,
  BookingRoomRow,
  RecalcRow,
} from "./saveRoomState.types";

// ─── DB Pool (singleton) ─────────────────────────────────────────────────────

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Supabase connection string
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
});

// ─── Custom error types ──────────────────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

// ─── Helper: bulk INSERT placeholder builder ─────────────────────────────────
//
// Với columns = ["a","b","c"] và 2 rows, trả về:
//   placeholders = "($1,$2,$3),($4,$5,$6)"
//   values       = [row0.a, row0.b, row0.c, row1.a, row1.b, row1.c]

function buildBulkInsert<T extends Record<string, unknown>>(
  rows: T[],
  columns: (keyof T)[]
): { placeholders: string; values: unknown[] } {
  const values: unknown[] = [];
  const placeholders = rows
    .map((row, i) => {
      const params = columns.map((col, j) => {
        values.push(row[col]);
        return `$${i * columns.length + j + 1}`;
      });
      return `(${params.join(", ")})`;
    })
    .join(", ");
  return { placeholders, values };
}

function sumSurcharges(
  surcharges: Surcharge[],
  field: "cost_price" | "selling_price"
): number {
  return surcharges.reduce((acc, sc) => acc + sc[field], 0);
}

// ─── Core service ─────────────────────────────────────────────────────────────

export async function saveRoomState(
  payload: SaveRoomStatePayload
): Promise<SaveRoomStateResult> {
  const { order_id, room_allocations } = payload;
  const roomIds = room_allocations.map((a) => a.booking_room_id);

  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── 0a. Lock order row — ngăn concurrent update cùng lúc ───────────────
    //        Schema: orders.id text, nên dùng $1::text (không phải ::uuid)
    const lockRes = await client.query<{ id: string }>(
      `SELECT id FROM orders WHERE id = $1 FOR UPDATE NOWAIT`,
      [order_id]
    );

    if ((lockRes.rowCount ?? 0) === 0) {
      throw new NotFoundError(`Không tìm thấy đơn hàng: ${order_id}`);
    }

    // ── 0b. Xác minh tất cả booking_room_id thuộc đúng order này ───────────
    //        Chặn IDOR: điều hành viên không thể sửa phòng của đơn hàng khác
    const roomCheckRes = await client.query<{ id: string }>(
      `SELECT id
         FROM booking_rooms
        WHERE id = ANY($1::text[])
          AND order_id = $2`,
      [roomIds, order_id]
    );

    if ((roomCheckRes.rowCount ?? 0) !== roomIds.length) {
      const found = new Set(roomCheckRes.rows.map((r) => r.id));
      const invalid = roomIds.filter((id) => !found.has(id));
      throw new ConflictError(
        `Phòng không thuộc đơn hàng này: ${invalid.join(", ")}`
      );
    }

    // ── 1. Xoá toàn bộ liên kết khách cũ → chèn lại ────────────────────────
    //
    //   Xoá theo order_id để đảm bảo sạch hoàn toàn, kể cả phòng không có
    //   trong room_allocations lần này (vì điều hành có thể bỏ trống 1 phòng).

    await client.query(
      `DELETE FROM booking_room_guests WHERE order_id = $1`,
      [order_id]
    );

    type GuestRow = {
      order_id: string;
      booking_room_id: string;
      booking_passenger_id: string;
    };

    const guestRows: GuestRow[] = room_allocations.flatMap((alloc) =>
      alloc.guests.map((passengerId) => ({
        order_id,
        booking_room_id: alloc.booking_room_id,
        booking_passenger_id: passengerId,
      }))
    );

    if (guestRows.length > 0) {
      const { placeholders, values } = buildBulkInsert(guestRows, [
        "order_id",
        "booking_room_id",
        "booking_passenger_id",
      ]);

      await client.query(
        `INSERT INTO booking_room_guests (order_id, booking_room_id, booking_passenger_id)
         VALUES ${placeholders}
         ON CONFLICT (booking_room_id, booking_passenger_id) DO NOTHING`,
        values
      );
    }

    // ── 2. Ghi đè phụ thu: xoá cũ → chèn mới ──────────────────────────────
    //
    //   Chỉ xoá các phòng trong payload lần này (không đụng phòng khác).

    await client.query(
      `DELETE FROM booking_room_prices
        WHERE booking_room_id = ANY($1::text[])
          AND type = 'surcharge'`,
      [roomIds]
    );

    type SurchargeRow = {
      booking_room_id: string;
      type: string;
      label: string;
      cost_price: number;
      selling_price: number;
    };

    const surchargeRows: SurchargeRow[] = room_allocations.flatMap((alloc) =>
      alloc.surcharges.map((sc) => ({
        booking_room_id: alloc.booking_room_id,
        type: "surcharge",
        label: sc.label ?? "Phụ thu",
        cost_price: sc.cost_price,
        selling_price: sc.selling_price,
      }))
    );

    if (surchargeRows.length > 0) {
      const { placeholders, values } = buildBulkInsert(surchargeRows, [
        "booking_room_id",
        "type",
        "label",
        "cost_price",
        "selling_price",
      ]);

      await client.query(
        `INSERT INTO booking_room_prices (booking_room_id, type, label, cost_price, selling_price)
         VALUES ${placeholders}`,
        values
      );
    }

    // ── 3. Tính lại tổng tiền toàn đơn hàng ────────────────────────────────
    //
    //   Dùng 2 CTE riêng biệt thay vì LEFT JOIN để tránh fan-out:
    //   nếu 1 phòng có N phụ thu, LEFT JOIN sẽ nhân base_price lên N lần.

    const recalcRes = await client.query<RecalcRow>(`
      WITH base AS (
        SELECT
          COALESCE(SUM(base_cost_price),    0) AS cost,
          COALESCE(SUM(base_selling_price), 0) AS selling
          FROM booking_rooms
         WHERE order_id = $1
      ),
      extras AS (
        SELECT
          COALESCE(SUM(brp.cost_price),    0) AS cost,
          COALESCE(SUM(brp.selling_price), 0) AS selling
          FROM booking_room_prices brp
          JOIN booking_rooms br ON br.id = brp.booking_room_id
         WHERE br.order_id = $1
           AND brp.type = 'surcharge'
      )
      SELECT
        (base.cost    + extras.cost)    AS total_room_cost,
        (base.selling + extras.selling) AS total_room_selling
      FROM base, extras
    `, [order_id]);

    const totalCost    = Number(recalcRes.rows[0].total_room_cost);
    const totalSelling = Number(recalcRes.rows[0].total_room_selling);

    // Ghi tổng lại vào orders.pricing JSONB (merge, không ghi đè toàn bộ)
    await client.query(
      `UPDATE orders
          SET pricing   = pricing || jsonb_build_object(
                            'room_cost_total',    $2::numeric,
                            'room_selling_total', $3::numeric
                          ),
              closed_at = CASE WHEN status = 'closed' THEN closed_at ELSE closed_at END
        WHERE id = $1`,
      [order_id, totalCost, totalSelling]
    );

    // ── 4. COMMIT ────────────────────────────────────────────────────────────
    await client.query("COMMIT");

    // ── 5. Trả về snapshot sạch để frontend render lại ──────────────────────
    //       Query sau COMMIT (ngoài transaction) — đọc dữ liệu đã persisted.

    const roomDetailsRes = await client.query<BookingRoomRow>(
      `SELECT id, room_name, base_cost_price, base_selling_price
         FROM booking_rooms
        WHERE order_id = $1
        ORDER BY sort_order ASC, created_at ASC`,
      [order_id]
    );

    const allocByRoomId = new Map(
      room_allocations.map((a) => [a.booking_room_id, a])
    );

    const rooms: RoomSnapshot[] = roomDetailsRes.rows.map((row) => {
      const alloc     = allocByRoomId.get(row.id);
      const guests    = alloc?.guests    ?? [];
      const surcharges: Surcharge[] = alloc?.surcharges ?? [];
      const baseCost    = Number(row.base_cost_price);
      const baseSelling = Number(row.base_selling_price);

      return {
        booking_room_id:    row.id,
        room_name:          row.room_name,
        base_cost_price:    baseCost,
        base_selling_price: baseSelling,
        guests,
        surcharges,
        room_cost_total:    baseCost    + sumSurcharges(surcharges, "cost_price"),
        room_selling_total: baseSelling + sumSurcharges(surcharges, "selling_price"),
      };
    });

    return {
      order_id,
      total_room_cost:    totalCost,
      total_room_selling: totalSelling,
      rooms,
      updated_at: new Date().toISOString(),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release(); // luôn trả connection về pool
  }
}
