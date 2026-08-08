import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  borderClass?: string
}

export function Table({ className, borderClass, ...props }: TableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border', borderClass ?? 'border-gray-200 dark:border-gray-700')}>
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  )
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-gray-50 dark:bg-gray-800', className)} {...props} />
}

export function THeadRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('', className)} {...props} />
}

export function THeadCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
        className,
      )}
      {...props}
    />
  )
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-gray-200 dark:divide-gray-700', className)} {...props} />
}

export function TBodyRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
        '[&:nth-child(6n+1)]:bg-white [&:nth-child(6n+1)]:dark:bg-gray-900',
        '[&:nth-child(6n+2)]:bg-sky-50 [&:nth-child(6n+2)]:dark:bg-sky-950/20',
        '[&:nth-child(6n+3)]:bg-emerald-50 [&:nth-child(6n+3)]:dark:bg-emerald-950/20',
        '[&:nth-child(6n+4)]:bg-amber-50 [&:nth-child(6n+4)]:dark:bg-amber-950/20',
        '[&:nth-child(6n+5)]:bg-fuchsia-50 [&:nth-child(6n+5)]:dark:bg-fuchsia-950/20',
        '[&:nth-child(6n+6)]:bg-violet-50 [&:nth-child(6n+6)]:dark:bg-violet-950/20',
        className,
      )}
      {...props}
    />
  )
}

export function TBodyCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300', className)} {...props} />
  )
}
