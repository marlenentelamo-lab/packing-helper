import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function Navbar({ user, setUser }) {
  const navigate = useNavigate();

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
      <Link to="/" className="navbar-brand">Packing Helper</Link>
  
      <div className="navbar-links">
        <Link to="/tasks">Tasks</Link>
        <Link to="/all-tasks">All Tasks</Link>
        <Link to="/pictures">Pictures</Link>
        <Link to="/notifications">Notifications</Link>
        <Link to="/move-trip-selector">Moves &amp; Trips</Link>

        {user ? (
          <>
            <span className="navbar-user">Hi, {user.name || user.email}</span>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>  
  );
}

export default Navbar;