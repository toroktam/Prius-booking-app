import { useEffect, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { hu } from 'date-fns/locale';

const TIME_SLOTS = [
  '08:00–09:40',
  '10:00–11:40',
  '13:00–14:40',
  '14:50–16:30',
  '20:00–21:40',
];

export default function FoglalasiNaptar() {
  const [user, setUser] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [bookings, setBookings] = useState({});
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const fetchBookings = async () => {
    const res = await fetch('/api/bookings');
    const data = await res.json();
    setBookings(data);
  };

  useEffect(() => {
    if (loggedIn) fetchBookings();
  }, [loggedIn]);

  const handleBooking = async (date, slot) => {
    const key = `${date}-${slot}`;
    const reservedBy = bookings[key];

    if (reservedBy === user) {
      await fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slot, user })
      });
      const updated = { ...bookings };
      delete updated[key];
      setBookings(updated);
    } else if (!reservedBy) {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slot, user })
      });
      setBookings({ ...bookings, [key]: user });
    }
  };

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="p-4">
      {!loggedIn ? (
        <form
          onSubmit={(e) => { e.preventDefault(); if (user.trim()) setLoggedIn(true); }}
          className="space-x-2"
        >
          <input
            type="text"
            placeholder="Név (pl. Tamás vagy Krisztián)"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="border px-2 py-1"
          />
          <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
            Belépés
          </button>
        </form>
      ) : (
        <>
          <h2 className="text-xl mb-4">
            Üdv, {user}! ({format(weekStart, 'yyyy. MMM dd', { locale: hu })} - {format(addDays(weekStart, 6), 'MMM dd', { locale: hu })})
          </h2>
          <div className="flex justify-between mb-2">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="px-3 py-1 bg-gray-200 rounded">Előző hét</button>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="px-3 py-1 bg-gray-200 rounded">Következő hét</button>
          </div>
          <div className="grid grid-cols-8 gap-1">
            <div className="font-bold">Idősáv</div>
            {days.map(day => (
              <div key={day} className="font-bold text-center">
                {format(day, 'EEE dd', { locale: hu })}
              </div>
            ))}
            {TIME_SLOTS.map(slot => (
              <>
                <div className="font-semibold">{slot}</div>
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const key = `${dateStr}-${slot}`;
                  const reservedBy = bookings[key];
                  const isMine = reservedBy === user;
                  return (
                    <button
                      key={key}
                      onClick={() => handleBooking(dateStr, slot)}
                      className={`h-12 w-full border text-sm rounded ${
                        reservedBy
                          ? isMine
                            ? 'bg-green-300 hover:bg-yellow-200'
                            : 'bg-red-400 text-white cursor-not-allowed'
                          : 'bg-white hover:bg-blue-100'
                      }`}
                      disabled={reservedBy && !isMine}
                    >
                      {reservedBy || 'Szabad'}
                    </button>
                  );
                })}
              </>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
