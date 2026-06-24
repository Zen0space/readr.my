'use client';

import { useState } from 'react';
import { Button, Icon } from '@/components/ui';
import { CookiePreferencesModal } from './CookiePreferencesModal';

/**
 * Trigger + modal pair for the cookies page.
 *
 * Server components can't pass function-as-children to client
 * components, so the trigger is wrapped in its own client boundary
 * that owns the open state and renders both the button and the
 * controlled `CookiePreferencesModal` together.
 */
export const CookiePreferencesButton = (): React.ReactElement => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="default"
        className="gap-2 shadow-primary-glow"
      >
        <Icon name="settings" size={16} />
        Manage cookie preferences
      </Button>
      <CookiePreferencesModal open={open} onOpenChange={setOpen} />
    </>
  );
};
