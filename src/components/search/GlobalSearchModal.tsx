import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Image as ImageIcon,
  Film,
  FileText,
  FolderOpen,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { useFamilyVault } from '../../context/FamilyVaultContext';
import { formatBytes, formatDate } from '../../utils/formatters';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, files, folders, members, setPreviewFile } = useFamilyVault();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Keyboard shortcut listener (Cmd/Ctrl + K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedPhotos = q
    ? files.filter(
        (f) =>
          f.fileType === 'photo' &&
          (f.name.toLowerCase().includes(q) ||
            f.tags?.some((t) => t.toLowerCase().includes(q)) ||
            f.uploaderName.toLowerCase().includes(q))
      )
    : [];

  const matchedVideos = q
    ? files.filter(
        (f) =>
          f.fileType === 'video' &&
          (f.name.toLowerCase().includes(q) ||
            f.tags?.some((t) => t.toLowerCase().includes(q)) ||
            f.uploaderName.toLowerCase().includes(q))
      )
    : [];

  const matchedDocs = q
    ? files.filter(
        (f) =>
          f.fileType === 'document' &&
          (f.name.toLowerCase().includes(q) ||
            f.tags?.some((t) => t.toLowerCase().includes(q)) ||
            f.category.toLowerCase().includes(q) ||
            f.uploaderName.toLowerCase().includes(q))
      )
    : [];

  const matchedFolders = q
    ? folders.filter(
        (folder) =>
          folder.name.toLowerCase().includes(q) ||
          folder.description?.toLowerCase().includes(q)
      )
    : [];

  const matchedMembers = q
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q)
      )
    : [];

  const totalResults =
    matchedPhotos.length +
    matchedVideos.length +
    matchedDocs.length +
    matchedFolders.length +
    matchedMembers.length;

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  const handleClearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-5 h-5 text-neutral-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search photos, videos, documents, folders, members..."
            className="w-full text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={handleClearQuery}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!q ? (
            /* Recent Searches & Quick Suggestions */
            <div>
              {recentSearches.length > 0 && (
                <>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Recent Searches</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSelectRecent(term)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
                </>
              )}

              <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2.5">
                Quick Vault Views
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  onClick={() => {
                    navigate('/photos');
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  <span>All Photos</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/videos');
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors"
                >
                  <Film className="w-4 h-4 text-purple-500" />
                  <span>All Videos</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/documents');
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Documents</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/folders');
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  <span>Shared Folders</span>
                </button>
              </div>
            </div>
          ) : totalResults === 0 ? (
            /* Empty State */
            <EmptyState icon={Search} label={`No results for "${query}"`} sublabel="Try a family member's name, a folder, or a file name." />
          ) : (
            /* Categorized Results */
            <div className="space-y-5">
              {/* Photos */}
              {matchedPhotos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                      Photos ({matchedPhotos.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {matchedPhotos.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => {
                          setPreviewFile(file);
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={file.thumbnailUrl}
                            alt={file.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-[11px] text-neutral-500 truncate">
                              {formatDate(file.uploadedAt)} · by {file.uploaderName} · {formatBytes(file.size)}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {matchedVideos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-purple-500" />
                      Videos ({matchedVideos.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {matchedVideos.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => {
                          setPreviewFile(file);
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-800">
                            <img
                              src={file.thumbnailUrl}
                              alt={file.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {file.duration && (
                              <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/80 text-white px-1 rounded font-mono">
                                {file.duration}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-[11px] text-neutral-500 truncate">
                              {file.duration || 'Video'} · by {file.uploaderName} · {formatBytes(file.size)}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {matchedDocs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      Documents ({matchedDocs.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {matchedDocs.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => {
                          setPreviewFile(file);
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-[11px] text-neutral-500 truncate">
                              {file.category.toUpperCase()} · {formatBytes(file.size)} · {formatDate(file.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Folders */}
              {matchedFolders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                      Shared Folders ({matchedFolders.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {matchedFolders.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => {
                          navigate(`/folders/${folder.id}`);
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white font-bold"
                            style={{ backgroundColor: folder.color }}
                          >
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {folder.name}
                            </p>
                            <p className="text-[11px] text-neutral-500 truncate">
                              {folder.fileCount} files · Created by {folder.createdByName}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {matchedMembers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      Family Members ({matchedMembers.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {matchedMembers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => {
                          navigate('/family');
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {member.name}
                            </p>
                            <p className="text-[11px] text-neutral-500 truncate">
                              {member.email} · Role: {member.role.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
