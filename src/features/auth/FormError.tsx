import { AlertCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

export function FormError({ message }: { message: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger/8 px-3.5 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-px size-4 shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
