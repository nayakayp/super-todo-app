import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastContainer, useToast } from './Toast';
import { useToastStore } from '../../stores/toastStore';
import React from 'react';

describe('ToastContainer', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders toasts when they exist', () => {
    useToastStore.setState({
      toasts: [
        { id: '1', message: 'Success message', type: 'success', duration: 3000 },
      ],
    });

    render(<ToastContainer />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    useToastStore.setState({
      toasts: [
        { id: '1', message: 'Toast 1', type: 'success', duration: 3000 },
        { id: '2', message: 'Toast 2', type: 'error', duration: 3000 },
      ],
    });

    render(<ToastContainer />);
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('removes toast when close button is clicked', () => {
    const removeToast = vi.fn();
    useToastStore.setState({
      toasts: [{ id: '1', message: 'Test', type: 'info', duration: 3000 }],
      removeToast,
    });

    render(<ToastContainer />);

    // Find and click the close button
    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]);

    expect(removeToast).toHaveBeenCalledWith('1');
  });

  it('applies correct styles for success type', () => {
    useToastStore.setState({
      toasts: [{ id: '1', message: 'Success', type: 'success', duration: 3000 }],
    });

    render(<ToastContainer />);
    const toast = screen.getByText('Success').closest('div');
    expect(toast?.className).toContain('bg-green-500');
  });

  it('applies correct styles for error type', () => {
    useToastStore.setState({
      toasts: [{ id: '1', message: 'Error', type: 'error', duration: 3000 }],
    });

    render(<ToastContainer />);
    const toast = screen.getByText('Error').closest('div');
    expect(toast?.className).toContain('bg-red-500');
  });

  it('applies correct styles for warning type', () => {
    useToastStore.setState({
      toasts: [{ id: '1', message: 'Warning', type: 'warning', duration: 3000 }],
    });

    render(<ToastContainer />);
    const toast = screen.getByText('Warning').closest('div');
    expect(toast?.className).toContain('bg-yellow-500');
  });
});

describe('useToast hook', () => {
  function TestComponent() {
    const toast = useToast();

    return (
      <div>
        <button onClick={() => toast.success('Success!')}>Show Success</button>
        <button onClick={() => toast.error('Error!')}>Show Error</button>
        <button onClick={() => toast.info('Info!')}>Show Info</button>
        <button onClick={() => toast.warning('Warning!')}>Show Warning</button>
        <ToastContainer />
      </div>
    );
  }

  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows success toast', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('shows error toast', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('shows info toast', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Show Info'));
    expect(screen.getByText('Info!')).toBeInTheDocument();
  });

  it('shows warning toast', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Show Warning'));
    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });
});
