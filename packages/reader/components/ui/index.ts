// shadcn/ui primitives — canonical names.
export { Button, buttonVariants } from './button';
export { Input } from './input';
export { Label } from './label';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';
export { Separator } from './separator';

// Field.tsx Input/Textarea carry the legacy label + hint + error props
// used by RegisterForm. Exported as `FieldInput`/`FieldTextarea` to
// free the canonical `Input` name for the shadcn primitive.
export { Input as FieldInput, Textarea as FieldTextarea } from './Field';

// Auror-specific primitives kept as-is (not part of the shadcn rebuild).
export { Avatar } from './Avatar';
export { Badge } from './Badge';
export { Sheet, SheetTrigger, useSheet } from './Sheet';
export { Tabs } from './Tabs';
export { Skeleton } from './Skeleton';
export { Icon, type IconName } from './Icon';

// Error surfaces — server-rendered `ErrorBanner` + client-rendered `ErrorToast`.
export { ErrorBanner, ErrorToast } from './error';