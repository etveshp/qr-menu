import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitForElementToBeRemoved } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';

afterEach(() => {
  cleanup();
});

function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast('Тестове повідомлення', 'success')}>
      show
    </button>
  );
}

describe('ToastProvider', () => {
  it('renders a toast message after showToast is called', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'show' }));

    expect(screen.getByText('Тестове повідомлення')).toBeInTheDocument();
  });

  it('removes a toast when its close button is clicked', async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'show' }));
    expect(screen.getByText('Тестове повідомлення')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button')[1]);
    await waitForElementToBeRemoved(() => screen.queryByText('Тестове повідомлення'));
  });
});
