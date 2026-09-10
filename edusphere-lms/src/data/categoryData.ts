export interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  coursesCount: number;
  status: 'Active' | 'Inactive';
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  status: 'Active' | 'Inactive';
  totalCourses: number;
  createdAt: string; // DD/MM/YYYY
  updatedAt: string; // DD/MM/YYYY
  subcategories: SubcategoryItem[];
}

export const mockCategoriesList: CategoryItem[] = [
  {
    id: 'cat-101',
    name: 'Web Development',
    slug: 'web-development',
    description: 'Master modern frontend and backend web development using React, Next.js, Node.js, Express, and MongoDB.',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    status: 'Active',
    totalCourses: 14,
    createdAt: '10/01/2024',
    updatedAt: '01/08/2026',
    subcategories: [
      { id: 'sub-1', name: 'React & Next.js', slug: 'react-nextjs', description: 'Modern UI frameworks and App Router architecture.', coursesCount: 6, status: 'Active' },
      { id: 'sub-2', name: 'Node.js Backend', slug: 'nodejs-backend', description: 'REST APIs, Express.js, and server-side JavaScript.', coursesCount: 4, status: 'Active' },
      { id: 'sub-3', name: 'Full Stack Development', slug: 'full-stack', description: 'MERN stack and end-to-end web architectures.', coursesCount: 3, status: 'Active' },
      { id: 'sub-4', name: 'Frontend Design', slug: 'frontend-design', description: 'HTML5, CSS3, Tailwind CSS, and Web Vitals.', coursesCount: 1, status: 'Active' },
    ]
  },
  {
    id: 'cat-102',
    name: 'Data Science & AI',
    slug: 'data-science-ai',
    description: 'Learn Python, machine learning models, RAG pipelines, LLM fine-tuning, vector databases, and neural networks.',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80',
    status: 'Active',
    totalCourses: 18,
    createdAt: '15/01/2024',
    updatedAt: '03/08/2026',
    subcategories: [
      { id: 'sub-5', name: 'Machine Learning', slug: 'machine-learning', description: 'Supervised and unsupervised learning with scikit-learn.', coursesCount: 7, status: 'Active' },
      { id: 'sub-6', name: 'Python for Data Analysis', slug: 'python-data-analysis', description: 'Pandas, NumPy, and Data Visualization with Seaborn.', coursesCount: 5, status: 'Active' },
      { id: 'sub-7', name: 'Deep Learning & LLMs', slug: 'deep-learning-llms', description: 'PyTorch, Transformers, LangChain, and OpenAI APIs.', coursesCount: 4, status: 'Active' },
      { id: 'sub-8', name: 'Computer Vision', slug: 'computer-vision', description: 'OpenCV and YOLO object detection models.', coursesCount: 2, status: 'Active' },
    ]
  },
  {
    id: 'cat-103',
    name: 'Mobile App Development',
    slug: 'mobile-app-development',
    description: 'Build native and cross-platform mobile apps for iOS and Android using Flutter, Dart, React Native, and Swift.',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
    status: 'Active',
    totalCourses: 9,
    createdAt: '01/02/2024',
    updatedAt: '25/07/2026',
    subcategories: [
      { id: 'sub-9', name: 'Flutter & Dart', slug: 'flutter-dart', description: 'Multi-platform UI building with BLoC pattern.', coursesCount: 4, status: 'Active' },
      { id: 'sub-10', name: 'React Native', slug: 'react-native', description: 'Cross-platform mobile apps using React hooks.', coursesCount: 3, status: 'Active' },
      { id: 'sub-11', name: 'Android Dev (Kotlin)', slug: 'android-kotlin', description: 'Jetpack Compose and Android SDK.', coursesCount: 1, status: 'Active' },
      { id: 'sub-12', name: 'iOS Dev (Swift)', slug: 'ios-swift', description: 'SwiftUI and Apple Xcode development.', coursesCount: 1, status: 'Active' },
    ]
  },
  {
    id: 'cat-104',
    name: 'Cloud & DevOps',
    slug: 'cloud-devops',
    description: 'Architect scalable cloud infrastructure on AWS, Azure, GCP with Docker containerization, Kubernetes, and Terraform.',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    status: 'Active',
    totalCourses: 12,
    createdAt: '20/02/2024',
    updatedAt: '28/07/2026',
    subcategories: [
      { id: 'sub-13', name: 'AWS Solutions Architecture', slug: 'aws-architecture', description: 'EC2, S3, VPC, IAM, and Lambda serverless.', coursesCount: 5, status: 'Active' },
      { id: 'sub-14', name: 'Docker & Kubernetes', slug: 'docker-kubernetes', description: 'Container orchestration and Helm deployments.', coursesCount: 4, status: 'Active' },
      { id: 'sub-15', name: 'CI/CD Pipelines', slug: 'cicd-pipelines', description: 'GitHub Actions, GitLab CI, and Jenkins automation.', coursesCount: 3, status: 'Active' },
    ]
  },
  {
    id: 'cat-105',
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Offensive and defensive security training covering Ethical Hacking, OWASP Top 10, Penetration Testing, and SOC Operations.',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    status: 'Active',
    totalCourses: 7,
    createdAt: '15/03/2024',
    updatedAt: '12/06/2026',
    subcategories: [
      { id: 'sub-16', name: 'Ethical Hacking', slug: 'ethical-hacking', description: 'Kali Linux, Metasploit, and network penetration.', coursesCount: 3, status: 'Active' },
      { id: 'sub-17', name: 'Network Security', slug: 'network-security', description: 'Wireshark packet analysis and firewall rules.', coursesCount: 2, status: 'Active' },
      { id: 'sub-18', name: 'Application Security', slug: 'app-security', description: 'Code auditing, SQL injection, and XSS prevention.', coursesCount: 2, status: 'Active' },
    ]
  },
  {
    id: 'cat-106',
    name: 'UI/UX & Product Design',
    slug: 'ui-ux-product-design',
    description: 'Design beautiful user interfaces, interactive wireframes, Figma design systems, micro-interactions, and conduct user research.',
    imageUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
    status: 'Active',
    totalCourses: 8,
    createdAt: '01/04/2024',
    updatedAt: '19/07/2026',
    subcategories: [
      { id: 'sub-19', name: 'Figma Mastery', slug: 'figma-mastery', description: 'Auto-layout 5.0, variants, and interactive components.', coursesCount: 4, status: 'Active' },
      { id: 'sub-20', name: 'Design Systems', slug: 'design-systems', description: 'Tokens, typography scales, and accessibility WCAG.', coursesCount: 2, status: 'Active' },
      { id: 'sub-21', name: 'User Research & Wireframing', slug: 'user-research', description: 'Usability testing and journey mapping.', coursesCount: 2, status: 'Active' },
    ]
  },
  {
    id: 'cat-107',
    name: 'Business & Management',
    slug: 'business-management',
    description: 'Learn Agile project management, product roadmap strategy, digital marketing analytics, and financial modeling.',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    status: 'Active',
    totalCourses: 5,
    createdAt: '10/05/2024',
    updatedAt: '02/08/2026',
    subcategories: [
      { id: 'sub-22', name: 'Agile & Scrum', slug: 'agile-scrum', description: 'Sprint planning and Scrum Master workflows.', coursesCount: 2, status: 'Active' },
      { id: 'sub-23', name: 'Product Management', slug: 'product-management', description: 'PRDs, backlog prioritization, and metrics.', coursesCount: 2, status: 'Active' },
      { id: 'sub-24', name: 'Digital Marketing', slug: 'digital-marketing', description: 'SEO, Google Ads, and content marketing.', coursesCount: 1, status: 'Active' },
    ]
  },
  {
    id: 'cat-108',
    name: 'Legacy Web 1.0 Tools',
    slug: 'legacy-web-10-tools',
    description: 'Deprecated legacy web technology stack courses kept for archival reference purposes.',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    status: 'Inactive',
    totalCourses: 0,
    createdAt: '01/01/2023',
    updatedAt: '15/01/2025',
    subcategories: [
      { id: 'sub-25', name: 'Adobe Flash Player 8', slug: 'adobe-flash-8', description: 'ActionScript 2.0 animation scripts.', coursesCount: 0, status: 'Inactive' },
      { id: 'sub-26', name: 'Microsoft Silverlight', slug: 'silverlight-basics', description: 'XAML media player applets.', coursesCount: 0, status: 'Inactive' },
    ]
  }
];
