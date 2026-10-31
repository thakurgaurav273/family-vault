import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Plus,
  FileText,
  FolderOpen,
  Menu,
} from 'lucide-react';
import { useFamilyVault } from '../../context/FamilyVaultContext';

export const MobileNav: React.FC = () => {
  const { setIsUploadOpen } = useFamilyVault();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-1.5 min-w-[56px] text-[10px] font-medium transition-colors ${
            isActive
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Overview</span>
      </NavLink>

      <NavLink
        to="/photos"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-1.5 min-w-[56px] text-[10px] font-medium transition-colors ${
            isActive
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
          }`
        }
      >
        <ImageIcon className="w-5 h-5 mb-0.5" />
        <span>Photos</span>
      </NavLink>

      {/* Floating Upload Button */}
      <button
        onClick={() => setIsUploadOpen(true)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all -translate-y-2 ring-4 ring-white dark:ring-neutral-900"
        aria-label="Upload to FamilyVault"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      <NavLink
        to="/documents"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-1.5 min-w-[56px] text-[10px] font-medium transition-colors ${
            isActive
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
          }`
        }
      >
        <FileText className="w-5 h-5 mb-0.5" />
        <span>Documents</span>
      </NavLink>

      <NavLink
        to="/folders"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center p-1.5 min-w-[56px] text-[10px] font-medium transition-colors ${
            isActive
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
          }`
        }
      >
        <FolderOpen className="w-5 h-5 mb-0.5" />
        <span>Folders</span>
      </NavLink>
    </nav>
  );
};
