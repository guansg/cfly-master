import * as Menubar from '@radix-ui/react-menubar';
import { FileMenu } from './menubar/FileMenu';
import { ViewMenu } from './menubar/ViewMenu';
import { HelpMenu } from './menubar/HelpMenu';
import { AppLogo } from './AppLogo';

interface MenuBarProps {
  onAction: (action: string) => void;
}

export function MenuBar({ onAction }: MenuBarProps) {
  return (
    <Menubar.Root className="h-full flex items-center text-sm select-none">
      <div className="px-3 flex items-center">
        <AppLogo size={16} className="text-sky-600 dark:text-sky-400" />
      </div>
      
      <FileMenu onAction={onAction} />
      <ViewMenu onAction={onAction} />
      <HelpMenu onAction={onAction} />
    </Menubar.Root>
  );
}

