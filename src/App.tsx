/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import HomeScreen from './components/HomeScreen';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative flex flex-col">
        <HomeScreen />
      </div>
    </div>
  );
}
