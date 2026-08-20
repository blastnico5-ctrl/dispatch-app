import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ==========================================
// Supabase接続情報（環境変数または直接入力）
// ==========================================
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://gerofnrukjsmgnntkmfc.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "sb_publishable_fegZpNrwkDYf9-uBGEcSsw_X8s-CksX";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const uid = (p) => `${p}${Math.random().toString(36).slice(2, 8)}`;

const initialVehicles = [
  {
    id: "v1",
    hasTrailer: true,
    tractor: { maker: "日野", place: "大宮", code: "300", kana: "あ", num: "26" },
    trailer: { maker: "日本トレクス", place: "大宮", code: "100", kana: "い", num: "101" },
    type: "3軸トレーラ",
    status: "available",
    defaultDriverId: "d1",
  },
  {
    id: "v2",
    hasTrailer: true,
    tractor: { maker: "いすゞ", place: "品川", code: "300", kana: "う", num: "48" },
    trailer: { maker: "東急車輛", place: "品川", code: "100", kana: "え", num: "102" },
    type: "3軸トレーラ",
    status: "available",
    defaultDriverId: "d2",
  },
  {
    id: "v3",
    hasTrailer: false,
    tractor: { maker: "三菱ふそう", place: "横浜", code: "100", kana: "か", num: "2151" },
    trailer: { maker: "", place: "", code: "", kana: "", num: "" },
    type: "大型単車",
    status: "available",
    defaultDriverId: "d5",
  },
];

const initialDrivers = [
  { id: "d1", name: "君島秀幸", phone: "" },
  { id: "d2", name: "渡部光明", phone: "" },
  { id: "d3", name: "小田口誠", phone: "" },
  { id: "d4", name: "中嶋章", phone: "" },
  { id: "d5", name: "外薗桐郎", phone: "" },
];

const statusMeta = {
  available: { label: "待機中", color: "#4A5568" },
  maintenance: { label: "整備中", color: "#C53030" },
  running: { label: "稼働中", color: "#B5650A" },
};

const isEditableDate = (dateStr) => {
  if (!dateStr) return true;
  const [year, month] = dateStr.split("-").map(Number);
  const deadline = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return new Date() <= deadline;
};

const getRawDigits = (numStr) => (numStr ? String(numStr).replace(/\D/g, "") : "");

const formatBoardPlate = (v) => {
  if (!v) return "未定";
  const num = v.tractor?.num || v.tractorNum || v.num || v.tractor_num;
  const rawDigits = getRawDigits(num);
  if (rawDigits) return rawDigits;
  return v.type ? `${v.type} (未登録)` : "未設定";
};

const formatDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayString = () => formatDate(new Date());

const shiftDate = (currentDateStr, days) => {
  const [year, month, day] = currentDateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "5px 6px",
  fontSize: 12,
  border: "1px solid #D8D3C7",
  borderRadius: 4,
  fontFamily: "inherit",
  background: "#FFFCF8",
};

const btnPrimary = {
  fontSize: 12,
  padding: "6px 14px",
  borderRadius: 4,
  border: "none",
  background: "#E8871E",
  color: "#FFFFFF",
  fontWeight: 600,
  cursor: "pointer",
};

const btnGhost = {
  fontSize: 12,
  padding: "6px 14px",
  borderRadius: 4,
  border: "1px solid #D8D3C7",
  background: "#FFFFFF",
  color: "#4A5568",
  cursor: "pointer",
};

const btnDanger = {
  fontSize: 12,
  padding: "6px 14px",
  borderRadius: 4,
  border: "none",
  background: "#C53030",
  color: "#FFFFFF",
  fontWeight: 600,
  cursor: "pointer",
};

