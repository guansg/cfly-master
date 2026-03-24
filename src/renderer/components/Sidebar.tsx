import { Settings, Workflow } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const mainMenuItems = [
    { id: 'workflows', icon: Workflow, label: '工作流', badge: 0 },
  ];

  const bottomMenuItems = [
    { id: 'settings', icon: Settings, label: '设置', badge: 0 },
  ];

  const renderItem = (item: typeof mainMenuItems[number]) => (
    <button
      key={item.id}
      onClick={() => onPageChange(item.id)}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative
        ${
          currentPage === item.id
            ? 'bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
      `}
    >
      <item.icon size={20} />
      <span className="font-medium">{item.label}</span>
      {item.badge > 0 && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-semibold leading-none px-1">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="w-48 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col">
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {mainMenuItems.map(renderItem)}
        </div>
        <div className="my-3 border-t border-gray-300 dark:border-gray-700" />
      </nav>

      <nav className="p-4 border-t border-gray-300 dark:border-gray-700">
        <div className="space-y-1">
          {bottomMenuItems.map(renderItem)}
        </div>
      </nav>
    </div>
  );
}
