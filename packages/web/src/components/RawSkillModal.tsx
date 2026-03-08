import { motion } from 'framer-motion'

interface Props {
  raw: string
  onClose: () => void
}

export function RawSkillModal({ raw, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-ink/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-code max-w-3xl w-full max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-paper/10">
          <span className="font-mono text-xs text-paper/60 uppercase tracking-widest">SKILL.md — raw</span>
          <button
            onClick={onClose}
            className="font-mono text-xs text-paper/60 hover:text-paper px-2 py-1"
          >
            ✕ close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="font-mono text-sm text-paper/90 whitespace-pre-wrap leading-relaxed">
            {raw}
          </pre>
        </div>
      </motion.div>
    </div>
  )
}
