import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Hotel, LayoutDashboard, CalendarDays, LogIn, LogOut, BedDouble, Users, ClipboardCheck, UserCog, Bell, Search, ChevronDown, ReceiptIndianRupee } from "lucide-react";
import { signOut, useSession } from "../lib/auth";
import { frontOfficePages } from "./access";
import "./frontOffice.css";

const icons = [LayoutDashboard, CalendarDays, LogIn, LogOut, ReceiptIndianRupee, BedDouble, Users, ClipboardCheck, UserCog];
export default function FrontOfficeLayout() {
  const user = useSession()!;
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const name = user.name || user.username;
  const activeDate = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date());
  const logout = () => { signOut(); navigate("/login", { replace: true }); };
  return <div className="fo-shell">
    <aside className="fo-sidebar">
      <a className="fo-brand" href="/dashboard"><Hotel size={30}/><span>Stay<span>Hub</span><small>HOSPITALITY OPERATING SYSTEM</small></span></a>
      <p className="fo-nav-label">FRONT OFFICE</p>
      <nav aria-label="Front Office navigation">{frontOfficePages.map((page, index) => {
        const Icon = icons[index];
        return <NavLink key={page.slug} to={"/dashboard" + (page.slug ? "/" + page.slug : "")} end><Icon size={19}/><span>{page.title}</span></NavLink>;
      })}</nav>
      <div className="fo-sidebar-art" aria-hidden="true"><img src="/sidebar-plant.jpg" alt="" /></div>
    </aside>
    <div className="fo-main">
      <header className="fo-header"><div className="fo-workspace-mark"><span className="fo-workspace-dot"/><div><small>STAYHUB</small><strong>Front Desk Workspace</strong></div></div>
        <div className="fo-header-actions"><form className="fo-search" onSubmit={event => { event.preventDefault(); navigate("/dashboard/guests"); }}><Search size={17}/><input aria-label="Search guests" placeholder="Search guests…" /></form><span className="fo-active-date"><CalendarDays size={16}/>{activeDate}</span>
          <div className="fo-popover-wrap"><button className="fo-icon-button" aria-label="Notifications" aria-expanded={noticeOpen} onClick={() => setNoticeOpen(!noticeOpen)}><Bell size={20}/></button>{noticeOpen && <div className="fo-popover">No live notifications yet. This dashboard uses sample data.</div>}</div>
          <div className="fo-popover-wrap" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setProfileOpen(false); }} onKeyDown={event => { if (event.key === "Escape") setProfileOpen(false); }}>
            <button className="fo-profile" aria-expanded={profileOpen} onClick={() => setProfileOpen(!profileOpen)}><span className="fo-avatar">{name.slice(0, 2).toUpperCase()}</span><ChevronDown size={16}/></button>
            {profileOpen && <div className="fo-popover"><strong>{name}</strong><p>{user.email}</p><small>Front Office Manager</small><button className="fo-button" onClick={logout}><LogOut size={16}/>Logout</button></div>}
          </div>
        </div>
      </header>
      <main className="fo-body"><Outlet/></main>
    </div>
  </div>;
}
