     <div style={{ background: student.health?.current_medication !== "None" ? "#fef3c7" : "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: student.health?.current_medication !== "None" ? "2px solid #f59e0b" : "none" }}>
            <h4 style={{ margin: "0 0 12px", color: "#92400e", fontSize: 14 }}>💊 Medication</h4>
            <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{student.health?.current_medication || "No special medication."}</p>
          </div>
        

      {showAddPayment && (
        <Modal title="💰 Record Fee Payment" onClose={() => setShowAddPayment(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Term" value={payForm.term} onChange={v => setPayForm({...payForm, term: v})} />
            <Field label="Amount Expected (KES)" type="number" value={payForm.amount_expected} onChange={v => setPayForm({...payForm, amount_expected: v})} />
            <Field label="Amount Paid (KES) *" type="number" value={payForm.amount_paid} onChange={v => setPayForm({...payForm, amount_paid: v})} />
            <SelectField label="Payment Method" value={payForm.payment_method} options={["M-Pesa","Cash","Bank","Cheque"]} onChange={v => setPayForm({...payForm, payment_method: v})} />
            <Field label="Reference No." value={payForm.reference_no} onChange={v => setPayForm({...payForm, reference_no: v})} />
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
    
function FeeStructure({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [structures, setStructures] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ class_id: "", term: "", academic_year: String(new Date().getFullYear()), tuition_fee: "", activity_fee: "", boarding_fee: "", other_fee: "" });
  const [terms, setTerms] = useState([]);
const [currentTerm, setCurrentTerm] = useState(null);

  const loadData = async () => {
    try {
      const [cls, str, termRes] = await Promise.all([
        api.get("/academics/classes"),
        api.get("/fees/structure?academic_year=" + new Date().getFullYear()),
        api.get("/settings/terms")
      ]);
      setClasses(cls.data.data || []);
      setStructures(str.data.data || []);
      const allTerms = termRes.data.data || [];
      setTerms(allTerms.map(t => t.term));
      const cur = allTerms.find(t => t.is_current);
      if (cur) setCurrentTerm(cur.term);
    } catch (err) { showToast("Failed to load data", "error"); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.class_id || !form.term || !form.tuition_fee) { showToast("Class, term and tuition fee are required", "error"); return; }
    setSaving(true);
    try {
      await api.post("/fees/structure", { ...form, tuition_fee: parseFloat(form.tuition_fee || 0), activity_fee: parseFloat(form.activity_fee || 0), boarding_fee: parseFloat(form.boarding_fee || 0), other_fee: parseFloat(form.other_fee || 0) });
      showToast("Fee structure saved!");
      setShowAdd(false);
      setForm({ class_id: "", term: "", academic_year: String(new Date().getFullYear()), tuition_fee: "", activity_fee: "", boarding_fee: "", other_fee: "" });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee structure?")) return;
    try { await api.delete("/fees/structure/" + id); showToast("Deleted!"); loadData(); }
    catch (err) { showToast("Failed to delete", "error"); }
  };

  const handleGenerate = async () => {
    const term = window.prompt("Enter term to generate fees for:\ne.g. Term 1 2024");
    if (!term) return;
    setGenerating(true);
    try {
      const res = await api.post("/fees/generate", { term, academic_year: String(new Date().getFullYear()) });
      showToast(res.data.message);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to generate", "error");
    } finally { setGenerating(false); }
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
          🏷️ Set fees per class per term. Then click <strong>⚡ Generate Fee Records</strong> to auto-create fee records for all students.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleGenerate} disabled={generating} style={{ background: "#1d4ed8", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {generating ? "Generating..." : "⚡ Generate Fee Records"}
          </button>
          <button onClick={() => setShowAdd(true)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Set Fees</button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "white", borderRadius: 12 }}>No fee structures yet. Click <strong>+ Set Fees</strong> to get started.</div>
      )}

      {Object.entries(grouped).map(([className, rows]) => (
        <div key={className} style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
          <div style={{ padding: "12px 20px", background: "#064e3b", color: "white", fontSize: 14, fontWeight: "bold" }}>📚 {className}</div>
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
              <select value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", background: "white" }}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Term *</label>
              <select value={form.term} onChange={e => setForm({...form, term: e.target.value})} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", background: "white" }}>
                {terms.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Tuition Fee (KES) *" type="number" value={form.tuition_fee} onChange={v => setForm({...form, tuition_fee: v})} placeholder="e.g. 15000" />
            <Field label="Activity Fee (KES)" type="number" value={form.activity_fee} onChange={v => setForm({...form, activity_fee: v})} placeholder="e.g. 2000" />
            <Field label="Boarding Fee (KES)" type="number" value={form.boarding_fee} onChange={v => setForm({...form, boarding_fee: v})} placeholder="e.g. 0" />
            <Field label="Other Fee (KES)" type="number" value={form.other_fee} onChange={v => setForm({...form, other_fee: v})} placeholder="e.g. 500" />
          </div>
          <div style={{ marginTop: 12, padding: 12, background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#065f46" }}>
            Total = {fmtKES(parseFloat(form.tuition_fee||0) + parseFloat(form.activity_fee||0) + parseFloat(form.boarding_fee||0) + parseFloat(form.other_fee||0))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAdd(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>{saving ? "Saving..." : "✓ Save Fee Structure"}</button>
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
  const [selectedTerm, setSelectedTerm] = useState("");
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    api.get("/academics/classes").then(res => setClasses(res.data.data || [])).catch(() => {});
    api.get("/academics/subjects").then(res => setSubjects(res.data.data || [])).catch(() => {});
    api.get("/settings/terms").then(res => {
      const t = res.data.data || [];
      setTerms(t.map(x => x.term));
      const cur = t.find(x => x.is_current);
      if (cur) setSelectedTerm(cur.term);
    }).catch(() => {});
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
      const records = students.map(s => ({ student_id: s.id, subject_id: selectedSubject, class_id: selectedClass, term: selectedTerm, academic_year: String(new Date().getFullYear()), cat1: parseFloat(marks[s.id]?.cat1 || 0), cat2: parseFloat(marks[s.id]?.cat2 || 0), exam: parseFloat(marks[s.id]?.exam || 0) }));
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

  const setStatus = (studentId, status) => setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
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
          {!loading && !selectedClass && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "white", borderRadius: 12 }}>Select a class above to mark attendance</div>}
        </div>
      )}

      {activeTab === "report" && (
        <div>
          <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Class</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
                  <option value="">-- All Classes --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Month</label>
                <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={loadReport} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Load Report</button>
            </div>
          </div>
          {reportData.length > 0 && (
            <div style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#064e3b", color: "white" }}>
                    {["Student","Adm. No.","Present","Absent","Late","Total","Rate"].map(h => (
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
          {reportData.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "white", borderRadius: 12 }}>Select a class and month then click Load Report</div>}
        </div>
      )}
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
      showToast(`${form.name} account created!`);
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
          👨‍🏫 Create accounts for teachers and bursars to log in and use the system.
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Add Staff</button>
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Loading...</div> : (
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
                  <td style={{ padding: "12px 16px" }}><span style={{ background: roleColors[s.role] || "#6b7280", color: "white", padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: "bold", textTransform: "capitalize" }}>{s.role}</span></td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{s.phone || "—"}</td>
                  <td style={{ padding: "12px 16px" }}><span style={{ background: s.is_active ? "#d1fae5" : "#fee2e2", color: s.is_active ? "#065f46" : "#dc2626", padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: "bold" }}>{s.is_active ? "✓ Active" : "Inactive"}</span></td>
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
            <Field label="Full Name *" value={form.name} onChange={v => setForm({...form, name: v})} />
            <Field label="Email *" value={form.email} onChange={v => setForm({...form, email: v})} />
            <Field label="Password *" type="password" value={form.password} onChange={v => setForm({...form, password: v})} />
            <Field label="Phone" value={form.phone} onChange={v => setForm({...form, phone: v})} />
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Role</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", background: "white" }}>
                <option value="teacher">Teacher — can enter marks</option>
                <option value="bursar">Bursar — can record payments</option>
                <option value="principal">Principal — full access</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAdd(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleAdd} disabled={saving} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>{saving ? "Creating..." : "✓ Create Account"}</button>
          </div>
        </Modal>
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

function SchoolSettings({ showToast }) {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [form, setForm] = useState({
    academic_year: String(new Date().getFullYear()),
    term: "",
    term_start_date: "",
    term_end_date: "",
    has_half_term: false,
    half_term_start: "",
    half_term_end: "",
    is_current: false,
  });

  const termOptions = () => {
    const year = form.academic_year || new Date().getFullYear();
    return [`Term 1 ${year}`, `Term 2 ${year}`, `Term 3 ${year}`];
  };

  const loadData = async () => {
    try {
      const [termsRes, currentRes] = await Promise.all([
        api.get("/settings/terms"),
        api.get("/settings/current-term"),
      ]);
      setTerms(termsRes.data.data || []);
      setCurrentTerm(currentRes.data.data || null);
    } catch (err) {
      showToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.term || !form.term_start_date || !form.term_end_date) {
      showToast("Term name, start and end dates are required", "error");
      return;
    }
    if (form.has_half_term && (!form.half_term_start || !form.half_term_end)) {
      showToast("Please enter half term start and end dates", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("/settings/terms", form);
      showToast("Term saved successfully!");
      setShowAdd(false);
      setForm({ academic_year: String(new Date().getFullYear()), term: "", term_start_date: "", term_end_date: "", has_half_term: false, half_term_start: "", half_term_end: "", is_current: false });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = async (id) => {
    try {
      await api.put(`/settings/terms/${id}/set-current`);
      showToast("Current term updated!");
      loadData();
    } catch (err) {
      showToast("Failed to update current term", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this term?")) return;
    try {
      await api.delete(`/settings/terms/${id}`);
      showToast("Term deleted!");
      loadData();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const grouped = {};
  terms.forEach(t => {
    if (!grouped[t.academic_year]) grouped[t.academic_year] = [];
    grouped[t.academic_year].push(t);
  });

  return (
    <div>
      {currentTerm && (
        <div style={{ background: "linear-gradient(135deg, #064e3b, #065f46)", borderRadius: 12, padding: 20, marginBottom: 20, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Current Term</div>
            <div style={{ fontSize: 22, fontWeight: "bold" }}>{currentTerm.term}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{fmt(currentTerm.term_start_date)} → {fmt(currentTerm.term_end_date)}</div>
            {currentTerm.has_half_term && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>📅 Half Term: {fmt(currentTerm.half_term_start)} → {fmt(currentTerm.half_term_end)}</div>
            )}
          </div>
          <div style={{ background: "#f59e0b", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: "bold", color: "#1a1a1a" }}>📅 {currentTerm.academic_year}</div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ padding: 14, background: "#e0f2fe", borderRadius: 8, border: "1px solid #7dd3fc", fontSize: 13, color: "#0369a1", flex: 1, marginRight: 16 }}>
          📅 Set your school term dates including half term breaks. The system auto-detects the current term based on today's date.
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Add Term</button>
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Loading...</div> : (
        Object.keys(grouped).sort((a, b) => b - a).map(year => (
          <div key={year} style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 12px", color: "#064e3b", fontSize: 16 }}>📚 Academic Year {year}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {grouped[year].map(t => (
                <div key={t.id} style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: t.is_current ? "2px solid #064e3b" : "1px solid #e5e7eb" }}>
                  {t.is_current && (
                    <div style={{ background: "#064e3b", color: "#a7f3d0", fontSize: 11, padding: "4px 12px", fontWeight: "bold", textAlign: "center" }}>✓ CURRENT TERM</div>
                  )}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h4 style={{ margin: 0, color: "#064e3b", fontSize: 15 }}>{t.term}</h4>
                      <span style={{ background: t.has_half_term ? "#dbeafe" : "#f3f4f6", color: t.has_half_term ? "#1d4ed8" : "#6b7280", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: "bold" }}>
                        {t.has_half_term ? "Has Half Term" : "No Half Term"}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>OPENS</div>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: "#064e3b" }}>{fmt(t.term_start_date)}</div>
                      </div>
                      <div style={{ background: "#fef2f2", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>CLOSES</div>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: "#dc2626" }}>{fmt(t.term_end_date)}</div>
                      </div>
                    </div>
                    {t.has_half_term && (
                      <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: "#92400e", marginBottom: 4, fontWeight: "bold" }}>📅 HALF TERM BREAK</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 10, color: "#6b7280" }}>FROM</div>
                            <div style={{ fontSize: 12, fontWeight: "bold", color: "#92400e" }}>{fmt(t.half_term_start)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "#6b7280" }}>TO</div>
                            <div style={{ fontSize: 12, fontWeight: "bold", color: "#92400e" }}>{fmt(t.half_term_end)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      {!t.is_current && (
                        <button onClick={() => handleSetCurrent(t.id)} style={{ flex: 1, background: "#064e3b", color: "white", border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Set as Current</button>
                      )}
                      <button onClick={() => handleDelete(t.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {terms.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "white", borderRadius: 12 }}>
          No terms set yet. Click <strong>+ Add Term</strong> to get started.
        </div>
      )}

      {showAdd && (
        <Modal title="📅 Add School Term" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Academic Year *" value={form.academic_year} onChange={v => setForm({...form, academic_year: v, term: ""})} placeholder="e.g. 2025" />
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: "bold" }}>Term *</label>
              <select value={form.term} onChange={e => setForm({...form, term: e.target.value})} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontFamily: "inherit", outline: "none", background: "white" }}>
                <option value="">-- Select Term --</option>
                {termOptions().map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: 14, background: "#f0fdf4", borderRadius: 8, border: "1px solid #6ee7b7" }}>
            <div style={{ fontWeight: "bold", color: "#064e3b", marginBottom: 10, fontSize: 13 }}>📅 Term Dates</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Opening Date *" type="date" value={form.term_start_date} onChange={v => setForm({...form, term_start_date: v})} />
              <Field label="Closing Date *" type="date" value={form.term_end_date} onChange={v => setForm({...form, term_end_date: v})} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: 12, background: form.has_half_term ? "#fef3c7" : "#f9fafb", borderRadius: 8, border: form.has_half_term ? "1px solid #f59e0b" : "1px solid #e5e7eb" }}>
              <input type="checkbox" checked={form.has_half_term} onChange={e => setForm({...form, has_half_term: e.target.checked, half_term_start: "", half_term_end: ""})} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: "bold", color: "#92400e" }}>📅 This term has a half term break</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Term 1 and Term 2 in Kenya usually have one half term break</div>
              </div>
            </label>
          </div>
          {form.has_half_term && (
            <div style={{ marginTop: 12, padding: 14, background: "#fef3c7", borderRadius: 8, border: "1px solid #f59e0b" }}>
              <div style={{ fontWeight: "bold", color: "#92400e", marginBottom: 10, fontSize: 13 }}>Half Term Break Dates</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Half Term Starts *" type="date" value={form.half_term_start} onChange={v => setForm({...form, half_term_start: v})} />
                <Field label="Half Term Ends *" type="date" value={form.half_term_end} onChange={v => setForm({...form, half_term_end: v})} />
              </div>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: 12, background: form.is_current ? "#d1fae5" : "#f9fafb", borderRadius: 8, border: form.is_current ? "1px solid #6ee7b7" : "1px solid #e5e7eb" }}>
              <input type="checkbox" checked={form.is_current} onChange={e => setForm({...form, is_current: e.target.checked})} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: "bold", color: "#064e3b" }}>✓ Set as current term</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>The whole system will use this term for marks, fees and attendance</div>
              </div>
            </label>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setShowAdd(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ background: "#064e3b", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              {saving ? "Saving..." : "✓ Save Term"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}