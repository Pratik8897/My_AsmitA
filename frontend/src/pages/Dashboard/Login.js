import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const res = await API.post("/auth/login", form);

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard");
      }
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <aside className="login-brand">
          <div className="brand-mark">
            <img src="/logo192.png" alt="My Asmita" />
            <div className="brand-text">my ASMITA</div>
          </div>
        </aside>

        <form className="login-panel" onSubmit={handleLogin}>
          {/* <button
            className="login-close"
            type="button"
            aria-label="Close login"
            onClick={() => navigate(-1)}
          >
            ×
          </button> */}

          <div className="login-header">
            <h1>Welcome back!</h1>
            <p>Happy to see you again!</p>
          </div>

          <label className="login-label" htmlFor="login-email">
            Email Address
          </label>
          <div className="login-input">
            <span className="login-icon email" aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <label className="login-label" htmlFor="login-password">
            Password
          </label>
          <div className="login-input with-action">
            <span className="login-icon lock" aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="login-action"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
            />
          </div>

          <button className="login-forgot" type="button">
            Forgot Password?
          </button>

          <button className="login-submit" type="submit">
            SIGN IN
          </button>

          <div className="login-footer">Copyright 2026 Asmita</div>
        </form>
      </div>
    </div>
  );
};

export default Login;
