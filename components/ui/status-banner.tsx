import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusBannerProps {
  type: "error" | "warning" | "success" | "info"
  title?: string
  message: string
  className?: string
  onClose?: () => void
}

const bannerConfig = {
  error: {
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-600",
    titleColor: "text-red-800",
    messageColor: "text-red-700",
    icon: XCircle
  },
  warning: {
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconColor: "text-amber-600",
    titleColor: "text-amber-800",
    messageColor: "text-amber-700",
    icon: AlertTriangle
  },
  success: {
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600",
    titleColor: "text-green-800",
    messageColor: "text-green-700",
    icon: CheckCircle
  },
  info: {
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600",
    titleColor: "text-blue-800",
    messageColor: "text-blue-700",
    icon: Info
  }
}

export function StatusBanner({ 
  type, 
  title, 
  message, 
  className = "",
  onClose
}: StatusBannerProps) {
  const config = bannerConfig[type]
  const Icon = config.icon

  return (
    <div className={cn(
      `${config.bgColor} ${config.borderColor} rounded-lg p-2`,
      className
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 flex-shrink-0", config.iconColor)} />
        <div className="flex-1 min-w-0">
          {title && (
            <span className={cn("font-medium text-sm", config.titleColor)}>{title}: </span>
          )}
          <span className={cn("text-sm", config.messageColor)}>{message}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close banner"
            className={cn("ml-2 p-1 rounded hover:bg-black/5", config.iconColor)}
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Convenience components for common use cases
export function ErrorBanner({ message, title = "Error", ...props }: Omit<StatusBannerProps, "type">) {
  return <StatusBanner type="error" title={title} message={message} {...props} />
}

export function WarningBanner({ message, title, ...props }: Omit<StatusBannerProps, "type">) {
  return <StatusBanner type="warning" message={message} {...props} />
}

export function SuccessBanner({ message, title = "Success", ...props }: Omit<StatusBannerProps, "type">) {
  return <StatusBanner type="success" title={title} message={message} {...props} />
}

export function InfoBanner({ message, title = "Info", ...props }: Omit<StatusBannerProps, "type">) {
  return <StatusBanner type="info" title={title} message={message} {...props} />
}

// Keep the original DisabledBanner for backward compatibility
export function DisabledBanner({ 
  message = "This page has been temporarily disabled",
  className = ""
}: { message?: string; className?: string }) {
  return <StatusBanner type="warning" message={message} className={className} />
}
