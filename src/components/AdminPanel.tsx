import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserLog {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  method: string;
  ip: string;
  city: string;
  country: string;
  timestamp: number;
  loginCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts: number) {
  return new Date(ts).toLocaleString("ar-EG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function methodBadge(method: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    email:    { label: "بريد إلكتروني", color: "#2563eb", bg: "#eff6ff" },
    phone:    { label: "رقم هاتف",      color: "#16a34a", bg: "#f0fdf4" },
    facebook: { label: "فيسبوك",        color: "#1877f2", bg: "#eff6ff" },
    guest:    { label: "ضيف",           color: "#9333ea", bg: "#faf5ff" },
  };
  const m = map[method] ?? { label: method, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      padding: "2px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "bold",
      color: m.color,
      backgroundColor: m.bg,
      border: `1px solid ${m.color}33`,
    }}>
      {m.label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export const AdminPanel: React.FC = () => {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<UserLog | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(
          collection(db, "user_activity"),
          orderBy("timestamp", "desc"),
          limit(200)
        );
        const snapshot = await getDocs(q);
        const data: UserLog[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<UserLog, "id">),
        }));
        setLogs(data);
      } catch (e: any) {
        setError("تعذّر تحميل البيانات. تأكد من تفعيل Firestore في Firebase Console.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const term = searchTerm.toLowerCase();
    return (
      l.email?.toLowerCase().includes(term) ||
      l.name?.toLowerCase().includes(term) ||
      l.ip?.includes(term) ||
      l.city?.toLowerCase().includes(term)
    );
  });

  // Stats
  const uniqueUsers = new Set(logs.map((l) => l.uid || l.email)).size;
  const today = new Date().toDateString();
  const todayLogins = logs.filter(
    (l) => new Date(l.timestamp).toDateString() === today
  ).length;
  const methodCounts = logs.reduce((acc, l) => {
    acc[l.method] = (acc[l.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={panelWrap}>
      {/* Header */}
      <div style={panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={shieldIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#fff", fontWeight: "800" }}>
              لوحة التحكم الإدارية
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
              مرحباً بك أيها الأدمن — بيانات المستخدمين محمية وآمنة
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <StatChip label="إجمالي الدخول" value={logs.length} color="#60a5fa" />
          <StatChip label="مستخدمون فريدون" value={uniqueUsers} color="#34d399" />
          <StatChip label="دخول اليوم" value={todayLogins} color="#f59e0b" />
        </div>
      </div>

      {/* Method Stats Bar */}
      <div style={statsRow}>
        {Object.entries(methodCounts).map(([method, count]) => (
          <div key={method} style={statBarCard}>
            {methodBadge(method)}
            <span style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main)" }}>
              {count}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>دخول</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: "0 0 16px" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="ابحث بالاسم، البريد، IP، أو المدينة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInput}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={loadingBox}>
          <div style={spinner} />
          <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>جاري تحميل سجلات المستخدمين...</p>
        </div>
      ) : error ? (
        <div style={errorBox}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={emptyBox}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
            {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لا توجد سجلات دخول حتى الآن"}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr style={tableHead}>
                <th style={th}>#</th>
                <th style={th}>الاسم</th>
                <th style={th}>البريد / الهاتف</th>
                <th style={th}>طريقة الدخول</th>
                <th style={th}>عنوان IP</th>
                <th style={th}>الموقع</th>
                <th style={th}>وقت الدخول</th>
                <th style={th}>عدد مرات الدخول</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, idx) => (
                <tr
                  key={log.id}
                  style={{
                    ...tableRow,
                    backgroundColor: idx % 2 === 0 ? "var(--bg-card)" : "var(--bg-primary)",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedLog(log)}
                >
                  <td style={td}>{idx + 1}</td>
                  <td style={{ ...td, fontWeight: "600" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={avatar}>{(log.name || "؟")[0]}</div>
                      {log.name || "—"}
                    </div>
                  </td>
                  <td style={{ ...td, direction: "ltr", textAlign: "left", fontSize: "12px", color: "var(--text-muted)" }}>
                    {log.email || log.phone || "—"}
                  </td>
                  <td style={td}>{methodBadge(log.method)}</td>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: "12px", color: "#3b82f6" }}>
                    {log.ip || "—"}
                  </td>
                  <td style={{ ...td, fontSize: "12px" }}>
                    {log.city && log.country ? `${log.city}، ${log.country}` : "—"}
                  </td>
                  <td style={{ ...td, fontSize: "12px", color: "var(--text-muted)" }}>
                    {log.timestamp ? formatDate(log.timestamp) : "—"}
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={countBadge}>{log.loginCount || 1}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div style={modalOverlay} onClick={() => setSelectedLog(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "17px" }}>تفاصيل المستخدم</h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "20px", lineHeight: 1 }}
              >✕</button>
            </div>
            <div style={detailAvatar}>{(selectedLog.name || "؟")[0]}</div>
            <h4 style={{ textAlign: "center", margin: "8px 0 20px", fontSize: "18px" }}>{selectedLog.name}</h4>
            <div style={detailGrid}>
              <DetailRow label="البريد الإلكتروني" value={selectedLog.email || "—"} mono />
              <DetailRow label="رقم الهاتف" value={selectedLog.phone || "—"} mono />
              <DetailRow label="طريقة الدخول" value={selectedLog.method} />
              <DetailRow label="عنوان IP" value={selectedLog.ip || "—"} mono />
              <DetailRow label="المدينة" value={selectedLog.city || "—"} />
              <DetailRow label="الدولة" value={selectedLog.country || "—"} />
              <DetailRow label="وقت الدخول" value={selectedLog.timestamp ? formatDate(selectedLog.timestamp) : "—"} />
              <DetailRow label="عدد مرات الدخول" value={String(selectedLog.loginCount || 1)} />
              <DetailRow label="معرف المستخدم (UID)" value={selectedLog.uid || "—"} mono />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatChip: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ background: `${color}22`, border: `1px solid ${color}44`, borderRadius: "10px", padding: "6px 14px", textAlign: "center" }}>
    <div style={{ fontSize: "20px", fontWeight: "800", color }}>{value}</div>
    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)" }}>{label}</div>
  </div>
);

const DetailRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>{label}</span>
    <span style={{ fontSize: "13px", fontFamily: mono ? "monospace" : "inherit", color: "var(--text-main)", wordBreak: "break-all" }}>
      {value}
    </span>
  </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const panelWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "40px" };

const panelHeader: React.CSSProperties = {
  background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)",
  borderRadius: "var(--radius-lg)",
  padding: "24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
};

const shieldIcon: React.CSSProperties = {
  width: "46px", height: "46px",
  background: "rgba(255,255,255,0.15)",
  borderRadius: "12px",
  display: "flex", alignItems: "center", justifyContent: "center",
  backdropFilter: "blur(4px)",
};

const statsRow: React.CSSProperties = {
  display: "flex", gap: "12px", flexWrap: "wrap",
};

const statBarCard: React.CSSProperties = {
  flex: "1 1 100px",
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--bg-accent)",
  borderRadius: "var(--radius-sm)",
  padding: "14px 16px",
  display: "flex", flexDirection: "column", gap: "6px",
  alignItems: "flex-start",
};

const searchInput: React.CSSProperties = {
  width: "100%",
  padding: "10px 40px 10px 16px",
  border: "1px solid var(--bg-accent)",
  borderRadius: "var(--radius-sm)",
  fontSize: "14px",
  fontFamily: "inherit",
  backgroundColor: "var(--bg-card)",
  color: "var(--text-main)",
  outline: "none",
  boxSizing: "border-box",
};

const loadingBox: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "60px 0",
};

