import { describe, expect, it } from 'vitest';

import { useAppStore } from './app.store';

describe('useAppStore', () => {
  it('alterna o estado da sidebar', () => {
    const initial = useAppStore.getState().isSidebarOpen;
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().isSidebarOpen).toBe(!initial);
  });
});
