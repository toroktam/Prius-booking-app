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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // törlés
      const res = await fetch('/api/updateBooking', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, slot, user: name })
      });
      if (res.ok) {
        const copy = { ...bookings };
        delete copy[key];
        setBookings(copy);
      } else {
        alert('Törlés sikertelen');
        fetchBookings();
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
        fetchBookings();
      }
    }
  }

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Kérlek add meg a neved</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add meg a neved"
            style={{ padding: '8px', width: '220px', marginRight: 8 }}
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={() => {
              if (name.trim()) {
                localStorage.setItem('bookingName', name.trim());
                setLoggedIn(true);
              }
            }} style={{ padding: '8px 12px' }}>Belépés</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <button onClick={() => setWeekStart((w) => addDays(w, -7))}>◀ Előző hét</button>
        <h2 style={{ margin: 0 }}>Üdv, {name}!</h2>
        <button onClick={() => setWeekStart((w) => addDays(w, 7))}>Következő hét ▶</button>
        <button onClick={() => {
          localStorage.removeItem('bookingName');
          setLoggedIn(false);
          setName('');
        }} style={{ background: '#eee', padding: '4px 8px' }}>Kijelentkezés</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '160px repeat(7, minmax(120px, 1fr))',
          gap: 8,
          alignItems: 'start',
          minWidth: 640
        }}>
          <div style={{ fontWeight: 700, textAlign: 'center', padding: 6, background: '#f5f5f5', borderRadius: 6 }}>Idősáv</div>
          {days.map(d => (
            <div key={d.toISOString()} style={{ fontWeight: 700, textAlign: 'center', padding: 6, background: '#f5f5f5', borderRadius: 6 }}>
              {format(d, 'MM.dd', { locale: hu })}<br /><small>{format(d, 'EEEE', { locale: hu })}</small>
            </div>
          ))}

          {TIME_SLOTS.map(slot => (
            <div key={slot} style={{ display: 'contents' }}>
              <div style={{ padding: 8, background: '#fafafa', fontWeight: 600 }}>{slot}</div>
              {days.map(d => {
                const dateStr = format(d, 'yyyy-MM-dd');
                const key = `${dateStr}-${slot}`;
                const reservedBy = bookings[key];
                const isMine = reservedBy === name;
                const style = reservedBy ? (isMine ? { background: '#ffd97d' } : { background: '#f36b6b', color: 'white' }) : { background: '#dff7d8' };
                return (
                  <button
                    key={key}
                    onClick={() => handleClick(dateStr, slot)}
                    disabled={!!reservedBy && !isMine}
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '1px solid #ccc',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: (!!reservedBy && !isMine) ? 'not-allowed' : 'pointer',
                      ...style
                    }}
                  >
                    {reservedBy || 'Szabad'}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {loading && <p>Betöltés...</p>}
    </div>
  );
}
