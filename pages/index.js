// pages/index.js

import { useEffect, useState } from 'react';

const TIME_SLOTS = [
  '08:00–09:40',
  '10:00–11:40',
  '13:00–14:40',
  '14:50–16:30',
  '20:00–21:40',
];

const DAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];

const PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD;

export default function Home() {
  const [bookings, setBookings] = useState({});
  const [user, setUser] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const fetchBookings = async () => {
    const res = await fetch('/api/lista');
    const data = await res.json();
    const map = {};
    data.forEach(({ nap, idosav, foglalo }) => {
      map[`${nap}-${idosav}`] = foglalo;
    });
    setBookings(map);
  };

  useEffect(() => {
    if (loggedIn && accessGranted) {
      fetchBookings();
    }
  }, [loggedIn, accessGranted]);

  const handleSlotClick = async (nap, idosav) => {
    const key = `${nap}-${idosav}`;
    const foglalo = bookings[key];

    if (foglalo && foglalo !== user) return;

    if (foglalo === user) {
      await fetch('/api/torol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nap, idosav, foglalo: user }),
      });
    } else {
      await fetch('/api/foglal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nap, idosav, foglalo: user }),
      });
    }

    fetchBookings();
  };

  if (!accessGranted) {
    return (
      <div className="p-4">
        <input
          type="password"
          placeholder="Jelszó"
          className="border p-2 mr-2"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => {
            if (passwordInput === PASSWORD) {
              setAccessGranted(true);
            } else {
              alert('Hibás jelszó');
            }
          }}
        >
          Belépés
        </button>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="p-4">
        <input
          type="text"
          placeholder="Név (pl. Tamás vagy Krisztián)"
          className="border p-2 mr-2"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <button
          className="bg-green-600 text-white px-3 py-1 rounded"
          onClick={() => {
            if (user.trim()) setLoggedIn(true);
          }}
        >
          Tovább
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Üdv, {user}!</h2>
      <div className="grid grid-cols-8 gap-1">
        <div className="font-bold">Idősáv</div>
        {DAYS.map((nap) => (
          <div key={nap} className="font-bold text-center">
            {nap}
          </div>
        ))}
        {TIME_SLOTS.map((idosav) => (
          <>
            <div className="font-semibold">{idosav}</div>
            {DAYS.map((nap) => {
              const key = `${nap}-${idosav}`;
              const foglalo = bookings[key];
              const isMine = foglalo === user;
              return (
                <button
                  key={key}
                  onClick={() => handleSlotClick(nap, idosav)}
                  disabled={foglalo && !isMine}
                  className={`h-12 w-full border text-sm rounded ${
                    foglalo
                      ? isMine
                        ? 'bg-green-300 hover:bg-yellow-200'
                        : 'bg-red-400 text-white cursor-not-allowed'
                      : 'bg-white hover:bg-blue-100'
                  }`}
                >
                  {foglalo || 'Szabad'}
                </button>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
