import React, { useState, useMemo, useEffect } from "react";

const uid = (p) => `${p}${Math.random().toString(36).slice(2, 8)}`;

const initialVehicles = [
  { id: "v1", area: "足立", classNum: "100", kana: "か", num: "26", type: "3軸トレーラ", status: "available", defaultDriverId: "d1" },
  { id: "v2", area: "品川", classNum: "100", kana: "き", num: "48", type: "3軸トレーラ", status: "available", defaultDriverId: "d2" },
  { id: "v3", area: "練馬", classNum: "400", kana: "く", num: "122", type: "3軸トレーラ", status: "available", defaultDriverId: "d3" },
  { id: "v4", area: "多摩", classNum: "100", kana: "け", num: "898", type: "3軸トレーラ", status: "available", defaultDriverId: "d4" },
  { id: "v5", area: "横浜", classNum: "100", kana: "こ", num: "2151", type: "ランゲン", status: "available", defaultDriverId: "d5" },
  { id: "v6", area: "川崎", classNum: "100", kana: "さ", num: "2203", type: "ランゲン", status: "available", defaultDriverId: "d6" },
  { id: "v7", area: "相模", classNum: "100", kana: "し", num: "2228", type: "ランゲン", status: "available", defaultDriverId: "d7" },
  { id: "v8", area: "千葉", classNum: "100", kana: "す", num: "2239", type: "ランゲン", status: "available", defaultDriverId: "d8" },
  { id: "v9", area: "習志野", classNum: "100", kana: "せ", num: "2410", type: "ランゲン", status: "available", defaultDriverId: "d9" },
  { id: "v10", area: "柏", classNum: "100", kana: "そ", num: "5680", type: "ランゲン", status: "available", defaultDriverId: "d10" },
  { id: "v11", area: "大宮", classNum: "100", kana: "た", num: "3015", type: "チップ車", status: "available", defaultDriverId: "d11" },
  { id: "v12", area: "川越", classNum: "100", kana: "ち", num: "3214", type: "チップ車", status: "available", defaultDriverId: "d12" },
  { id: "v13", area: "所沢", classNum: "100", kana: "つ", num: "3296", type: "チップ車", status: "available", defaultDriverId: null },
];

const initialDrivers = [
  { id: "d1", name: "君島秀幸", phone: "" },
  { id: "d2", name: "渡部光明", phone: "" },
  { id: "d3", name: "小田口誠", phone: "" },
  { id: "d4", name: "中嶋章", phone: "" },
  { id: "d5", name: "外薗桐郎", phone: "" },
  { id: "d6", name: "佐々木武", phone: "" },
  { id: "d7", name: "森正行", phone: "" },
  { id: "d8", name: "堀口透", phone: "" },
  { id: "d9", name: "角谷隆利", phone: "" },
  { id: "d10", name: "三村高行", phone: "" },
  { id: "d11", name: "落合勝也", phone: "" },
  { id: "d12", name: "佐野RC", phone: "" },
];

const initialJobs = [
  { id: "j1", pickup: "千葉県市川市 A倉庫", dropoff: "東京都江東区 B物流センター", item: "紙製品パレット" },
  { id: "j2", pickup: "", dropoff: "神奈川県川崎市 C工場", item: "" },
  { id: "j3", pickup: "埼玉県越谷市 D流通センター", dropoff: "東京都足立区 E店舗", item: "飲料ケース" },
];

