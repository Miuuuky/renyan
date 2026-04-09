import { useNavigate, useLocation } from 'react-router-dom';

const NAV = [
  {
    path: '/lab',
    label: '实验室',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 3v11.5a3.5 3.5 0 007 0V3M6 3h12"/>
      </svg>
    )
  },
  {
    path: '/resonance',
    label: '共振厅',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M6.3 6.3a8 8 0 000 11.4M17.7 6.3a8 8 0 010 11.4"/>
      </svg>
    )
  },
  {
    path: '/words',
    label: '标签市集',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6h16M4 12h10M4 18h6"/>
      </svg>
    )
  },
  {
    path: '/mine',
    label: '我的',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    )
  }
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav">
      {NAV.map(item => (
        <button
          key={item.path}
          className={`nav-item ${pathname.startsWith(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
