import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { RedirectIfAuthed, RequireAuth } from './guards'
import { LoadingState } from '../components/states'
import { RouteError } from '../components/RouteError'

/**
 * Route map (spec §5) with route-level code splitting (§13): the heavy
 * map/QR bundle (Leaflet + html5-qrcode) only loads on the gameplay screens,
 * never on `/` or `/missions`.
 */

// Helper: React.lazy for a screen module that exports a named component.
function screen<M extends Record<string, ComponentType>>(load: () => Promise<M>, name: keyof M) {
  return lazy(async () => ({ default: (await load())[name] }))
}

const Home = screen(() => import('../screens/Home'), 'Home')
const Register = screen(() => import('../screens/Register'), 'Register')
const Login = screen(() => import('../screens/Login'), 'Login')
const Ranking = screen(() => import('../screens/Ranking'), 'Ranking')
const Missions = screen(() => import('../screens/Missions'), 'Missions')
const MissionDetail = screen(() => import('../screens/MissionDetail'), 'MissionDetail')
const PhaseItinerary = screen(() => import('../screens/PhaseItinerary'), 'PhaseItinerary')
const Challenge = screen(() => import('../screens/Challenge'), 'Challenge')
const Result = screen(() => import('../screens/Result'), 'Result')
const Menu = screen(() => import('../screens/Menu'), 'Menu')
const Profile = screen(() => import('../screens/Profile'), 'Profile')
const Rewards = screen(() => import('../screens/Rewards'), 'Rewards')
const AccountSettings = screen(() => import('../screens/AccountSettings'), 'AccountSettings')
const NotFound = screen(() => import('../screens/NotFound'), 'NotFound')

function SuspenseLayout() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh w-full max-w-[402px] bg-ink">
          <LoadingState />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  )
}

const authed = (node: ReactNode) => <RequireAuth>{node}</RequireAuth>
const publicOnly = (node: ReactNode) => <RedirectIfAuthed>{node}</RedirectIfAuthed>

const router = createBrowserRouter([
  {
    element: <SuspenseLayout />,
    errorElement: <RouteError />,
    children: [
      // ---- Public ----
      { path: '/', element: <Home /> },
      { path: '/register', element: publicOnly(<Register />) },
      { path: '/login', element: publicOnly(<Login />) },
      { path: '/ranking', element: <Ranking /> },

      // ---- Authenticated (👤) ----
      { path: '/missions', element: authed(<Missions />) },
      { path: '/missions/:missionId', element: authed(<MissionDetail />) },
      { path: '/missions/:missionId/phases/:phaseId', element: authed(<PhaseItinerary />) },
      {
        path: '/missions/:missionId/waypoints/:waypointId',
        element: authed(<PhaseItinerary />),
      },
      { path: '/waypoints/:waypointId/challenge', element: authed(<Challenge />) },
      { path: '/waypoints/:waypointId/result', element: authed(<Result />) },
      { path: '/menu', element: authed(<Menu />) },
      { path: '/profile', element: authed(<Profile />) },
      { path: '/rewards', element: authed(<Rewards />) },
      { path: '/account/settings', element: authed(<AccountSettings />) },

      { path: '*', element: <NotFound /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
