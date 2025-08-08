// pages/index.js
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

  // Lekéri a foglalásokat a szerveroldali API-ból
  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Hiba a foglalások lekérésekor');
      const data = await res.json();
      setBookings(data || {});
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (loggedIn) fetchBookings();
  }, [loggedIn, weekStart]);

  const handleBooking = async (date, slot) => {
    const key = `${date}-${slot}`;
    const reservedBy = bookings[key];

    if (reservedBy === user) {
      // saját törlése
      await fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slot, user }),
      });
      const copy = { ...bookings };
      delete copy[key];
      setBookings(copy);
      return;
    }

    if (!reservedBy) {
      // új foglalás
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slot, user }),
      });
      setBookings({ ...bookings, [key]: user });
    }
  };

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div style={{ padding: 12, fontFamily: 'Arial, sans-serif' }}>
      {!loggedIn ? (
        <form
          onSubmit={(e) => { e.preventDefault(); if (user.trim()) setLoggedIn(true); }}
          style={{ marginBottom: 12 }}
        >
          <input
            type="text"
            placeholder="Név (pl. Tamás vagy Krisztián)"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            style={{ padding: 8, marginRight: 8 }}
          />
          <button type="submit" style={{ padding: '8px 12px' }}>Belépés</button>
        </form>
      ) : (
        <>
          <h2 style={{ margin: '6px 0 12px 0' }}>
            Üdv, {user}! ({format(weekStart, 'yyyy. MMM dd', { locale: hu })} - {format(addDays(weekStart, 6), 'MMM dd', { locale: hu })})
          </h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={{ padding: '6px 10px' }}>◀ Előző hét</button>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={{ padding: '6px 10px' }}>Következő hét ▶</button>
          </div>

          <div className="calendar-wrapper">
            <div className="calendar-grid">
              <div className="header-cell">Idősáv</div>
              {days.map((d) => (
                <div key={d.toISOString()} className="header-cell">
                  {format(d, 'EEE dd.MM.', { locale: hu })}
                </div>
              ))}

              {TIME_SLOTS.map((slot) => (
                <div key={slot} className="slot-cell">{slot}</div>
              )).reduce((acc, slotCell, rowIndex) => {
                // az előző map csak az első oszlopot adta; most sorrendben hozzáadjuk a napokra a gombokat
                acc.push(slotCell);
                return acc;
              }, []).concat(
                // másik megközelítés: egyszerűbb — újra felépítjük a sorokat:
                []
              )}

              {/* Keresztbe építjük fel: minden idősáv után 7 nap */}
              {TIME_SLOTS.map((slot) => (
                // fragment a slot cell és a 7 nap gombjai helyett (slot cell már fent van), itt a nap cellák
                <span key={`row-${slot}`} style={{ display: 'contents' }}>
                  {/* a slot cím már fent van; most a napok gombjai */}
                  {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const key = `${dateStr}-${slot}`;
                    const reservedBy = bookings[key];
                    const isMine = reservedBy === user;
                    const btnClass = reservedBy ? (isMine ? 'slot-btn own' : 'slot-btn booked') : 'slot-btn free';
                    return (
                      <button
                        key={key}
                        className={btnClass}
                        onClick={() => handleBooking(dateStr, slot)}
                        disabled={!!reservedBy && !isMine}
                        aria-label={`${format(day, 'EEE dd.MM.', { locale: hu })} ${slot} — ${reservedBy || 'Szabad'}`}
                      >
                        {reservedBy || 'Szabad'}
                      </button>
                    );
                  })}
                </span>
              ))}
            </div>
          </div>

          <style jsx>{`
            .calendar-wrapper {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
            .calendar-grid {
              display: grid;
              grid-template-columns: 160px repeat(7, minmax(120px, 1fr));
              gap: 8px;
              align-items: start;
              min-width: 640px; /* ha túl kicsi a képernyő, görgethetővé teszi */
            }
            .header-cell {
              font-weight: 700;
              text-align: center;
              padding: 6px 4px;
              background: #f5f5f5;
              border-radius: 6px;
            }
            .slot-cell {
              padding: 8px 6px;
              font-weight: 600;
            }
            .slot-btn {
              display: block;
              width: 100%;
              padding: 8px;
              border: 1px solid #ccc;
              border-radius: 6px;
              background: white;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .slot-btn.free:hover {
              background: #e8f2ff;
              cursor: pointer;
            }
            .slot-btn.own {
              background: #c8f7c8;
            }
            .slot-btn.booked {
              background: #f36b6b;
              color: white;
            }

            /* Mobilon kicsit kisebb gombok */
            @media (max-width: 640px) {
              .calendar-grid {
                grid-template-columns: 120px repeat(7, 120px);
                min-width: auto;
              }
              .slot-btn {
                padding: 6px;
                font-size: 13px;
              }
              .header-cell { font-size: 13px; }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
