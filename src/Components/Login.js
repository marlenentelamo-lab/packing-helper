import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
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
      const response = await api.post("/login", formData);
      setMessage(response.message || "Logged in successfully");
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="auth-page">
  <h1 className="auth-title">Login</h1>
  <form className="item-form" onSubmit={handleSubmit}>
    <div className="form-field">
      <label htmlFor="username">Username</label>
      <input
        id="username"
        name="username"
        className="field-input"
        value={formData.username}
        onChange={handleChange}
      />
    </div>
    <div className="form-field">
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        name="password"
        className="field-input"
        value={formData.password}
        onChange={handleChange}
      />
    </div>
    <button type="submit" className="btn btn-primary auth-submit-button">Login</button>
  </form>

  <p className="auth-switch">
    Need an account? <Link to="/signup">Sign up</Link>
  </p>
</div>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </section>
  );
}

export default Login;
