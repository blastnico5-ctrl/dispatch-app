import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントの初期化（環境変数または直接入力）
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 翌日日付を取得するユーティリティ関数
const getNextDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr.replace(/\//g, "-"));
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

export default function DispatchApp() {
  const [selectedDate, setSelectedDate] = useState("2026/08/20");
  const [activeTab, setActiveTab] = useState("board"); // board | vehicles | drivers
  const [isEditable, setIsEditable] = useState(true);

  // データ状態
  const [jobs, setJobs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [dialog, setDialog] = useState(null);

  // 初期データ読み込み
  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [
        { data: jData },
        { data: aData },
        { data: vData },
        { data: dData },
      ] = await Promise.all([
        supabase.from("jobs").select("*"),
        supabase.from("assignments").select("*"),
        supabase.from("vehicles").select("*"),
        supabase.from("drivers").select("*"),
      ]);

      if (jData) setJobs(jData);
      if (aData) setAssignments(aData);
      if (vData) setVehicles(vData);
      if (dData) setDrivers(dData);
    } catch (err) {
      console.error("データ取得エラー:", err);
    }
  };

  // --------------------------------------------------
  // 車両マスターの保存
  // --------------------------------------------------
  const saveVehicle = (id, draft) => {
    setDialog({
      title: "車両情報を保存しますか？",
      onConfirm: async () => {
        const updated = { ...draft, id };

        // 先行して画面表示を更新
        setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));

        // Supabaseへ保存（hasTrailer, tractor, trailer等の全データ）
        const { error } = await supabase.from("vehicles").upsert([updated]);
        if (error) {
          console.error("車両保存エラー:", error);
          alert("車両情報の保存に失敗しました: " + error.message);
        }
      },
    });
  };

  // --------------------------------------------------
  // 配車内容の保存（宵積み・宵降りの連携生成含む）
  // --------------------------------------------------
  const saveAssignments = (parentJob, draftList) => {
    if (!isEditable) return;

    setDialog({
      title: "配車内容を保存しますか？",
      onConfirm: async () => {
        // 1. 本日分の配車データ整形
        const todayAssignments = draftList.map((a) => {
          const assignId =
            a.id ||
            (window.crypto && window.crypto.randomUUID
              ? window.crypto.randomUUID()
              : String(Date.now() + Math.random()));
          return {
            id: assignId,
            jobId: parentJob.id,
            vehicleId: a.vehicleId || null,
            driverId: a.driverId || null,
            tripCount: Number(a.tripCount) || 1,
            qty: a.quantity || a.qty || "",
            isOvernight: Boolean(a.isOvernight),
            isOvernightDrop: false,
            dropDate: a.isOvernight
              ? a.dropDate || getNextDate(selectedDate)
              : null,
            date: selectedDate,
          };
        });

        // 2. 宵積み（翌日降ろし）にチェックがある場合、指定日に「宵降」配車を全自動作成
        const overnightDropAssignments = draftList
          .filter((a) => a.isOvernight && a.vehicleId)
          .map((a) => {
            const targetDropDate = a.dropDate || getNextDate(selectedDate);
            return {
              id: `${a.id || Date.now()}_drop`,
              jobId: parentJob.id,
              vehicleId: a.vehicleId,
              driverId: a.driverId,
              tripCount: Number(a.tripCount) || 1,
              qty: a.quantity || a.qty || "",
              isOvernight: false,
              isOvernightDrop: true, // 青色バッジ判定用フラグ
              dropDate: targetDropDate,
              date: targetDropDate, // 指定日（納入日）の配車枠に入る
            };
          });

        const payload = [...todayAssignments, ...overnightDropAssignments];

        // Supabaseへ保存を実行
        const { error } = await supabase.from("assignments").upsert(payload);

        if (error) {
          console.error("配車保存エラー:", error);
          alert("配車の保存に失敗しました: " + error.message);
          return;
        }

        // 保存成功後にローカル状態を同期
        setAssignments((prev) => [
          ...prev.filter(
            (a) => a.jobId !== parentJob.id || a.date !== selectedDate
          ),
          ...payload,
        ]);
      },
    });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* ダイアログ表示エリア */}
      {dialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="font-bold text-lg mb-4">{dialog.title}</h3>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                onClick={() => setDialog(null)}
              >
                キャンセル
              </button>
              <button
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                onClick={async () => {
                  await dialog.onConfirm();
                  setDialog(null);
                }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メインヘッダー */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">配車管理</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 rounded text-center font-bold"
          />
        </div>
      </header>

      {/* タブ切替 */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          className={`px-4 py-2 font-bold ${
            activeTab === "board"
              ? "bg-slate-800 text-white rounded-t"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("board")}
        >
          配車ボード
        </button>
        <button
          className={`px-4 py-2 font-bold ${
            activeTab === "vehicles"
              ? "bg-slate-800 text-white rounded-t"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("vehicles")}
        >
          車両マスター
        </button>
      </div>

      {/* 配車ボードコンテンツ */}
      {activeTab === "board" && (
        <div className="grid grid-cols-12 gap-4">
          {/* 案件一覧パネル（左） */}
          <div className="col-span-4 bg-white p-4 rounded shadow">
            <h2 className="font-bold mb-4">案件一覧</h2>
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                vehicles={vehicles}
                drivers={drivers}
                assignments={assignments.filter((a) => a.jobId === job.id)}
                onSave={(draftList) => saveAssignments(job, draftList)}
                selectedDate={selectedDate}
              />
            ))}
          </div>

          {/* 車両別スケジュール（右） */}
          <div className="col-span-8 bg-white p-4 rounded shadow">
            <h2 className="font-bold mb-4 text-center">車両別スケジュール</h2>
            <ScheduleGrid
              vehicles={vehicles}
              drivers={drivers}
              jobs={jobs}
              assignments={assignments.filter(
                (a) => a.date === selectedDate
              )}
            />
          </div>
        </div>
      )}

      {/* 車両マスターコンテンツ */}
      {activeTab === "vehicles" && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-4">車両マスター管理</h2>
          {vehicles.map((vehicle) => (
            <VehicleRow
              key={vehicle.id}
              vehicle={vehicle}
              onSave={saveVehicle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// サブコンポーネント: 案件カード＆配車設定フォーム
// --------------------------------------------------
function JobCard({ job, vehicles, drivers, assignments, onSave, selectedDate }) {
  const [draftList, setDraftList] = useState(assignments || []);

  useEffect(() => {
    setDraftList(assignments);
  }, [assignments]);

  const addRow = () => {
    setDraftList([
      ...draftList,
      {
        id: "",
        vehicleId: "",
        driverId: "",
        tripCount: draftList.length + 1,
        quantity: "",
        isOvernight: false,
        dropDate: getNextDate(selectedDate),
      },
    ]);
  };

  const updateRow = (index, field, val) => {
    const next = [...draftList];
    next[index] = { ...next[index], [field]: val };
    setDraftList(next);
  };

  return (
    <div className="border rounded p-4 mb-4 bg-amber-50/30">
      <div className="font-bold text-lg mb-2">
        {job.pickup} → {job.dropoff}
      </div>

      <div className="space-y-3 mb-4">
        {draftList.map((row, idx) => (
          <div key={idx} className="bg-white p-2 rounded border text-sm space-y-2">
            <div className="flex gap-2 items-center">
              <select
                value={row.vehicleId || ""}
                onChange={(e) => updateRow(idx, "vehicleId", e.target.value)}
                className="border p-1 rounded flex-1"
              >
                <option value="">車両未指定</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.num || v.id} ({v.type})
                  </option>
                ))}
              </select>

              <select
                value={row.driverId || ""}
                onChange={(e) => updateRow(idx, "driverId", e.target.value)}
                className="border p-1 rounded flex-1"
              >
                <option value="">担当未指定</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={row.tripCount || 1}
                onChange={(e) => updateRow(idx, "tripCount", e.target.value)}
                className="border p-1 rounded w-12 text-center"
              />
            </div>

            {/* 宵積み設定・卸指定日 */}
            <div className="flex items-center gap-2 pt-1 border-t text-xs">
              <label className="flex items-center gap-1 text-emerald-700 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(row.isOvernight)}
                  onChange={(e) => updateRow(idx, "isOvernight", e.target.checked)}
                />
                宵積み (翌日以降に降ろす)
              </label>

              {row.isOvernight && (
                <div className="flex items-center gap-1 ml-auto">
                  <span>卸指定日:</span>
                  <input
                    type="text"
                    value={row.dropDate || getNextDate(selectedDate)}
                    onChange={(e) => updateRow(idx, "dropDate", e.target.value)}
                    className="border p-0.5 rounded w-24 text-center bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={addRow}
          className="px-3 py-1 bg-white border rounded text-xs font-bold"
        >
          + 配車を追加
        </button>
        <button
          onClick={() => onSave(draftList)}
          className="px-4 py-2 bg-amber-600 text-white rounded font-bold text-sm hover:bg-amber-700"
        >
          配車内容を保存
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------
// サブコンポーネント: スケジュールグリッド（緑：宵積 / 青：宵降 バッジ表示）
// --------------------------------------------------
function ScheduleGrid({ vehicles, drivers, jobs, assignments }) {
  const getJobDetail = (jobId) => jobs.find((j) => j.id === jobId) || {};
  const getDriverDetail = (driverId) => drivers.find((d) => d.id === driverId) || {};

  return (
    <div className="space-y-2">
      {vehicles.map((v) => {
        const vAssigns = assignments.filter((a) => a.vehicleId === v.id);

        return (
          <div key={v.id} className="flex border rounded min-h-[60px] bg-white">
            <div className="w-24 p-2 border-r bg-gray-50 flex flex-col justify-center text-xs font-bold">
              <div>{v.num || v.id}</div>
              <div className="text-gray-400">{v.type}</div>
            </div>

            <div className="flex-1 grid grid-cols-5 gap-1 p-1">
              {[1, 2, 3, 4, 5].map((trip) => {
                const assign = vAssigns.find((a) => Number(a.tripCount) === trip);
                const job = assign ? getJobDetail(assign.jobId) : null;
                const driver = assign ? getDriverDetail(assign.driverId) : null;

                return (
                  <div
                    key={trip}
                    className={`border rounded p-1 text-xs flex flex-col justify-between ${
                      assign ? "bg-amber-100 border-amber-300" : "bg-gray-50/50"
                    }`}
                  >
                    {assign && (
                      <>
                        <div className="font-bold flex items-center justify-between">
                          <span>{driver.name || "未定"}</span>
                          <div>
                            {/* 緑マーク：宵積み */}
                            {assign.isOvernight && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1 py-0.5 rounded font-bold">
                                宵積
                              </span>
                            )}
                            {/* 青マーク：宵降り */}
                            {assign.isOvernightDrop && (
                              <span className="bg-sky-100 text-sky-800 text-[10px] px-1 py-0.5 rounded font-bold">
                                宵降
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] truncate">
                          {job.pickup} → {job.dropoff}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          品目: {job.item || "-"}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --------------------------------------------------
// サブコンポーネント: 車両マスター行 (1行目:ヘッド / 2行目:トレーラー)
// --------------------------------------------------
function VehicleRow({ vehicle, onSave }) {
  const [draft, setDraft] = useState(
    vehicle || {
      hasTrailer: true,
      tractor: {},
      trailer: {},
    }
  );

  const handleSave = () => {
    // draft 全体（hasTrailer, tractor, trailer等）を渡して保存
    onSave(vehicle.id, draft);
  };

  return (
    <div className="border rounded p-3 mb-3 bg-white space-y-2">
      {/* 1行目：ヘッド側 */}
      <div className="flex gap-2 items-center text-sm">
        <span className="font-bold text-gray-500 w-16">ヘッド</span>
        <input
          type="text"
          placeholder="メーカー"
          value={draft.tractor?.maker || ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              tractor: { ...draft.tractor, maker: e.target.value },
            })
          }
          className="border p-1 rounded"
        />
        <input
          type="text"
          placeholder="ナンバー"
          value={draft.tractor?.num || ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              tractor: { ...draft.tractor, num: e.target.value },
            })
          }
          className="border p-1 rounded"
        />
      </div>

      {/* 2行目：トレーラー側 */}
      {draft.hasTrailer && (
        <div className="flex gap-2 items-center text-sm pl-4 border-l-2 border-amber-400">
          <span className="font-bold text-gray-500 w-12">台車</span>
          <input
            type="text"
            placeholder="メーカー"
            value={draft.trailer?.maker || ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                trailer: { ...draft.trailer, maker: e.target.value },
              })
            }
            className="border p-1 rounded"
          />
          <input
            type="text"
            placeholder="ナンバー"
            value={draft.trailer?.num || ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                trailer: { ...draft.trailer, num: e.target.value },
              })
            }
            className="border p-1 rounded"
          />
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-slate-800 text-white rounded text-xs font-bold"
        >
          車両マスター保存
        </button>
      </div>
    </div>
  );
}