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

  // 車両フォーム（トラクタ・トレーラーに対応）
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
    <div className="p-4 max-w-4xl mx-auto">
      {/* タブ切り替えボタン */}
      <div className="flex gap-2 mb-4 border-b pb-2">
        <button
          onClick={() => setActiveTab("board")}
          className={`px-4 py-2 rounded ${
            activeTab === "board" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          配車ボード
        </button>
        <button
          onClick={() => setActiveTab("vehicles")}
          className={`px-4 py-2 rounded ${
            activeTab === "vehicles" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          車両マスター
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`px-4 py-2 rounded ${
            activeTab === "drivers" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          運転手マスター
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`px-4 py-2 rounded ${
            activeTab === "jobs" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          案件マスター
        </button>
      </div>

      {/* 配車ボード */}
      {activeTab === "board" && (
        <div>
          <div className="mb-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border p-2 rounded"
            />
          </div>

          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">車両番号</th>
                <th className="border p-2 text-left">運転手</th>
                <th className="border p-2 text-left">案件</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const assignment =
                  assignments.find((a) => a.vehicle_id === vehicle.id) || {};

                return (
                  <tr key={vehicle.id}>
                    {/* トラクタ番号のみを表示 */}
                    <td className="border p-2 font-bold">
                      {vehicle.tractor_number || vehicle.name || "未設定"}
                    </td>
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
                        className="w-full border p-1 rounded"
                      >
                        <option value="">未設定</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </td>
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
                        className="w-full border p-1 rounded"
                      >
                        <option value="">未設定</option>
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
      )}

      {/* 車両マスター */}
      {activeTab === "vehicles" && (
        <div>
          <form onSubmit={handleSaveVehicle} className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="トラクタ番号（前）"
              value={vehicleForm.tractor_number}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, tractor_number: e.target.value })
              }
              className="border p-2 rounded flex-1"
            />
            <input
              type="text"
              placeholder="トレーラー番号（後）"
              value={vehicleForm.trailer_number}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, trailer_number: e.target.value })
              }
              className="border p-2 rounded flex-1"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              {vehicleForm.id ? "更新" : "追加"}
            </button>
          </form>

          <ul className="divide-y border rounded">
            {vehicles.map((v) => (
              <li key={v.id} className="p-2 flex justify-between items-center">
                <span>
                  前: {v.tractor_number || "未登録"} / 後: {v.trailer_number || "未登録"}
                </span>
                <div>
                  <button
                    onClick={() =>
                      setVehicleForm({
                        id: v.id,
                        tractor_number: v.tractor_number || "",
                        trailer_number: v.trailer_number || "",
                      })
                    }
                    className="text-blue-600 mr-2"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(v.id)}
                    className="text-red-600"
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
        <div>
          <form onSubmit={handleSaveDriver} className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="運転手名"
              value={driverForm.name}
              onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
              className="border p-2 rounded flex-1"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              {driverForm.id ? "更新" : "追加"}
            </button>
          </form>

          <ul className="divide-y border rounded">
            {drivers.map((d) => (
              <li key={d.id} className="p-2 flex justify-between items-center">
                <span>{d.name}</span>
                <div>
                  <button
                    onClick={() => setDriverForm({ id: d.id, name: d.name })}
                    className="text-blue-600 mr-2"
                  >
                    編集
                  </button>
                  <button onClick={() => handleDeleteDriver(d.id)} className="text-red-600">
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
        <div>
          <form onSubmit={handleSaveJob} className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="案件名"
              value={jobForm.title}
              onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
              className="border p-2 rounded flex-1"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              {jobForm.id ? "更新" : "追加"}
            </button>
          </form>

          <ul className="divide-y border rounded">
            {jobs.map((j) => (
              <li key={j.id} className="p-2 flex justify-between items-center">
                <span>{j.title}</span>
                <div>
                  <button
                    onClick={() => setJobForm({ id: j.id, title: j.title, location: j.location || "" })}
                    className="text-blue-600 mr-2"
                  >
                    編集
                  </button>
                  <button onClick={() => handleDeleteJob(j.id)} className="text-red-600">
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}