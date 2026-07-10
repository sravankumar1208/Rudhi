import { Component } from 'react'
import { Button } from './ui/Button'
import { BloodDropIcon } from './ui/BloodDropIcon'

export class ErrorBoundary extends Component {
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary dark:bg-dark-bg p-8 text-center gap-4">
          <BloodDropIcon size={48} className="text-danger" />
          <h2 className="text-2xl font-heading font-bold text-neutral-dark dark:text-white">
            {this.props.title || 'Something went wrong'}
          </h2>
          <p className="text-neutral-mid max-w-sm">
            {this.props.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <Button onClick={() => { this.setState({ hasError: false }); window.location.reload() }}>
            Try Again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
