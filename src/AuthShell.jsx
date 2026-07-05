import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { BookOpen, GraduationCap, LoaderCircle, LogOut, Mail, Sparkles, UserPlus } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient.js';

const defaultUser = {
  name: 'Usuario',
  email: '',
  provider: 'demo'
};

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('studify-user')) || null;
  } catch {
    return null;
  }
}

function profileFromSupabaseUser(user) {
  return {
    id: user.id,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
    email: user.email,
    provider: 'supabase'
  };
}

function authRedirectUrl() {
  return new URL(import.meta.env.BASE_URL || '/', window.location.origin).href;
}

function friendlyAuthError(message) {
  const normalized = String(message || '').toLowerCase();
  if (normalized.includes('email rate limit')) {
    return 'Supabase limito los emails de registro por unos minutos. Proba iniciar sesion si la cuenta ya se creo, o espera un rato antes de registrarte de nuevo.';
  }
  if (normalized.includes('invalid login credentials')) {
    return 'Email o contrasena incorrectos.';
  }
  if (normalized.includes('already registered') || normalized.includes('already exists')) {
    return 'Ese email ya esta registrado. Proba iniciar sesion.';
  }
  if (normalized.includes('password')) {
    return 'La contrasena no cumple los requisitos de Supabase.';
  }
  return message || 'No se pudo completar la accion.';
}

export default function AuthShell({ children }) {
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(() => (isSupabaseConfigured ? null : readUser()));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? profileFromSupabaseUser(data.session.user) : null);
      setAuthReady(true);
    }).catch(() => {
      setUser(null);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? profileFromSupabaseUser(session.user) : null);
      setAuthReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('studify-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('studify-user');
    }
  }, [user]);

  const submitAuth = async (event) => {
    event.preventDefault();
    setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');
    const name = String(form.get('name') || '').trim();

    if (!email || !password || (mode === 'register' && !name)) {
      setMessage('Completa todos los campos obligatorios.');
      return;
    }

    if (password.length < 6) {
      setMessage('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setMessage('Las contrasenas no coinciden.');
      return;
    }

    if (!isSupabaseConfigured) {
      setUser({ name: name || defaultUser.name, email: email || defaultUser.email, provider: 'demo' });
      return;
    }

    setLoading(true);
    const response = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: authRedirectUrl() } });

    setLoading(false);

    if (response.error) {
      setMessage(friendlyAuthError(response.error.message));
      return;
    }

    if (response.data.user) {
      setUser(profileFromSupabaseUser(response.data.user));
      setMessage(mode === 'register' ? 'Cuenta creada. Revisa tu email si Supabase pide confirmacion.' : 'Sesion iniciada.');
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null);
  };

  if (!authReady) {
    return <main className="auth-page auth-loading-page">
      <section className="auth-loading-card">
        <div className="auth-loading-logo"><GraduationCap size={34} /><span><LoaderCircle size={22} /></span></div>
        <div>
          <h2>Cargando Studify</h2>
          <p>Preparando tu espacio de estudio.</p>
        </div>
        <div className="auth-loading-steps" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="auth-loading-foot"><Sparkles size={18} />Sincronizando tu sesion</div>
      </section>
    </main>;
  }

  if (user) {
    return <>
      {isValidElement(children) ? cloneElement(children, { user, onLogout: logout }) : children}
      <div className="session-chip">
        <div><strong>{user.name}</strong><span>{user.email} · {user.provider === 'supabase' ? 'Supabase' : 'Demo local'}</span></div>
        <button onClick={logout}><LogOut size={17} />Salir</button>
      </div>
    </>;
  }

  return <main className="auth-page">
    <section className="auth-brand-panel">
      <div className="auth-logo"><GraduationCap size={34} /></div>
      <h1>Studify</h1>
      <p>Organiza materias, examenes, sesiones de estudio y apuntes en un solo lugar.</p>
      <div className="auth-feature-list">
        <span><BookOpen size={18} /> Plan de Hoy inteligente</span>
        <span><Mail size={18} /> {isSupabaseConfigured ? 'Supabase Auth activo' : 'Modo demo sin credenciales'}</span>
      </div>
    </section>

    <section className="auth-card">
      <div>
        <h2>{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</h2>
        <p>{mode === 'login' ? 'Entra a tu espacio de estudio.' : 'Crea tu perfil de estudiante.'}</p>
      </div>
      <form className="auth-form" onSubmit={submitAuth} autoComplete="off" key={mode}>
        {mode === 'register' ? <input name="name" placeholder="Nombre" autoComplete="name" required /> : null}
        <input name="email" type="email" placeholder="Email" autoComplete="off" required />
        <input name="password" type="password" placeholder="Contrasena" autoComplete="off" minLength={6} required />
        {mode === 'register' ? <input name="confirmPassword" type="password" placeholder="Confirmar contrasena" autoComplete="new-password" minLength={6} required /> : null}
        {message ? <p className="auth-message">{message}</p> : null}
        <button className="primary-button" type="submit" disabled={loading}>{mode === 'login' ? <Mail size={18} /> : <UserPlus size={18} />}{loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
      </form>
      <button className="link-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); }}>
        {mode === 'login' ? 'Crear una cuenta nueva' : 'Ya tengo cuenta'}
      </button>
    </section>
  </main>;
}
