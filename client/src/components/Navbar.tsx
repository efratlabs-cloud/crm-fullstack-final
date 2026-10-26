'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navLinks = [
    { name: 'דאשבורד', href: '/dashboard' },
    { name: 'ניהול לידים', href: '/leads' },
    { name: 'פרויקטים', href: '/projects' },
    { name: 'עוזר חכם (AI)', href: '/ai-assistant' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* לוגו ותפריט ניווט */}
          <div className="flex items-center space-x-8 space-x-reverse">
            <div className="shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">Studio CRM</span>
            </div>
            <div className="hidden md:flex space-x-4 space-x-reverse">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* כפתור התנתקות */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              התנתק
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}