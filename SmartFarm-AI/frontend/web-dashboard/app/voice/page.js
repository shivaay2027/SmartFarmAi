'use client'
import { useState, useRef } from 'react'
import { Mic, Waves, MessageSquare, Volume2 } from 'lucide-react'

export default function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [history, setHistory] = useState([
    { role: 'ai', text: 'Namaste! I am your SmartFarm Assistant. Which language would you prefer? I speak Hindi, Marathi, Tamil, English, and more.', translation: '' }
  ])

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false)
      // Simulate stopping recording and sending to Whisper API
      setTimeout(() => {
        setHistory(prev => [...prev, { role: 'user', text: "What is the mandi price for wheat today in Bhopal?"}])
        
        setTimeout(() => {
          setHistory(prev => [...prev, { role: 'ai', text: "The modal price for Wheat in Bhopal Mandi today is ₹2,250 per quintal. This is slightly higher than yesterday's ₹2,200. Would you like me to find a buyer or a transport truck?"}])
        }, 1500)
      }, 500)
    } else {
      setIsRecording(true)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Voice AI Assistant</h1>
        <p className="text-slate-500 mt-1">Talk to your farm operating system in your local language.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {history.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-leaf-600 text-white rounded-br-sm shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
              }`}>
                {msg.role === 'ai' && (
                  <button className="float-right ml-4 text-slate-400 hover:text-leaf-500 transition-colors">
                    <Volume2 size={18} />
                  </button>
                )}
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}

          {isRecording && (
            <div className="flex justify-start animate-pulse">
               <div className="bg-white border border-slate-200 rounded-2xl p-4 rounded-bl-sm shadow-sm flex items-center gap-2">
                 <div className="flex gap-1">
                   <span className="w-1.5 h-4 bg-leaf-400 rounded-full animate-bounce"></span>
                   <span className="w-1.5 h-6 bg-leaf-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                   <span className="w-1.5 h-3 bg-leaf-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                 </div>
                 <span className="text-slate-500 text-sm ml-2">Listening...</span>
               </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-4">
          <div className="flex-1 relative">
            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Type your question..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:bg-white transition-all text-slate-700"
            />
          </div>
          <button 
            onClick={handleMicClick}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
                : 'bg-leaf-500 hover:bg-leaf-600 shadow-lg shadow-leaf-500/30'
            }`}
          >
            {isRecording ? <Waves className="text-white animate-pulse" /> : <Mic className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}
