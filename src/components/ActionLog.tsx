import { useEffect, useRef } from 'react'

interface ActionLogProps {
  messages: string[]
}

export function ActionLog({ messages }: ActionLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Check if scrollIntoView is available (not in all test environments)
    if (logEndRef.current && typeof logEndRef.current.scrollIntoView === 'function') {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div className="bg-gray-800 rounded p-1.5 h-full flex flex-col">
      <h2 className="text-white text-xs font-semibold mb-0.5">Action Log</h2>
      <div className="flex-1 overflow-y-auto bg-gray-900 rounded p-1 font-mono text-[9px] space-y-0">
        {messages.length === 0 ? (
          <div className="text-gray-500 italic">Waiting for game to start...</div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`${
                message.includes('===')
                  ? 'text-yellow-400 font-bold'
                  : message.includes('🤖')
                    ? 'text-blue-400'
                    : message.includes('👤')
                      ? 'text-green-400'
                      : message.includes('🏆') || message.includes('🎉')
                        ? 'text-purple-400 font-bold'
                        : message.includes('✅')
                          ? 'text-green-500'
                          : message.includes('❌')
                            ? 'text-red-500'
                            : 'text-gray-300'
              }`}
            >
              {message}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
