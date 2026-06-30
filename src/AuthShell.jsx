import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { BookOpen, GraduationCap, LogOut, Mail, UserPlus } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient.js';

const defaultUser = {
  name: 'Usuario',
  email: 'estudiante@mail.com',
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

export default function AuthShell({ children }) {
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(readUser);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? profileFromSupabaseUser(data.session.user) : null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? profileFromSupabaseUser(session.user) : null);
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
    const email = form.get('email') || defaultUser.email;
    const password = form.get('password') || 'studify-demo';
    const name = form.get('name') || defaultUser.name;

    if (!isSupabaseConfigured) {
      setUser({ name, email, provider: 'demo' });
      return;
    }

    setLoading(true);
    const response = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { name } } });

    setLoading(false);

    if (response.error) {
      setMessage(response.error.message);
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

  if (user) {
    return <>
      {isValidElement(children) ? cloneElement(children, { user }) : children}
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
      <form className="auth-form" onSubmit={submitAuth}>
        {mode === 'register' ? <input name="name" placeholder="Nombre" /> : null}
        <input name="email" type="email" placeholder="Email" defaultValue="estudiante@mail.com" />
        <input name="password" type="password" placeholder="Contrasena" defaultValue="studify-demo" />
        {message ? <p className="auth-message">{message}</p> : null}
        <button className="primary-button" type="submit" disabled={loading}>{mode === 'login' ? <Mail size={18} /> : <UserPlus size={18} />}{loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
      </form>
      <button className="link-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); }}>
        {mode === 'login' ? 'Crear una cuenta nueva' : 'Ya tengo cuenta'}
      </button>
    </section>
  </main>;
}
