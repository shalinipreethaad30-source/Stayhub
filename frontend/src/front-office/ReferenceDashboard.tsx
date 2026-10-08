import { ReactNode, useEffect, useMemo, useState } from "react";
import { BedDouble, CalendarCheck2, ClipboardCheck, MoreVertical, Users } from "lucide-react";
import { getReservations, Reservation } from "./reservationsApi";

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function ReferenceDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { getReservations().then((data) => setReservations(data.items)).catch(() => setError("Live data could not be loaded.")); }, []);
  const data = useMemo(() => {
    const checkedIn = reservations.filter((item) => item.status === "checked_in");
    const arrivals = reservations.filter((item) => item.check_in_date === today && ["confirmed", "tentative", "waiting"].includes(item.status));
    const departures = reservations.filter((item) => item.check_out_date === today && item.status === "checked_in");
    const assigned = reservations.filter((item) => item.room_number && !["cancelled", "checked_out"].includes(item.status));
    return { checkedIn, arrivals, departures, assigned };
  }, [reservations]);
  const totalRooms = 48;
  const reserved = reservations.filter((item) => ["confirmed", "tentative", "waiting"].includes(item.status)).length;
  const available = Math.max(totalRooms - data.checkedIn.length - reserved, 0);
  const latest = reservations.filter((item) => item.status !== "cancelled").slice(0, 4);
  const activities = reservations.filter((item) => item.status !== "cancelled").slice(0, 5);
  const occupiedPercent = totalRooms ? (data.checkedIn.length / totalRooms) * 100 : 0;
  const reservedPercent = totalRooms ? ((data.checkedIn.length + reserved) / totalRooms) * 100 : 0;
  return <div className="rd-dashboard">
    <section className="rd-hero"><div><p>WELCOME BACK</p><h2>Manage Your Hotel</h2><span>Everything you need to run your hotel, in one place.</span></div></section>
    <section className="rd-metrics">
      <Metric icon={<BedDouble />} tint="blue" label="Total Rooms" value={totalRooms} />
      <Metric icon={<Users />} tint="blue" label="In House Guests" value={data.checkedIn.length} />
      <Metric icon={<CalendarCheck2 />} tint="green" label="Check Ins Today" value={data.arrivals.length} />
      <Metric icon={<ClipboardCheck />} tint="amber" label="Check Outs Today" value={data.departures.length} />
    </section>
    {error && <p className="fo-api-error">{error}</p>}
    <section className="rd-insights">
      <article className="rd-card rd-chart"><div className="rd-card-head"><h3>Room Occupancy</h3><span>Current live status</span></div><div className="rd-live-occupancy"><strong>{data.checkedIn.length} <small>occupied rooms</small></strong><div><label><span>Occupied</span><b>{data.checkedIn.length} / {totalRooms}</b></label><progress max={totalRooms} value={data.checkedIn.length}/><label><span>Reserved</span><b>{reserved} / {totalRooms}</b></label><progress className="reserved" max={totalRooms} value={reserved}/></div></div></article>
      <article className="rd-card rd-status"><h3>Room Status</h3><div className="rd-status-content"><div className="rd-donut" style={{ background: `radial-gradient(circle,#fff 53%,transparent 54%),conic-gradient(#2465f1 0 ${occupiedPercent}%,#8bb9fa ${occupiedPercent}% ${reservedPercent}%,#dce7f9 ${reservedPercent}% 100%)` }}><strong>{totalRooms}</strong><span>Rooms</span></div><ul><li><i className="occupied"/>Occupied <b>{data.checkedIn.length}</b></li><li><i className="reserved"/>Reserved <b>{reserved}</b></li><li><i className="available"/>Available <b>{available}</b></li></ul></div></article>
      <article className="rd-card rd-activity"><div className="rd-card-head"><h3>Recent Activity</h3><a href="/dashboard/reservations">View All</a></div><ul>{activities.length === 0 ? <li className="rd-no-activity">No reservation activity yet.</li> : activities.map((item) => <li key={item.id}><i className={item.status === "checked_in" ? "green" : item.status === "checked_out" ? "amber" : "blue"}/><time>{item.check_in_date}</time><span>{item.guest.first_name} {item.guest.last_name} · {item.status.replace("_", " ")}</span></li>)}</ul></article>
    </section>
    <section className="rd-card rd-bookings"><div className="rd-card-head"><h3>Recent Bookings</h3><a href="/dashboard/reservations">View All</a></div><div className="fo-table-wrap"><table><thead><tr><th>Room</th><th>Guest</th><th>Check In</th><th>Check Out</th><th>Guests</th><th>Status</th><th>Actions</th></tr></thead><tbody>{latest.length === 0 ? <tr><td className="fo-empty" colSpan={7}>No reservations yet.</td></tr> : latest.map((item) => <tr key={item.id}><td><div className="rd-room"><span className="rd-room-image"/><b>{item.room_number || "—"}</b><small>{item.room_category || "Room"}</small></div></td><td><b>{item.guest.first_name} {item.guest.last_name}</b><small>{item.guest.email || item.guest.mobile || "No contact"}</small></td><td>{formatDate(item.check_in_date)}</td><td>{formatDate(item.check_out_date)}</td><td>{item.adults + item.children}</td><td><span className={`rd-status-pill ${item.status}`}>{item.status.replace("_", " ")}</span></td><td><MoreVertical size={18} /></td></tr>)}</tbody></table></div></section>
  </div>;
}

function Metric({ icon, tint, label, value }: { icon: ReactNode; tint: string; label: string; value: number }) { return <article className="rd-metric"><span className={`rd-metric-icon ${tint}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong></div><span className="rd-spark"/></article>; }
