import type { ElementType, ReactNode, CSSProperties } from 'react'
import useInView from '../hooks/useInView'

interface RevealProps {
  /** Element to render as. Defaults to <div>. */
  as?: ElementType
  /** Milliseconds to delay the fade-in. */
  delay?: number
  className?: string
  children?: ReactNode
  [key: string]: unknown
}

export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
  ...rest
}: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>()
  const style: CSSProperties | undefined = delay
    ? { transitionDelay: `${delay}ms` }
    : undefined
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  )
}
