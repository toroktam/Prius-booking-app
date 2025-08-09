import { useEffect, useState } from 'react';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { format, addDays, startOfWeek } from 'date-fns';
import { hu } from 'date-fns/locale';

const TIME_SLOTS = [
  '08:00–09:40',
  '10:00–11:40',
  '13:00–14:40',
  '14:50–16:30',
  '20:00–21:40',
];

const SHEET_ID = '14OnABoY-pzyAW-oXGHBxLxYsCu9Q3JtNDmNIqb530gI';
const ACCESS_PASSWORD = 'tanulas123';

export default function FoglalasiNaptar() {
  const [user, setUser] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [bookings, setBookings] = useState({});
  const [access, setAccess] = useState(false);
  const [password, setPassword] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const DAYS = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  useEffect(() => {
    const storedAccess = localStorage.getItem('access_granted');
    if (storedAccess === 'true') {
      setAccess(true);
    }
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      const doc = new GoogleSpreadsheet(SHEET_ID);
      await doc.useServiceAccountAuth({
        client_email: process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY).replace(/\\n/g, '\n'),
      });
      await doc.loadInfo();
      const sheet = doc.sheetsByIndex[0];
      const rows = await sheet.getRows();
      const newBookings = {};
      rows.forEach(row => {
        const key = `${row.Nap}-${row.Idosav}`;
        newBookings[key] = row.Foglalo;
      });
      setBookings(newBookings);
    };
    if (loggedIn && access) fetchBookings();
  }, [loggedIn, access, currentWeekStart]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      setAccess(true);
      localStorage.setItem('access_granted', 'true');
    } else {
      alert('Hibás jelszó');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (user.trim()) setLoggedIn(true);
  };

  const handleBooking = async (day, slot) => {
    const key = `${format(day, 'yyyy-MM-dd')}-${slot}`;
    const current = bookings[key];
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY).replace(/\\n/g, '\n'),
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    if (current === user) {
      const rows = await sheet.getRows();
      const match = rows.find(row => row.Nap === format(day, 'yyyy-MM-dd') && row.Idosav === slot && row.Foglalo === user);
      if (match) {
        await match.delete();
        const updated = { ...bookings };
        delete updated[key];
        setBookings(updated);
      }
    } else if (!current) {
      await sheet.addRow({
        Nap: format(day, 'yyyy-MM-dd'),
        Idosav: slot,
        Foglalo: user,
        Idobelyeg: new Date().toISOString()
      });
      setBookings({ ...bookings, [key]: user });
    }
  };

  const goPrevWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  if (!access) {
    return (
      <div className="p-4">
        <form onSubmit={handlePasswordSubmit} className="space-x-2">
          <input
            type="password"
            placeholder="Jelszó belépéshez"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border px-2 py-1"
          />
          <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
            Belépés
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4">
      {!loggedIn ? (
        <form onSubmit={handleLogin} className="space-x-2">
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
          <div className="flex justify-between mb-4">
            <button onClick={goPrevWeek} className="bg-gray-300 px-2 py-1 rounded">Előző hét</button>
            <h2 className="text-xl">Üdv, {user}!</h2>
            <button onClick={goNextWeek} className="bg-gray-300 px-2 py-1 rounded">Következő hét</button>
          </div>
          <div className="grid grid-cols-8 gap-1">
            <div className="font-bold">Idősáv</div>
            {DAYS.map(day => (
              <div key={day} className="font-bold text-center">
                {format(day, 'MM.dd', { locale: hu })} <br /> {format(day, 'EEEE', { locale: hu })}
              </div>
            ))}
            {TIME_SLOTS.map((slot) => (
              <>
                <div className="font-semibold">{slot}</div>
                {DAYS.map(day => {
                  const key = `${format(day, 'yyyy-MM-dd')}-${slot}`;
                  const reservedBy = bookings[key];
                  const isMine = reservedBy === user;
                  return (
                    <button
                      key={key}
                      onClick={() => handleBooking(day, slot)}
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
