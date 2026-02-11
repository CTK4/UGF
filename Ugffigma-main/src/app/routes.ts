import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Hub } from './screens/Hub';
import { Roster } from './screens/Roster';
import { PlayerProfile } from './screens/PlayerProfile';
import { Draft } from './screens/Draft';
import { Game } from './screens/Game';
import { Phone } from './screens/Phone';
import { NotFound } from './screens/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Hub },
      { path: 'roster', Component: Roster },
      { path: 'player/:id', Component: PlayerProfile },
      { path: 'draft', Component: Draft },
      { path: 'game', Component: Game },
      { path: 'phone', Component: Phone },
      { 
        path: 'more', 
        Component: () => {
          return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <p className="text-white/60">Settings & More Coming Soon</p>
            </div>
          );
        }
      },
      { path: '*', Component: NotFound },
    ],
  },
]);