import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

function App() {
  const [session, setSession] = useState(null)
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [workTypes, setWorkTypes] = useState([])
  const [appointments, setAppointments] = useState([])

  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState("")

  const [editingCustomerId, setEditingCustomerId] = useState(null)
  const [editingVehicleId, setEditingVehicleId] = useState(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [plate, setPlate] = useState("")
  const [year, setYear] = useState("")
  const [currentKm, setCurrentKm] = useState("")

  const [newWorkName, setNewWorkName] = useState("")
  const [selectedWorkType, setSelectedWorkType] = useState("")
  const [serviceDate, setServiceDate] = useState("")
  const [nextDate, setNextDate] = useState("")
  const [km, setKm] = useState("")
  const [notes, setNotes] = useState("")

  const [requestVehicleId, setRequestVehicleId] = useState("")
  const [requestDate, setRequestDate] = useState("")
  const [requestTime, setRequestTime] = useState("")
  const [requestReason, setRequestReason] = useState("")

  const [proposalDate, setProposalDate] = useState("")
  const [proposalTime, setProposalTime] = useState("")
  const [adminMessage, setAdminMessage] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    const customersData = await supabase.from("customers").select("*").order("created_at", { ascending: false })
    const vehiclesData = await supabase.from("vehicles").select("*").order("created_at", { ascending: false })
    const servicesData = await supabase.from("service_history").select("*").order("created_at", { ascending: false })
    const workTypesData = await supabase.from("work_types").select("*").order("name", { ascending: true })
    const appointmentsData = await supabase.from("appointments").select("*").order("created_at", { ascending: false })

    setCustomers(customersData.data || [])
    setVehicles(vehiclesData.data || [])
    setServices(servicesData.data || [])
    setWorkTypes(workTypesData.data || [])
    setAppointments(appointmentsData.data || [])
  }

  const loginAdmin = async () => {
    if (!adminEmail || !adminPassword) {
      alert("Συμπλήρωσε email και κωδικό")
      return
    }

    setLoginLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })

    setLoginLoading(false)

    if (error) {
      console.log(error)
      alert("Λάθος email ή κωδικός")
      return
    }

    setAdminPassword("")
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  const loggedCustomer = customers.find(
    (customer) => customer.auth_user_id === session?.user?.id
  )

  const isAdmin = session && !loggedCustomer

  const resetCustomerForm = () => {
    setFirstName("")
    setLastName("")
    setPhone("")
    setEmail("")
    setEditingCustomerId(null)
  }

  const resetVehicleForm = () => {
    setBrand("")
    setModel("")
    setPlate("")
    setYear("")
    setCurrentKm("")
    setEditingVehicleId(null)
  }

  const saveCustomer = async () => {
    if (!firstName || !lastName || !phone) {
      alert("Συμπλήρωσε όνομα, επώνυμο και τηλέφωνο")
      return
    }

    if (editingCustomerId) {
      const { error } = await supabase
        .from("customers")
        .update({ first_name: firstName, last_name: lastName, phone, email })
        .eq("id", editingCustomerId)

      if (error) {
        console.log(error)
        alert("Σφάλμα ενημέρωσης πελάτη")
        return
      }
    } else {
      const { error } = await supabase.from("customers").insert([
        { first_name: firstName, last_name: lastName, phone, email, status: "active" },
      ])

      if (error) {
        console.log(error)
        alert("Σφάλμα αποθήκευσης πελάτη")
        return
      }
    }

    resetCustomerForm()
    fetchData()
  }

  const startEditCustomer = (customer) => {
    setEditingCustomerId(customer.id)
    setFirstName(customer.first_name || "")
    setLastName(customer.last_name || "")
    setPhone(customer.phone || "")
    setEmail(customer.email || "")
  }

  const toggleCustomerStatus = async (customer) => {
    const newStatus = customer.status === "active" ? "inactive" : "active"

    const { error } = await supabase
      .from("customers")
      .update({ status: newStatus })
      .eq("id", customer.id)

    if (error) {
      console.log(error)
      alert("Σφάλμα αλλαγής κατάστασης πελάτη")
      return
    }

    fetchData()
  }

  const deleteCustomer = async (customerId) => {
    const confirmDelete = confirm("Θέλεις σίγουρα να διαγράψεις τον πελάτη; Θα διαγραφούν και όλα τα οχήματα και service του.")
    if (!confirmDelete) return

    const customerVehicles = vehicles.filter((vehicle) => vehicle.customer_id === customerId)

    for (const vehicle of customerVehicles) {
      await supabase.from("service_history").delete().eq("vehicle_id", vehicle.id)
      await supabase.from("vehicles").delete().eq("id", vehicle.id)
    }

    const { error } = await supabase.from("customers").delete().eq("id", customerId)

    if (error) {
      console.log(error)
      alert("Σφάλμα διαγραφής πελάτη")
      return
    }

    setSelectedCustomer("")
    setSelectedVehicle("")
    fetchData()
  }

  const saveVehicle = async () => {
    if (!selectedCustomer || !brand || !model || !plate) {
      alert("Συμπλήρωσε πελάτη, μάρκα, μοντέλο και πινακίδα")
      return
    }

    if (editingVehicleId) {
      const { error } = await supabase
        .from("vehicles")
        .update({
          brand,
          model,
          plate,
          year: year || null,
          current_km: currentKm || null,
        })
        .eq("id", editingVehicleId)

      if (error) {
        console.log(error)
        alert("Σφάλμα ενημέρωσης οχήματος")
        return
      }
    } else {
      const { error } = await supabase.from("vehicles").insert([
        {
          customer_id: selectedCustomer,
          brand,
          model,
          plate,
          year: year || null,
          current_km: currentKm || null,
          status: "active",
        },
      ])

      if (error) {
        console.log(error)
        alert("Σφάλμα αποθήκευσης οχήματος")
        return
      }
    }

    resetVehicleForm()
    fetchData()
  }

  const startEditVehicle = (vehicle) => {
    setEditingVehicleId(vehicle.id)
    setBrand(vehicle.brand || "")
    setModel(vehicle.model || "")
    setPlate(vehicle.plate || "")
    setYear(vehicle.year || "")
    setCurrentKm(vehicle.current_km || "")
  }

  const deleteVehicle = async (vehicleId) => {
    const confirmDelete = confirm("Θέλεις σίγουρα διαγραφή οχήματος; Θα διαγραφούν και τα service του.")
    if (!confirmDelete) return

    await supabase.from("service_history").delete().eq("vehicle_id", vehicleId)

    const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId)

    if (error) {
      console.log(error)
      alert("Σφάλμα διαγραφής οχήματος")
      return
    }

    setSelectedVehicle("")
    fetchData()
  }

  const addWorkType = async () => {
    if (!newWorkName.trim()) {
      alert("Γράψε όνομα εργασίας")
      return
    }

    const { error } = await supabase.from("work_types").insert([{ name: newWorkName.trim() }])

    if (error) {
      console.log(error)
      alert("Η εργασία υπάρχει ήδη")
      return
    }

    setNewWorkName("")
    fetchData()
  }

  const addService = async () => {
    if (!selectedVehicle || !selectedWorkType || !serviceDate) {
      alert("Συμπλήρωσε όχημα, εργασία και ημερομηνία")
      return
    }

    const { error } = await supabase.from("service_history").insert([
      {
        vehicle_id: selectedVehicle,
        work_type_id: selectedWorkType,
        done_date: serviceDate,
        done_km: km || null,
        next_date: nextDate || null,
        notes,
      },
    ])

    if (error) {
      console.log(error)
      alert("Σφάλμα αποθήκευσης service")
      return
    }

    setSelectedWorkType("")
    setServiceDate("")
    setNextDate("")
    setKm("")
    setNotes("")
    fetchData()
  }

  const deleteService = async (id) => {
    const confirmDelete = confirm("Σίγουρα θέλεις διαγραφή service;")
    if (!confirmDelete) return

    const { error } = await supabase.from("service_history").delete().eq("id", id)

    if (error) {
      console.log(error)
      alert("Σφάλμα διαγραφής")
      return
    }

    fetchData()
  }

  const createAppointmentRequest = async () => {
    if (!requestVehicleId || !requestDate || !requestTime || !requestReason) {
      alert("Συμπλήρωσε όχημα, ημερομηνία, ώρα και αιτία")
      return
    }

    const vehicle = vehicles.find((v) => v.id === requestVehicleId)

    const { error } = await supabase.from("appointments").insert([
      {
        customer_id: loggedCustomer.id,
        vehicle_id: requestVehicleId,
        requested_date: requestDate,
        requested_time: requestTime,
        reason: requestReason,
        status: "pending",
      },
    ])

    if (error) {
      console.log(error)
      alert("Σφάλμα αποστολής αιτήματος")
      return
    }

    setRequestVehicleId("")
    setRequestDate("")
    setRequestTime("")
    setRequestReason("")

    alert(`Το αίτημα ραντεβού στάλθηκε για ${vehicle?.brand || ""} ${vehicle?.model || ""}`)
    fetchData()
  }

  const updateAppointment = async (id, status) => {
    const updateData = { status }

    if (status === "rescheduled") {
      updateData.proposed_date = proposalDate || null
      updateData.proposed_time = proposalTime || null
      updateData.admin_message = adminMessage || ""
    }

    if (status === "rejected") {
      updateData.admin_message = adminMessage || ""
    }

    const { error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)

    if (error) {
      console.log(error)
      alert("Σφάλμα ενημέρωσης ραντεβού")
      return
    }

    setProposalDate("")
    setProposalTime("")
    setAdminMessage("")
    fetchData()
  }

  const getStatusColor = (date) => {
    if (!date) return "#94a3b8"

    const today = new Date()
    const target = new Date(date)
    const diffDays = (target - today) / (1000 * 60 * 60 * 24)

    if (diffDays < 0) return "red"
    if (diffDays <= 30) return "orange"
    return "limegreen"
  }

  const customerVehicles = vehicles.filter((vehicle) => vehicle.customer_id === selectedCustomer)
  const vehicleServices = services.filter((service) => service.vehicle_id === selectedVehicle)

  const overdueServices = services.filter((service) => {
    if (!service.next_date) return false
    return new Date(service.next_date) < new Date()
  })

  const upcomingServices = services.filter((service) => {
    if (!service.next_date) return false
    const today = new Date()
    const target = new Date(service.next_date)
    const diffDays = (target - today) / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays <= 30
  })

  const activeCustomers = customers.filter((customer) => customer.status === "active")
  const inactiveCustomers = customers.filter((customer) => customer.status === "inactive")
  const pendingAppointments = appointments.filter((a) => a.status === "pending")

  const filteredCustomers = customers.filter((customer) => {
    const customerText = `${customer.first_name || ""} ${customer.last_name || ""} ${customer.phone || ""}`.toLowerCase()
    const customerCars = vehicles.filter((vehicle) => vehicle.customer_id === customer.id)
    const vehicleText = customerCars.map((vehicle) => `${vehicle.brand || ""} ${vehicle.model || ""} ${vehicle.plate || ""}`).join(" ").toLowerCase()
    return `${customerText} ${vehicleText}`.includes(search.toLowerCase())
  })

  if (!session) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginBox}>
          <h1>AutoRoumeliotiS</h1>
          <h2>Σύνδεση</h2>

          <input placeholder="Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} style={styles.input} />
          <input type="password" placeholder="Κωδικός" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} style={styles.input} />

          <button onClick={loginAdmin} style={styles.button}>
            {loginLoading ? "Σύνδεση..." : "Σύνδεση"}
          </button>
        </div>
      </div>
    )
  }

  if (loggedCustomer) {
    const myVehicles = vehicles.filter((v) => v.customer_id === loggedCustomer.id)
    const myVehicleIds = myVehicles.map((v) => v.id)
    const myServices = services.filter((s) => myVehicleIds.includes(s.vehicle_id))
    const myAppointments = appointments.filter((a) => a.customer_id === loggedCustomer.id)

    return (
      <div style={styles.app}>
        <div style={styles.topBar}>
          <h1>Portal Πελάτη</h1>
          <button onClick={logout} style={styles.logoutButton}>Αποσύνδεση</button>
        </div>

        <h2>Καλώς ήρθες, {loggedCustomer.first_name} {loggedCustomer.last_name}</h2>

        <div style={styles.panel}>
          <h2>Τα Οχήματά μου</h2>

          {myVehicles.map((vehicle) => (
            <div key={vehicle.id} style={styles.card}>
              <h3>{vehicle.brand} {vehicle.model}</h3>
              <p>Πινακίδα: {vehicle.plate}</p>
              <p>Χιλιόμετρα: {vehicle.current_km || "-"}</p>

              <h4>Ιστορικό Service</h4>

              {myServices.filter((s) => s.vehicle_id === vehicle.id).map((service) => {
                const work = workTypes.find((w) => w.id === service.work_type_id)

                return (
                  <div key={service.id} style={styles.subCard}>
                    <strong>{work?.name}</strong>
                    <br />
                    Ημερομηνία: {service.done_date}
                    <br />
                    Χιλιόμετρα: {service.done_km || "-"}
                    <br />
                    Σημειώσεις: {service.notes || "-"}
                    <br />
                    <span style={{ color: getStatusColor(service.next_date), fontWeight: "bold" }}>
                      Επόμενη: {service.next_date || "-"}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <h2>Αίτημα Ραντεβού</h2>

          <select value={requestVehicleId} onChange={(e) => setRequestVehicleId(e.target.value)} style={styles.input}>
            <option value="">Επιλογή Οχήματος</option>
            {myVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.brand} {vehicle.model} - {vehicle.plate}
              </option>
            ))}
          </select>

          <input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} style={styles.input} />
          <input type="time" value={requestTime} onChange={(e) => setRequestTime(e.target.value)} style={styles.input} />
          <textarea placeholder="Αιτία ραντεβού π.χ. αλλαγή λαδιών" value={requestReason} onChange={(e) => setRequestReason(e.target.value)} style={styles.input} />

          <button onClick={createAppointmentRequest} style={styles.button}>Αποστολή Αιτήματος</button>
        </div>

        <div style={styles.panel}>
          <h2>Τα Ραντεβού μου</h2>

          {myAppointments.map((appointment) => {
            const vehicle = vehicles.find((v) => v.id === appointment.vehicle_id)

            return (
              <div key={appointment.id} style={styles.card}>
                <strong>{vehicle?.brand} {vehicle?.model} - {vehicle?.plate}</strong>
                <br />
                Ζητήθηκε: {appointment.requested_date} {appointment.requested_time}
                <br />
                Αιτία: {appointment.reason || "-"}
                <br />
                Κατάσταση: <strong>{statusLabels[appointment.status] || appointment.status}</strong>
                <br />
                Πρόταση συνεργείου: {appointment.proposed_date || "-"} {appointment.proposed_time || ""}
                <br />
                Μήνυμα: {appointment.admin_message || "-"}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginBox}>
          <h2>Δεν βρέθηκε πελάτης για αυτό το login.</h2>
          <button onClick={logout} style={styles.logoutButton}>Αποσύνδεση</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.app}>
      <div style={styles.topBar}>
        <h1>AutoRoumeliotiS</h1>
        <button onClick={logout} style={styles.logoutButton}>Αποσύνδεση</button>
      </div>

      <input placeholder="🔍 Αναζήτηση" value={search} onChange={(e) => setSearch(e.target.value)} style={styles.search} />

      <div style={styles.dashboard}>
        <div style={{ ...styles.statCard, background: "#7f1d1d" }}><h3>🔴 Ληγμένα</h3><h1>{overdueServices.length}</h1></div>
        <div style={{ ...styles.statCard, background: "#78350f" }}><h3>🟠 Σύντομα</h3><h1>{upcomingServices.length}</h1></div>
        <div style={{ ...styles.statCard, background: "#14532d" }}><h3>🚗 Οχήματα</h3><h1>{vehicles.length}</h1></div>
        <div style={{ ...styles.statCard, background: "#1e3a8a" }}><h3>👤 Πελάτες</h3><h1>{customers.length}</h1></div>
        <div style={{ ...styles.statCard, background: "#064e3b" }}><h3>🟢 Ενεργοί</h3><h1>{activeCustomers.length}</h1></div>
        <div style={{ ...styles.statCard, background: "#450a0a" }}><h3>🔴 Ανενεργοί</h3><h1>{inactiveCustomers.length}</h1></div>
        <div style={{ ...styles.statCard, background: "#581c87" }}><h3>📅 Αιτήματα</h3><h1>{pendingAppointments.length}</h1></div>
      </div>

      <div style={styles.grid}>
        <div style={styles.panel}>
          <h2>{editingCustomerId ? "Επεξεργασία Πελάτη" : "Πελάτες"}</h2>

          <input placeholder="Όνομα" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={styles.input} />
          <input placeholder="Επώνυμο" value={lastName} onChange={(e) => setLastName(e.target.value)} style={styles.input} />
          <input placeholder="Τηλέφωνο" value={phone} onChange={(e) => setPhone(e.target.value)} style={styles.input} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />

          <button onClick={saveCustomer} style={styles.button}>
            {editingCustomerId ? "Αποθήκευση Αλλαγών Πελάτη" : "Αποθήκευση Πελάτη"}
          </button>

          {editingCustomerId && <button onClick={resetCustomerForm} style={styles.cancelButton}>Ακύρωση Επεξεργασίας</button>}

          <hr />

          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => {
                setSelectedCustomer(customer.id)
                setSelectedVehicle("")
              }}
              style={{
                ...styles.card,
                opacity: customer.status === "inactive" ? 0.55 : 1,
                border: selectedCustomer === customer.id ? "2px solid #38bdf8" : customer.status === "inactive" ? "1px solid #dc2626" : "1px solid #334155",
              }}
            >
              <strong>{customer.first_name} {customer.last_name}</strong>
              <br />📞 {customer.phone}
              <br />✉️ {customer.email || "-"}
              <br /><br />
              <span style={{ color: customer.status === "active" ? "limegreen" : "#f87171", fontWeight: "bold" }}>
                {customer.status === "active" ? "🟢 Ενεργός" : "🔴 Ανενεργός"}
              </span>
              <br /><br />
              <button onClick={(e) => { e.stopPropagation(); startEditCustomer(customer) }} style={styles.editButton}>Επεξεργασία Πελάτη</button>
              <button onClick={(e) => { e.stopPropagation(); toggleCustomerStatus(customer) }} style={{ ...styles.statusButton, background: customer.status === "active" ? "#f59e0b" : "#16a34a" }}>
                {customer.status === "active" ? "Απενεργοποίηση" : "Ενεργοποίηση"}
              </button>
              <button onClick={(e) => { e.stopPropagation(); deleteCustomer(customer.id) }} style={styles.deleteButton}>Διαγραφή Πελάτη</button>
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <h2>{editingVehicleId ? "Επεξεργασία Οχήματος" : "Οχήματα Πελάτη"}</h2>

          {!selectedCustomer && <p>Επίλεξε πελάτη</p>}

          {selectedCustomer && (
            <>
              <input placeholder="Μάρκα" value={brand} onChange={(e) => setBrand(e.target.value)} style={styles.input} />
              <input placeholder="Μοντέλο" value={model} onChange={(e) => setModel(e.target.value)} style={styles.input} />
              <input placeholder="Πινακίδα" value={plate} onChange={(e) => setPlate(e.target.value)} style={styles.input} />
              <input placeholder="Έτος" value={year} onChange={(e) => setYear(e.target.value)} style={styles.input} />
              <input placeholder="Χιλιόμετρα" value={currentKm} onChange={(e) => setCurrentKm(e.target.value)} style={styles.input} />

              <button onClick={saveVehicle} style={styles.button}>
                {editingVehicleId ? "Αποθήκευση Αλλαγών Οχήματος" : "Αποθήκευση Οχήματος"}
              </button>

              {editingVehicleId && <button onClick={resetVehicleForm} style={styles.cancelButton}>Ακύρωση Επεξεργασίας</button>}

              <hr />

              {customerVehicles.map((vehicle) => (
                <div key={vehicle.id} onClick={() => setSelectedVehicle(vehicle.id)} style={{ ...styles.card, border: selectedVehicle === vehicle.id ? "2px solid #38bdf8" : "1px solid #334155" }}>
                  <strong>{vehicle.brand} {vehicle.model}</strong>
                  <br />Πινακίδα: {vehicle.plate}
                  <br />Έτος: {vehicle.year || "-"}
                  <br />Χλμ: {vehicle.current_km || "-"}
                  <br /><br />
                  <button onClick={(e) => { e.stopPropagation(); startEditVehicle(vehicle) }} style={styles.editButton}>Επεξεργασία Οχήματος</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteVehicle(vehicle.id) }} style={styles.deleteButton}>Διαγραφή Οχήματος</button>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={styles.panel}>
          <h2>Service Οχήματος</h2>

          {!selectedVehicle && <p>Επίλεξε όχημα</p>}

          {selectedVehicle && (
            <>
              <input placeholder="Νέα εργασία" value={newWorkName} onChange={(e) => setNewWorkName(e.target.value)} style={styles.input} />
              <button onClick={addWorkType} style={styles.button}>Αποθήκευση Εργασίας</button>

              <hr />

              <select value={selectedWorkType} onChange={(e) => setSelectedWorkType(e.target.value)} style={styles.input}>
                <option value="">Επιλογή Εργασίας</option>
                {workTypes.map((work) => <option key={work.id} value={work.id}>{work.name}</option>)}
              </select>

              <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} style={styles.input} />
              <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} style={styles.input} />
              <input placeholder="Χιλιόμετρα" value={km} onChange={(e) => setKm(e.target.value)} style={styles.input} />
              <textarea placeholder="Σημειώσεις" value={notes} onChange={(e) => setNotes(e.target.value)} style={styles.input} />

              <button onClick={addService} style={styles.button}>Αποθήκευση Service</button>

              <hr />

              {vehicleServices.map((service) => {
                const work = workTypes.find((w) => w.id === service.work_type_id)

                return (
                  <div key={service.id} style={styles.card}>
                    <strong>{work?.name}</strong>
                    <br />Ημερομηνία: {service.done_date}
                    <br />Χιλιόμετρα: {service.done_km || "-"}
                    <br />Σημειώσεις: {service.notes || "-"}
                    <br /><br />
                    <span style={{ color: getStatusColor(service.next_date), fontWeight: "bold" }}>
                      Επόμενη: {service.next_date || "-"}
                    </span>
                    <br /><br />
                    <button onClick={() => deleteService(service.id)} style={styles.deleteButton}>Διαγραφή Service</button>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      <div style={styles.panel}>
        <h2>Αιτήματα Ραντεβού Πελατών</h2>

        {appointments.map((appointment) => {
          const customer = customers.find((c) => c.id === appointment.customer_id)
          const vehicle = vehicles.find((v) => v.id === appointment.vehicle_id)

          return (
            <div key={appointment.id} style={styles.card}>
              <strong>{customer?.first_name} {customer?.last_name}</strong>
              <br />
              Όχημα: {vehicle?.brand} {vehicle?.model} - {vehicle?.plate}
              <br />
              Ζητήθηκε: {appointment.requested_date} {appointment.requested_time}
              <br />
              Αιτία: {appointment.reason || "-"}
              <br />
              Κατάσταση: <strong>{statusLabels[appointment.status] || appointment.status}</strong>
              <br />
              Πρόταση: {appointment.proposed_date || "-"} {appointment.proposed_time || ""}
              <br />
              Μήνυμα: {appointment.admin_message || "-"}

              <br /><br />

              <input type="date" value={proposalDate} onChange={(e) => setProposalDate(e.target.value)} style={styles.input} />
              <input type="time" value={proposalTime} onChange={(e) => setProposalTime(e.target.value)} style={styles.input} />
              <textarea placeholder="Μήνυμα προς πελάτη" value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} style={styles.input} />

              <button onClick={() => updateAppointment(appointment.id, "approved")} style={styles.button}>Αποδοχή</button>
              <button onClick={() => updateAppointment(appointment.id, "rescheduled")} style={styles.editButton}>Πρόταση Άλλης Ημερομηνίας</button>
              <button onClick={() => updateAppointment(appointment.id, "rejected")} style={styles.deleteButton}>Απόρριψη</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  app: { padding: 20, background: "#0f172a", minHeight: "100vh", color: "white", fontFamily: "Arial" },
  loginPage: { minHeight: "100vh", background: "#0f172a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial" },
  loginBox: { background: "#1e293b", padding: 30, borderRadius: 12, width: 360, textAlign: "center" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 },
  logoutButton: { background: "#dc2626", color: "white", padding: 10, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" },
  search: { width: "100%", padding: 12, borderRadius: 8, border: "none", marginBottom: 20, fontSize: 16 },
  dashboard: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 15, marginBottom: 20 },
  statCard: { padding: 15, borderRadius: 10, textAlign: "center" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20 },
  panel: { background: "#1e293b", padding: 15, borderRadius: 10, marginBottom: 20 },
  card: { background: "#334155", padding: 12, borderRadius: 10, marginBottom: 10, cursor: "pointer" },
  subCard: { background: "#475569", padding: 10, borderRadius: 8, marginTop: 8, marginBottom: 8 },
  input: { width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "none", boxSizing: "border-box" },
  button: { background: "#38bdf8", color: "black", padding: 10, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", width: "100%", marginBottom: 8 },
  statusButton: { color: "white", padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", width: "100%", marginBottom: 8 },
  editButton: { background: "#2563eb", color: "white", padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", width: "100%", marginBottom: 8 },
  cancelButton: { background: "#64748b", color: "white", padding: 10, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", width: "100%", marginBottom: 8 },
  deleteButton: { background: "#dc2626", color: "white", padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", width: "100%", marginBottom: 8 },
}
const statusLabels = {
  pending: "Σε εκκρεμότητα",
  approved: "Εγκρίθηκε",
  rejected: "Απορρίφθηκε",
  rescheduled: "Νέα ημερομηνία",
}
export default App