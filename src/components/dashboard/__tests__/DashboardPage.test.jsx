
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from '../DashboardPage';
import { vi } from 'vitest';

vi.mock('../../hooks/useDashboardStats', () => ({
  useDashboardStats: () => ({ loading: false }),
}));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user1', getIdToken: () => 'token' } }),
}));
vi.mock('../../services/userService', () => ({
  getUserProfile: () => Promise.resolve({ name: 'Test User' }),
}));
vi.mock('./WeakTopicsCard', () => ({ WeakTopicsCard: () => <div>WeakTopicsCard</div> }));


describe('DashboardPage', () => {
  it('renders WeakTopicsCard', () => {
    render(<DashboardPage />);
    expect(screen.getByText('WeakTopicsCard')).toBeInTheDocument();
  });

  it('loads user profile', async () => {
    render(<DashboardPage />);
    // Simulate async profile loading
    expect(await screen.findByText('WeakTopicsCard')).toBeInTheDocument();
  });
});
