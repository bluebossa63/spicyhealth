'use client';
import { Component, ReactNode, ErrorInfo } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
          <p className="text-5xl mb-4">🌶️</p>
          <h2 className="font-display text-2xl text-charcoal-800 mb-2">Something went wrong</h2>
          <p className="text-charcoal-400 mb-6 text-sm">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })} className="btn-primary">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
