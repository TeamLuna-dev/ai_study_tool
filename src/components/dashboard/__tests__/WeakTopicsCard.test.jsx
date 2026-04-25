import React from 'react';
import { render, screen } from '@testing-library/react';
import { WeakTopicsCard } from '../WeakTopicsCard';

// Mock the useWeakTopics hook
jest.mock('../../hooks/useWeakTopics', () => ({
  useWeakTopics: () => ({
    weakTopics: [
      { topic: 'Algebra', average_score: 55 },
      { topic: 'Geometry', average_score: 65 },
      { topic: 'Calculus', average_score: 45 },
    ],
    loading: false,
    error: null,
  }),
}));

describe('WeakTopicsCard', () => {
  it('renders weak topics below 60%', () => {
    render(<WeakTopicsCard />);
    expect(screen.getByText('Algebra')).toBeInTheDocument();
    expect(screen.getByText('Calculus')).toBeInTheDocument();
    expect(screen.queryByText('Geometry')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.mock('../../hooks/useWeakTopics', () => ({
      useWeakTopics: () => ({ weakTopics: [], loading: true, error: null }),
    }));
    render(<WeakTopicsCard />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('shows no weak topics message', () => {
    jest.mock('../../hooks/useWeakTopics', () => ({
      useWeakTopics: () => ({ weakTopics: [{ topic: 'Geometry', average_score: 75 }], loading: false, error: null }),
    }));
    render(<WeakTopicsCard />);
    expect(screen.getByText(/No weak topics detected/i)).toBeInTheDocument();
  });
});
