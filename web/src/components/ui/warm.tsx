import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export const inputCls =
  'block w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm text-[#2C1B13] placeholder-[#C9B89F] outline-none transition focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label className={cn('mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]', className)}>
      {children}
    </label>
  )
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  padded = true,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  padded?: boolean
}) {
  const hasHeader = Boolean(title || subtitle || actions)
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm', className)}>
      {hasHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE2D3] px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-black tracking-[-0.02em] text-[#2C1B13]">{title}</h2>}
            {subtitle && <p className="text-xs text-[#6B5245]">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(padded && 'p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function StatCard({
  icon,
  iconCls = 'bg-[#176B5B]/10 text-[#176B5B]',
  label,
  value,
  sub,
  valueCls,
  bar,
}: {
  icon?: ReactNode
  iconCls?: string
  label: string
  value: ReactNode
  sub?: ReactNode
  valueCls?: string
  bar?: { pct: number; start: string; end: string }
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {icon && <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconCls)}>{icon}</div>}
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">{label}</p>
      </div>
      <p className={cn('mt-3 break-words text-2xl font-black tracking-[-0.02em] text-[#2C1B13]', valueCls)}>{value}</p>
      {sub && <div className="mt-1 text-sm text-[#6B5245]">{sub}</div>}
      {bar && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F0DDAD]/60">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${bar.pct}%`, background: `linear-gradient(90deg, ${bar.start}, ${bar.end})` }}
          />
        </div>
      )}
    </div>
  )
}

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info'

const TONES: Record<Tone, string> = {
  default: 'bg-[#EDE2D3] text-[#6B5245]',
  success: 'bg-[#176B5B]/10 text-[#176B5B]',
  warning: 'bg-[#E4A42A]/15 text-[#8A5A00]',
  danger: 'bg-[#B3261E]/10 text-[#B3261E]',
  info: 'bg-[#9D4824]/10 text-[#9D4824]',
}

const DOTS: Record<Tone, string> = {
  default: 'bg-[#C9B89F]',
  success: 'bg-[#176B5B]',
  warning: 'bg-[#E4A42A]',
  danger: 'bg-[#B3261E]',
  info: 'bg-[#9D4824]',
}

export function Badge({
  variant = 'default',
  dot = false,
  className,
  children,
}: {
  variant?: Tone
  dot?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
        TONES[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOTS[variant])} />}
      {children}
    </span>
  )
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const BTN_VARIANTS = {
  primary: 'bg-[#176B5B] text-[#FFF9EF] shadow-sm hover:bg-[#0F5A4B]',
  secondary: 'border border-[#E7DCCB] bg-white text-[#6B5245] hover:bg-[#FFF9EF] hover:text-[#2C1B13]',
  ghost: 'text-[#6B5245] hover:bg-[#EDE2D3] hover:text-[#23150F]',
  danger: 'bg-[#B3261E] text-white hover:bg-[#9A2019]',
}

const BTN_SIZES = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Btn({ variant = 'primary', size = 'md', className, type = 'button', ...props }: BtnProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        className,
      )}
      {...props}
    />
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function TextInput({ label, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <input id={id} className={cn(inputCls, className)} {...props} />
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, className, children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <select className={cn(inputCls, 'cursor-pointer pr-8', className)} {...props}>
        {children}
      </select>
    </div>
  )
}

export function Table({ className, ...props }: { className?: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  )
}

export function THead({ className, ...props }: { className?: string; children: ReactNode }) {
  return <thead className={cn('bg-[#FFF9EF]', className)} {...props} />
}

export function THeadRow({ className, ...props }: { className?: string; children: ReactNode }) {
  return <tr className={className} {...props} />
}

export function THeadCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'border-b border-[#EDE2D3] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#B79B6B]',
        className,
      )}
      {...props}
    />
  )
}

export function TBody({ className, ...props }: { className?: string; children: ReactNode }) {
  return <tbody className={cn('divide-y divide-[#EDE2D3]', className)} {...props} />
}

export function TBodyRow({ className, ...props }: { className?: string; children: ReactNode }) {
  return <tr className={cn('transition-colors hover:bg-[#FFF9EF]/60', className)} {...props} />
}

export function TBodyCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('whitespace-nowrap px-4 py-3 text-[#6B5245]', className)} {...props} />
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-[#C9B89F]">
        {children}
      </td>
    </tr>
  )
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[]
  active: T
  onChange: (key: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-full border border-[#E7DCCB] bg-white p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer',
            active === t.key ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm' : 'text-[#6B5245] hover:bg-[#FFF9EF] hover:text-[#2C1B13]',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#23150F]/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-xl', className)}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6B5245] transition-colors hover:bg-[#EDE2D3] hover:text-[#23150F] cursor-pointer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