function ConfirmDialog({ dialog, onConfirm, onCancel }) {
  if (!dialog) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,35,50,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: 8,
          padding: 20,
          width: 360,
          maxWidth: "90%",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2332", marginBottom: 8 }}>
          {dialog.title}
        </div>
        {dialog.changes && (
          <div
            style={{
              fontSize: 12,
              color: "#4A5568",
              background: "#FBF9F4",
              border: "1px solid #ECE8DC",
              borderRadius: 4,
              padding: "8px 10px",
              marginBottom: 12,
              maxHeight: 160,
              overflowY: "auto",
            }}
          >
            {dialog.changes.map((c, i) => (
              <div key={i} style={{ marginBottom: 3 }}>
                <span style={{ color: "#8A857A" }}>{c.label}：</span>
                <span style={{ textDecoration: "line-through", color: "#B5B0A2" }}>
                  {c.before || "（空欄）"}
                </span>
                {" → "}
                <span style={{ color: "#1A2332", fontWeight: 600 }}>{c.after || "（空欄）"}</span>
              </div>
            ))}
          </div>
        )}
        {dialog.message && (
          <div style={{ fontSize: 13, color: "#4A5568", marginBottom: 12 }}>{dialog.message}</div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {dialog.readOnly ? (
            <button onClick={onCancel} style={btnPrimary}>
              閉じる
            </button>
          ) : (
            <>
              <button onClick={onCancel} style={btnGhost}>
                キャンセル
              </button>
              <button onClick={onConfirm} style={dialog.danger ? btnDanger : btnPrimary}>
                {dialog.confirmLabel || "確定する"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const meta = statusMeta[status] || statusMeta.available;
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: meta.color,
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  );
}

function Tag({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "#F0F0EC", color: "#6B6B63" },
    amber: { bg: "#FDEEDB", color: "#B5650A" },
    green: { bg: "#E6F4EA", color: "#137333" },
    blue: { bg: "#E8F0FE", color: "#1A73E8" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 4,
        background: t.bg,
        color: t.color,
        fontWeight: 700,
        display: "inline-block",
        marginRight: 4,
      }}
    >
      {children}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 11, color: "#8A857A", marginBottom: 4, fontWeight: 600 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

const JOB_FIELDS = [
  { key: "pickup", label: "積込先" },
  { key: "dropoff", label: "納入先" },
  { key: "item", label: "品目" },
];

const ASSIGN_FIELDS = [
  { key: "vehicleId", label: "車両" },
  { key: "driverId", label: "ドライバー" },
  { key: "sequence", label: "回次" },
  { key: "qty", label: "数量" },
  { key: "isOvernight", label: "宵積み" },
  { key: "dropDate", label: "卸日" },
];

function JobPanel({
  job,
  assignments,
  vehicles,
  drivers,
  currentDate,
  onSaveJob,
  onSaveAssignments,
  onRequestRemoveJob,
  onRequestRemoveAssignment,
  expanded,
  onToggle,
  isEditable = true,
}) {
  const jobAssignments = useMemo(
    () => assignments.filter((a) => a.jobId === job.id),
    [assignments, job.id]
  );

  const [draftJob, setDraftJob] = useState(job);
  const [draftAssignments, setDraftAssignments] = useState(jobAssignments);

  useEffect(() => {
    setDraftJob(job);
    setDraftAssignments(jobAssignments);
  }, [expanded, job, jobAssignments]);

  const jobDirty = JOB_FIELDS.some((f) => draftJob[f.key] !== job[f.key]);
  const assignDirty =
    draftAssignments.length !== jobAssignments.length ||
    draftAssignments.some((d) => {
      const orig = jobAssignments.find((o) => o.id === d.id);
      return !orig || ASSIGN_FIELDS.some((f) => String(d[f.key] ?? "") !== String(orig[f.key] ?? ""));
    });

  const getVehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${formatBoardPlate(v)} (${v.type || "標準"})` : "未定";
  };
  const getDriverLabel = (id) => drivers.find((d) => d.id === id)?.name || "未定";

  const handleSaveJob = () => {
    if (!isEditable) return;
    const changes = JOB_FIELDS.filter((f) => draftJob[f.key] !== job[f.key]).map((f) => ({
      label: f.label,
      before: job[f.key],
      after: draftJob[f.key],
    }));
    onSaveJob(job.id, draftJob, changes);
  };

  const handleSaveAssignments = () => {
    if (!isEditable) return;
    const formattedAssignments = draftAssignments.map((d) => {
      const v = vehicles.find((v) => v.id === d.vehicleId);
      const dr = drivers.find((dr) => dr.id === d.driverId);

      return {
        ...d,
        vehiclePlate: v ? formatBoardPlate(v) : d.vehiclePlate || "未定",
        driverName: dr ? dr.name : d.driverName || "担当未定",
      };
    });

    const changes = [];
    formattedAssignments.forEach((d) => {
      const orig = jobAssignments.find((o) => o.id === d.id);
      if (!orig) {
        changes.push({
          label: "配車を追加",
          before: "",
          after: `${getVehicleLabel(d.vehicleId)} / ${getDriverLabel(d.driverId)} / ${d.sequence}回目`,
        });
        return;
      }
      ASSIGN_FIELDS.forEach((f) => {
        if (String(d[f.key] ?? "") !== String(orig[f.key] ?? "")) {
          let before = orig[f.key];
          let after = d[f.key];
          if (f.key === "vehicleId") {
            before = getVehicleLabel(before);
            after = getVehicleLabel(after);
          }
          if (f.key === "driverId") {
            before = getDriverLabel(before);
            after = getDriverLabel(after);
          }
          if (f.key === "isOvernight") {
            before = before ? "あり" : "なし";
            after = after ? "あり" : "なし";
          }
          changes.push({ label: `${f.label}（配車枠）`, before, after });
        }
      });
    });
    onSaveAssignments(job, formattedAssignments, changes);
  };

  const addDraftAssignment = () => {
    if (!isEditable) return;
    setDraftAssignments((prev) => [
      ...prev,
      {
        id: uid("a"),
        jobId: job.id,
        vehicleId: null,
        driverId: null,
        sequence: 1,
        qty: "",
        isOvernight: false,
        dropDate: shiftDate(currentDate, 1),
      },
    ]);
  };

  const updateDraftAssignment = (id, patch) => {
    if (!isEditable) return;
    setDraftAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const handleVehicleChange = (assignmentId, selectedVehicleId) => {
    if (!isEditable) return;
    const targetVehicle = vehicles.find((v) => v.id === selectedVehicleId);

    setDraftAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        return {
          ...a,
          vehicleId: selectedVehicleId || null,
          driverId: targetVehicle?.defaultDriverId || a.driverId || null,
        };
      })
    );
  };

  const removeDraftAssignment = (id) => {
    if (!isEditable) return;
    setDraftAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div
      style={{
        border: "1px solid #D8D3C7",
        borderRadius: 6,
        marginBottom: 8,
        background: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          padding: "10px 12px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4A5568", fontWeight: 600 }}>
              {job.id.toUpperCase()}
            </span>
            {job.isOvernightDrop && <Tag tone="blue">宵下ろし</Tag>}
            <Tag tone={jobAssignments.length > 0 ? "amber" : "neutral"}>
              配車 {jobAssignments.length} 件
            </Tag>
          </div>
          <div style={{ fontSize: 13, color: "#1A2332" }}>
            {job.pickup || <span style={{ color: "#B5B0A2" }}>積込未登録</span>}
            {" → "}
            {job.dropoff || <span style={{ color: "#B5B0A2" }}>納入未登録</span>}
          </div>
        </div>
        <span style={{ color: "#8A857A", fontSize: 12 }}>{expanded ? "閉じる" : "詳細"}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #ECE8DC", padding: 12, background: "#FBF9F4" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            {JOB_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <input
                  disabled={!isEditable}
                  value={draftJob[f.key] || ""}
                  onChange={(e) => setDraftJob((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder="未登録可"
                  style={{ ...inputStyle, ...(isEditable ? {} : { opacity: 0.6, cursor: "not-allowed" }) }}
                />
              </Field>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button
              onClick={handleSaveJob}
              disabled={!isEditable || !jobDirty}
              style={{
                ...btnPrimary,
                opacity: isEditable && jobDirty ? 1 : 0.4,
                cursor: isEditable && jobDirty ? "pointer" : "not-allowed",
              }}
            >
              案件情報を保存
            </button>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2332", marginBottom: 6 }}>
            配車（車両・ドライバー・回次・宵積設定）
          </div>

          {draftAssignments.length === 0 && (
            <div style={{ fontSize: 12, color: "#B5B0A2", marginBottom: 8 }}>
              配車がまだありません。
            </div>
          )}

          {draftAssignments.map((a) => (
            <div
              key={a.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #ECE8DC",
                borderRadius: 6,
                padding: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 55px 1fr 28px",
                  gap: 6,
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <select
                  disabled={!isEditable}
                  value={a.vehicleId || ""}
                  onChange={(e) => handleVehicleChange(a.id, e.target.value)}
                  style={{ ...inputStyle, fontFamily: "monospace", ...(isEditable ? {} : { opacity: 0.6, cursor: "not-allowed" }) }}
                >
                  <option value="">車両未定</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.status === "maintenance"}>
                      {formatBoardPlate(v)} ({v.type || "標準"})
                    </option>
                  ))}
                </select>

                <select
                  disabled={!isEditable}
                  value={a.driverId || ""}
                  onChange={(e) => updateDraftAssignment(a.id, { driverId: e.target.value || null })}
                  style={{ ...inputStyle, ...(isEditable ? {} : { opacity: 0.6, cursor: "not-allowed" }) }}
                >
                  <option value="">担当未定</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <input
                  disabled={!isEditable}
                  type="number"
                  min={1}
                  value={a.sequence}
                  onChange={(e) =>
                    updateDraftAssignment(a.id, { sequence: Math.max(1, Number(e.target.value) || 1) })
                  }
                  style={{ ...inputStyle, ...(isEditable ? {} : { opacity: 0.6, cursor: "not-allowed" }) }}
                />
                <input
                  disabled={!isEditable}
                  value={a.qty || ""}
                  onChange={(e) => updateDraftAssignment(a.id, { qty: e.target.value })}
                  placeholder="数量"
                  style={{ ...inputStyle, ...(isEditable ? {} : { opacity: 0.6, cursor: "not-allowed" }) }}
                />
                <button
                  disabled={!isEditable}
                  onClick={() => {
                    if (jobAssignments.some((o) => o.id === a.id)) {
                      onRequestRemoveAssignment(a.id, () => removeDraftAssignment(a.id));
                    } else {
                      removeDraftAssignment(a.id);
                    }
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    color: isEditable ? "#C53030" : "#B5B0A2",
                    cursor: isEditable ? "pointer" : "not-allowed",
                    fontSize: 16,
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, background: "#F5F3EE", padding: "4px 8px", borderRadius: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontWeight: 600, color: "#137333" }}>
                  <input
                    type="checkbox"
                    disabled={!isEditable}
                    checked={!!a.isOvernight}
                    onChange={(e) =>
                      updateDraftAssignment(a.id, {
                        isOvernight: e.target.checked,
                        dropDate: a.dropDate || shiftDate(currentDate, 1),
                      })
                    }
                  />
                  宵積み（翌日以降に降ろす）
                </label>

                {a.isOvernight && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "#8A857A" }}>卸指定日:</span>
                    <input
                      type="date"
                      disabled={!isEditable}
                      value={a.dropDate || shiftDate(currentDate, 1)}
                      onChange={(e) => updateDraftAssignment(a.id, { dropDate: e.target.value })}
                      style={{ ...inputStyle, padding: "2px 4px", width: "auto", fontSize: 11 }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <button
              onClick={addDraftAssignment}
              disabled={!isEditable}
              style={{ ...btnGhost, opacity: isEditable ? 1 : 0.5, cursor: isEditable ? "pointer" : "not-allowed" }}
            >
              ＋ 配車を追加
            </button>
            <button
              onClick={handleSaveAssignments}
              disabled={!isEditable || !assignDirty}
              style={{
                ...btnPrimary,
                opacity: isEditable && assignDirty ? 1 : 0.4,
                cursor: isEditable && assignDirty ? "pointer" : "not-allowed",
              }}
            >
              配車内容を保存
            </button>
          </div>

          <div style={{ marginTop: 14, textAlign: "right" }}>
            <button
              disabled={!isEditable}
              onClick={() => onRequestRemoveJob(job.id)}
              style={{
                fontSize: 11,
                border: "none",
                background: "none",
                color: isEditable ? "#C53030" : "#B5B0A2",
                cursor: isEditable ? "pointer" : "not-allowed",
              }}
            >
              この案件を削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DispatchBoard({ vehicles, assignments, jobs, drivers, maxSeq }) {
  const cols = Array.from({ length: maxSeq }, (_, i) => i + 1);

  const displayVehicles = useMemo(() => {
  const list = [...vehicles];
  assignments.forEach((a) => {
    if (a.vehicleId && !list.some((v) => v.id === a.vehicleId)) {
      list.push({
        id: a.vehicleId,
        tractor: { num: a.vehiclePlate || "旧車両" },
        type: "削除済車両",
        status: "available",
        defaultDriverId: null,
      });
    }
  });
  return list;
}, [vehicles, assignments]);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 160 + cols.length * 200 }}>
        <div style={{ display: "flex", marginLeft: 160 }}>
          {cols.map((c) => (
            <div
              key={c}
              style={{
                width: 200,
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 700,
                color: "#4A5568",
                padding: "0 6px 6px",
              }}
            >
              {c}回目
            </div>
          ))}
        </div>

        {displayVehicles.map((v) => {
          const vAssignments = assignments
            .filter((a) => a.vehicleId === v.id)
            .sort((a, b) => a.sequence - b.sequence);

          return (
            <div key={v.id} style={{ display: "flex", borderTop: "1px solid #ECE8DC", minHeight: 56 }}>
              <div
                style={{
                  width: 160,
                  flexShrink: 0,
                  padding: "8px 8px 8px 12px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <StatusDot status={v.status} />
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      color: "#1A2332",
                      fontWeight: 700,
                    }}
                  >
                    {formatBoardPlate(v)}
                  </div>
                  <div style={{ fontSize: 10, color: "#8A857A" }}>{v.type || "車種未定"}</div>
                </div>
              </div>

              {cols.map((c) => {
                const cellAssignments = vAssignments.filter((a) => a.sequence === c);
                return (
                  <div
                    key={c}
                    style={{
                      width: 200,
                      flexShrink: 0,
                      borderLeft: "1px solid #F0EEE4",
                      padding: 6,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {cellAssignments.map((a) => {
                      const job = jobs.find((j) => j.id === a.jobId);
                      const driver = drivers.find((d) => d.id === a.driverId);
                      const driverDisplayName = driver ? driver.name : a.driverName || "担当未定";

                      const locationText = job
                        ? [job.pickup, job.dropoff].filter(Boolean).join(" → ")
                        : "";

                      return (
                        <div
                          key={a.id}
                          style={{
                            background: "#F6B15A",
                            border: "1px solid #E8871E",
                            borderRadius: 4,
                            padding: "4px 6px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
                            {a.isOvernight && <Tag tone="green">宵積</Tag>}
                            {job?.isOvernightDrop && <Tag tone="blue">宵下ろし</Tag>}
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#3D2400" }}>
                              {driverDisplayName}
                            </span>
                          </div>

                          {locationText && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "#5A3A00",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={locationText}
                            >
                              {locationText}
                            </div>
                          )}

                          {job?.item && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "#4A2F00",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={job.item}
                            >
                              品目: {job.item}
                            </div>
                          )}

                          {a.qty && <div style={{ fontSize: 10, color: "#5A3A00" }}>数量: {a.qty}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VehicleRow({ vehicle, drivers, onSave, onRequestRemove }) {
  const [draft, setDraft] = useState(vehicle);

  useEffect(() => {
    setDraft(vehicle);
  }, [vehicle]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(vehicle);

  const updateTractor = (key, val) => {
    setDraft((prev) => ({
      ...prev,
      tractor: { ...(prev.tractor || {}), [key]: val },
    }));
  };

  const updateTrailer = (key, val) => {
    setDraft((prev) => ({
      ...prev,
      trailer: { ...(prev.trailer || {}), [key]: val },
    }));
  };

  const handleSave = () => {
    onSave(vehicle.id, draft);
  };

  return (
    <tbody style={{ borderTop: "2px solid #D8D3C7" }}>
      <tr>
        <td
          rowSpan={draft.hasTrailer ? 2 : 1}
          style={{
            padding: "6px 4px",
            fontSize: 11,
            fontWeight: "bold",
            color: "#4A5568",
            background: "#FBF9F4",
            textAlign: "center",
            verticalAlign: "middle",
            borderRight: "1px solid #ECE8DC",
          }}
        >
          <div style={{ marginBottom: 4 }}>トラクタ (前)</div>
          <div>
            <label style={{ cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
              <input
                type="checkbox"
                checked={!!draft.hasTrailer}
                onChange={(e) => setDraft({ ...draft, hasTrailer: e.target.checked })}
              />
              トレーラー
            </label>
          </div>
        </td>
        <td style={{ padding: "4px" }}>
          <input
            value={draft.tractor?.maker || ""}
            onChange={(e) => updateTractor("maker", e.target.value)}
            style={inputStyle}
            placeholder="メーカー"
          />
        </td>
        <td style={{ padding: "4px" }}>
          <input
            value={draft.tractor?.place || ""}
            onChange={(e) => updateTractor("place", e.target.value)}
            style={inputStyle}
            placeholder="地名"
          />
        </td>
        <td style={{ padding: "4px" }}>
          <input
            value={draft.tractor?.code || ""}
            onChange={(e) => updateTractor("code", e.target.value)}
            style={inputStyle}
            placeholder="分類番号"
          />
        </td>
        <td style={{ padding: "4px" }}>
          <input
            value={draft.tractor?.kana || ""}
            onChange={(e) => updateTractor("kana", e.target.value)}
            style={inputStyle}
            placeholder="かな"
          />
        </td>
        <td style={{ padding: "4px" }}>
          <input
            value={draft.tractor?.num || ""}
            onChange={(e) => updateTractor("num", e.target.value)}
            style={{ ...inputStyle, fontFamily: "monospace", fontWeight: "bold" }}
            placeholder="車両番号"
          />
        </td>
        <td rowSpan={draft.hasTrailer ? 2 : 1} style={{ padding: "4px", verticalAlign: "middle" }}>
          <input
            value={draft.type || ""}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
            style={inputStyle}
            placeholder="車種"
          />
        </td>
        <td rowSpan={draft.hasTrailer ? 2 : 1} style={{ padding: "4px", verticalAlign: "middle" }}>
          <select
            value={draft.defaultDriverId || ""}
            onChange={(e) => setDraft({ ...draft, defaultDriverId: e.target.value || null })}
            style={inputStyle}
          >
            <option value="">未設定</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </td>
        <td rowSpan={draft.hasTrailer ? 2 : 1} style={{ padding: "4px", verticalAlign: "middle" }}>
          <select
            value={draft.status || "available"}
            onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            style={inputStyle}
          >
            {Object.entries(statusMeta).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </select>
        </td>
        <td rowSpan={draft.hasTrailer ? 2 : 1} style={{ padding: "4px 6px", textAlign: "right", verticalAlign: "middle" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <button
              onClick={handleSave}
              disabled={!dirty}
              style={{ ...btnPrimary, padding: "4px 10px", opacity: dirty ? 1 : 0.4 }}
            >
              保存
            </button>
            <button
              onClick={() => onRequestRemove(vehicle.id)}
              style={{ border: "none", background: "none", color: "#C53030", cursor: "pointer", fontSize: 11 }}
            >
              削除
            </button>
          </div>
        </td>
      </tr>

      {draft.hasTrailer && (
        <tr style={{ background: "#FAFAFA" }}>
          <td style={{ padding: "4px" }}>
            <input
              value={draft.trailer?.maker || ""}
              onChange={(e) => updateTrailer("maker", e.target.value)}
              style={inputStyle}
              placeholder="メーカー"
            />
          </td>
          <td style={{ padding: "4px" }}>
            <input
              value={draft.trailer?.place || ""}
              onChange={(e) => updateTrailer("place", e.target.value)}
              style={inputStyle}
              placeholder="地名"
            />
          </td>
          <td style={{ padding: "4px" }}>
            <input
              value={draft.trailer?.code || ""}
              onChange={(e) => updateTrailer("code", e.target.value)}
              style={inputStyle}
              placeholder="分類番号"
            />
          </td>
          <td style={{ padding: "4px" }}>
            <input
              value={draft.trailer?.kana || ""}
              onChange={(e) => updateTrailer("kana", e.target.value)}
              style={inputStyle}
              placeholder="かな"
            />
          </td>
          <td style={{ padding: "4px" }}>
            <input
              value={draft.trailer?.num || ""}
              onChange={(e) => updateTrailer("num", e.target.value)}
              style={{ ...inputStyle, fontFamily: "monospace" }}
              placeholder="車両番号"
            />
          </td>
        </tr>
      )}
    </tbody>
  );
}

function VehicleMaster({ vehicles, drivers, onAdd, onSave, onRequestRemove }) {
  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#8A857A", fontSize: 11, background: "#F5F3EE" }}>
            <th style={{ padding: "6px 4px", width: "110px", textAlign: "center" }}>区分</th>
            <th style={{ padding: "6px 4px", width: "11%" }}>メーカー</th>
            <th style={{ padding: "6px 4px", width: "10%" }}>地名</th>
            <th style={{ padding: "6px 4px", width: "10%" }}>分類番号</th>
            <th style={{ padding: "6px 4px", width: "8%" }}>ひらがな</th>
            <th style={{ padding: "6px 4px", width: "12%" }}>車両番号</th>
            <th style={{ padding: "6px 4px", width: "13%" }}>車種</th>
            <th style={{ padding: "6px 4px", width: "15%" }}>基本ドライバー</th>
            <th style={{ padding: "6px 4px", width: "11%" }}>状態</th>
            <th style={{ padding: "6px 4px" }} />
          </tr>
        </thead>
        {vehicles.map((v) => (
          <VehicleRow key={v.id} vehicle={v} drivers={drivers} onSave={onSave} onRequestRemove={onRequestRemove} />
        ))}
      </table>
      <button onClick={onAdd} style={{ ...btnPrimary, marginTop: 12 }}>＋ 車両を追加</button>
    </div>
  );
}

function DriverRow({ driver, onSave, onRequestRemove }) {
  const [draft, setDraft] = useState(driver);

  useEffect(() => {
    setDraft(driver);
  }, [driver]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(driver);

  return (
    <tr style={{ borderTop: "1px solid #ECE8DC" }}>
      <td style={{ padding: "4px 6px" }}>
        <input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} />
      </td>
      <td style={{ padding: "4px 6px" }}>
        <input value={draft.phone || ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="未入力" style={inputStyle} />
      </td>
      <td style={{ padding: "4px 6px", textAlign: "right" }}>
        <button onClick={() => onSave(driver.id, draft)} disabled={!dirty} style={{ ...btnPrimary, padding: "4px 10px", opacity: dirty ? 1 : 0.4, marginRight: 6 }}>保存</button>
        <button onClick={() => onRequestRemove(driver.id)} style={{ border: "none", background: "none", color: "#C53030", cursor: "pointer" }}>削除</button>
      </td>
    </tr>
  );
}

function DriverMaster({ drivers, onAdd, onSave, onRequestRemove }) {
  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#8A857A", fontSize: 11 }}>
            <th style={{ padding: "4px 6px" }}>氏名</th>
            <th style={{ padding: "4px 6px" }}>連絡先</th>
            <th style={{ padding: "4px 6px" }} />
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <DriverRow key={d.id} driver={d} onSave={onSave} onRequestRemove={onRequestRemove} />
          ))}
        </tbody>
      </table>
      <button onClick={onAdd} style={{ ...btnPrimary, marginTop: 10 }}>＋ ドライバーを追加</button>
    </div>
  );
}

const TABS = [
  { key: "board", label: "配車ボード" },
  { key: "vehicles", label: "車両マスター" },
  { key: "drivers", label: "ドライバーマスター" },
];

export default function App() {
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const isEditable = useMemo(() => isEditableDate(selectedDate), [selectedDate]);

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [tab, setTab] = useState("board");
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    fetchMasterData();
    fetchDailyData(selectedDate);

    const channel = supabase
      .channel("schema-db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => fetchMasterData())
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => fetchMasterData())
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => fetchDailyData(selectedDate))
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, () => fetchDailyData(selectedDate))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const fetchMasterData = async () => {
  // is_deleted が false または null のデータのみ取得
  const { data: vData } = await supabase
    .from("vehicles")
    .select("*")
    .or("is_deleted.is.null,is_deleted.eq.false");

  const { data: dData } = await supabase
    .from("drivers")
    .select("*")
    .or("is_deleted.is.null,is_deleted.eq.false");

  if (vData && vData.length > 0) {
    setVehicles(vData);
  } else {
    await supabase.from("vehicles").upsert(initialVehicles);
    setVehicles(initialVehicles);
  }

  if (dData && dData.length > 0) {
    setDrivers(dData);
  } else {
    await supabase.from("drivers").upsert(initialDrivers);
    setDrivers(initialDrivers);
  }
};

  const fetchDailyData = async (dateStr) => {
    const { data: jData } = await supabase.from("jobs").select("*").eq("date", dateStr);
    const { data: aData } = await supabase.from("assignments").select("*").eq("date", dateStr);

    setJobs(jData || []);
    setAssignments(aData || []);
    setExpandedJobId(jData?.[0]?.id || null);
  };

  const saveDailyData = async (newJobs, newAssignments) => {
    if (!isEditable) {
      setDialog({
        title: "変更できません",
        message: "配車日の翌月末を過ぎているため、案件データの変更・削除はできません。",
        readOnly: true,
      });
      return;
    }

    setJobs(newJobs);
    setAssignments(newAssignments);

    if (newJobs.length > 0) {
      const formattedJobs = newJobs.map((j) => ({ ...j, date: selectedDate }));
      await supabase.from("jobs").upsert(formattedJobs);
    }
    if (newAssignments.length > 0) {
      const formattedAssigns = newAssignments.map((a) => ({ ...a, date: selectedDate }));
      await supabase.from("assignments").upsert(formattedAssigns);
    }
  };

  // 宵積み（isOvernight）チェック時に指定日の「案件」と「配車枠」を自動作成
  const syncOvernightDrop = async (parentJob, assignment) => {
    if (!assignment.isOvernight || !assignment.dropDate) return;

    const targetDate = assignment.dropDate;

    const { data: targetJobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("date", targetDate);

    const existingJob = (targetJobs || []).find(
      (j) => j.fromOvernightId === assignment.id
    );
    const dropJobId = existingJob ? existingJob.id : uid("j");

    const newDropJob = {
      id: dropJobId,
      date: targetDate,
      pickup: parentJob.pickup || "",
      dropoff: parentJob.dropoff || "",
      item: parentJob.item || "",
      isOvernightDrop: true,
      fromOvernightId: assignment.id,
    };

    const { data: targetAssigns } = await supabase
      .from("assignments")
      .select("*")
      .eq("date", targetDate);

    const existingAssign = (targetAssigns || []).find(
      (a) => a.fromOvernightId === assignment.id
    );
    const dropAssignId = existingAssign ? existingAssign.id : uid("a");

    const newDropAssignment = {
      id: dropAssignId,
      date: targetDate,
      jobId: dropJobId,
      vehicleId: assignment.vehicleId || null,
      vehiclePlate: assignment.vehiclePlate || "未定",
      driverId: assignment.driverId || null,
      driverName: assignment.driverName || "担当未定",
      sequence: 1,
      qty: assignment.qty || "",
      isOvernight: false,
      dropDate: "",
      fromOvernightId: assignment.id,
    };

    await supabase.from("jobs").upsert([newDropJob]);
    await supabase.from("assignments").upsert([newDropAssignment]);

    if (selectedDate === targetDate) {
      await fetchDailyData(targetDate);
    }
  };

  const closeDialog = () => setDialog(null);
  const runConfirm = () => {
    if (dialog?.onConfirm) dialog.onConfirm();
    setDialog(null);
  };

  const handlePrevDay = () => setSelectedDate((prev) => shiftDate(prev, -1));
  const handleNextDay = () => setSelectedDate((prev) => shiftDate(prev, 1));

  const saveJob = (id, draft, changes) => {
    if (!isEditable) return;
    if (changes.length === 0) return;
    setDialog({
      title: "案件情報を保存しますか？",
      changes,
      onConfirm: async () => {
        const nextJobs = jobs.map((j) => (j.id === id ? { ...j, ...draft } : j));
        await saveDailyData(nextJobs, assignments);
      },
    });
  };

  const addJob = async () => {
    if (!isEditable) return;
    const id = uid("j");
    const nextJobs = [...jobs, { id, pickup: "", dropoff: "", item: "" }];
    await saveDailyData(nextJobs, assignments);
    setExpandedJobId(id);
  };

  const requestRemoveJob = (id) => {
    if (!isEditable) return;
    setDialog({
      title: "この案件を削除しますか？",
      message: "この案件に紐づく配車枠もすべて削除されます。",
      danger: true,
      confirmLabel: "削除する",
      onConfirm: async () => {
        const nextJobs = jobs.filter((j) => j.id !== id);
        const nextAssignments = assignments.filter((a) => a.jobId !== id);

        setJobs(nextJobs);
        setAssignments(nextAssignments);

        await supabase.from("jobs").delete().eq("id", id);
        await supabase.from("assignments").delete().eq("jobId", id);
      },
    });
  };

  const saveAssignments = (parentJob, draftList, changes) => {
    if (!isEditable) return;
    if (changes.length === 0) return;
    setDialog({
      title: "配車内容を保存しますか？",
      changes,
      onConfirm: async () => {
        const nextAssignments = [
          ...assignments.filter((a) => a.jobId !== parentJob.id),
          ...draftList,
        ];
        await saveDailyData(jobs, nextAssignments);

        for (const a of draftList) {
          if (a.isOvernight) {
            await syncOvernightDrop(parentJob, a);
          }
        }
      },
    });
  };

  const requestRemoveAssignment = (id, afterConfirm) => {
    if (!isEditable) return;
    setDialog({
      title: "この配車枠を削除しますか？",
      message: "割り当てられている情報が削除されます。",
      danger: true,
      confirmLabel: "削除する",
      onConfirm: async () => {
        const nextAssignments = assignments.filter((a) => a.id !== id);
        setAssignments(nextAssignments);
        await supabase.from("assignments").delete().eq("id", id);
        afterConfirm();
      },
    });
  };

  const addVehicle = async () => {
    const newV = {
      id: uid("v"),
      hasTrailer: true,
      tractor: { maker: "", place: "", code: "", kana: "", num: "" },
      trailer: { maker: "", place: "", code: "", kana: "", num: "" },
      type: "標準",
      status: "available",
      defaultDriverId: null,
    };
    setVehicles((prev) => [...prev, newV]);
    await supabase.from("vehicles").upsert([newV]);
  };

  const saveVehicle = (id, draft) => {
    setDialog({
      title: "車両情報を保存しますか？",
      onConfirm: async () => {
        const updated = { ...draft, id };
        setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
        await supabase.from("vehicles").upsert([updated]);
      },
    });
  };

  const requestRemoveVehicle = (id) => {
  setDialog({
    title: "この車両を削除（非表示）にしますか？",
    message: "マスター画面からは非表示になりますが、過去の配車記録には影響しません。",
    danger: true,
    confirmLabel: "削除する",
    onConfirm: async () => {
      // 画面上のステートから除外
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      // 物理削除ではなく is_deleted フラグを true に更新
      await supabase.from("vehicles").update({ is_deleted: true }).eq("id", id);
    },
  });
};

  const addDriver = async () => {
    const newD = { id: uid("d"), name: "", phone: "" };
    setDrivers((prev) => [...prev, newD]);
    await supabase.from("drivers").upsert([newD]);
  };

  const saveDriver = (id, draft) => {
    setDialog({
      title: "ドライバー情報を保存しますか？",
      onConfirm: async () => {
        const updated = { ...draft, id };
        setDrivers((prev) => prev.map((d) => (d.id === id ? updated : d)));
        await supabase.from("drivers").upsert([updated]);
      },
    });
  };

  const requestRemoveDriver = (id) => {
  setDialog({
    title: "このドライバーを削除（非表示）にしますか？",
    message: "マスター画面からは非表示になりますが、過去の配車記録には影響しません。",
    danger: true,
    confirmLabel: "削除する",
    onConfirm: async () => {
      // 画面上のステートから除外
      setDrivers((prev) => prev.filter((d) => d.id !== id));
      // 物理削除ではなく is_deleted フラグを true に更新
      await supabase.from("drivers").update({ is_deleted: true }).eq("id", id);
    },
  });
};

  const maxSeq = useMemo(
    () => Math.max(1, ...assignments.map((a) => a.sequence || 1)),
    [assignments]
  );

  const unassignedJobCount = useMemo(
    () => jobs.filter((j) => !assignments.some((a) => a.jobId === j.id)).length,
    [jobs, assignments]
  );

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif",
        background: "#F5F3EE",
        minHeight: "100vh",
        minWidth: "fit-content",
        width: "100%",
        padding: "20px 20px 20px 0px",
        boxSizing: "border-box",
        color: "#1A2332",
      }}
    >
      <ConfirmDialog dialog={dialog} onConfirm={runConfirm} onCancel={closeDialog} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingLeft: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ marginRight: 8 }}>配車管理</span>

            <button onClick={handlePrevDay} style={btnGhost}>
              ◀ 前日
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                fontSize: 14,
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid #D8D3C7",
                background: "#FFFFFF",
                fontWeight: "bold",
                color: "#1A2332",
                cursor: "pointer",
              }}
            />

            <button onClick={handleNextDay} style={btnGhost}>
              翌日 ▶
            </button>

            {!isEditable && (
              <span style={{ fontSize: 11, background: "#C53030", color: "#FFF", padding: "2px 8px", borderRadius: 4, marginLeft: 8 }}>
                編集不可（翌月末超過）
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: "#8A857A", marginTop: 4 }}>
            案件 {jobs.length} 件（うち配車未定 {unassignedJobCount} 件）／ 配車枠 {assignments.length} 件
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {Object.entries(statusMeta).map(([k, m]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", fontSize: 11, color: "#4A5568" }}>
              <StatusDot status={k} />
              {m.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, paddingLeft: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              fontSize: 12,
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #D8D3C7",
              background: tab === t.key ? "#1A2332" : "#FFFFFF",
              color: tab === t.key ? "#F5F3EE" : "#4A5568",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "board" && (
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16 }}>
          <div style={{ paddingLeft: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>案件一覧</div>
              <button
                onClick={addJob}
                disabled={!isEditable}
                style={{
                  ...btnPrimary,
                  opacity: isEditable ? 1 : 0.5,
                  cursor: isEditable ? "pointer" : "not-allowed",
                }}
              >
                ＋ 案件を追加
              </button>
            </div>
            <div style={{ maxHeight: 680, overflowY: "auto", paddingRight: 4 }}>
              {jobs.map((j) => (
                <JobPanel
                  key={j.id}
                  job={j}
                  assignments={assignments}
                  vehicles={vehicles}
                  drivers={drivers}
                  currentDate={selectedDate}
                  onSaveJob={saveJob}
                  onSaveAssignments={saveAssignments}
                  onRequestRemoveJob={requestRemoveJob}
                  onRequestRemoveAssignment={requestRemoveAssignment}
                  expanded={expandedJobId === j.id}
                  onToggle={() => setExpandedJobId(expandedJobId === j.id ? null : j.id)}
                  isEditable={isEditable}
                />
              ))}
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #D8D3C7", borderRadius: 8, padding: "16px 16px 16px 0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, paddingLeft: 16 }}>車両別スケジュール（回次順）</div>
            <DispatchBoard vehicles={vehicles} assignments={assignments} jobs={jobs} drivers={drivers} maxSeq={maxSeq} />
          </div>
        </div>
      )}

      {tab === "vehicles" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #D8D3C7", borderRadius: 8, padding: 16, marginLeft: 16, maxWidth: 1080 }}>
          <VehicleMaster vehicles={vehicles} drivers={drivers} onAdd={addVehicle} onSave={saveVehicle} onRequestRemove={requestRemoveVehicle} />
        </div>
      )}

      {tab === "drivers" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #D8D3C7", borderRadius: 8, padding: 16, marginLeft: 16, maxWidth: 560 }}>
          <DriverMaster drivers={drivers} onAdd={addDriver} onSave={saveDriver} onRequestRemove={requestRemoveDriver} />
        </div>
      )}
    </div>
  );
}