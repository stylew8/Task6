import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h2 className='mx-auto my-auto'>Something was wrong <a href='/'>Home</a></h2>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
