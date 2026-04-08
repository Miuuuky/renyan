import { useNavigate, useLocation } from 'react-router-dom';

const NAV = [
  {
    path: '/tags',
    label: '标签墙',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 7h.01M3 5a2 2 0 012-2h3.28a2 2 0 011.42.59l7.71 7.71a2 2 0 010 2.83l-3.28 3.28a2 2 0 01-2.83 0L3.59 9.7A2 2 0 013 8.28V5z"/>
      </svg>
    )
  },
  {
    path: '/experiments',
    label: '实验场',
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
    label: '词语集市',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6h16M4 12h10M4 18h6"/>
      </svg>
    )
  },
  {
    path: '/river',
    label: '我的河',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 12c3-4 6-4 9 0s6 4 9 0M3 18c3-4 6-4 9 0s6 4 9 0"/>
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
