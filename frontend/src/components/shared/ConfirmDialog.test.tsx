import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmDialog, useConfirm } from './ConfirmDialog';
import React from 'react';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    // Click on the backdrop (the outer div with bg-black/50)
    const backdrop = container.querySelector('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('uses custom button text', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('applies danger variant styles', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.className).toContain('bg-red-600');
  });

  it('applies warning variant styles', () => {
    render(<ConfirmDialog {...defaultProps} variant="warning" />);

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.className).toContain('bg-yellow-600');
  });

  it('applies info variant styles', () => {
    render(<ConfirmDialog {...defaultProps} variant="info" />);

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.className).toContain('bg-blue-600');
  });
});

describe('useConfirm hook', () => {
  function TestComponent() {
    const { confirm, ConfirmDialog } = useConfirm();
    const [result, setResult] = React.useState<boolean | null>(null);

    const handleClick = async () => {
      const confirmed = await confirm({
        title: 'Test Title',
        message: 'Test Message',
      });
      setResult(confirmed);
    };

    return (
      <div>
        <button onClick={handleClick}>Open Dialog</button>
        {result !== null && <span data-testid="result">{result.toString()}</span>}
        {ConfirmDialog}
      </div>
    );
  }

  it('returns true when confirmed', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Open Dialog'));
    expect(screen.getByText('Test Title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('true');
    });
  });

  it('returns false when cancelled', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Open Dialog'));
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('false');
    });
  });
});
