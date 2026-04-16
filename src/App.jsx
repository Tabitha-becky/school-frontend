import { useState, useEffect, useMemo } from "react";
import axios from "axios";
const API = import.meta.env.https://school-backend-production-feb5.up.railway.app/api || "http://localhost:5000/api";

const api = axios.create({ baseURL: API });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const getGrade = (avg) => {
  if (avg >= 80) return { grade: "A",  color: "#16a34a" };
  if (avg >= 75) return { grade: "A-", color: "#16a34a" };
  if (avg >= 70) return { grade: "B+", color: "#2563eb" };
  if (avg >= 65) return { grade: "B",  color: "#2563eb" };
  if (avg >= 60) return { grade: "B-", color: "#7c3aed" };
  if (avg >= 55) return { grade: "C+", color: "#d97706" };
  if (avg >= 50) return { grade: "C",  color: "#d97706" };
  if (avg >= 45) return { grade: "C-", color: "#ea580c" };
  if (avg >= 40) return { grade: "D+", color: "#dc2626" };
  if (avg >= 35) return { grade: "D",  color: "#dc2626" };
  if (avg >= 30) return { grade: "D-", color: "#dc2626" };
  return { grade: "E", color: "#991b1b" };
};

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString()}`;

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentTab, setStudentTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [feeSummary, setFeeSummary] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (token) { loadStudents(); loadFeeSummary(); }
  }, [token]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/students");
      setStudents(res.data.data || []);
    } catch (err) {
      showToast("Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadFeeSummary = async () => {
    try {
      const res = await api.get("/fees/summary?academic_year=2024");
      setFeeSummary(res.data.data);
    } catch (err) {}
  };

  const loadStudentDetails = async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/students/${id}`);
      setSelectedStudent(res.data.data);
      setStudentTab("profile");
      setPage("student");
    } catch (err) {
      showToast("Failed to load student details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setPage("dashboard");
  };

  const filteredStudents = useMemo(() =>
    students.filter(s =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.adm_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.class_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [students, searchQuery]);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalPaid = feeSummary?.summary?.total_collected || 0;
    const totalBalance = feeSummary?.summary?.total_outstanding || 0;
    const withBalance = feeSummary?.summary?.students_with_balance || 0;
    const withAlerts = students.filter(s => s.has_health_alert).length;
    return { totalStudents, totalPaid, totalBalance, withBalance, withAlerts };
  }, [students, feeSummary]);

  if (!token) return <LoginPage onLogin={handleLogin} showToast={showToast} />;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Georgia, serif", background: "#f0f4f8", overflow: "hidden" }}>
      <aside style={{ width: 230, background: "linear-gradient(180deg, #064e3b 0%, #065f46 60%, #047857 100%)", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "4px 0 20px rgba(0,0,0,0.25)", zIndex: 10 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏫</div>
            <div>
              <div style={{ color: "#fef3c7", fontWeight: "bold", fontSize: 13 }}>EduTrack Kenya</div>
              <div style={{ color: "#6ee7b7", fontSize: 10 }}>School Management</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {[
            { id: "dashboard", label: "Dashboard",    icon: "📊" },
            { id: "students",  label: "Students",     icon: "👩‍🎓" },
            { id: "fees",      label: "Fee Records",  icon: "💰" },
            { id: "academics", label: "Academics",    icon: "📚" },
            { id: "health",    label: "Health Alerts",icon: "🏥" },
            { id: "marks",     label: "Enter Marks",  icon: "✏️" },
            { id: "staff",     label: "Staff Accounts",icon: "👨‍🏫" },
            { id: "attendance", label: "Attendance", icon: "📅" },
            {id:  "feestructure", label: "Fees Structure",icon: "🏷️"},
          ].map(item => {
            const active = page === item.id || (item.id === "students" && page === "student");
            return (
              <button key={item.id} onClick={() => { setPage(item.id); setSelectedStudent(null); loadStudents(); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", marginBottom: 4, background: active ? "rgba(255,255,255,0.15)" : "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: active ? "#fef3c7" : "#a7f3d0", fontSize: 13, fontFamily: "inherit", textAlign: "left", borderLeft: active ? "3px solid #f59e0b" : "3px solid transparent" }}>
                <span>{item.icon}</span><span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ color: "#a7f3d0", fontSize: 11, marginBottom: 6 }}>{user?.name || "Administrator"}</div>
          <button onClick={handleLogout} style={{ width: "100%", padding: "7px 12px", background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 6, color: "#fca5a5", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Logout</button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <header style={{ background: "white", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 10px rgba(0,0,0,0.08)", flexShrink: 0, borderBottom: "3px solid #f59e0b" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, color: "#064e3b", fontWeight: "bold" }}>
              {page === "dashboard" && "📊 Dashboard"}
              {page === "students"  && "👩‍🎓 Students"}
              {page === "student"   && selectedStudent?.name}
              {page === "fees"      && "💰 Fee Records"}
              {page === "academics" && "📚 Academics"}
              {page === "health"    && "🏥 Health Alerts"}
              {page === "marks"     && "✏️ Enter Marks"}
              {page === "staff"     && "👨‍🏫 Staff Accounts"}
              {page === "attendance" && "📅 Attendance"}
              {page === "feestructure" && "🏷️ Fee Structure"}
            </h1>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
              {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          {loading && <div style={{ fontSize: 12, color: "#6b7280" }}>Loading...</div>}
        </header>

        <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
          {page === "dashboard" && <Dashboard stats={stats} students={students} feeSummary={feeSummary} openStudent={loadStudentDetails} />}
          {page === "students"  && <Students students={filteredStudents} searchQuery={searchQuery} setSearchQuery={setSearchQuery} openStudent={loadStudentDetails} showAddStudent={showAddStudent} setShowAddStudent={setShowAddStudent} onAdd={async (form) => { try { await api.post("/students", form); showToast(`${form.name} registered!`); setShowAddStudent(false); loadStudents(); } catch(e) { showToast(e.response?.data?.message || "Failed to register", "error"); }}} />}
          {page === "student"   && selectedStudent && <StudentProfile student={selectedStudent} tab={studentTab} setTab={setStudentTab} onBack={() => { setPage("students"); setSelectedStudent(null); }} showAddPayment={showAddPayment} setShowAddPayment={setShowAddPayment} onStudentUpdated={() => loadStudentDetails(selectedStudent.id)} onAddPayment={async (payment) => { try { await api.post("/fees/payment", { ...payment, student_id: selectedStudent.id }); showToast("Payment recorded!"); setShowAddPayment(false); loadStudentDetails(selectedStudent.id); loadFeeSummary(); } catch(e) { showToast(e.response?.data?.message || "Failed", "error"); }}} />}
          {page === "fees"      && <FeeOverview students={students} feeSummary={feeSummary} openStudent={loadStudentDetails} />}
          {page === "academics" && <Academics students={students} openStudent={loadStudentDetails} />}
          {page === "health"    && <HealthAlerts openStudent={loadStudentDetails} showToast={showToast} />}
          {page === "marks"     && <MarksEntry showToast={showToast} />}
          {page === "staff"     && <StaffAccounts showToast={showToast} />}
          {page === "attendance" && <Attendance showToast={showToast} />}
          {page === "feestructure" && <FeeStructure showToast={showToast} />}
        </div>
      </main>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: toast.type === "success" ? "#064e3b" : "#dc2626", color: "white", padding: "12px 20px", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", fontSize: 13 }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}

function LoginPage({ onLogin, showToast }) {
  const [email, setEmail] = useState("admin@school.ac.ke");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) { showToast("Enter your password", "error"); return; }
    try {
      setLoading(true);
      const res = await axios.post(`${API}/auth/login`, { email, password });
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      showToast(err.response?.data?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #064e3b, #065f46)" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 40, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
          <h1 style={{ margin: 0, color: "#064e3b", fontSize: 22 }}>EduTrack Kenya</h1>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>School Management System</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: "bold" }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: "bold" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: "#064e3b", color: "white", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: "bold" }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div style={{ marginTop: 20, padding: 12, background: "#f0fdf4", borderRadius: 8, fontSize: 11, color: "#065f46", textAlign: "center" }}>
          Default: admin@school.ac.ke / Admin@1234
        </div>
      </div>
    </div>
  );
}

function Dashboard({ stats, students, feeSummary, openStudent }) {
  const recentPayments = feeSummary?.recentPayments || [];
  const alertStudents = students.filter(s => s.has_health_alert);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Students",   value: stats.totalStudents,            icon: "👩‍🎓", color: "#064e3b" },
          { label: "Fees Collected",   value: fmtKES(stats.totalPaid),        icon: "💰",  color: "#1d4ed8" },
          { label: "Outstanding",      value: fmtKES(stats.totalBalance),     icon: "⚠️",  color: "#b45309" },
          { label: "Pending Balances", value: `${stats.withBalance} students`,icon: "📋",  color: "#dc2626" },
          { label: "Health Alerts",    value: `${stats.withAlerts} students`, icon: "🏥",  color: "#7c3aed" },
        ].map(card => (
          <div key={card.label} style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderTop: `4px solid ${card.color}` }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 22, fontWeight: "bold", color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", color: "#064e3b", fontSize: 15 }}>💰 Recent Payments</h3>
          {recentPayments.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13 }}>No payments yet</div>}
          {recentPayments.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }} onClick={() => openStudent(p.student_id)}>
              <div>
                <div style={{ fontSize: 13, fontWeight: "bold" }}>{p.student_name}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{p.term} · {p.payment_method} · {p.payment_date}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#064e3b" }}>{fmtKES(p.amount_paid)}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", color: "#7c3aed", fontSize: 15 }}>🏥 Health Alerts</h3>
          {alertStudents.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13 }}>No health alerts</div>}
          {alertStudents.map(s => (
            <div key={s.id} style={{ padding: "10px 12px", marginBottom: 8, borderRadius: 8, background: "#fef3c7", border: "1px solid #f59e0b", cursor: "pointer" }} onClick={() => openStudent(s.id)}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: "bold", color: "#92400e" }}>{s.name}</span>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{s.class_name}</span>
              </div>
              <div style={{ fontSize: 11, color: "#92400e", marginTop: 4 }}>⚠️ Health condition on file</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Students({ students, searchQuery, setSearchQuery, openStudent, showAddStudent, setShowAddStudent, onAdd }) {
  const [form, setForm] = useState({ name: "", adm_no: "", class_id: "", gender: "Male", date_of_birth: "", parent_name: "", parent_phone: "", parent_email: "", address: "", blood_group: "O+", allergies: "None", chronic_conditions: "None", current_medication: "None", emergency_contact_phone: "" });
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get("/academics/classes").then(res => setClasses(res.data.data || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, admission no., or class..." style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
       <a href={`http://localhost:5000/api/students/export/excel?token=${localStorage.getItem('token')}&academic_year=2024`} target="_blank" style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>📊 Export Excel</a>
        <button onClick={() => setShowAddStudent(true)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>+ Add Student</button>
      </div>
      <div style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#064e3b", color: "white" }}>
              {["Adm. No.", "Name", "Class", "Parent Phone", "Balance", "Health", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? "white" : "#f9fafb", cursor: "pointer" }} onClick={() => openStudent(s.id)}>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280" }}>{s.adm_no}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: "bold" }}>{s.name}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ background: "#d1fae5", color: "#065f46", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: "bold" }}>{s.class_name || "—"}</span></td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{s.parent_phone}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: "bold", color: s.balance > 0 ? "#dc2626" : "#16a34a" }}>{s.balance > 0 ? `-${fmtKES(s.balance)}` : "✓ Paid"}</td>
                <td style={{ padding: "12px 16px" }}>{s.has_health_alert ? <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: "bold" }}>⚠️ Alert</span> : <span style={{ background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 10, fontSize: 10 }}>✓ Clear</span>}</td>
                <td style={{ padding: "12px 16px" }}><button style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No students found</div>}
      </div>

      {showAddStudent && (
        <Modal title="📝 Register New Student" onClose={() => setShowAddStudent(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Full Name *" value={form.name} onChange={v => setForm({...form, name: v})} />
            <Field label="Admission No. *" value={form.adm_no} onChange={v => setForm({...form, adm_no: v})} />
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Class *</label>
              <select value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", background: "white" }}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <SelectField label="Gender" value={form.gender} options={["Male","Female"]} onChange={v => setForm({...form, gender: v})} />
            <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={v => setForm({...form, date_of_birth: v})} />
            <Field label="Parent Name" value={form.parent_name} onChange={v => setForm({...form, parent_name: v})} />
            <Field label="Parent Phone *" value={form.parent_phone} onChange={v => setForm({...form, parent_phone: v})} placeholder="07XXXXXXXX" />
            <Field label="Parent Email" value={form.parent_email} onChange={v => setForm({...form, parent_email: v})} />
            <div style={{ gridColumn: "1/-1" }}><Field label="Address" value={form.address} onChange={v => setForm({...form, address: v})} /></div>
          </div>
          <div style={{ marginTop: 16, padding: 14, background: "#fef3c7", borderRadius: 8, border: "1px solid #f59e0b" }}>
            <div style={{ fontWeight: "bold", color: "#92400e", marginBottom: 10, fontSize: 13 }}>🏥 Health Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <SelectField label="Blood Group" value={form.blood_group} options={["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"]} onChange={v => setForm({...form, blood_group: v})} />
              <Field label="Emergency Contact" value={form.emergency_contact_phone} onChange={v => setForm({...form, emergency_contact_phone: v})} />
              <Field label="Allergies" value={form.allergies} onChange={v => setForm({...form, allergies: v})} placeholder="e.g. Peanuts (or None)" />
              <Field label="Chronic Conditions" value={form.chronic_conditions} onChange={v => setForm({...form, chronic_conditions: v})} placeholder="e.g. Asthma (or None)" />
              <div style={{ gridColumn: "1/-1" }}><Field label="Medication / Special Notes" value={form.current_medication} onChange={v => setForm({...form, current_medication: v})} placeholder="e.g. Carries inhaler (or None)" /></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAddStudent(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={() => onAdd(form)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>✓ Register Student</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StudentProfile({ student, tab, setTab, onBack, showAddPayment, setShowAddPayment, onAddPayment, onStudentUpdated }) {
  const totalPaid = student.fees?.reduce((a, f) => a + parseFloat(f.amount_paid || 0), 0) || 0;
  const totalExpected = student.fees?.reduce((a, f) => a + parseFloat(f.amount_expected || 0), 0) || 0;
  const balance = totalExpected - totalPaid;
  const [payForm, setPayForm] = useState({ term: "Term 1 2024", amount_expected: "", amount_paid: "", payment_method: "M-Pesa", reference_no: "", payment_date: new Date().toISOString().split("T")[0] });
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: student.name || "", gender: student.gender || "Male", date_of_birth: student.date_of_birth ? student.date_of_birth.split("T")[0] : "", parent_name: student.parent_name || "", parent_phone: student.parent_phone || "", parent_email: student.parent_email || "", address: student.address || "" });
  const [editClasses, setEditClasses] = useState([]);
  const [editClassId, setEditClassId] = useState(student.class_id || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/academics/classes").then(res => setEditClasses(res.data.data || [])).catch(() => {});
  }, []);

  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.parent_phone) { alert("Name and parent phone are required"); return; }
    setSaving(true);
    try {
      await api.put("/students/" + student.id, { ...editForm, class_id: editClassId });
      setShowEdit(false);
      onStudentUpdated();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#064e3b", fontSize: 13, fontFamily: "inherit" }}>← Back to Students</button>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setShowEdit(true)} style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit Student</button>
          <a href={`http://localhost:5000/api/reports/id-card/${student.id}?token=${localStorage.getItem('token')}`} target="_blank" style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", textDecoration: "none", fontFamily: "inherit" }}>🪪 ID Card</a>
          {["Term 1 2024","Term 2 2024","Term 3 2024"].map(term => (
            <a key={term} href={`http://localhost:5000/api/reports/report-card/${student.id}?term=${encodeURIComponent(term)}&academic_year=2024&token=${localStorage.getItem('token')}`} target="_blank" style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", textDecoration: "none", fontFamily: "inherit" }}>📄 {term} Report</a>
          ))}
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, #064e3b, #065f46)", borderRadius: 12, padding: 20, marginBottom: 20, color: "white", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{student.gender === "Female" ? "👩" : "👦"}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{student.name}</h2>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 2 }}>{student.adm_no} · {student.class_name} · {student.gender}</div>
            <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>Parent: {student.parent_name} · 📱 {student.parent_phone}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>{fmtKES(totalPaid)}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Paid</div>
          </div>
          <div style={{ background: balance > 0 ? "rgba(220,38,38,0.3)" : "rgba(22,163,74,0.3)", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>{balance > 0 ? fmtKES(balance) : "✓ Clear"}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Balance</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "white", borderRadius: 10, padding: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", width: "fit-content" }}>
        {["profile","fees","academics","health"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", background: tab === t ? "#064e3b" : "transparent", color: tab === t ? "white" : "#6b7280", fontSize: 12, fontFamily: "inherit", textTransform: "capitalize" }}>
            {t === "academics" ? "📚 Academics" : t === "health" ? "🏥 Health" : t === "fees" ? "💰 Fees" : "👤 Profile"}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <InfoCard title="📋 Basic Information" items={[["Admission No.", student.adm_no], ["Class", student.class_name || "—"], ["Gender", student.gender], ["Date of Birth", student.date_of_birth ? student.date_of_birth.split("T")[0] : "—"], ["Address", student.address || "—"]]} />
          <InfoCard title="👨‍👩‍👧 Parent / Guardian" items={[["Name", student.parent_name || "—"], ["Phone", student.parent_phone], ["Email", student.parent_email || "—"]]} />
        </div>
      )}

      {tab === "fees" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button onClick={() => setShowAddPayment(true)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>+ Record Payment</button>
          </div>
          <div style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#064e3b", color: "white" }}>
                  {["Term","Expected","Paid","Balance","Method","Ref","Date",""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(student.fees || []).map((f, i) => {
                  const bal = parseFloat(f.amount_expected || 0) - parseFloat(f.amount_paid || 0);
                  return (
                    <tr key={f.id} style={{ background: i % 2 ? "#f9fafb" : "white" }}>
                      <td style={{ padding: "11px 14px", fontSize: 13 }}>{f.term}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13 }}>{fmtKES(f.amount_expected)}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#16a34a", fontWeight: "bold" }}>{fmtKES(f.amount_paid)}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: bal > 0 ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>{bal > 0 ? fmtKES(bal) : "✓"}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12 }}>{f.payment_method}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#6b7280" }}>{f.reference_no}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#6b7280" }}>{f.payment_date ? f.payment_date.split("T")[0] : ""}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <a href={`http://localhost:5000/api/fees/receipt/${f.id}?token=${localStorage.getItem('token')}`} target="_blank" style={{ background: "#064e3b", color: "white", padding: "4px 10px", borderRadius: 6, fontSize: 11, textDecoration: "none" }}>🖨️ Receipt</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!student.fees || student.fees.length === 0) && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No fee records yet</div>}
          </div>
        </div>
      )}

      {tab === "academics" && (
        <div>
          {student.academics && student.academics.length > 0 && (
            <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <h4 style={{ margin: "0 0 16px", color: "#064e3b", fontSize: 14 }}>📊 Performance Chart</h4>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180, padding: "20px 8px 0" }}>
                {student.academics.map((a, i) => {
                  const avg = Math.round((parseFloat(a.cat1||0) + parseFloat(a.cat2||0) + parseFloat(a.exam||0)) / 3);
                  const { grade, color } = getGrade(avg);
                  const barHeight = Math.max((avg / 100) * 140, 8);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: "bold", color: color }}>{avg}%</div>
                      <div title={a.subject_name + ": " + avg + "% (" + grade + ")"} style={{ width: "100%", height: barHeight, background: color, borderRadius: "4px 4px 0 0", minWidth: 24, cursor: "pointer", transition: "opacity 0.2s" }}
                        onMouseEnter={e => e.target.style.opacity = "0.8"}
                        onMouseLeave={e => e.target.style.opacity = "1"}
                      />
                      <div style={{ fontSize: 9, color: "#6b7280", textAlign: "center", lineHeight: 1.3, maxWidth: 52, wordBreak: "break-word" }}>{a.subject_name.length > 6 ? a.subject_name.split(" ")[0].substring(0, 7) : a.subject_name}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 12, paddingTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[["A / A-","#16a34a"],["B+ / B / B-","#2563eb"],["C+ / C / C-","#d97706"],["D & Below","#dc2626"]].map(([label, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#6b7280" }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: color }} />{label}
                  </div>
                ))}
                <div style={{ marginLeft: "auto", fontSize: 11, color: "#064e3b", fontWeight: "bold" }}>
                  Overall: {Math.round(student.academics.reduce((s, a) => s + (parseFloat(a.cat1||0) + parseFloat(a.cat2||0) + parseFloat(a.exam||0)) / 3, 0) / student.academics.length)}% — {getGrade(Math.round(student.academics.reduce((s, a) => s + (parseFloat(a.cat1||0) + parseFloat(a.cat2||0) + parseFloat(a.exam||0)) / 3, 0) / student.academics.length)).grade}
                </div>
              </div>
            </div>
          )}
          <div style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#064e3b", color: "white" }}>
                  {["Subject","CAT 1","CAT 2","Exam","Average","Grade"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(student.academics || []).map((a, i) => {
                  const avg = Math.round((parseFloat(a.cat1||0) + parseFloat(a.cat2||0) + parseFloat(a.exam||0)) / 3);
                  const { grade, color } = getGrade(avg);
                  return (
                    <tr key={i} style={{ background: i % 2 ? "#f9fafb" : "white" }}>
                      <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: "bold" }}>{a.subject_name}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13 }}>{a.cat1}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13 }}>{a.cat2}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13 }}>{a.exam}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: "bold" }}>{avg}%</td>
                      <td style={{ padding: "11px 16px" }}><span style={{ background: color, color: "white", padding: "2px 10px", borderRadius: 10, fontSize: 12, fontWeight: "bold" }}>{grade}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!student.academics || student.academics.length === 0) && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No academic records yet</div>}
          </div>
        </div>
      )}

      {tab === "health" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <InfoCard title="🩺 Health Details" items={[["Blood Group", student.health?.blood_group || "—"], ["Allergies", student.health?.allergies || "None"], ["Conditions", student.health?.chronic_conditions || "None"], ["Emergency Contact", student.health?.emergency_contact_phone || "—"]]} />
          <div style={{ background: student.health?.current_medication !== "None" ? "#fef3c7" : "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: student.health?.current_medication !== "None" ? "2px solid #f59e0b" : "none" }}>
            <h4 style={{ margin: "0 0 12px", color: "#92400e", fontSize: 14 }}>💊 Medication & Instructions</h4>
            <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{student.health?.current_medication || "No special medication."}</p>
          </div>
        </div>
      )}

      {showAddPayment && (
        <Modal title="💰 Record Fee Payment" onClose={() => setShowAddPayment(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Term" value={payForm.term} onChange={v => setPayForm({...payForm, term: v})} placeholder="e.g. Term 1 2024" />
            <Field label="Amount Expected (KES)" type="number" value={payForm.amount_expected} onChange={v => setPayForm({...payForm, amount_expected: v})} />
            <Field label="Amount Paid (KES) *" type="number" value={payForm.amount_paid} onChange={v => setPayForm({...payForm, amount_paid: v})} />
            <SelectField label="Payment Method" value={payForm.payment_method} options={["M-Pesa","Cash","Bank","Cheque"]} onChange={v => setPayForm({...payForm, payment_method: v})} />
            <Field label="Reference No." value={payForm.reference_no} onChange={v => setPayForm({...payForm, reference_no: v})} placeholder="M-Pesa code / bank ref" />
            <Field label="Payment Date" type="date" value={payForm.payment_date} onChange={v => setPayForm({...payForm, payment_date: v})} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAddPayment(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={() => onAddPayment(payForm)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>✓ Record Payment</button>
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal title="✏️ Edit Student Details" onClose={() => setShowEdit(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Full Name *" value={editForm.name} onChange={v => setEditForm({...editForm, name: v})} />
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Class</label>
              <select value={editClassId} onChange={e => setEditClassId(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", background: "white" }}>
                <option value="">-- Select Class --</option>
                {editClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <SelectField label="Gender" value={editForm.gender} options={["Male","Female"]} onChange={v => setEditForm({...editForm, gender: v})} />
            <Field label="Date of Birth" type="date" value={editForm.date_of_birth} onChange={v => setEditForm({...editForm, date_of_birth: v})} />
            <Field label="Parent Name" value={editForm.parent_name} onChange={v => setEditForm({...editForm, parent_name: v})} />
            <Field label="Parent Phone *" value={editForm.parent_phone} onChange={v => setEditForm({...editForm, parent_phone: v})} />
            <Field label="Parent Email" value={editForm.parent_email} onChange={v => setEditForm({...editForm, parent_email: v})} />
            <Field label="Address" value={editForm.address} onChange={v => setEditForm({...editForm, address: v})} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setShowEdit(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleSaveEdit} disabled={saving} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>{saving ? "Saving..." : "✓ Save Changes"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FeeOverview({ students, feeSummary, openStudent }) {
  const summary = feeSummary?.summary || {};
  const totalExpected = parseFloat(summary.total_expected || 0);
  const totalPaid = parseFloat(summary.total_collected || 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Expected",    value: fmtKES(summary.total_expected),    color: "#1d4ed8" },
          { label: "Total Collected",   value: fmtKES(summary.total_collected),   color: "#16a34a" },
          { label: "Total Outstanding", value: fmtKES(summary.total_outstanding), color: "#dc2626" },
        ].map(c => (
          <div key={c.label} style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderLeft: `5px solid ${c.color}` }}>
            <div style={{ fontSize: 22, fontWeight: "bold", color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: "bold", color: "#064e3b" }}>Collection Rate</span>
          <span style={{ fontSize: 13, color: "#064e3b", fontWeight: "bold" }}>{totalExpected > 0 ? Math.round(totalPaid / totalExpected * 100) : 0}%</span>
        </div>
        <div style={{ height: 12, background: "#e5e7eb", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 6, background: "linear-gradient(90deg, #064e3b, #10b981)", width: `${totalExpected > 0 ? (totalPaid / totalExpected * 100) : 0}%` }} />
        </div>
      </div>
      <div style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#064e3b", color: "white" }}>
              {["Student","Class","Balance","Status",""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 ? "#f9fafb" : "white" }}>
                <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: "bold" }}>{s.name}</td>
                <td style={{ padding: "11px 16px", fontSize: 13 }}>{s.class_name || "—"}</td>
                <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: "bold", color: s.balance > 0 ? "#dc2626" : "#16a34a" }}>{s.balance > 0 ? fmtKES(s.balance) : "✓ Paid"}</td>
                <td style={{ padding: "11px 16px" }}><span style={{ background: s.balance <= 0 ? "#d1fae5" : s.balance < 5000 ? "#fef3c7" : "#fee2e2", color: s.balance <= 0 ? "#065f46" : s.balance < 5000 ? "#92400e" : "#dc2626", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: "bold" }}>{s.balance <= 0 ? "✓ Paid" : s.balance < 5000 ? "Partial" : "Owing"}</span></td>
                <td style={{ padding: "11px 16px" }}><button onClick={() => openStudent(s.id)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Academics({ students, openStudent }) {
  return (
    <div style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "16px 20px", background: "#064e3b", color: "white" }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>📊 Student List — Click to view academic records</h3>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0fdf4" }}>
            {["Student","Adm. No.","Class","Action"].map(h => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#064e3b", fontWeight: "bold" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => (
            <tr key={s.id} style={{ background: i % 2 ? "#f9fafb" : "white" }}>
              <td style={{ padding: "12px 16px", fontWeight: "bold", fontSize: 13 }}>{s.name}</td>
              <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{s.adm_no}</td>
              <td style={{ padding: "12px 16px", fontSize: 13 }}>{s.class_name || "—"}</td>
              <td style={{ padding: "12px 16px" }}><button onClick={() => openStudent(s.id)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}>View Records</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HealthAlerts({ openStudent, showToast }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/health/alerts")
      .then(res => setAlerts(res.data.data || []))
      .catch(() => showToast("Failed to load health alerts", "error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 14, background: "#fef3c7", borderRadius: 8, border: "1px solid #f59e0b", fontSize: 13, color: "#92400e" }}>
        ⚠️ <strong>{alerts.length} student(s)</strong> have health conditions on file.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {alerts.map(s => (
          <div key={s.id} style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderTop: "4px solid #f59e0b", cursor: "pointer" }} onClick={() => openStudent(s.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: "bold", fontSize: 15 }}>{s.name}</div>
              <span style={{ background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>{s.class_name}</span>
            </div>
            {s.allergies !== "None" && <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 6 }}>⚠️ Allergies: {s.allergies}</div>}
            {s.chronic_conditions !== "None" && <div style={{ fontSize: 12, color: "#7c3aed", marginBottom: 6 }}>🩺 Conditions: {s.chronic_conditions}</div>}
            {s.current_medication !== "None" && <div style={{ fontSize: 12, color: "#d97706", marginBottom: 6 }}>💊 Medication: {s.current_medication}</div>}
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>📱 Emergency: {s.emergency_contact_phone || "—"}</div>
          </div>
        ))}
        {alerts.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", gridColumn: "1/-1" }}>No health alerts on record</div>}
      </div>
    </div>
  );
}

function MarksEntry({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("Term 1 2024");
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const terms = ["Term 1 2024", "Term 2 2024", "Term 3 2024"];

  useEffect(() => {
    api.get("/academics/classes").then(res => setClasses(res.data.data || [])).catch(() => {});
    api.get("/academics/subjects").then(res => setSubjects(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    api.get("/academics/students-by-class/" + selectedClass)
      .then(res => {
        setStudents(res.data.data || []);
        const initialMarks = {};
        res.data.data.forEach(s => { initialMarks[s.id] = { cat1: "", cat2: "", exam: "" }; });
        setMarks(initialMarks);
      })
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const getAvg = (m) => Math.round((parseFloat(m.cat1 || 0) + parseFloat(m.cat2 || 0) + parseFloat(m.exam || 0)) / 3);

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm) { showToast("Please select class, subject and term first", "error"); return; }
    setSaving(true);
    try {
      const records = students.map(s => ({ student_id: s.id, subject_id: selectedSubject, class_id: selectedClass, term: selectedTerm, academic_year: "2024", cat1: parseFloat(marks[s.id]?.cat1 || 0), cat2: parseFloat(marks[s.id]?.cat2 || 0), exam: parseFloat(marks[s.id]?.exam || 0) }));
      await api.post("/academics/marks", { records });
      showToast("Marks saved successfully!");
    } catch (err) {
      showToast("Failed to save marks", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", color: "#064e3b", fontSize: 15 }}>✏️ Marks Entry Form</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Select Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Select Subject</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
              <option value="">-- Select Subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Select Term</label>
            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
              {terms.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>
      {loading && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Loading students...</div>}
      {!loading && students.length > 0 && (
        <div style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#064e3b", color: "white" }}>
                {["Adm. No.","Student Name","CAT 1 /100","CAT 2 /100","Exam /100","Average","Grade"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: h === "Adm. No." || h === "Student Name" ? "left" : "center", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const m = marks[s.id] || { cat1: "", cat2: "", exam: "" };
                const avg = getAvg(m);
                const { grade, color } = getGrade(avg);
                return (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>{s.adm_no}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: "bold" }}>{s.name}</td>
                    {["cat1","cat2","exam"].map(field => (
                      <td key={field} style={{ padding: "6px 10px", textAlign: "center" }}>
                        <input type="number" min="0" max="100" value={m[field]} onChange={e => setMarks(prev => ({ ...prev, [s.id]: { ...prev[s.id], [field]: e.target.value } }))} style={{ width: 65, padding: "6px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, textAlign: "center", fontFamily: "inherit", outline: "none" }} />
                      </td>
                    ))}
                    <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: "bold", fontSize: 14, color: "#064e3b" }}>{(m.cat1 || m.cat2 || m.exam) ? avg + "%" : "—"}</td>
                    <td style={{ padding: "10px 16px", textAlign: "center" }}>{(m.cat1 || m.cat2 || m.exam) ? <span style={{ background: color, color: "white", padding: "2px 10px", borderRadius: 10, fontSize: 12, fontWeight: "bold" }}>{grade}</span> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: 16, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <div style={{ fontSize: 12, color: "#6b7280", alignSelf: "center" }}>{students.length} students · {selectedTerm}</div>
            <button onClick={handleSave} disabled={saving} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: "bold" }}>{saving ? "Saving..." : "💾 Save All Marks"}</button>
          </div>
        </div>
      )}
      {!loading && selectedClass && students.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "white", borderRadius: 12 }}>No students found in this class</div>}
      {!selectedClass && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "white", borderRadius: 12 }}>Select a class above to start entering marks</div>}
    </div>
  );
}

function StaffAccounts({ showToast }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "teacher", phone: "" });
  const [saving, setSaving] = useState(false);

  const loadStaff = async () => {
    try {
      const res = await api.get("/auth/staff");
      setStaff(res.data.data || []);
    } catch (err) {
      showToast("Failed to load staff", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) { showToast("Name, email and password are required", "error"); return; }
    setSaving(true);
    try {
      await api.post("/auth/register", form);
      showToast(`${form.name} account created! They can now log in.`);
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", role: "teacher", phone: "" });
      loadStaff();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create account", "error");
    } finally {
      setSaving(false);
    }
  };

  const roleColors = { admin: "#064e3b", principal: "#1d4ed8", teacher: "#7c3aed", bursar: "#d97706" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ padding: 14, background: "#e0f2fe", borderRadius: 8, border: "1px solid #7dd3fc", fontSize: 13, color: "#0369a1", flex: 1, marginRight: 16 }}>
          👨‍🏫 Staff accounts allow teachers and bursars to log in and use the system. Teachers can enter marks. Bursars can record fee payments.
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Add Staff</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Loading...</div>
      ) : (
        <div style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#064e3b", color: "white" }}>
                {["Name","Email","Role","Phone","Status"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: "bold" }}>{s.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{s.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: roleColors[s.role] || "#6b7280", color: "white", padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: "bold", textTransform: "capitalize" }}>{s.role}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{s.phone || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: s.is_active ? "#d1fae5" : "#fee2e2", color: s.is_active ? "#065f46" : "#dc2626", padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: "bold" }}>
                      {s.is_active ? "✓ Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {staff.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No staff accounts yet</div>}
        </div>
      )}

      {showAdd && (
        <Modal title="👨‍🏫 Create Staff Account" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Full Name *" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="e.g. John Mwangi" />
            <Field label="Email *" value={form.email} onChange={v => setForm({...form, email: v})} placeholder="e.g. john@school.ac.ke" />
            <Field label="Password *" type="password" value={form.password} onChange={v => setForm({...form, password: v})} placeholder="Min 8 characters" />
            <Field label="Phone" value={form.phone} onChange={v => setForm({...form, phone: v})} placeholder="07XXXXXXXX" />
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Role *</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", background: "white" }}>
                <option value="teacher">Teacher — can enter marks</option>
                <option value="bursar">Bursar — can record fee payments</option>
                <option value="principal">Principal — full access</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#065f46" }}>
            ✓ The staff member will log in at the same URL using this email and password.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAdd(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleAdd} disabled={saving} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              {saving ? "Creating..." : "✓ Create Account"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FeeStructure({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [structures, setStructures] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    class_id: "", term: "Term 1 2024",
    academic_year: "2024",
    tuition_fee: "", activity_fee: "",
    boarding_fee: "", other_fee: ""
  });

  const terms = ["Term 1 2024", "Term 2 2024", "Term 3 2024"];

  const loadData = async () => {
    try {
      const [cls, str] = await Promise.all([
        api.get("/academics/classes"),
        api.get("/fees/structure?academic_year=2024")
      ]);
      setClasses(cls.data.data || []);
      setStructures(str.data.data || []);
    } catch (err) {
      showToast("Failed to load data", "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.class_id || !form.term || !form.tuition_fee) {
      showToast("Class, term and tuition fee are required", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("/fees/structure", {
        ...form,
        tuition_fee: parseFloat(form.tuition_fee || 0),
        activity_fee: parseFloat(form.activity_fee || 0),
        boarding_fee: parseFloat(form.boarding_fee || 0),
        other_fee: parseFloat(form.other_fee || 0),
      });
      showToast("Fee structure saved!");
      setShowAdd(false);
      setForm({ class_id: "", term: "Term 1 2024", academic_year: "2024", tuition_fee: "", activity_fee: "", boarding_fee: "", other_fee: "" });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee structure?")) return;
    try {
      await api.delete("/fees/structure/" + id);
      showToast("Deleted successfully");
      loadData();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const grouped = {};
  structures.forEach(s => {
    if (!grouped[s.class_name]) grouped[s.class_name] = [];
    grouped[s.class_name].push(s);
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ padding: 14, background: "#e0f2fe", borderRadius: 8, border: "1px solid #7dd3fc", fontSize: 13, color: "#0369a1", flex: 1, marginRight: 16 }}>
          🏷️ Set the fees each class must pay per term. When a payment is recorded the expected amount loads automatically.
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Set Fees</button>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "white", borderRadius: 12 }}>
          No fee structures set yet. Click <strong>+ Set Fees</strong> to get started.
        </div>
      )}

      {Object.entries(grouped).map(([className, rows]) => (
        <div key={className} style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
          <div style={{ padding: "12px 20px", background: "#064e3b", color: "white", fontSize: 14, fontWeight: "bold" }}>
            📚 {className}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0fdf4" }}>
                {["Term","Tuition","Activity","Boarding","Other","Total",""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#064e3b", fontWeight: "bold" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 ? "#f9fafb" : "white" }}>
                  <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: "bold" }}>{r.term}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13 }}>{fmtKES(r.tuition_fee)}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, color: "#6b7280" }}>{fmtKES(r.activity_fee)}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, color: "#6b7280" }}>{fmtKES(r.boarding_fee)}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, color: "#6b7280" }}>{fmtKES(r.other_fee)}</td>
                  <td style={{ padding: "11px 16px", fontSize: 14, fontWeight: "bold", color: "#064e3b" }}>{fmtKES(r.total_amount)}</td>
                  <td style={{ padding: "11px 16px" }}>
                    <button onClick={() => handleDelete(r.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {showAdd && (
        <Modal title="🏷️ Set Fee Structure" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Class *</label>
              <select value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", background: "white" }}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Term *</label>
              <select value={form.term} onChange={e => setForm({...form, term: e.target.value})}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", background: "white" }}>
                {terms.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Tuition Fee (KES) *" type="number" value={form.tuition_fee} onChange={v => setForm({...form, tuition_fee: v})} placeholder="e.g. 15000" />
            <Field label="Activity Fee (KES)" type="number" value={form.activity_fee} onChange={v => setForm({...form, activity_fee: v})} placeholder="e.g. 2000" />
            <Field label="Boarding Fee (KES)" type="number" value={form.boarding_fee} onChange={v => setForm({...form, boarding_fee: v})} placeholder="e.g. 0" />
            <Field label="Other Fee (KES)" type="number" value={form.other_fee} onChange={v => setForm({...form, other_fee: v})} placeholder="e.g. 500" />
          </div>
          <div style={{ marginTop: 12, padding: 12, background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#065f46" }}>
            Total = {fmtKES((parseFloat(form.tuition_fee||0) + parseFloat(form.activity_fee||0) + parseFloat(form.boarding_fee||0) + parseFloat(form.other_fee||0)))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAdd(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              {saving ? "Saving..." : "✓ Save Fee Structure"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Attendance({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState([]);
  const [activeTab, setActiveTab] = useState("mark");

  useEffect(() => {
    api.get("/academics/classes").then(res => setClasses(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    api.get(`/attendance/class/${selectedClass}?date=${selectedDate}`)
      .then(res => setStudents(res.data.data || []))
      .catch(() => showToast("Failed to load attendance", "error"))
      .finally(() => setLoading(false));
  }, [selectedClass, selectedDate]);

  const setStatus = (studentId, status) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const markAll = (status) => setStudents(prev => prev.map(s => ({ ...s, status })));

  const handleSave = async () => {
    if (!selectedClass) { showToast("Select a class first", "error"); return; }
    setSaving(true);
    try {
      const records = students.map(s => ({ student_id: s.id, status: s.status || "present" }));
      await api.post("/attendance/save", { records, class_id: selectedClass, date: selectedDate });
      showToast("Attendance saved successfully!");
    } catch (err) {
      showToast("Failed to save attendance", "error");
    } finally {
      setSaving(false);
    }
  };

  const loadReport = async () => {
    try {
      const res = await api.get(`/attendance/report?class_id=${selectedClass}&month=${reportMonth}`);
      setReportData(res.data.data || []);
    } catch (err) {
      showToast("Failed to load report", "error");
    }
  };

  const statusColors = { present: "#16a34a", absent: "#dc2626", late: "#d97706", excused: "#6b7280" };
  const statusBg = { present: "#d1fae5", absent: "#fee2e2", late: "#fef3c7", excused: "#f3f4f6" };

  const summary = { present: students.filter(s => s.status === "present").length, absent: students.filter(s => s.status === "absent").length, late: students.filter(s => s.status === "late").length };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "white", borderRadius: 10, padding: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", width: "fit-content" }}>
        {["mark","report"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: activeTab === t ? "#064e3b" : "transparent", color: activeTab === t ? "white" : "#6b7280", fontSize: 13, fontFamily: "inherit" }}>
            {t === "mark" ? "✅ Mark Attendance" : "📊 Monthly Report"}
          </button>
        ))}
      </div>

      {activeTab === "mark" && (
        <div>
          <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Select Class</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            {students.length > 0 && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#6b7280", marginRight: 4 }}>Mark all:</span>
                {["present","absent","late"].map(s => (
                  <button key={s} onClick={() => markAll(s)} style={{ background: statusBg[s], color: statusColors[s], border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: "bold", textTransform: "capitalize" }}>{s}</button>
                ))}
                <div style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 12 }}>
                  <span style={{ color: "#16a34a", fontWeight: "bold" }}>✓ {summary.present} Present</span>
                  <span style={{ color: "#dc2626", fontWeight: "bold" }}>✕ {summary.absent} Absent</span>
                  <span style={{ color: "#d97706", fontWeight: "bold" }}>⏰ {summary.late} Late</span>
                </div>
              </div>
            )}
          </div>

          {loading && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Loading students...</div>}

          {!loading && students.length > 0 && (
            <div style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#064e3b", color: "white" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12 }}>Adm. No.</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12 }}>Student Name</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12 }}>Present</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12 }}>Absent</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12 }}>Late</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12 }}>Excused</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>{s.adm_no}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: "bold" }}>{s.name}</td>
                      {["present","absent","late","excused"].map(status => (
                        <td key={status} style={{ padding: "10px 16px", textAlign: "center" }}>
                          <button onClick={() => setStatus(s.id, status)} style={{ width: 32, height: 32, borderRadius: "50%", border: s.status === status ? "none" : "2px solid #e5e7eb", background: s.status === status ? statusColors[status] : "white", color: s.status === status ? "white" : "#9ca3af", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                            {status === "present" ? "✓" : status === "absent" ? "✕" : status === "late" ? "⏰" : "E"}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: 16, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleSave} disabled={saving} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: "bold" }}>
                  {saving ? "Saving..." : "💾 Save Attendance"}
                </button>
              </div>
            </div>
          )}

          {!loading && !selectedClass && (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "white", borderRadius: 12 }}>Select a class above to mark attendance</div>
          )}
        </div>
      )}

      {activeTab === "report" && (
        <div>
          <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Select Class</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
                  <option value="">-- All Classes --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Month</label>
                <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={loadReport} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Load Report</button>
            </div>
          </div>

          {reportData.length > 0 && (
            <div style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#064e3b", color: "white" }}>
                    {["Student","Adm. No.","Present","Absent","Late","Total Days","Rate"].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => {
                    const rate = r.total > 0 ? Math.round((parseInt(r.present) / parseInt(r.total)) * 100) : 0;
                    return (
                      <tr key={i} style={{ background: i % 2 ? "#f9fafb" : "white" }}>
                        <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: "bold" }}>{r.name}</td>
                        <td style={{ padding: "11px 16px", fontSize: 12, color: "#6b7280" }}>{r.adm_no}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#16a34a", fontWeight: "bold" }}>{r.present}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#dc2626", fontWeight: "bold" }}>{r.absent}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#d97706", fontWeight: "bold" }}>{r.late}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13 }}>{r.total}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{ background: rate >= 80 ? "#d1fae5" : rate >= 60 ? "#fef3c7" : "#fee2e2", color: rate >= 80 ? "#065f46" : rate >= 60 ? "#92400e" : "#dc2626", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: "bold" }}>{rate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {reportData.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "white", borderRadius: 12 }}>Select a class and month then click Load Report</div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, items }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
      <h4 style={{ margin: "0 0 14px", color: "#064e3b", fontSize: 14 }}>{title}</h4>
      {items.map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
          <span style={{ color: "#6b7280" }}>{label}</span>
          <span style={{ color: "#111", fontWeight: "bold" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 24, width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#064e3b", fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9ca3af" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", background: "white" }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}