const initialAssignments = [
  { id: "a1", jobId: "j1", vehicleId: "v1", vehiclePlate: "26", driverId: "d1", driverName: "君島秀幸", sequence: 1, qty: "5パレット", isOvernight: false, dropDate: "" },
  { id: "a2", jobId: "j1", vehicleId: "v2", vehiclePlate: "48", driverId: "d2", driverName: "渡部光明", sequence: 1, qty: "3パレット", isOvernight: false, dropDate: "" },
  { id: "a3", jobId: "j3", vehicleId: "v1", vehiclePlate: "26", driverId: "d1", driverName: "君島秀幸", sequence: 2, qty: "", isOvernight: false, dropDate: "" },
  { id: "a4", jobId: "j2", vehicleId: "v5", vehiclePlate: "2151", driverId: "d5", driverName: "外薗桐郎", sequence: 1, qty: "", isOvernight: false, dropDate: "" },
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

const formatBoardPlate = (v) => (v ? getRawDigits(v.num) || "未設定" : "未定");

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
  padding: "6px 8px",
  fontSize: 13,
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
    return v ? `${formatBoardPlate(v)} (${v.type})` : "未定";
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
                      {formatBoardPlate(v)} ({v.type})
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

              {/* 宵積みオプション設定 */}
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
          area: "",
          classNum: "",
          kana: "",
          num: a.vehiclePlate || "旧車両",
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
                  padding: "8px 8px 8px 0",
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
                  <div style={{ fontSize: 10, color: "#8A857A" }}>{v.type}</div>
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

                      // ルート（積込先 → 納入先）の文字列生成
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
                          {/* ドライバー名と宵積・宵下ろしタグ */}
                          <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
                            {a.isOvernight && <Tag tone="green">宵積</Tag>}
                            {job?.isOvernightDrop && <Tag tone="blue">宵下ろし</Tag>}
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#3D2400" }}>
                              {driverDisplayName}
                            </span>
                          </div>

                          {/* 積込先 → 納入先 */}
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

                          {/* 品目 */}
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

                          {/* 数量 */}
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

function useDraftRow(row, fields) {
  const [draft, setDraft] = useState(row);

  useEffect(() => {
    setDraft(row);
  }, [row]);

  const dirty = fields.some((f) => String(draft[f.key] ?? "") !== String(row[f.key] ?? ""));
  return { draft, setDraft, dirty };
}

const VEHICLE_FIELDS = [
  { key: "area", label: "地域名" },
  { key: "classNum", label: "分類番号" },
  { key: "kana", label: "ひらがな" },
  { key: "num", label: "車両番号" },
  { key: "type", label: "車種" },
  { key: "defaultDriverId", label: "基本ドライバー" },
  { key: "status", label: "状態" },
];

function VehicleRow({ vehicle, drivers, onSave, onRequestRemove }) {
  const { draft, setDraft, dirty } = useDraftRow(vehicle, VEHICLE_FIELDS);

  const handleSave = () => {
    const changes = VEHICLE_FIELDS.filter((f) => draft[f.key] !== vehicle[f.key]).map((f) => {
      let before = vehicle[f.key];
      let after = draft[f.key];
      if (f.key === "status") {
        before = statusMeta[vehicle[f.key]]?.label;
        after = statusMeta[draft[f.key]]?.label;
      } else if (f.key === "defaultDriverId") {
        before = drivers.find((d) => d.id === vehicle[f.key])?.name || "未設定";
        after = drivers.find((d) => d.id === draft[f.key])?.name || "未設定";
      }
      return { label: f.label, before, after };
    });
    onSave(vehicle.id, draft, changes);
  };

  return (
    <tr style={{ borderTop: "1px solid #ECE8DC" }}>
      <td style={{ padding: "4px" }}>
        <input value={draft.area || ""} onChange={(e) => setDraft({ ...draft, area: e.target.value })} style={inputStyle} />
      </td>
      <td style={{ padding: "4px" }}>
        <input value={draft.classNum || ""} onChange={(e) => setDraft({ ...draft, classNum: e.target.value })} style={{ ...inputStyle, fontFamily: "monospace" }} />
      </td>
      <td style={{ padding: "4px" }}>
        <input value={draft.kana || ""} onChange={(e) => setDraft({ ...draft, kana: e.target.value })} style={inputStyle} />
      </td>
      <td style={{ padding: "4px" }}>
        <input value={draft.num || ""} onChange={(e) => setDraft({ ...draft, num: e.target.value })} maxLength={4} style={{ ...inputStyle, fontFamily: "monospace" }} />
      </td>
      <td style={{ padding: "4px" }}>
        <input value={draft.type || ""} onChange={(e) => setDraft({ ...draft, type: e.target.value })} style={inputStyle} />
      </td>
      <td style={{ padding: "4px" }}>
        <select value={draft.defaultDriverId || ""} onChange={(e) => setDraft({ ...draft, defaultDriverId: e.target.value || null })} style={inputStyle}>
          <option value="">未設定</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </td>
      <td style={{ padding: "4px" }}>
        <select value={draft.status || "available"} onChange={(e) => setDraft({ ...draft, status: e.target.value })} style={inputStyle}>
          {Object.entries(statusMeta).map(([k, m]) => (
            <option key={k} value={k}>{m.label}</option>
          ))}
        </select>
      </td>
      <td style={{ padding: "4px 6px", textAlign: "right" }}>
        <button onClick={handleSave} disabled={!dirty} style={{ ...btnPrimary, padding: "4px 10px", opacity: dirty ? 1 : 0.4, marginRight: 6 }}>保存</button>
        <button onClick={() => onRequestRemove(vehicle.id)} style={{ border: "none", background: "none", color: "#C53030", cursor: "pointer" }}>削除</button>
      </td>
    </tr>
  );
}

function VehicleMaster({ vehicles, drivers, onAdd, onSave, onRequestRemove }) {
  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#8A857A", fontSize: 11 }}>
            <th style={{ padding: "4px", width: "12%" }}>地域名</th>
            <th style={{ padding: "4px", width: "12%" }}>分類番号</th>
            <th style={{ padding: "4px", width: "10%" }}>かな</th>
            <th style={{ padding: "4px", width: "16%" }}>車両番号</th>
            <th style={{ padding: "4px", width: "16%" }}>車種</th>
            <th style={{ padding: "4px", width: "18%" }}>基本ドライバー</th>
            <th style={{ padding: "4px", width: "16%" }}>状態</th>
            <th style={{ padding: "4px" }} />
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <VehicleRow key={v.id} vehicle={v} drivers={drivers} onSave={onSave} onRequestRemove={onRequestRemove} />
          ))}
        </tbody>
      </table>
      <button onClick={onAdd} style={{ ...btnPrimary, marginTop: 10 }}>＋ 車両を追加</button>
    </div>
  );
}

