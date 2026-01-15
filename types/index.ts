export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide-react icon name
}

export interface FileUpload {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx';
  pages?: number;
}

export interface StatCard {
  label: string;
  value: string;
  icon: string;
  color?: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  fileName: string;
  time: string;
  status: 'completed' | 'processing' | 'failed';
}
