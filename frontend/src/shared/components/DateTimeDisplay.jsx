import { useState, useEffect } from 'react';

function DateTimeDisplay() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const day = days[date.getDay()];
    const dayNum = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${day}, ${dayNum} ${month} · ${displayHours}:${displayMinutes} ${ampm}`;
  };

  return (
    <div className="text-gray-700 font-medium whitespace-nowrap">
      {formatDate(dateTime)}
    </div>
  );
}

export default DateTimeDisplay;


