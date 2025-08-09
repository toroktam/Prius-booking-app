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

const ACCESS_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || 'tanulas123';

export default function Home() {
  const [bookings, setBookings] = useState({});
  const [user, setUser] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [access, setAccess] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const stored = localStorage.getItem('access_granted');
    if (stored === 'true') setAccess(true);
  }, []);

  useEffect(() => {
    if (loggedIn && access) fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, access, weekStart]);

  async function fetchBookings() {
    const res = await fetch('/api/bookings');
    if (!res.ok) { console.error('Fetch bookings failed'); return; }
    const data = await res.json();
    setBookings(data || {});
  }

  async function doBook(date, slot) {
    const key = `${date}-${slot}`;
    const reservedBy = bookings[key];

    if (reservedBy === user) {
      // törlés (saját foglalás)
      const res = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slot, user })
      });
      if (res.ok) {
        const copy = { ...bookings }; delete copy[key]; setBookings(copy);
      } else {
        alert('Törlés sikertelen');
      }
      return;
    }

    if (!reservedBy) {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slot, user })
      });
      if (res.ok) {
        setBookings({ ...bookings, [key]: user });
      } else if (res.status === 409) {
        alert('Már foglalták az időpontot');
        fetchBookings();
      } else {
        alert('Foglalás sikertelen');
      }
    }
  }

  const handlePassword = (e) => {
    e.preventDefault();
    if (pwdInput === ACCESS_PASSWORD) {
      setAccess(true);
      localStorage.setItem('access_granted', 'true');
    } else {
      alert('Hibás jelszó');
    }
  };

  return (
    <div style={{ padding: 12, fontFamily: 'Arial, sans-serif' }}>
      {!access ? (
        <form onSubmit={handlePassword}>
          <input type="password" placeholder="Jelszó" value={pwdInput} onChange={(e)=>setPwdInput(e.target.value)} style={{padding:8}}/>
          <button type="submit" style={{marginLeft:8,padding:'8px 12px'}}>Belépés</button>
        </form>
      ) : !loggedIn ? (
        <form onSubmit={(e)=>{ e.preventDefault(); if (user.trim()) setLoggedIn(true); }}>
          <input value={user} onChange={(e)=>setUser(e.target.value)} placeholder="Név (Tamás vagy Krisztián)" style={{padding:8}} />
          <button type="submit" style={{marginLeft:8,padding:'8px 12px'}}>Lépj be</button>
        </form>
      ) : (
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <button onClick={()=>setWeekStart(addDays(weekStart,-7))}>◀ Előző hét</button>
            <h2>Üdv, {user}!</h2>
            <button onClick={()=>setWeekStart(addDays(weekStart,7))}>Következő hét ▶</button>
          </div>

          <div style={{overflowX:'auto'}}>
            <div style={{
              display:'grid',
              gridTemplateColumns:'160px repeat(7,minmax(120px,1fr))',
              gap:'8px',
              alignItems:'start',
              minWidth: '700px'
            }}>
              <div style={{fontWeight:700,padding:6,textAlign:'center',background:'#f5f5f5',borderRadius:6}}>Idősáv</div>
              {days.map(d=>(
                <div key={d.toISOString()} style={{fontWeight:700,textAlign:'center',padding:6,background:'#f5f5f5',borderRadius:6}}>
                  {format(d,'MM.dd',{locale:hu})}<br/><small>{format(d,'EEEE',{locale:hu})}</small>
                </div>
              ))}

              {TIME_SLOTS.map(slot=>(
                <div key={slot} style={{display:'contents'}}>
                  <div style={{padding:8,background:'#fafafa',fontWeight:600}}>{slot}</div>
                  {days.map(d=>{
                    const dateStr = format(d,'yyyy-MM-dd');
                    const key = `${dateStr}-${slot}`;
                    const reservedBy = bookings[key];
                    const isMine = reservedBy === user;
                    const style = reservedBy ? (isMine ? {background:'#ffd97d'} : {background:'#f36b6b',color:'white'}) : {background:'#dff7d8'};
                    return (
                      <button
                        key={key}
                        onClick={()=>doBook(dateStr,slot)}
                        disabled={!!reservedBy && !isMine}
                        style={{
                          width:'100%',padding:8,border:'1px solid #ccc',borderRadius:6,
                          whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
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
        </>
      )}
    </div>
  );
}