const spinner: React.CSSProperties = {
  width: "36px", height: "36px",
  border: "3px solid var(--color-sage-light)",
  borderTopColor: "var(--color-sage)",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const errorBox: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "40px", gap: "12px",
  backgroundColor: "#fef2f2",
  borderRadius: "var(--radius-sm)",
  border: "1px solid #fecaca",
  color: "#dc2626",
  textAlign: "center",
};

const emptyBox: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "60px 0",
};

const table: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse",
  fontSize: "13px",
};

const tableHead: React.CSSProperties = {
  backgroundColor: "var(--bg-accent)",
};

const th: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "right",
  fontWeight: "700",
  fontSize: "12px",
  color: "var(--text-muted)",
  whiteSpace: "nowrap",
  borderBottom: "2px solid var(--bg-accent)",
};

const tableRow: React.CSSProperties = {
  transition: "background-color 0.15s ease",
};

const td: React.CSSProperties = {
  padding: "12px 16px",
  borderBottom: "1px solid var(--bg-accent)",
  whiteSpace: "nowrap",
};

const avatar: React.CSSProperties = {
  width: "28px", height: "28px",
  borderRadius: "50%",
  backgroundColor: "var(--color-sage-light)",
  color: "var(--color-sage)",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontWeight: "800", fontSize: "13px",
  flexShrink: 0,
};

const countBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center", justifyContent: "center",
  minWidth: "24px", height: "24px",
  padding: "0 6px",
  borderRadius: "12px",
  backgroundColor: "var(--color-sage-light)",
  color: "var(--color-sage)",
  fontSize: "12px", fontWeight: "700",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed", inset: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9999,
  padding: "20px",
  backdropFilter: "blur(4px)",
};

const modal: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  borderRadius: "var(--radius-lg)",
  padding: "28px",
  width: "100%", maxWidth: "480px",
  maxHeight: "90vh", overflowY: "auto",
  boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
  animation: "fadeIn 0.2s ease",
};

const detailAvatar: React.CSSProperties = {
  width: "64px", height: "64px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, var(--color-sage-light), var(--color-meditate-light))",
  color: "var(--color-sage)",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontWeight: "800", fontSize: "28px",
  margin: "0 auto",
};

const detailGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  backgroundColor: "var(--bg-primary)",
  borderRadius: "var(--radius-sm)",
  padding: "16px",
};
