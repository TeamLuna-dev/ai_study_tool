
import { vi } from 'vitest';
vi.mock('../../../context/AuthContext', () => ({
  useAuthContext: () => ({ user: { uid: 'user1', getIdToken: () => 'token' }, loading: false }),
}));
// vi.fn() lets each test override the return value directly,
// since doMock can't re-target an already statically imported module.
const mockUseWeakTopics = vi.fn();
vi.mock('../../../hooks/useWeakTopics', () => ({
  useWeakTopics: () => mockUseWeakTopics(),
}));
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WeakTopicsCard } from '../WeakTopicsCard';

describe('WeakTopicsCard', () => {
  it('renders weak topics below 60%', () => {
    mockUseWeakTopics.mockReturnValue({
      weakTopics: [
        { topic: 'Algebra', average_score: 55 },
        { topic: 'Geometry', average_score: 65 },
        { topic: 'Calculus', average_score: 45 },
      ],
      loading: false,
      error: null,
    });
    render(<WeakTopicsCard />);
    expect(screen.getByText('Algebra')).toBeInTheDocument();
    expect(screen.getByText('Calculus')).toBeInTheDocument();
    expect(screen.queryByText('Geometry')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseWeakTopics.mockReturnValue({ weakTopics: [], loading: true, error: null });
    render(<WeakTopicsCard />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('shows no weak topics message', () => {
    mockUseWeakTopics.mockReturnValue({
      weakTopics: [{ topic: 'Geometry', average_score: 75 }],
      loading: false,
      error: null,
    });
    render(<WeakTopicsCard />);
    expect(screen.getByText(/No weak topics detected/i)).toBeInTheDocument();
  });
});
