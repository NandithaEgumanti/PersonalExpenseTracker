
import { useEffect, useState } from 'react';
import api from './api';
import ExpenseDashboard from './ExpenseDashboard';
import './App.css';

function App() {

    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [page, setPage] = useState('login');
    const [message, setMessage] = useState('');

    // Password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

    // Login fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Registration fields
    const [name, setName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');

    // =====================================
    // RESTORE LOGIN AFTER REFRESH
    // =====================================

    useEffect(() => {

        const savedEmail = sessionStorage.getItem('email');
        const savedPassword = sessionStorage.getItem('password');

        if (!savedEmail || !savedPassword) {
            setLoading(false);
            return;
        }

        api.get('/api/users/me', {
            auth: {
                username: savedEmail,
                password: savedPassword
            }
        })
            .then((response) => {
                setCurrentUser(response.data);
            })
            .catch((error) => {

                console.error('Session restore error:', error);

                sessionStorage.removeItem('email');
                sessionStorage.removeItem('password');

                setCurrentUser(null);
            })
            .finally(() => {
                setLoading(false);
            });

    }, []);

    // =====================================
    // LOGIN
    // =====================================

    const handleLogin = async (e) => {

        e.preventDefault();
        setMessage('');
        setSubmitting(true);

        try {

            const response = await api.get('/api/users/me', {
                auth: {
                    username: email.trim(),
                    password: password
                }
            });

            sessionStorage.setItem('email', email.trim());
            sessionStorage.setItem('password', password);

            setCurrentUser(response.data);

            setEmail('');
            setPassword('');

        } catch (error) {

            console.error('Login error:', error);

            if (error.response?.status === 401) {

                setMessage('Invalid email or password');

            } else if (error.response) {

                setMessage(
                    `Login failed. Server error: ${error.response.status}`
                );

            } else {

                setMessage(
                    'Cannot connect to backend. Check Spring Boot.'
                );
            }

        } finally {
            setSubmitting(false);
        }
    };

    // =====================================
    // REGISTRATION
    // =====================================

    const handleRegister = async (e) => {

        e.preventDefault();
        setMessage('');
        setSubmitting(true);

        try {

            const response = await api.post('/api/users', {

                name: name.trim(),
                email: registerEmail.trim(),
                password: registerPassword

            });

            // Save login credentials
            sessionStorage.setItem('email', registerEmail.trim());
            sessionStorage.setItem('password', registerPassword);

            // Automatically login after registration
            setCurrentUser(response.data);

            setName('');
            setRegisterEmail('');
            setRegisterPassword('');

        } catch (error) {

            console.error('Registration error:', error);

            if (error.response?.status === 409) {

                setMessage('Email already registered');

            } else if (error.response) {

                setMessage(
                    error.response.data?.message ||
                    `Registration failed: ${error.response.status}`
                );

            } else {

                setMessage('Cannot connect to backend');

            }

        } finally {
            setSubmitting(false);
        }
    };

    // =====================================
    // LOGOUT
    // =====================================

    const handleLogout = () => {

        sessionStorage.removeItem('email');
        sessionStorage.removeItem('password');

        setCurrentUser(null);

        setEmail('');
        setPassword('');

        setName('');
        setRegisterEmail('');
        setRegisterPassword('');

        setMessage('');
        setPage('login');

        setShowPassword(false);
        setShowRegisterPassword(false);
    };

    // =====================================
    // LOADING SCREEN
    // =====================================

    if (loading) {

        return (
            <div style={styles.loading}>
                Loading...
            </div>
        );
    }

    // =====================================
    // DASHBOARD AFTER LOGIN
    // =====================================

    if (currentUser) {

        return (
            <ExpenseDashboard
                currentUser={currentUser}
                onLogout={handleLogout}
            />
        );
    }

    // =====================================
    // LOGIN AND REGISTER UI
    // =====================================

    return (

        <div style={styles.container}>

            <div style={styles.card}>

                <div style={styles.logo}>
                    <span style={styles.logoIcon}>₹</span>
                </div>

                <h1 style={styles.heading}>
                    Personal Expense Tracker
                </h1>

                <p style={styles.description}>
                    Manage your money. Track your expenses.
                </p>

                {/* LOGIN PAGE */}

                {page === 'login' ? (

                    <>

                        <h2 style={styles.subHeading}>
                            Welcome Back!
                        </h2>

                        <p style={styles.helperText}>
                            Login to continue to your account
                        </p>

                        <form onSubmit={handleLogin}>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                                style={styles.input}
                                disabled={submitting}
                            />

                            <div style={styles.passwordWrapper}>

                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    style={styles.passwordInput}
                                    disabled={submitting}
                                />

                                <button
                                    type="button"
                                    style={styles.eyeButton}
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    disabled={submitting}
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>

                            </div>

                            <button
                                type="submit"
                                style={styles.button}
                                disabled={submitting}
                            >
                                {submitting ? 'Logging in...' : 'Login'}
                            </button>

                        </form>

                        <p style={styles.switchText}>
                            Don't have an account?

                            <button
                                type="button"
                                onClick={() => {
                                    setPage('register');
                                    setMessage('');
                                    setShowPassword(false);
                                }}
                                style={styles.linkButton}
                                disabled={submitting}
                            >
                                Register
                            </button>

                        </p>

                    </>

                ) : (

                    /* REGISTRATION PAGE */

                    <>

                        <h2 style={styles.subHeading}>
                            Create Account
                        </h2>

                        <p style={styles.helperText}>
                            Register to start tracking your expenses
                        </p>

                        <form onSubmit={handleRegister}>

                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                required
                                style={styles.input}
                                disabled={submitting}
                            />

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={registerEmail}
                                onChange={(e) =>
                                    setRegisterEmail(e.target.value)
                                }
                                required
                                style={styles.input}
                                disabled={submitting}
                            />

                            <div style={styles.passwordWrapper}>

                                <input
                                    type={
                                        showRegisterPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    placeholder="Create a password"
                                    value={registerPassword}
                                    onChange={(e) =>
                                        setRegisterPassword(e.target.value)
                                    }
                                    required
                                    minLength={6}
                                    style={styles.passwordInput}
                                    disabled={submitting}
                                />

                                <button
                                    type="button"
                                    style={styles.eyeButton}
                                    onClick={() =>
                                        setShowRegisterPassword(
                                            !showRegisterPassword
                                        )
                                    }
                                    disabled={submitting}
                                    aria-label={
                                        showRegisterPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {showRegisterPassword ? 'Hide' : 'Show'}
                                </button>

                            </div>

                            <button
                                type="submit"
                                style={styles.button}
                                disabled={submitting}
                            >
                                {submitting
                                    ? 'Registering...'
                                    : 'Register'}
                            </button>

                        </form>

                        <p style={styles.switchText}>
                            Already have an account?

                            <button
                                type="button"
                                onClick={() => {
                                    setPage('login');
                                    setMessage('');
                                    setShowRegisterPassword(false);
                                }}
                                style={styles.linkButton}
                                disabled={submitting}
                            >
                                Login
                            </button>

                        </p>

                    </>

                )}

                {/* ERROR MESSAGE */}

                {message && (

                    <p style={styles.error}>
                        {message}
                    </p>

                )}

                <p style={styles.footer}>
                    © 2026 Personal Expense Tracker
                </p>

            </div>

        </div>
    );
}

// =====================================
// STYLING
// =====================================

const styles = {

    container: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #eef2ff, #f4f6fb)',
        padding: '20px',
        boxSizing: 'border-box'
    },

    card: {
        width: '100%',
        maxWidth: '430px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '18px',
        boxShadow: '0 8px 30px rgba(35,55,90,0.10)',
        textAlign: 'center',
        boxSizing: 'border-box'
    },

    logo: {
        marginBottom: '15px'
    },

    logoIcon: {
        display: 'inline-flex',
        width: '55px',
        height: '55px',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3157d5',
        color: '#ffffff',
        borderRadius: '15px',
        fontSize: '30px',
        fontWeight: 'bold'
    },

    heading: {
        color: '#1e293b',
        fontSize: '25px',
        marginBottom: '8px'
    },

    description: {
        color: '#718096',
        fontSize: '14px',
        marginBottom: '25px'
    },

    subHeading: {
        color: '#334155',
        fontSize: '22px',
        marginBottom: '8px'
    },

    helperText: {
        color: '#718096',
        fontSize: '13px',
        marginBottom: '22px'
    },

    input: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '13px',
        marginBottom: '15px',
        border: '1px solid #d8dfeb',
        borderRadius: '8px',
        fontSize: '15px',
        outline: 'none'
    },

    passwordWrapper: {
        position: 'relative',
        width: '100%',
        marginBottom: '15px'
    },

    passwordInput: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '13px 65px 13px 13px',
        border: '1px solid #d8dfeb',
        borderRadius: '8px',
        fontSize: '15px',
        outline: 'none'
    },

    eyeButton: {
        position: 'absolute',
        right: '8px',
        top: '5px',
        padding: '7px 9px',
        background: 'transparent',
        color: '#3157d5',
        border: 'none',
        fontSize: '12px',
        cursor: 'pointer'
    },

    button: {
        width: '100%',
        padding: '13px',
        backgroundColor: '#3157d5',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer'
    },

    switchText: {
        marginTop: '22px',
        color: '#475569',
        fontSize: '14px'
    },

    linkButton: {
        background: 'none',
        border: 'none',
        color: '#3157d5',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        marginLeft: '5px'
    },

    error: {
        color: '#dc2626',
        backgroundColor: '#fef2f2',
        padding: '10px',
        borderRadius: '7px',
        marginTop: '15px',
        fontSize: '14px'
    },

    footer: {
        color: '#94a3b8',
        fontSize: '12px',
        marginTop: '25px'
    },

    loading: {
        textAlign: 'center',
        marginTop: '100px',
        fontSize: '20px',
        color: '#3157d5'
    }
};

export default App;

