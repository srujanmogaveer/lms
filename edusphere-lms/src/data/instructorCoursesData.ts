export type CourseStatusType = 'Draft' | 'Published' | 'Archived';
export type ApprovalStatusType = 'Pending Approval' | 'Approved' | 'Rejected' | 'Archived';
export type CourseDifficultyType = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type CourseLanguageType = 'English' | 'Hindi' | 'Kannada' | 'Tamil' | 'Telugu' | 'Bengali' | 'Marathi';
export type CoursePriceType = 'Free' | 'Paid' | 'Discounted';

export interface InstructorCourseItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  subcategory: string;
  difficulty: CourseDifficultyType;
  language: CourseLanguageType;
  thumbnail: string;
  promoVideoUrl?: string;
  price: number; // in INR ₹
  discountPrice?: number; // in INR ₹
  priceType: CoursePriceType;
  studentsEnrolled: number;
  rating: number;
  reviewsCount: number;
  courseStatus: CourseStatusType;
  approvalStatus: ApprovalStatusType;
  rejectionReason?: string;
  createdAt: string; // DD/MM/YYYY
  updatedAt: string; // DD/MM/YYYY
  tags: string[];
  requirements: string[];
  learningOutcomes: string[];
  durationHours: number;
  lessonsCount: number;
  assignmentsCount: number;
  quizzesCount: number;
}

export const mockCourseCategories = [
  { id: 'cat-1', name: 'Web Development', subcategories: ['React & Next.js', 'Node.js Backend', 'Full Stack Development', 'Frontend Design'] },
  { id: 'cat-2', name: 'Data Science & AI', subcategories: ['Machine Learning', 'Python for Data Analysis', 'Deep Learning & LLMs', 'Computer Vision'] },
  { id: 'cat-3', name: 'Mobile App Development', subcategories: ['Flutter & Dart', 'React Native', 'Android Dev (Kotlin)', 'iOS Dev (Swift)'] },
  { id: 'cat-4', name: 'Cloud & DevOps', subcategories: ['AWS Solutions Architecture', 'Docker & Kubernetes', 'CI/CD Pipelines', 'Azure Fundamentals'] },
  { id: 'cat-5', name: 'Cybersecurity', subcategories: ['Ethical Hacking', 'Network Security', 'Application Security', 'SOC Analyst'] },
  { id: 'cat-6', name: 'UI/UX & Product Design', subcategories: ['Figma Mastery', 'Design Systems', 'User Research & Wireframing', 'Prototyping'] },
  { id: 'cat-7', name: 'Business & Management', subcategories: ['Agile & Scrum', 'Product Management', 'Digital Marketing', 'Financial Modeling'] },
];

