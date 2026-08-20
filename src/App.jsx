import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [activeTab, setActiveTab] = useState("board");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // 車両フォーム（トラクタ・トレーラー対応）
  const [vehicleForm, setVehicleForm] = useState({
    id: null,
    tractor_number: "",
    trailer_number: "",
  });
  const [driverForm, setDriverForm] = useState({ id: null, name: "" });
  const [jobForm, setJobForm] = useState({ id: null, title: "", location: "" });

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

  useEffect(() => {
    fetchMasterData();
    fetchDailyData(selectedDate);

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

  // 車両保存
  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.tractor_number.trim()) return;

    if (vehicleForm.id) {
      await supabase
        .from("vehicles")
        .update({
          tractor_number: vehicleForm.tractor_number,
          trailer_number: vehicleForm.trailer_number,
        })
        .eq("id", vehicleForm.id);
    } else {
      await supabase.from("vehicles").insert([
        {
          tractor_number: vehicleForm.tractor_number,
          trailer_number: vehicleForm.trailer_number,
        },
      ]);
    }
    setVehicleForm({ id: null, tractor_number: "", trailer_number: "" });
    fetchMasterData();
  };

  const handleDeleteVehicle = async (id) => {
    if (window.confirm("削除しますか？")) {
      await supabase.from("vehicles").delete().eq("id", id);
      fetchMasterData();
    }
  };

  // 運転手保存
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
    if (window.confirm("削除しますか？")) {
      await supabase.from("drivers").delete().eq("id", id);
      fetchMasterData();
    }
  };

  // 案件保存
  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title.trim()) return;

    if (jobForm.id) {
      await supabase.from("jobs").update(jobForm).eq("id", jobForm.id);
    } else {
      await supabase.from("jobs").insert([jobForm]);
    }
    setJobForm({ id: null, title: "", location: "" });
    fetchMasterData();
  };

  const handleDeleteJob = async (id) => {
    if (window.confirm("削除しますか？")) {
      await supabase.from("jobs").delete().eq("id", id);
      fetchMasterData();
    }
  };

  // 配車割り当て変更
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
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* タイトルヘッダー */}
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              配車管理システム
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              リアルタイム車両・運転手・案件割り当てボード
            </p>
          </div>

          {/* ナビゲーションタブ */}
          <nav className="flex bg-slate-200 p-1 rounded-xl shadow-inner gap-1">
            <button
              onClick={() => setActiveTab("board")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                activeTab === "board"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              配車ボード
            </button>
            <button
              onClick={() => setActiveTab("vehicles")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                activeTab === "vehicles"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              車両マスター
            </button>
            <button
              onClick={() => setActiveTab("drivers")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                activeTab === "drivers"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              運転手マスター
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                activeTab === "jobs"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              案件マスター
            </button>
          </nav>
        </header>

        {/* 配車ボード */}
        {activeTab === "board" && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6">
            <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200/60 w-fit">
              <span className="text-sm font-semibold text-slate-600">日付選択:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2 shadow-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                    <th className="pb-2 px-4">車両番号 (トラクタ)</th>
                    <th className="pb-2 px-4">担当運転手</th>
                    <th className="pb-2 px-4">割り当て案件</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => {
                    const assignment =
                      assignments.find((a) => a.vehicle_id === vehicle.id) || {};

                    return (
                      <tr
                        key={vehicle.id}
                        className="bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-xl overflow-hidden shadow-sm border border-slate-200/50"
                      >
                        {/* トラクタ番号のみを表示 */}
                        <td className="py-3 px-4 font-bold text-slate-800 rounded-l-xl">
                          {vehicle.tractor_number || vehicle.name || "未設定"}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={assignment.driver_id || ""}
                            onChange={(e) =>
                              handleAssignmentChange(
                                vehicle.id,
                                "driver_id",
                                e.target.value || null
                              )
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          >
                            <option value="">-- 未選択 --</option>
                            {drivers.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 rounded-r-xl">
                          <select
                            value={assignment.job_id || ""}
                            onChange={(e) =>
                              handleAssignmentChange(
                                vehicle.id,
                                "job_id",
                                e.target.value || null
                              )
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          >
                            <option value="">-- 未選択 --</option>
                            {jobs.map((j) => (
                              <option key={j.id} value={j.id}>
                                {j.title}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 車両マスター */}
        {activeTab === "vehicles" && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              車両登録・編集
            </h2>
            <form onSubmit={handleSaveVehicle} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="トラクタ番号（前）"
                value={vehicleForm.tractor_number}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, tractor_number: e.target.value })
                }
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
              <input
                type="text"
                placeholder="トレーラー番号（後）"
                value={vehicleForm.trailer_number}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, trailer_number: e.target.value })
                }
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 shrink-0"
              >
                {vehicleForm.id ? "更新" : "追加"}
              </button>
            </form>

            <ul className="space-y-2">
              {vehicles.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{v.tractor_number || "未登録"}</span>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                      トレーラー: {v.trailer_number || "未登録"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setVehicleForm({
                          id: v.id,
                          tractor_number: v.tractor_number || "",
                          trailer_number: v.trailer_number || "",
                        })
                      }
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 運転手マスター */}
        {activeTab === "drivers" && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              運転手登録・編集
            </h2>
            <form onSubmit={handleSaveDriver} className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="運転手名"
                value={driverForm.name}
                onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 shrink-0"
              >
                {driverForm.id ? "更新" : "追加"}
              </button>
            </form>

            <ul className="space-y-2">
              {drivers.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-slate-100/60 transition-colors"
                >
                  <span className="font-bold text-slate-800">{d.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDriverForm({ id: d.id, name: d.name })}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(d.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 案件マスター */}
        {activeTab === "jobs" && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              案件登録・編集
            </h2>
            <form onSubmit={handleSaveJob} className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="案件名"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 shrink-0"
              >
                {jobForm.id ? "更新" : "追加"}
              </button>
            </form>

            <ul className="space-y-2">
              {jobs.map((j) => (
                <li
                  key={j.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-slate-100/60 transition-colors"
                >
                  <span className="font-bold text-slate-800">{j.title}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setJobForm({ id: j.id, title: j.title, location: j.location || "" })}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteJob(j.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}