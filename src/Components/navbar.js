import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../api";

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">Packing Helper</Link>
  
      <div className="navbar-links">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive || pathname === "/" ? "active" : undefined)}
        >
          Dashboard
        </NavLink>
        <NavLink to="/all-tasks">All Tasks</NavLink>
        <NavLink to="/pictures">Pictures</NavLink>
        <NavLink to="/notifications">Notifications</NavLink>
        <NavLink to="/move-trip-selector">Moves &amp; Trips</NavLink>

        {user ? (
          <>
            <span className="navbar-user">Hi, {user.name || user.email}</span>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <NavLink to="/login">Login</NavLink>
        )}
      </div>
    </nav>  
  );
}

export default Navbar;