export const mockInstructorCoursesList: InstructorCourseItem[] = [
  {
    id: 'course-101',
    title: 'Full-Stack Web Development Bootcamp (MERN & Next.js 14)',
    slug: 'full-stack-web-development-bootcamp-mern-nextjs',
    shortDescription: 'Master modern full-stack web applications from ground up using MongoDB, Express, React 18, Node.js, and Next.js App Router.',
    fullDescription: 'Become a job-ready full-stack developer with hands-on real-world projects tailored for the tech industry in India and globally. Learn REST APIs, GraphQL, Authentication, State Management with Redux Toolkit, Deployment on Vercel and AWS, and Performance Optimization.',
    category: 'Web Development',
    subcategory: 'Full Stack Development',
    difficulty: 'All Levels',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    promoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    price: 4999,
    discountPrice: 1499,
    priceType: 'Discounted',
    studentsEnrolled: 4280,
    rating: 4.9,
    reviewsCount: 612,
    courseStatus: 'Published',
    approvalStatus: 'Approved',
    createdAt: '12/01/2025',
    updatedAt: '28/07/2026',
    tags: ['React', 'Next.js', 'Node.js', 'MongoDB', 'TypeScript', 'Tailwind CSS'],
    requirements: [
      'Basic HTML, CSS, and fundamental JavaScript concepts.',
      'A working laptop or desktop running Windows, macOS, or Linux.',
      'Curiosity and commitment to learn coding through building real projects.'
    ],
    learningOutcomes: [
      'Build full-stack production ready web applications with React 18 and Next.js 14.',
      'Design robust RESTful APIs & GraphQL backend endpoints with Node.js & Express.',
      'Implement Secure JWT Authentication, OAuth2 login, and role-based permissions.',
      'Deploy applications to Vercel, AWS S3, and Cloudflare with CI/CD integration.'
    ],
    durationHours: 68,
    lessonsCount: 142,
    assignmentsCount: 12,
    quizzesCount: 8,
  },
  {
    id: 'course-102',
    title: 'Advanced React Architecture, Micro-frontends & Performance',
    slug: 'advanced-react-architecture-micro-frontends-performance',
    shortDescription: 'Deep dive into modern enterprise React architecture, Module Federation, custom hooks design patterns, and Web Vitals optimization.',
    fullDescription: 'Designed for experienced frontend engineers looking to step up into Lead Software Architect roles. Master state machine architectures with XState, complex caching with TanStack Query v5, and zero-bundle-size micro-frontends.',
    category: 'Web Development',
    subcategory: 'React & Next.js',
    difficulty: 'Advanced',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
    promoVideoUrl: '',
    price: 6999,
    discountPrice: 2499,
    priceType: 'Discounted',
    studentsEnrolled: 1850,
    rating: 4.8,
    reviewsCount: 240,
    courseStatus: 'Published',
    approvalStatus: 'Approved',
    createdAt: '15/03/2025',
    updatedAt: '01/08/2026',
    tags: ['React', 'Architecture', 'Webpack', 'Performance', 'TypeScript'],
    requirements: [
      'At least 2 years of experience writing production React code.',
      'Solid understanding of JavaScript Event Loop, Closures, and Async programming.'
    ],
    learningOutcomes: [
      'Architect enterprise micro-frontends using Module Federation.',
      'Optimize Core Web Vitals to achieve 95+ score on Google Lighthouse.',
      'Master advanced design patterns: Render Props, Compound Components, Control Props.'
    ],
    durationHours: 42,
    lessonsCount: 86,
    assignmentsCount: 8,
    quizzesCount: 6,
  },
  {
    id: 'course-103',
    title: 'Generative AI & LLM Engineering with Python & LangChain',
    slug: 'generative-ai-llm-engineering-python-langchain',
    shortDescription: 'Build production RAG pipelines, AI Agents, fine-tune open source models (Llama 3), and deploy vector databases like Pinecone & Chroma.',
    fullDescription: 'Comprehensive guide to building enterprise GenAI applications in Python. Learn RAG architectures, hybrid vector search, Guardrails AI, prompt engineering, and deploying autonomous AI agents.',
    category: 'Data Science & AI',
    subcategory: 'Deep Learning & LLMs',
    difficulty: 'Intermediate',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80',
    promoVideoUrl: '',
    price: 8999,
    discountPrice: 3499,
    priceType: 'Discounted',
    studentsEnrolled: 920,
    rating: 4.95,
    reviewsCount: 184,
    courseStatus: 'Published',
    approvalStatus: 'Approved',
    createdAt: '01/11/2025',
    updatedAt: '02/08/2026',
    tags: ['GenAI', 'LLM', 'Python', 'LangChain', 'RAG', 'VectorDB'],
    requirements: [
      'Intermediate Python programming experience.',
      'Basic familiarity with REST APIs and JSON data handling.'
    ],
    learningOutcomes: [
      'Design end-to-end Retrieval Augmented Generation (RAG) systems.',
      'Implement autonomous AI agents using LangGraph and AutoGen.',
      'Fine-tune open-source models using QLoRA and Hugging Face Transformers.'
    ],
    durationHours: 54,
    lessonsCount: 98,
    assignmentsCount: 10,
    quizzesCount: 7,
  },
  {
    id: 'course-104',
    title: 'Flutter 3.x & Dart Multi-platform Mobile Development (Hindi)',
    slug: 'flutter-3-dart-mobile-development-hindi',
    shortDescription: 'Complete mobile app developer course in Hindi. Build stunning iOS & Android apps with Clean Architecture & BLoC state management.',
    fullDescription: 'Seekho Hindi me step-by-step Flutter and Dart programming. Is course me hum 6 real-world apps banayenge including E-commerce app, Food Delivery app, aur Live Chat app with Firebase.',
    category: 'Mobile App Development',
    subcategory: 'Flutter & Dart',
    difficulty: 'Beginner',
    language: 'Hindi',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
    promoVideoUrl: '',
    price: 3499,
    discountPrice: 999,
    priceType: 'Discounted',
    studentsEnrolled: 0,
    rating: 0,
    reviewsCount: 0,
    courseStatus: 'Draft',
    approvalStatus: 'Pending Approval',
    createdAt: '18/07/2026',
    updatedAt: '03/08/2026',
    tags: ['Flutter', 'Dart', 'Hindi', 'Android', 'iOS', 'Firebase'],
    requirements: [
      'Koi pehle coding experience ki zaroorat nahi hai.',
      'Computer with 8GB RAM minimum for running Android Emulator.'
    ],
    learningOutcomes: [
      'Android aur iOS apps single codebase se release karna seekhen.',
      'BLoC & Riverpod pattern se state manage karna seekhen.',
      'Google Play Store aur Apple App Store par apps publish karein.'
    ],
    durationHours: 48,
    lessonsCount: 110,
    assignmentsCount: 6,
    quizzesCount: 5,
  },
  {
    id: 'course-105',
    title: 'AWS Certified Solutions Architect Associate (SAA-C03) Mastery',
    slug: 'aws-certified-solutions-architect-associate-mastery',
    shortDescription: 'Prepare and pass the AWS SAA-C03 exam with hands-on labs on EC2, S3, VPC, Serverless Lambda, DynamoDB, and CloudFormation.',
    fullDescription: 'Comprehensive hands-on training to get AWS Solutions Architect certified. Includes 400+ real practice test questions, architecture diagrams, cost optimization strategies, and exam breakdown.',
    category: 'Cloud & DevOps',
    subcategory: 'AWS Solutions Architecture',
    difficulty: 'Intermediate',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    promoVideoUrl: '',
    price: 5999,
    discountPrice: 1999,
    priceType: 'Discounted',
    studentsEnrolled: 0,
    rating: 0,
    reviewsCount: 0,
    courseStatus: 'Draft',
    approvalStatus: 'Pending Approval',
    createdAt: '25/07/2026',
    updatedAt: '02/08/2026',
    tags: ['AWS', 'Cloud', 'DevOps', 'Certification', 'SAA-C03'],
    requirements: [
      'Basic networking concepts (IP addresses, Subnets, DNS).',
      'Free Tier AWS Account for hands-on practice.'
    ],
    learningOutcomes: [
      'Pass the AWS Certified Solutions Architect Associate exam on first attempt.',
      'Design resilient, highly available, and cost-effective cloud architectures.',
      'Configure VPCs, Subnets, Internet Gateways, Security Groups, and IAM roles.'
    ],
    durationHours: 38,
    lessonsCount: 75,
    assignmentsCount: 5,
    quizzesCount: 10,
  },
  {
    id: 'course-106',
    title: 'Ethical Hacking & Penetration Testing Masterclass (2026 Edition)',
    slug: 'ethical-hacking-penetration-testing-masterclass',
    shortDescription: 'Learn network security, Metasploit, Kali Linux, Web Application vulnerability assessment, OWASP Top 10, and Bug Bounty hunting.',
    fullDescription: 'Step into cybersecurity with ethical hacking. Learn offensive security techniques legally in sandbox environments. Practical labs covering Wireshark analysis, Burp Suite Pro, SQL Injection, XSS, and privilege escalation.',
    category: 'Cybersecurity',
    subcategory: 'Ethical Hacking',
    difficulty: 'All Levels',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    promoVideoUrl: '',
    price: 4499,
    discountPrice: 1299,
    priceType: 'Discounted',
    studentsEnrolled: 0,
    rating: 0,
    reviewsCount: 0,
    courseStatus: 'Draft',
    approvalStatus: 'Rejected',
    rejectionReason: 'Video audio quality does not meet EduSphere publishing standards. Section 3 requires clearer accent transcriptions and updated Kali Linux ISO commands.',
    createdAt: '10/06/2026',
    updatedAt: '20/06/2026',
    tags: ['Cybersecurity', 'Kali Linux', 'Burp Suite', 'OWASP', 'Penetration Testing'],
    requirements: [
      'Basic operating system knowledge (Windows/Linux).',
      'High ethics and compliance with cybersecurity laws.'
    ],
    learningOutcomes: [
      'Identify and remediate OWASP Top 10 web application vulnerabilities.',
      'Execute professional penetration tests and write compliance audit reports.',
      'Perform wireless network security analysis and packet sniffing with Wireshark.'
    ],
    durationHours: 50,
    lessonsCount: 92,
    assignmentsCount: 8,
    quizzesCount: 6,
  },
  {
    id: 'course-107',
    title: 'UI/UX Design Systems in Figma & UX Research Methodology',
    slug: 'ui-ux-design-systems-figma-ux-research-methodology',
    shortDescription: 'Build scalable design systems in Figma using Auto-Layout 5.0, variables, dark mode tokens, and conduct user testing interviews.',
    fullDescription: 'Transform from a visual designer into a Product Designer. Master wireframing, interactive prototyping, design tokens, responsive layout grids, micro-interactions, and accessibility standards (WCAG 2.1 AA).',
    category: 'UI/UX & Product Design',
    subcategory: 'Design Systems',
    difficulty: 'Intermediate',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
    promoVideoUrl: '',
    price: 3999,
    discountPrice: 1199,
    priceType: 'Discounted',
    studentsEnrolled: 310,
    rating: 4.7,
    reviewsCount: 45,
    courseStatus: 'Archived',
    approvalStatus: 'Approved',
    createdAt: '05/01/2024',
    updatedAt: '12/12/2025',
    tags: ['Figma', 'UI Design', 'UX Research', 'Design Systems', 'Prototyping'],
    requirements: [
      'Free Figma account.',
      'Passion for visual aesthetics and human-centered design.'
    ],
    learningOutcomes: [
      'Create enterprise-grade Figma design systems with components and variants.',
      'Conduct user interviews and synthesize research into actionable personas & journeys.',
      'Hand off design assets seamlessly to frontend developers with token specs.'
    ],
    durationHours: 30,
    lessonsCount: 60,
    assignmentsCount: 4,
    quizzesCount: 4,
  },
  {
    id: 'course-108',
    title: 'Free Intro to Programming with Python & Problem Solving',
    slug: 'free-intro-to-programming-python-problem-solving',
    shortDescription: 'Completely free course for total beginners in India looking to start their coding journey with simple Python scripts.',
    fullDescription: 'Start coding today without paying anything! Learn variables, loops, functions, lists, dictionaries, and simple algorithmic problem solving with exercises.',
    category: 'Data Science & AI',
    subcategory: 'Python for Data Analysis',
    difficulty: 'Beginner',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80',
    promoVideoUrl: '',
    price: 0,
    discountPrice: 0,
    priceType: 'Free',
    studentsEnrolled: 0,
    rating: 0,
    reviewsCount: 0,
    courseStatus: 'Draft',
    approvalStatus: 'Pending Approval',
    createdAt: '01/08/2026',
    updatedAt: '04/08/2026',
    tags: ['Python', 'Beginner', 'Free', 'Programming', 'Algorithms'],
    requirements: [
      'No prior programming knowledge required.',
      'Any computer capable of opening a web browser.'
    ],
    learningOutcomes: [
      'Write clean Python code to solve daily math and logic problems.',
      'Understand core programming primitives: Variables, Loops, Conditionals, Functions.'
    ],
    durationHours: 12,
    lessonsCount: 24,
    assignmentsCount: 3,
    quizzesCount: 2,
  }
];
