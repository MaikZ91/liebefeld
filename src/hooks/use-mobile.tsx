
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Definiere die Funktion zur Überprüfung der Bildschirmgröße
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Initialer Check
    checkIfMobile()
    
    // Event Listener für Größenänderungen
    window.addEventListener("resize", checkIfMobile)
    
    // Bereinigen
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return isMobile
}

// Exportiere auch den Breakpoint für konsistente Verwendung an anderen Stellen
export const MOBILE_BREAKPOINT_PX = MOBILE_BREAKPOINT
