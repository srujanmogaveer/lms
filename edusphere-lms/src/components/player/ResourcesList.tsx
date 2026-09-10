import React from 'react';
import {
  FiDownload,
  FiFileText,
  FiFolder,
  FiCode,
  FiFile,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { PlayerResource } from '../../types';

interface ResourcesListProps {
  resources?: PlayerResource[];
}

export const ResourcesList: React.FC<ResourcesListProps> = ({ resources = [] }) => {
  const getFileIcon = (fileType: PlayerResource['fileType']) => {
    switch (fileType) {
      case 'pdf':
        return <FiFileText className="w-6 h-6 text-red-500" />;
      case 'zip':
        return <FiFolder className="w-6 h-6 text-amber-500" />;
      case 'code':
        return <FiCode className="w-6 h-6 text-emerald-500" />;
      case 'ppt':
        return <FiFile className="w-6 h-6 text-purple-500" />;
      default:
        return <FiFile className="w-6 h-6 text-brand-500" />;
    }
  };

  const handleDownload = (resource: PlayerResource) => {
    if (resource.downloadUrl && resource.downloadUrl !== '#') {
      window.open(resource.downloadUrl, '_blank');
    } else {
      alert(`Downloading "${resource.title}" (${resource.fileSize})`);
    }
  };

  if (resources.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center space-y-3">
        <FiFolder className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">No Attachments for this Lesson</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          All required notes and code for this lesson are included in the video or text reading tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Downloadable Lesson Attachments
          </h2>
          <p className="text-xs text-slate-500">
            Access exercise starter projects, slides, and cheat sheets.
          </p>
        </div>
        <Badge variant="primary">{resources.length} Files Available</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((resource) => (
          <Card
            key={resource.id}
            hoverEffect
            className="p-5 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {getFileIcon(resource.fileType)}
              </div>

              <div className="space-y-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                  {resource.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="uppercase font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {resource.fileType}
                  </span>
                  <span>•</span>
                  <span>{resource.fileSize}</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(resource)}
              className="shrink-0 flex items-center gap-1.5 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 hover:border-brand-300"
              aria-label={`Download ${resource.title}`}
            >
              <FiDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
