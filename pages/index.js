import { useState, useEffect } from "react";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { format, addWeeks, startOfWeek, addDays } from "date-fns";
import { hu } from "date-fns/locale";

const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID;
const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID;
const CLIENT_EMAIL = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.NEXT_PUBLIC_GOOGLE_SERVICE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const TIME_SLOTS = [
  "08:00–09:40",
  "10:00–11:40",
  "13:00–14:40",
  "14:50–16:30",
  "20:00–21:40"
];

export default function Home() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem("username");
    if (storedName) {
      setName(storedName);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchBookings();
  }, [currentWeek, isLoggedIn]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
      await doc.useServiceAccountAuth({
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY
      });
      await doc.loadInfo();
      const sheet = doc.sheetsById[SHEET_ID];
      const rows = await sheet.getRows();
      setBookings(rows);
    } catch (error) {
      console.error("Hiba a foglalások betöltésekor:", error);
    }
    setLoading(false);
  };

  const handleBooking = async (day, slot) => {
    if (!name) return;
    try {
      const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
      await doc.useServiceAccountAuth({
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY
      });
      await doc.loadInfo();
      const sheet = doc.sheetsById[SHEET_ID];
      const rows = await sheet.getRows();

      const bookingDate = format(day, "yyyy-MM-dd") + " " + slot;
      const existing = rows.find(r => r.DateTime === bookingDate);

      if (existing) {
        if (existing.Name === name) {
          await existing.delete();
        } else {
          alert("Ez az időpont már foglalt!");
          return;
        }
      } else {
        await sheet.addRow({ DateTime: bookingDate, Name: name });
      }
      fetchBookings();
    } catch (error) {
      console.error("Hiba a foglalásnál:", error);
    }
  };

  const renderCalendar = () => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <table border="1" style={{ borderCollapse: "collapse", textAlign: "center" }}>
          <thead>
            <tr>
              <th>Időpont</th>
              {days.map(day => (
                <th key={day}>
                  {format(day, "MM.dd", { locale: hu })} ({format(day, "EEEE", { locale: hu })})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot}>
                <td>{slot}</td>
                {days.map(day => {
                  const booking = bookings.find(
                    b => b.DateTime === format(day, "yyyy-MM-dd") + " " + slot
                  );
                  return (
                    <td
                      key={day + slot}
                      style={{
                        cursor: "pointer",
                        backgroundColor: booking
                          ? booking.Name === name
                            ? "lightgreen"
                            : "lightcoral"
                          : "white"
                      }}
                      onClick={() => handleBooking(day, slot)}
                    >
                      {booking ? booking.Name : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: "10px" }}>
          <button onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}>Előző hét</button>
          <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>Következő hét</button>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}>
        <div>
          <h2>Kérlek add meg a neved</h2>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Név"
          />
          <button onClick={() => {
            if (name.trim()) {
              localStorage.setItem("username", name.trim());
              setIsLoggedIn(true);
            }
          }}>Belépés</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column"
    }}>
      <h2>Heti foglalások</h2>
      {loading ? <p>Betöltés...</p> : renderCalendar()}
    </div>
  );
}
