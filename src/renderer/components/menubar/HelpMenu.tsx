import * as Menubar from '@radix-ui/react-menubar';

interface HelpMenuProps {
  onAction: (action: string) => void;
}

export function HelpMenu({ onAction }: HelpMenuProps) {
  return (
    <Menubar.Menu>
      <Menubar.Trigger className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 text-sm font-medium outline-none">
        帮助
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          className="min-w-[200px] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-50"
          align="start"
          sideOffset={5}
        >
          <Menubar.Item
            className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-700"
            onSelect={() => onAction('website')}
          >
            访问官网...
          </Menubar.Item>

          <Menubar.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

          <Menubar.Item
            className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-700"
            onSelect={() => onAction('show-about')}
          >
            关于 CflyPrism...
          </Menubar.Item>
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>
  );
}
