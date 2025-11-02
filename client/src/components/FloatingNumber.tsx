import { useEffect, useState, useRef } from 'react'

interface FloatingNumberProps {
  value: string | number
  x: number
  y: number
  color: string
  duration?: number
  onComplete?: () => void
  critical?: boolean
  label?: string // Texto adicional arriba del número (ej: "Critical Hit!")
}

/**
 * Componente para mostrar números flotantes que se desvanecen hacia arriba
 */
export default function FloatingNumber({
  value,
  x,
  y,
  color,
  duration = 1500,
  onComplete,
  critical = false,
  label
}: FloatingNumberProps) {
  const [opacity, setOpacity] = useState(1)
  const [translateY, setTranslateY] = useState(0)
  const onCompleteRef = useRef(onComplete)
  const animationIdRef = useRef<number | null>(null)

  // Actualizar el ref del callback sin reiniciar la animación
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Iniciar la animación solo una vez cuando el componente se monta
  useEffect(() => {
    const startTime = Date.now()
    const animationDuration = duration

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / animationDuration

      if (progress >= 1) {
        setOpacity(0)
        setTranslateY(-100)
        onCompleteRef.current?.()
        if (animationIdRef.current !== null) {
          cancelAnimationFrame(animationIdRef.current)
          animationIdRef.current = null
        }
        return
      }

      // Easing: ease out
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      setOpacity(1 - progress)
      setTranslateY(-80 * easeOut)

      animationIdRef.current = requestAnimationFrame(animate)
    }

    animationIdRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar

  const fontSize = critical ? '48px' : '36px'
  const fontWeight = critical ? '900' : '700'
  const textShadow = critical 
    ? '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor, 2px 2px 4px rgba(0,0,0,0.8)'
    : '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)'

  const labelFontSize = '20px'
  const labelTranslateY = label ? -30 : 0 // Ajustar posición del número si hay label

  return (
    <div
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%) translateY(${translateY}px)`,
        opacity,
        pointerEvents: 'none',
        zIndex: 10000,
        transition: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
        willChange: 'transform, opacity'
      }}
    >
      {label && (
        <div
          style={{
            color: '#ffd700',
            fontSize: labelFontSize,
            fontWeight: '700',
            fontFamily: "'Press Start 2P', monospace",
            textShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6), 2px 2px 4px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
            transform: `translateY(${labelTranslateY}px)`
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          color,
          fontSize,
          fontWeight,
          fontFamily: "'Press Start 2P', monospace",
          textShadow,
          whiteSpace: 'nowrap',
          transform: label ? `translateY(${labelTranslateY}px)` : 'none'
        }}
      >
        {value}
      </div>
    </div>
  )
}

