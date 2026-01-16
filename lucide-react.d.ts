/**
 * Type declarations for lucide-react deep imports
 * This enables tree-shaking while maintaining type safety
 */
declare module 'lucide-react/dist/esm/icons/*' {
  import { LucideIcon } from 'lucide-react'
  const icon: LucideIcon
  export default icon
}
