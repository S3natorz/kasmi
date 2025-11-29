// React Imports
import type { SVGAttributes } from 'react'

const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='1.3em' height='1.3em' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      {/* Modern Islamic geometric pattern - Hexagonal with inner detail */}
      {/* Outer hexagon frame */}
      <path
        d='M12 2L21 7V17L12 22L3 17V7L12 2Z'
        stroke='currentColor'
        strokeWidth='1.5'
        fill='none'
        strokeLinejoin='round'
      />
      {/* Inner diamond */}
      <path
        d='M12 6L17 12L12 18L7 12L12 6Z'
        stroke='currentColor'
        strokeWidth='1.5'
        fill='none'
        strokeLinejoin='round'
      />
      {/* Center dot */}
      <circle cx='12' cy='12' r='2' fill='currentColor' />
    </svg>
  )
}

export default Logo
