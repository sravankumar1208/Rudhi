import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown, Heart, Droplet, Clock, Shield, Users, MapPin } from 'lucide-react'

const faqs = [
  {
    icon: Droplet,
    question: 'Who can donate blood?',
    answer: 'Anyone aged 18–65 who weighs at least 50 kg and is in good health can donate blood. You must not have any infectious diseases, and your hemoglobin level must be at least 12.5 g/dL.',
  },
  {
    icon: Clock,
    question: 'How often can I donate blood?',
    answer: 'You can donate whole blood once every 56 days (8 weeks). Platelets can be donated every 7 days, up to 24 times a year. Plasma can be donated every 28 days.',
  },
  {
    icon: Shield,
    question: 'Is donating blood safe?',
    answer: 'Yes. Sterile, single-use equipment is used for every donation, eliminating any risk of infection. The entire process is monitored by trained medical professionals.',
  },
  {
    icon: Users,
    question: 'How does Rudhi match donors to requesters?',
    answer: 'When a blood request is created, Rudhi scans for eligible donors within the specified radius who match the required blood group, are available, and are not on cooldown. Donors receive instant alerts via push notification and SMS.',
  },
  {
    icon: Heart,
    question: 'What should I do before donating?',
    answer: 'Stay hydrated, eat a healthy meal (avoid fatty foods), get a good night\'s sleep, and avoid alcohol for 24 hours before donation. Bring a valid ID to the donation center.',
  },
  {
    icon: MapPin,
    question: 'How is my location used?',
    answer: 'Your location is used only to match you with nearby blood requests. You can control your location sharing and alert radius in Availability Settings. Your precise location is never shared publicly.',
  },
  {
    icon: Clock,
    question: 'What is the donor cooldown period?',
    answer: 'After donating whole blood, you must wait 56 days before your next donation. Rudhi automatically tracks this and will not send you alerts during your cooldown period.',
  },
  {
    icon: Droplet,
    question: 'Which blood types are most needed?',
    answer: 'O negative is the universal donor and is always in high demand, especially for emergencies. O positive is the most common blood type and is also frequently needed. Platelet donations are needed year-round.',
  },
]

export const FAQ = () => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg p-4 gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">Frequently Asked Questions</h1>
        <p className="text-sm text-neutral-mid">Everything you need to know about blood donation</p>
      </div>

      <Accordion.Root type="single" collapsible className="flex flex-col gap-2">
        {faqs.map((faq, i) => (
          <Accordion.Item key={i} value={`item-${i}`} className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-light dark:border-gray-800 overflow-hidden shadow-sm">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center gap-4 p-4 group cursor-pointer outline-none">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <faq.icon size={18} className="text-primary" />
                </div>
                <span className="flex-1 text-left font-semibold text-neutral-dark dark:text-white text-[15px] leading-snug">{faq.question}</span>
                <ChevronDown size={20} className="text-neutral-mid transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-4 pb-4 pt-0 text-sm text-neutral-mid leading-relaxed data-[state=open]:animate-slide-up">
              {faq.answer}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  )
}
