import React from 'react';
import { render } from '@testing-library/react-native';
import ChatMessage from '../src/components/ChatMessage';

describe('ChatMessage', () => {
  const mockUserMessage = {
    id: '1',
    role: 'user' as const,
    content: 'Test message from user',
    timestamp: new Date('2024-01-01T12:00:00'),
  };

  const mockAssistantMessage = {
    id: '2',
    role: 'assistant' as const,
    content: 'Test response from assistant',
    timestamp: new Date('2024-01-01T12:01:00'),
    legalReferences: [
      { reference: '§ 536 BGB', title: 'Mietminderung' },
      { reference: '§ 543 BGB', title: 'Kündigung' },
    ],
  };

  it('renders user message correctly', () => {
    const { getByText } = render(<ChatMessage message={mockUserMessage} />);
    expect(getByText('Test message from user')).toBeTruthy();
  });

  it('renders assistant message correctly', () => {
    const { getByText } = render(<ChatMessage message={mockAssistantMessage} />);
    expect(getByText('Test response from assistant')).toBeTruthy();
  });

  it('renders legal references for assistant messages', () => {
    const { getByText } = render(<ChatMessage message={mockAssistantMessage} />);
    expect(getByText('§ 536 BGB')).toBeTruthy();
    expect(getByText('§ 543 BGB')).toBeTruthy();
  });

  it('displays timestamp', () => {
    const { getByText } = render(<ChatMessage message={mockUserMessage} />);
    expect(getByText('12:00')).toBeTruthy();
  });
});
