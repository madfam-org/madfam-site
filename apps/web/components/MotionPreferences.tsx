'use client';

import { MotionConfig } from 'framer-motion';

/**
 * framer-motion animations (menus, the cookie notice) follow the visitor's
 * "reduce motion" setting: transform and layout animations are skipped,
 * opacity changes still run.
 */
export function MotionPreferences({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
