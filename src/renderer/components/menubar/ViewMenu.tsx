import * as Menubar from '@radix-ui/react-menubar';

interface ViewMenuProps {
  onAction: (action: string) => void;
}

export function ViewMenu({ onAction }: ViewMenuProps) {
  return (
    <Menubar.Menu>
      <Menubar.Trigger className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 text-sm font-medium outline-none">
        视图
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          className="min-w-[200px] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-50"
          align="start"
          sideOffset={5}
        >
          <Menubar.Item
            className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
            onSelect={() => onAction('refresh')}
          >
            <span>刷新</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-4">F5</span>
          </Menubar.Item>
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>
  );
}
