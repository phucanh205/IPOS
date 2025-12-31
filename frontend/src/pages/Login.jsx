import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            alert("Vui lòng nhập đầy đủ thông tin đăng nhập!");
            return;
        }

        setIsLoading(true);

        // Simulate login (demo - no real authentication)
        setTimeout(() => {
            // Save to localStorage
            login(username);
            setIsLoading(false);
            navigate("/home");
        }, 1000);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="login-container">
            <div className="login-section">
                <div className="decorative-elements">
                    <div className="top-left">
                        <h2 className="login-title-top">Đăng nhập</h2>
                        <div className="pizza-icon pizza-slice">🍕</div>
                    </div>
                    <div className="bottom-left">
                        <div className="pizza-icon pizza-box">📦</div>
                    </div>
                    <div className="bottom-right">
                        <div className="pizza-icon pizza-cutter">🔪</div>
                    </div>
                </div>

                <div className="login-form-container">
                    <h1 className="welcome-text">Chào mừng trở lại</h1>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Tên đăng nhập</label>
                            <div className="input-wrapper">
                                <span className="input-icon">👤</span>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    placeholder="Tên đăng nhập"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    required
                                    disabled={isLoading}
                                />
                                <span className="eye-icon">👁️</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Mật khẩu</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    placeholder="Mật khẩu"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    disabled={isLoading}
                                />
                                <span
                                    className="eye-icon"
                                    onClick={togglePasswordVisibility}
                                    style={{ cursor: "pointer" }}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={isLoading}
                        >
                            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                        </button>

                        <p className="tagline">Fresh access, hot and ready</p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
