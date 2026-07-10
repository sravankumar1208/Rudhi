import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'

const slides = [
  {
    title: "Find Donors in Minutes",
    subtitle: "Instantly alert nearby registered donors when you need blood in an emergency.",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    )
  },
  {
    title: "Real-Time Tracking",
    subtitle: "Track your donor's live location and get accurate ETA to the hospital.",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    )
  },
  {
    title: "Even Offline, We Alert",
    subtitle: "Our fallback SMS Emergency Mode ensures you can find donors even without internet.",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="m13 8-2 2-2-2" />
        <path d="M9 12h6" />
      </svg>
    )
  }
]

export const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()

  const completeOnboarding = () => {
    localStorage.setItem('onboardingComplete', 'true')
    navigate('/auth', { replace: true })
  }

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      completeOnboarding()
    } else {
      setCurrentSlide(prev => prev + 1)
    }
  }

  return (
    <div className="flex flex-col h-screen w-full px-6 py-8 relative">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <BloodDropIcon size={28} className="text-primary" />
          </motion.div>
          <span className="font-heading font-bold text-xl tracking-tight text-neutral-dark dark:text-white">Rudhi</span>
        </div>
        <Button variant="ghost" size="sm" className="font-medium" onClick={completeOnboarding}>
          Skip
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-10 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm absolute"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -100 && currentSlide < slides.length - 1) {
                setCurrentSlide(prev => prev + 1);
              } else if (swipe > 100 && currentSlide > 0) {
                setCurrentSlide(prev => prev - 1);
              }
            }}
          >
            {React.createElement(slides[currentSlide].icon, {
              className: "w-48 h-48 mb-8 text-primary/80 dark:text-primary/60"
            })}
            <h2 className="text-2xl font-heading font-bold mb-3 text-neutral-dark dark:text-white">
              {slides[currentSlide].title}
            </h2>
            <p className="text-neutral-mid dark:text-gray-400">
              {slides[currentSlide].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto flex flex-col gap-8 pb-4">
        <div className="flex justify-center gap-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-6 bg-primary' : 'w-2 bg-neutral-light dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        
        <div className="text-center mb-2">
          <p className="text-sm font-medium text-neutral-mid dark:text-gray-400 italic">
            "Every drop counts. Every second matters."
          </p>
        </div>

        <Button size="lg" onClick={handleNext} className="w-full">
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  )
}
