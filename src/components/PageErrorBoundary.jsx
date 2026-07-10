import { Component } from 'react'
import { Button } from './ui/Button'
import { BloodDropIcon } from './ui/BloodDropIcon'

export class PageErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-4">
          <BloodDropIcon size={40} className="text-danger" />
          <h3 className="text-xl font-heading font-bold text-neutral-dark dark:text-white">
            {this.props.title || 'Failed to load'}
          </h3>
          <p className="text-sm text-neutral-mid max-w-xs">
            {this.state.error?.message || this.props.message || 'Could not load this section.'}
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button onClick={() => this.setState({ hasError: false })}>
              Dismiss
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
