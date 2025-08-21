import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Custom variant utility to replace class-variance-authority
export function cva(base: string, config?: {
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
}) {
  return (props?: Record<string, any>) => {
    let classes = [base]
    
    if (config?.variants && props) {
      Object.keys(config.variants).forEach(key => {
        const value = props[key]
        if (value && config.variants![key][value]) {
          classes.push(config.variants![key][value])
        } else if (config.defaultVariants?.[key] && config.variants![key][config.defaultVariants[key]]) {
          classes.push(config.variants![key][config.defaultVariants[key]])
        }
      })
    }
    
    return cn(classes)
  }
}

export type VariantProps<T extends (...args: any) => any> = Parameters<T>[0]
