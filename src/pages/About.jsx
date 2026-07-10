import { Heart, Target, Eye, Shield, Users, Globe } from 'lucide-react'
import { BloodDropIcon } from '../components/ui/BloodDropIcon'
import { Card } from '../components/ui/Card'

export const About = () => {
  const stats = [
    { icon: Heart, value: '500+', label: 'Lives Saved' },
    { icon: Users, value: '2,000+', label: 'Registered Donors' },
    { icon: Globe, value: '50+', label: 'Partner Hospitals' },
  ]

  const values = [
    { icon: Target, title: 'Our Mission', desc: 'To eliminate blood shortage deaths by connecting patients with nearby donors in real-time, ensuring every blood request is fulfilled within the golden hour.' },
    { icon: Eye, title: 'Our Vision', desc: 'A world where no patient dies waiting for blood. Every blood type available, everywhere, at any time.' },
    { icon: Shield, title: 'Trust & Safety', desc: 'All donors are verified, and every donation is tracked. Your data is protected with industry-standard encryption and never shared without consent.' },
  ]

  return (
    <div className="flex flex-col min-h-screen w-full bg-secondary dark:bg-dark-bg p-4 gap-6">
      <div className="flex flex-col items-center pt-6 pb-2 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
          <BloodDropIcon size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">Rudhi – Blood Bridge</h1>
        <p className="text-sm text-neutral-mid text-center max-w-xs">v1.0.0</p>
      </div>

      <p className="text-sm text-neutral-dark dark:text-white text-center leading-relaxed max-w-sm mx-auto">
        Rudhi is a community-driven blood donation platform that connects blood requesters with willing donors in real-time. Every second matters when a life is on the line.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex flex-col items-center justify-center p-4 gap-1 text-center">
            <stat.icon size={20} className="text-primary" />
            <span className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">{stat.value}</span>
            <span className="text-[10px] font-medium text-neutral-mid uppercase tracking-wider">{stat.label}</span>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {values.map((v) => (
          <Card key={v.title} className="flex flex-col p-5 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <v.icon size={20} className="text-primary" />
              </div>
              <h2 className="font-heading font-bold text-lg text-neutral-dark dark:text-white">{v.title}</h2>
            </div>
            <p className="text-sm text-neutral-mid leading-relaxed">{v.desc}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1 py-4 text-center">
        <span className="text-xs text-neutral-mid">Built with love for the community</span>
        <span className="text-xs text-neutral-mid font-mono">Rudhi – Blood Bridge © {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}
