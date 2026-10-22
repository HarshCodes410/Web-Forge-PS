import { Rocket, UploadCloud, Workflow, Layers, FileText, type LucideIcon } from 'lucide-react'

export type NavItem = { id: string; label: string; icon: LucideIcon }

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Rocket },
  { id: 'workstation', label: 'Segmentation Lab', icon: UploadCloud },
  { id: 'pipeline', label: 'Pipeline', icon: Workflow },
  { id: 'model', label: 'Model Details', icon: Layers },
  { id: 'integration', label: 'API Integration', icon: FileText },
]