const DRIVER_FIELDS = [
  { key: "name", label: "氏名" },
  { key: "phone", label: "連絡先" },
];

function DriverRow({ driver, onSave, onRequestRemove }) {
  const { draft, setDraft, dirty } = useDraftRow(driver, DRIVER_FIELDS);

  const handleSave = () => {
    const changes = DRIVER_FIELDS.filter((f) => draft[f.key] !== driver[f.key]).map((f) => ({
      label: f.label,
      before: driver[f.key],
      after: draft[f.key],
    }));
    onSave(driver.id, draft, changes);
  };

  return (
    <tr style={{ borderTop: "1px solid #ECE8DC" }}>
      <td style={{ padding: "4px 6px" }}>
        <input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} />
      </td>
      <td style={{ padding: "4px 6px" }}>
        <input value={draft.phone || ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="未入力" style={inputStyle} />
      </td>
      <td style={{ padding: "4px 6px", textAlign: "right" }}>
        <button onClick={handleSave} disabled={!dirty} style={{ ...btnPrimary, padding: "4px 10px", opacity: dirty ? 1 : 0.4, marginRight: 6 }}>保存</button>
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

export default function DispatchApp() {
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const isEditable = useMemo(() => isEditableDate(selectedDate), [selectedDate]);

  const [vehicles, setVehicles] = useState(() => {
    const saved = localStorage.getItem("dispatch_vehicles");
    return saved ? JSON.parse(saved) : initialVehicles;
  });

  const [drivers, setDrivers] = useState(() => {
    const saved = localStorage.getItem("dispatch_drivers");
    return saved ? JSON.parse(saved) : initialDrivers;
  });

  const [jobs, setJobs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [tab, setTab] = useState("board");
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const savedData = localStorage.getItem(`dispatch_data_${selectedDate}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setJobs(parsed.jobs || []);
      setAssignments(parsed.assignments || []);
      setExpandedJobId(parsed.jobs?.[0]?.id || null);
    } else {
      if (selectedDate === getTodayString()) {
        setJobs(initialJobs);
        setAssignments(initialAssignments);
        setExpandedJobId(initialJobs[0]?.id || null);
      } else {
        setJobs([]);
        setAssignments([]);
        setExpandedJobId(null);
      }
    }
  }, [selectedDate]);

  const saveDailyData = (newJobs, newAssignments) => {
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
    localStorage.setItem(
      `dispatch_data_${selectedDate}`,
      JSON.stringify({ jobs: newJobs, assignments: newAssignments })
    );
  };

  // 宵下ろし案件を自動生成して指定日に保存する関数
  const syncOvernightDrop = (parentJob, assignment) => {
    if (!assignment.isOvernight || !assignment.dropDate) return;

    const targetDateKey = `dispatch_data_${assignment.dropDate}`;
    const targetDataRaw = localStorage.getItem(targetDateKey);
    const targetData = targetDataRaw ? JSON.parse(targetDataRaw) : { jobs: [], assignments: [] };

    // 既に同一の宵下ろし案件が存在するかチェック
    const existingJob = targetData.jobs.find((j) => j.fromOvernightId === assignment.id);
    const dropJobId = existingJob ? existingJob.id : uid("j");

    const newDropJob = {
      id: dropJobId,
      pickup: `【宵下ろし】${parentJob.pickup || ""}`,
      dropoff: parentJob.dropoff,
      item: parentJob.item,
      isOvernightDrop: true,
      fromOvernightId: assignment.id,
    };

    const newDropAssignment = {
      id: uid("a"),
      jobId: dropJobId,
      vehicleId: assignment.vehicleId,
      vehiclePlate: assignment.vehiclePlate,
      driverId: assignment.driverId,
      driverName: assignment.driverName,
      sequence: 1, // 朝一番の下ろしとして1回目を初期セット
      qty: assignment.qty,
      isOvernight: false,
      dropDate: "",
    };

    const nextJobs = existingJob
      ? targetData.jobs.map((j) => (j.id === dropJobId ? newDropJob : j))
      : [...targetData.jobs, newDropJob];

    const nextAssignments = targetData.assignments.some((a) => a.jobId === dropJobId)
      ? targetData.assignments.map((a) => (a.jobId === dropJobId ? newDropAssignment : a))
      : [...targetData.assignments, newDropAssignment];

    localStorage.setItem(targetDateKey, JSON.stringify({ jobs: nextJobs, assignments: nextAssignments }));
  };

  useEffect(() => {
    localStorage.setItem("dispatch_vehicles", JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem("dispatch_drivers", JSON.stringify(drivers));
  }, [drivers]);

  const closeDialog = () => setDialog(null);
  const runConfirm = () => {
    if (dialog?.onConfirm) dialog.onConfirm();
    setDialog(null);
  };

  const handlePrevDay = () => setSelectedDate((prev) => shiftDate(prev, -1));
  const handleNextDay = () => setSelectedDate((prev) => shiftDate(prev, 1));

  const saveJob = (id, draft, changes) => {
    if (!isEditable) {
      saveDailyData([], []);
      return;
    }
    if (changes.length === 0) return;
    setDialog({
      title: "案件情報を保存しますか？",
      changes,
      onConfirm: () => {
        const nextJobs = jobs.map((j) => (j.id === id ? { ...j, ...draft } : j));
        saveDailyData(nextJobs, assignments);
      },
    });
  };

  const addJob = () => {
    if (!isEditable) {
      saveDailyData([], []);
      return;
    }
    const id = uid("j");
    const nextJobs = [...jobs, { id, pickup: "", dropoff: "", item: "" }];
    saveDailyData(nextJobs, assignments);
    setExpandedJobId(id);
  };

  const requestRemoveJob = (id) => {
    if (!isEditable) {
      saveDailyData([], []);
      return;
    }
    setDialog({
      title: "この案件を削除しますか？",
      message: "この案件に紐づく配車枠もすべて削除されます。",
      danger: true,
      confirmLabel: "削除する",
      onConfirm: () => {
        const nextJobs = jobs.filter((j) => j.id !== id);
        const nextAssignments = assignments.filter((a) => a.jobId !== id);
        saveDailyData(nextJobs, nextAssignments);
      },
    });
  };

  const saveAssignments = (parentJob, draftList, changes) => {
    if (!isEditable) {
      saveDailyData([], []);
      return;
    }
    if (changes.length === 0) return;
    setDialog({
      title: "配車内容を保存しますか？",
      changes,
      onConfirm: () => {
        const nextAssignments = [
          ...assignments.filter((a) => a.jobId !== parentJob.id),
          ...draftList,
        ];
        saveDailyData(jobs, nextAssignments);

        // 宵積みチェックが入っている配車枠を連動同期
        draftList.forEach((a) => {
          if (a.isOvernight) {
            syncOvernightDrop(parentJob, a);
          }
        });
      },
    });
  };

  const requestRemoveAssignment = (id, afterConfirm) => {
    if (!isEditable) {
      saveDailyData([], []);
      return;
    }
    setDialog({
      title: "この配車枠を削除しますか？",
      message: "割り当てられている情報が削除されます。",
      danger: true,
      confirmLabel: "削除する",
      onConfirm: () => {
        const nextAssignments = assignments.filter((a) => a.id !== id);
        saveDailyData(jobs, nextAssignments);
        afterConfirm();
      },
    });
  };

  const addVehicle = () =>
    setVehicles((prev) => [
      ...prev,
      { id: uid("v"), area: "", classNum: "", kana: "", num: "", type: "", status: "available", defaultDriverId: null },
    ]);

  const saveVehicle = (id, draft, changes) => {
    if (changes.length === 0) return;
    setDialog({
      title: "車両情報を保存しますか？",
      changes,
      onConfirm: () => setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...draft } : v))),
    });
  };

  const requestRemoveVehicle = (id) => {
    setDialog({
      title: "この車両を削除しますか？",
      message: "マスターから削除されても、過去の配車記録には名前がそのまま残ります。",
      danger: true,
      confirmLabel: "削除する",
      onConfirm: () => {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
      },
    });
  };

  const addDriver = () => setDrivers((prev) => [...prev, { id: uid("d"), name: "", phone: "" }]);

  const saveDriver = (id, draft, changes) => {
    if (changes.length === 0) return;
    setDialog({
      title: "ドライバー情報を保存しますか？",
      changes,
      onConfirm: () => setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...draft } : d))),
    });
  };

  const requestRemoveDriver = (id) => {
    setDialog({
      title: "このドライバーを削除しますか？",
      message: "マスターから削除されても、過去の配車記録には名前がそのまま残ります。",
      danger: true,
      confirmLabel: "削除する",
      onConfirm: () => {
        setDrivers((prev) => prev.filter((d) => d.id !== id));
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
        padding: 20,
        boxSizing: "border-box",
        color: "#1A2332",
      }}
    >
      <ConfirmDialog dialog={dialog} onConfirm={runConfirm} onCancel={closeDialog} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
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

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
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
          <div>
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

          <div style={{ background: "#FFFFFF", border: "1px solid #D8D3C7", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>車両別スケジュール（回次順）</div>
            <DispatchBoard vehicles={vehicles} assignments={assignments} jobs={jobs} drivers={drivers} maxSeq={maxSeq} />
          </div>
        </div>
      )}

      {tab === "vehicles" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #D8D3C7", borderRadius: 8, padding: 16, maxWidth: 960 }}>
          <VehicleMaster vehicles={vehicles} drivers={drivers} onAdd={addVehicle} onSave={saveVehicle} onRequestRemove={requestRemoveVehicle} />
        </div>
      )}

      {tab === "drivers" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #D8D3C7", borderRadius: 8, padding: 16, maxWidth: 560 }}>
          <DriverMaster drivers={drivers} onAdd={addDriver} onSave={saveDriver} onRequestRemove={requestRemoveDriver} />
        </div>
      )}
    </div>
  );
}