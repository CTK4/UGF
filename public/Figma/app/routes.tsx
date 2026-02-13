import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { BootGate } from './components/BootGate';
import { Hub } from './screens/Hub';
import { Roster } from './screens/Roster';
import { PlayerProfile } from './screens/PlayerProfile';
import { Draft } from './screens/Draft';
import { Game } from './screens/Game';
import { Phone } from './screens/Phone';
import { Staff } from './screens/Staff';
import { StaffMeeting } from './screens/StaffMeeting';
import { CreateCoach } from './screens/CreateCoach';
import { Interviews } from './screens/Interviews';
import { Offers } from './screens/Offers';
import { NotFound } from './screens/NotFound';

const MoreScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <p className="text-white/60">Settings & More Coming Soon</p>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/create-coach',
    element: <CreateCoach />,
  },
  {
    path: '/interviews',
    element: <Interviews />,
  },
  {
    path: '/offers',
    element: <Offers />,
  },
  {
    path: '/',
    element: (
      <BootGate>
        <Layout />
      </BootGate>
    ),
    children: [
      { index: true, element: <Hub /> },
      { path: 'roster', element: <Roster /> },
      { path: 'player/:id', element: <PlayerProfile /> },
      { path: 'draft', element: <Draft /> },
      { path: 'game', element: <Game /> },
      { path: 'phone', element: <Phone /> },
      { path: 'staff', element: <Staff /> },
      { path: 'staff-meeting', element: <StaffMeeting /> },
      { path: 'more', element: <MoreScreen /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);