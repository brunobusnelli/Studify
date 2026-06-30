import { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, LogOut, Mail, UserPlus } from 'lucide-react';

const defaultUser = {
  name: 'Usuario',
  email: 'estudiante@mail.com'
};

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('studify-user')) || null;
  } catch {
    return null;
  }
}

export default function AuthShell({ children }) {
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(readUser);

  useEffect(() => {
    if (user) {
      localStorage.setItem('studify-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('studify-user');
    }
  }, [user]);

  const submitAuth = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setUser({
      name: form.get('name') || defaultUser.name,
      email: form.get('email') || defaultUser.email
    });
  };

  if (user) {
    return <>
      {children}
      <div className="session-chip">
        <div><strong>{user.name}</strong><span>{user.email}</span></div>
        <button onClick={() => setUser(null)}><LogOut size={17} />Salir</button>
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
        <span><Mail size={18} /> Cuenta preparada para Supabase</span>
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
        <button className="primary-button" type="submit">{mode === 'login' ? <Mail size={18} /> : <UserPlus size={18} />}{mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
      </form>
      <button className="link-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Crear una cuenta nueva' : 'Ya tengo cuenta'}
      </button>
    </section>
  </main>;
}
