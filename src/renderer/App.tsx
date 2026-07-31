import { useState } from 'react';

type Route = 'home';

export default function App() {
  const [route] = useState<Route>('home');

  switch (route) {
    case 'home':
    default:
      return <div />;
  }
}
