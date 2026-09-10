export interface ResourceFile {
  id: string;
  name: string;
  size: string; // e.g. "4.2 MB"
  fileType: 'PDF' | 'PPT' | 'DOC' | 'XLS' | 'ZIP' | 'IMAGE' | 'CODE';
  downloadUrl: string;
  uploadedAt: string; // DD/MM/YYYY
}

export interface ExternalLinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  category: 'GitHub Repository' | 'Official Documentation' | 'YouTube Reference' | 'Live Demo' | 'Article';
}

export interface LessonContentDetails {
  lessonId: string;
  lessonTitle: string;
  lessonType: 'Video' | 'PDF' | 'Text' | 'Resource';
  status: 'Published' | 'Draft';
  durationMinutes: number;
  // Video Content
  videoSourceType?: 'upload' | 'link';
  videoUrl?: string;
  videoFileName?: string;
  videoThumbnail?: string;
  videoDurationText?: string;
  // PDF Content
  pdfUrl?: string;
  pdfFileName?: string;
  pdfPageCount?: number;
  // Rich Text Content
  textContentHtml?: string;
  // Resource Library files
  resources: ResourceFile[];
  // External Reference Links
  externalLinks: ExternalLinkItem[];
}

export interface StorageUsageSummary {
  totalStorageLimitGB: number;
  totalStorageUsedGB: number;
  videosUsedGB: number;
  documentsUsedGB: number;
  resourcesUsedGB: number;
  imagesUsedGB: number;
}

export const mockStorageSummary: StorageUsageSummary = {
  totalStorageLimitGB: 50,
  totalStorageUsedGB: 14.8,
  videosUsedGB: 10.2,
  documentsUsedGB: 2.1,
  resourcesUsedGB: 1.9,
  imagesUsedGB: 0.6,
};

export const mockLessonContents: Record<string, LessonContentDetails> = {
  'les-101': {
    lessonId: 'les-101',
    lessonTitle: 'Welcome & Course Roadmap Overview',
    lessonType: 'Video',
    status: 'Published',
    durationMinutes: 15,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoThumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    videoDurationText: '14:45',
    textContentHtml: '<h3>Welcome to the Full-Stack Web Development Bootcamp!</h3><p>In this introductory lesson, we outline the roadmap, prerequisites, and learning milestones you will achieve over the next 12 modules.</p><ul><li>Setting up your developer environment</li><li>Joining the student Discord community</li><li>Accessing course source repositories</li></ul>',
    resources: [
      {
        id: 'res-1',
        name: 'Full_Stack_Bootcamp_Syllabus_2026.pdf',
        size: '2.4 MB',
        fileType: 'PDF',
        downloadUrl: '#',
        uploadedAt: '12/01/2026',
      },
      {
        id: 'res-2',
        name: 'VSCode_Recommended_Extensions.json',
        size: '18 KB',
        fileType: 'CODE',
        downloadUrl: '#',
        uploadedAt: '15/01/2026',
      },
    ],
    externalLinks: [
      {
        id: 'link-1',
        title: 'Official Course GitHub Repository',
        url: 'https://github.com/edusphere/fullstack-mern-bootcamp',
        description: 'Complete source code for all 12 modules with branch per lesson.',
        category: 'GitHub Repository',
      },
      {
        id: 'link-2',
        title: 'EduSphere Student Discord Server',
        url: 'https://discord.gg/edusphere-lms',
        description: 'Connect with 4,000+ enrolled students and course TAs.',
        category: 'Official Documentation',
      },
    ],
  },
  'les-102': {
    lessonId: 'les-102',
    lessonTitle: 'Client-Server Communication & HTTP/2 Fundamentals',
    lessonType: 'Video',
    status: 'Published',
    durationMinutes: 28,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoThumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    videoDurationText: '27:50',
    textContentHtml: '<h3>Understanding HTTP/2 and TCP Connection Reuse</h3><p>Learn how multiplexing, header compression (HPACK), and server push optimize modern web performance.</p>',
    resources: [
      {
        id: 'res-3',
        name: 'HTTP2_Multiplexing_Slides.pptx',
        size: '5.8 MB',
        fileType: 'PPT',
        downloadUrl: '#',
        uploadedAt: '18/01/2026',
      },
      {
        id: 'res-4',
        name: 'Wireshark_HTTP2_Packet_Capture.zip',
        size: '12.1 MB',
        fileType: 'ZIP',
        downloadUrl: '#',
        uploadedAt: '20/01/2026',
      },
    ],
    externalLinks: [
      {
        id: 'link-3',
        title: 'MDN Web Docs - HTTP Overview',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP',
        description: 'Authoritative guide to HTTP request and response structures.',
        category: 'Official Documentation',
      },
    ],
  },
  'les-103': {
    lessonId: 'les-103',
    lessonTitle: 'Modern JavaScript Cheatsheet & ES2024 Features',
    lessonType: 'PDF',
    status: 'Published',
    durationMinutes: 20,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfFileName: 'ES2024_Modern_JavaScript_Cheatsheet.pdf',
    pdfPageCount: 14,
    textContentHtml: '<p>Study this comprehensive PDF reference guide before proceeding to the practical Node.js exercises in Module 2.</p>',
    resources: [
      {
        id: 'res-5',
        name: 'ES2024_Code_Samples.js',
        size: '34 KB',
        fileType: 'CODE',
        downloadUrl: '#',
        uploadedAt: '22/01/2026',
      },
    ],
    externalLinks: [
      {
        id: 'link-4',
        title: 'TC39 ECMAScript Proposals Spec',
        url: 'https://tc39.es/ecma262/',
        description: 'Official standardization committee proposals.',
        category: 'Official Documentation',
      },
    ],
  },
};
