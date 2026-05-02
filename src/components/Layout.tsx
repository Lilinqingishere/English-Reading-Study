import { useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { BookOpen, BookText, BrainCircuit, User, Library } from 'lucide-react';
import { useStore } from '../store';

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: Library },
  { path: '/analysis', label: '阅读分析', icon: BookOpen },
  { path: '/extension', label: '阅读拓展', icon: BookText },
  { path: '/review', label: '词汇复习', icon: BrainCircuit },
];

export default function Layout() {
  const { pathname } = useLocation();
  const addStudyTime = useStore((state) => state.addStudyTime);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      addStudyTime(1);
    }, 1000);

    return () => clearInterval(timer);
  }, [addStudyTime]);

  return (
    <div className="min-h-screen bg-brand-light flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-accent flex items-center justify-center rounded-sm">
                <span className="text-white font-serif font-bold text-xl leading-none">E</span>
              </div>
              <span className="font-serif font-bold text-xl text-brand-dark tracking-wide">
                Reading Academy
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 text-sm font-medium transition-colors py-2 border-b-2 ${
                      isActive
                        ? 'border-brand-accent text-brand-dark'
                        : 'border-transparent text-brand-muted hover:text-brand-dark'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-brand-border mt-auto py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-accent flex items-center justify-center rounded-sm opacity-50">
              <span className="text-white font-serif font-bold text-sm leading-none">E</span>
            </div>
            <span className="font-serif text-brand-muted text-sm">
              English Reading Academy © {new Date().getFullYear()}
            </span>
          </div>
          <p className="text-brand-muted text-xs font-sans">
            Inspired by the National Gallery of Art design principles.
          </p>
        </div>
      </footer>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-brand-border flex justify-around items-center z-50 pb-safe">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-3 gap-1 ${
                isActive ? 'text-brand-accent' : 'text-brand-muted'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
