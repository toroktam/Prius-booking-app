import { useEffect, useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { hu } from 'date-fns/locale';
import axios from 'axios';

const timeSlots = [
  "08:00–09:40",
  "10:00–11:40",
  "13:00–14:40",
  "14:50–16:30",
  "20:00–21:40"
];

export default function Home() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [bookings, setBookings] = useState({});
  const [name, setName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('bookingName');
    if (savedName) {
      setName(savedName);
      setLoggedIn(true);
    }
  }, []);

  const fetchBookings = async () => {
    const res = await axios.get(`/api/getBookings?week=${format(currentWeekStart, 'yyyy-MM-dd')}`);
    setBookings(res.data);
  };

  useEffect(() => {
    fetchBookings();
  }, [currentWeekStart]);

  const handleBooking = async (day, slot) => {
    if (!loggedIn) return;
    await axios.post('/api/bookSlot', {
      date: format(addDays(currentWeekStart, day), 'yyyy-MM-dd'),
      slot,
      name
    });
    fetchBookings();
  };

  const login = () => {
    if (name.trim() !== '') {
      localStorage.setItem('bookingName', name);
      setLoggedIn(true);
    }
  };

  const logout = () => {
    localStorage.removeItem('bookingName');
    setName('');
    setLoggedIn(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      {!loggedIn ? (
        <div>
          <h2>Foglalási rendszer</h2>
          <input
            type="text"
            placeholder="Add meg a neved"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={login}>Belépés</button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '10px' }}>
            <strong>Bejelentkezve mint:</strong> {name}{" "}
            <button onClick={logout}>Kijelentkezés</button>
          </div>

          <div>
            <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}>Előző hét</button>
            <span style={{ margin: '0 10px' }}>
              {format(currentWeekStart, 'yyyy.MM.dd', { locale: hu })} - {format(addDays(currentWeekStart, 6), 'yyyy.MM.dd', { locale: hu })}
            </span>
            <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}>Következő hét</button>
          </div>

          <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse', marginTop: '20px', textAlign: 'center' }}>
            <thead>
              <tr>
                <th>Időpont</th>
                {[...Array(7)].map((_, i) => (
                  <th key={i}>
                    {format(addDays(currentWeekStart, i), 'MM.dd', { locale: hu })} <br />
                    {format(addDays(currentWeekStart, i), 'EEEE', { locale: hu })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot}>
                  <td>{slot}</td>
                  {[...Array(7)].map((_, day) => {
                    const date = format(addDays(currentWeekStart, day), 'yyyy-MM-dd');
                    const bookedBy = bookings[date]?.[slot];
                    const isMine = bookedBy === name;
                    return (
                      <td
                        key={day}
                        style={{
                          backgroundColor: bookedBy ? (isMine ? '#90ee90' : '#f08080') : '#fff',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (!bookedBy || isMine) {
                            handleBooking(day, slot);
                          }
                        }}
                      >
                        {bookedBy || ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
