// Lịch trình theo ngày + danh sách bullet (Bao gồm/Không bao gồm) — dùng chung
// cho Chương trình mẫu (TourProgramModule) và Báo giá (QuoteModule), vì cả 2
// đều cần thêm/xoá/sửa ngày+hoạt động hoặc tự soạn từ đầu khi khách hỏi tour
// chưa có mẫu sẵn.
import React from "react";

const box = { border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 14, background: "var(--c-surface-2)" };
const lbl = { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "var(--c-text-2)" };
const inp = { width: "100%", border: "1px solid var(--c-border)", borderRadius: 8, padding: "7px 10px", fontSize: 13, boxSizing: "border-box" };
const btnGhost = { background: "none", border: "1px solid var(--c-border)", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--c-text-3)" };
const btnAdd = { background: "var(--c-primary-light)", color: "var(--c-primary-mid)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700, width: "100%" };
const btnDel = { background: "var(--c-danger-bg)", color: "var(--c-danger-mid)", border: "none", borderRadius: 7, width: 26, height: 26, cursor: "pointer", fontSize: 13, flexShrink: 0 };

export function ItineraryEditor({ itinerary = [], onChange }) {
  const days = itinerary || [];

  const updateDay = (idx, patch) => {
    onChange(days.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };
  const addDay = () => {
    onChange([...days, { day: days.length + 1, title: "", meals: "", activities: [] }]);
  };
  const removeDay = (idx) => {
    onChange(days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })));
  };
  const updateActivity = (dayIdx, actIdx, patch) => {
    const acts = (days[dayIdx].activities || []).map((a, i) => (i === actIdx ? { ...a, ...patch } : a));
    updateDay(dayIdx, { activities: acts });
  };
  const addActivity = (dayIdx) => {
    updateDay(dayIdx, { activities: [...(days[dayIdx].activities || []), { time: "", desc: "" }] });
  };
  const removeActivity = (dayIdx, actIdx) => {
    updateDay(dayIdx, { activities: (days[dayIdx].activities || []).filter((_, i) => i !== actIdx) });
  };

  return (
    <div>
      {days.map((d, dayIdx) => (
        <div key={dayIdx} style={{ ...box, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 10 }}>
            <div style={{ width: 70 }}>
              <label style={lbl}>Ngày</label>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--c-primary-mid)", padding: "7px 0" }}>#{d.day}</div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Tiêu đề ngày {d.day}</label>
              <input value={d.title || ""} onChange={e => updateDay(dayIdx, { title: e.target.value })} placeholder="VD: Hải Phòng - Ninh Bình - Tràng An" style={inp} />
            </div>
            <div style={{ width: 140 }}>
              <label style={lbl}>Bữa ăn</label>
              <input value={d.meals || ""} onChange={e => updateDay(dayIdx, { meals: e.target.value })} placeholder="Sáng+Trưa+Tối" style={inp} />
            </div>
            <button type="button" onClick={() => removeDay(dayIdx)} style={btnDel} title="Xoá ngày này">✕</button>
          </div>
          {(d.activities || []).map((act, actIdx) => (
            <div key={actIdx} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
              <input value={act.time || ""} onChange={e => updateActivity(dayIdx, actIdx, { time: e.target.value })} placeholder="08:00" style={{ ...inp, width: 80, flexShrink: 0 }} />
              <input value={act.desc || ""} onChange={e => updateActivity(dayIdx, actIdx, { desc: e.target.value })} placeholder="Mô tả hoạt động..." style={{ ...inp, flex: 1 }} />
              <button type="button" onClick={() => removeActivity(dayIdx, actIdx)} style={btnDel} title="Xoá dòng">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => addActivity(dayIdx)} style={{ ...btnGhost, marginTop: 4 }}>+ Thêm hoạt động</button>
        </div>
      ))}
      <button type="button" onClick={addDay} style={btnAdd}>+ Thêm ngày {days.length + 1}</button>
    </div>
  );
}

export function BulletListEditor({ items = [], onChange, placeholder = "Nhập nội dung..." }) {
  const list = items || [];
  const update = (idx, v) => onChange(list.map((x, i) => (i === idx ? v : x)));
  const add = () => onChange([...list, ""]);
  const remove = (idx) => onChange(list.filter((_, i) => i !== idx));

  return (
    <div>
      {list.map((v, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
          <span style={{ color: "var(--c-text-3)", flexShrink: 0 }}>•</span>
          <input value={v} onChange={e => update(idx, e.target.value)} placeholder={placeholder} style={{ ...inp, flex: 1 }} />
          <button type="button" onClick={() => remove(idx)} style={btnDel} title="Xoá dòng">✕</button>
        </div>
      ))}
      <button type="button" onClick={add} style={{ ...btnGhost, width: "100%" }}>+ Thêm dòng</button>
    </div>
  );
}
