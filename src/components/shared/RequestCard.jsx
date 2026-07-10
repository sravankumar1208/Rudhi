import { MapPin, Clock, Droplets } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export const RequestCard = ({ request, onAccept, onView }) => {
  const urgencyLabel = {
    critical: 'CRITICAL',
    moderate: 'MODERATE',
    routine: 'ROUTINE'
  }

  return (
    <Card urgencyBorder={request.urgency} className="flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="flex flex-col items-center justify-center bg-neutral-light dark:bg-gray-800 rounded-lg w-14 h-14">
            <span className="font-heading font-bold text-xl text-primary">{request.bloodGroup}</span>
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-neutral-dark dark:text-white line-clamp-1">{request.hospital}</h3>
            <div className="flex items-center gap-1 text-sm text-neutral-mid mt-0.5">
              <MapPin size={14} />
              <span>{request.distance} km away</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-neutral-mid mt-1">
              <Clock size={12} />
              <span>{request.timePosted}</span>
            </div>
          </div>
        </div>
        <Badge variant="status" status={request.status === 'searching' ? 'searching' : 'active'}>
          {urgencyLabel[request.urgency]}
        </Badge>
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-light dark:border-gray-800 pt-3 mt-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-dark dark:text-gray-300 bg-neutral-light dark:bg-gray-800 px-2.5 py-1 rounded-full">
          <Droplets size={14} className="text-primary" />
          <span>{request.units} Unit{request.units > 1 ? 's' : ''} Needed</span>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        {onAccept && (
          <Button size="sm" className="flex-[2] bg-success hover:bg-emerald-600 text-white" onClick={() => onAccept(request.id)}>
            Accept Request
          </Button>
        )}
        {onView && (
          <Button size="sm" variant="secondary" className="flex-1" onClick={() => onView(request.id)}>
            View
          </Button>
        )}
      </div>
    </Card>
  )
}
