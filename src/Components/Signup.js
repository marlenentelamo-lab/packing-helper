import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await api.post("/signup", formData);
      setMessage(response.message || "Signed up successfully");
      setFormData({ name: "", email: "", password: "" });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
  <h1 className="auth-title">Sign Up</h1>
  <form className="item-form" onSubmit={handleSubmit}>
    <div className="form-field">
      <label htmlFor="name">Name</label>
      <input
        id="name"
        name="name"
        className="field-input"
        value={formData.name}
        onChange={handleChange}
      />
    </div>

    <div className="form-field">
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        className="field-input"
        value={formData.email}
        onChange={handleChange}
      />
    </div>

    <div className="form-field">
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        className="field-input"
        value={formData.password}
        onChange={handleChange}
      />
    </div>

    <button type="submit" className="btn btn-primary auth-submit-button">Sign Up</button>
  </form>

  <p className="auth-switch">
    Already have an account? <Link to="/login">Login</Link>
  </p>

  {message && <p className="panel-state" style={{ color: "#1e7a3f" }}>{message}</p>}
  {error && <p className="panel-error">{error}</p>}
</div>
  );
}

export default Signup;