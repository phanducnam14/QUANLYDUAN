import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { email, password });
            console.log("Login Response:", res.data);
            const { token, user } = res.data;

            // Lưu token và user vào localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') navigate('/admin');
            else if (user.role === 'MANAGER') navigate('/manager');
            else navigate('/employee');

        } catch (err) {
            console.error("❌ Login error:", err);
            if (err.response) {
                console.error("Error Status:", err.response.status);
                console.error("Error Data:", err.response.data);
            }
            const errorMsg = err.response?.data || err.message || "Đăng nhập thất bại! Vui lòng kiểm tra thông tin.";
            setError(typeof errorMsg === 'string' ? errorMsg : "Đăng nhập thất bại!");
        } finally {
            setIsLoading(false);
        }
    };

    // Removed useGoogleLogin hook, will use GoogleLogin component instead

    return (
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
            <div className="card shadow-lg border-0 p-5" style={{maxWidth: '500px', width: '90%', borderRadius: '15px'}}>
                <div className="text-center mb-4">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style={{width: 80, height: 80}}>
                        <i className="bi bi-shield-lock-fill fs-1"></i>
                    </div>
                    <h2 className="fw-bold text-primary mb-1">WELCOME BACK</h2>
                    <p className="text-muted">Đăng nhập để quản lý dự án</p>
                </div>

                {error && <div className="alert alert-danger text-center p-2 mb-4">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@gmail.com"
                        />
                    </div>
                    <div className="mb-4">
                        <div className="d-flex justify-content-between">
                            <label className="form-label">Mật khẩu</label>
                            <a href="/forgot-password" style={{fontSize: '0.85rem', color: '#6366f1', textDecoration: 'none'}}>
                                Quên mật khẩu?
                            </a>
                        </div>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-2 mb-3"
                        disabled={isLoading}
                        style={{background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none'}}
                    >
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="text-center my-3 position-relative">
                    <hr />
                    <span style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0 10px', color: '#94a3b8', fontSize: '0.85rem'}}>
                        Hoặc tiếp tục với
                    </span>
                </div>

                                <div className="d-flex justify-content-center">
                                    <div id="googleLoginWrapper">
                                        <div className="google-btn-custom">
                                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                                <GoogleLogin
                                                    onSuccess={async (credentialResponse) => {
                                                        const idToken = credentialResponse.credential;
                                                        try {
                                                            setIsLoading(true);
                                                            const response = await api.post('/auth/google-login', { idToken });
                                                            const { token, user } = response.data;
                                                            
                                                            localStorage.setItem('token', token);
                                                            localStorage.setItem('user', JSON.stringify(user));
                                                            
                                                            // Redirect based on role
                                                            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') navigate('/admin');
                                                            else if (user.role === 'MANAGER') navigate('/manager');
                                                            else navigate('/employee');
                                                        } catch (err) {
                                                            console.error("Google Login fail:", err);
                                                            setError("Đăng nhập bằng Google thất bại: " + (err.response?.data || err.message));
                                                        } finally {
                                                            setIsLoading(false);
                                                        }
                                                    }}
                                                    onError={() => {
                                                        console.log('Login Failed');
                                                        setError("Đăng nhập bằng Google thất bại!");
                                                    }}
                                                    useOneTap
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
            </div>
        </div>
    );
};

export default LoginPage;