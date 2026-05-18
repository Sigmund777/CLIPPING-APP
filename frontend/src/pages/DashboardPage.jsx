import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const [{ data: prof }, { data: projs }] = await Promise.all([
          api.get("/profile"),
          api.get("/projects"),
        ]);
        setProfile(prof);
        setProjects(projs || []);
        setSelected((projs || [])[0] || null);
      } catch (err) {
        console.error("Dashboard load error:", err);
        toast.error("Could not load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const handleUpload = () => nav("/upload");

  return (
    <DashboardLayout>
      <div className="p-8 text-center">
        <h1 className="text-4xl font-medium mb-4">
          Welcome back, {user?.name?.split(" ")[0] || "Daniel"} 👋
        </h1>
        <p className="text-zinc-400">Your dashboard is ready.</p>

        <button
          onClick={handleUpload}
          className="mt-8 px-6 py-3 bg-purple-600 rounded-lg font-medium"
        >
          Upload a Video
        </button>
      </div>
    </DashboardLayout>
  );
}
