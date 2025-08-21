import * as React from "react"
import { Formik, Form as FormikForm, Field, ErrorMessage, FormikProps } from "formik"
import * as Yup from "yup"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = ({ children, ...props }: React.ComponentProps<typeof FormikForm>) => (
  <FormikForm {...props}>
    {children}
  </FormikForm>
)

const FormField = React.forwardRef<
  HTMLDivElement,
  {
    name: string
    children: (field: any) => React.ReactNode
    className?: string
  }
>(({ name, children, className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props}>
    <Field name={name}>
      {(fieldProps: any) => children(fieldProps)}
    </Field>
  </div>
))
FormField.displayName = "FormField"

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props} />
))
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn(className)}
    {...props}
  />
))
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
  <div ref={ref} {...props} />
))
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[0.8rem] text-muted-foreground", className)}
    {...props}
  />
))
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    name?: string
  }
>(({ className, name, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[0.8rem] font-medium text-destructive", className)}
    {...props}
  >
    {name ? <ErrorMessage name={name} /> : children}
  </p>
))
FormMessage.displayName = "FormMessage"

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Formik,
  Yup
}
