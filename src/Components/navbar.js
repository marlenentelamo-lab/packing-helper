import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Packing Helper</Link>
  
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/tasks">Tasks</Link>
        <Link to="/pictures">Pictures</Link>
        <Link to="/notifications">Notifications</Link>
        <Link to="/move-trip-selector">Moves &amp; Trips</Link>
        <Link to="/login">Login</Link>   
      </div>
    </nav>  
);
}

export default Navbar;