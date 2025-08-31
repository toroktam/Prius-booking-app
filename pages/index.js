// pages/index.js
import { useEffect, useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { hu } from 'date-fns/locale';

const TIME_SLOTS = [
  '08:00–09:40',
  '10:00–11:40',
  '13:00–14:40',
  '14:50–16:30',
  '20:00–21:40',
];

export default function Home() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [bookings, setBookings] = useState({});
  const [name, setName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bookingName');
    if (saved) {
      setName(saved);
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) fetchBookings();
  }, [loggedIn, weekStart]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const res = await fetch('/api/getBookings');
      const data = await res.json();
      setBookings(data || {});
    } catch (err) {
      console.error('fetchBookings error', err);
    }
    setLoading(false);
  }

  async function handleClick(dateStr, slot) {
    const key = `${dateStr}-${slot}`;
    const reservedBy = bookings[key];

    if (reservedBy === name) {
      const res = await fetch('/api/updateBooking', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, slot, user: name })
      });
      if (res.ok) {
        const copy = { ...bookings };
        delete copy[key];
        setBookings(copy);
      }
      return;
    }

    if (!reservedBy) {
      const res = await fetch('/api/updateBooking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, slot, user: name })
      });
      if (res.ok) {
        setBookings({ ...bookings, [key]: name });
      } else if (res.status === 409) {
        alert('Az időpontot már foglalták');
        fetchBookings();
      } else {
        alert('Foglalás sikertelen');
      }
    }
  }

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  if (!loggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-bold">Kérlek add meg a neved</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add meg a neved"
            className="border px-3 py-2 rounded w-64"
          />
          <div className="mt-3">
            <button
              onClick={() => {
                if (name.trim()) {
                  localStorage.setItem('bookingName', name.trim());
                  setLoggedIn(true);
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Belépés
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 font-sans">
      <div className="flex flex-wrap justify-center items-center mb-4 gap-2">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))}>◀ Előző hét</button>
        <h2 className="m-0 font-bold">Üdv, {name}!</h2>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))}>Következő hét ▶</button>
        <button
          onClick={() => {
            localStorage.removeItem('bookingName');
            setLoggedIn(false);
            setName('');
          }}
          className="px-2 py-1 bg-gray-300 rounded"
        >
          Kijelentkezés
        </button>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `120px repeat(7, minmax(100px, 1fr))`,
          }}
        >
          <div className="font-bold text-center bg-gray-100 p-2 rounded">Idősáv</div>
          {days.map(d => (
            <div key={d.toISOString()} className="font-bold text-center bg-gray-100 p-2 rounded">
              {format(d, 'MM.dd', { locale: hu })}
              <br />
              <small>{format(d, 'EEEE', { locale: hu })}</small>
            </div>
          ))}

          {TIME_SLOTS.map(slot => (
            <div key={slot} className="contents">
              <div className="p-2 font-semibold bg-gray-50">{slot}</div>
              {days.map(d => {
                const dateStr = format(d, 'yyyy-MM-dd');
                const key = `${dateStr}-${slot}`;
                const reservedBy = bookings[key];
                const isMine = reservedBy === name;

                return (
                  <button
                    key={key}
                    onClick={() => handleClick(dateStr, slot)}
                    disabled={!!reservedBy && !isMine}
                    className={`p-2 border rounded text-sm whitespace-nowrap overflow-hidden text-ellipsis ${
                      reservedBy
                        ? isMine
                          ? 'bg-yellow-200'
                          : 'bg-red-400 text-white cursor-not-allowed'
                        : 'bg-green-100 hover:bg-green-200'
                    }`}
                  >
                    {reservedBy || 'Szabad'}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {loading && <p className="mt-4 text-center">Betöltés...</p>}
    </div>
  );
}
