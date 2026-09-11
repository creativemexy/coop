import { cn } from '../../lib/utils'

/**
 * "Design by Kobolabs Limited" credit line.
 *
 * Used in every footer, and — on pages that have no footer — pinned to the
 * bottom of the screen/flow (the accepted best practice for legal attribution).
 * `onDark` switches to the light-on-dark palette used by dark surfaces such as
 * the landing-page footer and the login background.
 */
export function DesignCredit({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  return (
    <p className={cn('text-xs leading-relaxed', onDark ? 'text-[#E7EFE8]/70' : 'text-gray-500 dark:text-gray-400', className)}>
      Design by{' '}
      <a
        href="https://www.kobolabs.com"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'font-semibold underline underline-offset-2 transition-colors',
          onDark
            ? 'text-[#F7D674] hover:text-white'
            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
        )}
      >
        Kobolabs Limited
      </a>
    </p>
  )
}