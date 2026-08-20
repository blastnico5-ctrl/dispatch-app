import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ==========================================
// Supabase設定
// ==========================================
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://gerofnrukjsmgnntkmfc.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "sb_publishable_fegZpNrwkDYf9-uBGEcSsw_X8s-CksX";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const statusMeta = {
  available: { label: "待機中", color: "#4A5568" },
  maintenance: { label: "整備中", color: "#C53030" },
  running: { label: "稼働中", color: "#B5650A" },
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

const getWeekDays = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = targetDate.getDay();
  
  const sunday = new Date(targetDate);
  sunday.setDate(targetDate.getDate() - dayOfWeek);

  const days = [];
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push({
      dateStr: formatDate(d),
      dayName: dayNames[i],
      monthDay: `${d.getMonth() + 1}/${d.getDate()}`,
      isSunday: i === 0,
      isSaturday: i === 6,
    });
  }
  return days;
};

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

const btnGhost = {
  fontSize: 12,
  padding: "6px 14px",
  borderRadius: 4,
  border: "1px solid #D8D3C7",
  background: "#FFFFFF",
  color: "#4A5568",
  cursor: "pointer",
};

// ==========================================
// 週間配車ボード単体コンポーネント
// ==========================================
function DispatchBoardOnly({ vehicles, assignments, jobs, drivers, maxSeq, weekDays, selectedDate }) {
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
        });
      }
    });
    return list;
  }, [vehicles, assignments]);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 160 + weekDays.length * cols.length * 180 }}>
        {/* 日付ヘッダー */}
        <div style={{ display: "flex", marginLeft: 160 }}>
          {weekDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            let color = "#1A2332";
            if (day.isSunday) color = "#C53030";
            if (day.isSaturday) color = "#1A73E8";

            return (
              <div
                key={day.dateStr}
                style={{
                  width: cols.length * 180,
                  flexShrink: 0,
                  textAlign: "center",
                  background: isSelected ? "#E8871E" : "#ECE8DC",
                  color: isSelected ? "#FFFFFF" : color,
                  fontWeight: 700,
                  fontSize: 12,
                  padding: "6px 0",
                  borderRight: "1px solid #D8D3C7",
                }}
              >
                {day.monthDay} ({day.dayName})
              </div>
            );
          })}
        </div>

        {/* 回次ヘッダー */}
        <div style={{ display: "flex", marginLeft: 160 }}>
          {weekDays.map((day) =>
            cols.map((c) => (
              <div
                key={`${day.dateStr}-${c}`}
                style={{
                  width: 180,
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4A5568",
                  padding: "4px 6px",
                  textAlign: "center",
                  background: "#FBF9F4",
                  borderRight: "1px solid #ECE8DC",
                  borderBottom: "1px solid #D8D3C7",
                }}
              >
                {c}回目
              </div>
            ))
          )}
        </div>

        {/* 車両行 */}
        {displayVehicles.map((v) => (
          <div key={v.id} style={{ display: "flex", borderTop: "1px solid #ECE8DC", minHeight: 60 }}>
            <div
              style={{
                width: 160,
                flexShrink: 0,
                padding: "8px 8px 8px 12px",
                display: "flex",
                alignItems: "center",
                background: "#FFFFFF",
                position: "sticky",
                left: 0,
                zIndex: 1,
                borderRight: "2px solid #D8D3C7",
              }}
            >
              <StatusDot status={v.status} />
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 13, color: "#1A2332", fontWeight: 700 }}>
                  {formatBoardPlate(v)}
                </div>
                <div style={{ fontSize: 10, color: "#8A857A" }}>{v.type || "車種未定"}</div>
              </div>
            </div>

            {weekDays.map((day) => {
              const dayAssignments = assignments.filter((a) => a.vehicleId === v.id && a.date === day.dateStr);

              return cols.map((c) => {
                const cellAssignments = dayAssignments.filter((a) => a.sequence === c);
                return (
                  <div
                    key={`${day.dateStr}-${c}`}
                    style={{
                      width: 180,
                      flexShrink: 0,
                      borderRight: "1px solid #ECE8DC",
                      padding: 4,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      background: day.dateStr === selectedDate ? "#FFFDF9" : "#FFFFFF",
                    }}
                  >
                    {cellAssignments.map((a) => {
                      const job = jobs.find((j) => j.id === a.jobId);
                      const driver = drivers.find((d) => d.id === a.driverId);
                      const driverDisplayName = driver ? driver.name : a.driverName || "担当未定";

                      const locationText = job ? [job.pickup, job.dropoff].filter(Boolean).join(" → ") : "";

                      return (
                        <div
                          key={a.id}
                          style={{
                            background: "#F6B15A",
                            border: "1px solid #E8871E",
                            borderRadius: 4,
                            padding: "6px 8px",
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
              });
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 別ページ用独立コンポーネント（メイン）
// ==========================================
export default function WeeklyBoardPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchMasterData();
    fetchWeeklyData(weekDays);

    const channel = supabase
      .channel("schema-db-weekly-view")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => fetchMasterData())
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => fetchMasterData())
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => fetchWeeklyData(weekDays))
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, () => fetchWeeklyData(weekDays))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, weekDays]);

  const fetchMasterData = async () => {
    const { data: vData } = await supabase.from("vehicles").select("*").or("is_deleted.is.null,is_deleted.eq.false");
    const { data: dData } = await supabase.from("drivers").select("*").or("is_deleted.is.null,is_deleted.eq.false");
    setVehicles(vData || []);
    setDrivers(dData || []);
  };

  const fetchWeeklyData = async (days) => {
    const dates = days.map((d) => d.dateStr);
    const { data: jData } = await supabase.from("jobs").select("*").in("date", dates);
    const { data: aData } = await supabase.from("assignments").select("*").in("date", dates);

    setJobs(jData || []);
    setAssignments(aData || []);
  };

  const handlePrevWeek = () => setSelectedDate((prev) => shiftDate(prev, -7));
  const handleNextWeek = () => setSelectedDate((prev) => shiftDate(prev, 7));

  const maxSeq = useMemo(
    () => Math.max(1, ...assignments.map((a) => a.sequence || 1)),
    [assignments]
  );

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif",
        background: "#F5F3EE",
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
        color: "#1A2332",
      }}
    >
      {/* ヘッダーエリア */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>週間配車表</h2>

          <button onClick={handlePrevWeek} style={btnGhost}>◀ 前週</button>

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

          <button onClick={handleNextWeek} style={btnGhost}>翌週 ▶</button>
        </div>

        {/* 凡例 */}
        <div style={{ display: "flex", gap: 16 }}>
          {Object.entries(statusMeta).map(([k, m]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", fontSize: 11, color: "#4A5568" }}>
              <StatusDot status={k} />
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* 週間配車表本体 */}
      <div style={{ background: "#FFFFFF", border: "1px solid #D8D3C7", borderRadius: 8, padding: "16px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <DispatchBoardOnly
          vehicles={vehicles}
          assignments={assignments}
          jobs={jobs}
          drivers={drivers}
          maxSeq={maxSeq}
          weekDays={weekDays}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}