// src/components/UI/ErrorBoundary.js
import React, { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could also log errors to a service like Sentry here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>Something went wrong</h2>
            {this.props.fallbackContent ? (
              this.props.fallbackContent
            ) : (
              <>
                <p>We're sorry, an unexpected error occurred.</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="reload-button"
                >
                  Reload Page
                </button>
              </>
            )}
            {this.props.showDetails && this.state.error && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <p>{this.state.error.toString()}</p>
                <pre>
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
