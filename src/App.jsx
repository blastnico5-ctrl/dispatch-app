import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  // --- ステート定義 ---
  const [activeTab, setActiveTab] = useState("board"); // "board" | "vehicles" | "drivers" | "jobs"
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // データ用ステート
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // フォーム用ステート
  const [vehicleForm, setVehicleForm] = useState({
    id: null,
    tractor_number: "",
    trailer_number: "",
    notes: "",
  });
  const [driverForm, setDriverForm] = useState({ id: null, name: "" });
  const [jobForm, setJobForm] = useState({
    id: null,
    title: "",
    location: "",
    time: "",
  });

  // --- データ取得関数 ---
  const fetchMasterData = async () => {
    const { data: vData } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: true });
    if (vData) setVehicles(vData);

    const { data: dData } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: true });
    if (dData) setDrivers(dData);

    const { data: jData } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: true });
    if (jData) setJobs(jData);
  };

  const fetchDailyData = async (date) => {
    const { data: aData } = await supabase
      .from("assignments")
      .select("*")
      .eq("date", date);
    if (aData) setAssignments(aData);
  };

  // --- 初期表示 ＆ Realtimeサブスクリプション ---
  useEffect(() => {
    fetchMasterData();
    fetchDailyData(selectedDate);

    // Supabase Realtime でデータベース変更を検知
    const channel = supabase
      .channel("dispatch-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => {
          fetchMasterData();
          fetchDailyData(selectedDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  // --- 操作処理 ---

  // 車両マスター登録・更新
  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.tractor_number.trim()) {
      alert("トラクタ番号は必須です");
      return;
    }

    if (vehicleForm.id) {
      await supabase
        .from("vehicles")
        .update({
          tractor_number: vehicleForm.tractor_number,
          trailer_number: vehicleForm.trailer_number,
          notes: vehicleForm.notes,
        })
        .eq("id", vehicleForm.id);
    } else {
      await supabase.from("vehicles").insert([
        {
          tractor_number: vehicleForm.tractor_number,
          trailer_number: vehicleForm.trailer_number,
          notes: vehicleForm.notes,
        },
      ]);
    }

    setVehicleForm({ id: null, tractor_number: "", trailer_number: "", notes: "" });
    fetchMasterData();
  };

  const handleDeleteVehicle = async (id) => {
    if (window.confirm("この車両を削除しますか？")) {
      await supabase.from("vehicles").delete().eq("id", id);
      fetchMasterData();
    }
  };

  // 運転手マスター保存
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    if (!driverForm.name.trim()) return;

    if (driverForm.id) {
      await supabase.from("drivers").update({ name: driverForm.name }).eq("id", driverForm.id);
    } else {
      await supabase.from("drivers").insert([{ name: driverForm.name }]);
    }
    setDriverForm({ id: null, name: "" });
    fetchMasterData();
  };

  const handleDeleteDriver = async (id) => {
    if (window.confirm("この運転手を削除しますか？")) {
      await supabase.from("drivers").delete().eq("id", id);
      fetchMasterData();
    }
  };

  // 案件マスター保存
  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title.trim()) return;

    if (jobForm.id) {
      await supabase.from("jobs").update(jobForm).eq("id", jobForm.id);
    } else {
      await supabase.from("jobs").insert([jobForm]);
    }
    setJobForm({ id: null, title: "", location: "", time: "" });
    fetchMasterData();
  };

  const handleDeleteJob = async (id) => {
    if (window.confirm("この案件を削除しますか？")) {
      await supabase.from("jobs").delete().eq("id", id);
      fetchMasterData();
    }
  };

  // 配車設定の更新 (セルごとに保存)
  const handleAssignmentChange = async (vehicleId, field, value) => {
    const existing = assignments.find((a) => a.vehicle_id === vehicleId);

    if (existing) {
      await supabase
        .from("assignments")
        .update({ [field]: value })
        .eq("id", existing.id);
    } else {
      await supabase.from("assignments").insert([
        {
          date: selectedDate,
          vehicle_id: vehicleId,
          [field]: value,
        },
      ]);
    }
    fetchDailyData(selectedDate);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 font-sans">
      {/* ヘッダー & タブ切り替え */}
      <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">配車管理システム</h1>
        <nav className="flex gap-2">
          <button
            onClick={() => setActiveTab("board")}
            className={`px-4 py-2 rounded-md font-medium transition ${
              activeTab === "board"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            配車ボード
          </button>
          <button
            onClick={() => setActiveTab("vehicles")}
            className={`px-4 py-2 rounded-md font-medium transition ${
              activeTab === "vehicles"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            車両マスター
          </button>
          <button
            onClick={() => setActiveTab("drivers")}
            className={`px-4 py-2 rounded-md font-medium transition ${
              activeTab === "drivers"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            運転手マスター
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 rounded-md font-medium transition ${
              activeTab === "jobs"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            案件マスター
          </button>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto">
        {/* ================= 配車ボード画面 ================= */}
        {activeTab === "board" && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <label className="font-bold text-gray-700">対象日付:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border p-2 rounded-md shadow-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="border p-3 text-left w-1/4">車両 (トラクタ)</th>
                    <th className="border p-3 text-left w-1/3">担当運転手</th>
                    <th className="border p-3 text-left w-1/3">割り当て案件</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="border p-4 text-center text-gray-500">
                        車両マスターが登録されていません
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((vehicle) => {
                      const assignment = assignments.find(
                        (a) => a.vehicle_id === vehicle.id
                      ) || {};

                      return (
                        <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                          {/* トラクタの車両番号のみを表示 */}
                          <td className="border p-3 font-bold text-gray-800 bg-gray-50/50">
                            {vehicle.tractor_number || "未登録"}
                          </td>

                          {/* 運転手選択 */}
                          <td className="border p-2">
                            <select
                              value={assignment.driver_id || ""}
                              onChange={(e) =>
                                handleAssignmentChange(
                                  vehicle.id,
                                  "driver_id",
                                  e.target.value || null
                                )
                              }
                              className="w-full p-2 border rounded bg-white"
                            >
                              <option value="">-- 未設定 --</option>
                              {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* 案件選択 */}
                          <td className="border p-2">
                            <select
                              value={assignment.job_id || ""}
                              onChange={(e) =>
                                handleAssignmentChange(
                                  vehicle.id,
                                  "job_id",
                                  e.target.value || null
                                )
                              }
                              className="w-full p-2 border rounded bg-white"
                            >
                              <option value="">-- 未設定 --</option>
                              {jobs.map((j) => (
                                <option key={j.id} value={j.id}>
                                  {j.title} {j.location ? `(${j.location})` : ""}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 車両マスター画面 ================= */}
        {activeTab === "vehicles" && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800">車両マスター管理</h2>

            {/* 登録・編集フォーム */}
            <form onSubmit={handleSaveVehicle} className="mb-8 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-md font-semibold mb-3">
                {vehicleForm.id ? "車両情報の編集" : "新規車両登録"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    トラクタ番号（前）<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="例: 足立400あ1234"
                    value={vehicleForm.tractor_number}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, tractor_number: e.target.value })
                    }
                    className="w-full border p-2 rounded bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    トレーラー番号（後）
                  </label>
                  <input
                    type="text"
                    placeholder="例: 足立400い5678"
                    value={vehicleForm.trailer_number}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, trailer_number: e.target.value })
                    }
                    className="w-full border p-2 rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {vehicleForm.id ? "更新する" : "追加する"}
                </button>
                {vehicleForm.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setVehicleForm({ id: null, tractor_number: "", trailer_number: "", notes: "" })
                    }
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </form>

            {/* 一覧テーブル */}
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="border p-3 text-left">トラクタ番号（前）</th>
                  <th className="border p-3 text-left">トレーラー番号（後）</th>
                  <th className="border p-3 text-center w-32">操作</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b">
                    <td className="border p-3 font-bold">{v.tractor_number}</td>
                    <td className="border p-3 text-gray-600">{v.trailer_number || "-"}</td>
                    <td className="border p-3 text-center">
                      <button
                        onClick={() =>
                          setVehicleForm({
                            id: v.id,
                            tractor_number: v.tractor_number || "",
                            trailer_number: v.trailer_number || "",
                            notes: v.notes || "",
                          })
                        }
                        className="text-blue-600 hover:underline mr-3"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="text-red-600 hover:underline"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= 運転手マスター画面 ================= */}
        {activeTab === "drivers" && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800">運転手マスター管理</h2>
            <form onSubmit={handleSaveDriver} className="mb-6 flex gap-2">
              <input
                type="text"
                placeholder="運転手名を入力"
                value={driverForm.name}
                onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                className="border p-2 rounded w-64"
                required
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {driverForm.id ? "更新" : "追加"}
              </button>
            </form>

            <ul className="divide-y border rounded-md">
              {drivers.map((d) => (
                <li key={d.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                  <span>{d.name}</span>
                  <div>
                    <button
                      onClick={() => setDriverForm({ id: d.id, name: d.name })}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(d.id)}
                      className="text-red-600 hover:underline"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ================= 案件マスター画面 ================= */}
        {activeTab === "jobs" && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800">案件マスター管理</h2>
            <form onSubmit={handleSaveJob} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="案件名 *"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="場所・目的地"
                value={jobForm.location}
                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                className="border p-2 rounded"
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {jobForm.id ? "更新" : "追加"}
              </button>
            </form>

            <ul className="divide-y border rounded-md">
              {jobs.map((j) => (
                <li key={j.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <span className="font-bold">{j.title}</span>
                    {j.location && <span className="text-gray-500 ml-2">({j.location})</span>}
                  </div>
                  <div>
                    <button
                      onClick={() =>
                        setJobForm({
                          id: j.id,
                          title: j.title,
                          location: j.location || "",
                          time: j.time || "",
                        })
                      }
                      className="text-blue-600 hover:underline mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteJob(j.id)}
                      className="text-red-600 hover:underline"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}