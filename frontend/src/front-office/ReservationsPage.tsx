import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus, LoaderCircle, Pencil, RefreshCw, Search, X } from "lucide-react";
import {
  cancelReservation,
  createReservation,
  getReservations,
  markReservationNoShow,
  updateReservation,
  Reservation,
  ReservationInput,
} from "./reservationsApi";

const initialForm: ReservationInput = {
  guest: { first_name: "", last_name: "", email: "", mobile: "" },
  room_number: "",
  room_category: "",
  check_in_date: "",
  check_out_date: "",
  adults: 1,
  children: 0,
  source: "front_desk",
};

function formatStatus(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ReservationInput>(initialForm);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({ check_in_date: "", check_out_date: "", room_number: "", room_category: "", adults: 1, children: 0 });
  const [cancelling, setCancelling] = useState(false);
  const [noShowing, setNoShowing] = useState(false);

  const loadReservations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getReservations(search, status);
      setReservations(data.items);
      setTotal(data.total);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReservations(); }, [status]);

  const submitReservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.check_in_date || !form.check_out_date) {
      setError("Select both check-in and check-out dates.");
      return;
    }
    if (form.check_out_date <= form.check_in_date) {
      setError("Check-out date must be after the check-in date.");
      return;
    }
    if (form.adults < 1) {
      setError("At least one adult is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createReservation(form);
      setForm(initialForm);
      setFormOpen(false);
      await loadReservations();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create reservation.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setError("");
    try {
      await cancelReservation(cancelTarget.id);
      setCancelTarget(null);
      await loadReservations();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to cancel reservation.");
    } finally {
      setCancelling(false);
    }
  };

  const openEdit = (reservation: Reservation) => {
    setEditTarget(reservation);
    setEditForm({ check_in_date: reservation.check_in_date, check_out_date: reservation.check_out_date, room_number: reservation.room_number || "", room_category: reservation.room_category || "", adults: reservation.adults, children: reservation.children });
  };
  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!editTarget) return; setSaving(true); setError("");
    try { await updateReservation(editTarget.id, editForm); setEditTarget(null); await loadReservations(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update reservation."); }
    finally { setSaving(false); }
  };
  const noShow = async (reservation: Reservation) => {
    setNoShowing(true); setError("");
    try { await markReservationNoShow(reservation.id); await loadReservations(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to mark reservation as no-show."); }
    finally { setNoShowing(false); }
  };
  return <>
    <section className="fo-page-heading">
      <div>
        <p className="fo-eyebrow">FRONT OFFICE OPERATIONS</p>
        <h2>Reservations</h2>
        <p>Create, search and manage reservations for your property.</p>
      </div>
      <button className="fo-button" onClick={() => setFormOpen(true)}>
        <CalendarPlus size={17}/>New Reservation
      </button>
    </section>

    <section className="fo-card fo-reservations-card">
      <div className="fo-reservation-toolbar">
        <div className="fo-reservation-search">
          <Search size={17}/>
          <input value={search} onChange={event => setSearch(event.target.value)}
            onKeyDown={event => { if (event.key === "Enter") void loadReservations(); }}
            placeholder="Search guest, mobile or reservation ID"/>
        </div>
        <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="tentative">Tentative</option>
          <option value="waiting">Waiting</option>
          <option value="cancelled">Cancelled</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
        </select>
        <button className="fo-outline-button" onClick={() => void loadReservations()} disabled={loading}>
          <RefreshCw size={15}/>Refresh
        </button>
      </div>
      {error && <p className="fo-api-error">{error}</p>}
      <div className="fo-section-heading">
        <h2>Reservations <span className="fo-count">{total}</span></h2>
        <span>Live property data</span>
      </div>
      <div className="fo-table-wrap">
        <table>
          <thead><tr>{["Guest", "Reservation ID", "Stay", "Room", "Guests", "Status", "Action"].map(column => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="fo-loading"><LoaderCircle size={18}/>Loading reservations…</td></tr>
              : reservations.length === 0 ? <tr><td colSpan={7} className="fo-empty">No reservations match the current filters.</td></tr>
              : reservations.map(reservation => <tr key={reservation.id}>
                <td><strong>{reservation.guest.first_name} {reservation.guest.last_name}</strong><small>{reservation.guest.mobile || reservation.guest.email || "No contact information"}</small></td>
                <td>{reservation.reservation_code}</td>
                <td>{reservation.check_in_date}<small>to {reservation.check_out_date}</small></td>
                <td>{reservation.room_number || "Unassigned"}<small>{reservation.room_category || ""}</small></td>
                <td>{reservation.adults} adult{reservation.adults !== 1 ? "s" : ""}{reservation.children ? `, ${reservation.children} child${reservation.children !== 1 ? "ren" : ""}` : ""}</td>
                <td><span className={`fo-badge ${["confirmed", "checked_in", "checked_out"].includes(reservation.status) ? "success" : "warning"}`}>{formatStatus(reservation.status)}</span></td>
                <td><div className="fo-row-actions">{["confirmed", "tentative", "waiting"].includes(reservation.status) ? <><button className="fo-small-button" onClick={() => openEdit(reservation)}><Pencil size={13}/>Edit</button><button className="fo-small-button fo-cancel-action" onClick={() => setCancelTarget(reservation)}><X size={13}/>Cancel</button><button className="fo-small-button" disabled={noShowing} onClick={() => void noShow(reservation)}>No-Show</button></> : null}</div></td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    {formOpen && <div className="fo-modal-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget && !saving) setFormOpen(false);
    }}>
      <form className="fo-modal" onSubmit={submitReservation}>
        <header><div><p className="fo-eyebrow">FRONT OFFICE</p><h2>New Reservation</h2></div>
          <button type="button" className="fo-icon-button" disabled={saving} onClick={() => setFormOpen(false)} aria-label="Close"><X size={19}/></button>
        </header>
        <div className="fo-form-grid">
          <label>First name<input required value={form.guest.first_name} onChange={event => setForm(current => ({ ...current, guest: { ...current.guest, first_name: event.target.value } }))}/></label>
          <label>Last name<input required value={form.guest.last_name} onChange={event => setForm(current => ({ ...current, guest: { ...current.guest, last_name: event.target.value } }))}/></label>
          <label>Email<input type="email" value={form.guest.email} onChange={event => setForm(current => ({ ...current, guest: { ...current.guest, email: event.target.value } }))}/></label>
          <label>Mobile<input value={form.guest.mobile} onChange={event => setForm(current => ({ ...current, guest: { ...current.guest, mobile: event.target.value } }))}/></label>
          <label>Check-in<input required type="date" value={form.check_in_date} onChange={event => setForm(current => ({ ...current, check_in_date: event.target.value }))}/></label>
          <label>Check-out<input required type="date" value={form.check_out_date} onChange={event => setForm(current => ({ ...current, check_out_date: event.target.value }))}/></label>
          <label>Room number<input value={form.room_number} placeholder="Optional" onChange={event => setForm(current => ({ ...current, room_number: event.target.value }))}/></label>
          <label>Room category<select value={form.room_category} onChange={event => setForm(current => ({ ...current, room_category: event.target.value }))}><option value="">Select room type</option><option value="Standard">Standard</option><option value="Deluxe">Deluxe</option><option value="Executive">Executive</option><option value="Suite">Suite</option><option value="Premium Suite">Premium Suite</option><option value="Family Room">Family Room</option></select></label>
          <label>Adults<input min="1" max="20" type="number" value={form.adults} onChange={event => setForm(current => ({ ...current, adults: Number(event.target.value) }))}/></label>
          <label>Children<input min="0" max="20" type="number" value={form.children} onChange={event => setForm(current => ({ ...current, children: Number(event.target.value) }))}/></label>
        </div>
        {error && <p className="fo-api-error">{error}</p>}
        <footer><button type="button" className="fo-outline-button" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</button>
          <button className="fo-button" disabled={saving}>{saving ? <><LoaderCircle size={16}/>Saving…</> : <><CalendarPlus size={16}/>Create Reservation</>}</button>
        </footer>
      </form>
    </div>}

    {editTarget && <div className="fo-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setEditTarget(null); }}><form className="fo-modal" onSubmit={saveEdit}><header><div><p className="fo-eyebrow">RESERVATION MODIFICATION</p><h2>Edit {editTarget.reservation_code}</h2></div><button type="button" className="fo-icon-button" disabled={saving} onClick={() => setEditTarget(null)} aria-label="Close"><X size={19}/></button></header><div className="fo-form-grid"><label>Check-in<input required type="date" value={editForm.check_in_date} onChange={event => setEditForm({...editForm, check_in_date:event.target.value})}/></label><label>Check-out<input required type="date" value={editForm.check_out_date} onChange={event => setEditForm({...editForm, check_out_date:event.target.value})}/></label><label>Room number<input value={editForm.room_number} onChange={event => setEditForm({...editForm, room_number:event.target.value})}/></label><label>Room category<input value={editForm.room_category} onChange={event => setEditForm({...editForm, room_category:event.target.value})}/></label><label>Adults<input min="1" type="number" value={editForm.adults} onChange={event => setEditForm({...editForm, adults:Number(event.target.value)})}/></label><label>Children<input min="0" type="number" value={editForm.children} onChange={event => setEditForm({...editForm, children:Number(event.target.value)})}/></label></div>{error && <p className="fo-api-error">{error}</p>}<footer><button type="button" className="fo-outline-button" disabled={saving} onClick={() => setEditTarget(null)}>Cancel</button><button className="fo-button" disabled={saving}>{saving ? <><LoaderCircle size={16}/>Saving…</> : "Save Changes"}</button></footer></form></div>}
    {cancelTarget && <div className="fo-modal-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget && !cancelling) setCancelTarget(null);
    }}>
      <section className="fo-modal fo-cancel-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-reservation-title">
        <header><span className="fo-cancel-icon"><AlertTriangle size={22}/></span>
          <button type="button" className="fo-icon-button" disabled={cancelling} onClick={() => setCancelTarget(null)} aria-label="Close"><X size={19}/></button>
        </header>
        <h2 id="cancel-reservation-title">Cancel reservation?</h2>
        <p>Are you sure you want to cancel <strong>{cancelTarget.reservation_code}</strong> for {cancelTarget.guest.first_name} {cancelTarget.guest.last_name}?</p>
        <p className="fo-muted">This changes the booking status to Cancelled.</p>
        <footer>
          <button type="button" className="fo-outline-button" disabled={cancelling} onClick={() => setCancelTarget(null)}>Keep reservation</button>
          <button className="fo-danger-button" disabled={cancelling} onClick={() => void cancel()}>{cancelling ? <><LoaderCircle size={16}/>Cancelling…</> : "Cancel reservation"}</button>
        </footer>
      </section>
    </div>}
  </>;
}








